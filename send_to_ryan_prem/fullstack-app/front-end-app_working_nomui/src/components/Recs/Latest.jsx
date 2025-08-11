import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bookmarkIcon from "../../../public/images/bookmark-icon.png";
import ArticleCard from './ArticleCard';

// NOTE: Removed all Material UI imports. The following comments explain the custom self-contained replacements:
//
// Instead of Material UI's Box, we use a standard <div> with inline styles for layout and spacing.
// Instead of Grid, we create a <div> with CSS flexbox properties to mimic the layout behavior.
// Instead of Typography, we use semantic HTML elements like <h4>, <h6>, <p>, and <span> styled inline.
// Instead of Pagination, we build a custom pagination component with standard HTML buttons.
// Instead of IconButton, we use a simple <button> with custom inline styles.
// Instead of Card, CardContent, and CardActions, we use <div> elements with inline styles for a similar card layout.
// Instead of CircularProgress, we implement a custom CSS spinner using a <div> with inline styles.
//
// For icons (Bookmark, AddIcon), we substitute them with inline text or Unicode symbols.

import {
  fetchRecommendations,
  logInteraction,
  addPage,      // API function for adding a page to added_pages
  addBookmark,  // API function for adding a bookmark
  fetchBookmarks,
  fetchAddedPages,
  fetchFilteredArticles,
} from "../../api.js";

function Latest({ selectedTopics = [], selectedDates = [], selectedArticles = [], currentPage = 1 }) {
  const navigate = useNavigate();

  // Local states
  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // For user preferences on each article (added state and bookmarks)
  const [addArticles, setAddArticle] = useState({});
  const [bookmarks, setBookmarks] = useState({});

  // Constants
  const pageLimit = 20;
  const totalPages = Math.ceil(totalCount / pageLimit);

  // Custom spinner style (ensure to add keyframes for "spin" in your CSS)
  const spinnerStyle = {
    width: "40px",
    height: "40px",
    border: "4px solid #ccc",
    borderTop: "4px solid #333",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  };

  // New Pagination styles — styled more like industry standards.
  const paginationContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    marginTop: "24px"
  };

  const pageButtonStyle = {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#646cff",
    padding: "8px 12px",
    margin: "0 4px",
    backgroundColor: "#333",
    cursor: "pointer",
    fontSize: "14px",
    color: "#fff",
    borderRadius: "4px",
    transition: "background-color 0.3s ease, border-color 0.3s ease"
  };

  const activePageButtonStyle = {
    ...pageButtonStyle,
    backgroundColor: "#646cff",
    color: "#fff",
    borderColor: "#646cff",
    fontWeight: "bold"
  };

  const disabledButtonStyle = {
    ...pageButtonStyle,
    cursor: "not-allowed",
    opacity: 0.5,
    backgroundColor: "#222",
    borderColor: "#646cff",
    color: "#666"
  };

  // Pagination helper: creates a range of page numbers and ellipsis if needed.
  const getPaginationRange = () => {
      const siblingCount = 4; // number of pages to show on each side of the current page
    const totalPageNumbers = siblingCount * 2 + 5; // first, last, current, two siblings and two ellipsis

    if (totalPages <= totalPageNumbers) {
      return [...Array(totalPages).keys()].map((i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    const range = [];
    // Always include first page.
    range.push(1);

    if (showLeftEllipsis) {
      range.push("left-ellipsis");
    }

    const startPage = showLeftEllipsis ? leftSiblingIndex : 2;
    const endPage = showRightEllipsis ? rightSiblingIndex : totalPages - 1;

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    if (showRightEllipsis) {
      range.push("right-ellipsis");
    }

    // Always include last page.
    range.push(totalPages);

    return range;
  };

  const paginationRange = getPaginationRange();

  // New state for storing full fetched recommendations
  const [initialRecs, setInitialRecs] = useState([]);

  // Handle filter changes
  const handleApplyFilters = (topics, dates) => {
    console.log("[DEBUG] Applying filters:", { topics, dates });
    navigate('/latest/1');
  };

  const handleClearFilters = () => {
    console.log("[DEBUG] Clearing filters");
    navigate('/latest/1');
  };

  // ─────────────────────────────────────────────────────────────────
  //  Fetch articles from Recommendations endpoint only once per page refresh
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[DEBUG] Fetching recommendations for page:", currentPage);
    const fetchPageArticles = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * pageLimit;
        const sessionToken = localStorage.getItem("session_token");

        // Pass the filters to the server
        const recommendationsCall = fetchRecommendations(sessionToken, {
          topics: selectedTopics,
          date_min: selectedDates.length > 0 ? selectedDates[0] : null,
          articles: selectedArticles,
          offset,
          limit: pageLimit
        });

        // Fetch recommendations, bookmarks, and added pages in parallel
        const [recommendationsResponse, bookmarksResponse, addedPagesResponse] = await Promise.all([
          recommendationsCall,
          fetchBookmarks(sessionToken),
          fetchAddedPages(sessionToken)
        ]);

        console.log("[DEBUG] Articles fetched from recommendations:", recommendationsResponse.recommendations);
        console.log("[DEBUG] Bookmarks fetched:", bookmarksResponse.bookmarks);
        console.log("[DEBUG] Added pages fetched:", addedPagesResponse.added_pages);

        if (recommendationsResponse?.recommendations) {
          const bookmarkedUrls = new Set(bookmarksResponse.bookmarks.map(b => b.url_id));
          const addedUrls = new Set(addedPagesResponse.added_pages.map(p => p.url_id));
          const recommendationsWithStatus = recommendationsResponse.recommendations.map(article => ({
            ...article,
            is_bookmarked: bookmarkedUrls.has(article.url_id),
            is_added: addedUrls.has(article.url_id)
          }));

          setInitialRecs(recommendationsWithStatus);
          setArticles(recommendationsWithStatus);
          setTotalCount(Number(recommendationsResponse.total_count) || recommendationsWithStatus.length);
          initializePreferences(recommendationsWithStatus);
        } else {
          setArticles([]);
          setTotalCount(0);
          console.warn("[WARN] No recommendations available from fetch.");
        }
      } catch (err) {
        console.error("[ERROR] Error fetching MAB recommendations:", err);
      } finally {
        setLoading(false);
        console.log("[DEBUG] Finished fetchPageArticles.");
      }
    };

    fetchPageArticles();
  }, [currentPage, JSON.stringify(selectedTopics), JSON.stringify(selectedDates), JSON.stringify(selectedArticles)]);

  // Initialize local preferences from fetched articles
  const initializePreferences = (articlesList) => {
    // Initialize add state based on articles' is_added flag
    const initialAddState = articlesList.reduce((acc, article) => {
      acc[article.url_id] = article.is_added || false;
      return acc;
    }, {});
    setAddArticle(initialAddState);
    
    // Initialize bookmarks state based on articles' is_bookmarked flag
    const initialBookmarks = articlesList.reduce((acc, article) => {
      acc[article.url_id] = article.is_bookmarked || false;
      return acc;
    }, {});
    setBookmarks(initialBookmarks);
  };

  // Handle page change using custom pagination buttons
  const handlePageChange = (page) => {
    navigate(`/latest/${page}`);
  };

  // Handler for adding an article to the added_pages table.
  const handleAdd = async (article) => {
    console.log("[DEBUG] Handling add for article:", article);
    try {
      const sessionToken = localStorage.getItem("session_token");
      const response = await addPage(sessionToken, { url_id: article.url_id });
      console.log("[DEBUG] Page added successfully:", response);
      setAddArticle((prev) => ({ ...prev, [article.url_id]: true }));
    } catch (err) {
      console.error("[ERROR] Failed to add article:", err);
    }
  };

  // Handler for adding a bookmark.
  const handleBookmark = async (article) => {
    console.log("[DEBUG] Handling bookmark for article:", article);
    try {
      const sessionToken = localStorage.getItem("session_token");
      const response = await addBookmark(sessionToken, { url_id: article.url_id });
      console.log("[DEBUG] Bookmark added successfully:", response);
      setBookmarks((prev) => ({ ...prev, [article.url_id]: true }));
    } catch (err) {
      console.error("[ERROR] Failed to add bookmark:", err);
    }
  };

  // Handle click interactions (other interactions like clicks can still use logInteraction)
  const handleInteraction = async (type, article) => {
    console.log("[DEBUG] Handling interaction:", { type, article });
    try {
      const sessionToken = localStorage.getItem("session_token");
      console.log("[DEBUG] Session token for interaction:", sessionToken);

      if (!article || !article.url_id) {
        console.error("[ERROR] Invalid article object for interaction:", article);
        return;
      }

      const payload = { interaction_type: type, url_id: article.url_id };
      const interactionResponse = await logInteraction(sessionToken, payload);
      console.log("[DEBUG] Interaction logged successfully:", interactionResponse);
    } catch (err) {
      console.error(`[ERROR] Failed to log ${type} interaction for article:`, err);
    }
  };

  // Handler for state changes from ArticleCard
  const handleStateChange = (type, newState, article) => {
    console.log("[DEBUG] Handling state change:", { type, newState, article });
    if (type === 'add') {
      setAddArticle(prev => ({ ...prev, [article.url_id]: newState }));
    } else if (type === 'bookmark') {
      setBookmarks(prev => ({ ...prev, [article.url_id]: newState }));
    }
  };

  return (
    <div>
      <h4 style={{ marginBottom: "32px", fontSize: "32px", fontWeight: "bold" }}>
        Recommended Articles
      </h4>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
          <div style={spinnerStyle}></div>
        </div>
      ) : articles.length === 0 ? (
        <p>No recommendations available.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {articles.map((article, index) => (
              <ArticleCard
                key={`${article.url_id}-${index}`}
                article={article}
                onCardClick={(a) => {
                  handleInteraction("click", a);
                  window.open(a.url, "_blank");
                }}
                onStateChange={(type, newState) => handleStateChange(type, newState, article)}
                isAdded={!!addArticles[article.url_id]}
                isBookmarked={!!bookmarks[article.url_id]}
              />
            ))}
          </div>

          {/* Updated Pagination: Industry-standard with Prev/Next, dynamic page numbers, and ellipsis */}
          {totalPages > 1 && (
            <div style={paginationContainerStyle}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={currentPage === 1 ? disabledButtonStyle : pageButtonStyle}
              >
                Prev
              </button>
              {paginationRange.map((page) => {
                if (page === "left-ellipsis" || page === "right-ellipsis") {
                  return (
                    <span key={`ellipsis-${page}`} style={{ padding: "8px 12px" }}>
                      …
                    </span>
                  );
                }
                return (
                  <button
                    key={`page-${page}`}
                    onClick={() => handlePageChange(page)}
                    style={currentPage === page ? activePageButtonStyle : pageButtonStyle}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={currentPage === totalPages ? disabledButtonStyle : pageButtonStyle}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Latest;