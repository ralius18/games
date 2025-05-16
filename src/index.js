import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import App from './App';
import LoginPage from './LoginPage'
import reportWebVitals from './reportWebVitals';

import { isLoggedIn } from './aws-config';


function Root() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setChecked(true);
  }, []);

  if (!checked) return null; // or a loading spinner

  return loggedIn ? <App /> : <LoginPage onLogin={() => setLoggedIn(true)} />
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />)
