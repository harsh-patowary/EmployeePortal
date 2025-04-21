import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { format, parseISO } from 'date-fns';

// Helper to get status chip
const getStatusChip = (status) => {
  let color = 'default';
  let label = status;
  let icon = null;

  switch (status?.toLowerCase()) {
    case 'pending':
      color = 'warning';
      label = 'Pending Manager';
      icon = <HourglassEmptyIcon fontSize="small" />;
      break;
    case 'manager_approved':
      color = 'info';
      label = 'Pending HR';
      icon = <HourglassEmptyIcon fontSize="small" />;
      break;
    case 'approved':
      color = 'success';
      label = 'Approved';
      icon = <CheckCircleIcon fontSize="small" />;
      break;
    case 'rejected':
      color = 'error';
      label = 'Rejected';
      icon = <ThumbDownIcon fontSize="small" />;
      break;
    case 'cancelled':
      color = 'default';
      label = 'Cancelled';
      icon = <CancelIcon fontSize="small" />;
      break;
    default:
      label = status || 'Unknown';
  }
  return <Chip label={label} color={color} size="small" icon={icon} />;
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString; // Fallback
  }
};

const LeaveRequestList = ({
  title,
  requests = [],
  loading,
  currentUserId,
  onActionClick, // Function to handle approve/reject click
  isApprovalList = false, // Flag to show action buttons
  // Add onCancelClick, onEditClick if needed for 'My Requests' view
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Box p={2}>
        <Typography color="text.secondary">No leave requests found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>{title}</Typography>}
      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              {!isApprovalList && <TableCell>Request ID</TableCell>}
              {isApprovalList && <TableCell>Employee</TableCell>}
              <TableCell>Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
              {isApprovalList && <TableCell align="center">Actions</TableCell>}
              {/* Add columns for Edit/Cancel if needed */}
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id} hover>
                {!isApprovalList && <TableCell>#{req.id}</TableCell>}
                {isApprovalList && <TableCell>{req.employee_details?.first_name} {req.employee_details?.last_name}</TableCell>}
                <TableCell sx={{ textTransform: 'capitalize' }}>{req.leave_type}</TableCell>
                <TableCell>{formatDate(req.start_date)}</TableCell>
                <TableCell>{formatDate(req.end_date)}</TableCell>
                <TableCell>{req.duration_days} day(s)</TableCell>
                <TableCell>{getStatusChip(req.status)}</TableCell>
                <TableCell>
                  <Tooltip title={req.reason || 'No reason provided'}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.reason || '-'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                {isApprovalList && onActionClick && (
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => onActionClick(req)}
                      disabled={req.status !== 'pending' && req.status !== 'manager_approved'} // Example condition
                    >
                      Review
                    </Button>
                  </TableCell>
                )}
                {/* Add Edit/Cancel buttons here based on conditions */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LeaveRequestList;