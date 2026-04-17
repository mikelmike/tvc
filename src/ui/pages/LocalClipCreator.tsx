import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  LinearProgress,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  LocalVideoFile,
} from "../../types/shorts";

type ClipResult = {
  id: string;
  startSeconds: number;
  durationSeconds: number;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

const CLIP_DURATIONS = Array.from({ length: 46 }, (_, i) => 5 + i);

const LocalClipCreator: React.FC = () => {
  const [files, setFiles] = useState<LocalVideoFile[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [clipCount, setClipCount] = useState<3 | 4>(4);
  const [clipDuration, setClipDuration] = useState(10);
  const [clipName, setClipName] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [creatingClips, setCreatingClips] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<ClipResult[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [videosSourcePath, setVideosSourcePath] = useState("");

  useEffect(() => {
    loadVideosSourcePath();
    loadFiles();
  }, []);

  const loadVideosSourcePath = async () => {
    try {
      const response = await axios.get("/api/videos-source-path");
      setVideosSourcePath(response.data.path);
    } catch (err) {
      console.error("Failed to load videos source path:", err);
    }
  };

  const loadFiles = async () => {
    setLoadingFiles(true);
    setError(null);

    try {
      const response = await axios.get("/api/uploaded-videos");
      const nextFiles = response.data.files || [];
      setFiles(nextFiles);
      setSelectedFileName(nextFiles[0]?.fileName || "");

      if (nextFiles.length === 0) {
        setError("No videos found in Your Videos folder.");
      }
    } catch (err: any) {
      setFiles([]);
      setSelectedFileName("");
      setError("Failed to load videos from Your Videos folder.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setUploadingFile(true);
    setError(null);
    setClips([]);

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);

      const response = await axios.post("/api/upload-local-video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedVideo = response.data.file as LocalVideoFile;
      setFiles([uploadedVideo]);
      setSelectedFileName(uploadedVideo.fileName);
      setSourceFileName(selectedFile.name);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Failed to upload the video file.",
      );
    } finally {
      event.target.value = "";
      setUploadingFile(false);
    }
  };

  const createClips = async () => {
    setCreatingClips(true);
    setError(null);

    try {
      const response = await axios.post("/api/local-video-clips", {
        folderPath: videosSourcePath,
        fileName: selectedFileName,
        clipCount,
        clipDurationSeconds: clipDuration,
        clipName: clipName || null,
      });

      setSourceFileName(response.data.sourceFileName);
      setClips(response.data.clips || []);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "Failed to create clips from the selected video.",
      );
    } finally {
      setCreatingClips(false);
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ContentCutIcon sx={{ color: "#fff" }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Create Clips
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Turn a local video into evenly-spaced clips
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: "rgba(255, 77, 109, 0.1)",
            border: "1px solid rgba(255, 77, 109, 0.3)",
          }}
        >
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Select Video
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {files.length === 0 ? "No videos available" : `${files.length} video${files.length !== 1 ? "s" : ""} in Your Videos folder`}
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={
              loadingFiles ? (
                <CircularProgress size={14} sx={{ color: "#3b82f6" }} />
              ) : (
                <RefreshIcon />
              )
            }
            onClick={loadFiles}
            disabled={loadingFiles}
            sx={{ color: "text.secondary" }}
          >
            Refresh
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {files.map((file) => (
            <Box
              key={file.path}
              onClick={() => setSelectedFileName(file.fileName)}
              sx={{
                p: 2,
                borderRadius: 2,
                border:
                  selectedFileName === file.fileName
                    ? "2px solid #3b82f6"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                backgroundColor:
                  selectedFileName === file.fileName
                    ? "rgba(0, 212, 255, 0.1)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor:
                    selectedFileName === file.fileName
                      ? "#3b82f6"
                      : "rgba(0, 212, 255, 0.3)",
                },
              }}
            >
              <Box display="flex" justifyContent="space-between">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: selectedFileName === file.fileName ? 600 : 400,
                    color: selectedFileName === file.fileName ? "#3b82f6" : "text.primary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {file.fileName}
                </Typography>
                {selectedFileName === file.fileName && (
                  <CheckCircleIcon sx={{ color: "#3b82f6", fontSize: 18, ml: 1 }} />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {formatFileSize(file.sizeBytes)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Button
          component="label"
          variant="outlined"
          startIcon={
            uploadingFile ? (
              <CircularProgress size={18} sx={{ color: "#3b82f6" }} />
            ) : (
              <UploadFileIcon />
            )
          }
          disabled={uploadingFile || creatingClips}
          fullWidth
          sx={{ mb: 3 }}
        >
          {uploadingFile ? "Uploading..." : "Upload New Video"}
          <input
            hidden
            type="file"
            accept="video/mp4,video/quicktime,video/x-m4v,video/x-matroska,video/webm,video/x-msvideo,.mp4,.mov,.m4v,.mkv,.webm,.avi"
            onChange={uploadFile}
          />
        </Button>
        {uploadingFile && (
          <LinearProgress
            sx={{
              mb: 3,
              borderRadius: 1,
              backgroundColor: "rgba(255, 0, 110, 0.2)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#06b6d4",
              },
            }}
          />
        )}

        <TextField
          fullWidth
          label="Clip Name (optional)"
          value={clipName}
          onChange={(e) => setClipName(e.target.value)}
          placeholder="my-clip"
          helperText="If provided, clips will be named: my-clip1.mp4, my-clip2.mp4, etc."
          sx={{ mb: 3 }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 3,
            mb: 3,
          }}
        >
          <FormControl fullWidth>
            <InputLabel>Number of Clips</InputLabel>
            <Select
              value={clipCount}
              label="Number of Clips"
              onChange={(event) =>
                setClipCount(event.target.value as 3 | 4)
              }
            >
              <MenuItem value={3}>3 clips</MenuItem>
              <MenuItem value={4}>4 clips</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Clip Duration</InputLabel>
            <Select
              value={clipDuration}
              label="Clip Duration"
              onChange={(event) =>
                setClipDuration(event.target.value as number)
              }
            >
              {CLIP_DURATIONS.map((duration) => (
                <MenuItem key={duration} value={duration}>
                  {duration} seconds
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          startIcon={
            creatingClips ? (
              <CircularProgress size={18} sx={{ color: "#0a0a0f" }} />
            ) : (
              <MovieFilterIcon />
            )
          }
          onClick={createClips}
          disabled={creatingClips || selectedFileName.length === 0}
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
          }}
        >
          {creatingClips ? "Creating Clips..." : "Create Clips"}
        </Button>

        {sourceFileName && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 2,
              textAlign: "center",
            }}
          >
            Source: {sourceFileName}
          </Typography>
        )}
      </Paper>

      {creatingClips && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress sx={{ color: "#06b6d4", mb: 2 }} size={40} />
          <Typography sx={{ color: "text.secondary" }}>
            Creating {clipCount} clips from your video...
          </Typography>
        </Box>
      )}

      {clips.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <CheckCircleIcon sx={{ color: "#22c55e", fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Clips Ready
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {clips.length} clips created from {sourceFileName}
              </Typography>
            </Box>
          </Box>
          <List disablePadding>
            {clips.map((clip, index) => (
              <ListItemButton
                key={clip.id}
                component={RouterLink}
                to={`/video/${clip.id}`}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 212, 255, 0.08)",
                    borderColor: "rgba(0, 212, 255, 0.3)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#3b82f6", fontWeight: 600 }}
                  >
                    {index + 1}
                  </Typography>
                </Box>
                <ListItemText
                  primary={clip.fileName}
                  secondary={`Starts at ${clip.startSeconds}s • ${clip.durationSeconds}s duration`}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default LocalClipCreator;
