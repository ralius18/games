import React from 'react';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

const Alert = (props) => {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
};

const Notification = ({ open, onClose, severity, message }) => {
  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <Alert onClose={onClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;
