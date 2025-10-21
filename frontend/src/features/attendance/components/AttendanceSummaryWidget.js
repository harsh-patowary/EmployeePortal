import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, useTheme, CircularProgress, Alert, Grid } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import useAttendance from '../hooks/useAttendance'; // Assuming this hook fetches user's data
import { selectUser } from '../../../redux/employeeSlice'; // To get user ID

// Define colors for the chart segments (using theme colors is recommended)
const getChartColors = (theme) => ({
  present: theme.palette.success.main,
  absent: theme.palette.error.main,
  leave: theme.palette.warning.main,
  remote: theme.palette.info.main,
  half_day: theme.palette.secondary.main,
  default: theme.palette.grey[500],
});

const AttendanceSummaryWidget = () => {
  const theme = useTheme();
  const user = useSelector(selectUser);
  const { attendanceData, loading, error } = useAttendance(user?.id); // Fetch data for the current user

  const chartColors = getChartColors(theme);

  const currentMonthSummary = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) {
      return { data: [], total: 0 };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const summary = {
      present: 0,
      absent: 0,
      leave: 0,
      remote: 0,
      half_day: 0,
    };
    let totalRecordsInMonth = 0;

    attendanceData.forEach(record => {
      try {
        const recordDate = parseISO(record.date);
        if (isWithinInterval(recordDate, { start: monthStart, end: monthEnd })) {
          totalRecordsInMonth++;
          switch (record.status?.toLowerCase()) {
            case 'present':
              summary.present++;
              break;
            case 'absent':
              summary.absent++;
              break;
            case 'leave':
              summary.leave++;
              break;
            case 'remote':
              // Count remote as present for this summary, adjust if needed
              summary.remote++;
              break;
            case 'half_day':
              // Count half_day, maybe visualize differently later
              summary.half_day++;
              break;
            default:
              break;
          }
        }
      } catch (e) {
        console.error("Error parsing date:", record.date, e);
      }
    });

    // Combine present and remote for a simpler chart view
    const presentCombined = summary.present + summary.remote + summary.half_day; // Adjust logic as needed

    const chartData = [
      { name: 'Present', value: presentCombined, color: chartColors.present },
      { name: 'Absent', value: summary.absent, color: chartColors.absent },
      { name: 'Leave', value: summary.leave, color: chartColors.leave },
    ].filter(item => item.value > 0); // Only include segments with value > 0

    return { data: chartData, total: totalRecordsInMonth };

  }, [attendanceData, chartColors]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
     const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
     const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

     // Only show percentage if it's reasonably large to avoid clutter
     if (percent * 100 < 5) return null;

     return (
       <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="0.8rem" fontWeight="bold">
         {`${(percent * 100).toFixed(0)}%`}
       </text>
     );
   };
// tc46124

  return (
    // Main Paper container for the widget
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        My Attendance (This Month)
      </Typography>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
           <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
        </Box>
      )}

      {/* Empty State */}
      {!loading && !error && currentMonthSummary.data.length === 0 && (
         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
           <Typography color="text.secondary">No attendance data found for this month.</Typography>
         </Box>
      )}

      {/* Chart Area */}
      {!loading && !error && currentMonthSummary.data.length > 0 && (
        // Inner Box for chart styling and hover effect
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 1, // Add some padding around the chart container
            borderRadius: theme.shape.borderRadius, // Match theme rounding
            boxShadow: theme.shadows[1], // Add a subtle shadow
            bgcolor: 'background.default', // Slightly different background
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.02)', // Scale up on hover
              boxShadow: theme.shadows[4], // Increase shadow on hover
            },
          }}
        >
          {/* Responsive container for the chart itself */}
          <Box sx={{ width: '100%', height: 230 }}> {/* Adjust height slightly if needed due to padding */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentMonthSummary.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80} // Adjust size
                  innerRadius={50} // Makes it a doughnut chart
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5} // Adds spacing between segments
                >
                  {currentMonthSummary.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || chartColors.default} />
                  ))}
                </Pie>
                <Tooltip
                   formatter={(value, name) => [`${value} day(s)`, name]}
                   contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: theme.shape.borderRadius,
                   }}
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}
      {/* TODO: Add Team Summary section if user is manager */}
    </Paper>
  );
};

export default AttendanceSummaryWidget;