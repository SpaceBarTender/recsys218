import React from 'react';
import MainGrid from '../components/dashboard/MainGrid.jsx';
import AppAppBar from '../components/Recs/AppAppBar.jsx';

// Replacement for Material UI's CssBaseline component with a simple global CSS reset
const CssBaselineReplacement = () => {
  return (
    <style>
      {`
        /* CSS Baseline Reset */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body, #root {
          height: 100%;
        }
      `}
    </style>
  );
};

export default function Dashboard(props) {
  return (
    <>
      {/* Custom CSSBaseline replacement to reset default browser styling */}
      <CssBaselineReplacement />

      {/* Main container replacement: using a div to mimic Material UI's Box with flex layout */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Top AppBar remains unchanged */}
        <AppAppBar />

        {/* Spacer replacements for MUI Toolbar with fixed height (assumed 64px each) */}
        <div style={{ height: '64px' }}>
          {/* Spacer: mimicking Toolbar's height */}
        </div>
        <div style={{ height: '64px' }}>
          {/* Additional spacer */}
        </div>

        {/* Main content area replacement for MUI Box */}
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fafafa', // Using a default background color similar to theme.palette.background.default
          }}
        >
          {/* Header content container replacement for MUI Stack */}
          <div
            style={{
              padding: '16px 24px 0px 24px', // 16px top, 24px horizontal, 0px bottom padding
              display: 'flex',
              flexDirection: 'column',
              gap: '16px', // 16px gap to mimic spacing={2} (2*8px)
            }}
          >
            {/* Optional header content */}
          </div>

          {/* Main grid container replacement for MUI Box with scrollable content */}
          <div
            style={{
              flexGrow: 1,
              overflow: 'auto',
              padding: '0 24px 24px 24px', // 24px horizontal and bottom padding
            }}
          >
            <MainGrid />
          </div>
        </div>
      </div>
    </>
  );
}
