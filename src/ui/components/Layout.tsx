import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  CssBaseline,
  Typography,
  Button,
  ThemeProvider,
  createTheme
} from '@mui/material';
import VideoIcon from '@mui/icons-material/VideoLibrary';
import AddIcon from '@mui/icons-material/Add';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';

interface LayoutProps {
  children: React.ReactNode;
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#06b6d4',
      light: '#22d3ee',
      dark: '#0891b2',
    },
    background: {
      default: '#09090b',
      paper: '#111827',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#9ca3af',
    },
    divider: 'rgba(255, 255, 255, 0.06)',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#374151 #09090b',
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: '#09090b',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#374151',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#4b5563',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 20px',
        },
        contained: {
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
          '&:hover': {
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.15)',
          '&:hover': {
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(59, 130, 246, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(59, 130, 246, 0.3)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-thumb': {
            '&:hover, &.Mui-focusVisible': {
              boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)',
            },
          },
        },
      },
    },
  },
});

const NavButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  startIcon?: React.ReactNode;
}> = ({ onClick, isActive, children, startIcon }) => (
  <Button
    onClick={onClick}
    startIcon={startIcon}
    sx={{
      color: isActive ? '#3b82f6' : '#9ca3af',
      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      borderRadius: 8,
      px: 2,
      py: 1,
      '&:hover': {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        color: '#60a5fa',
      },
    }}
  >
    {children}
  </Button>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #09090b 0%, #0f172a 100%)',
        }}
      >
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            px: 3,
            py: 2,
          }}
        >
          <Box
            sx={{
              maxWidth: 1200,
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box
              onClick={() => navigate('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { opacity: 0.85 },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <VideoIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#f9fafb',
                  letterSpacing: '-0.02em',
                }}
              >
                TVC
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <NavButton
                onClick={() => navigate('/')}
                isActive={location.pathname === '/' || location.pathname.startsWith('/video')}
                startIcon={<VideoIcon />}
              >
                Videos
              </NavButton>
              <NavButton
                onClick={() => navigate('/create')}
                isActive={isActive('/create') && !location.pathname.includes('clips')}
                startIcon={<AddIcon />}
              >
                Create
              </NavButton>
              <NavButton
                onClick={() => navigate('/create-clips')}
                isActive={isActive('/create-clips')}
                startIcon={<MovieFilterIcon />}
              >
                Clips
              </NavButton>
            </Box>
          </Box>
        </Box>

        <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
          {children}
        </Container>

        <Box
          component="footer"
          sx={{
            py: 3,
            mt: 'auto',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', letterSpacing: 1 }}
          >
            TVC &copy; {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
