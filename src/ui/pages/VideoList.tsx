import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface VideoItem {
  id: string;
  status: string;
}

const statusColors: Record<string, string> = {
  ready: '#22c55e',
  processing: '#3b82f6',
  failed: '#ef4444',
};

const VideoList: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/short-videos');
      setVideos(response.data.videos || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch videos');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDeleteVideo = async (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    try {
      await axios.delete(`/api/short-video/${id}`);
      fetchVideos();
    } catch (err) {
      setError('Failed to delete video');
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            sx={{ color: '#3b82f6', mb: 2 }}
            size={50}
          />
          <Typography sx={{ color: 'text.secondary' }}>
            Loading your videos...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, mb: 0.5 }}
          >
            Your Videos
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {videos.length === 0
              ? 'No videos yet'
              : `${videos.length} video${videos.length === 1 ? '' : 's'}`}
          </Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create')}
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            }}
          >
            Create Video
          </Button>
          <Button
            variant="outlined"
            startIcon={<MovieFilterIcon />}
            onClick={() => navigate('/create-clips')}
          >
            Create Clips
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: 'rgba(255, 77, 109, 0.1)',
            border: '1px solid rgba(255, 77, 109, 0.3)',
          }}
        >
          {error}
        </Alert>
      )}

      {videos.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'linear-gradient(180deg, #12121a 0%, #0d0d14 100%)',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 3,
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <VideoLibraryIcon sx={{ fontSize: 40, color: '#3b82f6' }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            No videos yet
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mb: 3, maxWidth: 400, mx: 'auto' }}
          >
            Create stunning short videos with AI-powered background search and
            voice narration.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => navigate('/create')}
            >
              Create Your First Video
            </Button>
            <Button
              variant="outlined"
              startIcon={<MovieFilterIcon />}
              onClick={() => navigate('/create-clips')}
            >
              Or make clips from a local video
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {videos.map((video) => {
            const videoId = video?.id || '';
            const videoStatus = video?.status || 'unknown';
            const statusColor = statusColors[videoStatus] || '#a0a0b0';

            return (
              <Paper
                key={videoId}
                onClick={() => navigate(`/video/${videoId}`)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    '& .play-overlay': {
                      opacity: 1,
                    },
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background:
                      videoStatus === 'ready'
                        ? 'linear-gradient(90deg, #3b82f6, #22c55e)'
                        : videoStatus === 'processing'
                          ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                          : 'linear-gradient(90deg, #ef4444, #06b6d4)',
                  },
                }}
              >
                <Box
                  className="play-overlay"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 32, color: '#0a0a0f' }} />
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '100%',
                    height: 120,
                    borderRadius: 2,
                    backgroundColor: '#1a1a24',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VideoLibraryIcon sx={{ fontSize: 48, color: '#333' }} />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', color: 'text.secondary', mb: 0.5 }}
                    >
                      {videoId.substring(0, 12)}...
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: statusColor,
                          boxShadow: `0 0 8px ${statusColor}`,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: statusColor, textTransform: 'capitalize' }}
                      >
                        {videoStatus}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={(e) => handleDeleteVideo(videoId, e)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: '#ef4444',
                        backgroundColor: 'rgba(255, 77, 109, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default VideoList; 
