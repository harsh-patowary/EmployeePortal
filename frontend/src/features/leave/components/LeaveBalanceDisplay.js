import React from 'react';
import { Box, Typography, Paper, Grid, Skeleton } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; // Example Icon

const LeaveBalanceDisplay = ({ paid, sick, loading }) => {
  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Leave Balances
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center">
            <AccountBalanceWalletIcon color="primary" sx={{ mr: 1.5 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Paid Leave Remaining
              </Typography>
              <Typography variant="h5" component="div" fontWeight="medium">
                {loading ? <Skeleton width={60} /> : `${paid ?? 0} days`}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center">
            <AccountBalanceWalletIcon color="secondary" sx={{ mr: 1.5 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Sick Leave Remaining
              </Typography>
              <Typography variant="h5" component="div" fontWeight="medium">
                {loading ? <Skeleton width={60} /> : `${sick ?? 0} days`}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default LeaveBalanceDisplay;