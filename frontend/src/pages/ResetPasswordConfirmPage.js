import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { confirmPasswordReset } from '../services/authService';
import companyLogo from '../assets/logos/company-logo.svg';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress, Paper,
  InputAdornment, IconButton, Link as MuiLink
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const ResetPasswordConfirmPage = () => {
  const { uidb64, token } = useParams(); // Get uid and token from URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (e) => e.preventDefault();
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);
  const handleMouseDownConfirmPassword = (e) => e.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!uidb64 || !token) {
        setError('Invalid reset link. Please request a new one.');
        return;
    }
    setLoading(true);
    setSuccess('');

    try {
      const response = await confirmPasswordReset(uidb64, token, password, confirmPassword);
      setSuccess(response?.message || 'Your password has been reset successfully. Redirecting to login...');
      // Redirect after a delay
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      // Use the error message thrown by the service
      setError(err.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

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
              Set New Password
            </Typography>

            {error && <Alert severity="error" sx={{ width: '100%', mt: 1, mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ width: '100%', mt: 1, mb: 2 }}>{success}</Alert>}

            {!success && ( // Only show form if success message isn't displayed
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password" // Important for password managers
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  error={!!error && password !== confirmPassword && confirmPassword.length > 0} // Show error only if passwords don't match and confirm has input
                  helperText={error && password !== confirmPassword && confirmPassword.length > 0 ? 'Passwords do not match' : ''}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label="toggle confirm password visibility" onClick={handleClickShowConfirmPassword} onMouseDown={handleMouseDownConfirmPassword} edge="end">
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
              </Box>
            )}
             {success && (
                 <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
                    Proceed to Login Now
                 </MuiLink>
             )}
             {!success && (
                 <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
                    Back to Login
                 </MuiLink>
             )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPasswordConfirmPage;