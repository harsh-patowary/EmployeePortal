import React from 'react';
import { 

Card,
CardContent,
Typography,
Avatar,
Box
} from '@mui/material';


const UserDetailsComponent = ({ user }) => {
    console.log(user?.name);
return (
    <Card sx={{ maxWidth: 345, m: 2 }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                    sx={{ width: 56, height: 56, mr: 2 }}
                    src={user?.avatar}
                    alt={user?.name}
                >
                    {user?.name?.charAt(0)}
                </Avatar>
                <Box>
                    <Typography variant="h6" component="div">
                        {user?.name}
                        
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {user?.position}
                    </Typography>
                </Box>
            </Box>
        </CardContent>
    </Card>
);
};

export default UserDetailsComponent;