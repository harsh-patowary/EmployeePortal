import React, { useEffect } from 'react'; // Ensure useEffect is imported
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import ThemeProviderWrapper from './theme/ThemeContext';
import AppLayout from './layout/AppLayout';
// import LoginPage from './pages/Loginpage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './pages/ProfilePage'; // <-- Import Profile Page
import AttendanceDashboard from './features/attendance/pages/AttendanceDashboard';
import EmployeeAttendancePage from './features/attendance/pages/EmployeeAttendancePage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LeaveDashboardPage from './features/leave/pages/LeaveDashboardPage'; // <-- Import Leave Page
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserDetails,
  fetchManagerTeam,
  fetchAllEmployees,
  selectIsAuthenticated,
  selectUser, // Import selectUser
  selectUserRole, // <-- Make sure this is imported if used in Effect 2
  selectLoadingTeam, // Import loading status selectors
  selectLoadingAllEmployees, // Import loading status selectors
  selectTeamMembers, // Import data selectors to check if already loaded
  selectAllEmployees // Import data selectors to check if already loaded
} from './redux/employeeSlice';

const LayoutWrapper = () => {
  console.log("--- Rendering LayoutWrapper ---"); // Add log here
  return (
    <AppLayout>
      <Outlet /> {/* Child routes will render here */}
    </AppLayout>
  );
};

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser); // Get the user object
  const userRole = user?.role; // Get role from the user object in state
  const loadingTeam = useSelector(selectLoadingTeam);
  const loadingAllEmployees = useSelector(selectLoadingAllEmployees);
  const teamMembers = useSelector(selectTeamMembers);
  const allEmployees = useSelector(selectAllEmployees);

  // Effect 1: Fetch User Details on initial load if token exists but not authenticated
  useEffect(() => {
    const tokenExists = !!localStorage.getItem('token'); // More robust check
    const token = localStorage.getItem('token');
    console.log("App Effect 1 Triggered. Token exists:", !!token, "Is Authenticated in state:", isAuthenticated);

    if (tokenExists && (!isAuthenticated || !user)) {
       console.log("App Effect 1: Conditions met. Dispatching fetchUserDetails.");
       dispatch(fetchUserDetails())
         .catch(error => {
             console.error("App Effect 1: Error caught during fetchUserDetails dispatch:", error);
         });
       // REMOVED the .then() block for fetching team/all employees here
    } else {
        console.log("App Effect 1: Conditions NOT met for dispatching fetchUserDetails (No token or already authenticated).");
    }
  }, [dispatch, isAuthenticated]); // Keep dependencies

  // Effect 2: Fetch role-specific data AFTER user details are loaded and role is known
  useEffect(() => {
    console.log("App Effect 2 Triggered. User Role:", userRole, "Auth:", isAuthenticated);

    // Only proceed if authenticated and user role is known
    if (isAuthenticated && userRole) {
      if (['admin', 'hr', 'director'].includes(userRole)) {
        // Fetch All Employees if not already loading or loaded
        if (loadingAllEmployees === 'idle' && allEmployees.length === 0) {
          console.log("App Effect 2: Role is Admin/HR/Director. Dispatching fetchAllEmployees.");
          dispatch(fetchAllEmployees());
        }
        // Admin/HR/Director might also need their own team view? If so, add fetchManagerTeam here too.
        // Example: Fetch team if not already loading or loaded
        if ((loadingTeam === 'idle' || loadingTeam === undefined || loadingTeam === 'failed')  && teamMembers.length === 0) {
           console.log("App Effect 2: Role is Admin/HR/Director. Dispatching fetchManagerTeam.");
           dispatch(fetchManagerTeam());
        }

      } else if (userRole === 'manager') {
        // Fetch Manager Team if not already loading or loaded
        console.log(`App Effect 2: Checking manager fetch conditions - loadingTeam: ${loadingTeam}, teamMembers.length: ${teamMembers.length}`);
        if ((loadingTeam === 'idle' || loadingTeam === undefined || loadingTeam === 'failed') && teamMembers.length === 0) {
          console.log("App Effect 2: Role is Manager. Dispatching fetchManagerTeam.");
          dispatch(fetchManagerTeam());
        }
      } else {
        console.log("App Effect 2: Role is neither manager nor admin/hr/director. Not dispatching team/all fetches.");
      }
    }
  // Dependencies: Run when authentication status, user role, or loading states change
  }, [isAuthenticated, userRole, loadingTeam, loadingAllEmployees, teamMembers.length, allEmployees.length, dispatch]);

  return (
    <ThemeProviderWrapper>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} /> 

          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <LayoutWrapper /> 
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} /> {/* <-- ADD PROFILE ROUTE */}
            <Route path="my-attendance" element={<EmployeeAttendancePage />} />
            <Route path="leave" element={<LeaveDashboardPage />} /> {/* <-- ADD LEAVE ROUTE */}
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="settings" element={<SettingsPage />} />

            <Route 
              path="attendance" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <AttendanceDashboard />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="reports" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <ReportsPage />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
    </ThemeProviderWrapper>
  );
}

export default App;
