import React, { useState, useEffect } from "react";
import { fetchBookmarks, logInteraction, fetchAddedPages } from "../../api";
import ArticleCard from "../Recs/ArticleCard";

function BookmarksPage({ refresh, onBookmarkChange }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addArticles, setAddArticles] = useState({});
  const [bookmarks, setBookmarks] = useState({});

  // Fetch bookmarks and added pages from server
  const fetchData = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem("session_token");
      
      // Fetch both bookmarks and added pages in parallel
      const [bookmarksResponse, addedPagesResponse] = await Promise.all([
        fetchBookmarks(sessionToken),
        fetchAddedPages(sessionToken)
      ]);

      console.log("[DEBUG] Fetched bookmarks:", bookmarksResponse.bookmarks);
      console.log("[DEBUG] Fetched added pages:", addedPagesResponse.added_pages);

      // Create set for quick lookup of added pages
      const addedUrls = new Set(addedPagesResponse.added_pages.map(p => p.url_id));

      // Add is_added flag to each bookmark
      const pagesWithStatus = bookmarksResponse.bookmarks.map(page => ({
        ...page,
        is_bookmarked: true, // These are all bookmarked pages
        is_added: addedUrls.has(page.url_id)
      }));

      setPages(pagesWithStatus);
      initializePreferences(pagesWithStatus);
    } catch (err) {
      console.error("[ERROR] Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  // Initialize local preferences from fetched pages
  const initializePreferences = (pagesList) => {
    // Initialize add state based on pages' is_added flag
    const initialAddState = pagesList.reduce((acc, page) => {
      acc[page.url_id] = page.is_added || false;
      return acc;
    }, {});
    setAddArticles(initialAddState);
    
    // Initialize bookmarks state based on pages' is_bookmarked flag
    const initialBookmarks = pagesList.reduce((acc, page) => {
      acc[page.url_id] = page.is_bookmarked || false;
      return acc;
    }, {});
    setBookmarks(initialBookmarks);
  };

  // Handle state changes from ArticleCard
  const handleStateChange = (page, type, newState) => {
    console.log("[DEBUG] State change:", { type, newState, page });
    if (type === 'add') {
      setAddArticles(prev => ({ ...prev, [page.url_id]: newState }));
    } else if (type === 'bookmark') {
      setBookmarks(prev => ({ ...prev, [page.url_id]: newState }));
      if (!newState) {
        // Remove from list if unbookmarked
        setPages(prev => prev.filter(p => p.url_id !== page.url_id));
      }
      if (onBookmarkChange) onBookmarkChange();
    }
  };

  // Log click interactions and open the URL
  const handleInteraction = async (type, page) => {
    try {
      const sessionToken = localStorage.getItem("session_token");
      await logInteraction(sessionToken, {
        interaction_type: type,
        url_id: page.url_id,
      });
    } catch (err) {
      console.error(`[ERROR] Failed to log ${type} interaction for page:`, err);
    }
  };

  // Group pages by journal_series_id (fallback to url_id)
  const groupedPages = pages.reduce((groups, page) => {
    const groupKey = page.journal_series_id || page.url_id;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(page);
    return groups;
  }, {});

  // Sort each group by publication date descending
  const groupsArray = Object.values(groupedPages).map((group) =>
    group.sort(
      (a, b) => new Date(b.publication_date) - new Date(a.publication_date)
    )
  );

  return (
    <div style={{ marginTop: "95px", padding: "16px 16px" }}>
      {loading ? (
        <div style={{
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 2s linear infinite",
        }} />
      ) : (
        groupsArray.map((group, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "32px",
              borderBottom: idx !== groupsArray.length - 1 ? "1px solid #ccc" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                paddingBottom: "16px",
              }}
            >
              {group.map((page) => (
                <ArticleCard
                  key={page.url_id}
                  article={page}
                  onCardClick={(article) => {
                    if (article.url) {
                      handleInteraction("click", article);
                      window.open(article.url, "_blank");
                    }
                  }}
                  isAdded={!!addArticles[page.url_id]}
                  isBookmarked={!!bookmarks[page.url_id]}
                  onStateChange={(type, newState) => handleStateChange(page, type, newState)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default BookmarksPage;