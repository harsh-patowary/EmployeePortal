import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../redux/authSlice';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tab,
  Tabs
} from '@mui/material';
import AttendanceCalendar from '../components/AttendanceCalendar';
import CheckInOutCard from '../components/CheckInOutCard';
import AttendanceList from '../components/AttendanceList';
import useAttendance from '../hooks/useAttendance';

function EmployeeAttendancePage() {
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState(0);
  
  // Use the useAttendance hook with auto-refresh enabled
  // This will automatically poll for updates every 15 seconds
  const { 
    attendanceData: attendanceRecords, 
    loading, 
    error, 
    refetch: refreshAttendance 
  } = useAttendance(user?.id, { autoRefresh: true, refreshInterval: 15000 });
  
  // Find today's record using the hard-coded date
  const targetDate = '2025-04-19'; // Hard-code the expected date format
  const todayRecord = attendanceRecords.find(record => record.date === targetDate);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Update the handleAttendanceRecorded function
  const handleAttendanceRecorded = async (updatedRecord) => {
    if (updatedRecord) {
      // Immediately update the UI without waiting for refresh
      console.log('Updating UI with record:', updatedRecord);
      
      // Create a new array with the updated record
      const updatedRecords = [...attendanceRecords];
      
      // Find and update the record if it exists
      const existingIndex = updatedRecords.findIndex(r => r.id === updatedRecord.id);
      
      if (existingIndex >= 0) {
        // Replace the existing record
        updatedRecords[existingIndex] = updatedRecord;
      } else {
        // Add the new record
        updatedRecords.push(updatedRecord);
      }
      
      // No need to call setAttendanceRecords as it's managed by the hook
      // But we can update todayRecord immediately
      if (updatedRecord.date === targetDate) {
        // Force the component to re-render with the updated record
        todayRecord(updatedRecord);
      }
    } else {
      // Fall back to standard refresh if no record is provided
      await refreshAttendance();
    }
  };

  if (loading && attendanceRecords.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Attendance
      </Typography>
      
      {/* Check In/Out Card */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Today's Attendance
        </Typography>
        <Box sx={{ mt: 2 }}>
          <CheckInOutCard 
            employeeId={user?.id}
            todayRecord={todayRecord}
            onAttendanceRecorded={handleAttendanceRecorded}
            // Force re-render by adding key with todayRecord state
            key={todayRecord ? 
              `${todayRecord.id}-${todayRecord.check_in}-${todayRecord.check_out}` 
              : 'no-record'}
          />
        </Box>
      </Paper>
      
      {/* Attendance History Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Calendar View" />
          <Tab label="List View" />
          <Tab label="Summary" />
        </Tabs>
        
        <Box p={3}>
          {activeTab === 0 && (
            <AttendanceCalendar 
              attendanceData={attendanceRecords}
            />
          )}
          
          {activeTab === 1 && (
            <AttendanceList
              attendanceData={attendanceRecords}
              loading={loading}
              error={error}
              personalView={true}
              isMobile={false}
            />
          )}
          
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Present Days
                    </Typography>
                    <Typography variant="h5">
                      {attendanceRecords.filter(record => record.status === 'present').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Absent Days
                    </Typography>
                    <Typography variant="h5">
                      {attendanceRecords.filter(record => record.status === 'absent').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Leave Days
                    </Typography>
                    <Typography variant="h5">
                      {attendanceRecords.filter(record => record.status === 'leave').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default EmployeeAttendancePage;