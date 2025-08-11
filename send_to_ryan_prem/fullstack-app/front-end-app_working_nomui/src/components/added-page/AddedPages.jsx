import React, { useState, useEffect } from "react";
import { fetchAddedPages, logInteraction, fetchBookmarks } from "../../api.js";
import ArticleCard from "../Recs/ArticleCard";

function AddedPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addArticles, setAddArticle] = useState({});
  const [bookmarks, setBookmarks] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const sessionToken = localStorage.getItem("session_token");
        
        // Fetch both added pages and bookmarks in parallel
        const [pagesResponse, bookmarksResponse] = await Promise.all([
          fetchAddedPages(sessionToken),
          fetchBookmarks(sessionToken)
        ]);

        console.log("[DEBUG] Fetched added pages:", pagesResponse.added_pages);
        console.log("[DEBUG] Fetched bookmarks:", bookmarksResponse.bookmarks);

        // Create sets for quick lookup
        const bookmarkedUrls = new Set(bookmarksResponse.bookmarks.map(b => b.url_id));
        
        // Add is_bookmarked flag to each page
        const pagesWithStatus = pagesResponse.added_pages.map(page => ({
          ...page,
          is_bookmarked: bookmarkedUrls.has(page.url_id),
          is_added: true // These are all added pages
        }));

        setPages(pagesWithStatus);
        initializePreferences(pagesWithStatus);
      } catch (err) {
        console.error("[ERROR] Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize local preferences from fetched pages
  const initializePreferences = (pagesList) => {
    // Initialize add state based on pages' is_added flag
    const initialAddState = pagesList.reduce((acc, page) => {
      acc[page.url_id] = page.is_added || false;
      return acc;
    }, {});
    setAddArticle(initialAddState);
    
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
      setAddArticle(prev => ({ ...prev, [page.url_id]: newState }));
      if (!newState) {
        // Remove from list if un-added
        setPages(prev => prev.filter(p => p.url_id !== page.url_id));
      }
    } else if (type === 'bookmark') {
      setBookmarks(prev => ({ ...prev, [page.url_id]: newState }));
    }
  };

  // Generic interaction handler (for click interactions, etc.)
  const handleInteraction = async (type, page) => {
    try {
      const sessionToken = localStorage.getItem("session_token");
      const payload = { interaction_type: type, url_id: page.url_id };
      await logInteraction(sessionToken, payload);
      console.log("[DEBUG] Interaction logged:", { type, page });
    } catch (err) {
      console.error(`[ERROR] Failed to log ${type} interaction for page:`, err);
    }
  };

  return (
    <div style={{ width: '100%', marginBottom: '32px' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <h4 style={{
        marginBottom: '32px',
        fontWeight: 'bold',
        fontSize: '32px',
        textAlign: 'left'
      }}>
        Added Pages
      </h4>

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '64px'
        }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : pages.length === 0 ? (
        <p>No added pages available.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '32px',
          width: '100%',
          marginBottom: '32px'
        }}>
          {pages.map((page, index) => (
            <div key={`${page.url_id}-${index}`}>
              <ArticleCard
                article={page}
                onCardClick={(article) => {
                  if (article.url) {
                    handleInteraction('click', article);
                    window.open(article.url, '_blank');
                  }
                }}
                isAdded={true}
                isBookmarked={!!bookmarks[page.url_id]}
                onStateChange={(type, newState) => handleStateChange(page, type, newState)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddedPages;