import React, { useState, useEffect, useMemo } from "react"; // Import useMemo
import { useSelector, useDispatch } from "react-redux"; // Import useDispatch
// Import selectors from employeeSlice INSTEAD of authSlice
import {
  selectUser,
  selectIsManager,
  selectRole,
  selectTeamMembers,
  selectLoadingTeam,
  fetchManagerTeam,
} from "../redux/employeeSlice";
import { getManagerTeam } from "../services/employeeService";
import { Box, Typography, Paper, Alert, Select } from "@mui/material";

const UserRoleDebug = () => {
  // Use selectors from employeeSlice
  const user = useSelector(selectUser);
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);
  const teamMembers = useSelector(selectTeamMembers); // Assuming you have a selector for team members
  const dispatch = useDispatch(); // Get dispatch function
  const loadingTeam = useSelector(selectLoadingTeam);
  
  console.log(
    "UserRoleDebug component rendered. User:",
    user,
    "Is Manager:",
    isManager,
    "User Role:",
    userRole,
    "Team Members:",
    teamMembers
  ); // Debug log
  // Only render if user data is available from Redux store
  // Fetch manager's team if not already loaded
  useEffect(() => {
    console.log("UserRoleDebug useEffect: isManager:", isManager, 
      "teamMembers.length:", teamMembers.length, 
      "loadingTeam:", loadingTeam);
      
    // MODIFY THIS CONDITION to handle undefined and allow retrying after failure
    if (isManager && teamMembers.length === 0 && loadingTeam === 'pending') {
      console.log("UserRoleDebug: Dispatching fetchManagerTeam. Previous state:", loadingTeam);
      dispatch(fetchManagerTeam());
    }
  }, [isManager, teamMembers, loadingTeam, dispatch]);

  if (!user) {
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff0f0" }}>
        <Typography variant="h6">User Role Debug</Typography>
        <Alert severity="warning">User data not loaded in employeeSlice.</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5" }}>
      <Typography variant="h6">User Role Debug (from employeeSlice)</Typography>
      <Alert severity={isManager ? "success" : "info"} sx={{ mb: 1 }}>
        isManager: {String(isManager)} (Role: {userRole})
      </Alert>
      <Box
        component="pre"
        sx={{
          mt: 1,
          p: 1,
          bgcolor: "#eaeaea",
          overflowX: "auto",
          fontSize: "0.75rem",
        }}
      >
        {JSON.stringify(user, null, 2)}
      </Box>
    </Paper>
  );
};

export default UserRoleDebug;
