import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Avatar,
  Box,
  Chip,
  useTheme,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import TaskIcon from '@mui/icons-material/Task';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';

const UserDetailsComponent = ({ user }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // User data preparation
  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User';
  const email = user?.email || 'No email provided';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : '?';
  const userPosition = user?.job_title || user?.role || 'Employee';
  const department = user?.department || 'General';

  // Generate a consistent avatar color based on user name
  const getAvatarColor = (name) => {
    const colors = [
      '#1976d2', '#2196f3', '#03a9f4', // Blues
      '#00acc1', '#00bcd4', '#26c6da', // Cyans
      '#009688', '#4caf50', '#8bc34a', // Greens
      '#673ab7', '#9c27b0', '#e91e63', // Purples/Pinks
    ];
    
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    hash = Math.abs(hash);
    return colors[hash % colors.length];
  };

  // Task click handler
  const handleTaskClick = () => {
    navigate('/tasks');
  };

  // Sample tasks (just for UI display)
  const tasks = [
    {
      id: 1,
      title: "Complete quarterly report",
      priority: "high",
      deadline: "2025-04-30",
    },
    {
      id: 2,
      title: "Update project documentation",
      priority: "medium",
      deadline: "2025-05-05",
    }
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }}>
      {/* Background color block */}
      <Box 
        sx={{ 
          height: 80, 
          width: '100%', 
          bgcolor: theme.palette.mode === 'dark' 
            ? theme.palette.grey[800] 
            : theme.palette.primary.main,
          position: 'absolute',
          top: 0,
          left: 0,
          borderRadius: '8px 8px 0 0',
          opacity: theme.palette.mode === 'dark' ? 0.6 : 0.8
        }} 
      />

      {/* Content */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        pt: 5,
        position: 'relative',
        zIndex: 1,
        height: '100%'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start',
          mb: 2
        }}>
          <Avatar
            sx={{ 
              width: 70, 
              height: 70, 
              border: '3px solid white',
              boxShadow: theme.shadows[3],
              bgcolor: getAvatarColor(userName),
              fontSize: '1.75rem',
              fontWeight: 'bold'
            }}
            src={user?.profile_picture_url}
            alt={userName}
          >
            {userInitial}
          </Avatar>

          <Box sx={{ 
            ml: 2,
            mt: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                fontWeight: 'bold',
                lineHeight: 1.2
              }}
            >
              {userName}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Chip 
                size="small"
                label={userPosition}
                color="primary"
                variant="outlined"
                sx={{ 
                  borderRadius: 1,
                  textTransform: 'capitalize',
                  fontWeight: 500,
                  mr: 1
                }}
                icon={<BadgeIcon sx={{ fontSize: '0.875rem !important' }} />}
              />
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ textTransform: 'capitalize' }}
              >
                {department}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 2
        }}>
          <EmailIcon 
            fontSize="small" 
            color="action" 
            sx={{ mr: 1, opacity: 0.7 }}  
          />
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}
          >
            {email}
          </Typography>
        </Box>

        {/* Tasks Section */}
        <Box sx={{ mt: 'auto' }}>
          <Typography 
            variant="subtitle2" 
            color="text.primary"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Priority Tasks
          </Typography>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              borderRadius: 1,
              overflow: 'hidden',
              cursor: 'pointer',
              '&:hover': { bgcolor: theme.palette.action.hover }
            }}
          >
            <List disablePadding dense>
              {tasks.map((task) => (
                <ListItem 
                  key={task.id}
                  divider={task.id !== tasks[tasks.length-1].id}
                  onClick={handleTaskClick}
                  sx={{
                    py: 1,
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {task.priority === 'high' ? 
                      <AssignmentLateIcon fontSize="small" color="error" /> : 
                      <TaskIcon fontSize="small" color="primary" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" noWrap>
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Due {new Date(task.deadline).toLocaleDateString()}
                      </Typography>
                    }
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default UserDetailsComponent;