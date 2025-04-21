import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'; // Import createSelector
import {
  fetchLeaveRequestsAPI,
  createLeaveRequestAPI,
  approveManagerLeaveRequestAPI,
  rejectManagerLeaveRequestAPI,
  approveHrLeaveRequestAPI,
  rejectHrLeaveRequestAPI,
  cancelLeaveRequestAPI,
  updateLeaveRequestAPI,
  // fetchLeaveRequestDetailsAPI // Import if needed later
} from '../services/leaveService';

// --- Async Thunks ---

export const fetchLeaveRequests = createAsyncThunk(
  'leave/fetchLeaveRequests',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchLeaveRequestsAPI();
      return data;
    } catch (error) {
      console.error("fetchLeaveRequests Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch leave requests');
    }
  }
);

export const createLeaveRequest = createAsyncThunk(
  'leave/createLeaveRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const data = await createLeaveRequestAPI(requestData);
      return data;
    } catch (error) {
      console.error("createLeaveRequest Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to create leave request');
    }
  }
);

export const updateLeaveRequest = createAsyncThunk(
    'leave/updateLeaveRequest',
    async ({ requestId, updateData }, { rejectWithValue }) => {
        try {
            const data = await updateLeaveRequestAPI(requestId, updateData);
            return data;
        } catch (error) {
            console.error("updateLeaveRequest Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || 'Failed to update leave request');
        }
    }
);

export const approveManagerLeaveRequest = createAsyncThunk(
  'leave/approveManagerLeaveRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await approveManagerLeaveRequestAPI(requestId);
      return data;
    } catch (error) {
      console.error("approveManagerLeaveRequest Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to approve request (Manager)');
    }
  }
);

export const rejectManagerLeaveRequest = createAsyncThunk(
  'leave/rejectManagerLeaveRequest',
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      const data = await rejectManagerLeaveRequestAPI(requestId, reason);
      return data;
    } catch (error) {
      console.error("rejectManagerLeaveRequest Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to reject request (Manager)');
    }
  }
);

export const approveHrLeaveRequest = createAsyncThunk(
  'leave/approveHrLeaveRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await approveHrLeaveRequestAPI(requestId);
      return data; // This response should include the updated request AND potentially the updated employee balance
    } catch (error) {
      console.error("approveHrLeaveRequest Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to approve request (HR)');
    }
  }
);

export const rejectHrLeaveRequest = createAsyncThunk(
  'leave/rejectHrLeaveRequest',
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      const data = await rejectHrLeaveRequestAPI(requestId, reason);
      return data;
    } catch (error) {
      console.error("rejectHrLeaveRequest Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to reject request (HR)');
    }
  }
);

export const cancelLeaveRequest = createAsyncThunk(
  'leave/cancelLeaveRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await cancelLeaveRequestAPI(requestId);
      return data;
    } catch (error) {
      console.error("cancelLeaveRequest Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to cancel request');
    }
  }
);


// --- Slice Definition ---

const initialState = {
  requests: [],
  loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
  error: null,
  // Add specific loading states for actions if needed (e.g., creating, approving)
  actionLoading: 'idle',
  actionError: null,
};

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    // Can add reducers for synchronous actions if needed
    resetLeaveActionStatus: (state) => {
        state.actionLoading = 'idle';
        state.actionError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Leave Requests
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.requests = action.payload;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload;
      })

      // Create Leave Request
      .addCase(createLeaveRequest.pending, (state) => {
        state.actionLoading = 'pending';
        state.actionError = null;
      })
      .addCase(createLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = 'succeeded';
        state.requests.unshift(action.payload); // Add to the beginning of the list
      })
      .addCase(createLeaveRequest.rejected, (state, action) => {
        state.actionLoading = 'failed';
        state.actionError = action.payload;
      })

      // Update Leave Request (Generic PATCH)
      .addCase(updateLeaveRequest.pending, (state) => {
          state.actionLoading = 'pending';
          state.actionError = null;
      })
      .addCase(updateLeaveRequest.fulfilled, (state, action) => {
          state.actionLoading = 'succeeded';
          const index = state.requests.findIndex(req => req.id === action.payload.id);
          if (index !== -1) {
              state.requests[index] = action.payload;
          }
      })
      .addCase(updateLeaveRequest.rejected, (state, action) => {
          state.actionLoading = 'failed';
          state.actionError = action.payload;
      })

      // Approve Manager
      .addCase(approveManagerLeaveRequest.pending, (state) => {
        state.actionLoading = 'pending';
        state.actionError = null;
      })
      .addCase(approveManagerLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = 'succeeded';
        const index = state.requests.findIndex(req => req.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload; // Update the request in the list
        }
      })
      .addCase(approveManagerLeaveRequest.rejected, (state, action) => {
        state.actionLoading = 'failed';
        state.actionError = action.payload;
      })

      // Reject Manager
      .addCase(rejectManagerLeaveRequest.pending, (state) => {
        state.actionLoading = 'pending';
        state.actionError = null;
      })
      .addCase(rejectManagerLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = 'succeeded';
        const index = state.requests.findIndex(req => req.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(rejectManagerLeaveRequest.rejected, (state, action) => {
        state.actionLoading = 'failed';
        state.actionError = action.payload;
      })

      // Approve HR
      .addCase(approveHrLeaveRequest.pending, (state) => {
        state.actionLoading = 'pending';
        state.actionError = null;
      })
      .addCase(approveHrLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = 'succeeded';
        const index = state.requests.findIndex(req => req.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
          // NOTE: Balance update happens on the backend. The employeeSlice
          // might need to re-fetch user details or have a dedicated balance update reducer
          // if the API response for HR approval doesn't include the updated employee details.
          // For now, we assume the request object is updated correctly.
        }
      })
      .addCase(approveHrLeaveRequest.rejected, (state, action) => {
        state.actionLoading = 'failed';
        state.actionError = action.payload;
      })

      // Reject HR
      .addCase(rejectHrLeaveRequest.pending, (state) => {
        state.actionLoading = 'pending';
        state.actionError = null;
      })
      .addCase(rejectHrLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = 'succeeded';
        const index = state.requests.findIndex(req => req.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(rejectHrLeaveRequest.rejected, (state, action) => {
        state.actionLoading = 'failed';
        state.actionError = action.payload;
      })

      // Cancel Leave Request
      .addCase(cancelLeaveRequest.pending, (state) => {
        state.actionLoading = 'pending';
        state.actionError = null;
      })
      .addCase(cancelLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = 'succeeded';
        const index = state.requests.findIndex(req => req.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(cancelLeaveRequest.rejected, (state, action) => {
        state.actionLoading = 'failed';
        state.actionError = action.payload;
      });
  },
});

// --- Selectors ---
export const selectLeaveState = (state) => state.leave; // Base selector for the slice

export const selectAllLeaveRequests = createSelector(
  [selectLeaveState],
  (leave) => leave.requests
);

export const selectLeaveLoading = createSelector(
  [selectLeaveState],
  (leave) => leave.loading
);

export const selectLeaveError = createSelector(
  [selectLeaveState],
  (leave) => leave.error
);

export const selectLeaveActionLoading = createSelector(
  [selectLeaveState],
  (leave) => leave.actionLoading
);

export const selectLeaveActionError = createSelector(
  [selectLeaveState],
  (leave) => leave.actionError
);

// Selector for requests pending manager approval (for managers) - MEMOIZED
export const selectPendingManagerApprovalRequests = createSelector(
  [selectAllLeaveRequests], // Input selector
  (requests) => requests.filter(req => req.status === 'pending') // Result function
);

// Selector for requests pending HR approval (for HR/Admin) - MEMOIZED
export const selectPendingHrApprovalRequests = createSelector(
  [selectAllLeaveRequests], // Input selector
  (requests) => requests.filter(req => req.status === 'manager_approved') // Result function
);

// Selector for the current user's own requests - MEMOIZED
export const selectMyLeaveRequests = createSelector(
    [selectAllLeaveRequests, (state) => state.employee.user?.id], // Input selectors: all requests and user ID
    (requests, userId) => {
        if (!userId) return [];
        // Ensure you are comparing the correct ID field. Assuming employee_details.id based on other code.
        return requests.filter(req => req.employee_details?.id === userId);
    }
);


export const { resetLeaveActionStatus } = leaveSlice.actions;

export default leaveSlice.reducer;

// --- Make sure employeeSlice selectors are also defined correctly ---
// Example (assuming these are in employeeSlice.js):
/*
export const selectUser = (state) => state.employee.user;
export const selectPaidLeaveBalance = createSelector(
    [selectUser],
    (user) => user?.paid_leave_balance ?? 0 // Provide default
);
export const selectSickLeaveBalance = createSelector(
    [selectUser],
    (user) => user?.sick_leave_balance ?? 0 // Provide default
);
*/