import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../redux/authSlice';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../../utils/api';

const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
  { value: 'remote', label: 'Working Remote' },
];

function AttendanceForm({ open, onClose, attendanceRecord, onSave }) {
  const user = useSelector(selectUser);
  const isManager = user?.is_manager === true;

  const [formData, setFormData] = useState({
    employee: '',
    date: new Date(),
    check_in: null,
    check_out: null,
    status: 'present',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // If editing existing record, populate form with initial data
  useEffect(() => {
    if (attendanceRecord) {
      setFormData({
        ...attendanceRecord,
        date: attendanceRecord.date ? new Date(attendanceRecord.date) : new Date(),
        check_in: attendanceRecord.check_in ? new Date(`2000-01-01T${attendanceRecord.check_in}`) : null,
        check_out: attendanceRecord.check_out ? new Date(`2000-01-01T${attendanceRecord.check_out}`) : null,
      });
    } else {
      // Reset form when opening for a new record
      setFormData({
        employee: '',
        date: new Date(),
        check_in: null,
        check_out: null,
        status: 'present',
        notes: '',
      });
    }
  }, [attendanceRecord, open]);

  // Conditionally load employees based on role
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        if (isManager) {
          // Managers can select any employee
          const response = await axios.get(`${API_URL}/employees/employees/`, {
            headers: getAuthHeader()
          });
          setEmployees(response.data);
        } else {
          // Non-managers can only select themselves
          setEmployees([
            {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name
            }
          ]);
          
          // Automatically set the employee field to the current user
          setFormData(prev => ({
            ...prev,
            employee: user.id
          }));
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [open, isManager, user]);

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
    
    onSave(formattedData);
  };

  // Disable employee field for non-managers
  const employeeFieldDisabled = !isManager || loadingEmployees;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {attendanceRecord ? 'Edit Attendance Record' : 'Create New Attendance Record'}
      </DialogTitle>
      
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.employee} disabled={employeeFieldDisabled}>
                  <InputLabel id="employee-select-label">Employee</InputLabel>
                  <Select
                    labelId="employee-select-label"
                    id="employee-select"
                    name="employee"
                    value={formData.employee}
                    onChange={handleChange}
                    label="Employee"
                  >
                    {loadingEmployees ? (
                      <MenuItem disabled>Loading employees...</MenuItem>
                    ) : (
                      employees.map(employee => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name}
                        </MenuItem>
                      ))
                    )}
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
            </Grid>
          </Box>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {attendanceRecord ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AttendanceForm;