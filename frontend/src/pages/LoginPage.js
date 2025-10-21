import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'; // Import RouterLink
import companyLogo from '../assets/logos/company-logo.svg';
import { loginUser } from '../services/authService';
import { selectIsAuthenticated, selectError, fetchUserDetails } from '../redux/employeeSlice';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress, Paper,
  InputAdornment, IconButton, Grid, Link as MuiLink // Import Grid and MuiLink
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

      if (loginData?.access) {
         await dispatch(fetchUserDetails()).unwrap();
         navigate(from, { replace: true });
      } else {
         setLocalError('Login failed. Please check credentials.');
      }

    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.Error || 
                           err.message ||
                           'Login failed. Please check credentials.';
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper elevation={5} sx={{ p: 4, borderRadius: 2, border: `1px solid ${theme => theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box component="img" src={companyLogo} alt="Company Logo" sx={{ width: 120, height: 'auto', mb: 3 }} />
            <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
              Employee Portal Login
            </Typography>

            {(localError || (reduxError && typeof reduxError === 'string')) && (
              <Alert severity="error" sx={{ width: '100%', mt: 1, mb: 2 }}>
                {localError || reduxError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
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
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !username || !password}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Grid container justifyContent="flex-end">
                 <Grid item>
                   <MuiLink component={RouterLink} to="/forgot-password" variant="body2">
                     Forgot password?
                   </MuiLink>
                 </Grid>
               </Grid>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;