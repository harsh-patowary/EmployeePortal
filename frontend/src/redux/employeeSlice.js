import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchEmployee } from '../services/employeeService';

// Create async thunk for fetching employee data
export const fetchEmployeeData = createAsyncThunk(
  'employee/fetchEmployeeData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchEmployee();
      console.log('Fetched employee data in thunk:', response);
      return response;
    } catch (error) {
      console.error('Error in fetchEmployeeData:', error);
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
  roles: {
    isManager: false,
    role: 'employee', // Default role
    permissions: [] // Will be populated based on role
  }
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
    // Set roles manually if needed
    setRoles: (state, action) => {
      state.roles = { ...state.roles, ...action.payload };
    },
    clearEmployee: (state) => {
      state.currentEmployee = null;
      state.roles = {
        isManager: false,
        role: 'employee',
        permissions: getRolePermissions('employee')
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEmployee = action.payload;
        
        // Set employee-based roles with extensive logging
        if (action.payload) {
          // First, check the raw is_manager value from the API
          const rawIsManager = action.payload.is_manager;
          console.log('Raw is_manager from API:', rawIsManager, typeof rawIsManager);
          
          // Convert to boolean regardless of format received (string "true", boolean true, or other)
          const isManager = 
            rawIsManager === true || 
            rawIsManager === 'true' || 
            rawIsManager === 1 ||
            action.payload.role === 'manager' ||
            action.payload.role === 'admin' ||
            action.payload.role === 'hr' ||
            action.payload.role === 'director';
          
          state.roles.isManager = isManager;
          
          // Set the role from backend, defaulting to 'employee' if not present
          state.roles.role = action.payload.role || 'employee';
          
          // Determine permissions based on role
          state.roles.permissions = getRolePermissions(state.roles.role);
          
          console.log('Setting roles in employeeSlice:', {
            rawIsManager,
            convertedIsManager: isManager,
            role: state.roles.role,
            permissions: state.roles.permissions
          });
        }
      })
      .addCase(fetchEmployeeData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
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
  setRoles,
  clearEmployee
} = employeeSlice.actions;

// Selectors
export const selectCurrentEmployee = (state) => state.employee.currentEmployee;
export const selectAllEmployees = (state) => state.employee.employees;
export const selectEmployeeLoading = (state) => state.employee.isLoading;
export const selectEmployeeError = (state) => state.employee.error;

// Role-based selectors
export const selectIsManager = (state) => {
  const isManager = state.employee.roles.isManager;
  console.log('selectIsManager called, current value:', isManager);
  return isManager;
};

// New role-based selectors
export const selectRole = (state) => state.employee.roles.role;

export const selectHasPermission = (permission) => (state) => {
  return state.employee.roles.permissions.includes(permission);
};

export default employeeSlice.reducer;
