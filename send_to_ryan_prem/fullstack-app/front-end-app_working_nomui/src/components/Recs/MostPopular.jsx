import React, { useState, useEffect } from 'react';
// Removed Material UI imports. Replacing <Box> and <Typography> with standard HTML elements and inline styles.
import { Link } from 'react-router-dom';

import { fetchArticles } from '../../../../api'; // Import your unified fetch function

const MostPopular = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopRecommendations() {
      try {
        const sessionToken = localStorage.getItem('session_token');
        if (!sessionToken) {
          console.error("No session token found.");
          return;
        }
        // We'll request the first 10 MAB-ranked articles:
        const response = await fetchArticles(sessionToken, {
          endpoint: 'recommendations',
          offset: 0,
          limit: 10,
          topics: [],    // No filters => entire set
          dateMin: null, // No date filter
        });

        if (response?.recommendations) {
          setRecommendations(response.recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTopRecommendations();
  }, []);

  const top10 = recommendations; // We've already limited to 10 in fetch, but you could slice again if desired

  // Inline styles to mimic Material UI's layout and typography:
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px', // Approximation for MUI gap={4} (4 * 8px)
    padding: '16px'
  };

  const headingStyle = {
    fontSize: '2rem',      // Mimics Typography variant "h1"
    fontWeight: 'bold',
    marginBottom: '16px',  // Mimics gutterBottom spacing
  };

  const recContainerStyle = {
    marginBottom: '16px',  // Mimics Box marginBottom: 2 (2 * 8px)
  };

  const titleStyle = {
    fontSize: '1.5rem',    // Mimics Typography variant "h6"
    margin: 0,
  };

  const descriptionStyle = {
    fontSize: '0.875rem',  // Mimics Typography variant "body2"
    color: '#6e6e6e',      // Typical secondary text color
    margin: 0,
  };

  const linkContainerStyle = {
    marginTop: '32px',    // Mimics Box marginTop: 4 (4 * 8px)
  };

  return (
    <div style={containerStyle}>
      {/* Replacing Material UI Typography for the main heading */}
      <h1 style={headingStyle}>Recommended Articles</h1>

      {loading ? (
        // Replacing Material UI Typography with a simple paragraph for loading state
        <p>Loading recommendations...</p>
      ) : recommendations.length === 0 ? (
        <p>No recommendations available.</p>
      ) : (
        <>
          {/* Show up to 10 recommendations */}
          <div>
            {top10.map((rec) => (
              <div key={rec.url_id} style={recContainerStyle}>
                {/* Replacing Typography variant "h6" with an h3 element */}
                <h3 style={titleStyle}>{rec.title}</h3>
                {/* Replacing Typography variant "body2" with a paragraph */}
                <p style={descriptionStyle}>{rec.description}</p>
              </div>
            ))}
          </div>

          {/* Replacing Material UI Box for the link container */}
          <div style={linkContainerStyle}>
            <Link to="/latest/1">Browse All Latest Articles &raquo;</Link>
          </div>
        </>
      )}
    </div>
  );
};

export default MostPopular;
