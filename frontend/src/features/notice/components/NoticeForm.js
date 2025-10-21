// filepath: frontend/src/features/notice/components/NoticeForm.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem, FormHelperText, CircularProgress, Alert, Box
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { createNotice, resetNoticeActionStatus, selectNoticeActionLoading, selectNoticeActionError } from '../slices/noticeSlice';
import { selectUser, selectIsManager, selectUserRole, selectTeamMembers, selectAllEmployees } from '../../../redux/employeeSlice'; // Assuming these exist

// TODO: Fetch departments if needed

const NoticeForm = ({ open, onClose }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const isManager = useSelector(selectIsManager);
    const userRole = useSelector(selectUserRole);
    const teamMembers = useSelector(selectTeamMembers); // Assuming fetched elsewhere
    const allEmployees = useSelector(selectAllEmployees); // Assuming fetched elsewhere

    const loading = useSelector(selectNoticeActionLoading);
    const error = useSelector(selectNoticeActionError);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal',
        scope: '', // Determined by role
        target_id: '', // ID for team, department, or employee
    });
    const [errors, setErrors] = useState({});

    // Determine available scopes based on role
    const availableScopes = React.useMemo(() => {
        const scopes = [{ value: 'company', label: 'Company Wide' }];
        if (isManager || ['admin', 'hr', 'director'].includes(userRole)) {
            scopes.push({ value: 'department', label: 'Department Wide' });
            scopes.push({ value: 'team', label: 'Team Wide' });
            scopes.push({ value: 'direct', label: 'Direct to Employee' });
        } else {
            // Regular employee can post to company or their team (if applicable)
            // scopes.push({ value: 'team', label: 'My Team' }); // Add logic if user has teamId
        }
        return scopes;
    }, [isManager, userRole]);

    // Reset form and errors when dialog opens/closes
    useEffect(() => {
        if (open) {
            setFormData({
                title: '',
                content: '',
                priority: 'normal',
                scope: availableScopes.length > 0 ? availableScopes[0].value : '', // Default scope
                target_id: '',
            });
            setErrors({});
            dispatch(resetNoticeActionStatus()); // Clear previous action errors
        }
    }, [open, dispatch, availableScopes]);

    // Clear errors on change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
         // Reset target if scope changes
        if (name === 'scope') {
            setFormData(prev => ({ ...prev, target_id: '' }));
        }
         if (errors.form) {
             setErrors(prev => ({ ...prev, form: null }));
         }
    };

    const validateForm = () => {
        let tempErrors = {};
        if (!formData.title.trim()) tempErrors.title = 'Title is required.';
        if (!formData.content.trim()) tempErrors.content = 'Content is required.';
        if (!formData.scope) tempErrors.scope = 'Scope is required.';
        if (['team', 'department', 'direct'].includes(formData.scope) && !formData.target_id) {
            tempErrors.target_id = `Please select a target ${formData.scope}.`;
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const noticeData = {
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            scope: formData.scope,
            // Set the correct target field based on scope
            target_team_id: formData.scope === 'team' ? formData.target_id : null,
            target_department_id: formData.scope === 'department' ? formData.target_id : null,
            target_employee_id: formData.scope === 'direct' ? formData.target_id : null,
            // author_id will be set by backend or thunk using logged-in user
        };

        const resultAction = await dispatch(createNotice(noticeData));
        if (createNotice.fulfilled.match(resultAction)) {
            onClose(); // Close on success
        }
        // Error is handled by displaying the 'error' state below
    };

    // Determine target options based on scope
    const getTargetOptions = () => {
        switch (formData.scope) {
            case 'team':
                // TODO: Fetch list of teams if not available
                // For now, use manager's team if applicable, or provide placeholder
                return teamMembers ? [{ id: user?.teamId || 'mockTeam1', name: `Team ${user?.teamId || 'Mock Team 1'}` }] : []; // Example
            case 'department':
                // TODO: Fetch list of departments
                return [{ id: 1, name: 'Engineering' }, { id: 2, name: 'Marketing' }]; // Example
            case 'direct':
                // Use allEmployees or teamMembers based on role
                const employeeList = (isManager && !['admin', 'hr', 'director'].includes(userRole)) ? teamMembers : allEmployees;
                return (employeeList || []).map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` }));
            default:
                return [];
        }
    };
    const targetOptions = getTargetOptions();


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Notice</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                error={!!errors.title}
                                helperText={errors.title}
                                required
                                disabled={loading === 'pending'}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Content"
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                error={!!errors.content}
                                helperText={errors.content}
                                required
                                multiline
                                rows={4}
                                disabled={loading === 'pending'}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errors.priority}>
                                <InputLabel id="priority-label">Priority</InputLabel>
                                <Select
                                    labelId="priority-label"
                                    name="priority"
                                    value={formData.priority}
                                    label="Priority"
                                    onChange={handleChange}
                                    disabled={loading === 'pending'}
                                >
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="important">Important</MenuItem>
                                    <MenuItem value="urgent">Urgent</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                         <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errors.scope}>
                                <InputLabel id="scope-label">Scope</InputLabel>
                                <Select
                                    labelId="scope-label"
                                    name="scope"
                                    value={formData.scope}
                                    label="Scope"
                                    onChange={handleChange}
                                    disabled={loading === 'pending'}
                                    required
                                >
                                    {availableScopes.map(scope => (
                                        <MenuItem key={scope.value} value={scope.value}>{scope.label}</MenuItem>
                                    ))}
                                </Select>
                                 {errors.scope && <FormHelperText>{errors.scope}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        {/* Conditional Target Selection */}
                        {['team', 'department', 'direct'].includes(formData.scope) && (
                            <Grid item xs={12}>
                                <FormControl fullWidth error={!!errors.target_id}>
                                    <InputLabel id="target-label">Target {formData.scope}</InputLabel>
                                    <Select
                                        labelId="target-label"
                                        name="target_id"
                                        value={formData.target_id}
                                        label={`Target ${formData.scope}`}
                                        onChange={handleChange}
                                        disabled={loading === 'pending' || targetOptions.length === 0}
                                        required
                                    >
                                        {targetOptions.length === 0 && <MenuItem disabled>No targets available</MenuItem>}
                                        {targetOptions.map(option => (
                                            <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.target_id && <FormHelperText>{errors.target_id}</FormHelperText>}
                                </FormControl>
                            </Grid>
                        )}

                        {/* Display general form error */}
                        {error && (
                            <Grid item xs={12}>
                                <Alert severity="error">{typeof error === 'string' ? error : 'Failed to create notice.'}</Alert>
                            </Grid>
                        )}
                         {errors.form && (
                            <Grid item xs={12}>
                                <Alert severity="error">{errors.form}</Alert>
                            </Grid>
                        )}
                    </Grid>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading === 'pending'}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading === 'pending'}>
                    {loading === 'pending' ? <CircularProgress size={24} /> : 'Create Notice'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NoticeForm;