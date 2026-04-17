import { OrientationEnum } from "./../types/shorts";
/* eslint-disable @remotion/deterministic-randomness */
import fs from "fs-extra";
import cuid from "cuid";
import path from "path";
import https from "https";
import http from "http";

import { Kokoro } from "./libraries/Kokoro";
import { Remotion } from "./libraries/Remotion";
import { Whisper } from "./libraries/Whisper";
import { FFMpeg } from "./libraries/FFmpeg";
import { PexelsAPI } from "./libraries/Pexels";
import { Config } from "../config";
import { logger } from "../logger";
import { MusicManager } from "./music";
import type {
  SceneInput,
  RenderConfig,
  Scene,
  VideoStatus,
  MusicMoodEnum,
  MusicTag,
  MusicForVideo,
  LocalVideoClip,
  LocalVideoFile,
} from "../types/shorts";

const SUPPORTED_LOCAL_VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".m4v",
  ".mkv",
  ".webm",
  ".avi",
]);

export class ShortCreator {
  private queue: {
    sceneInput: SceneInput[];
    config: RenderConfig;
    id: string;
  }[] = [];
  constructor(
    private config: Config,
    private remotion: Remotion,
    private kokoro: Kokoro,
    private whisper: Whisper,
    private ffmpeg: FFMpeg,
    private pexelsApi: PexelsAPI,
    private musicManager: MusicManager,
  ) {}

  public status(id: string): VideoStatus {
    const videoPath = this.getVideoPath(id);
    if (this.queue.find((item) => item.id === id)) {
      return "processing";
    }
    if (fs.existsSync(videoPath)) {
      return "ready";
    }
    return "failed";
  }

  public addToQueue(sceneInput: SceneInput[], config: RenderConfig): string {
    // todo add mutex lock
    const id = cuid();
    this.queue.push({
      sceneInput,
      config,
      id,
    });
    if (this.queue.length === 1) {
      this.processQueue();
    }
    return id;
  }

  private async processQueue(): Promise<void> {
    // todo add a semaphore
    if (this.queue.length === 0) {
      return;
    }
    const { sceneInput, config, id } = this.queue[0];
    logger.debug(
      { sceneInput, config, id },
      "Processing video item in the queue",
    );
    try {
      await this.createShort(id, sceneInput, config);
      logger.debug({ id }, "Video created successfully");
    } catch (error: unknown) {
      logger.error(error, "Error creating video");
    } finally {
      this.queue.shift();
      this.processQueue();
    }
  }

  private async createShort(
    videoId: string,
    inputScenes: SceneInput[],
    config: RenderConfig,
  ): Promise<string> {
    logger.debug(
      {
        inputScenes,
        config,
      },
      "Creating short video",
    );
    const scenes: Scene[] = [];
    let totalDuration = 0;
    const tempFiles = [];

    const orientation: OrientationEnum =
      config.orientation || OrientationEnum.portrait;

    let index = 0;
    for (const scene of inputScenes) {
      const audio = await this.kokoro.generate(
        scene.text,
        config.voice ?? "af_heart",
      );
      let { audioLength } = audio;
      const { audio: audioStream } = audio;

      if (index + 1 === inputScenes.length && config.paddingBack) {
        audioLength += config.paddingBack / 1000;
      }

      const tempId = cuid();
      const tempWavFileName = `${tempId}.wav`;
      const tempMp3FileName = `${tempId}.mp3`;
      const tempVideoFileName = `${tempId}.mp4`;
      const tempWavPath = path.join(this.config.tempDirPath, tempWavFileName);
      const tempMp3Path = path.join(this.config.tempDirPath, tempMp3FileName);
      const tempVideoPath = path.join(
        this.config.tempDirPath,
        tempVideoFileName,
      );
      tempFiles.push(tempVideoPath);
      tempFiles.push(tempWavPath, tempMp3Path);

      await this.ffmpeg.saveNormalizedAudio(audioStream, tempWavPath);
      const captions = await this.whisper.CreateCaption(tempWavPath);

      await this.ffmpeg.saveToMp3(audioStream, tempMp3Path);

      const videoDuration = await this.ffmpeg.getVideoDuration(scene.videoPath);
      const trimDuration = Math.min(audioLength, videoDuration);

      await this.ffmpeg.extractClip(
        scene.videoPath,
        tempVideoPath,
        0,
        trimDuration,
      );

      scenes.push({
        captions,
        video: `http://localhost:${this.config.port}/api/tmp/${tempVideoFileName}`,
        audio: {
          url: `http://localhost:${this.config.port}/api/tmp/${tempMp3FileName}`,
          duration: trimDuration,
        },
      });

      totalDuration += trimDuration;
      index++;
    }
    if (config.paddingBack) {
      totalDuration += config.paddingBack / 1000;
    }

    const selectedMusic = this.findMusic(totalDuration, config.music);
    logger.debug({ selectedMusic }, "Selected music for the video");

    await this.remotion.render(
      {
        music: selectedMusic,
        scenes,
        config: {
          durationMs: totalDuration * 1000,
          paddingBack: config.paddingBack,
          ...{
            captionBackgroundColor: config.captionBackgroundColor,
            captionPosition: config.captionPosition,
          },
          musicVolume: config.musicVolume,
        },
      },
      videoId,
      orientation,
    );

    for (const file of tempFiles) {
      fs.removeSync(file);
    }

    return videoId;
  }

  public getVideoPath(videoId: string): string {
    return path.join(this.config.videosDirPath, `${videoId}.mp4`);
  }

  public getClipPath(clipId: string): string {
    return path.join(this.config.clipsDirPath, `${clipId}.mp4`);
  }

  public deleteVideo(videoId: string): void {
    const videoPath = this.getVideoPath(videoId);
    fs.removeSync(videoPath);
    logger.debug({ videoId }, "Deleted video file");
  }

  public getVideo(videoId: string): Buffer {
    const videoPath = this.getVideoPath(videoId);
    if (fs.existsSync(videoPath)) {
      return fs.readFileSync(videoPath);
    }
    const clipPath = this.getClipPath(videoId);
    if (fs.existsSync(clipPath)) {
      return fs.readFileSync(clipPath);
    }
    throw new Error(`Video ${videoId} not found`);
  }

  private findMusic(videoDuration: number, tag?: MusicMoodEnum): MusicForVideo {
    const musicFiles = this.musicManager.musicList().filter((music) => {
      if (tag) {
        return music.mood === tag;
      }
      return true;
    });
    return musicFiles[Math.floor(Math.random() * musicFiles.length)];
  }

  public ListAvailableMusicTags(): MusicTag[] {
    const tags = new Set<MusicTag>();
    this.musicManager.musicList().forEach((music) => {
      tags.add(music.mood as MusicTag);
    });
    return Array.from(tags.values());
  }

  public listAllVideos(): { id: string; status: VideoStatus }[] {
    const videos: { id: string; status: VideoStatus }[] = [];

    // Check if videos directory exists
    if (!fs.existsSync(this.config.videosDirPath)) {
      return videos;
    }

    // Read all files in the videos directory
    const files = fs.readdirSync(this.config.videosDirPath);

    // Filter for MP4 files and extract video IDs
    for (const file of files) {
      if (file.endsWith(".mp4")) {
        const videoId = file.replace(".mp4", "");

        let status: VideoStatus = "ready";
        const inQueue = this.queue.find((item) => item.id === videoId);
        if (inQueue) {
          status = "processing";
        }

        videos.push({ id: videoId, status });
      }
    }

    // Add videos that are in the queue but not yet rendered
    for (const queueItem of this.queue) {
      const existingVideo = videos.find((v) => v.id === queueItem.id);
      if (!existingVideo) {
        videos.push({ id: queueItem.id, status: "processing" });
      }
    }

    return videos;
  }

  public ListAvailableVoices(): string[] {
    return this.kokoro.listAvailableVoices();
  }

  public listLocalVideoFiles(folderPath: string): LocalVideoFile[] {
    if (!fs.existsSync(folderPath)) {
      throw new Error("Folder does not exist");
    }

    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      throw new Error("The provided path is not a folder");
    }

    return fs
      .readdirSync(folderPath)
      .sort((left, right) => left.localeCompare(right))
      .map((fileName) => {
        const filePath = path.join(folderPath, fileName);
        return {
          fileName,
          filePath,
          stats: fs.statSync(filePath),
        };
      })
      .filter(({ fileName, stats }) => {
        return (
          stats.isFile() &&
          SUPPORTED_LOCAL_VIDEO_EXTENSIONS.has(path.extname(fileName).toLowerCase())
        );
      })
      .map(({ fileName, filePath, stats }) => ({
        fileName,
        path: filePath,
        sizeBytes: stats.size,
      }));
  }

  public async createLocalVideoClips(
    folderPath: string,
    fileName: string,
    clipCount: number,
    clipDurationSeconds: number,
    clipName?: string | null,
  ): Promise<{
    sourceFileName: string;
    durationSeconds: number;
    clips: LocalVideoClip[];
  }> {
    const files = this.listLocalVideoFiles(folderPath);
    const sourceFile = files.find((file) => file.fileName === fileName);

    if (!sourceFile) {
      throw new Error("Video file not found in the selected folder");
    }

    const durationSeconds = await this.ffmpeg.getVideoDuration(sourceFile.path);
    if (durationSeconds < clipDurationSeconds) {
      throw new Error(
        `Video is shorter than ${clipDurationSeconds} seconds and cannot be clipped`,
      );
    }

    const maxStartSeconds = Math.max(durationSeconds - clipDurationSeconds, 0);
    const step = clipCount === 1 ? 0 : maxStartSeconds / (clipCount - 1);
    const clips: LocalVideoClip[] = [];

    for (let index = 0; index < clipCount; index++) {
      const clipId = cuid();
      const clipFileName = clipName ? `${clipName}${index + 1}.mp4` : `${clipId}.mp4`;
      const outputPath = path.join(this.config.clipsDirPath, clipFileName);
      const rawStartSeconds = step * index;
      const startSeconds = Number(
        Math.min(rawStartSeconds, maxStartSeconds).toFixed(2),
      );

      await this.ffmpeg.extractClip(
        sourceFile.path,
        outputPath,
        startSeconds,
        clipDurationSeconds,
      );

      clips.push({
        id: clipId,
        fileName: clipFileName,
        startSeconds,
        durationSeconds: clipDurationSeconds,
      });
    }

    return {
      sourceFileName: sourceFile.fileName,
      durationSeconds,
      clips,
    };
  }
}
