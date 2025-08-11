import React, { useState, useEffect } from 'react';
// Removed Material UI components (CssBaseline, Container, Box) and AppTheme in order to eliminate Material UI dependencies.
// Instead, we now use plain HTML elements with inline styles to mimic the original layout and spacing.

import AppAppBar from '../components/Recs/AppAppBar.jsx';
import BookmarksPage from '../components/bookmarks-page/BookmarksPage.jsx';
import Footer from '../components/Recs/Footer.jsx';
import BookmarkCandidatesWidget from '../components/bookmarks-page/BookmarkCandidatesWidget.jsx';
import { fetchBookmarkCandidates } from '../api';

const BookmarksParentPage = (props) => {
  const [candidateWidgetOpen, setCandidateWidgetOpen] = useState(false);
  const [candidateCount, setCandidateCount] = useState(0);
  const [refresh, setRefresh] = useState(0);

  // Fetch candidate count on mount (or on an interval)
  useEffect(() => {
    const fetchCandidateCount = async () => {
      try {
        const sessionToken = localStorage.getItem("session_token");
        const response = await fetchBookmarkCandidates(sessionToken);
        const count = response.bookmark_candidates ? response.bookmark_candidates.length : 0;
        setCandidateCount(count);
      } catch (err) {
        console.error("Failed to fetch candidate count", err);
      }
    };
    fetchCandidateCount();
  }, []);

  const handleCandidateConfirm = async () => {
    // Re-fetch candidate count without closing the widget
    try {
      const sessionToken = localStorage.getItem("session_token");
      const response = await fetchBookmarkCandidates(sessionToken);
      const count = response.bookmark_candidates ? response.bookmark_candidates.length : 0;
      setCandidateCount(count);
    } catch (err) {
      console.error("Failed to refresh candidate count", err);
    }
    // Trigger a refresh in BookmarksPage so the newly added bookmark appears
    setRefresh(prev => prev + 1);
  };

  // Whenever the widget is opened, refresh the candidate count.
  useEffect(() => {
    if (candidateWidgetOpen) {
      const refreshCount = async () => {
        try {
          const sessionToken = localStorage.getItem("session_token");
          const response = await fetchBookmarkCandidates(sessionToken);
          const count = response.bookmark_candidates ? response.bookmark_candidates.length : 0;
          setCandidateCount(count);
        } catch (err) {
          console.error("Failed to refresh candidate count on open", err);
        }
      };
      refreshCount();
    }
  }, [candidateWidgetOpen]);

  // New function: refresh the candidate count from the API.
  const refreshCandidateCount = async () => {
    try {
      const sessionToken = localStorage.getItem("session_token");
      const response = await fetchBookmarkCandidates(sessionToken);
      const count = response.bookmark_candidates ? response.bookmark_candidates.length : 0;
      setCandidateCount(count);
    } catch (err) {
      console.error("Failed to refresh candidate count", err);
    }
  };

  return (
    // Replacing AppTheme with a standard div.
    <div
      {...props}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Top Navbar */}
      <AppAppBar />

      {/* Tiny spacer below AppAppBar */}
      <div style={{ height: 0 }} />

      {/*
        Replaced Material UI Container with a plain <main> element.
        The styles mimic:
        - a max-width of approx. 1200px (equivalent to maxWidth="lg")
        - centered content with margin auto
        - vertical margins similar to 32px top and bottom
        - flexGrow: 1 behavior to fill available space
      */}
      <main
        style={{
          flexGrow: 1,
          margin: '32px auto',
          width: '100%',
          maxWidth: '1200px',
          padding: "16px",
        }}
      >
        {/* Header row: left aligned title and right aligned update button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "120px",
            marginBottom: "32px",
            marginLeft: "16px",
            marginRight: "16px",
          }}
        >
          <h1
            style={{
              fontWeight: "bold",
              fontSize: "32px",
              textAlign: "left",
              margin: 0,
            }}
          >
            Bookmarks
          </h1>
          <button
            style={{
              backgroundColor: "#424242",
              color: "#fff",
              border: "1px solid #fff",
              borderRadius: "4px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
            onClick={() => setCandidateWidgetOpen(true)}
          >
            Check for bookmark updates ({candidateCount})
          </button>
        </div>
        <BookmarkCandidatesWidget
          open={candidateWidgetOpen}
          candidateCount={candidateCount}
          onCandidateConfirm={handleCandidateConfirm}
          onClose={() => setCandidateWidgetOpen(false)}
        />

        <BookmarksPage refresh={refresh} onBookmarkChange={refreshCandidateCount} />
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default BookmarksParentPage;
