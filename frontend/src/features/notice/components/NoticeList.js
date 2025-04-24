// filepath: frontend/src/features/notice/components/NoticeList.js
import React from 'react';
import {
    Box, Typography, Paper, CircularProgress, Chip, Tooltip, Stack, Grid, useTheme, Alert
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import GroupIcon from '@mui/icons-material/Group'; // Team
import BusinessIcon from '@mui/icons-material/Business'; // Department/Company
import PersonIcon from '@mui/icons-material/Person'; // Direct
import { format, parseISO } from 'date-fns';

const NoticeList = ({
    title,
    notices = [],
    loading,
    error,
    onNoticeClick, // Function to handle click -> open detail
}) => {
    const theme = useTheme();

    const getPriorityChip = (priority) => {
        // ... (same as in widget)
         let color = 'default';
        let label = priority;
        switch (priority) {
            case 'urgent': color = 'error'; label = 'Urgent'; break;
            case 'important': color = 'warning'; label = 'Important'; break;
            default: return null; // Don't show chip for normal
        }
        return <Chip label={label} color={color} size="small" sx={{ textTransform: 'capitalize', height: 22 }} />;
    };

    const getScopeIcon = (scope) => {
        switch (scope) {
            case 'company': return <Tooltip title="Company Wide"><BusinessIcon fontSize="small" color="action" /></Tooltip>;
            case 'department': return <Tooltip title="Department"><BusinessIcon fontSize="small" color="action" /></Tooltip>;
            case 'team': return <Tooltip title="Team"><GroupIcon fontSize="small" color="action" /></Tooltip>;
            case 'direct': return <Tooltip title="Direct Message"><PersonIcon fontSize="small" color="action" /></Tooltip>;
            default: return null;
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

    if (loading) {
        return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
    }

    if (error) {
         return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    if (!notices || notices.length === 0) {
        return <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>No notices found in this category.</Typography>;
    }

    return (
        <Box>
            {title && <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>{title}</Typography>}
            <Stack spacing={2}>
                {notices.map((notice) => (
                    <Paper
                        key={notice.id}
                        onClick={() => onNoticeClick(notice)}
                        elevation={1}
                        sx={{
                            p: 2,
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'scale(1.01)',
                                boxShadow: theme.shadows[4],
                            },
                        }}
                    >
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm>
                                <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                                    {notice.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {getScopeIcon(notice.scope)}
                                    By {notice.author_name} • {formatDate(notice.created_at)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm="auto" sx={{ textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 1, sm: 0 } }}>
                                {getPriorityChip(notice.priority)}
                            </Grid>
                            {/* Optional: Show snippet of content */}
                            {/* <Grid item xs={12}>
                                <Typography variant="body2" noWrap sx={{ mt: 1 }}>
                                    {notice.content}
                                </Typography>
                            </Grid> */}
                        </Grid>
                    </Paper>
                ))}
            </Stack>
        </Box>
    );
};

export default NoticeList;