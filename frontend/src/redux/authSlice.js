import { createSlice } from '@reduxjs/toolkit';

// Check for existing user data in localStorage
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      // Debug what we're receiving from the backend
      console.log('Login response in Redux:', action.payload);
      
      state.isAuthenticated = true;
      
      // Store the user data with explicit is_manager check
      const userData = action.payload.user;
      console.log('User data received:', userData);
      
      // Log manager status for debugging
      console.log('Is manager from backend:', userData.is_manager);
      
      // Store user data
      state.user = userData;
      state.token = action.payload.access;
      
      // Persist to localStorage
      localStorage.setItem('token', action.payload.access);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('Auth state after login:', {
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isManager: state.user?.is_manager
      });
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;

// Selectors with debug logging
export const selectUser = (state) => {
  const user = state.auth.user;
  console.log('selectUser called, returning:', user);
  return user;
};

export const selectIsManager = (state) => {
  const user = state.auth.user;
  const isManager = user?.is_manager === true;
  console.log('selectIsManager called:', {
    userExists: !!user,
    isManagerValue: user?.is_manager,
    isManager: isManager
  });
  return isManager;
};

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;