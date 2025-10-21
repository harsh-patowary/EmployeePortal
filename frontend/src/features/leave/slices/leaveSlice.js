import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import api from "../../../utils/api"; // Keep this if needed for other direct calls
import {
  fetchMyLeaveRequestsAPI, // <-- Use specific API functions
  fetchPendingApprovalsAPI, // <-- Use specific API functions
  fetchAllLeaveRequestsAPI, // <-- Use specific API functions
  createLeaveRequestAPI,
  approveManagerLeaveRequestAPI,
  rejectManagerLeaveRequestAPI,
  approveHrLeaveRequestAPI,
  rejectHrLeaveRequestAPI,
  cancelLeaveRequestAPI,
  updateLeaveRequestAPI,
  fetchLeaveRequestDetailsAPI, // <-- Make sure this is imported
} from "../services/leaveService";

// --- Async Thunks ---

export const fetchMyLeaveRequests = createAsyncThunk(
  "leave/fetchMyLeaveRequests", // Specific action type
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchMyLeaveRequestsAPI(); // Call specific service function
      console.log("Fetched My Leave Requests:", data);
      return data;
    } catch (error) {
      console.error(
        "fetchMyLeaveRequests Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to fetch my leave requests"
      );
    }
  }
);

export const fetchPendingApprovals = createAsyncThunk(
  "leave/fetchPendingApprovals", // Specific action type
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchPendingApprovalsAPI(); // Call specific service function
      console.log("Fetched Pending Approvals:", data);
      return data;
    } catch (error) {
      console.error(
        "fetchPendingApprovals Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to fetch pending approvals"
      );
    }
  }
);

export const fetchAllLeaveRequests = createAsyncThunk(
  "leave/fetchAllLeaveRequests", // Specific action type
  async (filters = {}, { rejectWithValue }) => {
    // Pass filters if needed
    try {
      const data = await fetchAllLeaveRequestsAPI(filters); // Call specific service function
      console.log("Fetched All Leave Requests:", data);
      return data;
    } catch (error) {
      console.error(
        "fetchAllLeaveRequests Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to fetch all leave requests"
      );
    }
  }
);

export const createLeaveRequest = createAsyncThunk(
  "leave/createLeaveRequest",
  async (requestData, { rejectWithValue }) => {
    try {
      const data = await createLeaveRequestAPI(requestData);
      return data;
    } catch (error) {
      console.error(
        "createLeaveRequest Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to create leave request"
      );
    }
  }
);

export const updateLeaveRequest = createAsyncThunk(
  "leave/updateLeaveRequest",
  async ({ requestId, updateData }, { rejectWithValue }) => {
    try {
      const data = await updateLeaveRequestAPI(requestId, updateData);
      return data;
    } catch (error) {
      console.error(
        "updateLeaveRequest Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to update leave request"
      );
    }
  }
);

export const approveManagerLeaveRequest = createAsyncThunk(
  "leave/approveManagerLeaveRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await approveManagerLeaveRequestAPI(requestId);
      return data;
    } catch (error) {
      console.error(
        "approveManagerLeaveRequest Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to approve request (Manager)"
      );
    }
  }
);

export const rejectManagerLeaveRequest = createAsyncThunk(
  "leave/rejectManagerLeaveRequest",
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      const data = await rejectManagerLeaveRequestAPI(requestId, reason);
      return data;
    } catch (error) {
      console.error(
        "rejectManagerLeaveRequest Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to reject request (Manager)"
      );
    }
  }
);

export const approveHrLeaveRequest = createAsyncThunk(
  "leave/approveHrLeaveRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await approveHrLeaveRequestAPI(requestId);
      return data; // This response should include the updated request AND potentially the updated employee balance
    } catch (error) {
      console.error(
        "approveHrLeaveRequest Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to approve request (HR)"
      );
    }
  }
);

export const rejectHrLeaveRequest = createAsyncThunk(
  "leave/rejectHrLeaveRequest",
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      const data = await rejectHrLeaveRequestAPI(requestId, reason);
      return data;
    } catch (error) {
      console.error(
        "rejectHrLeaveRequest Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to reject request (HR)"
      );
    }
  }
);

export const cancelLeaveRequest = createAsyncThunk(
  "leave/cancelLeaveRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await cancelLeaveRequestAPI(requestId);
      return data;
    } catch (error) {
      console.error(
        "cancelLeaveRequest Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || "Failed to cancel request"
      );
    }
  }
);

export const fetchLeaveRequestDetails = createAsyncThunk(
  "leave/fetchLeaveRequestDetails",
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await fetchLeaveRequestDetailsAPI(requestId);
      return data; // Payload will be the single request object
    } catch (error) {
      console.error(
        `fetchLeaveRequestDetails Error for ${requestId}:`,
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data ||
          `Failed to fetch details for request ${requestId}`
      );
    }
  }
);

const initialState = {
  // Separate lists might be clearer than one potentially large 'requests' list
  myRequests: [],
  pendingApprovals: [],
  allRequests: [], // For admin/HR view
  loading: "idle", // Consider separate loading states: loadingMy, loadingPending, loadingAll
  error: null,
  actionLoading: "idle",
  actionError: null,
  detailLoading: "idle", // Separate loading for fetching single request details
  detailError: null,
  currentRequestDetails: null, // To store the fetched details
};

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    resetLeaveActionStatus: (state) => {
      state.actionLoading = "idle";
      state.actionError = null;
    },
    // Reducer to clear specific lists if needed on logout/role change
    clearLeaveLists: (state) => {
      state.myRequests = [];
      state.pendingApprovals = [];
      state.allRequests = [];
      state.loading = "idle";
      state.error = null;
    },
    // Add reducer to clear details when dialog closes? Optional but good practice.
    clearCurrentRequestDetails: (state) => {
      state.currentRequestDetails = null;
      state.detailLoading = "idle";
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Requests
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.loading = "pending";
      }) // Adjust loading state if needed
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.myRequests = action.payload;
        state.error = null;
      })
      .addCase(fetchMyLeaveRequests.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload;
      })

      // Fetch Pending Approvals
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.loading = "pending";
      }) // Adjust loading state if needed
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.pendingApprovals = action.payload;
        state.error = null;
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload;
      })

      // Fetch All Requests
      .addCase(fetchAllLeaveRequests.pending, (state) => {
        state.loading = "pending";
      }) // Adjust loading state if needed
      .addCase(fetchAllLeaveRequests.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.allRequests = action.payload;
        state.error = null;
      })
      .addCase(fetchAllLeaveRequests.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload;
      })

      // --- Handle Fetching Request Details ---
      .addCase(fetchLeaveRequestDetails.pending, (state) => {
        state.detailLoading = "pending";
        state.currentRequestDetails = null; // Clear previous details
        state.detailError = null;
      })
      .addCase(fetchLeaveRequestDetails.fulfilled, (state, action) => {
        state.detailLoading = "succeeded";
        state.currentRequestDetails = action.payload;
      })
      .addCase(fetchLeaveRequestDetails.rejected, (state, action) => {
        state.detailLoading = "failed";
        state.detailError = action.payload;
      })

      // --- Handle Action Updates (Create, Approve, Reject, Cancel, Update) ---
      // These need to potentially update MULTIPLE lists in the state

      .addCase(createLeaveRequest.pending, (state) => {
        state.actionLoading = "pending";
        state.actionError = null;
      })
      .addCase(createLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = "succeeded";
        state.myRequests.unshift(action.payload); // Add to my requests
        // Does it appear in someone else's pending list immediately? If so, fetch? Or wait for their next fetch?
        // Simpler: just update the list relevant to the creator for now.
      })

      .addCase(approveManagerLeaveRequest.pending, (state) => {
        state.actionLoading = "pending";
        state.actionError = null;
      })
      .addCase(approveManagerLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = "succeeded";
        // Remove from pendingApprovals list
        state.pendingApprovals = state.pendingApprovals.filter(
          (req) => req.id !== action.payload.id
        );
        // Update in myRequests list if the approver is viewing their own requests? Unlikely.
        // Update in allRequests list if loaded
        const allIndex = state.allRequests.findIndex(
          (req) => req.id === action.payload.id
        );
        if (allIndex !== -1) state.allRequests[allIndex] = action.payload;
        // Update details if the currently viewed request was approved
        if (state.currentRequestDetails?.id === action.payload.id) {
          state.currentRequestDetails = action.payload;
        }
        // The request might now appear in HR's pending list on their next fetch.
      })

      .addCase(rejectManagerLeaveRequest.pending, (state) => {
        state.actionLoading = "pending";
        state.actionError = null;
      })
      .addCase(rejectManagerLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = "succeeded";
        // Remove from pendingApprovals list
        state.pendingApprovals = state.pendingApprovals.filter(
          (req) => req.id !== action.payload.id
        );
        // Update in allRequests list if loaded
        const allIndex = state.allRequests.findIndex(
          (req) => req.id === action.payload.id
        );
        if (allIndex !== -1) state.allRequests[allIndex] = action.payload;
        // Update details if the currently viewed request was rejected
        if (state.currentRequestDetails?.id === action.payload.id) {
          state.currentRequestDetails = action.payload;
        }
        // Update in the requester's myRequests list on their next fetch.
      })

      .addCase(approveHrLeaveRequest.pending, (state) => {
        state.actionLoading = "pending";
        state.actionError = null;
      })
      .addCase(approveHrLeaveRequest.fulfilled, (state, action) => {
        console.log(
          "Reducer: approveHrLEaveRequest.fulfilled reached",
          action.payload
        );
        state.actionLoading = "succeeded";
        // Remove from pendingApprovals list (if HR was viewing that)
        state.pendingApprovals = state.pendingApprovals.filter(
          (req) => req.id !== action.payload.id
        );
        // Update in allRequests list if loaded
        const allIndex = state.allRequests.findIndex(
          (req) => req.id === action.payload.id
        );
        if (allIndex !== -1) state.allRequests[allIndex] = action.payload;
        // Update details if the currently viewed request was approved
        if (state.currentRequestDetails?.id === action.payload.id) {
          state.currentRequestDetails = action.payload;
        }
        // Update in the requester's myRequests list on their next fetch.
      })

      .addCase(rejectHrLeaveRequest.pending, (state) => {
        state.actionLoading = "pending";
        state.actionError = null;
      })
      .addCase(rejectHrLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = "succeeded";
        // Remove from pendingApprovals list (if HR was viewing that)
        state.pendingApprovals = state.pendingApprovals.filter(
          (req) => req.id !== action.payload.id
        );
        // Update in allRequests list if loaded
        const allIndex = state.allRequests.findIndex(
          (req) => req.id === action.payload.id
        );
        if (allIndex !== -1) state.allRequests[allIndex] = action.payload;
        // Update details if the currently viewed request was rejected
        if (state.currentRequestDetails?.id === action.payload.id) {
          state.currentRequestDetails = action.payload;
        }
        // Update in the requester's myRequests list on their next fetch.
      })

      .addCase(cancelLeaveRequest.pending, (state) => {
        state.actionLoading = "pending";
        state.actionError = null;
      })
      .addCase(cancelLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = "succeeded";
        // Update in myRequests list
        const myIndex = state.myRequests.findIndex(
          (req) => req.id === action.payload.id
        );
        if (myIndex !== -1) state.myRequests[myIndex] = action.payload;
        // Remove from pendingApprovals list if it was there
        state.pendingApprovals = state.pendingApprovals.filter(
          (req) => req.id !== action.payload.id
        );
        // Update in allRequests list if loaded
        const allIndex = state.allRequests.findIndex(
          (req) => req.id === action.payload.id
        );
        if (allIndex !== -1) state.allRequests[allIndex] = action.payload;
        // Update details if the currently viewed request was canceled
        if (state.currentRequestDetails?.id === action.payload.id) {
          state.currentRequestDetails = action.payload;
        }
      })

      .addCase(updateLeaveRequest.pending, (state) => {
        state.actionLoading = "pending";
        state.actionError = null;
      })
      .addCase(updateLeaveRequest.fulfilled, (state, action) => {
        state.actionLoading = "succeeded";
        // Update in myRequests list
        const myIndex = state.myRequests.findIndex(
          (req) => req.id === action.payload.id
        );
        if (myIndex !== -1) state.myRequests[myIndex] = action.payload;
        // Update in pendingApprovals list if it was there (e.g. reason updated)
        const pendingIndex = state.pendingApprovals.findIndex(
          (req) => req.id === action.payload.id
        );
        if (pendingIndex !== -1)
          state.pendingApprovals[pendingIndex] = action.payload;
        // Update in allRequests list if loaded
        const allIndex = state.allRequests.findIndex(
          (req) => req.id === action.payload.id
        );
        if (allIndex !== -1) state.allRequests[allIndex] = action.payload;
        // Update details if the currently viewed request was updated
        if (state.currentRequestDetails?.id === action.payload.id) {
          state.currentRequestDetails = action.payload;
        }
      })

      // Add pending/rejected cases for all actions to handle loading/error states
      // .addMatcher(
      //   (action) =>
      //     action.type.startsWith("leave/") &&
      //     action.type.endsWith("/pending") &&
      //     !action.type.endsWith("leave/fetch"),
      //   (state) => {
      //     state.actionLoading = "pending";
      //     state.actionError = null;
      //   }
      // )
      .addMatcher(
        (action) =>
          action.type.startsWith("leave/") && action.type.endsWith("/rejected"),
        (state, action) => {
          // Exclude fetch rejections from actionError
          if (!action.type.startsWith("leave/fetch")) {
            state.actionLoading = "failed";
            state.actionError = action.payload;
          }
        }
      );
  },
});

// --- Selectors ---
export const selectLeaveState = (state) => state.leave;

// Selectors for the specific lists
export const selectMyLeaveRequests = createSelector(
  [selectLeaveState],
  (leave) => leave.myRequests
);
export const selectPendingApprovalRequests = createSelector(
  [selectLeaveState],
  (leave) => leave.pendingApprovals
);
export const selectAllLeaveRequestsForAdmin = createSelector(
  [selectLeaveState],
  (leave) => leave.allRequests
); // Renamed for clarity

export const selectLeaveLoading = createSelector(
  [selectLeaveState],
  (leave) => leave.loading
); // Or specific loading states
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
export const selectCurrentRequestDetails = createSelector(
  [selectLeaveState],
  (leave) => leave.currentRequestDetails
);
export const selectDetailLoading = createSelector(
  [selectLeaveState],
  (leave) => leave.detailLoading
);
export const selectDetailError = createSelector(
  [selectLeaveState],
  (leave) => leave.detailError
);

// Example: If you still need combined lists in some components, create selectors for that
// export const selectCombinedPendingRequests = createSelector(
//     [selectPendingManagerApprovalRequests, selectPendingHrApprovalRequests],
//     (managerPending, hrPending) => [...managerPending, ...hrPending]
// );

export const {
  resetLeaveActionStatus,
  clearLeaveLists,
  clearCurrentRequestDetails,
} = leaveSlice.actions;

export default leaveSlice.reducer;
