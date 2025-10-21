import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsManager, selectHasPermission, selectRole } from '../redux/employeeSlice';

/**
 * PermissionGate - Component for conditionally rendering content based on user permissions
 */
const PermissionGate = ({ 
  children, 
  requiredRole,
  requiredPermission,
  fallback = null 
}) => {
  // Always call hooks unconditionally at the top level
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);
  // Always call the selector, but pass null/undefined if we don't have a permission to check
  const hasSpecificPermission = useSelector(
    requiredPermission ? selectHasPermission(requiredPermission) : state => undefined
  );
  
  // Debug information
  console.log('PermissionGate:', { 
    requiredRole, 
    requiredPermission,
    userRole,
    isManager, 
    hasSpecificPermission 
  });
  
  // Check if user has required permissions
  const hasPermission = () => {
    // If specific permission is provided, that takes precedence
    if (requiredPermission !== undefined) {
      return hasSpecificPermission;
    }
    
    // Otherwise, check for role requirements
    if (requiredRole) {
      switch (requiredRole) {
        case 'manager':
          return isManager === true || ['manager', 'admin', 'director', 'hr'].includes(userRole);
        case 'admin':
          return ['admin', 'director'].includes(userRole);
        case 'hr':
          return ['hr', 'admin', 'director'].includes(userRole);
        case 'director':
          return userRole === 'director';
        case 'employee':
          return true; // All authenticated users are at least employees
        default:
          return false;
      }
    }
    
    // If no specific requirements, allow access
    return true;
  };
  
  const permission = hasPermission();
  console.log(`Permission check for ${requiredRole || requiredPermission}:`, permission);
  
  // If user has permission, render the children, otherwise render the fallback
  return permission ? children : fallback;
};

export default PermissionGate;