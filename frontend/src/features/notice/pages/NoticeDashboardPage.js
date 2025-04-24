import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography, Button, Tabs, Tab, CircularProgress, Alert, Paper, useTheme, useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import NoticeList from '../components/NoticeList';
import NoticeDetailDialog from '../components/NoticeDetailDialog';
import NoticeForm from '../components/NoticeForm';
import {
    fetchNotices,
    selectCompanyNotices,
    selectDepartmentNotices,
    selectTeamNotices,
    selectDirectNotices,
    selectNoticeLoading,
    selectNoticeError,
    selectCurrentNoticeDetails,
    clearCurrentNoticeDetails,
    fetchNoticeDetails,
    resetNoticeActionStatus,
    selectNoticeActionLoading,
} from '../slices/noticeSlice';
import { selectUserRole, selectIsManager } from '../../../redux/employeeSlice'; // For role-based display

function NoticeDashboardPage() {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Selectors
    const userRole = useSelector(selectUserRole);
    const isManager = useSelector(selectIsManager);
    const companyNotices = useSelector(selectCompanyNotices);
    const departmentNotices = useSelector(selectDepartmentNotices);
    const teamNotices = useSelector(selectTeamNotices);
    const directNotices = useSelector(selectDirectNotices);
    const loading = useSelector(selectNoticeLoading);
    const error = useSelector(selectNoticeError);
    const currentNotice = useSelector(selectCurrentNoticeDetails);
    const actionLoading = useSelector(selectNoticeActionLoading); // For disabling create button

    // State
    const [activeTab, setActiveTab] = useState(0);
    const [openCreateForm, setOpenCreateForm] = useState(false);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    // No need for selectedNoticeId, use currentNotice from slice

    // Determine which tabs to show
    const showDepartmentTab = isManager || ['admin', 'hr', 'director'].includes(userRole);
    const showTeamTab = isManager || ['admin', 'hr', 'director'].includes(userRole); // Or if employee belongs to a team
    const showDirectTab = true; // Everyone might receive direct messages

    // Adjust tab indices based on visibility
    let tabIndexMap = { 0: 'company' };
    let currentTabIndex = 1;
    if (showDepartmentTab) tabIndexMap[currentTabIndex++] = 'department';
    if (showTeamTab) tabIndexMap[currentTabIndex++] = 'team';
    if (showDirectTab) tabIndexMap[currentTabIndex++] = 'direct';

    const getTabIndex = (scope) => {
        return Object.keys(tabIndexMap).find(key => tabIndexMap[key] === scope);
    }

    // Fetch data on mount
    useEffect(() => {
        dispatch(fetchNotices());
    }, [dispatch]);

    // Handlers
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleOpenCreateForm = () => {
        dispatch(resetNoticeActionStatus()); // Clear any previous errors
        setOpenCreateForm(true);
    };

    const handleCloseCreateForm = () => {
        setOpenCreateForm(false);
        // Optional: refetch notices if creation might change view significantly
        // dispatch(fetchNotices());
    };

    const handleOpenDetailDialog = (notice) => {
        dispatch(fetchNoticeDetails(notice.id)); // Fetch details when opening
        setOpenDetailDialog(true);
    };

    const handleCloseDetailDialog = () => {
        setOpenDetailDialog(false);
        // Delay clearing details slightly to avoid flicker during closing animation
        setTimeout(() => {
            dispatch(clearCurrentNoticeDetails());
        }, 300);
    };

     const handleRefresh = () => {
        dispatch(fetchNotices());
    };

    const renderTabContent = () => {
        const currentScope = tabIndexMap[activeTab];
        switch (currentScope) {
            case 'company':
                return <NoticeList notices={companyNotices} loading={loading === 'pending'} error={error} onNoticeClick={handleOpenDetailDialog} />;
            case 'department':
                return <NoticeList notices={departmentNotices} loading={loading === 'pending'} error={error} onNoticeClick={handleOpenDetailDialog} />;
            case 'team':
                return <NoticeList notices={teamNotices} loading={loading === 'pending'} error={error} onNoticeClick={handleOpenDetailDialog} />;
            case 'direct':
                return <NoticeList notices={directNotices} loading={loading === 'pending'} error={error} onNoticeClick={handleOpenDetailDialog} />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
                    Notices & Memos
                </Typography>
                 <Box>
                     <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={loading === 'pending'}
                        sx={{ mr: 1 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateForm}
                        disabled={actionLoading === 'pending'} // Disable while create is in progress
                    >
                        Create Notice
                    </Button>
                 </Box>
            </Box>

            {/* Tabs */}
            <Paper sx={{ borderRadius: 2, mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Company Wide" />
                    {showDepartmentTab && <Tab label="Department" />}
                    {showTeamTab && <Tab label="Team" />}
                    {showDirectTab && <Tab label="Direct" />}
                </Tabs>

                <Box sx={{ p: { xs: 1, sm: 2 } }}>
                    {/* Loading Indicator for initial load */}
                    {loading === 'pending' && !companyNotices.length && !error && ( // Show only on initial load
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {/* Error Message */}
                    {error && loading !== 'pending' && ( // Show error if loading finished/failed
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {typeof error === 'string' ? error : 'Failed to load notices.'}
                        </Alert>
                    )}
                    {/* Content */}
                    {loading !== 'pending' && !error && renderTabContent()}
                     {loading === 'pending' && (companyNotices.length > 0 || departmentNotices.length > 0 || teamNotices.length > 0 || directNotices.length > 0) && (
                         // Optional: Show subtle loading indicator during refresh if needed
                         <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}><CircularProgress size={20} /></Box>
                     )}
                </Box>
            </Paper>

            {/* Dialogs */}
            <NoticeForm
                open={openCreateForm}
                onClose={handleCloseCreateForm}
            />

            <NoticeDetailDialog
                open={openDetailDialog}
                onClose={handleCloseDetailDialog}
                notice={currentNotice} // Pass the details from the slice
            />
        </Box>
    );
}

export default NoticeDashboardPage;