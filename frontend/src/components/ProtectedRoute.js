import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
// Make sure selectError is exported from your slice if you want to check for errors
import { selectIsAuthenticated, selectLoading, fetchUserDetails, selectError } from '../redux/employeeSlice'; 
import LoadingSpinner from './LoadingSpinner'; 

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError); // Get error state
  const dispatch = useDispatch();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // Log state on every render
  console.log("ProtectedRoute lol State:", { isAuthenticated, loading, error, tokenExists: !!token });

  useEffect(() => {
    // If there's a token but the user isn't authenticated in Redux state, 
    // and we are not already loading or failed, try fetching user details
    if (token && !isAuthenticated && loading === 'idle') {
      console.log("ProtectedRoute Effect: Dispatching fetchUserDetails");
      dispatch(fetchUserDetails()); 
    }
    // Optional: Handle case where token exists but fetch failed previously
    // else if (token && !isAuthenticated && loading === 'failed') {
    //   console.warn("ProtectedRoute Effect: Auth check failed previously.");
    //   // Decide if you want to retry or just let it redirect
    // }
  }, [token, isAuthenticated, loading, dispatch]);

  // Condition 1: Show loading spinner if explicitly pending
  if (loading === 'pending') {
    console.log("ProtectedRoute Decision: Showing LoadingSpinner (pending)");
    return <LoadingSpinner message="Verifying session..." />; 
  }

  // Condition 2: Show loading spinner if token exists but we haven't successfully authenticated yet
  // This covers the initial load state before 'pending' or if 'idle' state persists briefly
  if (token && !isAuthenticated && loading !== 'failed') {
     console.log("ProtectedRoute Decision: Showing LoadingSpinner (initial check)");
     return <LoadingSpinner message="Loading user data..." />;
  }
  
  // Condition 3: Redirect to login if not authenticated AND not loading
  // This handles cases where there's no token, or fetchUserDetails failed
  if (!isAuthenticated && loading !== 'pending') {
    console.log("ProtectedRoute Decision: Redirecting to /login");
    // Clear token if fetch failed? Optional, depends on your strategy
    // if (loading === 'failed') localStorage.removeItem('token'); 
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Condition 4: If authenticated, render the children
  if (isAuthenticated) {
    console.log("ProtectedRoute Decision: Rendering children");
    return children;
  }

  // Fallback (should ideally not be reached with the logic above)
  console.warn("ProtectedRoute Decision: Reached fallback, redirecting to login.");
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;