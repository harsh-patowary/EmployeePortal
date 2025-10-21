// filepath: frontend/src/features/notice/components/NoticeDetailDialog.js
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Tooltip, Divider, Grid, CircularProgress, Alert
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import { format, parseISO } from 'date-fns';
import { useSelector } from 'react-redux';
import { selectDetailLoading, selectDetailError } from '../slices/noticeSlice';


const DetailRow = ({ label, value }) => (
    <>
        <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">{label}:</Typography>
        </Grid>
        <Grid item xs={12} sm={9}>
            {typeof value === 'string' ? <Typography>{value}</Typography> : value}
        </Grid>
    </>
);

const NoticeDetailDialog = ({ open, onClose, notice }) => {
    const loading = useSelector(selectDetailLoading);
    const error = useSelector(selectDetailError);

    const getPriorityChip = (priority) => {
        // ... (same as in list/widget)
         let color = 'default';
        let label = priority;
        switch (priority) {
            case 'urgent': color = 'error'; label = 'Urgent'; break;
            case 'important': color = 'warning'; label = 'Important'; break;
            default: color = 'info'; label = 'Normal'; break;
        }
        return <Chip label={label} color={color} size="small" sx={{ textTransform: 'capitalize' }} />;
    };

    const getScopeDisplay = (scope, target) => {
        // In real app, fetch target names (team, dept, employee) if needed
        switch (scope) {
            case 'company': return <><BusinessIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'bottom' }} /> Company Wide</>;
            case 'department': return <><BusinessIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'bottom' }} /> Department {target ? `(ID: ${target})` : ''}</>;
            case 'team': return <><GroupIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'bottom' }} /> Team {target ? `(ID: ${target})` : ''}</>;
            case 'direct': return <><PersonIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'bottom' }} /> Direct Message {target ? `(To Employee ID: ${target})` : ''}</>;
            default: return scope;
        }
    };

     const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'MMM d, yyyy HH:mm');
        } catch (e) {
            return dateString; // Fallback
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Notice Details</DialogTitle>
            <DialogContent>
                {loading === 'pending' && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {!loading && !error && notice && (
                    <Grid container spacing={1.5} sx={{ mt: 1 }}>
                        <DetailRow label="Title" value={<Typography variant="h6">{notice.title}</Typography>} />
                        <DetailRow label="Priority" value={getPriorityChip(notice.priority)} />
                        <DetailRow label="Scope" value={getScopeDisplay(notice.scope, notice.target_team_id || notice.target_department_id || notice.target_employee_id)} />
                        <DetailRow label="Author" value={notice.author_name || 'N/A'} />
                        <DetailRow label="Date" value={formatDate(notice.created_at)} />

                        <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>Content:</Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                {notice.content || 'No content provided.'}
                            </Typography>
                        </Grid>
                    </Grid>
                )}
                 {!loading && !error && !notice && (
                     <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>Notice data not available.</Typography>
                 )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                {/* Add Edit/Delete buttons later based on permissions */}
            </DialogActions>
        </Dialog>
    );
};

export default NoticeDetailDialog;