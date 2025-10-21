import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

// Helper to format date (same as in LeaveRequestList)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString; // Fallback
  }
};

// Helper to format date and time (if timestamps are available)
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return format(parseISO(dateTimeString), 'MMM d, yyyy, HH:mm');
    } catch (e) {
      return dateTimeString; // Fallback
    }
  };

// Helper to get status chip (same as in LeaveRequestList)
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

const DetailRow = ({ label, value }) => (
  <>
    <Grid item xs={5} sm={4}>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
    </Grid>
    <Grid item xs={7} sm={8}>
      {/* Use component="div" to prevent nesting issues when value is a Chip (div) */}
      <Typography component="div" sx={{ wordBreak: 'break-word' }}>{value || '—'}</Typography>
    </Grid>
  </>
);

const LeaveRequestDetailDialog = ({ open, onClose, request }) => {
  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Leave Request Details #{request.id}</DialogTitle>
      <DialogContent>
        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          <DetailRow label="Employee" value={`${request.employee_details?.first_name || ''} ${request.employee_details?.last_name || ''}`.trim() || 'N/A'} />
          <DetailRow label="Leave Type" value={request.leave_type_display || request.leave_type} />
          <DetailRow label="Start Date" value={formatDate(request.start_date)} />
          <DetailRow label="End Date" value={formatDate(request.end_date)} />
          <DetailRow label="Duration" value={`${request.duration_days} day(s)`} />
          <DetailRow label="Status" value={getStatusChip(request.status)} />

          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Reason:
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
              {request.reason || 'No reason provided.'}
            </Typography>
          </Grid>

          {/* Show rejection reason if applicable */}
          {request.status === 'rejected' && request.rejection_reason && (
            <>
              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="error.main" gutterBottom>
                  Rejection Reason:
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {request.rejection_reason}
                </Typography>
              </Grid>
            </>
          )}

          {/* Show Approval Info if applicable */}
          {(request.approved_by_manager || request.approved_by_hr) && (
             <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
          )}
          {request.approved_by_manager && (
             <DetailRow label="Manager Action By" value={`${request.approved_by_manager_name || 'N/A'} on ${formatDateTime(request.manager_approval_timestamp)}`} />
          )}
           {request.approved_by_hr && (
             <DetailRow label="HR Action By" value={`${request.approved_by_hr_name || 'N/A'} on ${formatDateTime(request.hr_approval_timestamp)}`} />
          )}

        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveRequestDetailDialog;