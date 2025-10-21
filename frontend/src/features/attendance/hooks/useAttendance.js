// src/features/attendance/hooks/useAttendance.js
import { useState, useEffect, useCallback, useRef } from 'react';
import attendanceService from '../services/attendanceService';

function useAttendance(employeeId = null, options = {}) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  
  // Use a ref to store the previous data for comparison
  const prevDataRef = useRef(null);
  
  // Helper to check if data has changed
  const hasDataChanged = (oldData, newData) => {
    if (!oldData || !newData) return true;
    if (oldData.length !== newData.length) return true;
    
    // Simple hash to compare data
    const hashRecord = (record) => {
      const { id, check_in, check_out, status, date, notes } = record;
      return `${id}-${check_in}-${check_out}-${status}-${date}-${notes}`;
    };
    
    const oldHashes = new Set(oldData.map(hashRecord));
    return newData.some(record => !oldHashes.has(hashRecord(record)));
  };
  
  // Silent background fetch - doesn't update loading state
  const silentFetch = useCallback(async () => {
    try {
      let response;
      
      if (employeeId) {
        response = await attendanceService.getEmployeeAttendance(employeeId);
      } else {
        response = await attendanceService.getAttendanceRecords();
      }
      
      // Handle potential null response
      const data = response?.results || response || [];
      const processedData = Array.isArray(data) ? data : [];
      
      // Only update UI if data has actually changed
      if (hasDataChanged(prevDataRef.current, processedData)) {
        console.log('Data changed, updating UI');
        setAttendanceData(processedData);
        prevDataRef.current = processedData;
      } else {
        console.log('No changes detected, UI not updated');
      }
      
      setError(null); // Clear any previous errors
      return processedData;
    } catch (err) {
      console.error('Error in silent fetch:', err);
      // Don't update error state for silent fetches
      return prevDataRef.current || [];
    }
  }, [employeeId]);
  
  // Full fetch with loading state
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      if (employeeId) {
        response = await attendanceService.getEmployeeAttendance(employeeId);
      } else {
        response = await attendanceService.getAttendanceRecords();
      }
      
      // Handle potential null response
      const data = response?.results || response || [];
      const processedData = Array.isArray(data) ? data : [];
      
      setAttendanceData(processedData);
      prevDataRef.current = processedData;
      setError(null); // Clear any previous errors
      return processedData;
    } catch (err) {
      setError('Failed to load attendance data');
      console.error('Error fetching attendance data:', err);
      return [];
    } finally {
      setLoading(false); // Always set loading to false
    }
  }, [employeeId]); // Add employeeId as dependency
  
  // Initial fetch
  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]); // Use the callback with its dependencies
  
  // Auto refresh if enabled - using silent fetch
  useEffect(() => {
    let interval;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        silentFetch();
      }, refreshInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, refreshInterval, silentFetch]);
  
  // Add manual refetch capability
  const refetch = async () => {
    console.log('Manually refetching attendance data');
    return await fetchAttendanceData();
  };
  
  return {
    attendanceData,
    loading,
    error,
    refetch
  };
}

export default useAttendance;