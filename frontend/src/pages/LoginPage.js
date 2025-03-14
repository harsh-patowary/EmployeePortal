import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { loginUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Container, 
  Box, 
  Typography, 
  Alert, 
  Paper, 
  Avatar,
  useTheme
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginUser(username, password);
      dispatch(loginSuccess({ 
        user: { username },
        access: data.access 
      }));
      navigate('/dashboard');
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 8, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ 
            bgcolor: theme.palette.primary.main,
            width: 56, 
            height: 56,
            mb: 2 
          }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
            Employee Portal Login
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                py: 1.5,
                fontWeight: 500,
                fontSize: '1rem'
              }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Employee Management System
        </Typography>
      </Box>
    </Container>
  );
}

export default LoginPage;