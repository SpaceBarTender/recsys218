import React, { useState, useMemo } from 'react';
import AppAppBar from './AppAppBar.jsx';
import Footer from './Footer.jsx';
import DynamicFilter from './DynamicFilter.jsx';
import Latest from './Latest.jsx';

export default function HomePageRecs(props) {
  const [topicsFilter, setTopicsFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState([]);
  const [articleFilter, setArticleFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApplyFilters = (newTopics, newDates, newArticles) => {
    console.log('[TEST] handleApplyFilters in HomePageRecs triggered:', newTopics, newDates, newArticles);
    setTopicsFilter(newTopics);
    setDateFilter(newDates);
    setArticleFilter(newArticles);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    console.log('[TEST] handleClearFilters in HomePageRecs triggered');
    setTopicsFilter([]);
    setDateFilter([]);
    setArticleFilter([]);
    setCurrentPage(1);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const memoTopicsFilter = useMemo(() => topicsFilter, [topicsFilter]);
  const memoDateFilter = useMemo(() => dateFilter, [dateFilter]);
  const memoArticleFilter = useMemo(() => articleFilter, [articleFilter]);

  return (
    <>
      <AppAppBar />
      <div
        id="main-container"
        style={{
          maxWidth: '1200px',
          margin: '32px auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}
      >
        <div id="filter-section">
          <DynamicFilter
            finalTopics={topicsFilter}
            finalDates={dateFilter}
            finalArticles={articleFilter}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
          />
        </div>
        <div id="latest-section">
          <Latest
            selectedTopics={memoTopicsFilter}
            selectedDates={memoDateFilter}
            selectedArticles={memoArticleFilter}
            currentPage={currentPage}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
