import { useSelector } from 'react-redux';
import { selectUser } from '../redux/authSlice';

export function usePermissions() {
  const user = useSelector(selectUser);
  
  return {
    isAuthenticated: Boolean(user),
    isManager: user?.is_manager === true,
    
    // Add custom permission checks
    canEditAttendance: user?.is_manager === true,
    canViewReports: user?.is_manager === true,
    
    // Helper method for generic role checks
    hasRole: (role) => {
      if (role === 'manager') return user?.is_manager === true;
      return Boolean(user); // Default to requiring authentication
    }
  };
}