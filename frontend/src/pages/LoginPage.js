import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../services/authService'; // Assuming authService handles login API call
import { selectIsAuthenticated, selectError, fetchUserDetails } from '../redux/employeeSlice'; 
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress
} from '@mui/material';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const reduxError = useSelector(selectError);

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    try {
      const loginData = await loginUser(username, password);
      
      if (loginData) {
         await dispatch(fetchUserDetails()).unwrap();
         navigate(from, { replace: true });
      } else {
         setLocalError('Login failed. Please check credentials.'); 
      }

    } catch (err) {
      console.error("Login error:", err);
      setLocalError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
       <Box
         sx={{
           marginTop: 8,
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'center',
         }}
       >
         <Typography component="h1" variant="h5">
           Sign in
         </Typography>
         {(localError || (reduxError && typeof reduxError === 'string')) && (
           <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
             {localError || reduxError}
           </Alert>
         )}
         <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
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
           />
           <Button
             type="submit"
             fullWidth
             variant="contained"
             sx={{ mt: 3, mb: 2 }}
             disabled={loading}
           >
             {loading ? <CircularProgress size={24} /> : 'Sign In'}
           </Button>
         </Box>
       </Box>
    </Container>
  );
};

export default LoginPage;