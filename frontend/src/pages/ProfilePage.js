import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Divider,
  Chip,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { selectUser, selectLoading } from '../redux/employeeSlice'; // Assuming loading state is in employeeSlice
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge'; // For Employee ID
import BusinessIcon from '@mui/icons-material/Business'; // For Department
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'; // For Manager
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // For Join Date
import { format, parseISO, isValid } from 'date-fns';

// Helper to format date safely
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMMM d, yyyy') : 'N/A';
    } catch (e) {
      return 'N/A'; // Fallback
    }
  };

// Helper component for detail rows
const DetailItem = ({ icon, label, value }) => (
  <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
    <Box sx={{ mr: 1.5, color: 'text.secondary' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body1">{value || 'N/A'}</Typography>
    </Box>
  </Grid>
);

function ProfilePage() {
  const theme = useTheme();
  const user = useSelector(selectUser);
  const loading = useSelector(selectLoading); // Use a relevant loading selector
  const error = useSelector((state) => state.employee.error); // Use a relevant error selector

  if (loading === 'pending') {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>Failed to load user profile: {typeof error === 'string' ? error : 'Unknown error'}</Alert>;
  }

  if (!user) {
    return <Alert severity="warning" sx={{ m: 3 }}>User data not available. Please try logging in again.</Alert>;
  }

  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const userInitial = userName ? userName.charAt(0).toUpperCase() : '?';
  const userPosition = user.job_title || user.position || 'Employee';

  console.log('User object in ProfilePage:', JSON.stringify(user, null, 2)); // Log the user object

  // Access manager details via user.manager (assuming serializer provides nested data under 'manager')
  const managerName = user.manager ? `${user.manager.first_name || ''} ${user.manager.last_name || ''}`.trim() : null;


  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        My Profile
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <Grid container spacing={3}>
          {/* Header Section */}
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                mr: 3,
                bgcolor: theme.palette.primary.main,
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
              src={user.profile_picture_url} // Use the correct field if available
              alt={userName}
            >
              {userInitial}
            </Avatar>
            <Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                {userName || 'User Name'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {userPosition}
              </Typography>
              {user.role && <Chip label={user.role} size="small" sx={{ mt: 0.5, textTransform: 'capitalize' }} />}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Details Section */}
          <Grid item xs={12} container spacing={1}>
            <DetailItem icon={<BadgeIcon />} label="Employee ID" value={user.eID} />
            <DetailItem icon={<EmailIcon />} label="Email" value={user.email} />
            <DetailItem icon={<PhoneIcon />} label="Phone" value={user.phone_number} />
            <DetailItem icon={<BusinessIcon />} label="Department" value={user.department} /> {/* Use direct department field */}
            <DetailItem icon={<SupervisorAccountIcon />} label="Manager" value={managerName} />
            <DetailItem icon={<CalendarTodayIcon />} label="Join Date" value={formatDate(user.date_hired)} /> {/* Use date_hired field */}
            {/* Add more DetailItem components for other relevant fields */}
            {/* Example: <DetailItem icon={<LocationOnIcon />} label="Location" value={user.location} /> */}
          </Grid>

          {/* Add other sections if needed, e.g., Emergency Contact, Skills, etc. */}

        </Grid>
      </Paper>
    </Box>
  );
}

export default ProfilePage;