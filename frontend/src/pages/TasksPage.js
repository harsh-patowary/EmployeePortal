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
  MenuItem
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

function TasksPage() {
  // Sample tasks - replace with actual data in production
  const initialTasks = [
    { id: 1, title: 'Complete project proposal', completed: false, priority: 'High' },
    { id: 2, title: 'Review candidate applications', completed: true, priority: 'Medium' },
    { id: 3, title: 'Update department budget', completed: false, priority: 'High' },
    { id: 4, title: 'Schedule team training sessions', completed: false, priority: 'Low' },
    { id: 5, title: 'Send weekly reports', completed: true, priority: 'Medium' },
  ];

  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState('All');

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Task Management</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Track and manage your tasks
      </Typography>

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
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <List>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={task.priority} 
                        size="small" 
                        color={getPriorityColor(task.priority)}
                        sx={{ minWidth: 80 }}
                      />
                      <IconButton edge="end" onClick={() => handleDelete(task.id)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>
                  }
                  sx={{ 
                    backgroundColor: task.completed ? 'action.hover' : 'inherit'
                  }}
                >
                  <Checkbox
                    checked={task.completed}
                    onChange={() => handleToggle(task.id)}
                    sx={{ mr: 2 }}
                  />
                  <ListItemText
                    primary={task.title}
                    sx={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'text.secondary' : 'text.primary'
                    }}
                  />
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
    </Box>
  );
}

export default TasksPage;