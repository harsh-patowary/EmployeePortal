import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid,
  TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress, FormHelperText,
  Typography // Import Typography for displaying duration
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO, isValid, differenceInMinutes } from 'date-fns'; // Import differenceInMinutes
// Import selectors and actions
import { selectUser, selectIsManager, selectTeamMembers, selectLoadingTeam, fetchManagerTeam, selectAllEmployees, selectLoadingAllEmployees, fetchAllEmployees, selectUserRole } from '../../../redux/employeeSlice';
import attendanceService from '../services/attendanceService';

function AttendanceForm({
  open,
  onClose,
  attendanceRecord,
  onSave,
  readOnlyFields = [],
  allowedStatuses = null
}) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectUserRole);

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
    notes: '', // <-- Change 'note' to 'notes'
  });
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errors, setErrors] = useState({});

  const isReadOnly = (fieldName) => readOnlyFields.includes(fieldName);

  // Effect to populate form when editing (Seems OK, ensure dates are parsed)
  useEffect(() => {
    if (open && attendanceRecord) {
      const checkInDate = attendanceRecord.check_in && isValid(parseISO(attendanceRecord.check_in)) ? parseISO(attendanceRecord.check_in) : null;
      const checkOutDate = attendanceRecord.check_out && isValid(parseISO(attendanceRecord.check_out)) ? parseISO(attendanceRecord.check_out) : null;
      const recordDate = attendanceRecord.date && isValid(parseISO(attendanceRecord.date)) ? parseISO(attendanceRecord.date) : new Date();
      const notes = attendanceRecord.notes || ''; // <-- Change 'note' to 'notes'
      // Log the received record to check if 'notes' is present
      console.log("Populating form with attendanceRecord:", attendanceRecord.notes);

      setFormData({
        employee: attendanceRecord.employee || '',
        date: recordDate,
        check_in: checkInDate,
        check_out: checkOutDate,
        status: attendanceRecord.status || 'present',
        notes: notes, // <-- Change 'note' to 'notes'
      });
    } else if (open && !attendanceRecord) {
      // Reset form for new record
      setFormData({
        employee: !isManager && user && !['admin', 'hr', 'director'].includes(userRole) ? user.id : '', // Pre-select self if regular employee
        date: new Date(),
        check_in: null,
        check_out: null,
        status: 'present',
        notes: '', // <-- Change 'note' to 'notes'
      });
    }
    if (open) {
        setErrors({}); // Clear errors when opening/re-opening
    }
  }, [attendanceRecord, open, isManager, user, userRole]); // Added userRole dependency

  // Effect to load employees (Seems OK)
  useEffect(() => {
    // ... (keep existing employee loading logic) ...
    if (open && user) {
        setLoadingEmployees(true);
        // console.log("AttendanceForm Employee Load Effect Triggered. User Role:", userRole, "Is Manager:", isManager);

        let employeeListToShow = [];
        let isLoading = false;

        if (isManager && !['admin', 'hr', 'director'].includes(userRole)) {
            // console.log("AttendanceForm: Using Team Members. Current teamMembers:", teamMembers);
            employeeListToShow = teamMembers || [];
            isLoading = loadingTeam === 'pending';
            if ((!teamMembers || teamMembers.length === 0) && loadingTeam === 'idle') {
                // console.log("AttendanceForm: Dispatching fetchManagerTeam");
                dispatch(fetchManagerTeam());
            }
        } else if (['admin', 'hr', 'director'].includes(userRole)) {
            // console.log("AttendanceForm: Using All Employees. Current allEmployees:", allEmployees);
            employeeListToShow = allEmployees || [];
            isLoading = loadingAllEmployees === 'pending';
            if ((!allEmployees || allEmployees.length === 0) && loadingAllEmployees === 'idle') {
                // console.log("AttendanceForm: Dispatching fetchAllEmployees");
                dispatch(fetchAllEmployees());
            }
        } else {
            // console.log("AttendanceForm: Using Self (Regular Employee). User:", user);
            employeeListToShow = user ? [{ id: user.id, first_name: user.first_name, last_name: user.last_name, eID: user.eID }] : [];
            isLoading = false;
        }

        // console.log("AttendanceForm: Setting employees for dropdown:", employeeListToShow);
        setEmployees(employeeListToShow);
        setLoadingEmployees(isLoading);

        // Pre-select employee if editing and employee is in the list
        if (attendanceRecord && attendanceRecord.employee && employeeListToShow.some(emp => emp.id === attendanceRecord.employee)) {
            // Ensure formData reflects the record's employee if it wasn't set initially
             if (formData.employee !== attendanceRecord.employee) {
                 setFormData(prev => ({ ...prev, employee: attendanceRecord.employee }));
             }
        } else if (attendanceRecord && attendanceRecord.employee && !employeeListToShow.some(emp => emp.id === attendanceRecord.employee)) {
            console.warn("Edited employee not found in the available list.");
            // Consider fetching the specific employee details if needed to display their name,
            // or ensure the backend provides enough info in the attendanceRecord itself.
            // For now, the ID might just show in the dropdown if it was set.
        } else if (!attendanceRecord && !isManager && user && !['admin', 'hr', 'director'].includes(userRole)) {
             // Ensure self is selected when creating new record as regular employee
             if (formData.employee !== user.id) {
                 setFormData(prev => ({ ...prev, employee: user.id }));
             }
        }

    } else if (!open) {
        setEmployees([]);
        setLoadingEmployees(false);
    }
  }, [open, user, isManager, userRole, teamMembers, allEmployees, loadingTeam, loadingAllEmployees, dispatch, attendanceRecord, formData.employee]); // Added formData.employee


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
     if (errors.form) { // Clear general form error on any change
        setErrors(prev => ({ ...prev, form: null }));
    }
  };

  const handleDateChange = (name, date) => {
    const valueToSet = date && isValid(date) ? date : null;
    setFormData(prev => ({ ...prev, [name]: valueToSet }));
     if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
     if (errors.form) { // Clear general form error on any change
        setErrors(prev => ({ ...prev, form: null }));
    }
     // Clear check_out error if check_in changes
     if (name === 'check_in' && errors.check_out === "Check-out time must be after check-in time.") {
         setErrors(prev => ({ ...prev, check_out: null }));
     }
  };

   const validateForm = () => {
    let tempErrors = {};
    // Only validate if the field is *not* read-only
    if (!isReadOnly('employee') && !formData.employee) tempErrors.employee = "Employee is required.";
    if (!isReadOnly('date') && !formData.date) tempErrors.date = "Date is required.";
    if (!isReadOnly('status') && !formData.status) tempErrors.status = "Status is required.";

    // Validate check_out is after check_in only if both are set and *neither* is read-only
    if (!isReadOnly('check_in') && !isReadOnly('check_out') &&
        formData.check_in && formData.check_out &&
        isValid(formData.check_in) && isValid(formData.check_out) && // Ensure they are valid dates
        formData.check_out <= formData.check_in) {
        tempErrors.check_out = "Check-out time must be after check-in time.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const formatDateTimeForAPI = (date) => {
        return date && isValid(date) ? date.toISOString() : null;
    };
     const formatDateForAPI = (date) => {
        return date && isValid(date) ? format(date, 'yyyy-MM-dd') : null;
    };

    // Construct the data payload directly from formData
    // Ensure all relevant fields are included
    const dataToSend = {
      employee: formData.employee,
      date: formatDateForAPI(formData.date),
      check_in: formatDateTimeForAPI(formData.check_in),
      check_out: formatDateTimeForAPI(formData.check_out),
      status: formData.status,
      notes: formData.notes, // <-- Change 'note' to 'notes'
    };

    // --- REMOVED THE DELETION LOGIC ---
    // No longer deleting fields based on isReadOnly here.
    // The 'disabled' prop prevents user edits, but we send the data as is.

    try {
      setLoadingEmployees(true); // Use a more general loading state if preferred
      if (attendanceRecord && attendanceRecord.id) {
        console.log("Updating record:", attendanceRecord.id, dataToSend); // Log data being sent
        // Add the ID to the dataToSend for PATCH if your backend expects it in the body (uncommon for PATCH)
        // Or ensure the service uses the ID in the URL correctly.
        const updated = await attendanceService.updateAttendanceRecord(attendanceRecord.id, dataToSend);
        onSave(updated);
      } else {
        console.log("Creating record:", dataToSend); // Log data being sent
        if (!dataToSend.employee && !isReadOnly('employee')) {
             setErrors(prev => ({ ...prev, employee: 'Employee must be selected to create a record.' }));
             setLoadingEmployees(false);
             return;
        }
        const created = await attendanceService.createAttendanceRecord(dataToSend);
         onSave(created);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save attendance record", err.response?.data || err.message);
      // Extract specific field errors if the backend provides them
      const backendErrors = err.response?.data;
      if (typeof backendErrors === 'object' && backendErrors !== null) {
          // Map backend field names to frontend field names if necessary
          setErrors(prev => ({ ...prev, ...backendErrors, form: `Failed to save record. Check fields above.` }));
      } else {
          setErrors(prev => ({ ...prev, form: `Failed to save record: ${backendErrors?.detail || err.message || 'Please try again.'}` }));
      }
    } finally {
        setLoadingEmployees(false);
    }
  };

  // Memoize status options (Seems OK)
  const statusOptions = useMemo(() => {
    // ... (keep existing status options logic) ...
    const allOptions = [
      { value: 'present', label: 'Present' },
      { value: 'absent', label: 'Absent' },
      { value: 'leave', label: 'Leave' },
      { value: 'remote', label: 'Remote' },
      { value: 'half_day', label: 'Half Day' },
    ];
    if (allowedStatuses) {
      return allOptions.filter(option => allowedStatuses.includes(option.value));
    }
    return allOptions;
  }, [allowedStatuses]);

  // **NEW**: Calculate total duration
  const totalDuration = useMemo(() => {
    const { check_in, check_out } = formData;
    if (check_in && check_out && isValid(check_in) && isValid(check_out) && check_out > check_in) {
      const minutes = differenceInMinutes(check_out, check_in);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      let durationString = '';
      if (hours > 0) {
        durationString += `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      if (remainingMinutes > 0) {
        durationString += `${hours > 0 ? ' ' : ''}${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
      }
      return durationString || '0 minutes'; // Handle case where difference is < 1 minute
    }
    return 'N/A'; // Return N/A if times are invalid or checkout is not after checkin
  }, [formData.check_in, formData.check_out]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{attendanceRecord ? 'Edit Attendance Record' : 'Add Attendance Record'}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Employee Selection */}
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
                  disabled={isReadOnly('employee') || (!isManager && !['admin', 'hr', 'director'].includes(userRole)) || loadingEmployees}
                  // readOnly={isReadOnly('employee')} // Select doesn't have a readOnly prop, disabled is sufficient
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

            {/* Date Picker */}
             <Grid item xs={12} sm={6}> {/* Adjusted grid size */}
               <DatePicker
                 label="Date"
                 value={formData.date}
                 onChange={(newValue) => handleDateChange('date', newValue)}
                 disabled={isReadOnly('date')}
                 readOnly={isReadOnly('date')} // Keep for visual consistency if desired
                 slotProps={{
                   textField: {
                     fullWidth: true,
                     error: !!errors.date,
                     helperText: errors.date,
                   }
                 }}
                 inputFormat="yyyy-MM-dd" // Recommended format prop
                 mask="____-__-__"
               />
             </Grid>

             {/* **NEW**: Total Duration Display */}
             <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FormControl fullWidth variant="standard"> {/* Use standard variant for display */}
                    <InputLabel shrink htmlFor="total-duration-display" sx={{ position: 'relative', transform: 'none' }}>Total Duration</InputLabel>
                    <Typography id="total-duration-display" sx={{ pt: 1, pb: 0.5, minHeight: '1.4375em' }}> {/* Adjust padding/height */}
                        {totalDuration}
                    </Typography>
                </FormControl>
                {/* Alternative using disabled TextField:
                 <TextField
                    label="Total Duration"
                    value={totalDuration}
                    fullWidth
                    disabled // Make it non-interactive
                    InputProps={{ readOnly: true }} // Visually read-only
                    variant="filled" // Or standard, to look different from editable fields
                 />
                 */}
             </Grid>


             {/* Check-in Time */}
             <Grid item xs={12} sm={6}>
               <DateTimePicker
                 label="Check-in Time"
                 value={formData.check_in}
                 onChange={(newValue) => handleDateChange('check_in', newValue)}
                 disabled={isReadOnly('check_in')}
                 readOnly={isReadOnly('check_in')}
                 slotProps={{
                   textField: {
                     fullWidth: true,
                     error: !!errors.check_in,
                     helperText: errors.check_in,
                   }
                 }}
               />
             </Grid>

             {/* Check-out Time */}
             <Grid item xs={12} sm={6}>
               <DateTimePicker
                 label="Check-out Time"
                 value={formData.check_out}
                 onChange={(newValue) => handleDateChange('check_out', newValue)}
                 disabled={isReadOnly('check_out')}
                 readOnly={isReadOnly('check_out')}
                 slotProps={{
                   textField: {
                     fullWidth: true,
                     error: !!errors.check_out,
                     helperText: errors.check_out,
                   }
                 }}
                 minDateTime={formData.check_in && isValid(formData.check_in) ? formData.check_in : undefined} // Ensure check-out is after check-in
               />
             </Grid>

             {/* Status Selection */}
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
                   disabled={isReadOnly('status')}
                   // readOnly={isReadOnly('status')} // Select doesn't have readOnly
                 >
                   {statusOptions.map(option => (
                     <MenuItem key={option.value} value={option.value}>
                       {option.label}
                     </MenuItem>
                   ))}
                   {statusOptions.length === 0 && <MenuItem disabled>No statuses available</MenuItem>}
                 </Select>
                 {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
               </FormControl>
             </Grid>

             {/* Note Field */}
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Note (Optional)"
                 name="notes" // <-- Change 'note' to 'notes'
                 value={formData.notes} // <-- Change 'note' to 'notes'
                 onChange={handleChange}
                 multiline
                 rows={3}
                 disabled={isReadOnly('notes')} // <-- Change 'note' to 'notes'
                 InputProps={{
                    readOnly: isReadOnly('notes'), // <-- Change 'note' to 'notes'
                 }}
                 error={!!errors.notes} // <-- Change 'note' to 'notes'
                 helperText={errors.notes} // <-- Change 'note' to 'notes'
               />
             </Grid>
             {/* Display general form error */}
             {errors.form && <Grid item xs={12}><FormHelperText error sx={{ textAlign: 'center', mt: 1 }}>{errors.form}</FormHelperText></Grid>}
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {/* Disable Save button if any field is read-only? Or allow saving unchanged data? */}
        {/* Current logic allows saving even if fields are read-only, sending their current values */}
        <Button onClick={handleSubmit} variant="contained" disabled={loadingEmployees}>
            {loadingEmployees ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AttendanceForm;