import axios from 'axios';
import api from '../utils/api'; // Assuming you have the api utility from previous steps

const API_URL = 'http://127.0.0.1:8000/api/employees';

// Helper function to get authentication header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchEmployee = async () => {
  try {
    // Use the token from localStorage
    const headers = getAuthHeader();
    
    console.log('Fetching employee details with headers:', headers);
    
    const response = await axios.get(`${API_URL}/user-details/`, {
      headers
    });
    
    console.log('Fetched employee details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee details:', error.response?.data || error.message);
    throw new Error(`Error fetching employee details: ${error.response?.status || error.message}`);
  }
};

// Function to get all employees (for Admin/HR roles)
export const getAllEmployees = async () => {
  try {
    const response = await api.get('/employees/employees/');
    // Ensure the response is an array, DRF list views might return { results: [...] }
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    } else if (Array.isArray(response.data)) {
      return response.data; // Handle cases where it's a flat array
    } else {
      console.error("Unexpected response structure for all employees:", response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching all employees:', error.response?.data || error.message);
    throw error;
  }
};

export const getManagerTeam = async () => {
  try {
    // Use the api utility which handles auth automatically
    const response = await api.get('/employees/manager-team/'); 
    // The backend returns an object: { manager: {...}, team_size: X, team_members: [...] }
    // We only need the team_members array for the dropdown
    if (response.data && Array.isArray(response.data.team_members)) {
      console.log("Fetched manager team:", response.data.team_members);
      return response.data.team_members; 
    } else {
      console.error("Unexpected response structure for manager team:", response.data);
      return []; // Return empty array if structure is wrong
    }
  } catch (error) {
    console.error('Error fetching manager team:', error.response?.data || error.message);
    // Handle specific errors like 403 Forbidden if the user isn't a manager
    if (error.response?.status === 403) {
      console.warn("User does not have manager permissions to fetch team.");
      return []; // Return empty array for non-managers
    }
    throw error; // Re-throw other errors
  }
};

export const getUserDetails = async () => {
  try {
    // Use the api utility which handles auth automatically
    const response = await api.get('/employees/user-details/'); // Match your backend URL
    console.log("Fetched user details:", response.data);
    return response.data; 
  } catch (error) {
    console.error('Error fetching user details:', error.response?.data || error.message);
    // Handle specific errors if needed, e.g., redirect on 401 if interceptor doesn't handle it
    if (error.response?.status === 401) {
       console.error("Unauthorized fetching user details. Token might be invalid.");
       // Optionally trigger logout or redirect here if needed
    }
    throw error; // Re-throw error to be caught by the thunk
  }
};
