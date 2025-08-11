import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LatestPage from './pages/LatestPage.jsx';
import AddedPagesPage from './pages/AddedPagesPage.jsx';
import ReportBuilderPage from './pages/ReportBuilderPage.jsx';
import BookmarksParentPage from './pages/BookmarksParentPage.jsx';
import DashboardLayout from './pages/DashboardLayout.jsx';
import MainGrid from './components/dashboard/MainGrid.jsx';
import UserAnalytics from './components/dashboard/UserAnalytics.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/bookmarks" element={<BookmarksParentPage />} />
        <Route path="/added" element={<AddedPagesPage />} />
        {/* New route for Report Builder */}
        <Route path="/report" element={<ReportBuilderPage />} />
        {/* The new route for /latest/:page => The parent component handles layout */}
        <Route path="/latest/:page" element={<LatestPage />} />
        {/* Dashboard routes nested under /dashboard/* */}
        <Route path="/dashboard/*" element={<DashboardLayout />}>
          <Route index element={<MainGrid />} />
          <Route path="user-analytics" element={<UserAnalytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
