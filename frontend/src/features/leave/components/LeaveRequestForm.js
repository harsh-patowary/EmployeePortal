import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  FormHelperText,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { differenceInDays, isValid, startOfDay } from 'date-fns';
import { createLeaveRequest, selectLeaveActionLoading, selectLeaveActionError, resetLeaveActionStatus } from '../slices/leaveSlice'; // Added resetLeaveActionStatus
import { selectUser } from '../../../redux/employeeSlice'; // Adjust path as needed

const LeaveRequestForm = ({ open, onClose, paidBalance, sickBalance }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectLeaveActionLoading) === 'pending';
  const error = useSelector(selectLeaveActionError);

  const initialFormData = {
    leave_type: 'paid',
    start_date: null,
    end_date: null,
    reason: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [duration, setDuration] = useState(0);
  const [balanceInfo, setBalanceInfo] = useState('');

  // Reset form and redux error state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setFormErrors({});
      setDuration(0);
      setBalanceInfo('');
      // Clear any previous action states
      dispatch(resetLeaveActionStatus());
    }
    
    // Clean up when dialog closes or component unmounts
    return () => {
      if (!open) {
        dispatch(resetLeaveActionStatus());
      }
    };
  }, [open, dispatch]);

  useEffect(() => {
    // Calculate duration when dates change
    const { start_date, end_date } = formData;
    if (start_date && end_date && isValid(start_date) && isValid(end_date) && end_date >= start_date) {
      const days = differenceInDays(startOfDay(end_date), startOfDay(start_date)) + 1;
      setDuration(days);
    } else {
      setDuration(0);
    }

    // Update balance info based on leave type
    if (formData.leave_type === 'paid') {
        setBalanceInfo(`Available: ${paidBalance ?? 0} days`);
    } else if (formData.leave_type === 'sick') {
        setBalanceInfo(`Available: ${sickBalance ?? 0} days`);
    } else {
        setBalanceInfo('');
    }

    // Clear any related errors when dependencies change
    if (formErrors.leave_type || formErrors.start_date || formErrors.end_date) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.leave_type;
        delete newErrors.start_date;
        delete newErrors.end_date;
        return newErrors;
      });
    }
  }, [formData.start_date, formData.end_date, formData.leave_type, paidBalance, sickBalance, formErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (formErrors.form) {
      setFormErrors((prev) => ({ ...prev, form: null }));
    }
  };

  const handleDateChange = (name, date) => {
    const valueToSet = date && isValid(date) ? startOfDay(date) : null;
    setFormData((prev) => ({ ...prev, [name]: valueToSet }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (formErrors.form) {
      setFormErrors((prev) => ({ ...prev, form: null }));
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.leave_type) tempErrors.leave_type = 'Leave type is required.';
    if (!formData.start_date) tempErrors.start_date = 'Start date is required.';
    if (!formData.end_date) tempErrors.end_date = 'End date is required.';
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      tempErrors.end_date = 'End date cannot be before start date.';
    }
    if (!formData.reason) tempErrors.reason = 'Reason is required.';
    if (duration <= 0) tempErrors.end_date = 'Please select valid start and end dates.';

    // Enforce strict balance validation - prevent submitting if balance is insufficient
    if (formData.leave_type === 'paid' && duration > (paidBalance ?? 0)) {
        tempErrors.leave_type = `Insufficient paid leave balance (${paidBalance ?? 0} days available for ${duration} days requested).`;
    }
    if (formData.leave_type === 'sick' && duration > (sickBalance ?? 0)) {
        tempErrors.leave_type = `Insufficient sick leave balance (${sickBalance ?? 0} days available for ${duration} days requested).`;
    }

    setFormErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First reset any previous action states
    dispatch(resetLeaveActionStatus());
    
    if (!validateForm()) return;

    // Check if user object exists and has an ID
    if (!user || !user.id) {
      setFormErrors(prev => ({ 
        ...prev, 
        form: 'User information is missing. Please try logging in again.'
      }));
      return;
    }

    // Pass the data closer to its original form (with Date objects)
    const dataToDispatch = {
      leave_type: formData.leave_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason,
      employee: user.id,
    };

    try {
      // Dispatch the action with error handling
      const resultAction = await dispatch(createLeaveRequest(dataToDispatch));

      if (createLeaveRequest.fulfilled.match(resultAction)) {
        onClose(); // Close dialog on success
      } else if (createLeaveRequest.rejected.match(resultAction)) {
         // Handle specific error case
         if (resultAction.payload) {
             setFormErrors(prev => ({ ...prev, form: resultAction.payload.detail || resultAction.payload.reason || 'Failed to submit request.' }));
         } else {
             setFormErrors(prev => ({ ...prev, form: 'An unknown error occurred.' }));
         }
         // Reset action loading state after error
         setTimeout(() => dispatch(resetLeaveActionStatus()), 500);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setFormErrors(prev => ({ ...prev, form: 'Failed to submit request. Please try again.' }));
      dispatch(resetLeaveActionStatus());
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Apply for Leave</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Show balance warning if needed */}
            {formData.leave_type === 'paid' && paidBalance < duration && duration > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Warning: Requested leave ({duration} days) exceeds your available paid leave balance ({paidBalance ?? 0} days).
                </Alert>
              </Grid>
            )}
            {formData.leave_type === 'sick' && sickBalance < duration && duration > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Warning: Requested leave ({duration} days) exceeds your available sick leave balance ({sickBalance ?? 0} days).
                </Alert>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.leave_type}>
                <InputLabel id="leave-type-label">Leave Type</InputLabel>
                <Select
                  labelId="leave-type-label"
                  name="leave_type"
                  value={formData.leave_type}
                  label="Leave Type"
                  onChange={handleChange}
                >
                  <MenuItem value="paid">Paid Leave</MenuItem>
                  <MenuItem value="sick">Sick Leave</MenuItem>
                  <MenuItem value="unpaid">Unpaid Leave</MenuItem>
                  {/* Add other types as needed */}
                </Select>
                {balanceInfo && <FormHelperText sx={{ ml: 0 }}>{balanceInfo}</FormHelperText>}
                {formErrors.leave_type && <FormHelperText error>{formErrors.leave_type}</FormHelperText>}
              </FormControl>
            </Grid>
             <Grid item xs={12} sm={6}>
                 <Typography variant="body2" color="text.secondary">Calculated Duration</Typography>
                 <Typography variant="h6">{duration} day(s)</Typography>
             </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={(newValue) => handleDateChange('start_date', newValue)}
                minDate={new Date()} // Prevent selecting past dates
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.start_date,
                    helperText: formErrors.start_date,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={formData.end_date}
                onChange={(newValue) => handleDateChange('end_date', newValue)}
                minDate={formData.start_date || new Date()} // End date >= start date
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.end_date,
                    helperText: formErrors.end_date,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                multiline
                rows={3}
                error={!!formErrors.reason}
                helperText={formErrors.reason}
              />
            </Grid>
             {/* Display general form error */}
             {formErrors.form && <Grid item xs={12}><FormHelperText error sx={{ textAlign: 'center', mt: 1 }}>{formErrors.form}</FormHelperText></Grid>}
             {/* Display slice error */}
             {error && !formErrors.form && typeof error === 'string' && <Grid item xs={12}><FormHelperText error sx={{ textAlign: 'center', mt: 1 }}>{error}</FormHelperText></Grid>}
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveRequestForm;