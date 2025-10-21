// src/features/attendance/components/AttendanceList.js
import React, { useState, useMemo } from 'react'; // Import useMemo
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
  useMediaQuery,
  TableSortLabel, // For sorting
  TextField, // For date filtering
  Grid, // For layout
  InputAdornment,
  IconButton
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO, isValid, startOfMonth, endOfMonth, subMonths } from 'date-fns'; // Import date-fns functions
import ClearIcon from '@mui/icons-material/Clear'; // Icon to clear dates

// Helper function for stable sorting
function descendingComparator(a, b, orderBy) {
  let valA = a[orderBy];
  let valB = b[orderBy];

  // Handle date sorting
  if (orderBy === 'date') {
    valA = new Date(valA);
    valB = new Date(valB);
  }
  // Handle name sorting (assuming employee_name exists)
  else if (orderBy === 'employee_name') {
    valA = valA?.toLowerCase() || '';
    valB = valB?.toLowerCase() || '';
  }

  if (valB < valA) {
    return -1;
  }
  if (valB > valA) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Stable sort function
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1]; // Maintain original order if values are equal
  });
  return stabilizedThis.map((el) => el[0]);
}


function AttendanceList({ attendanceData = [], loading, error, onEdit, isMobile, personalView = false }) {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('desc'); // Default sort order
  const [orderBy, setOrderBy] = useState('date'); // Default sort column

  // Date range filtering state - Default to current month
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  // --- MOVE HOOKS BEFORE EARLY RETURNS ---

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    if (!attendanceData) return [];
    return attendanceData.filter(record => {
      if (!record.date) return false;
      const recordDate = parseISO(record.date); // Assuming date is ISO string 'YYYY-MM-DD'
      if (!isValid(recordDate)) return false;

      const start = startDate ? startOfDay(startDate) : null;
      const end = endDate ? endOfDay(endDate) : null;

      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false;
      return true;
    });
  }, [attendanceData, startDate, endDate]);

  // --- Sorting Logic ---
  const sortedData = useMemo(() => {
    return stableSort(filteredData, getComparator(order, orderBy));
  }, [filteredData, order, orderBy]);

  // --- Column Definitions ---
  const columns = useMemo(() => {
    const baseColumns = [
      { id: 'date', label: 'Date', sortable: true },
      { id: 'status', label: 'Status', sortable: false }, // Status sorting might be complex
    ];
    if (!isMobile) {
      baseColumns.push(
        { id: 'check_in', label: 'Check In', sortable: false },
        { id: 'check_out', label: 'Check Out', sortable: false }
      );
    }
    baseColumns.push({ id: 'hours', label: 'Hours', align: 'right', sortable: false }); // Duration sorting might be complex

    if (!personalView) {
      baseColumns.unshift({ id: 'employee_name', label: 'Employee', sortable: true });
    }
    return baseColumns;
  }, [isMobile, personalView]);

  // --- END MOVED HOOKS ---


  // --- Loading and Error Handling ---
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

  // --- Pagination Logic ---
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- Sorting Handler ---
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // --- Chip and Formatting Helpers ---
  const getStatusChip = (status) => {
    // ... (getStatusChip logic remains the same) ...
    let color, label;
    switch (status) {
      case 'present': color = 'success'; label = 'Present'; break;
      case 'absent': color = 'error'; label = 'Absent'; break;
      case 'half_day': color = 'warning'; label = 'Half Day'; break; // Changed color
      case 'leave': color = 'info'; label = 'Leave'; break; // Changed color
      case 'remote': color = 'primary'; label = 'Remote'; break;
      default: color = 'default'; label = status || 'Unknown';
    }
    return <Chip label={label} color={color} size="small" />;
  };
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    try {
        // Handle full ISO strings or just time strings
        const date = timeStr.includes('T') ? parseISO(timeStr) : new Date(`1970-01-01T${timeStr}`);
        if (!isValid(date)) return '-';
        return format(date, 'HH:mm');
    } catch {
        return '-';
    }
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const date = parseISO(dateStr); // Assuming YYYY-MM-DD
        if (!isValid(date)) return '-';
        return format(date, 'MMM d, yyyy'); // e.g., Apr 20, 2025
    } catch {
        return '-';
    }
  };

  // --- Render Table Header with Sorting ---
  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align}
            sortDirection={orderBy === column.id ? order : false}
          >
            {column.sortable ? (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={(event) => handleRequestSort(event, column.id)}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  // --- Render Table Row ---
  const renderTableRow = (record) => (
    <TableRow
      key={record.id}
      hover={!!onEdit}
      onClick={() => onEdit && onEdit(record)}
      sx={{ cursor: onEdit ? 'pointer' : 'default' }}
    >
      {!personalView && (
        <TableCell>{record.employee_name || 'Unknown'}</TableCell>
      )}
      <TableCell>{formatDate(record.date)}</TableCell>
      <TableCell>{getStatusChip(record.status)}</TableCell>
      {!isMobile && (
        <>
          <TableCell>{formatTime(record.check_in)}</TableCell>
          <TableCell>{formatTime(record.check_out)}</TableCell>
        </>
      )}
      <TableCell align="right">{record.duration_hours != null ? record.duration_hours.toFixed(1) : '—'}</TableCell>
    </TableRow>
  );

  // --- Empty State ---
  if (filteredData.length === 0 && !loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">No attendance records found{startDate || endDate ? ' for the selected date range' : ''}.</Typography>
      </Box>
    );
  }

  // --- Main Render ---
  return (
    <Box sx={{ width: '100%' }}>
      {/* Date Filter Controls */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={2} sx={{ mb: 2, px: { xs: 0, sm: 1 } }}>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              maxDate={endDate || undefined} // Prevent start date after end date
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  InputProps: {
                    endAdornment: startDate && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setStartDate(null)}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate || undefined} // Prevent end date before start date
              maxDate={new Date()} // Limit end date to today
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                   InputProps: {
                    endAdornment: endDate && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setEndDate(null)}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
          </Grid>
        </Grid>
      </LocalizationProvider>

      {/* Table */}
      <TableContainer sx={{ overflow: 'auto', maxHeight: 'calc(100% - 120px)' }}> {/* Adjust maxHeight if needed */}
        <Table stickyHeader size={isMobileView ? "small" : "medium"}>
          {renderTableHeader()}
          <TableBody>
            {(rowsPerPage > 0
              ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : sortedData
            ).map((record) => renderTableRow(record))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
        component="div"
        count={sortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={isMobileView ? '' : 'Rows:'}
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      />
    </Box>
  );
}

// Helper functions for date manipulation (can be moved to a utils file)
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};


export default AttendanceList;