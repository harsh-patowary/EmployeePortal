import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../redux/authSlice';
import { selectRole, selectIsManager, fetchEmployeeData, selectHasPermission } from '../redux/employeeSlice';

/**
 * ProtectedRoute - Route component that protects routes based on authentication and permissions
 */
const ProtectedRoute = ({ 
  requiredRole, 
  requiredPermission, 
  redirectPath = '/login' 
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const userRole = useSelector(selectRole);
  const isManager = useSelector(selectIsManager); // Add this to explicitly check manager status
  const location = useLocation();
  
  // Always call the selector, but use a selector that returns undefined if no permission is specified
  const hasSpecificPermission = useSelector(
    requiredPermission ? selectHasPermission(requiredPermission) : state => undefined
  );
  
  // Add effect to fetch employee data if needed
  useEffect(() => {
    // If we have a user but no role data, fetch the employee data
    if (user && userRole === undefined) {
      console.log('ProtectedRoute: No role data found, fetching employee data...');
      dispatch(fetchEmployeeData());
    }
  }, [user, userRole, dispatch]);
  
  // Enhanced debug information
  console.log('Protected route check:', { 
    user: !!user,
    userId: user?.id,
    userRole,
    isManager,
    requiredRole, 
    requiredPermission,
    hasSpecificPermission,
    path: location.pathname,
    redux_state: {
      employee: userRole,
      isManager
    }
  });

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permission if specified
  if (requiredPermission !== undefined && !hasSpecificPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check role if specified
  if (requiredRole) {
    // Add explicit logging for the manager check
    if (requiredRole === 'manager') {
      console.log('Checking manager role:', {
        requiredRole,
        userRole,
        isManager,
        isManagerByRole: ['manager', 'admin', 'director', 'hr'].includes(userRole),
        result: isManager || ['manager', 'admin', 'director', 'hr'].includes(userRole)
      });
    }

    // For backwards compatibility
    if (requiredRole === 'manager' && userRole === 'employee' && !isManager) {
      console.log('Redirecting: User is not a manager');
      return <Navigate to="/my-attendance" replace />;
    }
    
    // More specific role checks
    const hasRequiredRole = (() => {
      switch (requiredRole) {
        case 'admin':
          return ['admin', 'director'].includes(userRole);
        case 'hr':
          return ['hr', 'admin', 'director'].includes(userRole);
        case 'director':
          return userRole === 'director';
        case 'manager':
          return isManager || ['manager', 'admin', 'director', 'hr'].includes(userRole);
        default:
          return true; // Default to allow if role is unspecified or not recognized
      }
    })();

    if (!hasRequiredRole) {
      console.log(`User doesn't have required role: ${requiredRole}`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User is authenticated and has proper role/permission
  return <Outlet />;
};

export default ProtectedRoute;