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
  Chip,
  CircularProgress,
  Typography,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';

function AttendanceList({ attendanceData, loading, error, onEdit }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    let color, label;
    
    switch (status) {
      case 'present':
        color = 'success';
        label = 'Present';
        break;
      case 'absent':
        color = 'error';
        label = 'Absent';
        break;
      case 'half_day':
        color = 'warning';
        label = 'Half Day';
        break;
      case 'leave':
        color = 'info';
        label = 'Leave';
        break;
      case 'remote':
        color = 'primary';
        label = 'Remote';
        break;
      default:
        color = 'default';
        label = status;
    }
    
    return <Chip label={label} color={color} size="small" />;
  };
  
  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5); // Show only HH:MM
  };
  
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Empty state
  if (!attendanceData || attendanceData.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="textSecondary">No attendance records found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ overflow: 'auto' }}>
        <Table stickyHeader size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              {!isMobile && <TableCell>Date</TableCell>}
              <TableCell>Status</TableCell>
              {!isMobile && <TableCell>Check In</TableCell>}
              {!isMobile && <TableCell>Check Out</TableCell>}
              <TableCell align="right">Hours</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? attendanceData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : attendanceData
            ).map((record) => (
              <TableRow 
                key={record.id}
                hover
                onClick={() => onEdit && onEdit(record)}
                sx={{ cursor: onEdit ? 'pointer' : 'default' }}
              >
                <TableCell>
                  <Box>
                    {record.employee_name}
                    {isMobile && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        {formatDate(record.date)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                {!isMobile && <TableCell>{formatDate(record.date)}</TableCell>}
                <TableCell>{getStatusChip(record.status)}</TableCell>
                {!isMobile && <TableCell>{formatTime(record.check_in)}</TableCell>}
                {!isMobile && <TableCell>{formatTime(record.check_out)}</TableCell>}
                <TableCell align="right">
                  {record.duration_hours}
                  {isMobile && record.check_in && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      {formatTime(record.check_in)} - {formatTime(record.check_out)}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
        component="div"
        count={attendanceData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={isMobile ? '' : 'Rows:'} 
      />
    </Box>
  );
}

export default AttendanceList;