import React from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Button,
  Tooltip,
  Stack, // Import Stack for vertical layout
  Grid, // Import Grid for layout within the card
} from '@mui/material';
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
  onCardClick, // Function to handle clicking the card itself
  isApprovalList = false, // Flag to show action buttons
  // Add onCancelClick, onEditClick if needed for 'My Requests' view
}) => {
  console.log(`LeaveRequestList (${title}) - Received Requests Prop:`, requests);
  console.log(`LeaveRequestList (${title}) - Loading Prop:`, loading);

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
  }

  if (!requests || requests.length === 0) {
    return <Typography sx={{ textAlign: 'center', p: 2 }}>No requests found.</Typography>;
  }

  return (
    <Box>
      {title && <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>{title}</Typography>}
      {/* Use Stack for vertical arrangement of cards */}
      <Stack spacing={2}>
        {requests.map((req) => (
          <Paper
            key={req.id}
            // elevation={2} // Remove this direct elevation prop, manage via sx
            onClick={onCardClick ? () => onCardClick(req) : undefined} // Make card clickable if handler exists
            sx={(theme) => ({ // Use theme callback to access theme.shadows
              p: 2,
              bgcolor: 'background.paper', // Explicitly set background color (default). Change to 'grey.100' or another theme color if needed.
              color: 'text.primary', // Text color
              cursor: onCardClick ? 'pointer' : 'default', // Add pointer cursor if clickable
              border: 'none', // Explicitly remove border if needed, though removing variant="outlined" usually suffices
              boxShadow: theme.shadows[2], // Default shadow (equivalent to elevation={2})
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', // Add transition for smooth scaling and shadow change
              '&:hover': { // Apply hover styles unconditionally
                // color: 'text.secondary', // Optional: Keep or remove based on desired hover effect
                boxShadow: theme.shadows[4], // Use boxShadow for elevation effect (equivalent to elevation={4})
                transform: 'scale(1.02)', // Scale up slightly on hover
              },
            })}>
            <Grid container spacing={2} alignItems="center">

              {/* Column 1: Employee/ID, Type, Dates */}
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {isApprovalList
                    ? `${req.employee_details?.first_name || ''} ${req.employee_details?.last_name || ''}`.trim() || 'Unknown Employee'
                    : `Request #${req.id}`
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  Type: {req.leave_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(req.start_date)} - {formatDate(req.end_date)} ({req.duration_days} day(s))
                </Typography>
              </Grid>

              {/* Column 2: Status, Reason */}
              <Grid item xs={12} sm={6} md={4}>
                <Box mb={1}>{getStatusChip(req.status)}</Box>
                {/* Conditionally render the reason only if it's NOT the approval list */}
                {!isApprovalList && (
                  <Tooltip title={req.reason || 'No reason provided'}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      Reason: {req.reason || '-'}
                    </Typography>
                  </Tooltip>
                )}
              </Grid>

              {/* Column 3: Actions */}
              {isApprovalList && onActionClick && (
                <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={(e) => { // Stop propagation if card is also clickable
                        if (onCardClick) e.stopPropagation();
                        onActionClick(req);
                    }}
                    // Only enable Review for actionable statuses
                    disabled={req.status !== 'pending' && req.status !== 'manager_approved'}
                  >
                    Review
                  </Button>
                </Grid>
              )}
              {/* Add Edit/Cancel buttons similarly if needed for 'My Requests' view */}
              {/* Example Cancel Button (only for specific statuses and if not approval list) */}
              {/* {!isApprovalList && ['pending', 'manager_approved'].includes(req.status) && onCancelClick && (
                <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Button size="small" variant="text" color="error" onClick={() => onCancelClick(req.id)}>
                    Cancel
                  </Button>
                </Grid>
              )} */}

            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default LeaveRequestList;