import api from '../../../utils/api';
import { format, isValid, parseISO } from 'date-fns'; // Added parseISO for robustness

// Helper to format date safely (Improved to handle ISO strings)
const formatDateForAPI = (date) => {
    if (!date) return null;
    // Handle Date objects
    if (date instanceof Date && isValid(date)) {
        return format(date, 'yyyy-MM-dd');
    }
    // Handle ISO strings (common from API responses or date pickers)
    if (typeof date === 'string') {
        try {
            const parsedDate = parseISO(date); // Try parsing ISO 8601 string
            if (isValid(parsedDate)) {
                return format(parsedDate, 'yyyy-MM-dd');
            }
        } catch (e) {
            // Ignore parsing errors and fall through
        }
    }
    console.warn("Could not format date in formatDateForAPI:", date);
    return null; // Return null if formatting fails
};

// --- NEW Fetch Functions ---

/**
 * Fetches leave requests submitted BY the currently logged-in user.
 * Assumes backend endpoint like /leave/requests/my/ OR /leave/requests/?scope=my
 */
export const fetchMyLeaveRequestsAPI = async () => {
  try {
    // Adjust the URL/params based on your backend implementation
    // Option 1: Specific endpoint: const response = await api.get('/leave/requests/my/');
    // Option 2: Query parameter:
    const response = await api.get('/leave/requests/', { params: { scope: 'my' } });
    console.log("Fetched My Leave Requests:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my leave requests:", error.response?.data || error.message);
    throw error; // Re-throw for handling in UI/Redux
  }
};

/**
 * Fetches leave requests that require the logged-in user's APPROVAL.
 * Backend MUST filter based on user role (Manager, HR) and exclude user's own requests.
 * Assumes backend endpoint like /leave/requests/pending_approval/ OR /leave/requests/?scope=pending_approval
 */
export const fetchPendingApprovalsAPI = async () => {
  try {
    // Adjust the URL/params based on your backend implementation
    // Option 1: Specific endpoint: const response = await api.get('/leave/requests/pending_approval/');
    // Option 2: Query parameter:
    const response = await api.get('/leave/requests/', { params: { scope: 'pending_approval' } });
    console.log("Fetched Pending Approvals:", response.data);
    // The backend is responsible for returning the correct list based on the user's role (Manager/HR)
    // and filtering out their own requests.
    return response.data;
  } catch (error) {
    console.error("Error fetching pending approvals:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches ALL leave requests (e.g., for Admin/HR overview).
 * Backend MUST enforce permissions (only allow Admin/HR roles).
 * Assumes backend endpoint like /leave/requests/all/ OR /leave/requests/?scope=all
 */
export const fetchAllLeaveRequestsAPI = async (filters = {}) => {
    // Filters could include status, date range, department etc. passed as query params
  try {
    // Adjust the URL/params based on your backend implementation
    // Option 1: Specific endpoint: const response = await api.get('/leave/requests/all/', { params: filters });
    // Option 2: Query parameter:
    const response = await api.get('/leave/requests/', { params: { ...filters, scope: 'all' } });
    console.log("Fetched All Leave Requests:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all leave requests:", error.response?.data || error.message);
    throw error;
  }
};


// --- Create, Update, Action Functions ---

// Create a new leave request
export const createLeaveRequestAPI = async (requestData) => {
  // Ensure requestData contains the employee ID passed from the form/thunk
  console.log("Received requestData in createLeaveRequestAPI:", requestData);

  const dataToSend = {
      employee: requestData.employee, // <-- *** ADD THIS LINE ***
      leave_type: requestData.leave_type,
      start_date: formatDateForAPI(requestData.start_date),
      end_date: formatDateForAPI(requestData.end_date),
      reason: requestData.reason,
      // The comment below is likely incorrect based on the error, but keep it for now or remove if confirmed
      // // DO NOT send employee ID - backend identifies user from auth token
  };

  console.log("Data being sent to createLeaveRequestAPI:", dataToSend);

  // Add basic validation before sending
  if (!dataToSend.employee) { // <-- *** ADD EMPLOYEE VALIDATION ***
      console.error("Employee ID is missing before sending API request:", requestData.employee);
      throw new Error("Employee ID is required but missing.");
  }
  if (!dataToSend.start_date || !dataToSend.end_date) {
      console.error("Invalid start or end date after formatting:", requestData.start_date, requestData.end_date);
      throw new Error("Invalid start or end date provided.");
  }
   if (!dataToSend.leave_type) {
      throw new Error("Leave type is required.");
  }

  try {
    // The URL should be the base endpoint for creating requests
    const response = await api.post('/leave/requests/', dataToSend);
    return response.data;
  } catch (error) {
    // Log the detailed error from the backend
    console.error("Error creating leave request:", error.response?.data || error.message);
    // Re-throw the error so the thunk can handle it (e.g., show specific field errors)
    throw error;
  }
};

// Fetch details of a single leave request
export const fetchLeaveRequestDetailsAPI = async (requestId) => {
  try {
    // Backend must ensure user has permission to view this specific request
    const response = await api.get(`/leave/requests/${requestId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching leave request details for ${requestId}:`, error.response?.data || error.message);
    throw error;
  }
};

// --- Action APIs (Add try/catch for robustness) ---

export const approveManagerLeaveRequestAPI = async (requestId) => {
  try {
    const response = await api.post(`/leave/requests/${requestId}/approve_manager/`, {});
    return response.data;
  } catch (error) {
    console.error(`Error approving (manager) leave request ${requestId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const rejectManagerLeaveRequestAPI = async (requestId, reason) => {
  try {
    const response = await api.post(`/leave/requests/${requestId}/reject_manager/`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting (manager) leave request ${requestId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const approveHrLeaveRequestAPI = async (requestId) => {
   try {
    const response = await api.post(`/leave/requests/${requestId}/approve_hr/`, {});
    return response.data;
  } catch (error) {
    console.error(`Error approving (HR) leave request ${requestId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const rejectHrLeaveRequestAPI = async (requestId, reason) => {
  try {
    const response = await api.post(`/leave/requests/${requestId}/reject_hr/`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting (HR) leave request ${requestId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const cancelLeaveRequestAPI = async (requestId) => {
  try {
    // Backend must ensure only the employee who submitted or an admin can cancel
    const response = await api.post(`/leave/requests/${requestId}/cancel/`, {});
    return response.data;
  } catch (error) {
    console.error(`Error cancelling leave request ${requestId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const updateLeaveRequestAPI = async (requestId, updateData) => {
    // Backend must ensure only the employee who submitted (if pending) or admin can update
    const dataToSend = { ...updateData };
    if (dataToSend.start_date) {
        dataToSend.start_date = formatDateForAPI(dataToSend.start_date);
    }
    if (dataToSend.end_date) {
        dataToSend.end_date = formatDateForAPI(dataToSend.end_date);
    }
    // Remove fields that shouldn't be updated via PATCH if necessary (e.g., status changes via actions)
    // delete dataToSend.status;

    console.log(`Updating leave request ${requestId} with:`, dataToSend);

    // Add validation for dates if they were provided in updateData
    if (updateData.start_date && !dataToSend.start_date) {
         throw new Error("Invalid start date format for update.");
    }
     if (updateData.end_date && !dataToSend.end_date) {
        throw new Error("Invalid end date format for update.");
    }

    try {
        const response = await api.patch(`/leave/requests/${requestId}/`, dataToSend);
        return response.data;
    } catch (error) {
        console.error(`Error updating leave request ${requestId}:`, error.response?.data || error.message);
        throw error;
    }
};

// Optional: Add a function to fetch leave types if needed for the form
export const fetchLeaveTypesAPI = async () => {
    try {
        // Assuming an endpoint like /leave/types/ exists
        const response = await api.get('/leave/types/'); // Adjust endpoint if needed
        return response.data;
    } catch (error) {
        console.error("Error fetching leave types:", error.response?.data || error.message);
        throw error;
    }
}