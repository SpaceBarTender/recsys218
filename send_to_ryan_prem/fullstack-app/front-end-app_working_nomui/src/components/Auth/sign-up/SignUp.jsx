import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { signupUser, fetchOffices } from "../../../api.js";

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '16px',
  backgroundColor: '#242424',
  position: 'relative'
};

const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '400px',
  padding: '32px',
  gap: '24px',
  margin: 'auto',
  boxShadow: '0px 5px 15px rgba(0,0,0,0.5)',
  borderRadius: '8px',
  backgroundColor: '#333'
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

const labelStyle = {
  marginBottom: '4px',
  fontWeight: 'bold',
  color: 'rgba(255, 255, 255, 0.87)'
};

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

const strat_logo = "/images/US_Strategic_Command_Emblem.png";

export default function SignUp(props) {
  const [usernameError, setUsernameError] = useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  
  const [officeCodes, setOfficeCodes] = useState([]);
  const [selectedOfficeCode, setSelectedOfficeCode] = useState("");
  const [officeError, setOfficeError] = useState(false);
  const [officeErrorMessage, setOfficeErrorMessage] = useState("");
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // Fetch office codes when the component mounts
  useEffect(() => {
    fetchOffices()
      .then((data) => {
        // The API returns an array of objects with { office_id, office_code }
        setOfficeCodes(data);
      })
      .catch((error) => {
        console.error("Failed to load office codes:", error);
      });
  }, []);

  const validateInputs = () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    let isValid = true;

    if (!username || username.length < 3) {
      setUsernameError(true);
      setUsernameErrorMessage("Username must be at least 3 characters long.");
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage("");
    }

    if (!password) {
      setPasswordError(true);
      setPasswordErrorMessage("Password cannot be empty.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    if (!selectedOfficeCode) {
      setOfficeError(true);
      setOfficeErrorMessage("Please select an office code.");
      isValid = false;
    } else {
      setOfficeError(false);
      setOfficeErrorMessage("");
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await signupUser({
        username,
        password,
        office_code: selectedOfficeCode,
      });

      if (response.message === "User created successfully") {
        setSuccessMessage("Signup successful! Redirecting to login...");
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setErrorMessage(response.error || "Signup failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <img src={strat_logo} alt="US Strategic Command Emblem" style={imageStyle} />
        <h1 style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.87)' }}>Sign up</h1>
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formControlStyle}>
            <label htmlFor="username" style={labelStyle}>Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              placeholder="Enter username"
              style={inputStyle}
            />
            {usernameError && (
              <span style={errorTextStyle}>
                {usernameErrorMessage}
              </span>
            )}
          </div>
          <div style={formControlStyle}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••"
              style={inputStyle}
            />
            {passwordError && (
              <span style={errorTextStyle}>
                {passwordErrorMessage}
              </span>
            )}
          </div>
          <div style={formControlStyle}>
            <label htmlFor="officeCode" style={labelStyle}>Office Code</label>
            <select
              id="officeCode"
              required
              value={selectedOfficeCode}
              onChange={(e) => setSelectedOfficeCode(e.target.value)}
              style={inputStyle}
            >
              <option value="" disabled>
                Select an office code
              </option>
              {officeCodes.map((office) => (
                <option key={office.office_id} value={office.office_code}>
                  {office.office_code}
                </option>
              ))}
            </select>
            {officeError && (
              <span style={errorTextStyle}>
                {officeErrorMessage}
              </span>
            )}
          </div>
          <button type="submit" style={buttonStyle}>
            Sign up
          </button>
          {successMessage && (
            <div style={successStyle}>
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div style={errorStyle}>
              {errorMessage}
            </div>
          )}
          <div style={linkContainerStyle}>
            <p>
              Already have an account?{" "}
              <RouterLink to="/signin" style={linkStyle}>
                Sign in
              </RouterLink>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
