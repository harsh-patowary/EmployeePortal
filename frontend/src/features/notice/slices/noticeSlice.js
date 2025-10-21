import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
    fetchNoticesAPI,
    fetchNoticeDetailsAPI,
    createNoticeAPI,
} from '../services/noticeService'; // We'll create this next

// --- Async Thunks ---

export const fetchNotices = createAsyncThunk(
    'notice/fetchNotices',
    async (_, { rejectWithValue }) => {
        try {
            const data = await fetchNoticesAPI();
            return data;
        } catch (error) {
            console.error("fetchNotices Error:", error);
            return rejectWithValue(error.message || 'Failed to fetch notices');
        }
    }
);

export const fetchNoticeDetails = createAsyncThunk(
    'notice/fetchNoticeDetails',
    async (noticeId, { rejectWithValue }) => {
        try {
            const data = await fetchNoticeDetailsAPI(noticeId);
            return data;
        } catch (error) {
            console.error(`fetchNoticeDetails Error for ${noticeId}:`, error);
            return rejectWithValue(error.message || `Failed to fetch details for notice ${noticeId}`);
        }
    }
);

export const createNotice = createAsyncThunk(
    'notice/createNotice',
    async (noticeData, { rejectWithValue, getState }) => {
        try {
            // In a real scenario, you might get author_id from getState() -> userSlice
            // const { user } = getState().employee;
            // const dataToSend = { ...noticeData, author_id: user.id };
            const data = await createNoticeAPI(noticeData); // Pass data directly for mock
            return data;
        } catch (error) {
            console.error("createNotice Error:", error);
            return rejectWithValue(error.response?.data || error.message || 'Failed to create notice');
        }
    }
);

// --- Initial State ---

const initialState = {
    notices: [],
    loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
    error: null,
    actionLoading: 'idle',
    actionError: null,
    currentNoticeDetails: null,
    detailLoading: 'idle',
    detailError: null,
};

// --- Slice Definition ---

const noticeSlice = createSlice({
    name: 'notice',
    initialState,
    reducers: {
        resetNoticeActionStatus: (state) => {
            state.actionLoading = 'idle';
            state.actionError = null;
        },
        clearCurrentNoticeDetails: (state) => {
            state.currentNoticeDetails = null;
            state.detailLoading = 'idle';
            state.detailError = null;
        },
        clearNoticeState: () => initialState, // For logout etc.
    },
    extraReducers: (builder) => {
        builder
            // Fetch Notices
            .addCase(fetchNotices.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchNotices.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.notices = action.payload;
            })
            .addCase(fetchNotices.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            // Fetch Notice Details
            .addCase(fetchNoticeDetails.pending, (state) => {
                state.detailLoading = 'pending';
                state.currentNoticeDetails = null;
                state.detailError = null;
            })
            .addCase(fetchNoticeDetails.fulfilled, (state, action) => {
                state.detailLoading = 'succeeded';
                state.currentNoticeDetails = action.payload;
            })
            .addCase(fetchNoticeDetails.rejected, (state, action) => {
                state.detailLoading = 'failed';
                state.detailError = action.payload;
            })

            // Create Notice
            .addCase(createNotice.pending, (state) => {
                state.actionLoading = 'pending';
                state.actionError = null;
            })
            .addCase(createNotice.fulfilled, (state, action) => {
                state.actionLoading = 'succeeded';
                state.notices.unshift(action.payload); // Add new notice to the list
            })
            .addCase(createNotice.rejected, (state, action) => {
                state.actionLoading = 'failed';
                state.actionError = action.payload;
            });
        // Add cases for update/delete later
    },
});

// --- Actions ---
export const {
    resetNoticeActionStatus,
    clearCurrentNoticeDetails,
    clearNoticeState,
} = noticeSlice.actions;

// --- Selectors ---
export const selectNoticeState = (state) => state.notice;
export const selectAllNotices = (state) => state.notice.notices;
export const selectNoticeLoading = (state) => state.notice.loading;
export const selectNoticeError = (state) => state.notice.error;
export const selectNoticeActionLoading = (state) => state.notice.actionLoading;
export const selectNoticeActionError = (state) => state.notice.actionError;
export const selectCurrentNoticeDetails = (state) => state.notice.currentNoticeDetails;
export const selectDetailLoading = (state) => state.notice.detailLoading;
export const selectDetailError = (state) => state.notice.detailError;

// Selector for recent notices (e.g., for dashboard widget)
export const selectRecentNotices = createSelector(
    [selectAllNotices],
    (notices) => {
        // Sort by date descending and take top 3 (or 5)
        return [...notices] // Create a shallow copy before sorting
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 3);
    }
);

// Selectors for different scopes (example - refine later based on user context)
export const selectCompanyNotices = createSelector(
    [selectAllNotices],
    (notices) => notices.filter(n => n.scope === 'company')
);

export const selectTeamNotices = createSelector(
    [selectAllNotices], // Add user team ID selector later
    (notices) => notices.filter(n => n.scope === 'team' /* && n.target_team_id === user.teamId */)
);

export const selectDepartmentNotices = createSelector(
    [selectAllNotices], // Add user department ID selector later
    (notices) => notices.filter(n => n.scope === 'department' /* && n.target_department_id === user.departmentId */)
);

export const selectDirectNotices = createSelector(
    [selectAllNotices], // Add user ID selector later
    (notices) => notices.filter(n => n.scope === 'direct' /* && n.target_employee_id === user.id */)
);


export default noticeSlice.reducer;