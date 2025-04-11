import React, { useState, useEffect } from "react";
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

const AttendanceDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [openAttendanceForm, setOpenAttendanceForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  
  const [attendanceData, setAttendanceData] = useState([
    {
      id: 1,
      employee_name: 'John Doe',
      employee_id: 1,
      date: '2025-04-11',
      status: 'present',
      check_in: '09:00:00',
      check_out: '17:00:00',
      duration_hours: 8
    },
    {
      id: 2,
      employee_name: 'Jane Smith',
      employee_id: 2,
      date: '2025-04-11',
      status: 'remote',
      check_in: '08:30:00',
      check_out: '16:30:00',
      duration_hours: 8
    },
    // Additional dummy data
    {
      id: 3,
      employee_name: 'Michael Johnson',
      employee_id: 3,
      date: '2025-04-11',
      status: 'present',
      check_in: '08:45:00',
      check_out: '17:15:00',
      duration_hours: 8.5
    },
    {
      id: 4,
      employee_name: 'Emily Williams',
      employee_id: 4,
      date: '2025-04-11',
      status: 'absent',
      check_in: null,
      check_out: null,
      duration_hours: 0
    },
    {
      id: 5,
      employee_name: 'David Brown',
      employee_id: 5,
      date: '2025-04-11',
      status: 'leave',
      check_in: null,
      check_out: null,
      duration_hours: 0
    },
    {
      id: 6,
      employee_name: 'Sarah Miller',
      employee_id: 6,
      date: '2025-04-11',
      status: 'half_day',
      check_in: '09:00:00',
      check_out: '13:00:00',
      duration_hours: 4
    },
    {
      id: 7,
      employee_name: 'Robert Wilson',
      employee_id: 7,
      date: '2025-04-11',
      status: 'present',
      check_in: '09:15:00',
      check_out: '17:30:00',
      duration_hours: 8.25
    },
    {
      id: 8,
      employee_name: 'Jennifer Taylor',
      employee_id: 8,
      date: '2025-04-11',
      status: 'remote',
      check_in: '08:00:00',
      check_out: '16:00:00',
      duration_hours: 8
    },
    {
      id: 9,
      employee_name: 'Thomas Anderson',
      employee_id: 9,
      date: '2025-04-11',
      status: 'present',
      check_in: '09:30:00',
      check_out: '18:00:00',
      duration_hours: 8.5
    },
    {
      id: 10,
      employee_name: 'Lisa Martinez',
      employee_id: 10,
      date: '2025-04-11',
      status: 'remote',
      check_in: '09:00:00',
      check_out: '17:00:00',
      duration_hours: 8
    },
    {
      id: 11,
      employee_name: 'Daniel Garcia',
      employee_id: 11,
      date: '2025-04-11',
      status: 'leave',
      check_in: null,
      check_out: null,
      duration_hours: 0
    },
    {
      id: 12,
      employee_name: 'Patricia Rodriguez',
      employee_id: 12,
      date: '2025-04-11',
      status: 'present',
      check_in: '08:45:00',
      check_out: '17:15:00',
      duration_hours: 8.5
    },
    {
      id: 13,
      employee_name: 'Andrew Wilson',
      employee_id: 13,
      date: '2025-04-11',
      status: 'absent',
      check_in: null,
      check_out: null,
      duration_hours: 0
    },
    {
      id: 14,
      employee_name: 'Elizabeth Clark',
      employee_id: 14,
      date: '2025-04-11',
      status: 'present',
      check_in: '09:00:00',
      check_out: '17:00:00',
      duration_hours: 8
    },
    {
      id: 15,
      employee_name: 'Kevin Lewis',
      employee_id: 15,
      date: '2025-04-11',
      status: 'half_day',
      check_in: '09:00:00',
      check_out: '13:30:00',
      duration_hours: 4.5
    }
  ]);
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

  // Handle mobile menu
  const handleOpenMobileMenu = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuAnchor(null);
  };

  const handleOpenAttendanceForm = (record = null) => {
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

  return (
    <Box 
      sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%', // Changed from height: '100%'
      }}
    >
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
          
          {/* Mobile hamburger menu */}
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
            onEdit={handleOpenAttendanceForm}
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
