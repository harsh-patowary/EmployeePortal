import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProviderWrapper } from './theme/ThemeContext';
import AppLayout from './layout/AppLayout';
import LoginPage from './pages/Loginpage';
import DashboardPage from './pages/DashboardPage';
// import EmployeeDashboard from './pages/EmployeeDashboard';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { useSelector } from 'react-redux';

function App() {
  const isAuthenticated = useSelector(state => state.auth.token);

  return (
    <ThemeProviderWrapper>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />

          {/* Protected Routes */}
          {isAuthenticated ? (
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* <Route path="/employees" element={<EmployeeDashboard />} /> */}
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          ) : (
            <Route path="*" element={<LoginPage />} />
          )}
        </Routes>
      </Router>
    </ThemeProviderWrapper>
  );
}

export default App;
