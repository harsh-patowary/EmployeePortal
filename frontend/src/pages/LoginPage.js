import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import companyLogo from '../assets/logos/company-logo.svg';
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
import { fetchEmployeeData } from '../redux/employeeSlice';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Make the API call to login
      const response = await loginUser(username, password);
      console.log('Login successful:', response);
      
      // Store token in localStorage
      localStorage.setItem('token', response.access);
      
      // Dispatch login success action to Redux (basic auth)
      dispatch(loginSuccess(response));
      
      // Fetch detailed employee data to determine roles
      try {
        await dispatch(fetchEmployeeData()).unwrap();
      } catch (empError) {
        console.error('Failed to fetch employee details:', empError);
        // Continue with login anyway, roles will be limited
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={5} 
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
          <Box
            component="img"
            src={companyLogo}
            alt="Company Logo"
            sx={{
              width: 120,
              height: 'auto',
              mb: 3
            }}
          />
          
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
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Harsh Patowary. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
}

export default LoginPage;