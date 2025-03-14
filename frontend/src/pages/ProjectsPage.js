import React from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent, CardHeader, LinearProgress } from '@mui/material';

function ProjectsPage() {
  // Sample projects data - replace with actual data in production
  const projects = [
    { id: 1, name: 'Website Redesign', progress: 75, status: 'In Progress', team: 'Design' },
    { id: 2, name: 'Mobile App Development', progress: 30, status: 'In Progress', team: 'Development' },
    { id: 3, name: 'Database Migration', progress: 100, status: 'Completed', team: 'IT' },
    { id: 4, name: 'HR System Implementation', progress: 10, status: 'Planning', team: 'HR Tech' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Projects</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Overview of all company projects
      </Typography>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} key={project.id}>
            <Paper 
              elevation={1}
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                height: '100%'
              }}
            >
              <Card sx={{ height: '100%', border: 'none', boxShadow: 'none' }}>
                <CardHeader 
                  title={project.name} 
                  subheader={`Team: ${project.team} • Status: ${project.status}`}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={project.progress} 
                        sx={{
                          height: 8,
                          borderRadius: 5,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: project.progress === 100 ? 'success.main' : 'primary.main',
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">{`${project.progress}%`}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ProjectsPage;