import React, { useState, useEffect } from 'react';
import theme from './theme';
import { login, isLoggedIn } from './aws-config';
import { Typography, TextField, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Container } from 'react-bootstrap';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn()) {
      onLogin();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(
      email,
      password,
      () => {
        onLogin();
      },
      (err) => setError(err.message || 'Login failed')
    );
  };

  return (

    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container style={{ maxWidth: 400, margin: '50px auto', padding: 20, boxShadow: '0 0 10px #ccc' }}>
        <Typography variant="h4">Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 10 }}
          />
          <TextField
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 10 }}
          />
          {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
          <Button type="submit" style={{ width: '100%', padding: 10 }}>Log in</Button>
        </form>
      </Container>
    </ThemeProvider>
  );
}
