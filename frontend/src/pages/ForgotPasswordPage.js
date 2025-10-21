import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';
import companyLogo from '../assets/logos/company-logo.svg';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress, Paper, Link as MuiLink
} from '@mui/material';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await requestPasswordReset(email);
      setSuccess(response?.message || 'If an account with that email exists, a password reset link has been sent.');
      setEmail(''); // Clear email field on success
    } catch (err) {
      // Use the error message thrown by the service
      setError(err.message || 'Failed to send reset link. Please try again.');
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
            <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Enter your email address and we'll send you instructions to reset your password.
            </Typography>

            {error && <Alert severity="error" sx={{ width: '100%', mt: 1, mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ width: '100%', mt: 1, mb: 2 }}>{success}</Alert>}

            {!success && ( // Only show form if success message isn't displayed
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  type="email" // Use email type for validation
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading || !email} // Disable if loading or email is empty
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                </Button>
              </Box>
            )}

            <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
              Back to Login
            </MuiLink>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;