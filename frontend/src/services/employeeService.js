import api from '../utils/api'; // Use the configured instance

const API_URL = '/employees'; // Use relative path if proxy is set up, or keep full path

// Remove getAuthHeader if api instance handles it

export const fetchEmployee = async () => {
  try {
    console.log('Fetching employee details...'); // Simplified log
    // Use the api instance directly
    const response = await api.get(`${API_URL}/user-details/`);
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
    const response = await api.get(`${API_URL}/employees/`); // Corrected endpoint
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    } else if (Array.isArray(response.data)) {
      return response.data;
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
    console.log(">>> getManagerTeam Service: Attempting API call...");
    const response = await api.get(`${API_URL}/manager-team/`); // Corrected endpoint
    console.log(">>> getManagerTeam Service: Raw API Response:", response);
    console.log(">>> getManagerTeam Service: Raw Response Data:", response.data);

    if (response.data && Array.isArray(response.data.team_members)) {
      console.log(">>> getManagerTeam Service: Success - Returning team_members array.");
      return response.data.team_members;
    } else {
      console.error(">>> getManagerTeam Service: ERROR - Unexpected response structure. Data received:", response.data);
      throw new Error("Unexpected response structure received from /manager-team/");
    }
  } catch (error) {
    console.error('>>> getManagerTeam Service: CATCH BLOCK - Error fetching manager team:', error);
    if (error.response) {
        console.error('>>> getManagerTeam Service: CATCH BLOCK - Error Response Status:', error.response.status);
        console.error('>>> getManagerTeam Service: CATCH BLOCK - Error Response Data:', error.response.data);
    } else {
        console.error('>>> getManagerTeam Service: CATCH BLOCK - Error Message:', error.message);
    }
    if (error.response?.status === 403) {
      console.warn(">>> getManagerTeam Service: User does not have manager permissions (403). Returning empty array.");
      return [];
    }
    throw error;
  }
};

export const getUserDetails = async () => {
  try {
    const response = await api.get(`${API_URL}/user-details/`);
    console.log("Fetched user details:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error.response?.data || error.message);
    if (error.response?.status === 401) {
       console.error("Unauthorized fetching user details. Token might be invalid.");
    }
    throw error;
  }
};
