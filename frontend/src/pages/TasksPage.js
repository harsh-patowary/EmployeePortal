import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Checkbox,
  Divider,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Tooltip,
  Fab,
  FormHelperText
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';

function TasksPage() {
  // Sample tasks - replace with actual data in production
  const initialTasks = [
    { 
      id: 1, 
      title: 'Complete project proposal', 
      completed: false, 
      priority: 'High',
      description: 'Draft the Q3 project proposal with timeline and resource allocation',
      assignee: 'John Doe', 
      dueDate: '2025-05-15'
    },
    { 
      id: 2, 
      title: 'Review candidate applications', 
      completed: true, 
      priority: 'Medium',
      description: 'Review applications for the Senior Developer position',
      assignee: 'Sarah Miller', 
      dueDate: '2025-04-28'
    },
    { 
      id: 3, 
      title: 'Update department budget', 
      completed: false, 
      priority: 'High',
      description: 'Revise department budget for Q2 based on new requirements',
      assignee: 'Michael Brown', 
      dueDate: '2025-05-03'
    },
    { 
      id: 4, 
      title: 'Schedule team training sessions', 
      completed: false, 
      priority: 'Low',
      description: 'Arrange training sessions for the new software deployment',
      assignee: 'Emily Chen', 
      dueDate: '2025-05-10'
    },
    { 
      id: 5, 
      title: 'Send weekly reports', 
      completed: true, 
      priority: 'Medium',
      description: 'Compile and send project status reports to stakeholders',
      assignee: 'Robert Johnson', 
      dueDate: '2025-04-26'
    },
  ];

  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignee: '',
    dueDate: '',
    completed: false
  });
  const [errors, setErrors] = useState({});

  const handleToggle = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDelete = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  // Filter tasks based on the selected filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'Completed') return task.completed;
    if (filter === 'Active') return !task.completed;
    if (filter === 'High') return task.priority === 'High';
    if (filter === 'Medium') return task.priority === 'Medium';
    if (filter === 'Low') return task.priority === 'Low';
    return true; // 'All' filter
  });

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getAssigneeInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4'];
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    hash = Math.abs(hash);
    return colors[hash % colors.length];
  };

  const handleOpenDialog = () => {
    setOpen(true);
    setErrors({});
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'Medium',
      assignee: '',
      dueDate: '',
      completed: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newTask.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    if (!newTask.assignee.trim()) {
      newErrors.assignee = 'Assignee is required';
    }
    if (!newTask.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTask = () => {
    if (!validateForm()) return;

    const task = {
      ...newTask,
      id: Date.now() // Simple ID generation
    };
    
    setTasks([task, ...tasks]);
    handleCloseDialog();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Task Management</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Track and manage your tasks
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Task
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="task-filter-label">Filter</InputLabel>
          <Select
            labelId="task-filter-label"
            value={filter}
            label="Filter"
            onChange={handleFilterChange}
            size="small"
          >
            <MenuItem value="All">All Tasks</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <Divider />
            <MenuItem value="High">High Priority</MenuItem>
            <MenuItem value="Medium">Medium Priority</MenuItem>
            <MenuItem value="Low">Low Priority</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <List>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem
                  sx={{ 
                    backgroundColor: task.completed ? 'action.hover' : 'inherit',
                    py: 1.5
                  }}
                >
                  <Checkbox
                    checked={task.completed}
                    onChange={() => handleToggle(task.id)}
                    sx={{ mr: 2 }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <ListItemText
                        primary={task.title}
                        sx={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'text.secondary' : 'text.primary',
                          '& .MuiTypography-root': {
                            fontWeight: task.priority === 'High' ? 500 : 400
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                        <Chip 
                          label={task.priority} 
                          size="small" 
                          color={getPriorityColor(task.priority)}
                          sx={{ minWidth: 80, mr: 1 }}
                        />
                        <IconButton 
                          edge="end" 
                          onClick={() => handleDelete(task.id)}
                          size="small"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {/* Description - show condensed if long */}
                    {task.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mb: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {task.description}
                      </Typography>
                    )}
                    
                    {/* Task details */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        fontSize: '0.75rem',
                        color: 'text.secondary'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <Tooltip title={task.assignee}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              fontSize: '0.75rem',
                              mr: 0.5,
                              bgcolor: getAvatarColor(task.assignee)
                            }}
                          >
                            {getAssigneeInitials(task.assignee)}
                          </Avatar>
                        </Tooltip>
                        <Typography variant="caption">{task.assignee}</Typography>
                      </Box>
                      
                      {task.dueDate && (
                        <Typography variant="caption">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {index < filteredTasks.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <ListItemText 
                primary={
                  <Typography align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No {filter.toLowerCase()} tasks found
                  </Typography>
                } 
              />
            </ListItem>
          )}
        </List>
      </Paper>

      {/* Add Task Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1 }} />
            Create New Task
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Task Title"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              error={!!errors.title}
              helperText={errors.title}
              autoFocus
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              value={newTask.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
            
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="priority-select-label">Priority</InputLabel>
                  <Select
                    labelId="priority-select-label"
                    name="priority"
                    value={newTask.priority}
                    label="Priority"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!!errors.dueDate}
                  helperText={errors.dueDate}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Assignee"
                  name="assignee"
                  value={newTask.assignee}
                  onChange={handleInputChange}
                  placeholder="Enter assignee's name"
                  InputProps={{
                    startAdornment: (
                      <PersonIcon color="action" sx={{ mr: 1 }} />
                    ),
                  }}
                  error={!!errors.assignee}
                  helperText={errors.assignee}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddTask} 
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TasksPage;