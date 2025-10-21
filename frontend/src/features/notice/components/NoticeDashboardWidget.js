// filepath: frontend/src/features/notice/components/NoticeDashboardWidget.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Card, CardHeader, CardContent, List, ListItem, ListItemText,
    Skeleton, Alert, Button, useTheme, Chip, Tooltip, Divider, IconButton
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign'; // Notice icon
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fetchNotices, selectRecentNotices, selectNoticeLoading, selectNoticeError } from '../slices/noticeSlice';

const NoticeDashboardWidget = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const recentNotices = useSelector(selectRecentNotices);
    const loading = useSelector(selectNoticeLoading);
    const error = useSelector(selectNoticeError);
    const hasLoaded = recentNotices.length > 0 || error; // Check if data (or error) exists

    useEffect(() => {
        // Fetch notices only if not already loading or succeeded
        if (loading === 'idle') {
            dispatch(fetchNotices());
        }
    }, [dispatch, loading]);

    const getPriorityChip = (priority) => {
        let color = 'default';
        let label = priority;
        switch (priority) {
            case 'urgent': color = 'error'; label = 'Urgent'; break;
            case 'important': color = 'warning'; label = 'Important'; break;
            default: color = 'info'; label = 'Normal'; break; // Or hide for normal
        }
        return <Chip label={label} color={color} size="small" sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }} />;
    };

    const renderNoticeList = () => {
        if (loading === 'pending' && !hasLoaded) {
            return Array.from(new Array(3)).map((_, index) => (
                <ListItem key={index} disablePadding sx={{ px: 1, py: 0.5 }}>
                    <ListItemText
                        primary={<Skeleton variant="text" width="70%" />}
                        secondary={<Skeleton variant="text" width="40%" />}
                    />
                </ListItem>
            ));
        }

        if (error) {
            return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
        }

        if (recentNotices.length === 0) {
            return (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                    <CampaignIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">No recent notices</Typography>
                </Box>
            );
        }

        return recentNotices.map((notice) => (
            <ListItem
                key={notice.id}
                disablePadding
                sx={{
                    px: 1, py: 0.5, mb: 0.5, borderRadius: 1, transition: '0.2s',
                    '&:hover': { bgcolor: theme.palette.action.hover }
                }}
                // Add onClick to open detail dialog later if needed from widget
            >
                <ListItemText
                    primary={
                        <Tooltip title={notice.title} placement="top-start">
                            <Typography variant="body2" fontWeight={500} noWrap>
                                {notice.title}
                            </Typography>
                        </Tooltip>
                    }
                    secondary={
                        <Typography variant="caption" color="text.secondary">
                            By {notice.author_name} • {formatDistanceToNow(parseISO(notice.created_at), { addSuffix: true })}
                        </Typography>
                    }
                />
                {getPriorityChip(notice.priority)}
            </ListItem>
        ));
    };

    return (
        <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Recent Notices</Typography>
                        {/* Optional: Add a badge for unread count later */}
                    </Box>
                }
                action={
                    <Tooltip title="View All Notices">
                        <IconButton component={RouterLink} to="/notices" size="small">
                            <ArrowForwardIcon />
                        </IconButton>
                    </Tooltip>
                }
                sx={{ pb: 0 }}
            />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1, pt: 0 }}>
                <List dense disablePadding sx={{ flexGrow: 1 }}>
                    {renderNoticeList()}
                </List>
                {recentNotices.length > 0 && !error && (
                     <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, p:1 }}>
                        <Button
                            component={RouterLink}
                            to="/notices"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                        >
                            View All
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default NoticeDashboardWidget;