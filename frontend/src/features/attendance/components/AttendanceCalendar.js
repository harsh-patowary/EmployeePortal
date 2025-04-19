import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import {
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";
import "react-calendar/dist/Calendar.css";
// Still import the custom CSS for basic styling
import "../styles/calendar.css";
import ThemeProviderWrapper from "../../../theme/ThemeContext";
import { red } from "@mui/material/colors";

function AttendanceCalendar({ attendanceData }) {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Initialize with today's record when component mounts
  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecord = attendanceData.find((record) => record.date === today);
    setSelectedRecord(todayRecord);
  }, [attendanceData]);

  // Add this debugging to check if dates are matching correctly
  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = format(date, "yyyy-MM-dd");
    console.log("Selected date formatted:", formattedDate);
    console.log(
      "Available dates:",
      attendanceData.map((record) => record.date)
    );

    const record = attendanceData.find(
      (record) => record.date === formattedDate
    );
    console.log("Found record:", record);
    setSelectedRecord(record);
  };

  // Get color for tile based on attendance status
  const getTileClassName = ({ date, view }) => {
    if (view !== "month") return null;

    const formattedDate = format(date, "yyyy-MM-dd");
    const record = attendanceData.find(
      (record) => record.date === formattedDate
    );

    if (!record) return null;

    // Use theme-specific class names
    switch (record.status) {
      case "present":
        return "attendance-present";
      case "absent":
        return "attendance-absent";
      case "leave":
        return "attendance-leave";
      case "remote":
        return "attendance-remote";
      case "half_day":
        return "attendance-half-day";
      default:
        return null;
    }
  };

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    return timeStr.substring(0, 5); // Format as HH:MM
  };

  // Get color for status chip from theme
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

  // Dynamic styles based on theme
  const calendarStyles = {
    ".react-calendar": {
      width: "100%",
      maxWidth: "100%",
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.divider}`,
      fontFamily: theme.typography.fontFamily,
      boxShadow: theme.shadows[1],
      padding: "16px",
    },
    ".react-calendar__navigation": {
      marginBottom: "16px",
    },
    ".react-calendar__navigation button": {
      color: theme.palette.text.primary,
      backgroundColor: "transparent",
      border: "none",
      "&:enabled:hover": {
        backgroundColor: theme.palette.action.hover,
      },
      "&:disabled": {
        backgroundColor: "transparent",
        color: theme.palette.text.disabled,
      },
    },
    ".react-calendar__month-view__weekdays": {
      textTransform: "uppercase",
      fontWeight: "700",
      fontSize: "0.8rem",
      color: theme.palette.text.secondary,
    },
    ".react-calendar__tile": {
      padding: "10px",
      backgroundColor: "transparent",
      color: theme.palette.text.primary,
      border: "none",
      "&:enabled:hover": {
        // Improved hover effect with better contrast
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.15)"
            : "rgba(0,0,0,0.08)",
        borderRadius: theme.shape.borderRadius,
      },
      "&:disabled": {
        color: theme.palette.text.disabled,
      },
    },
    ".react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus":
      {
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.15)"
            : "rgba(0,0,0,0.08)",
        borderRadius: theme.shape.borderRadius,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[1],
      },
    ".react-calendar__tile--active": {
      backgroundColor: `${theme.palette.primary.main} !important`,
      color: `${theme.palette.primary.contrastText} !important`,
      borderRadius: theme.shape.borderRadius,
      fontWeight: "bold",
      boxShadow: "0 0 0 2px #ffffff, 0 0 0 4px " + theme.palette.primary.main,
      zIndex: 3,
    },

    ".react-calendar__tile--now": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.05)",
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: theme.shape.borderRadius,
      fontWeight: "bold",
    },
    // Fixed attendance color indicators with better visibility
    ".attendance-present": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(76, 175, 80, 0.4)"
          : "rgba(76, 175, 80, 0.2)",
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
      fontWeight: "bold",
      border: `1px solid ${theme.palette.success.main}`,
    },
    ".attendance-absent": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(244, 67, 54, 0.4)"
          : "rgba(244, 67, 54, 0.2)",
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
      fontWeight: "bold",
      border: `1px solid ${theme.palette.error.main}`,
    },
    ".attendance-leave": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(255, 152, 0, 0.4)"
          : "rgba(255, 152, 0, 0.2)",
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
      fontWeight: "bold",
      border: `1px solid ${theme.palette.warning.main}`,
    },
    ".attendance-remote": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(33, 150, 243, 0.4)"
          : "rgba(33, 150, 243, 0.2)",
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
      fontWeight: "bold",
      border: `1px solid ${theme.palette.info.main}`,
    },
    // Use a bold border and more subtle stripes for half-days
    ".attendance-half-day": {
      background: `repeating-linear-gradient(
    45deg,
    ${
      theme.palette.mode === "dark"
        ? "rgba(156, 39, 176, 0.4)"
        : "rgba(156, 39, 176, 0.2)"
    }, 
    ${
      theme.palette.mode === "dark"
        ? "rgba(156, 39, 176, 0.4)"
        : "rgba(156, 39, 176, 0.2)"
    } 5px,
    ${theme.palette.background.paper} 5px,
    ${theme.palette.background.paper} 10px
  )`,
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
      fontWeight: "bold",
      border: `2px solid ${theme.palette.secondary.main}`,
    },
    // Improve the active day visibility

    ".attendance-present:hover, .attendance-absent:hover, .attendance-leave:hover, .attendance-remote:hover, .attendance-half-day:hover":
      {
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
        transform: "scale(1.02)",
        transition: "all 0.2s",
        zIndex: 2,
      },
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Box sx={calendarStyles}>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileClassName={getTileClassName}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Status Legend:
            </Typography>
            <Chip
              size="small"
              label="Present"
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(76, 175, 80, 0.4)"
                    : "rgba(76, 175, 80, 0.2)",
                color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                fontWeight: "bold",
                border: `1px solid ${theme.palette.success.main}`,
              }}
            />
            <Chip
              size="small"
              label="Absent"
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(244, 67, 54, 0.4)"
                    : "rgba(244, 67, 54, 0.2)",
                color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                fontWeight: "bold",
                border: `1px solid ${theme.palette.error.main}`,
              }}
            />
            <Chip
              size="small"
              label="Leave"
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.4)"
                    : "rgba(255, 152, 0, 0.2)",
                color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                fontWeight: "bold",
                border: `1px solid ${theme.palette.warning.main}`,
              }}
            />
            <Chip
              size="small"
              label="Remote"
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(33, 150, 243, 0.4)"
                    : "rgba(33, 150, 243, 0.2)",
                color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                fontWeight: "bold",
                border: `1px solid ${theme.palette.info.main}`,
              }}
            />
            <Chip
              size="small"
              label="Half Day"
              sx={{
                background: `repeating-linear-gradient(
        45deg,
        ${
          theme.palette.mode === "dark"
            ? "rgba(156, 39, 176, 0.4)"
            : "rgba(156, 39, 176, 0.2)"
        }, 
        ${
          theme.palette.mode === "dark"
            ? "rgba(156, 39, 176, 0.4)"
            : "rgba(156, 39, 176, 0.2)"
        } 5px,
        ${theme.palette.background.paper} 5px,
        ${theme.palette.background.paper} 10px
      )`,
                color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                fontWeight: "bold",
                border: `2px solid ${theme.palette.secondary.main}`,
              }}
            />
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </Typography>

            {selectedRecord ? (
              <>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Status:
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      selectedRecord.status.charAt(0).toUpperCase() +
                      selectedRecord.status.slice(1)
                    }
                    color={getStatusColor(selectedRecord.status)}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Check-in time:
                  </Typography>
                  <Typography variant="body1">
                    {formatTime(selectedRecord.check_in) || "Not checked in"}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Check-out time:
                  </Typography>
                  <Typography variant="body1">
                    {formatTime(selectedRecord.check_out) || "Not checked out"}
                  </Typography>
                </Box>

                {selectedRecord.note && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Notes:
                    </Typography>
                    <Typography variant="body1">
                      {selectedRecord.note}
                    </Typography>
                  </Box>
                )}

                {selectedRecord.work_hours && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Work hours:
                    </Typography>
                    <Typography variant="body1">
                      {selectedRecord.work_hours} hours
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Typography variant="body1" color="textSecondary">
                  No attendance record for this date
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default AttendanceCalendar;
