import api from '../../../utils/api'; // Use the configured instance
import { format, isValid } from 'date-fns'; // Import if needed for formatting

// Helper to format date safely
const formatDateForAPI = (date) => {
    if (!date) return null;
    // Check if it's a Date object (this should be the case now)
    if (date instanceof Date && isValid(date)) {
        return format(date, 'yyyy-MM-dd'); // Format to YYYY-MM-DD
    }
    // Add fallbacks if needed, but the primary path should handle Date objects
    if (typeof date === 'string') {
       // ... (existing string parsing logic as fallback) ...
    }
    console.warn("Could not format date in formatDateForAPI:", date);
    return null;
};


// Fetch all relevant leave requests for the user
export const fetchLeaveRequestsAPI = async () => {
  // Use 'api' instance, remove manual headers
  const response = await api.get('/leave/requests/'); // Use relative path if baseURL is set in api.js
  return response.data;
};

// Create a new leave request
export const createLeaveRequestAPI = async (requestData) => {
  // requestData should now contain Date objects for start_date and end_date
  const dataToSend = {
      leave_type: requestData.leave_type,
      start_date: formatDateForAPI(requestData.start_date), // Format the Date object
      end_date: formatDateForAPI(requestData.end_date),     // Format the Date object
      reason: requestData.reason,
      employee: requestData.employee, // Assuming this is passed correctly
      // No employee field here - backend uses auth
  };

  console.log("Data being sent by createLeaveRequestAPI:", dataToSend); // Check final payload

  if (!dataToSend.employee) {
    throw new Error("Employee ID is missing before sending to API.");
}
if (!dataToSend.start_date || !dataToSend.end_date) {
    throw new Error("Invalid start or end date after formatting.");
}

  const response = await api.post('/leave/requests/', dataToSend);
  return response.data;
};

// Fetch details of a single leave request
export const fetchLeaveRequestDetailsAPI = async (requestId) => {
  // Use 'api' instance, remove manual headers
  const response = await api.get(`/leave/requests/${requestId}/`);
  return response.data;
};


// --- Action APIs ---

// Manager Approve
export const approveManagerLeaveRequestAPI = async (requestId) => {
  // Use 'api' instance, remove manual headers
  const response = await api.post(`/leave/requests/${requestId}/approve_manager/`, {});
  return response.data;
};

// Manager Reject
export const rejectManagerLeaveRequestAPI = async (requestId, reason) => {
  // Use 'api' instance, remove manual headers
  const response = await api.post(`/leave/requests/${requestId}/reject_manager/`, { reason });
  return response.data;
};

// HR Approve
export const approveHrLeaveRequestAPI = async (requestId) => {
  // Use 'api' instance, remove manual headers
  const response = await api.post(`/leave/requests/${requestId}/approve_hr/`, {});
  return response.data;
};

// HR Reject
export const rejectHrLeaveRequestAPI = async (requestId, reason) => {
  // Use 'api' instance, remove manual headers
  const response = await api.post(`/leave/requests/${requestId}/reject_hr/`, { reason });
  return response.data;
};

// Employee Cancel
export const cancelLeaveRequestAPI = async (requestId) => {
  // Use 'api' instance, remove manual headers
  const response = await api.post(`/leave/requests/${requestId}/cancel/`, {});
  return response.data;
};

// Update a leave request
export const updateLeaveRequestAPI = async (requestId, updateData) => {
    // Format dates if they are being updated
    const dataToSend = { ...updateData }; // Start with all update data
    if (dataToSend.start_date) {
        dataToSend.start_date = formatDateForAPI(dataToSend.start_date);
    }
    if (dataToSend.end_date) {
        dataToSend.end_date = formatDateForAPI(dataToSend.end_date);
    }
    // Remove fields that shouldn't be updated via PATCH if necessary
    // delete dataToSend.employee;
    // delete dataToSend.status;

    // Use 'api' instance, remove manual headers
    const response = await api.patch(`/leave/requests/${requestId}/`, dataToSend);
    return response.data;
};