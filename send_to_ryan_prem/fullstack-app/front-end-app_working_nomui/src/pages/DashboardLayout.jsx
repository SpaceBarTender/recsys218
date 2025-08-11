import * as React from 'react';
import { Outlet } from 'react-router-dom';
import AppAppBar from '../components/Recs/AppAppBar.jsx';
import MenuContent from '../components/dashboard/MenuContent.jsx';

export default function DashboardLayout(props) {
  // Align to dark mode; defaulting to #242424 if theme values are absent (as per index.css)
  const computedBackgroundColor =
    props.theme && props.theme.vars
      ? `rgba(${props.theme.vars.palette.background.defaultChannel} / 1)`
      : props.theme &&
        props.theme.palette &&
        props.theme.palette.background &&
        props.theme.palette.background.default
      ? props.theme.palette.background.default
      : '#242424';

  return (
    <div style={{ margin: 0, padding: 0, boxSizing: 'border-box' }}>
      {/* Container using dark mode styling aligned with index.css */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: computedBackgroundColor,
          color: 'rgba(255, 255, 255, 0.87)', // Dark mode text color from index.css
        }}
      >
        <AppAppBar />

        {/* Spacer (approx. 64px height) */}
        <div style={{ height: '64px' }} />

        {/* Main content area for nested routes */}
        <main
          style={{
            flexGrow: 1,
            padding: '24px',
            overflow: 'auto',
          }}
        >
          {/*
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <MenuContent />
          </div>
          */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// import * as React from 'react';
// import { Outlet } from 'react-router-dom';
// // Removed Material UI imports and helper functions, replacing them with plain HTML elements and inline styles.
// import AppTheme from '../components/shared-theme/AppTheme.jsx';
// import AppAppBar from '../components/Recs/AppAppBar.jsx';
// import MenuContent from '../components/dashboard/MenuContent.jsx'; // Import MenuContent instead of SideMenu
// import {
//   chartsCustomizations,
//   dataGridCustomizations,
//   datePickersCustomizations,
//   treeViewCustomizations,
// } from '../components/dashboard/theme/customizations/index.js';

// const xThemeComponents = {
//   ...chartsCustomizations,
//   ...dataGridCustomizations,
//   ...datePickersCustomizations,
//   ...treeViewCustomizations,
// };

// export default function DashboardLayout(props) {
//   // Compute background color similar to Material UI's theme logic:
//   // If theme.vars is available, simulate using the 'defaultChannel' value.
//   // Otherwise, default to theme.palette.background.default if provided, or fallback to white.
//   const computedBackgroundColor =
//     props.theme && props.theme.vars
//       ? `rgba(${props.theme.vars.palette.background.defaultChannel} / 1)`
//       : props.theme &&
//         props.theme.palette &&
//         props.theme.palette.background &&
//         props.theme.palette.background.default
//       ? props.theme.palette.background.default
//       : '#fff';

//   return (
//     <AppTheme {...props} themeComponents={xThemeComponents}>
//       {/* Removed Material UI CssBaseline.
//           In its place, we apply a basic reset using a plain div. */}
//       <div style={{ margin: 0, padding: 0, boxSizing: 'border-box' }} />
      
//       {/* Container replacing Material UI Box with flex layout and full viewport height */}
//       <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
//         <AppAppBar />
        
//         {/* Replacing Material UI Toolbar with a plain div serving as a spacer (approx. 64px height) */}
//         <div style={{ height: '64px' }} />
        
//         {/* Replacing Material UI Box for main content with a <main> element and inline styles */}
//         <main
//           style={{
//             flexGrow: 1,
//             backgroundColor: computedBackgroundColor,
//             padding: '24px', // Equivalent to Material UI's spacing p: 3 (3 * 8px)
//             overflow: 'auto',
//           }}
//         >
//           {/* Optionally, render MenuContent at the top left of the dashboard */}
//           {/*
//           <div style={{ marginBottom: '16px', textAlign: 'left' }}>
//             <MenuContent />
//           </div>
//           */}
//           {/* Nested routes render here */}
//           <Outlet />
//         </main>
//       </div>
//     </AppTheme>
//   );
// }
