import React from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectIsManager } from '../redux/authSlice';
import { Box, Typography, Paper, Alert } from '@mui/material';

const UserRoleDebug = () => {
  const user = useSelector(selectUser);
  const isManager = useSelector(selectIsManager);
  
  // Only render if user data is available from Redux store
  if (!user) return null;
  
  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
      <Typography variant="h6">User Role Debug</Typography>
      <Alert severity={isManager ? "success" : "info"} sx={{ mb: 1 }}>
        isManager: {String(isManager)}
      </Alert>
      <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: '#eaeaea', overflowX: 'auto', fontSize: '0.75rem' }}>
        {JSON.stringify(user, null, 2)}
      </Box>
    </Paper>
  );
};

export default UserRoleDebug;