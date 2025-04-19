import { useSelector } from 'react-redux';
// Import selectors from employeeSlice INSTEAD of authSlice
import { selectUser, selectIsManager, selectRole, selectPermissions } from '../redux/employeeSlice'; 

export function usePermissions() {
  // Use selectors from employeeSlice
  const user = useSelector(selectUser);
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);
  const permissions = useSelector(selectPermissions);

  console.log('usePermissions Hook:', { user, isManager, userRole, permissions }); // Debug log
  
  return {
    isAuthenticated: Boolean(user), // Based on user object existence from employeeSlice
    isManager: isManager, // Use the corrected selector
    userRole: userRole, // Use the corrected selector
    permissions: permissions, // Get derived permissions
    
    // Helper method for generic role checks (can use userRole)
    hasRole: (role) => {
      if (!userRole) return false;
      switch (role) {
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
    },
    // Helper method for specific permission check
    hasPermission: (permission) => {
        return permissions.includes(permission);
    }
  };
}