import React, { useState, useEffect, useMemo } from "react"; // Import useMemo
import { useSelector, useDispatch } from 'react-redux'; // Import useDispatch
// Import fetchManagerTeam and relevant selectors
import { selectIsManager, selectRole, selectTeamMembers, selectLoadingTeam, fetchManagerTeam } from '../../../redux/employeeSlice'; 
import PermissionGate from '../../../components/PermissionGate';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert"; // For mobile menu
import FilterListIcon from "@mui/icons-material/FilterList";
import AttendanceList from "../components/AttendanceList";
import AttendanceForm from "../components/AttendanceForm";
import attendanceService from '../services/attendanceService'; 
import { isTokenValid, redirectToLogin } from '../../../utils/authUtils';
import { format, isToday } from 'date-fns'; // Import isToday

const AttendanceDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [openAttendanceForm, setOpenAttendanceForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  
  // Get role and team information
  const dispatch = useDispatch(); // Get dispatch function
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);
  const teamMembers = useSelector(selectTeamMembers); // Get manager's team
  const loadingTeam = useSelector(selectLoadingTeam); // Get team loading state
  
  // Debug logging
  console.log('AttendanceDashboard rendering with roles/team:', {
    isManager,
    userRole,
    teamMembersCount: teamMembers?.length,
    loadingTeam
  });
  
  const [allAttendanceData, setAllAttendanceData] = useState([]); // Store all fetched data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch manager's team if not already loaded
  // useEffect(() => {
  //   if (isManager && teamMembers.length === 0 && loadingTeam === 'idle') {
  //     console.log("AttendanceDashboard: Dispatching fetchManagerTeam");
  //     dispatch(fetchManagerTeam());
  //   }
  // }, [isManager, teamMembers, loadingTeam, dispatch]);

  // Fetch all attendance data (managers need this to filter later)
  useEffect(() => {
    const fetchAttendanceData = async () => {
      // ... (token check remains the same) ...
      if (!isTokenValid()) { /* ... */ return; }
      
      try {
        setLoading(true);
        setError(null);
        // Fetch all records - filtering happens client-side for managers
        const response = await attendanceService.getAttendanceRecords(); 
        console.log('Fetched ALL attendance data:', response);
        
        if (response && (response.results || Array.isArray(response))) {
          setAllAttendanceData(response.results || response); // Store all data
        } else {
          setAllAttendanceData([]); // Ensure it's an array
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
  }, []); // Fetch once on mount

  // Filter attendance data for the manager's team
  const managerTeamAttendanceData = useMemo(() => {
    // *** ADD LOGS HERE ***
    console.log("Filtering Check: isManager:", isManager);
    console.log("Filtering Check: teamMembers:", teamMembers);
    console.log("Filtering Check: allAttendanceData (length):", allAttendanceData?.length);
    
    if (!isManager || !teamMembers || teamMembers.length === 0) {
      console.log("Filtering Result: Not manager or team empty, returning [].");
      return []; // Return empty if not manager or team not loaded/empty
    }
    
    // Ensure teamMembers has IDs
    const teamMemberIds = new Set(teamMembers.map(member => member.id).filter(id => id != null)); // Ensure IDs exist
    console.log("Filtering Check: Team Member IDs:", teamMemberIds);

    if (teamMemberIds.size === 0) {
        console.log("Filtering Result: No valid team member IDs found, returning [].");
        return [];
    }

    const filtered = allAttendanceData.filter(record => {
        // Ensure record.employee exists before checking
        const employeeId = record?.employee; 
        const shouldInclude = employeeId != null && teamMemberIds.has(employeeId);
        // Log individual record check if needed for deep debugging
        // console.log(`Record ID ${record?.id}, Employee ID ${employeeId}, In Team: ${shouldInclude}`);
        return shouldInclude;
    });
    
    console.log("Filtering Result: Filtered Data (length):", filtered.length);
    return filtered;
  }, [isManager, teamMembers, allAttendanceData]);

  // Calculate live summary stats based on filtered data for today
  const summary = useMemo(() => {
    // *** ADD LOG HERE ***
    console.log("Summary Calculation: Using data (length):", (isManager ? managerTeamAttendanceData : allAttendanceData)?.length);
    const dataToUse = isManager ? managerTeamAttendanceData : allAttendanceData;
    const todayRecords = dataToUse.filter(record => isToday(new Date(record.date)));
    
    const present = todayRecords.filter(r => r.status === 'present' || r.status === 'remote' || r.status === 'half_day').length;
    const absent = todayRecords.filter(r => r.status === 'absent').length;
    const leave = todayRecords.filter(r => r.status === 'leave').length;
    // Use team size for manager, or fetch total employees for admin?
    const total = isManager ? teamMembers.length : (/* fetch total count? */ dataToUse.length > 0 ? new Set(dataToUse.map(r => r.employee)).size : 0); 
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    console.log("Calculated Summary:", { total, present, absent, leave, rate });

    return {
      totalEmployees: total,
      presentToday: present,
      absentToday: absent,
      onLeave: leave,
      attendanceRate: rate,
    };
  }, [isManager, managerTeamAttendanceData, allAttendanceData, teamMembers]);


  // Handle mobile menu
  const handleOpenMobileMenu = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuAnchor(null);
  };

  const handleOpenAttendanceForm = (record = null) => {
    // Only managers can edit existing records
    if (record && !isManager) {
      // Show error or notification that user doesn't have permission
      return;
    }
    
    setSelectedRecord(record);
    setOpenAttendanceForm(true);
    handleCloseMobileMenu();
  };

  const handleCloseAttendanceForm = () => {
    setOpenAttendanceForm(false);
    setSelectedRecord(null);
  };

  // Modify handleAttendanceSaved to update the main list
  const handleAttendanceSaved = (savedRecord) => {
    console.log("Attendance Saved:", savedRecord);
    setAllAttendanceData(prev => {
        const existingIndex = prev.findIndex(item => item.id === savedRecord.id);
        if (existingIndex > -1) {
            // Update
            const updated = [...prev];
            updated[existingIndex] = savedRecord;
            return updated;
        } else {
            // Add (assuming API returns the full record including ID)
            return [savedRecord, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    });
    handleCloseAttendanceForm();
  };

  // Stats card component
  const StatCard = ({ icon, title, value, color }) => {
    return (
      <Card
        elevation={0}
        sx={{
          height: "100%",
          border: `1px solid ${theme.palette.divider}`,
          borderLeft: `4px solid ${color}`,
          borderRadius: 1,
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              color="text.secondary"
              variant="subtitle2"
              sx={{ mb: 1 }}
            >
              {title}
            </Typography>
            <Box
              sx={{
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                borderRadius: "50%",
                p: { xs: 0.5, sm: 1 },
                display: "flex",
              }}
            >
              {icon}
            </Box>
          </Box>
          <Typography 
            variant={isMobile ? "h6" : isTablet ? "h5" : "h4"} 
            component="div"
          >
            {value}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  // Calculate content height based on viewport and other elements
  const getContentHeight = () => {
    const viewportHeight = window.innerHeight;
    // Approximately account for header, stats cards, and padding
    const otherElementsHeight = isMobile ? 320 : 240;
    return Math.max(400, viewportHeight - otherElementsHeight);
  };
   console.log('Rendering AttendanceDashboard with filtered data:', { managerTeamAttendanceData, loading, error });
  return (
    <Box 
      sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%', // Changed from height: '100%'
      }}
    >
      {/* Debug Panel */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6">Dashboard Debug Info</Typography>
        <Alert severity={isManager ? "success" : "error"}>
          isManager: {String(isManager)}, Role: {userRole || 'undefined'}
        </Alert>
      </Paper>
      
      {/* Header section */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: 2,
            mb: { xs: 2, sm: 3 },
          }}
        >
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1"
          >
            Attendance Management
          </Typography>
          
          {/* Add New Record button - Only show for managers */}
          <PermissionGate requiredRole="manager">
            {isMobile ? (
              <>
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    size="small"
                    sx={{ flex: 1, mr: 1 }}
                  >
                    Filter
                  </Button>
                  
                  <Button
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenAttendanceForm()}
                    sx={{ flex: 1 }}
                    size="small"
                  >
                    Add
                  </Button>
                  
                  <IconButton 
                    onClick={handleOpenMobileMenu}
                    sx={{ ml: 1 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  
                  <Menu
                    anchorEl={mobileMenuAnchor}
                    open={Boolean(mobileMenuAnchor)}
                    onClose={handleCloseMobileMenu}
                    PaperProps={{
                      elevation: 3,
                      sx: { width: 200 }
                    }}
                  >
                    <MenuItem onClick={() => handleOpenAttendanceForm()}>
                      <AddIcon fontSize="small" sx={{ mr: 1 }} />
                      Add Record
                    </MenuItem>
                    <MenuItem onClick={handleCloseMobileMenu}>
                      <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
                      Advanced Filter
                    </MenuItem>
                  </Menu>
                </Box>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenAttendanceForm()}
              >
                Add Record
              </Button>
            )}
          </PermissionGate>
        </Box>
      </Box>
      
      {/* Stats cards - Uses the calculated summary */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<PeopleAltIcon color="primary" fontSize={isMobile ? "small" : "medium"} />}
            // Use team size for manager
            title={isManager ? "Team Size" : "Total Employees"} 
            value={summary.totalEmployees}
            color={theme.palette.primary.main}
          />
        </Grid>
        {/* Other StatCards use summary directly */}
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<CheckCircleIcon color="success" fontSize={isMobile ? "small" : "medium"} />}
            title="Present Today"
            value={summary.presentToday}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<EventBusyIcon color="error" fontSize={isMobile ? "small" : "medium"} />}
            title="Absent Today"
            value={summary.absentToday}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<WorkOutlineIcon color="warning" fontSize={isMobile ? "small" : "medium"} />}
            title="On Leave"
            value={summary.onLeave}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Attendance Records - Fixed layout approach */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          mb: 2, // Add bottom margin
          maxHeight: { 
            xs: '50vh',
            sm: '55vh',
            md: '60vh'
          },
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, pb: 0 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>
            {/* Title changes based on role */}
            {isManager ? "Team Attendance Records" : "Attendance Records"} 
          </Typography>
          <Divider />
        </Box>
        
        <Box sx={{ 
          overflow: 'auto',
          p: { xs: 1, sm: 2, md: 3 }, 
          pt: 0,
          // Fixed height that adjusts with screen size
          height: { 
            xs: '40vh',
            sm: '45vh',
            md: '50vh'
          },
        }}>
          <AttendanceList
            // Pass the filtered data for managers
            attendanceData={isManager ? managerTeamAttendanceData : allAttendanceData} 
            loading={loading || (isManager && loadingTeam === 'pending')}  // Consider team loading state
            error={error || (isManager && loadingTeam === 'failed' ? 'Failed to load team members' : null)}
            onEdit={isManager ? handleOpenAttendanceForm : undefined} // Only managers can edit
            isMobile={isMobile}
            personalView={false} // This is the management view
          />
        </Box>
      </Paper>
      
      {/* Form dialog */}
      <AttendanceForm
        open={openAttendanceForm}
        onClose={handleCloseAttendanceForm}
        attendanceRecord={selectedRecord}
        onSave={handleAttendanceSaved}
        // Pass team members if manager, otherwise maybe allEmployees for admin?
        // The form logic will handle which list to actually use based on role
      />
    </Box>
  );
};

export default AttendanceDashboard;
