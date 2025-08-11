import * as React from 'react';
import { useNavigate } from 'react-router-dom';
// Removed dark/light mode buttons import as they are no longer used
import { logoutUser, fetchAddedPages } from '../../api.js'; // Adjust import paths as needed

const strat_logo = "/images/US_Strategic_Command_Emblem.png";

// Define inline styles for dark mode
const styles = {
  appBar: {
    position: 'fixed',
    top: 'calc(var(--template-frame-height, 0px) + 28px)',
    left: 0,
    right: 0,
    background: 'transparent',
    boxShadow: 'none',
    zIndex: 1000,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
  },
  styledToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    borderRadius: '12px', // approximated from theme.borderRadius + 8px
    backdropFilter: 'blur(24px)',
    border: '1px solid #444', // darker divider for dark mode
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // dark semi-transparent background
    boxShadow: '0px 2px 4px rgba(0,0,0,0.8)',
    padding: '8px 12px',
    margin: '8px 0',
  },
  navLinkContainer: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    padding: 0,
  },
  logo: {
    height: '40px',
    marginRight: '16px',
    cursor: 'pointer',
  },
  // Simple text buttons now with white text
  textButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    padding: '6px 12px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  // Primary buttons remain the same (white text)
  button: {
    backgroundColor: '#1976d2',
    color: 'white',
    fontSize: '14px',
    padding: '6px 12px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '4px',
    marginRight: '8px',
  },
  // Container for the Dashboard dropdown
  dropdownContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: '#333',
    border: '1px solid #444',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.8)',
    zIndex: 100,
    minWidth: '150px',
  },
  dropdownMenuItem: {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    color: '#fff',
  },
  divider: {
    height: '1px',
    backgroundColor: '#555',
    margin: '16px 0',
    border: 'none',
  },
  // Mobile menu icon style (hidden as instructed)
  menuIcon: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
    color: '#fff',
  },
  // Drawer overlay that covers the viewport in mobile view
  drawerOverlay: {
    position: 'fixed',
    top: 'var(--template-frame-height, 0px)',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1100,
  },
  // Drawer panel style
  drawer: {
    backgroundColor: '#222',
    padding: '16px',
  },
  drawerMenuItem: {
    padding: '12px 0',
    borderBottom: '1px solid #444',
    cursor: 'pointer',
    color: '#fff',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#fff',
  },
};

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);
  // Using a simple boolean toggle for the Dashboard menu
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [sessionExpired, setSessionExpired] = React.useState(false);
  const navigate = useNavigate();

  // On mount, check for an existing session token.
  React.useEffect(() => {
    const sessionToken = localStorage.getItem('session_token');
    setIsLoggedIn(!!sessionToken);
  }, []);

  const handleLogout = async () => {
    const sessionToken = localStorage.getItem('session_token');
    try {
      // Invalidate the session on the server.
      await logoutUser(sessionToken);
    } catch (err) {
      console.error("[ERROR] Logout API call failed:", err);
    } finally {
      // Clear session data and update state.
      localStorage.removeItem('session_token');
      setIsLoggedIn(false);
      navigate('/signin');
    }
  };

  // Periodic session check (every 60 seconds)
  React.useEffect(() => {
    const intervalId = setInterval(async () => {
      const sessionToken = localStorage.getItem('session_token');
      if (sessionToken) {
        try {
          const response = await fetchAddedPages(sessionToken);
          if (response.error && response.error.toLowerCase().includes('session')) {
            if (!sessionExpired) {
              setSessionExpired(true);
              alert("Your session has expired. Please login again.");
              handleLogout();
            }
          }
        } catch (error) {
          console.error("[ERROR] Session check failed:", error);
          if (!sessionExpired) {
            setSessionExpired(true);
            alert("Your session has expired. Please login again.");
            handleLogout();
          }
        }
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [sessionExpired]);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  // Toggle for the Dashboard dropdown menu
  const toggleDashboardMenu = () => {
    setDashboardMenuAnchor(dashboardMenuAnchor ? null : true);
  };

  return (
    <>
      {/* Embedded CSS for responsive behavior */}
      <style>{`
        .desktop-only { display: none; }
        .mobile-only { display: flex; }
        @media (min-width: 768px) {
          .desktop-only { display: flex; }
          .mobile-only { display: none; }
        }
      `}</style>
      <header style={styles.appBar}>
        <div style={styles.container}>
          <div style={styles.styledToolbar}>
            {/* Left Section - Logo and Navigation Links */}
            <div style={styles.navLinkContainer}>
              <img
                src={strat_logo}
                alt="Site Logo"
                style={styles.logo}
                onClick={() => navigate('/home')}
              />
              {/* Desktop Navigation Links */}
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
                <button style={styles.textButton} onClick={() => navigate('/home')}>Home</button>
                <button style={styles.textButton} onClick={() => navigate('/bookmarks')}>Bookmarks</button>
                <button style={styles.textButton} onClick={() => navigate('/added')}>Added Pages</button>
                <button style={styles.textButton} onClick={() => navigate('/report')}>Report Builder</button>
                <button style={styles.textButton} onClick={() => navigate('/chat')}>Chatbot</button>
                {/* Dashboard Button with Dropdown */}
                <div style={styles.dropdownContainer}>
                  <button style={styles.textButton} onClick={toggleDashboardMenu}>
                    Dashboard
                  </button>
                  {dashboardMenuAnchor && (
                    <div style={styles.dropdownMenu}>
                      <div
                        style={styles.dropdownMenuItem}
                        onClick={() => {
                          navigate('/dashboard');
                          setDashboardMenuAnchor(null);
                        }}
                      >
                        Model Analytics
                      </div>
                      <div
                        style={styles.dropdownMenuItem}
                        onClick={() => {
                          navigate('/dashboard/user-analytics');
                          setDashboardMenuAnchor(null);
                        }}
                      >
                        User Analytics
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Right Section - Login/Logout */}
            <div className="desktop-only" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isLoggedIn ? (
                <button
                  style={{
                    ...styles.button,
                    backgroundColor: 'white',
                    color: 'black',
                    appearance: 'none',
                    WebkitAppearance: 'none'
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              ) : (
                <>
                  <button style={styles.textButton} onClick={() => navigate('/signin')}>Sign in</button>
                  <button
                    style={{
                      ...styles.button,
                      backgroundColor: 'white',
                      color: 'black',
                      appearance: 'none',
                      WebkitAppearance: 'none'
                    }}
                    onClick={() => navigate('/signup')}
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
            {/* Mobile Menu removed as per instructions (dark/light mode and hamburger menu hidden) */}
          </div>
        </div>
      </header>
      {/* Drawer replacement for Mobile Menu remains, though it is no longer triggered */}
      {open && (
        <div style={styles.drawerOverlay} onClick={toggleDrawer(false)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={styles.closeButton} onClick={toggleDrawer(false)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={styles.drawerMenuItem} onClick={() => { navigate('/home'); setOpen(false); }}>
                Home
              </div>
              <div style={styles.drawerMenuItem} onClick={() => { navigate('/bookmarks'); setOpen(false); }}>
                Bookmarks
              </div>
              <div style={styles.drawerMenuItem} onClick={() => { navigate('/added'); setOpen(false); }}>
                Added Pages
              </div>
              <div style={styles.drawerMenuItem} onClick={() => { navigate('/report'); setOpen(false); }}>
                Report Builder
              </div>
              <div style={styles.drawerMenuItem} onClick={() => { navigate('/chat'); setOpen(false); }}>
                Chatbot
              </div>
              <div style={styles.drawerMenuItem} onClick={() => { navigate('/dashboard'); setOpen(false); }}>
                Dashboard
              </div>
              <hr style={styles.divider} />
              {isLoggedIn ? (
                <div style={styles.drawerMenuItem}>
                  <button
                    style={{
                      ...styles.button,
                      backgroundColor: 'white',
                      color: 'black',
                      appearance: 'none',
                      WebkitAppearance: 'none'
                    }}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <div style={styles.drawerMenuItem}>
                    <button style={styles.textButton} onClick={() => { navigate('/signin'); setOpen(false); }}>
                      Sign in
                    </button>
                  </div>
                  <div style={styles.drawerMenuItem}>
                    <button
                      style={{
                        ...styles.button,
                        backgroundColor: 'white',
                        color: 'black',
                        appearance: 'none',
                        WebkitAppearance: 'none'
                      }}
                      onClick={() => { navigate('/signup'); setOpen(false); }}
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// import * as React from 'react';
// import { useNavigate } from 'react-router-dom';
// // Removed dark/light mode buttons import as they are no longer used
// import { logoutUser, fetchAddedPages } from '../../api.js'; // Adjust import paths as needed

// const strat_logo = "/images/US_Strategic_Command_Emblem.png";

// // Define inline styles for dark mode
// const styles = {
//   appBar: {
//     position: 'fixed',
//     top: 'calc(var(--template-frame-height, 0px) + 28px)',
//     left: 0,
//     right: 0,
//     background: 'transparent',
//     boxShadow: 'none',
//     zIndex: 1000,
//   },
//   container: {
//     maxWidth: '1200px',
//     margin: '0 auto',
//     padding: '0 16px',
//   },
//   styledToolbar: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     flexShrink: 0,
//     borderRadius: '12px', // approximated from theme.borderRadius + 8px
//     backdropFilter: 'blur(24px)',
//     border: '1px solid #444', // darker divider for dark mode
//     backgroundColor: 'rgba(0, 0, 0, 0.7)', // dark semi-transparent background
//     boxShadow: '0px 2px 4px rgba(0,0,0,0.8)',
//     padding: '8px 12px',
//     margin: '8px 0',
//   },
//   navLinkContainer: {
//     display: 'flex',
//     alignItems: 'center',
//     flexGrow: 1,
//     padding: 0,
//   },
//   logo: {
//     height: '40px',
//     marginRight: '16px',
//     cursor: 'pointer',
//   },
//   // Simple text buttons now with white text
//   textButton: {
//     background: 'none',
//     border: 'none',
//     color: 'white',
//     fontSize: '14px',
//     padding: '6px 12px',
//     cursor: 'pointer',
//     marginRight: '8px',
//   },
//   // Primary buttons remain the same (white text)
//   button: {
//     backgroundColor: '#1976d2',
//     color: 'white',
//     fontSize: '14px',
//     padding: '6px 12px',
//     cursor: 'pointer',
//     border: 'none',
//     borderRadius: '4px',
//     marginRight: '8px',
//   },
//   // Container for the Dashboard dropdown
//   dropdownContainer: {
//     position: 'relative',
//     display: 'inline-block',
//   },
//   dropdownMenu: {
//     position: 'absolute',
//     top: '100%',
//     left: 0,
//     backgroundColor: '#333',
//     border: '1px solid #444',
//     boxShadow: '0px 2px 4px rgba(0,0,0,0.8)',
//     zIndex: 100,
//     minWidth: '150px',
//   },
//   dropdownMenuItem: {
//     padding: '8px 16px',
//     cursor: 'pointer',
//     whiteSpace: 'nowrap',
//     color: '#fff',
//   },
//   divider: {
//     height: '1px',
//     backgroundColor: '#555',
//     margin: '16px 0',
//     border: 'none',
//   },
//   // Mobile menu icon style (hidden as instructed)
//   menuIcon: {
//     display: 'none',
//     background: 'none',
//     border: 'none',
//     fontSize: '24px',
//     cursor: 'pointer',
//     padding: '4px',
//     color: '#fff',
//   },
//   // Drawer overlay that covers the viewport in mobile view
//   drawerOverlay: {
//     position: 'fixed',
//     top: 'var(--template-frame-height, 0px)',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     zIndex: 1100,
//   },
//   // Drawer panel style
//   drawer: {
//     backgroundColor: '#222',
//     padding: '16px',
//   },
//   drawerMenuItem: {
//     padding: '12px 0',
//     borderBottom: '1px solid #444',
//     cursor: 'pointer',
//     color: '#fff',
//   },
//   closeButton: {
//     background: 'none',
//     border: 'none',
//     fontSize: '24px',
//     cursor: 'pointer',
//     color: '#fff',
//   },
// };

// export default function AppAppBar() {
//   const [open, setOpen] = React.useState(false);
//   // Using a simple boolean toggle for the Dashboard menu
//   const [dashboardMenuAnchor, setDashboardMenuAnchor] = React.useState(null);
//   const [isLoggedIn, setIsLoggedIn] = React.useState(false);
//   const [sessionExpired, setSessionExpired] = React.useState(false);
//   const navigate = useNavigate();

//   // On mount, check for an existing session token.
//   React.useEffect(() => {
//     const sessionToken = localStorage.getItem('session_token');
//     setIsLoggedIn(!!sessionToken);
//   }, []);

//   const handleLogout = async () => {
//     const sessionToken = localStorage.getItem('session_token');
//     try {
//       // Invalidate the session on the server.
//       await logoutUser(sessionToken);
//     } catch (err) {
//       console.error("[ERROR] Logout API call failed:", err);
//     } finally {
//       // Clear session data and update state.
//       localStorage.removeItem('session_token');
//       setIsLoggedIn(false);
//       navigate('/signin');
//     }
//   };

//   // Periodic session check (every 60 seconds)
//   React.useEffect(() => {
//     const intervalId = setInterval(async () => {
//       const sessionToken = localStorage.getItem('session_token');
//       if (sessionToken) {
//         try {
//           const response = await fetchAddedPages(sessionToken);
//           if (response.error && response.error.toLowerCase().includes('session')) {
//             if (!sessionExpired) {
//               setSessionExpired(true);
//               alert("Your session has expired. Please login again.");
//               handleLogout();
//             }
//           }
//         } catch (error) {
//           console.error("[ERROR] Session check failed:", error);
//           if (!sessionExpired) {
//             setSessionExpired(true);
//             alert("Your session has expired. Please login again.");
//             handleLogout();
//           }
//         }
//       }
//     }, 60000);

//     return () => clearInterval(intervalId);
//   }, [sessionExpired]);

//   const toggleDrawer = (newOpen) => () => {
//     setOpen(newOpen);
//   };

//   // Toggle for the Dashboard dropdown menu
//   const toggleDashboardMenu = () => {
//     setDashboardMenuAnchor(dashboardMenuAnchor ? null : true);
//   };

//   return (
//     <>
//       {/* Embedded CSS for responsive behavior */}
//       <style>{`
//         .desktop-only { display: none; }
//         .mobile-only { display: flex; }
//         @media (min-width: 768px) {
//           .desktop-only { display: flex; }
//           .mobile-only { display: none; }
//         }
//       `}</style>
//       <header style={styles.appBar}>
//         <div style={styles.container}>
//           <div style={styles.styledToolbar}>
//             {/* Left Section - Logo and Navigation Links */}
//             <div style={styles.navLinkContainer}>
//               <img
//                 src={strat_logo}
//                 alt="Site Logo"
//                 style={styles.logo}
//                 onClick={() => navigate('/home')}
//               />
//               {/* Desktop Navigation Links */}
//               <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
//                 <button style={styles.textButton} onClick={() => navigate('/home')}>Home</button>
//                 <button style={styles.textButton} onClick={() => navigate('/bookmarks')}>Bookmarks</button>
//                 <button style={styles.textButton} onClick={() => navigate('/added')}>Added Pages</button>
//                 <button style={styles.textButton} onClick={() => navigate('/report')}>Report Builder</button>
//                 <button style={styles.textButton} onClick={() => navigate('/chat')}>Chatbot</button>
//                 {/* Dashboard Button with Dropdown */}
//                 <div style={styles.dropdownContainer}>
//                   <button style={styles.textButton} onClick={toggleDashboardMenu}>
//                     Dashboard
//                   </button>
//                   {dashboardMenuAnchor && (
//                     <div style={styles.dropdownMenu}>
//                       <div
//                         style={styles.dropdownMenuItem}
//                         onClick={() => {
//                           navigate('/dashboard');
//                           setDashboardMenuAnchor(null);
//                         }}
//                       >
//                         Model Analytics
//                       </div>
//                       <div
//                         style={styles.dropdownMenuItem}
//                         onClick={() => {
//                           navigate('/dashboard/user-analytics');
//                           setDashboardMenuAnchor(null);
//                         }}
//                       >
//                         User Analytics
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             {/* Right Section - Login/Logout */}
//             <div className="desktop-only" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//               {isLoggedIn ? (
//                 <button style={styles.button} onClick={handleLogout}>Logout</button>
//               ) : (
//                 <>
//                   <button style={styles.textButton} onClick={() => navigate('/signin')}>Sign in</button>
//                   <button
//                     style={{
//                       ...styles.button,
//                       backgroundColor: 'white',
//                       color: 'black',
//                       appearance: 'none',
//                       WebkitAppearance: 'none'
//                     }}
//                     onClick={() => navigate('/signup')}
//                   >
//                     Sign up
//                   </button>
//                 </>
//               )}
//             </div>
//             {/* Mobile Menu removed as per instructions (dark/light mode and hamburger menu hidden) */}
//           </div>
//         </div>
//       </header>
//       {/* Drawer replacement for Mobile Menu remains, though it is no longer triggered */}
//       {open && (
//         <div style={styles.drawerOverlay} onClick={toggleDrawer(false)}>
//           <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
//             <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
//               <button style={styles.closeButton} onClick={toggleDrawer(false)}>×</button>
//             </div>
//             <div style={{ display: 'flex', flexDirection: 'column' }}>
//               <div style={styles.drawerMenuItem} onClick={() => { navigate('/home'); setOpen(false); }}>
//                 Home
//               </div>
//               <div style={styles.drawerMenuItem} onClick={() => { navigate('/bookmarks'); setOpen(false); }}>
//                 Bookmarks
//               </div>
//               <div style={styles.drawerMenuItem} onClick={() => { navigate('/added'); setOpen(false); }}>
//                 Added Pages
//               </div>
//               <div style={styles.drawerMenuItem} onClick={() => { navigate('/report'); setOpen(false); }}>
//                 Report Builder
//               </div>
//               <div style={styles.drawerMenuItem} onClick={() => { navigate('/chat'); setOpen(false); }}>
//                 Chatbot
//               </div>
//               <div style={styles.drawerMenuItem} onClick={() => { navigate('/dashboard'); setOpen(false); }}>
//                 Dashboard
//               </div>
//               <hr style={styles.divider} />
//               {isLoggedIn ? (
//                 <div style={styles.drawerMenuItem}>
//                   <button style={styles.button} onClick={handleLogout}>Logout</button>
//                 </div>
//               ) : (
//                 <>
//                   <div style={styles.drawerMenuItem}>
//                     <button style={styles.textButton} onClick={() => { navigate('/signin'); setOpen(false); }}>
//                       Sign in
//                     </button>
//                   </div>
//                   <div style={styles.drawerMenuItem}>
//                     <button
//                       style={{
//                         ...styles.button,
//                         backgroundColor: 'white',
//                         color: 'black',
//                         appearance: 'none',
//                         WebkitAppearance: 'none'
//                       }}
//                       onClick={() => { navigate('/signup'); setOpen(false); }}
//                     >
//                       Sign up
//                     </button>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
