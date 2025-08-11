import React, { useState, useEffect } from 'react';
import { fetchTopics, fetchPublicationDates, fetchArticleTitles } from '../../api.js';

// Removed Material UI components and replaced them with self-contained equivalents

// StyledButton equivalent - mimics Material UI button styling with hover effects
function StyledButton({ onClick, disabled, children }) {
  const [hover, setHover] = useState(false);
  const style = {
    backgroundColor: disabled ? '#ddd' : (hover ? '#333' : '#000'),
    color: disabled ? '#666' : '#fff',
    border: '1px solid',
    borderColor: disabled ? '#ddd' : '#ccc',
    padding: '4px 8px', // approximates theme.spacing(0.5, 1)
    borderRadius: '4px', // mimics the theme's border radius
    fontSize: '12px', // mimics theme.typography.pxToRem(12)
    fontWeight: 500, // mimics theme.typography.fontWeightMedium
    cursor: disabled ? 'not-allowed' : 'pointer',
    textTransform: 'none',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}

// ChipContainer equivalent - a div container to hold chip elements with proper spacing
const chipContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px', // approximates theme.spacing(1)
  marginTop: '8px',
  transition: 'height 0.3s ease, opacity 0.3s ease',
  overflow: 'hidden',
  minHeight: '40px',
};

// AnimatedChip equivalent - mimics a chip with a slide-down animation effect
function AnimatedChip({ label, onDelete }) {
  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#424242', // Dark mode chip background
    borderRadius: '16px',
    padding: '0 8px',
    height: '24px',
    fontSize: '12px',
    color: '#fff',            // Ensure chip text is white
    animation: 'slideDown 0.3s ease-out',
  };
  const closeIconStyle = {
    marginLeft: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };
  return (
    <span style={chipStyle}>
      {label}
      <span style={closeIconStyle} onClick={onDelete}>
        x
      </span>
    </span>
  );
}

// AutocompleteInput is a custom component to replace MUI's Autocomplete.
// It renders an input field and shows suggestion options filtered from provided options.
function AutocompleteInput({ options, inputValue, onInputChange, onSelect, placeholder, selectedValues }) {
  // Filter out already selected options and those that do not match the current input (case-insensitive)
  const filteredOptions = options.filter(
    (option) =>
      !selectedValues.includes(option) &&
      option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const containerStyle = { position: 'relative' };
  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '14px',
    border: '1px solid #646cff',
    borderRadius: '4px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  };
  const suggestionsStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    border: '1px solid #646cff',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    maxHeight: '150px',
    overflowY: 'auto',
    zIndex: 1000,
  };
  const suggestionItemStyle = {
    padding: '6px 8px',
    cursor: 'pointer',
    color: '#fff',
    transition: 'background-color 0.3s ease',
    ':hover': {
      backgroundColor: '#646cff'
    }
  };

  // Track whether the input is focused
  const [focused, setFocused] = useState(false);

  return (
    <div style={containerStyle}>
      <input
        type="text"
        style={inputStyle}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          // Add a small delay to allow click events on suggestions to fire first
          setTimeout(() => {
            const relatedTarget = document.activeElement;
            if (!relatedTarget || !relatedTarget.closest('.suggestions-container')) {
              setFocused(false);
            }
          }, 100);
        }}
      />
      {focused && filteredOptions.length > 0 && (
        <div 
          className="suggestions-container" 
          style={suggestionsStyle}
          onMouseDown={(e) => {
            // Prevent the blur event from firing when clicking inside the dropdown
            e.preventDefault();
          }}
        >
          {filteredOptions.map((option) => (
            <div
              key={option}
              style={suggestionItemStyle}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                onSelect(option);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#646cff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DynamicFilter({ finalTopics = [], finalDates = [], finalArticles = [], onApplyFilters, onClearFilters }) {
  const [allTopics, setAllTopics] = useState([]);
  const [allDates, setAllDates] = useState([]);
  const [allArticleTitles, setAllArticleTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local filter states
  const [sessionTopics, setSessionTopics] = useState([]);
  const [sessionDates, setSessionDates] = useState([]);
  const [sessionArticles, setSessionArticles] = useState([]);

  // Synchronize local filter states with props
  useEffect(() => {
    setSessionTopics(finalTopics);
    setSessionDates(finalDates);
    setSessionArticles(finalArticles);
  }, [finalTopics, finalDates, finalArticles]);

  // Input text state for our custom autocomplete components
  const [topicsInputValue, setTopicsInputValue] = useState('');
  const [datesInputValue, setDatesInputValue] = useState('');
  const [articlesInputValue, setArticlesInputValue] = useState('');

  // Fetch available filter options on mount
  useEffect(() => {
    async function fetchFilters() {
      try {
        const [topicsRes, datesRes, articlesRes] = await Promise.all([
          fetchTopics(),
          fetchPublicationDates(),
          fetchArticleTitles(),
        ]);
        console.log('[DEBUG] DynamicFilter: Fetched topics:', topicsRes.topics);
        console.log('[DEBUG] DynamicFilter: Fetched dates:', datesRes.dates);
        console.log('[DEBUG] DynamicFilter: Fetched articles:', articlesRes.data.titles);
        setAllTopics(topicsRes.topics || []);
        setAllDates(datesRes.dates || []);
        setAllArticleTitles(articlesRes.data.titles || []);
      } catch (err) {
        console.error('[ERROR] DynamicFilter: Failed to load filters:', err);
        setError('Failed to load filters.');
      } finally {
        setLoading(false);
      }
    }
    fetchFilters();
  }, []);

  // Clear selected filters
  const handleClearSession = () => {
    console.log('[DEBUG] DynamicFilter: Clear Filter button clicked. Resetting local filter state.');
    setSessionTopics([]);
    setSessionDates([]);
    setSessionArticles([]);
    setTopicsInputValue('');
    setDatesInputValue('');
    setArticlesInputValue('');
    if (onClearFilters) {
      console.log('[DEBUG] DynamicFilter: Calling onClearFilters callback.');
      onClearFilters();
    }
  };

  // Apply filters callback
  const handleActivateFilter = () => {
    console.log('[DEBUG] DynamicFilter: Apply Filter button clicked with:', {
      topics: sessionTopics,
      dates: sessionDates,
      articles: sessionArticles
    });
    if (onApplyFilters) {
      onApplyFilters(sessionTopics, sessionDates, sessionArticles);
    }
  };

  // Remove a selected topic chip
  const handleRemoveSessionTopic = (topic) => {
    const newTopics = sessionTopics.filter((t) => t !== topic);
    console.log('[DEBUG] DynamicFilter: Removing topic:', topic, 'New topics:', newTopics);
    setSessionTopics(newTopics);
  };

  // Remove a selected date chip
  const handleRemoveSessionDate = (date) => {
    const newDates = sessionDates.filter((d) => d !== date);
    console.log('[DEBUG] DynamicFilter: Removing date:', date, 'New dates:', newDates);
    setSessionDates(newDates);
  };

  // Handle changes to the topics input field
  const handleTopicsInputChange = (value) => {
    console.log('[DEBUG] DynamicFilter: Topics input changed:', value);
    setTopicsInputValue(value);
  };

  // When a topic is selected from suggestions, add it to sessionTopics
  const handleTopicsSelect = (option) => {
    console.log('[DEBUG] DynamicFilter: Topic selected:', option);
    if (!sessionTopics.includes(option)) {
      const newTopics = [...sessionTopics, option];
      setSessionTopics(newTopics);
      console.log('[DEBUG] DynamicFilter: Updated sessionTopics =', newTopics);
    }
  };

  // Handle changes to the dates input field
  const handleDatesInputChange = (value) => {
    console.log('[DEBUG] DynamicFilter: Dates input changed:', value);
    setDatesInputValue(value);
  };

  // When a date is selected from suggestions, add it to sessionDates
  const handleDatesSelect = (option) => {
    console.log('[DEBUG] DynamicFilter: Date selected:', option);
    if (!sessionDates.includes(option)) {
      const newDates = [...sessionDates, option];
      setSessionDates(newDates);
      console.log('[DEBUG] DynamicFilter: Updated sessionDates =', newDates);
    }
  };

  // Handle changes to the articles input field
  const handleArticlesInputChange = (value) => {
    console.log('[DEBUG] DynamicFilter: Articles input changed:', value);
    setArticlesInputValue(value);
  };

  // When an article is selected from suggestions, add it to sessionArticles
  const handleArticlesSelect = (option) => {
    console.log('[DEBUG] DynamicFilter: Article selected:', option);
    if (!sessionArticles.includes(option)) {
      const newArticles = [...sessionArticles, option];
      setSessionArticles(newArticles);
      console.log('[DEBUG] DynamicFilter: Updated sessionArticles =', newArticles);
    }
  };

  // Remove a selected article chip
  const handleRemoveSessionArticle = (article) => {
    const newArticles = sessionArticles.filter((a) => a !== article);
    console.log('[DEBUG] DynamicFilter: Removing article:', article, 'New articles:', newArticles);
    setSessionArticles(newArticles);
  };

  if (loading) return <p>Loading filters...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // Container style mimicking Material UI Box with spacing (using inline styles)
  const containerStyle = {
    marginTop: '80px',       // Rough equivalent of mt for different screen sizes
    padding: '16px',         // Rough equivalent of px for responsive spacing
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',             // Spacing between elements
    width: '100%',
  };

  // Title style mimicking Typography (bold with margin-bottom)
  const sectionTitleStyle = { marginBottom: '8px', fontWeight: 'bold' };

  // Button container style to align buttons to the right
  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '16px',
  };

  return (
    <div style={containerStyle}>
      {/* Embedding keyframes for slideDown animation for chips */}
      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* TOPICS */}
      <div>
        <p style={sectionTitleStyle}>Topics</p>
        <AutocompleteInput
          options={allTopics}
          inputValue={topicsInputValue}
          onInputChange={handleTopicsInputChange}
          onSelect={handleTopicsSelect}
          placeholder="Topics"
          selectedValues={sessionTopics}
        />
        <div style={chipContainerStyle}>
          {sessionTopics.map((topic) => (
            <AnimatedChip
              key={topic}
              label={topic}
              onDelete={() => handleRemoveSessionTopic(topic)}
            />
          ))}
        </div>
      </div>

      {/* DATES */}
      <div>
        <p style={sectionTitleStyle}>Dates</p>
        <AutocompleteInput
          options={allDates}
          inputValue={datesInputValue}
          onInputChange={handleDatesInputChange}
          onSelect={handleDatesSelect}
          placeholder="Show Articles Since..."
          selectedValues={sessionDates}
        />
        <div style={chipContainerStyle}>
          {sessionDates.map((date) => (
            <AnimatedChip
              key={date}
              label={date}
              onDelete={() => handleRemoveSessionDate(date)}
            />
          ))}
        </div>
      </div>

      {/* ARTICLE TITLES */}
      <div>
        <p style={sectionTitleStyle}>Article Titles</p>
        <AutocompleteInput
          options={allArticleTitles}
          inputValue={articlesInputValue}
          onInputChange={handleArticlesInputChange}
          onSelect={handleArticlesSelect}
          placeholder="Search Articles..."
          selectedValues={sessionArticles}
        />
        <div style={chipContainerStyle}>
          {sessionArticles.map((article) => (
            <AnimatedChip
              key={article}
              label={article}
              onDelete={() => handleRemoveSessionArticle(article)}
            />
          ))}
        </div>
      </div>

      {/* Buttons: Clear & Apply */}
      <div style={buttonContainerStyle}>
        <StyledButton onClick={handleClearSession}>
          Clear Filters
        </StyledButton>
        <StyledButton onClick={handleActivateFilter}>
          Apply Filter
        </StyledButton>
      </div>
    </div>
  );
}

export default DynamicFilter;
