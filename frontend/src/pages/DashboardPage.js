import React from "react";
import { useSelector } from "react-redux"; 
import { Typography, Box, Paper, Grid, useTheme } from "@mui/material";
import UserDetailsComponent from "../components/UserComponent";
import { selectUser } from "../redux/employeeSlice";
import AttendanceSummaryWidget from "../features/attendance/components/AttendanceSummaryWidget";
import LeaveDashboardWidget from "../features/leave/components/LeaveDashboardWidget";

// Widget wrapper component for consistent styling
const DashboardWidget = ({ children, title, elevation = 0, sx = {} }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={elevation}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
        ...sx
      }}
    >
      {title && (
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Box sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Paper>
  );
};

function DashboardPage() {
  const theme = useTheme();
  const user = useSelector(selectUser);

  // Dashboard widgets configuration
  // Easy to add new widgets by adding to this array
  const dashboardWidgets = [
    {
      id: 'profile',
      title: null, // No title needed for user profile
      content: <UserDetailsComponent user={user} />,
      sx: {
        bgcolor: theme.palette.mode === "dark" ? theme.palette.background.paper : theme.palette.primary.light,
        color: theme.palette.mode === "dark" ? theme.palette.text.primary : theme.palette.primary.contrastText,
      }
    },
    {
      id: 'attendance',
      title: null, // Widget has its own title
      content: <AttendanceSummaryWidget />
    },
    {
      id: 'leave',
      title: null, // Widget has its own title
      content: <LeaveDashboardWidget />
    }
    // Add new widgets here easily:
    // { id: 'tasks', title: 'Tasks', content: <TasksWidget /> }
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the Employee Management System dashboard. Use the navigation
          menu to access different features.
        </Typography>
      </Box>

      {/* Widgets Grid */}
      <Grid container spacing={3}>
        {dashboardWidgets.map(widget => (
          <Grid item xs={12} sm={6} md={4} key={widget.id}>
            <DashboardWidget title={widget.title} sx={widget.sx}>
              {widget.content}
            </DashboardWidget>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default DashboardPage;
