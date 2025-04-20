import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { selectIsManager, selectRole, selectTeamMembers, selectLoadingTeam, fetchManagerTeam } from '../../../redux/employeeSlice';
import PermissionGate from '../../../components/PermissionGate';
import {
  Box, Typography, Grid, Paper, Button, Card, CardContent, Divider, useTheme, useMediaQuery, IconButton, Menu, MenuItem, Alert,
  Tabs, Tab // Import Tabs and Tab
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FilterListIcon from "@mui/icons-material/FilterList";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; // Icon for Calendar tab
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icon for List tab
import AttendanceList from "../components/AttendanceList"; // Updated AttendanceList
import AttendanceForm from "../components/AttendanceForm";
// import TeamAttendanceCalendar from "../components/TeamAttendanceCalendar"; // Import the new component
import TeamAttendanceCalendar from "../components/TeamAttendanceCalender";
import attendanceService from '../services/attendanceService';
import { isTokenValid, redirectToLogin } from '../../../utils/authUtils';
import { format, isToday, parseISO } from 'date-fns';
// import { fetchTeamAttendanceApi, updateAttendanceApi } from '../api'; // Your API functions

const AttendanceDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [openAttendanceForm, setOpenAttendanceForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // State for view toggle: 'list' or 'calendar'

  // Redux selectors
  const dispatch = useDispatch();
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);
  const teamMembers = useSelector(selectTeamMembers);
  const loadingTeam = useSelector(selectLoadingTeam);

  // State for attendance data
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!isTokenValid()) { redirectToLogin(); return; }
      try {
        setLoading(true);
        setError(null);
        // Fetch all records - filtering happens client-side
        // Consider adding pagination/date range params here if data becomes very large
        const response = await attendanceService.getAttendanceRecords();
        console.log('Fetched ALL attendance data:', response);
        if (response && (response.results || Array.isArray(response))) {
          setAllAttendanceData(response.results || response);
        } else {
          setAllAttendanceData([]);
        }
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data');
        if (err.response?.status === 401) {
          redirectToLogin();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceData();
  }, []);

  // Filter data for manager's team
  const managerTeamAttendanceData = useMemo(() => {
    if (!isManager || !teamMembers || teamMembers.length === 0) return [];
    const teamMemberIds = new Set(teamMembers.map(member => member.id).filter(id => id != null));
    if (teamMemberIds.size === 0) return [];
    return allAttendanceData.filter(record => {
        const employeeId = record?.employee;
        return employeeId != null && teamMemberIds.has(employeeId);
    });
  }, [isManager, teamMembers, allAttendanceData]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const dataToUse = isManager ? managerTeamAttendanceData : allAttendanceData;
    const todayRecords = dataToUse.filter(record => record.date && isToday(parseISO(record.date))); // Use parseISO
    const present = todayRecords.filter(r => r.status === 'present' || r.status === 'remote' || r.status === 'half_day').length;
    const absent = todayRecords.filter(r => r.status === 'absent').length;
    const leave = todayRecords.filter(r => r.status === 'leave').length;
    const total = isManager ? teamMembers.length : (new Set(dataToUse.map(r => r.employee))).size;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { totalEmployees: total, presentToday: present, absentToday: absent, onLeave: leave, attendanceRate: rate };
  }, [isManager, managerTeamAttendanceData, allAttendanceData, teamMembers]);

  // Handlers
  const handleOpenMobileMenu = (event) => setMobileMenuAnchor(event.currentTarget);
  const handleCloseMobileMenu = () => setMobileMenuAnchor(null);
  const handleOpenAttendanceForm = (record = null) => {
    if (record && !isManager) return;
    setSelectedRecord(record);
    setOpenAttendanceForm(true);
    handleCloseMobileMenu();
  };
  const handleCloseAttendanceForm = () => {
    setOpenAttendanceForm(false);
    setSelectedRecord(null);
  };
  const handleAttendanceSaved = async (savedRecord) => { // Renamed from handleSaveAttendance for clarity if used by both
    console.log("Parent received save/update request:", savedRecord);
    // If the record came from the form (might be new or existing)
    // If it came from the calendar list click, it should have an ID
    const isUpdating = savedRecord && savedRecord.id;

    try {
      let resultRecord;
      if (isUpdating) {
        // Call the API to update the record
        resultRecord = await attendanceService.updateAttendanceRecord(savedRecord.id, savedRecord);
        console.log("Backend update successful:", resultRecord);
      } else {
        // Call the API to create a new record (if adding via main button)
        // Assuming your service has a create method
        // resultRecord = await attendanceService.createAttendanceRecord(savedRecord);
        // console.log("Backend create successful:", resultRecord);
        // For now, let's focus on the update from the calendar
        // If you only update existing records from the calendar, you might not need the create logic here.
        // If the "Add Record" button uses this same handler, you'll need the create logic.
        // Let's assume for now this handler is primarily for UPDATES from the calendar/list edit.
         if (!savedRecord.id) {
             console.error("Attempted to save record without ID via handleAttendanceSaved. This handler might be intended for updates only.");
             setError("Error: Cannot update record without an ID.");
             return; // Prevent further execution
         }
         // If the main "Add Record" button uses a different handler or sets state differently, adjust accordingly.
         // If it DOES use this handler, you need the create API call here.
         // For safety, let's re-fetch if it was potentially a create operation from the main button
         console.log("Record might be new (no ID initially passed?), re-fetching data.");
         await loadData(); // Fallback to refetch if unsure if it was create or update
         handleCloseAttendanceForm();
         return;

      }


      // *** Update the local state ***
      setAllAttendanceData(prevData => {
        const index = prevData.findIndex(item => item.id === resultRecord.id);
        if (index > -1) {
          // Update existing record
          const updatedData = [...prevData];
          updatedData[index] = { ...updatedData[index], ...resultRecord }; // Merge updates, ensure all fields are present
          return updatedData;
        } else {
          // Add new record (if create logic was added above)
          // return [resultRecord, ...prevData].sort((a, b) => new Date(b.date) - new Date(a.date));
          // If only handling updates here, this else might not be reached or needed.
          // If it IS reached unexpectedly, log it.
          console.warn("Updated record ID not found in existing data. Adding to start.");
          return [resultRecord, ...prevData]; // Add to list if somehow not found
        }
      });

      handleCloseAttendanceForm(); // Close form after successful save + state update

      // Optional: Show success message
      // showSnackbar('Attendance updated successfully!', 'success');

    } catch (error) {
      console.error("Error saving/updating attendance:", error);
      setError(`Failed to ${isUpdating ? 'update' : 'save'} attendance record.`); // Set error state
      // Handle error display (e.g., showSnackbar('Failed to update attendance.', 'error'))
      // Consider *not* closing the form on error, so the user can retry
    }
  };
  const handleViewChange = (event, newValue) => {
    setCurrentView(newValue);
  };

  // Function to fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Refetch attendance records using the same service call as initial load
      const attendanceRes = await attendanceService.getAttendanceRecords();

      // Use the correct state setter: setAllAttendanceData
      setAllAttendanceData(attendanceRes?.results || attendanceRes || []); // <-- FIX HERE

      // No need to fetch team members here if they come from Redux state

      setError(null); // Clear error on successful refetch
    } catch (error) {
      console.error("Error refetching data:", error);
      setError('Failed to reload attendance data after update.'); // Set specific error
    } finally {
      setLoading(false);
    }
  }, []); // Add dependencies if needed (e.g., selected team ID)

  // useEffect(() => {
  //   loadData();
  //   // Fetch team members if not done in loadData
  //   // fetchTeamMembersApi().then(res => setTeamMembers(res.data || []));
  // }, [loadData]); // Re-run if loadData changes (e.g., due to dependency change)

  // StatCard component (remains the same)
  const StatCard = ({ icon, title, value, color }) => (
      <Card elevation={0} sx={{ height: "100%", border: `1px solid ${theme.palette.divider}`, borderLeft: `4px solid ${color}`, borderRadius: 1 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography color="text.secondary" variant="subtitle2" sx={{ mb: 1 }}>{title}</Typography>
            <Box sx={{ background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", borderRadius: "50%", p: { xs: 0.5, sm: 1 }, display: "flex" }}>{icon}</Box>
          </Box>
          <Typography variant={isMobile ? "h6" : isTablet ? "h5" : "h4"} component="div">{value}</Typography>
        </CardContent>
      </Card>
  );

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Debug Panel (optional) */}
      {/* <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>...</Paper> */}

      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 2, mb: { xs: 2, sm: 3 } }}>
          <Typography variant={isMobile ? "h5" : "h4"} component="h1">Attendance Management</Typography>
          <PermissionGate requiredRole="manager">
            {/* Add Record Button / Mobile Menu */}
            {isMobile ? (
              <>
                {/* Mobile buttons/menu */}
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
                   <IconButton onClick={handleOpenMobileMenu}><MoreVertIcon /></IconButton>
                   <Menu anchorEl={mobileMenuAnchor} open={Boolean(mobileMenuAnchor)} onClose={handleCloseMobileMenu} PaperProps={{ elevation: 3, sx: { width: 200 } }}>
                     <MenuItem onClick={() => handleOpenAttendanceForm()}><AddIcon fontSize="small" sx={{ mr: 1 }} />Add Record</MenuItem>
                     {/* Add Filter menu item if needed */}
                   </Menu>
                </Box>
              </>
            ) : (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAttendanceForm()}>Add Record</Button>
            )}
          </PermissionGate>
        </Box>
      </Box>

      {/* Stats cards */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}><StatCard icon={<PeopleAltIcon color="primary" fontSize={isMobile ? "small" : "medium"} />} title={isManager ? "Team Size" : "Total Employees"} value={summary.totalEmployees} color={theme.palette.primary.main} /></Grid>
        <Grid item xs={6} sm={6} md={3}><StatCard icon={<CheckCircleIcon color="success" fontSize={isMobile ? "small" : "medium"} />} title="Present Today" value={summary.presentToday} color={theme.palette.success.main} /></Grid>
        <Grid item xs={6} sm={6} md={3}><StatCard icon={<EventBusyIcon color="error" fontSize={isMobile ? "small" : "medium"} />} title="Absent Today" value={summary.absentToday} color={theme.palette.error.main} /></Grid>
        <Grid item xs={6} sm={6} md={3}><StatCard icon={<WorkOutlineIcon color="warning" fontSize={isMobile ? "small" : "medium"} />} title="On Leave" value={summary.onLeave} color={theme.palette.warning.main} /></Grid>
      </Grid>

      {/* View Toggle Tabs (Only for Managers) */}
      {isManager && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentView} onChange={handleViewChange} aria-label="Attendance view tabs">
            <Tab icon={<ListAltIcon />} iconPosition="start" label="List View" value="list" />
            <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Calendar View" value="calendar" />
          </Tabs>
        </Box>
      )}

      {/* Conditional Rendering based on View */}
      {currentView === 'list' || !isManager ? (
        // List View (Now includes sorting and filtering)
        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, mb: 2, p: { xs: 1, sm: 2, md: 3 } }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>
            {isManager ? "Team Attendance Records" : "Attendance Records"}
          </Typography>
          <Divider sx={{ mb: 2 }}/>
          <AttendanceList
            attendanceData={isManager ? managerTeamAttendanceData : allAttendanceData}
            loading={loading || (isManager && loadingTeam === 'pending')}
            error={error || (isManager && loadingTeam === 'failed' ? 'Failed to load team members' : null)}
            onEdit={isManager ? handleOpenAttendanceForm : undefined}
            isMobile={isMobile}
            personalView={false}
          />
        </Paper>
      ) : (
        // Calendar View (Only shown if currentView is 'calendar' AND isManager)
        <Paper elevation={0} sx={{ p: { xs: 1, sm: 2, md: 3 }, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, mb: 2 }}>
           <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>Team Attendance Calendar</Typography>
           <Divider sx={{ mb: 2 }}/>
          <TeamAttendanceCalendar
            teamAttendanceData={managerTeamAttendanceData}
            teamMembers={teamMembers}
            loading={loading || loadingTeam === 'pending'}
            onSave={handleAttendanceSaved} // <-- Pass the save handler here
          />
        </Paper>
      )}

      {/* Form dialog */}
      <AttendanceForm
        open={openAttendanceForm}
        onClose={handleCloseAttendanceForm}
        attendanceRecord={selectedRecord}
        onSave={handleAttendanceSaved}
      />
    </Box>
  );
};

export default AttendanceDashboard;
