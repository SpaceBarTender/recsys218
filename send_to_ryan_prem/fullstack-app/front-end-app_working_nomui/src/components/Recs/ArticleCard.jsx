import React from 'react';
import bookmarkIcon from '../../../public/images/bookmark-icon.png';
import { removeAddedPage, removeBookmark, addBookmark, addPage } from '../../api.js';

// Helper function to format the publication date.
const getFormattedDate = (dateString) => {
  if (!dateString) return "July 14, 2021"; // fallback default
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/*
  ArticleCard Component:
  
  Props:
    - article: an object containing article details (e.g., url, url_id, title, description, publicationDate)
    - onCardClick: function to be called when the card is clicked (e.g., to log interaction and open the article)
    - isAdded: boolean flag indicating if the article has been added
    - isBookmarked: boolean flag indicating if the article is bookmarked
    - onStateChange: callback function when add/bookmark state changes, receives (type: 'add'|'bookmark', newState: boolean)
*/
const ArticleCard = ({
  article,
  onCardClick,
  isAdded,
  isBookmarked,
  onStateChange
}) => {
  // Internal handlers for add/remove actions
  const handleAdd = async () => {
    try {
      const sessionToken = localStorage.getItem("session_token");
      if (isAdded) {
        await removeAddedPage(sessionToken, article.url_id);
      } else {
        await addPage(sessionToken, { url_id: article.url_id });
      }
      // Notify parent of state change
      if (onStateChange) {
        onStateChange('add', !isAdded);
      }
    } catch (err) {
      console.error("[ERROR] Failed to handle add/remove:", err);
    }
  };

  const handleBookmark = async () => {
    try {
      const sessionToken = localStorage.getItem("session_token");
      if (isBookmarked) {
        await removeBookmark(sessionToken, article.url_id);
      } else {
        await addBookmark(sessionToken, { url_id: article.url_id });
      }
      // Notify parent of state change
      if (onStateChange) {
        onStateChange('bookmark', !isBookmarked);
      }
    } catch (err) {
      console.error("[ERROR] Failed to handle bookmark:", err);
    }
  };

  // Container style for this card's column wrapper
  const containerStyle = {
    flex: '0 0 calc(33.33% - 16px)',
    boxSizing: 'border-box',
  };

  // Card style (dark mode theme)
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#333',
    cursor: article.url ? 'pointer' : 'default',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  // Content area style
  const contentStyle = {
    flexGrow: 1,
    padding: '16px 16px 8px 16px',
  };

  // Title style
  const titleStyle = {
    marginTop: 0,
    marginBottom: '8px',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: "'Helvetica Neue', sans-serif",
  };

  // Description style
  const descriptionStyle = {
    color: '#ccc',
    marginTop: 0,
  };

  // Action buttons container style
  const actionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 16px 8px 16px',
  };

  // Button style common to action buttons with a consistent square shape and rounded edges
  const buttonStyle = {
    border: '1px solid white',
    background: 'none',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Publication date container style
  const footerStyle = {
    padding: '0 16px 8px 16px',
  };

  // Publication date text style
  const pubDateStyle = {
    color: '#ccc',
    fontSize: '0.8em',
  };

  return (
    <div style={containerStyle}>
      <div
        style={cardStyle}
        onClick={() => {
          if (article.url && onCardClick) {
            onCardClick(article);
          }
        }}
      >
        <div style={contentStyle}>
          <h6 style={titleStyle}>{article.title}</h6>
          <p style={descriptionStyle}>{article.description}</p>
        </div>
        <div style={actionsStyle}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
            style={buttonStyle}
          >
            <span style={{ color: isAdded ? "red" : "white", fontSize: "20px" }}>
              {isAdded ? "−" : "＋"}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark();
            }}
            style={{ ...buttonStyle, background: "white" }}
          >
            {isBookmarked ? (
              <span style={{ color: "red", fontSize: "20px" }}>−</span>
            ) : (
              <img
                src={bookmarkIcon}
                alt="Bookmark"
                style={{ width: "20px", height: "20px" }}
              />
            )}
          </button>
        </div>
        <div style={footerStyle}>
          <span style={pubDateStyle}>
            {getFormattedDate(article.publicationDate || article.publication_date)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;