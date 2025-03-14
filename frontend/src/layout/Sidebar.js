import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { Menu as MenuIcon } from '@mui/icons-material';

function Sidebar() {
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <div>
      <IconButton onClick={toggleDrawer}>
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
      >
        <List>
          <ListItem button component={Link} to="/dashboard">
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button component={Link} to="/employees">
            <ListItemText primary="Employees" />
          </ListItem>
          {/* Add more links as needed */}
        </List>
      </Drawer>
    </div>
  );
}

export default Sidebar;
