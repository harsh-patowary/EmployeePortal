import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppLayout from './layout/AppLayout';
import LoginPage from './pages/LoginPage'; // Make sure the filename matches
import DashboardPage from './pages/DashboardPage';
import { useSelector } from 'react-redux';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Primary color
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#f50057', // Secondary color
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5', // Page background color
      paper: '#ffffff', // Paper/card background color
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none', // Prevents automatic uppercase in buttons
    },
  },
  shape: {
    borderRadius: 8, // Global border radius
  },
  components: {
    // Customize individual components
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // Remove button shadows
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  const isAuthenticated = useSelector(state => state.auth.token);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalizes styles across browsers */}
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />

          {/* Protected Routes */}
          {isAuthenticated ? (
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* <Route path="/employees" element={<EmployeeDashboard />} /> */}
            </Route>
          ) : (
            <Route path="*" element={<LoginPage />} />
          )}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
