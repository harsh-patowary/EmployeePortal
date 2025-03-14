import React from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent, CardHeader } from '@mui/material';

function ReportsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reports Dashboard</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Analytics and performance reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Employee Performance
            </Typography>
            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">
                Performance chart would appear here
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Department Analytics
            </Typography>
            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">
                Department chart would appear here
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Monthly Reports
            </Typography>
            <Grid container spacing={2}>
              {['January', 'February', 'March'].map((month) => (
                <Grid item xs={12} md={4} key={month}>
                  <Card variant="outlined">
                    <CardHeader title={month} />
                    <CardContent>
                      <Typography variant="body2">
                        Click to view {month} monthly report details
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ReportsPage;