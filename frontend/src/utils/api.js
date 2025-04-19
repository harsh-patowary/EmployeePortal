import axios from 'axios';

/**
 * API utilities for making requests to the backend
 */

// API base URL - use environment variable if available, fallback to localhost
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add token to all requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');
        
        console.log('Attempting to refresh token...');
        
        const response = await axios.post(`${API_URL}/employees/token/refresh/`, {
          refresh: refreshToken
        });
        
        // Save the new token
        localStorage.setItem('token', response.data.access);
        
        // Update header and retry
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Helper function to get auth token from localStorage
 * @returns {Object} Header object with Authorization if token exists
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Handle API errors consistently
 * @param {Error} error - The error from axios
 * @param {string} defaultMessage - Default message to show if no specific error
 * @returns {string} Error message to display
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response) {
    // The request was made and the server responded with an error status
    if (error.response.data.detail) {
      return error.response.data.detail;
    }
    
    // Check for form validation errors
    if (error.response.data) {
      const firstError = Object.entries(error.response.data)[0];
      if (firstError && firstError[1]) {
        return Array.isArray(firstError[1]) 
          ? `${firstError[0]}: ${firstError[1][0]}`
          : `${firstError[0]}: ${firstError[1]}`;
      }
    }
    
    return `Error ${error.response.status}: ${error.response.statusText}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response from server. Please check your internet connection.';
  } else {
    // Something happened in setting up the request
    return error.message || defaultMessage;
  }
};

/**
 * Format date for API requests
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDateForApi = (date) => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

/**
 * Format time for API requests
 * @param {Date} date - Date object with time information
 * @returns {string} Formatted time string (HH:MM:SS)
 */
export const formatTimeForApi = (date) => {
  if (!date) return null;
  return date.toTimeString().split(' ')[0];
};

export default api;