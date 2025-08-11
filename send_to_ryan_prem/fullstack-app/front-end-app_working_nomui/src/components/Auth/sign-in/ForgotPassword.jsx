import React from 'react';
import PropTypes from 'prop-types';

// This component replaces Material UI's Dialog & related components with plain HTML and inline CSS to mimic the original look and behavior.
function ForgotPassword({ open, handleClose }) {
  // If the modal is not open, do not render anything
  if (!open) return null;

  // Styles for the overlay (replaces the backdrop of Material UI's Dialog)
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  // Styles for the modal container (replacing the Dialog's Paper component)
  const modalStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px', // similar to MUI spacing for PaperProps and DialogContent
  };

  // Styles for the content area (mimicking DialogContent)
  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  // Styles for the actions section (mimicking DialogActions)
  const actionsStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    paddingTop: '16px',
  };

  // Styles for the input field (replacing OutlinedInput)
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    outline: 'none',
    fontSize: '16px',
  };

  // Base style for buttons
  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  // Style for the Cancel button (replacing MUI Button default)
  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f0f0f0',
    color: '#333',
  };

  // Style for the Continue/Submit button (mimicking MUI's contained button)
  const continueButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#1976d2',
    color: '#fff',
  };

  return (
    <div style={overlayStyle}>
      {/*
        Replacing Material UI's Dialog with a standard HTML form.
        The form handles onSubmit to prevent default submission and call handleClose.
      */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleClose();
        }}
        style={modalStyle}
      >
        {/*
          Replacing DialogTitle with an HTML heading.
        */}
        <h2 style={{ margin: '0 0 16px 0' }}>Reset password</h2>

        {/*
          Replacing DialogContent with a div that holds the text and input.
        */}
        <div style={contentStyle}>
          <p>
            Enter your account&apos;s email address, and we&apos;ll send you a link to reset your password.
          </p>
          {/*
            Replacing OutlinedInput with a native input element styled to mimic it.
          */}
          <input
            autoFocus
            required
            id="email"
            name="email"
            type="email"
            placeholder="Email address"
            style={inputStyle}
          />
        </div>

        {/*
          Replacing DialogActions with a div containing the action buttons.
        */}
        <div style={actionsStyle}>
          <button type="button" onClick={handleClose} style={cancelButtonStyle}>
            Cancel
          </button>
          <button type="submit" style={continueButtonStyle}>
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;
