import React, { useState } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import attendanceService from '../services/attendanceService';

function CheckInOutCard({ employeeId, todayRecord, onAttendanceRecorded }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const currentTime = new Date();
  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await attendanceService.checkIn(employeeId);
      setSuccess('Check-in recorded successfully');
      setLoading(false);
      
      // Notify parent component to refresh data
      if (onAttendanceRecorded) {
        onAttendanceRecorded();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to record check-in');
      setLoading(false);
      console.error('Check-in error:', err);
    }
  };
  
  const handleCheckOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await attendanceService.checkOut(employeeId);
      setSuccess('Check-out recorded successfully');
      setLoading(false);
      
      // Notify parent component to refresh data
      if (onAttendanceRecorded) {
        onAttendanceRecorded();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to record check-out');
      setLoading(false);
      console.error('Check-out error:', err);
    }
  };
  
  // Check if user has already checked in or out today
  const hasCheckedIn = Boolean(todayRecord?.check_in);
  const hasCheckedOut = Boolean(todayRecord?.check_out);
  
  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: theme.shape.borderRadius,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Daily Attendance
      </Typography>
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
          mb: 2
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={100}
            thickness={4}
            sx={{ color: theme.palette.primary.main }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <AccessTimeIcon color="primary" sx={{ mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary" component="div">
                Current Time
              </Typography>
              <Typography variant="h6" component="div">
                {formattedTime}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<LoginIcon />}
          onClick={handleCheckIn}
          disabled={loading || hasCheckedIn}
          fullWidth
        >
          {loading ? 'Processing...' : 'Check In'}
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<LogoutIcon />}
          onClick={handleCheckOut}
          disabled={loading || !hasCheckedIn || hasCheckedOut}
          fullWidth
        >
          {loading ? 'Processing...' : 'Check Out'}
        </Button>
      </Box>
      
      {hasCheckedIn && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
          {hasCheckedOut ? 
            'You have completed your attendance for today.' : 
            'Don\'t forget to check out before leaving!'
          }
        </Typography>
      )}
    </Paper>
  );
}

export default CheckInOutCard;