import React from 'react';
import { useSelector } from 'react-redux';
// Import selectors from employeeSlice INSTEAD of authSlice
import { selectUser, selectIsManager, selectRole } from '../redux/employeeSlice'; 
import { Box, Typography, Paper, Alert } from '@mui/material';

const UserRoleDebug = () => {
  // Use selectors from employeeSlice
  const user = useSelector(selectUser);
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);
  
  // Only render if user data is available from Redux store
  if (!user) {
      return (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff0f0' }}>
              <Typography variant="h6">User Role Debug</Typography>
              <Alert severity="warning">User data not loaded in employeeSlice.</Alert>
          </Paper>
      );
  }
  
  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
      <Typography variant="h6">User Role Debug (from employeeSlice)</Typography>
      <Alert severity={isManager ? "success" : "info"} sx={{ mb: 1 }}>
        isManager: {String(isManager)} (Role: {userRole})
      </Alert>
      <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: '#eaeaea', overflowX: 'auto', fontSize: '0.75rem' }}>
        {JSON.stringify(user, null, 2)}
      </Box>
    </Paper>
  );
};

export default UserRoleDebug;