import React from 'react';
import { useNavigate } from 'react-router-dom';

// Helper: Convert "sx" props to inline style.
// This basic conversion multiplies a numeric "p" (padding) value by 8 to mimic MUI spacing.
const convertSx = (sx) => {
  const style = { ...sx };
  if (sx && sx.p !== undefined) {
    style.padding = sx.p * 8;
    delete style.p;
  }
  return style;
};

function Stack({ sx, children, ...rest }) {
  // MUI's Stack sets display to flex. Additional styles are merged from the "sx" prop.
  const style = { display: 'flex', ...convertSx(sx) };
  return <div style={style} {...rest}>{children}</div>;
}

function List({ dense, sx, children, ...rest }) {
  // Render as an unordered list without default list styling.
  const style = {
    listStyle: 'none',
    margin: 0,
    padding: dense ? '4px 0' : '8px 0',
    ...convertSx(sx)
  };
  return <ul style={style} {...rest}>{children}</ul>;
}

function ListItem({ disablePadding, sx, children, ...rest }) {
  // Render as a list item. If disablePadding is true, no default padding is applied.
  const style = {
    display: 'block',
    padding: disablePadding ? 0 : '8px',
    ...convertSx(sx)
  };
  return <li style={style} {...rest}>{children}</li>;
}

function ListItemButton({ selected, onClick, sx, children, ...rest }) {
  // A clickable container. For dark theme, if selected, the background shows a subtle light overlay.
  const style = {
    cursor: 'pointer',
    backgroundColor: selected ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
    border: 'none',
    textAlign: 'left',
    width: '100%',
    padding: '8px',
    ...convertSx(sx)
  };
  return (
    <div role="button" onClick={onClick} style={style} {...rest}>
      {children}
    </div>
  );
}

function ListItemIcon({ sx, children, ...rest }) {
  // Icon container with spacing to the right.
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: '8px',
    ...convertSx(sx)
  };
  return <span style={style} {...rest}>{children}</span>;
}

function ListItemText({ primary, sx, ...rest }) {
  // Simple text display.
  const style = { ...convertSx(sx) };
  return <span style={style} {...rest}>{primary}</span>;
}

function AnalyticsRoundedIcon(props) {
  // A custom analytics icon mimicking a simple bar chart in a rounded style.
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="4" y="14" width="3" height="6" />
      <rect x="10.5" y="10" width="3" height="10" />
      <rect x="17" y="6" width="3" height="14" />
    </svg>
  );
}

const mainListItems = [
  { text: 'Model Analytics', icon: <AnalyticsRoundedIcon />, route: '/dashboard' },
  { text: 'User Analytics', icon: <AnalyticsRoundedIcon />, route: '/dashboard/user-analytics' }
];

export default function MenuContent() {
  const navigate = useNavigate();

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={window.location.pathname === item.route}
              onClick={() => navigate(item.route)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

// import * as React from 'react';
// import { useNavigate } from 'react-router-dom';
// import List from '@mui/material/List';
// import ListItem from '@mui/material/ListItem';
// import ListItemButton from '@mui/material/ListItemButton';
// import ListItemIcon from '@mui/material/ListItemIcon';
// import ListItemText from '@mui/material/ListItemText';
// import Stack from '@mui/material/Stack';
// import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';

// const mainListItems = [
//   { text: 'Model Analytics', icon: <AnalyticsRoundedIcon />, route: '/dashboard' },
//   { text: 'User Analytics', icon: <AnalyticsRoundedIcon />, route: '/dashboard/user-analytics' }
// ];

// export default function MenuContent() {
//   const navigate = useNavigate();

//   return (
//     <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
//       <List dense>
//         {mainListItems.map((item, index) => (
//           <ListItem key={index} disablePadding sx={{ display: 'block' }}>
//             <ListItemButton
//               selected={window.location.pathname === item.route}
//               onClick={() => navigate(item.route)}
//             >
//               <ListItemIcon>{item.icon}</ListItemIcon>
//               <ListItemText primary={item.text} />
//             </ListItemButton>
//           </ListItem>
//         ))}
//       </List>
//     </Stack>
//   );
// }
