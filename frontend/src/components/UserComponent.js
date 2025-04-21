import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box
} from '@mui/material';


const UserDetailsComponent = ({ user }) => {
    // Combine first and last names for display
    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User';
    // Get the first initial for the Avatar fallback
    const userInitial = userName ? userName.charAt(0).toUpperCase() : '?';
    // Use job title or role as position
    const userPosition = user?.job_title || user?.role || 'Employee';

    return (
        // Removed Card wrapper as it's already inside a Paper in DashboardPage
        // Removed margin (m: 2) as spacing is handled by Grid in DashboardPage
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                    sx={{ width: 56, height: 56, mr: 2 }}
                    src={user?.profile_picture_url} // Use the correct field if available
                    alt={userName}
                >
                    {userInitial} {/* Fallback to first initial */}
                </Avatar>
                <Box>
                    <Typography variant="h6" component="div">
                        {userName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {userPosition} {/* Display job title or role */}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default UserDetailsComponent;