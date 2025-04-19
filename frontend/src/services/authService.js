import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/employees/';

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