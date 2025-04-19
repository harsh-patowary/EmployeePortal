import api from '../../../utils/api';
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
      const response = await api.get('/attendance/', { params });
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
      const response = await api.get('/attendance/employee_history/', {
        params: { employee_id: employeeId }
      });
      console.log('Employee attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee attendance:', error);
      throw error;
    }
  },
  
  // Record check-in (No longer needs employeeId in body)
  checkIn: async () => { // Remove employeeId parameter
    try {
      // Send POST request without a body, backend uses authenticated user
      const response = await api.post('/attendance/check_in/'); 
      // Expecting { record: ... } from backend now
      return response.data; 
    } catch (error) {
      console.error('Error recording check-in:', error);
      throw error;
    }
  },
  
  // Record check-out (No longer needs employeeId in body)
  checkOut: async () => { // Remove employeeId parameter
    try {
      // Send POST request without a body, backend uses authenticated user
      const response = await api.post('/attendance/check_out/'); 
      // Expecting { record: ... } from backend now
      return response.data; 
    } catch (error) {
      console.error('Error recording check-out:', error);
      throw error;
    }
  },
  
  // Create manual attendance record
  createAttendanceRecord: async (attendanceData) => {
    try {
      const response = await api.post(
        '/attendance/', 
        attendanceData
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
      const response = await api.patch(
        `/attendance/${id}/`, 
        attendanceData
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
      await api.delete(`/attendance/${id}/`);
      return true;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  }
};

export default attendanceService;