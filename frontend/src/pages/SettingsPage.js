import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  // FormControlLabel,
  TextField,
  Button,
  Grid,
  Alert
} from '@mui/material';

function SettingsPage() {
  // Sample settings state
  const [settings, setSettings] = useState({
    notifications: true,
    darkModeSystem: true,
    autoSave: true,
    email: 'user@example.com',
    language: 'English'
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggleChange = (setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    // Here you would save the settings to your backend
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Customize your application preferences
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Application Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemText 
                  primary="Enable Notifications" 
                  secondary="Receive alerts and messages"
                />
                <ListItemSecondaryAction>
                  <Switch 
                    edge="end"
                    checked={settings.notifications}
                    onChange={() => handleToggleChange('notifications')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Use System Theme" 
                  secondary="Match application theme with system settings"
                />
                <ListItemSecondaryAction>
                  <Switch 
                    edge="end"
                    checked={settings.darkModeSystem}
                    onChange={() => handleToggleChange('darkModeSystem')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Auto-save Changes" 
                  secondary="Automatically save form changes"
                />
                <ListItemSecondaryAction>
                  <Switch 
                    edge="end"
                    checked={settings.autoSave}
                    onChange={() => handleToggleChange('autoSave')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Account Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box component="form" onSubmit={handleSaveChanges} noValidate>
              <TextField
                margin="normal"
                fullWidth
                label="Email Address"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                margin="normal"
                fullWidth
                label="Language"
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                SelectProps={{
                  native: true,
                }}
                sx={{ mb: 3 }}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </TextField>
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth
              >
                Save Changes
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SettingsPage;