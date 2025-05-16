import React, { useState } from 'react';
import { Container, Typography, Tabs, Tab, Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import GamesView from './GamesView';
import SessionView from './SessionView';
import PlatformsView from './PlatformsView';
import StatsView from './StatsView';
import './App.css';
import theme from './theme';
import FriendsView from './FriendsView';
import { logout } from './aws-config';

const App = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth='xl' sx={{ p: '24px' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4">Games</Typography>
          <Button variant="outlined" onClick={logout}>Log Out</Button>
        </Box>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Sessions" />
          <Tab label="Games" />
          <Tab label="Friends" />
          <Tab label="Platforms" />
          <Tab label="Stats" />
        </Tabs>
        <Box sx={{ p: '24px' }}>
          {tabIndex === 0 && (
            <SessionView />
          )}
          {tabIndex === 1 && (
            <GamesView />
          )}
          {tabIndex === 2 && (
            <FriendsView />
          )}
          {tabIndex === 3 && (
            <PlatformsView />
          )}
          {tabIndex === 4 && (
            <StatsView />
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default App;