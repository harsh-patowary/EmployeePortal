import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  useTheme,
  Tooltip,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/Layers";
import LogoutIcon from "@mui/icons-material/Logout";
import EmailIcon from "@mui/icons-material/Email";
import TaskIcon from "@mui/icons-material/Task";
import WorkIcon from "@mui/icons-material/Work";
import HelpIcon from "@mui/icons-material/Help";
import EventNoteIcon from '@mui/icons-material/EventNote'; // Example icon for Leave
import { selectIsManager, logout } from "../redux/employeeSlice";

// Fixed width for the drawer
const drawerWidth = 240;

// External apps/services
const externalApps = [
  {
    name: "Email",
    icon: <EmailIcon />,
    path: "https://mail.example.com",
    external: true,
  },
  {
    name: "Documentation",
    icon: <HelpIcon />,
    path: "https://docs.example.com",
    external: true,
  },
  {
    name: "Company Portal",
    icon: <LayersIcon />,
    path: "https://portal.example.com",
    external: true,
  },
];

function Sidebar({ open, onClose }) {
  console.log("--- Rendering Sidebar ---");
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isManager = useSelector(selectIsManager);
  console.log("Sidebar rendering...... isManager:", isManager); // Debugging line
  const handleNavigation = (path, external = false) => {
    if (external) {
      window.open(path, "_blank");
    } else {
      navigate(path);
      if (onClose && window.innerWidth < theme.breakpoints.values.md) {
        onClose();
      }
    }
  };

  const handleLogout = () => {
    console.log("Dispatching logout action from employeeSlice"); // Add log
    dispatch(logout()); // This now dispatches the action from employeeSlice
    // Clear any other relevant local storage if needed
    localStorage.removeItem('user'); // Ensure user is removed if authSlice put it there
    navigate("/login");
  };

  // Define navigation items based on role
const getNavItems = () => {
  // Start with items available to all users
  const baseItems = [
    { name: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { name: "My Attendance", icon: <EventAvailableIcon />, path: "/my-attendance" },
    { name: "Leave Management", icon: <EventNoteIcon />, path: "/leave" }, // <-- ADD LEAVE LINK
    { name: "Projects", icon: <WorkIcon />, path: "/projects" },
    { name: "Tasks", icon: <TaskIcon />, path: "/tasks" },
  ];
  
  // Add manager-specific items if user is a manager
  if (isManager) {
    // Insert attendance management after dashboard
    baseItems.splice(1, 0, {
      name: "Attendance Management",
      icon: <EventAvailableIcon />,
      path: "/attendance",
    });
    
    // Add reports to the end
    baseItems.push({
      name: "Reports",
      icon: <BarChartIcon />,
      path: "/reports",
    });
  }

  return baseItems;
};

  const mainNavItems = getNavItems();

  const drawer = (
    <Box sx={{ overflowY: "auto", height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 2,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          EMS Portal
        </Typography>
      </Box>

      <Divider />

      {/* Main Navigation */}
      <List>
        {mainNavItems.filter(item => item.name).map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                "&.Mui-selected": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? theme.palette.primary.main
                      : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* External Apps */}
      <List>
        <ListItem sx={{ pl: 3, py: 0 }}>
          <Typography
            color="textSecondary"
            variant="caption"
            sx={{ fontWeight: 700, textTransform: "uppercase" }}
          >
            External Apps
          </Typography>
        </ListItem>

        {externalApps.map((item) => (
          <Tooltip
            key={item.name}
            title={`Open ${item.name} in new tab`}
            placement="right"
          >
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.external)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.name} />
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Settings and Logout */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation("/settings")}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: theme.palette.error.main }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              sx={{ color: theme.palette.error.main }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: open ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }} // Better mobile performance
        sx={{
          display: { xs: "block", sm: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          display: { xs: "none", sm: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: open ? "2px 0 10px rgba(0,0,0,0.05)" : "none",
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

export default Sidebar;
