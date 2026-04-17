import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import TuneIcon from "@mui/icons-material/Tune";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  RenderConfig,
  MusicMoodEnum,
  CaptionPositionEnum,
  VoiceEnum,
  OrientationEnum,
  LocalVideoFile,
} from "../../types/shorts";

interface SceneFormData {
  text: string;
  videoPath: string;
  videoFileName: string;
}

const VideoCreator: React.FC = () => {
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<SceneFormData[]>([
    { text: "", videoPath: "", videoFileName: "" },
  ]);
  const [availableVideos, setAvailableVideos] = useState<LocalVideoFile[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [config, setConfig] = useState<RenderConfig>({
    paddingBack: 1500,
    music: MusicMoodEnum.chill,
    captionPosition: CaptionPositionEnum.bottom,
    captionBackgroundColor: "blue",
    voice: VoiceEnum.af_heart,
    orientation: OrientationEnum.portrait,
    musicVolume: "high" as any,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<VoiceEnum[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [voicesResponse] = await Promise.all([
          axios.get("/api/voices"),
        ]);
        setVoices(voicesResponse.data);
      } catch (err) {
        console.error("Failed to fetch options:", err);
        setError("Failed to load voices and music options.");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoadingVideos(true);
    setError(null);
    try {
      const response = await axios.get("/api/clips-videos");
      setAvailableVideos(response.data.files || []);
    } catch (err: any) {
      console.error("Failed to load videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleAddScene = () => {
    setScenes([...scenes, { text: "", videoPath: "", videoFileName: "" }]);
  };

  const handleRemoveScene = (index: number) => {
    if (scenes.length > 1) {
      const newScenes = [...scenes];
      newScenes.splice(index, 1);
      setScenes(newScenes);
    }
  };

  const handleSceneChange = (
    index: number,
    field: "text" | "videoPath" | "videoFileName",
    value: string
  ) => {
    const newScenes = [...scenes];

    if (field === "videoFileName") {
      const video = availableVideos.find((v) => v.fileName === value);
      if (video) {
        newScenes[index] = {
          ...newScenes[index],
          videoFileName: value,
          videoPath: video.path,
        };
      }
    } else {
      newScenes[index] = { ...newScenes[index], [field]: value };
    }

    setScenes(newScenes);
  };

  const handleConfigChange = (field: keyof RenderConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const invalidScenes = scenes.filter(
      (s) => !s.text.trim() || !s.videoPath.trim()
    );
    if (invalidScenes.length > 0) {
      setError("All scenes must have narration text and a video selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiScenes = scenes.map((scene) => ({
        text: scene.text,
        videoPath: scene.videoPath,
      }));

      const response = await axios.post("/api/short-video", {
        scenes: apiScenes,
        config,
      });

      navigate(`/video/${response.data.videoId}`);
    } catch (err) {
      setError("Failed to create video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedClipsCount = scenes.filter((s) => s.videoPath).length;

  if (loadingOptions) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress sx={{ color: "#3b82f6" }} size={50} />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <VideoCallIcon sx={{ color: "#fff" }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Create New Video
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Merge clips and add narration to create your short video
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          {error}
        </Alert>
      )}

      {availableVideos.length === 0 && !loadingVideos && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          No clips found. Create some clips first in the Clips section.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            1
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Scenes
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            ({scenes.length})
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Button
              size="small"
              startIcon={
                loadingVideos ? (
                  <CircularProgress size={14} sx={{ color: "#3b82f6" }} />
                ) : (
                  <RefreshIcon />
                )
              }
              onClick={loadVideos}
              disabled={loadingVideos}
              sx={{ color: "text.secondary" }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
          {scenes.map((scene, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 4,
                  height: "100%",
                  background:
                    index === 0
                      ? "linear-gradient(180deg, #3b82f6, #2563eb)"
                      : "linear-gradient(180deg, #06b6d4, #0891b2)",
                },
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontSize: 11,
                  }}
                >
                  Scene {index + 1}
                </Typography>
                {scenes.length > 1 && (
                  <IconButton
                    onClick={() => handleRemoveScene(index)}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": {
                        color: "#ef4444",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Clip</InputLabel>
                <Select
                  value={scene.videoFileName}
                  onChange={(e) =>
                    handleSceneChange(index, "videoFileName", e.target.value)
                  }
                  label="Select Clip"
                  disabled={availableVideos.length === 0}
                  startAdornment={
                    scene.videoPath ? (
                      <Box sx={{ mr: 1, color: "#22c55e" }}>
                        <CheckCircleIcon sx={{ fontSize: 18 }} />
                      </Box>
                    ) : null
                  }
                >
                  {availableVideos.length === 0 ? (
                    <MenuItem disabled value="">
                      No clips available
                    </MenuItem>
                  ) : (
                    availableVideos.map((video) => (
                      <MenuItem key={video.path} value={video.fileName}>
                        {video.fileName}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Narration Text"
                multiline
                rows={2}
                value={scene.text}
                onChange={(e) => handleSceneChange(index, "text", e.target.value)}
                required
                placeholder="Enter what you want to say in this scene..."
              />
            </Paper>
          ))}
        </Box>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddScene}
          sx={{ mb: 4 }}
        >
          Add Another Scene
        </Button>

        <Box display="flex" alignItems="center" gap={2} mb={3} mt={5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#06b6d4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            2
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <TuneIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Video Settings
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 3,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Music Mood</InputLabel>
              <Select
                value={config.music}
                onChange={(e) => handleConfigChange("music", e.target.value)}
                label="Music Mood"
              >
                {Object.values(MusicMoodEnum).map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Caption Position</InputLabel>
              <Select
                value={config.captionPosition}
                onChange={(e) =>
                  handleConfigChange("captionPosition", e.target.value)
                }
                label="Caption Position"
              >
                {Object.values(CaptionPositionEnum).map((position) => (
                  <MenuItem key={position} value={position}>
                    {position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Voice</InputLabel>
              <Select
                value={config.voice}
                onChange={(e) => handleConfigChange("voice", e.target.value)}
                label="Voice"
              >
                {Object.values(VoiceEnum).map((voice) => (
                  <MenuItem key={voice} value={voice}>
                    {voice}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Orientation</InputLabel>
              <Select
                value={config.orientation}
                onChange={(e) =>
                  handleConfigChange("orientation", e.target.value)
                }
                label="Orientation"
              >
                {Object.values(OrientationEnum).map((orientation) => (
                  <MenuItem key={orientation} value={orientation}>
                    {orientation}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <Box display="flex" justifyContent="center">
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={
              loading ||
              scenes.some((s) => !s.videoPath || !s.text.trim()) ||
              availableVideos.length === 0
            }
            endIcon={!loading && <ArrowForwardIcon />}
            sx={{
              minWidth: 220,
              py: 1.5,
              fontSize: 16,
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Video"
            )}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default VideoCreator;
