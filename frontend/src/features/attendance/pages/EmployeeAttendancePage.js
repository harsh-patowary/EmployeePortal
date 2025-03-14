import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  Alert,
  Button,
  Tab,
  Tabs
} from '@mui/material';
import AttendanceCalendar from '../components/AttendanceCalendar';
import AttendanceForm from '../components/AttendanceForm';
import attendanceService from '../services/attendanceService';

function EmployeeAttendancePage() {
  const { employeeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // You'll need to create this endpoint in your employeeService
        // const employeeResponse = await employeeService.getEmployeeById(employeeId);
        // setEmployee(employeeResponse);
        
        // Temporarily mock the employee data
        setEmployee({
          id: employeeId,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          department: 'Engineering'
        });
        
        const attendanceResponse = await attendanceService.getEmployeeAttendance(employeeId);
        setAttendanceRecords(attendanceResponse.results || attendanceResponse);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load employee attendance data');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchData();
  }, [employeeId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateRecord = () => {
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  const handleSubmitForm = async (formData) => {
    try {
      const data = { ...formData, employee: employeeId };
      await attendanceService.createAttendanceRecord(data);
      
      // Refresh the attendance records
      const attendanceResponse = await attendanceService.getEmployeeAttendance(employeeId);
      setAttendanceRecords(attendanceResponse.results || attendanceResponse);
      
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save attendance record:', err);
      setError('Failed to save attendance record');
    }
  };

  if (loading) {
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Attendance for {employee?.first_name} {employee?.last_name}
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleCreateRecord}
        >
          Add Attendance Record
        </Button>
      </Box>
      
      {showForm ? (
        <AttendanceForm 
          onSubmit={handleSubmitForm} 
          onCancel={handleCancelForm}
          employees={[employee]} // Pass the employee as the only option
          initialData={{ employee: employeeId }} // Pre-select the employee
        />
      ) : (
        <Paper sx={{ borderRadius: 2, mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Calendar View" />
            <Tab label="List View" />
            <Tab label="Statistics" />
          </Tabs>
          
          <Box p={3}>
            {activeTab === 0 && (
              <AttendanceCalendar 
                attendanceData={attendanceRecords}
              />
            )}
            
            {activeTab === 1 && (
              <Typography>
                List view of attendance records will be displayed here
              </Typography>
            )}
            
            {activeTab === 2 && (
              <Typography>
                Attendance statistics will be displayed here
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default EmployeeAttendancePage;