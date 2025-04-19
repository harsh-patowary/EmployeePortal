import axios from 'axios';

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

export const getAllEmployees = async () => {
  try {
    // Use the token from localStorage
    const headers = getAuthHeader();
    
    const response = await axios.get(`${API_URL}/employees/`, {
      headers
    });
    
    console.log('Fetched all employees:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all employees:', error.response?.data || error.message);
    throw new Error(`Error fetching all employees: ${error.response?.status || error.message}`);
  }
};
