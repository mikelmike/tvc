import express from "express";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import fs from "fs-extra";
import path from "path";
import multer from "multer";

import {
  validateCreateShortInput,
  validateLocalVideoClipInput,
} from "../validator";
import { ShortCreator } from "../../short-creator/ShortCreator";
import { logger } from "../../logger";
import { Config } from "../../config";

// todo abstract class
export class APIRouter {
  public router: express.Router;
  private shortCreator: ShortCreator;
  private config: Config;

  constructor(config: Config, shortCreator: ShortCreator) {
    this.config = config;
    this.router = express.Router();
    this.shortCreator = shortCreator;

    this.router.use(express.json());

    this.setupRoutes();
  }

  private setupRoutes() {
    const videosSourceDirPath = this.config.videosSourceDirPath;
    const upload = multer({
      storage: multer.diskStorage({
        destination: (_req, _file, callback) => {
          callback(null, videosSourceDirPath);
        },
        filename: (_req, file, callback) => {
          const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
          callback(null, `${Date.now()}-${sanitizedName}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const supportedExtensions = new Set([
          ".mp4",
          ".mov",
          ".m4v",
          ".mkv",
          ".webm",
          ".avi",
        ]);

        if (supportedExtensions.has(extension)) {
          callback(null, true);
          return;
        }

        callback(new Error("Unsupported video file type"));
      },
      limits: {
        fileSize: 1024 * 1024 * 1024,
      },
    });

    this.router.post(
      "/short-video",
      async (req: ExpressRequest, res: ExpressResponse) => {
        try {
          const input = validateCreateShortInput(req.body);

          logger.info({ input }, "Creating short video");

          const videoId = this.shortCreator.addToQueue(
            input.scenes,
            input.config,
          );

          res.status(201).json({
            videoId,
          });
        } catch (error: unknown) {
          logger.error(error, "Error validating input");

          // Handle validation errors specifically
          if (error instanceof Error && error.message.startsWith("{")) {
            try {
              const errorData = JSON.parse(error.message);
              res.status(400).json({
                error: "Validation failed",
                message: errorData.message,
                missingFields: errorData.missingFields,
              });
              return;
            } catch (parseError: unknown) {
              logger.error(parseError, "Error parsing validation error");
            }
          }

          // Fallback for other errors
          res.status(400).json({
            error: "Invalid input",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    );

    this.router.get(
      "/local-video-files",
      (req: ExpressRequest, res: ExpressResponse) => {
        const folderPath = req.query.folderPath;

        if (typeof folderPath !== "string" || folderPath.trim().length === 0) {
          res.status(400).json({
            error: "folderPath is required",
          });
          return;
        }

        try {
          const files = this.shortCreator.listLocalVideoFiles(folderPath.trim());
          res.status(200).json({ files });
        } catch (error: unknown) {
          logger.error(error, "Error listing local video files");
          res.status(400).json({
            error: "Unable to list local video files",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    );

    this.router.post(
      "/upload-local-video",
      upload.single("video"),
      (req: ExpressRequest, res: ExpressResponse) => {
        const uploadedFile = req.file;

        if (!uploadedFile) {
          res.status(400).json({
            error: "video file is required",
          });
          return;
        }

        res.status(201).json({
          file: {
            fileName: uploadedFile.filename,
            path: uploadedFile.path,
            sizeBytes: uploadedFile.size,
          },
          folderPath: videosSourceDirPath,
        });
      },
    );

    this.router.post(
      "/local-video-clips",
      async (req: ExpressRequest, res: ExpressResponse) => {
        try {
          const input = validateLocalVideoClipInput(req.body);
          const result = await this.shortCreator.createLocalVideoClips(
            input.folderPath,
            input.fileName,
            input.clipCount,
            input.clipDurationSeconds,
            input.clipName,
          );

          res.status(201).json(result);
        } catch (error: unknown) {
          logger.error(error, "Error creating local video clips");

          if (error instanceof Error && error.message.startsWith("{")) {
            try {
              const errorData = JSON.parse(error.message);
              res.status(400).json({
                error: "Validation failed",
                message: errorData.message,
                missingFields: errorData.missingFields,
              });
              return;
            } catch (parseError: unknown) {
              logger.error(parseError, "Error parsing validation error");
            }
          }

          res.status(400).json({
            error: "Unable to create clips",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    );

    this.router.get(
      "/short-video/:videoId/status",
      async (req: ExpressRequest, res: ExpressResponse) => {
        const { videoId } = req.params;
        if (!videoId) {
          res.status(400).json({
            error: "videoId is required",
          });
          return;
        }
        const status = this.shortCreator.status(videoId);
        res.status(200).json({
          status,
        });
      },
    );

    this.router.get(
      "/music-tags",
      (req: ExpressRequest, res: ExpressResponse) => {
        res.status(200).json(this.shortCreator.ListAvailableMusicTags());
      },
    );

    this.router.get("/voices", (req: ExpressRequest, res: ExpressResponse) => {
      res.status(200).json(this.shortCreator.ListAvailableVoices());
    });

    this.router.get("/videos-source-path", (req: ExpressRequest, res: ExpressResponse) => {
      res.status(200).json({ path: this.config.videosSourceDirPath });
    });

    this.router.get("/clips-path", (req: ExpressRequest, res: ExpressResponse) => {
      res.status(200).json({ path: this.config.clipsDirPath });
    });

    this.router.get("/uploaded-videos", (req: ExpressRequest, res: ExpressResponse) => {
      try {
        const files = this.shortCreator.listLocalVideoFiles(this.config.videosSourceDirPath);
        res.status(200).json({ files });
      } catch (error: unknown) {
        res.status(400).json({
          error: "Unable to list videos",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    this.router.get("/clips-videos", (req: ExpressRequest, res: ExpressResponse) => {
      try {
        const files = this.shortCreator.listLocalVideoFiles(this.config.clipsDirPath);
        res.status(200).json({ files });
      } catch (error: unknown) {
        res.status(400).json({
          error: "Unable to list clips",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    this.router.get(
      "/short-videos",
      (req: ExpressRequest, res: ExpressResponse) => {
        const videos = this.shortCreator.listAllVideos();
        res.status(200).json({
          videos,
        });
      },
    );

    this.router.delete(
      "/short-video/:videoId",
      (req: ExpressRequest, res: ExpressResponse) => {
        const { videoId } = req.params;
        if (!videoId) {
          res.status(400).json({
            error: "videoId is required",
          });
          return;
        }
        this.shortCreator.deleteVideo(videoId);
        res.status(200).json({
          success: true,
        });
      },
    );

    this.router.get(
      "/tmp/:tmpFile",
      (req: ExpressRequest, res: ExpressResponse) => {
        const { tmpFile } = req.params;
        if (!tmpFile) {
          res.status(400).json({
            error: "tmpFile is required",
          });
          return;
        }
        const tmpFilePath = path.join(this.config.tempDirPath, tmpFile);
        if (!fs.existsSync(tmpFilePath)) {
          res.status(404).json({
            error: "tmpFile not found",
          });
          return;
        }

        if (tmpFile.endsWith(".mp3")) {
          res.setHeader("Content-Type", "audio/mpeg");
        }
        if (tmpFile.endsWith(".wav")) {
          res.setHeader("Content-Type", "audio/wav");
        }
        if (tmpFile.endsWith(".mp4")) {
          res.setHeader("Content-Type", "video/mp4");
        }

        const tmpFileStream = fs.createReadStream(tmpFilePath);
        tmpFileStream.on("error", (error) => {
          logger.error(error, "Error reading tmp file");
          res.status(500).json({
            error: "Error reading tmp file",
            tmpFile,
          });
        });
        tmpFileStream.pipe(res);
      },
    );

    this.router.get(
      "/music/:fileName",
      (req: ExpressRequest, res: ExpressResponse) => {
        const { fileName } = req.params;
        if (!fileName) {
          res.status(400).json({
            error: "fileName is required",
          });
          return;
        }
        const musicFilePath = path.join(this.config.musicDirPath, fileName);
        if (!fs.existsSync(musicFilePath)) {
          res.status(404).json({
            error: "music file not found",
          });
          return;
        }
        const musicFileStream = fs.createReadStream(musicFilePath);
        musicFileStream.on("error", (error) => {
          logger.error(error, "Error reading music file");
          res.status(500).json({
            error: "Error reading music file",
            fileName,
          });
        });
        musicFileStream.pipe(res);
      },
    );

    this.router.get(
      "/short-video/:videoId",
      (req: ExpressRequest, res: ExpressResponse) => {
        try {
          const { videoId } = req.params;
          if (!videoId) {
            res.status(400).json({
              error: "videoId is required",
            });
            return;
          }
          const video = this.shortCreator.getVideo(videoId);
          res.setHeader("Content-Type", "video/mp4");
          res.setHeader(
            "Content-Disposition",
            `inline; filename=${videoId}.mp4`,
          );
          res.send(video);
        } catch (error: unknown) {
          logger.error(error, "Error getting video");
          res.status(404).json({
            error: "Video not found",
          });
        }
      },
    );
  }
}
