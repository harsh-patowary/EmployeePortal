import axios from 'axios';
import { mockAttendanceData } from '../mock/mockData';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
console.log('API URL:', process.env.REACT_APP_API_URL || 'http://localhost:8000/api');
// Set this to false to use the real backend API
const USE_MOCK_DATA = false;

const DEBUG = true;
// Helper function to get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (DEBUG) console.log('Auth token available:', Boolean(token));
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const attendanceService = {
  // Get all attendance records (with pagination and filters)
  getAttendanceRecords: async (page = 1, filters = {}) => {
    if (USE_MOCK_DATA) {
      return {
        results: mockAttendanceData,
        count: mockAttendanceData.length,
        next: null,
        previous: null
      };
    }
    
    try {
      const params = { page, ...filters };
      console.log('Fetching attendance records from:', `${API_URL}/attendance/`);
      const response = await axios.get(`${API_URL}/attendance/`, {
        headers: getAuthHeader(),
        params
      });
      console.log('Attendance records response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  },
  
  // Get attendance for a specific employee
  getEmployeeAttendance: async (employeeId) => {
    if (USE_MOCK_DATA) {
      const filteredData = mockAttendanceData.filter(record => 
        record.employee.toString() === employeeId.toString()
      );
      return {
        results: filteredData,
        count: filteredData.length,
        next: null,
        previous: null
      };
    }
    
    try {
      const response = await axios.get(`${API_URL}/attendance/employee_history/`, {
        headers: getAuthHeader(),
        params: { employee_id: employeeId }
      });
      console.log('Employee attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee attendance:', error);
      throw error;
    }
  },
  
  // Record check-in
  checkIn: async (employeeId) => {
    try {
      const response = await axios.post(
        `${API_URL}/attendance/check_in/`, 
        { employee_id: employeeId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error recording check-in:', error);
      throw error;
    }
  },
  
  // Record check-out
  checkOut: async (employeeId) => {
    try {
      const response = await axios.post(
        `${API_URL}/attendance/check_out/`, 
        { employee_id: employeeId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error recording check-out:', error);
      throw error;
    }
  },
  
  // Create manual attendance record
  createAttendanceRecord: async (attendanceData) => {
    try {
      const response = await axios.post(
        `${API_URL}/attendance/`, 
        attendanceData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
  },
  
  // Update attendance record
  updateAttendanceRecord: async (id, attendanceData) => {
    try {
      const response = await axios.patch(
        `${API_URL}/attendance/${id}/`, 
        attendanceData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  },
  
  // Delete attendance record
  deleteAttendanceRecord: async (id) => {
    try {
      await axios.delete(`${API_URL}/attendance/${id}/`, {
        headers: getAuthHeader()
      });
      return true;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  }
};

export default attendanceService;