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

function AttendanceList({ attendanceData, loading, error, onEdit, isMobile, personalView = false }) {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
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

  // Columns to display - different for personal vs management view
  const getColumns = () => {
    const baseColumns = [
      { id: 'date', label: 'Date' },
      { id: 'status', label: 'Status' },
    ];

    if (!isMobile) {
      baseColumns.push(
        { id: 'check_in', label: 'Check In' },
        { id: 'check_out', label: 'Check Out' }
      );
    }

    baseColumns.push({ id: 'hours', label: 'Hours', align: 'right' });

    // Add employee column for management view
    if (!personalView) {
      baseColumns.unshift({ id: 'employee', label: 'Employee' });
    }

    return baseColumns;
  };

  // Render table header
  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        {getColumns().map(column => (
          <TableCell key={column.id} align={column.align}>
            {column.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  // Render table row
  const renderTableRow = (record) => (
    <TableRow
      key={record.id}
      hover={!!onEdit}
      onClick={() => onEdit && onEdit(record)}
      sx={{ cursor: onEdit ? 'pointer' : 'default' }}
    >
      {/* Only show employee column in management view */}
      {!personalView && (
        <TableCell>
          {record.employee_name || 'Unknown'}
        </TableCell>
      )}

      <TableCell>
        {formatDate(record.date)}
      </TableCell>

      <TableCell>
        {getStatusChip(record.status)}
      </TableCell>

      {!isMobile && (
        <>
          <TableCell>
            {formatTime(record.check_in)}
          </TableCell>
          <TableCell>
            {formatTime(record.check_out)}
          </TableCell>
        </>
      )}

      <TableCell align="right">
        {record.duration_hours || '—'}
      </TableCell>
    </TableRow>
  );

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
        <Table stickyHeader size={isMobileView ? "small" : "medium"}>
          {renderTableHeader()}
          <TableBody>
            {(rowsPerPage > 0
              ? attendanceData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : attendanceData
            ).map((record) => renderTableRow(record))}
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
        labelRowsPerPage={isMobileView ? '' : 'Rows:'} 
      />
    </Box>
  );
}

export default AttendanceList;