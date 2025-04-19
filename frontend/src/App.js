import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <ThemeProviderWrapper>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />

          {/* Base protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Employee-specific attendance route */}
              <Route path="/my-attendance" element={<EmployeeAttendancePage />} />
              
              {/* Manager-only routes */}
              <Route element={<ProtectedRoute requiredRole="manager" />}>
                <Route path="/attendance" element={<AttendanceDashboard />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
              
              {/* Other shared routes */}
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
    </ThemeProviderWrapper>
  );
}

export default App;
