/**
 * API utilities for making requests to the backend
 */

// API base URL - use environment variable if available, fallback to localhost
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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