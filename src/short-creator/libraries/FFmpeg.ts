import ffmpeg from "fluent-ffmpeg";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { logger } from "../../logger";

let ffmpegBinaryPath = "";

export class FFMpeg {
  static async init(): Promise<FFMpeg> {
    return import("@ffmpeg-installer/ffmpeg").then((ffmpegInstaller) => {
      ffmpeg.setFfmpegPath(ffmpegInstaller.path);
      ffmpegBinaryPath = ffmpegInstaller.path;
      logger.info("FFmpeg path set to:", ffmpegInstaller.path);
      return new FFMpeg();
    });
  }

  async saveNormalizedAudio(
    audio: ArrayBuffer,
    outputPath: string,
  ): Promise<string> {
    logger.debug("Normalizing audio for Whisper");
    const inputStream = new Readable();
    inputStream.push(Buffer.from(audio));
    inputStream.push(null);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputStream)
        .audioCodec("pcm_s16le")
        .audioChannels(1)
        .audioFrequency(16000)
        .toFormat("wav")
        .on("end", () => {
          logger.debug("Audio normalization complete");
          resolve(outputPath);
        })
        .on("error", (error: unknown) => {
          logger.error(error, "Error normalizing audio:");
          reject(error);
        })
        .save(outputPath);
    });
  }

  async createMp3DataUri(audio: ArrayBuffer): Promise<string> {
    const inputStream = new Readable();
    inputStream.push(Buffer.from(audio));
    inputStream.push(null);
    return new Promise((resolve, reject) => {
      const chunk: Buffer[] = [];

      ffmpeg()
        .input(inputStream)
        .audioCodec("libmp3lame")
        .audioBitrate(128)
        .audioChannels(2)
        .toFormat("mp3")
        .on("error", (err) => {
          reject(err);
        })
        .pipe()
        .on("data", (data: Buffer) => {
          chunk.push(data);
        })
        .on("end", () => {
          const buffer = Buffer.concat(chunk);
          resolve(`data:audio/mp3;base64,${buffer.toString("base64")}`);
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  }

  async saveToMp3(audio: ArrayBuffer, filePath: string): Promise<string> {
    const inputStream = new Readable();
    inputStream.push(Buffer.from(audio));
    inputStream.push(null);
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputStream)
        .audioCodec("libmp3lame")
        .audioBitrate(128)
        .audioChannels(2)
        .toFormat("mp3")
        .save(filePath)
        .on("end", () => {
          logger.debug("Audio conversion complete");
          resolve(filePath);
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  }

  async getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const process = spawn(ffmpegBinaryPath, ["-i", filePath], {
        windowsHide: true,
      });
      let stderr = "";

      process.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      process.on("error", (error) => {
        logger.error(error, "Error reading video metadata");
        reject(error);
      });

      process.on("close", () => {
        const match = stderr.match(/Duration:\s(\d+):(\d+):(\d+(?:\.\d+)?)/);
        if (!match) {
          reject(new Error("Unable to determine video duration"));
          return;
        }

        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        const seconds = Number(match[3]);

        resolve(hours * 3600 + minutes * 60 + seconds);
      });
    });
  }

  async extractClip(
    inputPath: string,
    outputPath: string,
    startSeconds: number,
    durationSeconds: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startSeconds)
        .duration(durationSeconds)
        .outputOptions(["-movflags +faststart"])
        .videoCodec("libx264")
        .audioCodec("aac")
        .on("end", () => {
          logger.debug({ outputPath, startSeconds, durationSeconds }, "Clip created");
          resolve(outputPath);
        })
        .on("error", (error: unknown) => {
          logger.error(error, "Error creating clip");
          reject(error);
        })
        .save(outputPath);
    });
  }
}
