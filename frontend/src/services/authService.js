import axios from 'axios';
import api from '../utils/api'; // Use the configured instance

const API_URL = 'http://127.0.0.1:8000/api/employees/';
const AUTH_API_URL = '/employees'; // Adjust if your auth endpoints are different

export const loginUser = async (username, password) => {
  try {
    // Step 1: Login to get token
    const loginResponse = await axios.post(`${API_URL}login/`, { username, password });
    localStorage.setItem('token', loginResponse.data.access);
    localStorage.setItem('refreshToken', loginResponse.data.refresh);
    const token = loginResponse.data.access;
    console.log('Login token:', token); // Changed to log just the token, not the full response
    
    // Step 2: Get user details with the token (includes role)
    const userResponse = await axios.get(`${API_URL}user-details/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('API Response - User Details:', userResponse.data);
    console.log('Manager status from API:', userResponse.data.is_manager);
    
    // Step 3: Return combined data
    return {
      ...loginResponse.data,
      user: userResponse.data
    };
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// --- Add Password Reset Functions ---

export const requestPasswordReset = async (email) => {
  try {
    // Endpoint matches backend urls.py
    const response = await api.post(`${AUTH_API_URL}/password-reset/`, { email });
    return response.data; // e.g., { message: "Password reset email sent." }
  } catch (error) {
    console.error('Password reset request failed:', error.response?.data || error.message);
    // Rethrow a more specific error message if possible
    const message = error.response?.data?.email?.[0] || // Check for specific field error
                    error.response?.data?.detail ||
                    error.message ||
                    'Failed to send reset link.';
    throw new Error(message);
  }
};

export const confirmPasswordReset = async (uidb64, token, newPassword, confirmPassword) => {
   try {
     // Endpoint matches backend urls.py
     const response = await api.post(`${AUTH_API_URL}/password-reset/confirm/`, {
       uidb64: uidb64, // Match backend serializer field names
       token: token,
       new_password: newPassword,
       confirm_password: confirmPassword
     });
     return response.data; // e.g., { message: "Password has been reset." }
   } catch (error) {
     console.error('Password reset confirmation failed:', error.response?.data || error.message);
     // Rethrow a more specific error message
     const message = error.response?.data?.token?.[0] || // Check for specific field errors
                     error.response?.data?.uidb64?.[0] ||
                     error.response?.data?.new_password?.[0] ||
                     error.response?.data?.confirm_password?.[0] ||
                     error.response?.data?.detail ||
                     error.message ||
                     'Failed to reset password.';
     throw new Error(message);
   }
};