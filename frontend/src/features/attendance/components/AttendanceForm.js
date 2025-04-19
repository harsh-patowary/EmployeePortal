import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // Import useDispatch
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid,
  TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress, FormHelperText
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
// Import selectors and actions
import { selectUser, selectIsManager, selectTeamMembers, selectLoadingTeam, fetchManagerTeam, selectAllEmployees, selectLoadingAllEmployees, fetchAllEmployees, selectUserRole } from '../../../redux/employeeSlice';
// Remove direct axios/API_URL/getAuthHeader if using Redux thunks or centralized service
// import axios from 'axios';
// import { getAuthHeader } from '../../../utils/authUtils';
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Assuming attendanceService exists and uses the api utility
import attendanceService from '../services/attendanceService'; 
// Import employee service if NOT using Redux for fetching here
// import { getManagerTeam, getAllEmployees } from '../../../services/employeeService'; 

function AttendanceForm({ open, onClose, attendanceRecord, onSave }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectUserRole); // Get the specific role

  // Get team/all employees from Redux state
  const teamMembers = useSelector(selectTeamMembers);
  const loadingTeam = useSelector(selectLoadingTeam);
  const allEmployees = useSelector(selectAllEmployees);
  const loadingAllEmployees = useSelector(selectLoadingAllEmployees);

  const [formData, setFormData] = useState({
    employee: '',
    date: new Date(),
    check_in: null,
    check_out: null,
    status: 'present',
    note: '',
  });
  const [employees, setEmployees] = useState([]); // Local state to hold the list for the dropdown
  const [loadingEmployees, setLoadingEmployees] = useState(false); // Use Redux loading state instead if preferred
  const [errors, setErrors] = useState({});

  // Effect to populate form when editing
  useEffect(() => {
    if (attendanceRecord) {
      setFormData({
        employee: attendanceRecord.employee,
        date: parseISO(attendanceRecord.date),
        check_in: attendanceRecord.check_in ? parseISO(attendanceRecord.check_in) : null,
        check_out: attendanceRecord.check_out ? parseISO(attendanceRecord.check_out) : null,
        status: attendanceRecord.status,
        note: attendanceRecord.note || '',
      });
    } else {
      // Reset form for new record
      setFormData({
        employee: !isManager && user ? user.id : '', // Pre-select user if not manager
        date: new Date(),
        check_in: null,
        check_out: null,
        status: 'present',
        note: '',
      });
    }
  }, [attendanceRecord, open, isManager, user]);

  // Effect to load the correct employee list for the dropdown
  useEffect(() => {
    // Only run if the dialog is open and user data is available
    if (open && user) {
        setLoadingEmployees(true); // Indicate loading starts

        // Determine which list to show based on role
        let employeeListToShow = [];
        let isLoading = false;

        if (['admin', 'hr', 'director'].includes(userRole)) {
            // Admin/HR/Director see all employees
            employeeListToShow = allEmployees;
            isLoading = loadingAllEmployees === 'pending';
            // If data isn't loaded yet, dispatch fetch
            if (allEmployees.length === 0 && loadingAllEmployees === 'idle') {
                dispatch(fetchAllEmployees());
            }
        } else if (isManager) {
            // Manager sees their team
            employeeListToShow = teamMembers;
            isLoading = loadingTeam === 'pending';
             // If data isn't loaded yet, dispatch fetch
            if (teamMembers.length === 0 && loadingTeam === 'idle') {
                dispatch(fetchManagerTeam());
            }
        } else {
            // Regular employee only sees themselves
            employeeListToShow = [{
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
            }];
            isLoading = false; // No fetching needed
        }

        console.log("Setting employees for dropdown:", employeeListToShow);
        setEmployees(employeeListToShow);
        setLoadingEmployees(isLoading);

        // If user is not a manager, ensure their ID is set
        if (!isManager && user) {
             setFormData(prev => ({
                ...prev,
                employee: user.id
             }));
        }
    }
  }, [open, user, isManager, userRole, teamMembers, allEmployees, loadingTeam, loadingAllEmployees, dispatch]); // Add dependencies


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
     if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.employee) tempErrors.employee = "Employee is required.";
    if (!formData.date) tempErrors.date = "Date is required.";
    if (!formData.status) tempErrors.status = "Status is required.";
    // Add more validation as needed (e.g., check_out after check_in)
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const dataToSend = {
      ...formData,
      date: format(formData.date, 'yyyy-MM-dd'), // Format date
      // Format times only if they exist, handle potential invalid dates
      check_in: formData.check_in && !isNaN(formData.check_in) ? formData.check_in.toISOString() : null,
      check_out: formData.check_out && !isNaN(formData.check_out) ? formData.check_out.toISOString() : null,
    };

    try {
      if (attendanceRecord) {
        // Update existing record
        await attendanceService.updateAttendanceRecord(attendanceRecord.id, dataToSend);
      } else {
        // Create new record
        await attendanceService.createAttendanceRecord(dataToSend);
      }
      onSave(); // Notify parent component
      onClose(); // Close dialog
    } catch (err) {
      console.error("Failed to save attendance record", err.response?.data || err.message);
      // You could set a general form error state here
      setErrors(prev => ({ ...prev, form: 'Failed to save record. Please try again.' }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{attendanceRecord ? 'Edit Attendance Record' : 'Add Attendance Record'}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.employee}>
                <InputLabel id="employee-select-label">Employee</InputLabel>
                <Select
                  labelId="employee-select-label"
                  id="employee"
                  name="employee"
                  value={formData.employee}
                  label="Employee"
                  onChange={handleChange}
                  disabled={!isManager || loadingEmployees} // Disable for non-managers or while loading
                >
                  {loadingEmployees && <MenuItem value=""><CircularProgress size={20} sx={{ ml: 1 }} /> Loading...</MenuItem>}
                  {!loadingEmployees && employees.length === 0 && <MenuItem value="" disabled>No employees found</MenuItem>}
                  {!loadingEmployees && employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} {emp.eID ? `(${emp.eID})` : ''}
                    </MenuItem>
                  ))}
                </Select>
                 {errors.employee && <FormHelperText>{errors.employee}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Other form fields (Date, Check-in, Check-out, Status, Note) */}
            {/* ... ensure they use handleDateChange or handleChange ... */}
             <Grid item xs={12}>
               <DateTimePicker
                 label="Date"
                 value={formData.date}
                 onChange={(newValue) => handleDateChange('date', newValue)}
                 renderInput={(params) => <TextField {...params} fullWidth error={!!errors.date} helperText={errors.date} />}
                 inputFormat="yyyy-MM-dd" // Just date, no time needed here
                 mask="____-__-__"
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <DateTimePicker
                 label="Check-in Time"
                 value={formData.check_in}
                 onChange={(newValue) => handleDateChange('check_in', newValue)}
                 renderInput={(params) => <TextField {...params} fullWidth error={!!errors.check_in} helperText={errors.check_in} />}
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <DateTimePicker
                 label="Check-out Time"
                 value={formData.check_out}
                 onChange={(newValue) => handleDateChange('check_out', newValue)}
                 renderInput={(params) => <TextField {...params} fullWidth error={!!errors.check_out} helperText={errors.check_out} />}
                 minDateTime={formData.check_in || undefined} // Ensure check-out is after check-in
               />
             </Grid>
             <Grid item xs={12}>
               <FormControl fullWidth error={!!errors.status}>
                 <InputLabel id="status-select-label">Status</InputLabel>
                 <Select
                   labelId="status-select-label"
                   id="status"
                   name="status"
                   value={formData.status}
                   label="Status"
                   onChange={handleChange}
                 >
                   <MenuItem value="present">Present</MenuItem>
                   <MenuItem value="absent">Absent</MenuItem>
                   <MenuItem value="leave">Leave</MenuItem>
                   <MenuItem value="remote">Remote</MenuItem>
                   <MenuItem value="half_day">Half Day</MenuItem>
                 </Select>
                 {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
               </FormControl>
             </Grid>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Note (Optional)"
                 name="note"
                 value={formData.note}
                 onChange={handleChange}
                 multiline
                 rows={3}
               />
             </Grid>
             {errors.form && <Grid item xs={12}><FormHelperText error>{errors.form}</FormHelperText></Grid>}
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AttendanceForm;