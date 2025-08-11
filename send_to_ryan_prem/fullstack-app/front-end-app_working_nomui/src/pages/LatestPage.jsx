import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
// Removed Material UI components (CssBaseline, Container, Box)
// and replaced them with plain HTML elements with inline styles.
import AppAppBar from '../components/Recs/AppAppBar.jsx';
import DynamicFilter from '../components/Recs/DynamicFilter.jsx';
import Latest from '../components/Recs/Latest.jsx';
import Footer from '../components/Recs/Footer.jsx';

const LatestPage = (props) => {
  // Initialize searchParams from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTopics = searchParams.get('topics') ? JSON.parse(decodeURIComponent(searchParams.get('topics'))) : [];
  const initialDates = searchParams.get('dates') ? JSON.parse(decodeURIComponent(searchParams.get('dates'))) : [];
  const initialArticles = searchParams.get('articles') ? JSON.parse(decodeURIComponent(searchParams.get('articles'))) : [];

  // Parent states for final filters initialized from URL parameters if available
  const [topicsFilter, setTopicsFilter] = useState(initialTopics);
  const [dateFilter, setDateFilter] = useState(initialDates);
  const [articleFilter, setArticleFilter] = useState(initialArticles);

  // For pagination
  const { page } = useParams();
  const currentPage = page ? Number(page) : 1;

  // For navigation
  const navigate = useNavigate();

  /**
   * Called by the child when user clicks "Apply Filter."
   * We update the parent's final filter states, update the URL, then go to page 1.
   */
  const handleApplyFilters = (newTopics, newDates, newArticles) => {
    setTopicsFilter(newTopics);
    setDateFilter(newDates);
    setArticleFilter(newArticles);
    setSearchParams({
      topics: encodeURIComponent(JSON.stringify(newTopics)),
      dates: encodeURIComponent(JSON.stringify(newDates)),
      articles: encodeURIComponent(JSON.stringify(newArticles))
    });
    navigate('/latest/1');
  };

  /**
   * Called by the child when user clicks "Clear Filters."
   * We reset the parent's final filters, clear the URL parameters, then go to page 1.
   */
  const handleClearFilters = () => {
    setTopicsFilter([]);
    setDateFilter([]);
    setArticleFilter([]);
    setSearchParams({}); // clear query parameters
    navigate('/latest/1');
  };

  // Mimic Material UI's CssBaseline for basic CSS reset
  const baselineStyle = {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  };

  // Mimic Material UI's Box root container styling:
  // display flex, column direction, full viewport height
  const rootContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  };

  // Mimic Material UI's Container styling:
  // max width, automatic horizontal centering, vertical spacing and gap
  const mainContainerStyle = {
    maxWidth: '1200px', // Approximation for maxWidth="lg"
    width: '100%',
    margin: '32px auto', // my: 4 (~32px top & bottom margin)
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '32px', // gap: 4 (assuming 8px per spacing unit -> 32px)
  };

  return (
    <>
      {/* Custom CssBaseline Replacement */}
      <div style={baselineStyle} />
      {/* Root container replacement for Material UI's Box */}
      <div style={rootContainerStyle}>
        {/* Top Navbar Replacement */}
        <AppAppBar />
        {/* Main Content Replacement for Material UI's Container */}
        <main style={mainContainerStyle}>
          {/* Filter Section Replacement */}
          <div>
            <DynamicFilter
              finalTopics={topicsFilter}
              finalDates={dateFilter}
              finalArticles={articleFilter}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />
          </div>
          {/* Articles Section Replacement */}
          <div>
            <Latest
              selectedTopics={topicsFilter}
              selectedDates={dateFilter}
              selectedArticles={articleFilter}
              currentPage={currentPage}
            />
          </div>
        </main>
        {/* Footer Replacement */}
        <Footer />
      </div>
    </>
  );
};

export default LatestPage;

