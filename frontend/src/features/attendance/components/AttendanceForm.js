import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Typography,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
  { value: 'remote', label: 'Working Remote' },
];

function AttendanceForm({ initialData = null, employees = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    employee: '',
    date: new Date(),
    check_in: null,
    check_out: null,
    status: 'present',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});

  // If editing existing record, populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date ? new Date(initialData.date) : new Date(),
        check_in: initialData.check_in ? new Date(`2000-01-01T${initialData.check_in}`) : null,
        check_out: initialData.check_out ? new Date(`2000-01-01T${initialData.check_out}`) : null,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
    
    // Clear date error if exists
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: null }));
    }
  };

  const handleTimeChange = (time, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: time
    }));
    
    // Clear time field error if exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Employee is required
    if (!formData.employee) {
      newErrors.employee = 'Please select an employee';
    }

    // Date is required
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    // If check-out exists, check-in should also exist
    if (formData.check_out && !formData.check_in) {
      newErrors.check_in = 'Check-in time is required if check-out is provided';
    }

    // Check-out time should be after check-in time
    if (formData.check_in && formData.check_out && formData.check_out < formData.check_in) {
      newErrors.check_out = 'Check-out time must be after check-in time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Format date and times for API
    const formattedData = {
      ...formData,
      date: format(formData.date, 'yyyy-MM-dd'),
      check_in: formData.check_in ? format(formData.check_in, 'HH:mm:ss') : null,
      check_out: formData.check_out ? format(formData.check_out, 'HH:mm:ss') : null,
    };
    
    onSubmit(formattedData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          {initialData ? 'Edit Attendance Record' : 'Create New Attendance Record'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.employee}>
                <InputLabel id="employee-select-label">Employee</InputLabel>
                <Select
                  labelId="employee-select-label"
                  id="employee-select"
                  name="employee"
                  value={formData.employee}
                  onChange={handleChange}
                  label="Employee"
                >
                  {employees.map(employee => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.employee && <FormHelperText>{errors.employee}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.date}
                    helperText={errors.date}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <TimePicker
                  label="Check-in Time"
                  value={formData.check_in}
                  onChange={(time) => handleTimeChange(time, 'check_in')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.check_in}
                      helperText={errors.check_in}
                    />
                  )}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <TimePicker
                  label="Check-out Time"
                  value={formData.check_out}
                  onChange={(time) => handleTimeChange(time, 'check_out')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.check_out}
                      helperText={errors.check_out}
                    />
                  )}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  id="status-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  {ATTENDANCE_STATUSES.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="notes"
                name="notes"
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={onCancel} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {initialData ? 'Update' : 'Save'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}

export default AttendanceForm;