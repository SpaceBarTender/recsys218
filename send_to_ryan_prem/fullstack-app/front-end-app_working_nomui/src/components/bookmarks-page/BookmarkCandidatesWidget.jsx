// src/components/bookmarks-page/BookmarkCandidatesWidget.jsx
import React, { useState, useEffect } from "react";
import ArticleCard from "../Recs/ArticleCard"; // Using ArticleCard from ../Recs/ArticleCard.jsx
// Removed Material UI imports and icon dependencies
import { fetchBookmarkCandidates, confirmBookmarkCandidate } from "../../api";

// Helper function to format a date string to "Month Day, Year"
const getFormattedDate = (dateStr) => {
  if (!dateStr) return "July 14, 2021";
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Custom Spinner component to mimic a CircularProgress
const Spinner = () => {
  const spinnerStyle = {
    width: "24px",
    height: "24px",
    border: "4px solid #333",
    borderTop: "4px solid #646cff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };
  return (
    <>
      {/* Keyframes for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinnerStyle}></div>
    </>
  );
};

const BookmarkCandidatesWidget = ({ open, onClose, onCandidateConfirm }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add local state to trigger slide–in animation on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // After the component mounts, set mounted to true so that the drawer slides in.
    setMounted(true);
  }, []);

  // Load candidates from the server
  const loadCandidates = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem("session_token");
      const response = await fetchBookmarkCandidates(sessionToken);
      console.log("[DEBUG] Bookmark candidates:", response.bookmark_candidates);
      setCandidates(response.bookmark_candidates || []);
    } catch (err) {
      console.error("[ERROR] Failed to fetch bookmark candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load candidates whenever the widget opens
  useEffect(() => {
    if (open) {
      loadCandidates();
    }
  }, [open]);

  // Confirm a candidate: call API and remove from local state
  const handleConfirm = async (candidate) => {
    try {
      const sessionToken = localStorage.getItem("session_token");
      // Server call to confirm the candidate (creating a new bookmark)
      await confirmBookmarkCandidate(sessionToken, {
        original_url_id: candidate.original_url_id,
        candidate_url_id: candidate.candidate_url_id,
      });
      // Remove the confirmed candidate from our list
      setCandidates((prev) =>
        prev.filter(
          (cand) => cand.candidate_url_id !== candidate.candidate_url_id
        )
      );
      // Notify parent component if needed
      if (onCandidateConfirm) {
        onCandidateConfirm();
      }
    } catch (err) {
      console.error("[ERROR] Failed to confirm candidate:", err);
    }
  };

  // If the widget is not open, do not render anything.
  if (!open) return null;

  // Inline styles to mimic component layout.

  // Backdrop covering the entire viewport
  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px",
    zIndex: 1000,
  };

  // Drawer style with a slide–in effect.
  const drawerStyle = {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    width: "100%",
    maxWidth: "400px",
    padding: "16px",
    boxShadow: "0px 0px 10px rgba(0,0,0,0.5)",
    maxHeight: "100vh",
    overflowY: "auto",
    transform: mounted ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s ease-out",
  };

  // Header styles
  const headerStyle = { marginBottom: "16px" };
  const headingStyle = { margin: 0, fontSize: "1.25rem", color: "#fff" };
  const subheadingStyle = {
    margin: "8px 0 0 0",
    fontSize: "0.875rem",
    color: "#888",
  };

  const spinnerContainerStyle = {
    display: "flex",
    justifyContent: "center",
    marginTop: "16px",
  };
  const noCandidatesStyle = { textAlign: "center", color: "#888" };

  // Container for candidate cards (using a column flex layout)
  const gridContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };

  // Card styles to mimic a basic card layout
  const cardContainerStyle = {
    border: "1px solid #333",
    borderRadius: "4px",
    backgroundColor: "#242424",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    overflow: "hidden",
  };
  const cardContentStyle = { padding: "16px" };
  const cardActionsStyle = {
    padding: "8px 16px",
    display: "flex",
    justifyContent: "flex-end",
    backgroundColor: "#1a1a1a",
  };

  const cardTitleStyle = { margin: "0 0 8px 0", fontSize: "1rem", color: "#fff" };
  const cardDescriptionStyle = {
    margin: "0 0 8px 0",
    fontSize: "0.875rem",
    color: "#888",
  };
  const cardDateStyle = { fontSize: "0.75rem", color: "#666" };

  // Styles for the icon button that confirms a candidate
  const iconButtonStyle = {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "4px",
  };
  const iconPlusStyle = {
    color: "#646cff",
    fontSize: "20px",
    fontWeight: "bold",
  };

  // Styles for the Done button at the bottom of the drawer
  const doneButtonContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px",
  };
  const doneButtonStyle = {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    border: "1px solid #646cff",
    borderRadius: "4px",
    padding: "8px 16px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    ':hover': {
      backgroundColor: "#646cff",
    }
  };

  return (
    // Backdrop overlay for the drawer
    <div style={backdropStyle} onClick={onClose}>
      {/* Prevent clicks within the drawer from closing it */}
      <div style={drawerStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header Section */}
        <div style={headerStyle}>
          <h3 style={headingStyle}>Potential Updates Found</h3>
          <p style={subheadingStyle}>
            Please review the potential updated versions below. Click the plus
            icon to add the candidate as a new bookmark card.
          </p>
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={spinnerContainerStyle}>
            <Spinner />
          </div>
        ) : candidates.length === 0 ? (
          <p style={noCandidatesStyle}>No updated articles found.</p>
        ) : (
          <div style={gridContainerStyle}>
            {candidates.map((candidate) => (
              <div key={candidate.candidate_url_id} style={cardContainerStyle}>
                <div style={cardContentStyle}>
                  <h4 style={cardTitleStyle}>{candidate.candidate_title}</h4>
                  <p style={cardDescriptionStyle}>
                    {candidate.candidate_description ||
                      "No description available"}
                  </p>
                  <small style={cardDateStyle}>
                    {getFormattedDate(candidate.candidate_publication_date)}
                  </small>
                </div>
                <div style={cardActionsStyle}>
                  {/* Confirm candidate: adds as bookmark and removes from the widget */}
                  <button
                    style={iconButtonStyle}
                    onClick={() => handleConfirm(candidate)}
                  >
                    <span style={iconPlusStyle}>+</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* "Done" Button */}
        <div style={doneButtonContainerStyle}>
          <button style={doneButtonStyle} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookmarkCandidatesWidget;