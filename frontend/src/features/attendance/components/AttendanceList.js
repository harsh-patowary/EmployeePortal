// src/features/attendance/components/AttendanceList.js
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';

function AttendanceList({ attendanceData, loading, error, isEmployee = false }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Function to get status chip based on attendance status
  const getStatusChip = (status) => {
    let color;
    
    switch (status) {
      case 'present':
        color = 'success';
        break;
      case 'absent':
        color = 'error';
        break;
      case 'half_day':
        color = 'warning';
        break;
      case 'leave':
        color = 'info';
        break;
      case 'remote':
        color = 'primary';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={status.replace('_', ' ').toUpperCase()} 
        color={color} 
        size="small" 
        variant="outlined"
      />
    );
  };
  
  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Empty state
  if (attendanceData.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No attendance records found
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper elevation={0}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              {!isEmployee && (
                <TableCell>Employee</TableCell>
              )}
              <TableCell>Status</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  {!isEmployee && (
                    <TableCell>{record.employee_name}</TableCell>
                  )}
                  <TableCell>{getStatusChip(record.status)}</TableCell>
                  <TableCell>{formatTime(record.check_in)}</TableCell>
                  <TableCell>{formatTime(record.check_out)}</TableCell>
                  <TableCell>
                    {record.duration_hours ? `${record.duration_hours} hrs` : '—'}
                  </TableCell>
                  <TableCell>
                    {record.notes || '—'}
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={attendanceData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
}

export default AttendanceList;