import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom'; // Import Outlet and Navigate
import ThemeProviderWrapper from './theme/ThemeContext';
import AppLayout from './layout/AppLayout';
import LoginPage from './pages/Loginpage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AttendanceDashboard from './features/attendance/pages/AttendanceDashboard';
import EmployeeAttendancePage from './features/attendance/pages/EmployeeAttendancePage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDetails, fetchManagerTeam, fetchAllEmployees, selectIsAuthenticated, selectUserRole } from './redux/employeeSlice';

// Define a component that applies the layout
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
  // Role selector might not be needed here if ProtectedRoute handles it
  // const role = useSelector(selectUserRole); 

  useEffect(() => {
    // Fetch user details if a token exists but user isn't authenticated in state
    if (localStorage.getItem('token') && !isAuthenticated) {
       console.log("App Effect: Dispatching fetchUserDetails");
       dispatch(fetchUserDetails()).then((result) => {
           // After user details are fetched, fetch team/all employees based on role
           if (result.meta.requestStatus === 'fulfilled' && result.payload) {
               const userRole = result.payload.role; 
               console.log("App Effect: User details fetched, role:", userRole);
               if (['admin', 'hr', 'director'].includes(userRole)) {
                   console.log("App Effect: Dispatching fetchAllEmployees and fetchManagerTeam");
                   dispatch(fetchAllEmployees());
                   dispatch(fetchManagerTeam()); 
               } else if (userRole === 'manager') {
                   console.log("App Effect: Dispatching fetchManagerTeam");
                   dispatch(fetchManagerTeam());
               }
           } else if (result.meta.requestStatus === 'rejected') {
               console.error("App Effect: fetchUserDetails failed", result.error);
               // Optional: Clear token or dispatch logout if fetch fails?
               // localStorage.removeItem('token'); 
               // dispatch(logout());
           }
       }).catch(error => {
           console.error("App Effect: Error in fetchUserDetails promise chain", error);
       });
    }
  }, [dispatch, isAuthenticated]); // Only run when dispatch or isAuthenticated changes

  return (
    <ThemeProviderWrapper>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Redirect root to login if not authenticated, or dashboard if authenticated? */}
          {/* Or just let ProtectedRoute handle it */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} /> 

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <LayoutWrapper /> 
              </ProtectedRoute>
            }
          >
            {/* These routes are children of LayoutWrapper, rendered via its Outlet */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="my-attendance" element={<EmployeeAttendancePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Manager-only routes nested under the main protected layout */}
            {/* Apply role check specifically here */}
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
            {/* Add other manager routes similarly */}

          </Route> {/* End of main protected route group */}
          
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
    </ThemeProviderWrapper>
  );
}

export default App;
