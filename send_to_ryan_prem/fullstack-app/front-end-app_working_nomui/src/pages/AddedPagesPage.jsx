// AddedPagesPage.jsx
import React from 'react';
import AppAppBar from '../components/Recs/AppAppBar.jsx';
import AddedPages from '../components/added-page/AddedPages.jsx'; // Your added pages component
import Footer from '../components/Recs/Footer.jsx';

// Removed dependency on AppTheme.jsx since global styles from index.css now handle the baseline and dark theme.

const AddedPagesPage = (props) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppAppBar />
      <main className="page-content">
        <div className="layout-wrapper">
          <AddedPages />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddedPagesPage;





// // AddedPagesPage.jsx
// import React from 'react';
// import AppTheme from '../components/shared-theme/AppTheme.jsx';
// import AppAppBar from '../components/Recs/AppAppBar.jsx';
// import AddedPages from '../components/added-page/AddedPages.jsx'; // Your added pages component
// import Footer from '../components/Recs/Footer.jsx';

// // Removed Material UI components (CssBaseline, Container, Box)
// // Replaced with plain HTML elements and inline styles to mimic the original layout and spacing.

// const AddedPagesPage = (props) => {
//   return (
//     <AppTheme {...props}>
//       {/* Simulated CssBaseline reset:
//           Applies basic reset styles to ensure consistent margins and padding. */}
//       <div style={{ margin: 0, padding: 0, boxSizing: 'border-box' }} />
      
//       {/* Replacing Box with a plain div to create a flex container that fills the viewport */}
//       <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
//         {/* Top Navbar remains the same */}
//         <AppAppBar />
        
//         {/* Replacing Material UI Container with a <main> element styled to mimic its aesthetics:
//             - maxWidth: '1200px' approximates maxWidth="lg"
//             - margin: '32px auto' creates vertical spacing and centers content horizontally
//             - flexGrow, display, flexDirection and gap mimic the layout properties */}
//         <main
//           style={{
//             maxWidth: '1200px',
//             width: '100%',
//             margin: '32px auto',
//             flexGrow: 1,
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '32px'
//           }}
//         >
//           <AddedPages />
//         </main>
        
//         {/* Footer remains unchanged */}
//         <Footer />
//       </div>
//     </AppTheme>
//   );
// };

// export default AddedPagesPage;
