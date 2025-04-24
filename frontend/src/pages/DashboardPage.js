import React from "react";
import { useSelector } from "react-redux"; // Import useSelector
import { Typography, Box, Paper, Grid, useTheme } from "@mui/material";
import UserDetailsComponent from "../components/UserComponent";
import { selectUser } from "../redux/employeeSlice"; // Import the user selector
import AttendanceSummaryWidget from "../features/attendance/components/AttendanceSummaryWidget"; // <-- Import the new widget

function DashboardPage() {
  const theme = useTheme(); // Access theme in your component
  const user = useSelector(selectUser); // Get user data from Redux

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Typography paragraph>
        Welcome to the Employee Management System dashboard. Use the navigation
        menu to access different features.
      </Typography>

      <Grid container spacing={3}>
        {/* User Profile Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper
            sx={{
              p: 3,
              height: "100%", // Make cards in the same row have equal height
              display: "flex", // Added for flex alignment if needed
              flexDirection: "column", // Added for flex alignment if needed
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.background.paper
                  : theme.palette.primary.light,
              color:
                theme.palette.mode === "dark"
                  ? theme.palette.text.primary
                  : theme.palette.primary.contrastText,
            }}
          >
            {/* Pass user data to the component */}
            <UserDetailsComponent user={user} />
          </Paper>
        </Grid>

        {/* Attendance Summary Widget */}
        <Grid item xs={12} md={6} lg={4}>
          <AttendanceSummaryWidget />
        </Grid>

        {/* Add More grid items for other widgets here */}
        {/* Example:
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6">Another Widget</Typography>
            {/* ... content ... */}
        </Grid>
    </Box>
  );
}

export default DashboardPage;
