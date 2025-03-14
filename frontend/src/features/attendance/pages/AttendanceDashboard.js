import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AttendanceList from '../components/AttendanceList';
import AttendanceForm from '../components/AttendanceForm';

const AttendanceDashboard = () => {
  const theme = useTheme();
  const [openAttendanceForm, setOpenAttendanceForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Dummy summary data - would be fetched from API in production
  const summary = {
    totalEmployees: 42,
    presentToday: 36,
    absentToday: 3,
    onLeave: 3,
    attendanceRate: 86,
  };
  
  const handleOpenAttendanceForm = (record = null) => {
    setSelectedRecord(record);
    setOpenAttendanceForm(true);
  };
  
  const handleCloseAttendanceForm = () => {
    setOpenAttendanceForm(false);
    setSelectedRecord(null);
  };
  
  const handleAttendanceSaved = () => {
    // Refresh data or update state as needed
    console.log('Attendance record saved');
  };
  
  // Stats card component
  const StatCard = ({ icon, title, value, color }) => {
    return (
      <Card 
        elevation={0} 
        sx={{ 
          height: '100%',
          border: `1px solid ${theme.palette.divider}`,
          borderLeft: `4px solid ${color}`,
          borderRadius: 1,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography color="text.secondary" variant="subtitle2" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Box 
              sx={{
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: '50%',
                p: 1,
                display: 'flex',
              }}
            >
              {icon}
            </Box>
          </Box>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Attendance Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenAttendanceForm()}
        >
          Add Record
        </Button>
      </Box>
      
      {/* Summary stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PeopleAltIcon color="primary" />}
            title="Total Employees"
            value={summary.totalEmployees}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<CheckCircleIcon color="success" />}
            title="Present Today"
            value={summary.presentToday}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<EventBusyIcon color="error" />}
            title="Absent Today"
            value={summary.absentToday}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<WorkOutlineIcon color="warning" />}
            title="On Leave"
            value={summary.onLeave}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          border: `1px solid ${theme.palette.divider}`, 
          borderRadius: 1
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Attendance Records
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <AttendanceList />
      </Paper>
      
      <AttendanceForm
        open={openAttendanceForm}
        onClose={handleCloseAttendanceForm}
        attendanceRecord={selectedRecord}
        onSave={handleAttendanceSaved}
      />
    </Box>
  );
};

export default AttendanceDashboard;