import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { selectIsManager, selectRole } from '../../../redux/employeeSlice';
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
import attendanceService from '../services/attendanceService'; // Assuming this is where the service is located
import { isTokenValid, redirectToLogin } from '../../../utils/authUtils';

const AttendanceDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [openAttendanceForm, setOpenAttendanceForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  
  // Get role information
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);
  
  // Debug logging
  console.log('AttendanceDashboard rendering with roles:', {
    isManager,
    userRole
  });
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dummy summary data - would be fetched from API in production
  const summary = {
    totalEmployees: 42,
    presentToday: 36,
    absentToday: 3,
    onLeave: 3,
    attendanceRate: 86,
  };

  // Add useEffect to fetch data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      // Check token validity before making request
      if (!isTokenValid()) {
        console.error('Invalid token, redirecting to login');
        redirectToLogin();
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const response = await attendanceService.getAttendanceRecords();
        console.log('Fetched attendance data:', response);
        
        // Handle different response formats
        if (response && (response.results || Array.isArray(response))) {
          setAttendanceData(response.results || response);
        }
        
        // Update summary based on today's data
        // You'll need to implement this based on your data structure
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

  const handleAttendanceSaved = (newRecord) => {
    // In a real app, you'd call an API to save the record
    // Then refresh the data
    
    if (selectedRecord) {
      // Update existing record
      setAttendanceData(prev => 
        prev.map(item => item.id === selectedRecord.id ? { ...newRecord, id: selectedRecord.id } : item)
      );
    } else {
      // Add new record with generated ID
      const maxId = Math.max(0, ...attendanceData.map(item => item.id));
      setAttendanceData(prev => [...prev, { ...newRecord, id: maxId + 1 }]);
    }
    
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
   console.log('Rendering AttendanceDashboard:', { attendanceData, loading, error });
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
      
      {/* Stats cards - responsive grid */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<PeopleAltIcon color="primary" fontSize={isMobile ? "small" : "medium"} />}
            title="Total Employees"
            value={summary.totalEmployees}
            color={theme.palette.primary.main}
          />
        </Grid>
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
            Attendance Records
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
            attendanceData={attendanceData}
            loading={loading}
            error={error}
            onEdit={isManager ? handleOpenAttendanceForm : undefined}
            isMobile={isMobile}
          />
        </Box>
      </Paper>
      
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
