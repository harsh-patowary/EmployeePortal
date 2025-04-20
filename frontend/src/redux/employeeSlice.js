import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Import your service functions correctly
import { getUserDetails, getManagerTeam, getAllEmployees } from '../services/employeeService'; 

// Thunk to fetch user details
export const fetchUserDetails = createAsyncThunk(
  'employee/fetchUserDetails',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getUserDetails();
      console.log("Fetched user details:", data);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to fetch manager's team
export const fetchManagerTeam = createAsyncThunk(
  'employee/fetchManagerTeam',
  async (_, { rejectWithValue, getState }) => {
    console.log(">>> fetchManagerTeam THUNK: Started execution.");
    
    try {
      console.log(">>> fetchManagerTeam THUNK: Calling getManagerTeam() service...");
      const data = await getManagerTeam();
      console.log(">>> fetchManagerTeam THUNK: getManagerTeam() service returned:", data);
      return data;
    } catch (error) {
      console.error(">>> fetchManagerTeam THUNK: Error during getManagerTeam() call:", error);
      return rejectWithValue(error.message || "Failed to fetch team members");
    }
  }
);

// Thunk to fetch all employees (for Admin/HR)
export const fetchAllEmployees = createAsyncThunk(
    'employee/fetchAllEmployees',
    async (_, { rejectWithValue, getState }) => {
        const { role } = getState().employee.user || {};
        // Only allow Admin/HR/Director roles to fetch all
        if (!['admin', 'hr', 'director'].includes(role)) {
            console.warn("User does not have permission to fetch all employees.");
            return []; 
        }
        try {
            const data = await getAllEmployees();
            console.log("Fetched all employees under admin/HR :", data);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
  currentEmployee: null,
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  error: null,
  user: null, // Holds the user object fetched from API { id, username, first_name, ..., is_manager, role }
  isAuthenticated: false,
  loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
  teamMembers: [],
  loadingTeam: 'idle',
  errorTeam: null,
  allEmployees: [],
  loadingAllEmployees: 'idle',
  errorAllEmployees: null,
};

// Helper function to determine permissions based on role
const getRolePermissions = (role) => {
  switch (role) {
    case 'manager':
      return ['view_attendance', 'edit_attendance', 'view_employees'];
    case 'admin':
      return ['view_attendance', 'edit_attendance', 'view_employees', 'edit_employees', 'view_reports'];
    case 'hr':
      return ['view_attendance', 'edit_attendance', 'view_employees', 'edit_employees'];
    case 'director':
      return ['view_attendance', 'edit_attendance', 'view_employees', 'edit_employees', 'view_reports', 'edit_reports'];
    case 'employee':
    default:
      return ['view_self_attendance'];
  }
};

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    setEmployees: (state, action) => {
      state.employees = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addEmployee: (state, action) => {
      state.employees.push(action.payload);
    },
    updateEmployee: (state, action) => {
      const index = state.employees.findIndex(emp => emp.id === action.payload.id);
      if (index !== -1) {
        state.employees[index] = action.payload;
      }
    },
    removeEmployee: (state, action) => {
      state.employees = state.employees.filter(emp => emp.id !== action.payload);
    },
    setSelectedEmployee: (state, action) => {
      state.selectedEmployee = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearEmployee: (state) => {
      state.currentEmployee = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.teamMembers = []; // Clear team on logout
      state.allEmployees = []; // Clear all employees on logout

      // Reset loading and error states for data fetched based on role
      state.loadingTeam = 'idle'; // <-- ADD THIS
      state.errorTeam = null;     // <-- ADD THIS (Good practice)
      state.loadingAllEmployees = 'idle'; // <-- ADD THIS
      state.errorAllEmployees = null; // <-- ADD THIS (Good practice)
      state.loading = 'idle'; // Reset general loading state too if applicable
      state.error = null;     // Reset general error state too if applicable


      // Clear tokens from localStorage here
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user'); // Ensure user is cleared
    },
    // You might want to consolidate logout logic into one action or ensure both are complete
    logoutUser: (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.teamMembers = [];
        state.allEmployees = [];
        state.loadingTeam = 'idle';
        state.errorTeam = null;
        state.loadingAllEmployees = 'idle';
        state.errorAllEmployees = null;
        state.loading = 'idle';
        state.error = null;
        // Also clear localStorage here if this action is used
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDetails.pending, (state) => {
        state.loading = 'pending';
        state.isAuthenticated = false; // Assume not authenticated until fetch succeeds
        state.user = null; // Clear previous user data while fetching
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        console.log("User details updated in Redux:", state.user); // Debug log
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        // Clear tokens if fetch fails? Prevents loops.
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      })
      // Manager Team
      .addCase(fetchManagerTeam.pending, (state) => {
        state.loadingTeam = 'pending';
        state.errorTeam = null;
        console.log("Redux: fetchManagerTeam pending"); // Add log
      })
      .addCase(fetchManagerTeam.fulfilled, (state, action) => {
        state.loadingTeam = 'succeeded';
        // *** THIS IS THE FIX: Assign the fetched data to state.teamMembers ***
        state.teamMembers = action.payload || []; // Use payload, default to empty array
        state.errorTeam = null;
        console.log("Redux: fetchManagerTeam fulfilled, payload:", action.payload); // Add log
      })
      .addCase(fetchManagerTeam.rejected, (state, action) => {
        state.loadingTeam = 'failed';
        state.errorTeam = action.payload || action.error.message;
        state.teamMembers = []; // Clear team members on failure
        console.error("Redux: fetchManagerTeam rejected:", action.payload || action.error.message); // Add log
      })
      // All Employees
      .addCase(fetchAllEmployees.pending, (state) => {
          state.loadingAllEmployees = 'pending';
      })
      .addCase(fetchAllEmployees.fulfilled, (state, action) => {
          state.loadingAllEmployees = 'succeeded';
          state.allEmployees = action.payload;
          state.errorAllEmployees = null;
      })
      .addCase(fetchAllEmployees.rejected, (state, action) => {
          state.loadingAllEmployees = 'failed';
          state.errorAllEmployees = action.payload;
      });
  }
});

export const { 
  setEmployees, 
  addEmployee, 
  updateEmployee,
  removeEmployee, 
  setSelectedEmployee,
  setLoading,
  setError,
  clearEmployee,
  logout,
  logoutUser
} = employeeSlice.actions;

// Selectors
export const selectCurrentEmployee = (state) => state.employee.currentEmployee;
export const selectAllEmployees = (state) => state.employee.employees;
export const selectEmployeeLoading = (state) => state.employee.isLoading;
export const selectEmployeeError = (state) => state.employee.error;

// Role-based selectors
export const selectIsManager = (state) => {
  const user = state.employee.user;
  const isMgr = user ? (user.is_manager === true || ['manager', 'admin', 'hr', 'director'].includes(user.role)) : false;
  console.log('selectIsManager (employeeSlice) called, user:', user, 'result:', isMgr); // Debug log
  return isMgr;
};

// New role-based selectors
export const selectRole = (state) => {
  const role = state.employee.user?.role || 'employee'; // Default to 'employee' if no user/role
  console.log('selectRole (employeeSlice) called, user:', state.employee.user, 'result:', role); // Debug log
  return role;
};

export const selectPermissions = (state) => {
  const role = state.employee.user?.role;
  return role ? getRolePermissions(role) : [];
};

export const selectHasPermission = (permission) => (state) => {
  const userPermissions = selectPermissions(state);
  return userPermissions.includes(permission);
};

export const selectUser = (state) => state.employee.user;
export const selectIsAuthenticated = (state) => state.employee.isAuthenticated;
export const selectLoading = (state) => state.employee.loading;
export const selectError = (state) => state.employee.error;
export const selectUserRole = (state) => state.employee.user?.role;

// New Selectors
export const selectTeamMembers = (state) => state.employee.teamMembers;
export const selectLoadingTeam = (state) => state.employee.loadingTeam;
export const selectLoadingAllEmployees = (state) => state.employee.loadingAllEmployees;

export default employeeSlice.reducer;
