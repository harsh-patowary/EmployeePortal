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
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { differenceInDays, isValid, startOfDay } from 'date-fns';
import { createLeaveRequest, selectLeaveActionLoading, selectLeaveActionError } from '../slices/leaveSlice'; // Adjust path as needed
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

  useEffect(() => {
    // Reset form and errors when dialog opens/closes
    if (open) {
      setFormData(initialFormData);
      setFormErrors({});
      setDuration(0);
      setBalanceInfo('');
    }
  }, [open]);

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

  }, [formData.start_date, formData.end_date, formData.leave_type, paidBalance, sickBalance]);

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

    // Balance Check (optional but good practice)
    if (formData.leave_type === 'paid' && duration > (paidBalance ?? 0)) {
        tempErrors.leave_type = `Insufficient paid leave balance (${paidBalance ?? 0} days available).`;
    }
    if (formData.leave_type === 'sick' && duration > (sickBalance ?? 0)) {
        tempErrors.leave_type = `Insufficient sick leave balance (${sickBalance ?? 0} days available).`;
    }


    setFormErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Pass the data closer to its original form (with Date objects)
    // Let the service layer handle final formatting and field selection
    const dataToDispatch = {
      leave_type: formData.leave_type,
      start_date: formData.start_date, // Pass the Date object
      end_date: formData.end_date,     // Pass the Date object
      reason: formData.reason,
      employee: user?.id, // Assuming user object has the employee ID
    };

    // --- DEBUGGING: Log the data being dispatched from Form to Thunk ---
    console.log("Data being dispatched from Form:", dataToDispatch);

    try {
      // Dispatch the data with Date objects
      const resultAction = await dispatch(createLeaveRequest(dataToDispatch));

      if (createLeaveRequest.fulfilled.match(resultAction)) {
        onClose(); // Close dialog on success
      } else {
         // Error handling remains the same
         if (resultAction.payload) {
             setFormErrors(prev => ({ ...prev, form: resultAction.payload.detail || resultAction.payload.reason || 'Failed to submit request.' }));
         } else {
             setFormErrors(prev => ({ ...prev, form: 'An unknown error occurred.' }));
         }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setFormErrors(prev => ({ ...prev, form: 'Failed to submit request. Please try again.' }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Apply for Leave</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
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
                {formErrors.leave_type && <FormHelperText>{formErrors.leave_type}</FormHelperText>}
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