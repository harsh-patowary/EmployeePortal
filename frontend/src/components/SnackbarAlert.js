import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const SnackbarAlert = ({ open, message, severity = 'info', onClose, duration = 6000 }) => {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    if (onClose) {
      onClose(event, reason);
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Or customize position
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarAlert;