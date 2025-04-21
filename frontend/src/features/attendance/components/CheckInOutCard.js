import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import attendanceService from "../services/attendanceService";
import { format } from "date-fns";

function CheckInOutCard({ employeeId, todayRecord, onAttendanceRecorded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Debug log whenever todayRecord changes
  useEffect(() => {
    console.log("CheckInOutCard received todayRecord:", todayRecord);
    console.log("CheckInOutCard received todayRecord:", todayRecord);
    console.log("hasCheckedIn:", Boolean(todayRecord?.check_in));
    console.log("hasCheckedOut:", Boolean(todayRecord?.check_out));
    console.log(
      "checkOutDisabled condition:",
      !Boolean(todayRecord?.check_in) ||
        Boolean(todayRecord?.check_out) ||
        loading
    );
  }, [todayRecord]);

  // Update the handleCheckIn function
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setError(null);
      // Call service without employeeId
      const response = await attendanceService.checkIn(); 
      setSuccess('Check-in recorded successfully!');
      
      // Use the record from the response
      if (response && response.record && onAttendanceRecorded) {
        onAttendanceRecorded(response.record); 
      } else if (onAttendanceRecorded) {
         onAttendanceRecorded(); // Fallback to general refresh
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to record check-in. Please try again.');
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update the handleCheckOut function
  const handleCheckOut = async () => {
    try {
      setLoading(true);
      setError(null);
      // Call service without employeeId
      const response = await attendanceService.checkOut(); 
      setSuccess('Check-out recorded successfully!');

      // Use the record from the response
      if (response && response.record && onAttendanceRecorded) {
        onAttendanceRecorded(response.record);
      } else if (onAttendanceRecorded) {
         onAttendanceRecorded(); // Fallback to general refresh
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to record check-out. Please try again.');
      console.error('Check-out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Status helpers - UPDATED logic for check-out button
  // const hasCheckedIn = Boolean(todayRecord?.check_in);
  // const hasCheckedOut = Boolean(todayRecord?.check_out);
  // Update the hasCheckedIn and hasCheckedOut calculations
  const hasCheckedIn =
    todayRecord?.check_in &&
    todayRecord.check_in !== "null" &&
    todayRecord.check_in !== "";
  const hasCheckedOut =
    todayRecord?.check_out &&
    todayRecord.check_out !== "null" &&
    todayRecord.check_out !== "";

  // Only disable check-out if there's no check-in record or already checked out
  const checkOutDisabled = !hasCheckedIn || hasCheckedOut || loading;

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "success";
      case "absent":
        return "error";
      case "leave":
        return "warning";
      case "remote":
        return "info";
      case "half_day":
        return "secondary";
      default:
        return "default";
    }
  };

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    return timeStr.substring(0, 5); // Format as HH:MM
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
        {todayRecord ? (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <Box>
              <Typography variant="body2" color="textSecondary">
                Status:
              </Typography>
              <Chip
                size="small"
                label={
                  todayRecord.status.charAt(0).toUpperCase() +
                  todayRecord.status.slice(1)
                }
                color={getStatusColor(todayRecord.status)}
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box>
              <Typography variant="body2" color="textSecondary">
                Check-in:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatTime(todayRecord.check_in) || "—"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="textSecondary">
                Check-out:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatTime(todayRecord.check_out) || "—"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="textSecondary">
                Date:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {todayRecord.date
                  ? format(new Date(todayRecord.date), "dd MMM yyyy")
                  : "—"}
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No attendance record for today. Use the buttons below to check in.
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<LoginIcon />}
          onClick={handleCheckIn}
          disabled={loading || hasCheckedIn}
          sx={{ flex: 1 }}
        >
          {loading && !hasCheckedOut ? (
            <CircularProgress size={24} />
          ) : (
            "Check In"
          )}
        </Button>

        <Button
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleCheckOut}
          disabled={checkOutDisabled}
          sx={{ flex: 1 }}
        >
          {loading && hasCheckedIn ? (
            <CircularProgress size={24} />
          ) : (
            "Check Out"
          )}
        </Button>
      </Box>
    </Box>
  );
}

export default CheckInOutCard;
