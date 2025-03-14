import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  Badge, 
  Grid,
  Card, 
  CardContent 
} from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isEqual, isToday, isSameMonth } from 'date-fns';

// This component displays a calendar view of attendance records
function AttendanceCalendar({ attendanceData = [], month = new Date() }) {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Find attendance record for the selected date
  const selectedAttendance = attendanceData.find(record => 
    isEqual(new Date(record.date), selectedDate)
  );

  // Helper function to get the status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return theme.palette.success.main;
      case 'absent': return theme.palette.error.main;
      case 'half_day': return theme.palette.warning.main;
      case 'leave': return theme.palette.info.main;
      case 'remote': return theme.palette.primary.main;
      default: return theme.palette.text.disabled;
    }
  };

  // Function to render day content with attendance status
  const renderDayWithAttendance = (date, selectedDates, pickersDayProps) => {
    // Find if there's an attendance record for this date
    const attendance = attendanceData.find(record => 
      isEqual(new Date(record.date), date)
    );

    // Determine badge color based on attendance status
    const badgeColor = attendance ? getStatusColor(attendance.status) : 'transparent';

    return (
      <Badge
        key={date.toString()}
        overlap="circular"
        badgeContent={
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: badgeColor
            }}
          />
        }
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            backgroundColor: isEqual(date, selectedDate) ? theme.palette.primary.light : 'transparent',
            color: isEqual(date, selectedDate) ? theme.palette.primary.contrastText : 
                   isToday(date) ? theme.palette.primary.main : 
                   isSameMonth(date, month) ? theme.palette.text.primary : theme.palette.text.disabled,
          }}
        >
          {date.getDate()}
        </Box>
      </Badge>
    );
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                renderInput={() => null}
                renderDay={renderDayWithAttendance}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6">
                {format(selectedDate, 'MMMM d, yyyy')}
              </Typography>
              
              {selectedAttendance ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mt: 0.5 
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: getStatusColor(selectedAttendance.status), 
                        mr: 1 
                      }} 
                    />
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {selectedAttendance.status.replace('_', ' ')}
                    </Typography>
                  </Box>
                  
                  {selectedAttendance.check_in && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                        Check-in
                      </Typography>
                      <Typography variant="body1">
                        {selectedAttendance.check_in}
                      </Typography>
                    </>
                  )}
                  
                  {selectedAttendance.check_out && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                        Check-out
                      </Typography>
                      <Typography variant="body1">
                        {selectedAttendance.check_out}
                      </Typography>
                    </>
                  )}
                  
                  {selectedAttendance.duration_hours && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                        Duration
                      </Typography>
                      <Typography variant="body1">
                        {selectedAttendance.duration_hours} hours
                      </Typography>
                    </>
                  )}
                  
                  {selectedAttendance.notes && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                        Notes
                      </Typography>
                      <Typography variant="body1">
                        {selectedAttendance.notes}
                      </Typography>
                    </>
                  )}
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    No attendance record for this date
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AttendanceCalendar;