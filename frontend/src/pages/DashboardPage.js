import React from 'react';
import { Typography, Box, Paper, Grid, useTheme } from '@mui/material';
// import other components as needed

function DashboardPage() {
  const theme = useTheme(); // Access theme in your component
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            sx={{ 
              p: 3, 
              height: 200,
              backgroundColor: theme.palette.mode === 'dark' 
                ? theme.palette.background.paper 
                : theme.palette.primary.light,
              color: theme.palette.mode === 'dark' 
                ? theme.palette.text.primary 
                : theme.palette.primary.contrastText
            }}
          >
            <Typography variant="h6">
              Statistics
            </Typography>
            {/* Dashboard content */}
          </Paper>
        </Grid>
        {/* More grid items */}
      </Grid>
    </Box>
  );
}

export default DashboardPage;
