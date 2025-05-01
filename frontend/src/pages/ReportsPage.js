import React, { useState, useRef } from 'react'; // Import useRef
import {
  Typography, Box, Paper, Grid, Card, CardContent, CardHeader,
  Tabs, Tab, ButtonBase, Divider, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress // Import CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import jsPDF from 'jspdf'; // Import jsPDF
import html2canvas from 'html2canvas'; // Import html2canvas

const mockAttendanceData = [
  { department: 'Engineering', rate: 94, lastMonth: 91, change: 3 },
  { department: 'Marketing', rate: 88, lastMonth: 92, change: -4 },
  { department: 'HR', rate: 97, lastMonth: 95, change: 2 },
  { department: 'Finance', rate: 91, lastMonth: 89, change: 2 },
];

const mockProductivityData = [
  { employee: 'John Doe', completedTasks: 23, efficiency: 87 },
  { employee: 'Jane Smith', completedTasks: 19, efficiency: 92 },
  { employee: 'Michael Johnson', completedTasks: 27, efficiency: 85 },
  { employee: 'Sarah Williams', completedTasks: 21, efficiency: 89 },
];

function ReportsPage() {
  const theme = useTheme();
  const [reportPeriod, setReportPeriod] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isExporting, setIsExporting] = useState(false); // State for loading indicator

  // Ref for the report content area
  const reportContentRef = useRef(null);

  const handleChange = (event, newValue) => {
    setReportPeriod(newValue);
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month === selectedMonth ? null : month);
  };

  // --- Export Function (PDF) ---
  const handleExportPdf = async () => {
    if (!reportContentRef.current) {
      console.error("Report content area not found.");
      return;
    }
    setIsExporting(true); // Start loading indicator

    try {
      // Capture the specific report area using the ref
      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2, // Increase scale for better resolution
        useCORS: true, // If you have external images/fonts
        logging: false, // Disable html2canvas logging if desired
      });

      const imgData = canvas.toDataURL('image/png');

      // Calculate PDF dimensions (A4 size: 210mm x 297mm)
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate the aspect ratio and scale the image to fit the PDF width
      const ratio = imgWidth / imgHeight;
      let scaledImgHeight = pdfWidth / ratio;
      let scaledImgWidth = pdfWidth;

      // If the scaled height exceeds the PDF height, scale based on height instead
      if (scaledImgHeight > pdfHeight) {
          scaledImgHeight = pdfHeight;
          scaledImgWidth = pdfHeight * ratio;
      }

      // Center the image on the page (optional)
      const xPos = (pdfWidth - scaledImgWidth) / 2;
      const yPos = 10; // Add some top margin

      // Initialize jsPDF (portrait, mm, a4)
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add the captured image to the PDF
      pdf.addImage(imgData, 'PNG', xPos, yPos, scaledImgWidth, scaledImgHeight);

      // Add title or header (optional)
      pdf.setFontSize(16);
      pdf.text("Report Summary", pdfWidth / 2, yPos / 2, { align: 'center' });

      // Generate filename and save
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      pdf.save(`report_${timestamp}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      // Handle error (e.g., show an alert to the user)
    } finally {
      setIsExporting(false); // Stop loading indicator
    }
  };
  // --- End Export Function ---

  // Mock data for charts
  const months = ['January', 'February', 'March', 'April', 'May', 'June'];
  const currentMonth = new Date().getMonth();
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
  const currentYear = new Date().getFullYear();

  // Dashboard metrics
  const metrics = [
    { label: 'Avg. Attendance', value: '92%', change: '+2.5%', positive: true },
    { label: 'Productivity', value: '87%', change: '-1.2%', positive: false },
    { label: 'Leave Utilization', value: '43%', change: '+5.4%', positive: true },
    { label: 'On-time Projects', value: '78%', change: '+3.1%', positive: true },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 3, 
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(232, 244, 253, 0.8)',
          borderRadius: 2,
          boxShadow: theme.shadows[1]
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="500">Reports Dashboard</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" color="text.secondary">
            Analytics and performance metrics for {currentMonthName} {currentYear}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              icon={<CalendarTodayIcon fontSize="small" />} 
              label="This Quarter" 
              variant="outlined" 
              onClick={() => {}} 
              sx={{ borderRadius: 1.5 }}
            />
            <Chip 
              icon={<FilterListIcon fontSize="small" />} 
              label="Filter" 
              variant="outlined" 
              onClick={() => {}} 
              sx={{ borderRadius: 1.5 }}
            />
            <Chip 
              icon={isExporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon fontSize="small" />} // Show loader or icon
              label="Export PDF"
              variant="outlined"
              onClick={handleExportPdf} // <-- Attach the PDF export handler
              disabled={isExporting} // Disable while exporting
              sx={{ borderRadius: 1.5, cursor: isExporting ? 'default' : 'pointer' }}
            />
          </Box>
        </Box>
      </Box>

      {/* --- Add ref to the main content area --- */}
      <Box ref={reportContentRef}>
        {/* KPI Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                elevation={1}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                  <Typography variant="h4" fontWeight="medium">
                    {metric.value}
                  </Typography>
                  <Box 
                    sx={{ 
                      ml: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      color: metric.positive ? 'success.main' : 'error.main',
                      typography: 'body2'
                    }}
                  >
                    {metric.positive ? 
                      <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> :
                      <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                    }
                    {metric.change}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Main Reports Container */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={reportPeriod} 
            onChange={handleChange}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="This Month" />
            <Tab label="Quarter to Date" />
            <Tab label="Year to Date" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {/* Attendance Report */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">Attendance Analysis</Typography>
                <Chip 
                  label="View Details" 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {}} 
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">vs Last Month</TableCell>
                      <TableCell align="right">Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockAttendanceData.map((row) => (
                      <TableRow key={row.department}>
                        <TableCell component="th" scope="row">
                          {row.department}
                        </TableCell>
                        <TableCell align="right">{row.rate}%</TableCell>
                        <TableCell align="right">
                          <Box 
                            component="span" 
                            sx={{ 
                              color: row.change >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'medium'
                            }}
                          >
                            {row.change > 0 ? `+${row.change}%` : `${row.change}%`}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {row.change >= 0 ? 
                            <TrendingUpIcon fontSize="small" color="success" /> : 
                            <TrendingDownIcon fontSize="small" color="error" />
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', height: 180 }}>
                <Box sx={{ 
                  width: '100%', 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 1
                }}>
                  <Typography color="text.secondary" variant="body2">
                    Attendance trend chart would appear here
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Productivity Report */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">Employee Productivity</Typography>
                <Chip 
                  label="View Details" 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {}} 
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell align="right">Tasks Completed</TableCell>
                      <TableCell align="right">Efficiency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockProductivityData.map((row) => (
                      <TableRow key={row.employee}>
                        <TableCell component="th" scope="row">
                          {row.employee}
                        </TableCell>
                        <TableCell align="right">{row.completedTasks}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={row.efficiency} 
                                sx={{
                                  height: 8,
                                  borderRadius: 1,
                                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 1,
                                    backgroundColor: row.efficiency > 90 ? 'success.main' : 'primary.main',
                                  }
                                }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">{`${row.efficiency}%`}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', height: 180 }}>
                <Box sx={{ 
                  width: '100%', 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 1
                }}>
                  <Typography color="text.secondary" variant="body2">
                    Productivity comparison chart would appear here
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Monthly Reports */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                Monthly Reports
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                {months.map((month) => (
                  <Grid item xs={12} sm={6} md={4} lg={2} key={month}>
                    <ButtonBase 
                      sx={{ 
                        width: '100%', 
                        textAlign: 'left',
                        transition: 'transform 0.2s',
                        '&:hover': { 
                          transform: 'translateY(-4px)'
                        }
                      }}
                      onClick={() => handleMonthSelect(month)}
                    >
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          width: '100%',
                          borderColor: selectedMonth === month ? 'primary.main' : 'divider',
                          bgcolor: selectedMonth === month ? 
                            (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.08)') : 
                            'background.paper'
                        }}
                      >
                        <CardHeader 
                          title={month} 
                          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'medium' }}
                          sx={{ pb: 0 }}
                        />
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            {month === months[currentMonth] ? 'Current month' : 'View report'}
                          </Typography>
                          {month === months[currentMonth] && (
                            <Chip 
                              label="Latest" 
                              color="primary" 
                              size="small"
                              sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </ButtonBase>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box> {/* --- End of ref content area --- */}
    </Box>
  );
}

export default ReportsPage;