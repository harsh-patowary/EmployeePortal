import React from 'react';
import { Typography, Box, Paper, Grid, useTheme } from '@mui/material';
import UserDetailsComponent from '../components/UserComponent';
import UserRoleDebug from '../components/UserRoleDebug';

function DashboardPage() {
  const theme = useTheme(); // Access theme in your component
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Debug component - remove in production */}
      <UserRoleDebug />
      
      <Typography paragraph>
        Welcome to the Employee Management System dashboard. Use the navigation menu to access different features.
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
            <UserDetailsComponent />
            
          </Paper>
        </Grid>
        {/* More grid items */}
      </Grid>
    </Box>
  );
}

export default DashboardPage;
