// src/features/attendance/hooks/useAttendance.js
import { useState, useEffect, useCallback } from 'react';
import attendanceService from '../services/attendanceService';

function useAttendance(employeeId = null, options = {}) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      if (employeeId) {
        response = await attendanceService.getEmployeeAttendance(employeeId);
      } else {
        response = await attendanceService.getAttendanceRecords();
      }
      
      setAttendanceData(response.results || response);
      setLoading(false);
    } catch (err) {
      setError('Failed to load attendance data');
      setLoading(false);
      console.error('Error fetching attendance data:', err);
    }
  });
  
  // Initial fetch
  useEffect(() => {
    fetchAttendanceData();
  }, [employeeId]);
  
  // Auto refresh if enabled
  useEffect(() => {
    let interval;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAttendanceData();
      }, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, employeeId, fetchAttendanceData]);
  
  return {
    attendanceData,
    loading,
    error,
    refetch: fetchAttendanceData
  };
}

export default useAttendance;