import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
// ✅ REPLACE { login } WITH { loginUser } FROM your new API
import { loginUser } from '../../../api.js';

const strat_logo = "/images/US_Strategic_Command_Emblem.png";

// Dark mode inline style objects – using the same grey (#242424) from index.css for the overall background
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '16px',
  backgroundColor: '#242424', // matches index.css background (what’s beside the card)
  position: 'relative'
};

// Sign-in card style: ensure a dark background (not white) for dark mode 
const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '400px',
  padding: '32px',
  gap: '24px',
  margin: 'auto',
  boxShadow: '0px 5px 15px rgba(0,0,0,0.5)', // provides subtle elevation
  borderRadius: '8px',
  backgroundColor: '#333' // dark grey so the card isn’t white
};

const imageStyle = {
  height: '80px',
  margin: '16px auto'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  gap: '16px'
};

const formControlStyle = {
  display: 'flex',
  flexDirection: 'column'
};

// Labels use a light color to stand out on dark backgrounds
const labelStyle = {
  marginBottom: '4px',
  fontWeight: 'bold',
  color: 'rgba(255, 255, 255, 0.87)'
};

// Input style: dark background with light text
const inputStyle = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #555',
  fontSize: '16px',
  backgroundColor: '#424242',
  color: 'rgba(255,255,255,0.87)'
};

const buttonStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px'
};

const errorTextStyle = {
  color: 'red',
  fontSize: '0.8rem'
};

const successStyle = {
  color: 'green',
  textAlign: 'center'
};

const errorStyle = {
  color: 'red',
  textAlign: 'center'
};

const linkContainerStyle = {
  textAlign: 'center',
  marginTop: '16px'
};

const linkStyle = {
  textDecoration: 'none',
  color: '#646cff'
};

// Replacement for Material UI's ColorModeSelect – still using dark mode colors as per index.css
const colorModeStyle = {
  position: 'fixed',
  top: '1rem',
  right: '1rem',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#646cff'
};

export default function SignIn(props) {
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const validateInputs = () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    let isValid = true;

    if (!username || username.length < 3) {
      setUsernameError(true);
      isValid = false;
    } else {
      setUsernameError(false);
    }

    if (!password) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      // Use the updated API function loginUser and pass { username, password }
      const response = await loginUser({ username, password });
      
      if (response.session_token) {
        localStorage.setItem('session_token', response.session_token);
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => navigate('/home'), 1500);
      } else {
        setErrorMessage(response.error || 'Invalid login credentials.');
      }
    } catch (error) {
      setErrorMessage('An error occurred during login.');
    }
  };

  // Removed the outer wrapper with its own inline background so that index.css takes full control.
  // The container and card now explicitly use dark mode styling.
  return (
    <>
      <div style={containerStyle}>
        <div style={cardStyle}>
          <img
            src={strat_logo}
            alt="US Strategic Command Emblem"
            style={imageStyle}
          />
          <h1 style={{ textAlign: 'center', color: 'rgba(255,255,255,0.87)' }}>Sign in</h1>
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={formControlStyle}>
              <label htmlFor="username" style={labelStyle}>Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                style={inputStyle}
              />
              {usernameError && <span style={errorTextStyle}>At least 3 characters required</span>}
            </div>
            <div style={formControlStyle}>
              <label htmlFor="password" style={labelStyle}>Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                style={inputStyle}
              />
              {passwordError && <span style={errorTextStyle}>Password is required</span>}
            </div>
            <button type="submit" style={buttonStyle}>Sign in</button>
            {successMessage && <div style={successStyle}>{successMessage}</div>}
            {errorMessage && <div style={errorStyle}>{errorMessage}</div>}
            <div style={linkContainerStyle}>
              <span>Don't have an account? </span>
              <RouterLink to="/signup" style={linkStyle}>Sign up</RouterLink>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
