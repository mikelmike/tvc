import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { VideoStatus } from '../../types/shorts';

const statusConfig: Record<
  string,
  { color: string; bg: string; icon: string }
> = {
  ready: { color: '#22c55e', bg: 'rgba(0, 255, 136, 0.1)', icon: '🎉' },
  processing: { color: '#3b82f6', bg: 'rgba(0, 212, 255, 0.1)', icon: '⚡' },
  failed: { color: '#ef4444', bg: 'rgba(255, 77, 109, 0.1)', icon: '❌' },
};

const VideoDetails: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoStatus>('processing');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const checkVideoStatus = async () => {
    try {
      const response = await axios.get(`/api/short-video/${videoId}/status`);
      const videoStatus = response.data.status;

      if (isMounted.current) {
        setStatus(videoStatus || 'unknown');

        if (videoStatus !== 'processing') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        setLoading(false);
      }
    } catch (error) {
      if (isMounted.current) {
        setError('Failed to fetch video status');
        setStatus('failed');
        setLoading(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  };

  useEffect(() => {
    checkVideoStatus();

    intervalRef.current = setInterval(() => {
      checkVideoStatus();
    }, 5000);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [videoId]);

  const handleBack = () => {
    navigate('/');
  };

  const handleRetry = () => {
    navigate('/create');
  };

  const currentConfig = statusConfig[status] || statusConfig.processing;

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="40vh"
          gap={3}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: '3px solid rgba(0, 212, 255, 0.2)',
              borderTopColor: '#3b82f6',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <Typography variant="h6" sx={{ color: '#3b82f6' }}>
            Processing your video...
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 300 }}
          >
            This usually takes 1-3 minutes. You can leave this page and come
            back later.
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert
          severity="error"
          sx={{
            backgroundColor: 'rgba(255, 77, 109, 0.1)',
            border: '1px solid rgba(255, 77, 109, 0.3)',
          }}
        >
          {error}
        </Alert>
      );
    }

    if (status === 'processing') {
      return (
        <Box textAlign="center" py={4}>
          <CircularProgress size={60} sx={{ color: '#3b82f6', mb: 2 }} />
          <Typography variant="h6">Your video is being created...</Typography>
          <Typography variant="body1" color="text.secondary">
            This may take a few minutes. Please wait.
          </Typography>
        </Box>
      );
    }

    if (status === 'ready') {
      return (
        <Box>
          <Box
            mb={4}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(90deg, #22c55e 0%, #3b82f6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Your video is ready!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Your short video has been created successfully
            </Typography>
          </Box>

          <Box
            sx={{
              position: 'relative',
              borderRadius: 3,
              overflow: 'hidden',
              mb: 4,
              backgroundColor: '#000',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                paddingTop: '56.25%',
              }}
            >
              <video
                controls
                autoPlay
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
                src={`/api/short-video/${videoId}`}
              />
            </Box>
          </Box>

          <Box
            display="flex"
            gap={2}
            justifyContent="center"
            flexWrap="wrap"
          >
            <Button
              component="a"
              href={`/api/short-video/${videoId}`}
              download
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                px: 4,
                py: 1.5,
              }}
            >
              Download Video
            </Button>
            <Button
              variant="outlined"
              startIcon={<PlayCircleIcon />}
              onClick={() => navigate('/')}
              sx={{ px: 4, py: 1.5 }}
            >
              View All Videos
            </Button>
          </Box>
        </Box>
      );
    }

    if (status === 'failed') {
      return (
        <Box textAlign="center" py={4}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 77, 109, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              fontSize: 36,
            }}
          >
            😔
          </Box>
          <Typography variant="h6" sx={{ mb: 1, color: '#ef4444' }}>
            Video processing failed
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mb: 3, maxWidth: 400, mx: 'auto' }}
          >
            Something went wrong while creating your video. This could be due to
            search terms not finding enough results or a temporary issue.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ReplayIcon />}
            onClick={handleRetry}
            sx={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return (
      <Alert
        severity="info"
        sx={{
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
        }}
      >
        Unknown video status. Please try refreshing the page.
      </Alert>
    );
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{
          mb: 3,
          color: 'text.secondary',
          '&:hover': {
            color: 'text.primary',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        }}
      >
        Back to videos
      </Button>

      <Paper
        sx={{
          p: 4,
          background: 'linear-gradient(180deg, #12121a 0%, #0d0d14 100%)',
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          mb={4}
          pb={3}
          borderBottom="1px solid rgba(255, 255, 255, 0.06)"
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: currentConfig.color,
              boxShadow: `0 0 12px ${currentConfig.color}`,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: currentConfig.color,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            {status}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontFamily: 'monospace',
              ml: 'auto',
            }}
          >
            {videoId?.substring(0, 20)}...
          </Typography>
        </Box>

        {renderContent()}
      </Paper>
    </Box>
  );
};

export default VideoDetails; 