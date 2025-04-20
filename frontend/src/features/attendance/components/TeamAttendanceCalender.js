import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import {
  Box, Typography, Chip, Grid, Card, CardContent, useTheme, List, ListItem, ListItemText, Avatar, Divider, CircularProgress, Alert
} from '@mui/material';
import { format, startOfDay, parseISO } from 'date-fns'; // Ensure parseISO is imported if needed elsewhere
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';
import AttendanceForm from './AttendanceForm'; // <-- Import AttendanceForm
import { useSelector } from 'react-redux'; // <-- Import useSelector
import { selectUserRole } from '../../../redux/employeeSlice'; // <-- Import role selector

// Helper function to get initials for Avatar
const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length === 1) return names[0][0].toUpperCase();
  return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
};

// Helper function to get status chip styling
const getStatusChip = (status, theme) => {
  let color = 'default';
  let label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  let variant = 'filled'; // Default variant

  switch (status) {
    case 'present': color = 'success'; break;
    case 'absent': color = 'error'; break;
    case 'leave': color = 'warning'; break;
    case 'remote': color = 'info'; break;
    case 'half_day': color = 'secondary'; break;
    default: color = 'default'; variant = 'outlined'; break; // Use outlined for unknown/null
  }
  return <Chip label={label} color={color} size="small" variant={variant} sx={{ ml: 1 }} />;
};

// Helper function to format time
const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  try {
    // Assuming timeStr is like "HH:MM:SS" or part of ISO string
    const date = new Date(`1970-01-01T${timeStr}`);
    if (isNaN(date)) return '—'; // Handle invalid time
    return format(date, 'HH:mm');
  } catch (e) {
    return '—'; // Handle parsing errors
  }
};

// Add onSave prop
function TeamAttendanceCalendar({ teamAttendanceData = [], teamMembers = [], loading, onSave }) {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const userRole = useSelector(selectUserRole); // Get user role

  // --- State for Edit Form Modal ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState(null);

  // --- Define restricted editing parameters ---
  // Managers can only edit status (limited options) and notes via this view
  const managerReadOnlyFields = ['employee', 'date', 'check_in', 'check_out'];
  // Managers can only set these statuses via this view
  const managerAllowedStatuses = ['present', 'remote', 'half_day'];
  // Determine if the current user has permission to edit records
  const canUserEdit = ['manager', 'admin', 'hr', 'director'].includes(userRole);

  // Memoize daily summaries to avoid recalculating on every render
  const dailySummaries = useMemo(() => {
    const summaries = {};
    teamAttendanceData.forEach(record => {
      const dateStr = record.date; // Assuming date is 'YYYY-MM-DD'
      if (!summaries[dateStr]) {
        summaries[dateStr] = { present: 0, absent: 0, leave: 0, remote: 0, half_day: 0, total: 0, records: [] };
      }
      summaries[dateStr].total++;
      summaries[dateStr].records.push(record);
      if (record.status) {
        summaries[dateStr][record.status]++;
      }
    });
    return summaries;
  }, [teamAttendanceData]);

  // Get records for the currently selected date, ensuring necessary fields for editing are included
  const recordsForSelectedDate = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const summary = dailySummaries[dateStr];
    if (!summary) return [];
    const recordsMap = new Map(summary.records.map(rec => [rec.employee, rec]));

    return teamMembers.map(member => {
      const record = recordsMap.get(member.id);
      return {
        // Pass necessary fields for display AND editing
        id: record?.id, // <-- Need the original record ID for updates
        employeeId: member.id, // Keep this as employeeId for key prop
        employee: record?.employee, // Pass original employee ID for form
        name: `${member.first_name} ${member.last_name}`,
        status: record?.status || null,
        check_in: record?.check_in || null, // Pass original check_in (as ISO string or null)
        check_out: record?.check_out || null, // Pass original check_out (as ISO string or null)
        notes: record?.notes || '',
        date: record?.date, // Pass original date string
        // duration_hours: record?.duration_hours // Pass if needed
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

  }, [selectedDate, dailySummaries, teamMembers]);

  // Function to determine tile class based on team status
  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const summary = dailySummaries[dateStr];

    if (!summary || summary.total === 0) return null; // No records for this day

    // Example logic: Red if anyone absent, Yellow if anyone on leave, Green if all present/remote
    if (summary.absent > 0) return 'attendance-absent';
    if (summary.leave > 0) return 'attendance-leave';
    if (summary.present + summary.remote + summary.half_day === summary.total) return 'attendance-present';

    return 'attendance-mixed'; // Or some default class if needed
  };

  const handleDateChange = (date) => {
    setSelectedDate(startOfDay(date)); // Ensure we compare dates without time
  };

  // --- Handlers for Edit Modal ---
  const handleOpenEditModal = (record) => {
    // Only open if user has permission and the record exists (has an ID)
    if (canUserEdit && record && record.id) {
        console.log("Opening edit modal for record:", record);
        setSelectedRecordForEdit(record); // Pass the whole record object
        setEditModalOpen(true);
    } else if (record) {
        // Maybe open a read-only view later if needed
        console.log("User cannot edit or record has no ID. Record:", record);
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedRecordForEdit(null);
  };

  // This function will be called by AttendanceForm's onSave
  const handleRecordSaved = (savedRecord) => {
      if (onSave) {
          onSave(savedRecord); // Pass the saved record up to AttendanceDashboard
      }
      // Optionally update local state here if needed, but relying on parent update is safer
      handleCloseEditModal(); // Close modal after save
  };

  // Dynamic styles based on theme, copied from AttendanceCalendar
  const calendarStyles = {
    // Basic styles (can be kept or rely on calendar.css)
    ".react-calendar": {
        width: "100%",
        maxWidth: "100%",
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        fontFamily: theme.typography.fontFamily,
        boxShadow: theme.shadows[1],
        padding: "16px", // Optional: Adjust padding if needed
    },
    ".react-calendar__navigation button": {
        color: theme.palette.text.primary,
        backgroundColor: "transparent",
        border: "none",
        "&:enabled:hover": {
            backgroundColor: theme.palette.action.hover,
        },
    },
    ".react-calendar__month-view__weekdays": {
        textTransform: "uppercase",
        fontWeight: "700",
        fontSize: "0.8rem",
        color: theme.palette.text.secondary,
    },
     ".react-calendar__tile": {
        padding: "10px", // Adjust padding if needed
        backgroundColor: "transparent",
        color: theme.palette.text.primary,
        border: "none",
        "&:enabled:hover": {
            backgroundColor: theme.palette.action.hover,
            borderRadius: theme.shape.borderRadius,
        },
        "&:disabled": {
            color: theme.palette.text.disabled,
        },
    },
    ".react-calendar__tile--active": {
        backgroundColor: `${theme.palette.primary.main} !important`,
        color: `${theme.palette.primary.contrastText} !important`,
        borderRadius: theme.shape.borderRadius,
    },
    ".react-calendar__tile--now": {
        backgroundColor: theme.palette.action.selected,
        border: `1px solid ${theme.palette.primary.main}`, // Simplified border
        borderRadius: theme.shape.borderRadius,
        fontWeight: "bold",
    },

    // --- Copied Attendance Status Styles ---
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
    ".attendance-half-day": { // Using secondary color for half-day
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(156, 39, 176, 0.4)" // Example using purple
          : "rgba(156, 39, 176, 0.2)",
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
      fontWeight: "bold",
      border: `1px solid ${theme.palette.secondary.main}`,
    },
     // Optional: Add hover effect if desired
    ".attendance-present:hover, .attendance-absent:hover, .attendance-leave:hover, .attendance-remote:hover, .attendance-half-day:hover":
      {
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
        transform: "scale(1.02)",
        transition: "all 0.2s",
        zIndex: 2,
      },
  };

  return (
    <>
      <Grid container spacing={3}>
        {/* Calendar Grid Item */}
        <Grid item xs={12} md={7} lg={8}>
          <Box sx={calendarStyles}>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileClassName={getTileClassName}
              maxDate={new Date()}
            />
          </Box>
        </Grid>

        {/* Team Status List Grid Item */}
        <Grid item xs={12} md={5} lg={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Status on {format(selectedDate, 'MMMM d, yyyy')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
              ) : recordsForSelectedDate.length > 0 ? (
                <List dense sx={{ maxHeight: 450, overflowY: 'auto', pr: 1 }}>
                  {recordsForSelectedDate.map((record) => (
                    <ListItem
                      key={record.employeeId} // Use employeeId for key as it's stable for the list item
                      disableGutters
                      divider
                      button={canUserEdit && record.id} // Only make button if user can edit and record exists
                      onClick={() => handleOpenEditModal(record)}
                      sx={{ cursor: (canUserEdit && record.id) ? 'pointer' : 'default' }} // Change cursor based on editability
                    >
                      <Avatar sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText, width: 32, height: 32, mr: 1.5 }}>
                        {getInitials(record.name)}
                      </Avatar>
                      <ListItemText
                        primary={record.name}
                        secondary={
                          record.status ? (
                            <>
                              {formatTime(record.check_in)} - {formatTime(record.check_out)}
                              {record.note && ` (${record.note})`}
                            </>
                          ) : 'No Record'
                        }
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                        secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      />
                      {getStatusChip(record.status, theme)}
                    </ListItem>
                  ))}
                </List>
              ) : (
                 <Alert severity="info" sx={{ mt: 2 }}>No attendance records found for the team on this date.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* --- Render the Edit Form Modal --- */}
      {/* Ensure selectedRecordForEdit is not null before rendering */}
      {selectedRecordForEdit && (
          <AttendanceForm
            open={editModalOpen}
            onClose={handleCloseEditModal}
            attendanceRecord={selectedRecordForEdit} // Pass the full record
            onSave={handleRecordSaved} // Pass the handler
            // Pass the restrictions based on user role
            readOnlyFields={managerReadOnlyFields}
            allowedStatuses={managerAllowedStatuses}
          />
      )}
    </>
  );
}

export default TeamAttendanceCalendar;