import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create a context for theme mode
export const ColorModeContext = createContext({ 
  toggleColorMode: () => {},
  mode: 'light'
});

export function ThemeProviderWrapper({ children }) {
  // Check if there's a saved preference in localStorage
  const storedMode = localStorage.getItem('themeMode');
  const [mode, setMode] = useState(storedMode || 'light');
  
  // Update localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light' 
            ? {
                // Light mode palette
                primary: {
                  main: '#1976d2',
                  light: '#42a5f5',
                  dark: '#1565c0',
                },
                secondary: {
                  main: '#2e7d32',
                  light: '#4caf50',
                  dark: '#1b5e20',
                },
                background: {
                  default: '#f5f7fa',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#333333',
                  secondary: '#666666',
                },
              }
            : {
                // Dark mode palette
                primary: {
                  main: '#C5FF00',
                  light: '#e3f2fd',
                  dark: '#78FF00',
                },
                progress:{
                  main: '#3A00FF',
                  light: '#006cff',
                  dark: '#3A00FF',
                },
                secondary: {
                  main: '#66bb6a',
                  light: '#e8f5e9',
                  dark: '#43a047',
                },
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#b0bec5',
                },
              }),
        },
        typography: {
          fontFamily: [
            'Roboto',
            'Arial',
            'sans-serif',
          ].join(','),
          button: {
            textTransform: 'none',
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                boxShadow: 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          // Add other component customizations
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
export default ThemeProviderWrapper;