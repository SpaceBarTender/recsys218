import React, { useState, useEffect, useRef } from 'react';
import { fetchUserNames, fetchArticleTitles } from '../../api.js';

/**
 * UserArticleFilter
 * A filter component for selecting users and article titles, now enhanced with animated dark mode dropdowns, chip transitions, and click‐outside detection.
 *
 * Props:
 * @param {Array} finalUserFilters - Array of initially selected user filters.
 * @param {Array} finalArticleFilters - Array of initially selected article title filters.
 * @param {function} onApplyFilters - Callback invoked with (selectedUsers, selectedArticleTitles) when applying filters.
 * @param {function} onClearFilters - Callback invoked when filters are cleared.
 */
function UserArticleFilter({ finalUserFilters = [], finalArticleFilters = [], onApplyFilters, onClearFilters }) {
  const [allUsers, setAllUsers] = useState([]);
  const [allArticleTitles, setAllArticleTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local filter states
  const [sessionUsers, setSessionUsers] = useState([]);
  const [sessionArticles, setSessionArticles] = useState([]);

  // Input text for autocomplete
  const [usersInputValue, setUsersInputValue] = useState('');
  const [articlesInputValue, setArticlesInputValue] = useState('');

  // Suggestions for autocompletes
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [articleSuggestions, setArticleSuggestions] = useState([]);

  // Refs for click-outside detection on dropdown containers
  const usersContainerRef = useRef(null);
  const articlesContainerRef = useRef(null);

  // Define chip style to match DynamicFilter's AnimatedChip
  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#424242',
    color: '#fff',
    height: '24px',
    padding: '0 8px',
    borderRadius: '16px',
    fontSize: '12px',
    transition: 'all 0.3s ease'
  };

  // Close dropdowns when clicking outside the container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (usersContainerRef.current && !usersContainerRef.current.contains(event.target)) {
        setUserSuggestions([]);
      }
      if (articlesContainerRef.current && !articlesContainerRef.current.contains(event.target)) {
        setArticleSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch available filter options on mount
  useEffect(() => {
    async function fetchFilters() {
      console.log('[DEBUG] UserArticleFilter: Starting to fetch filters...');
      try {
        const [usersRes, articlesRes] = await Promise.all([
          fetchUserNames(),
          fetchArticleTitles(),
        ]);
        console.log('[DEBUG] UserArticleFilter: Fetched user names:', usersRes.data);
        console.log('[DEBUG] UserArticleFilter: Fetched article titles:', articlesRes.data);
        setAllUsers(usersRes.data.userNames || []);
        setAllArticleTitles(articlesRes.data.titles || []);
      } catch (err) {
        console.error('[ERROR] UserArticleFilter: Failed to load filters:', err);
        setError('Failed to load filters.');
      } finally {
        setLoading(false);
        console.log('[DEBUG] UserArticleFilter: Finished fetching filters.');
      }
    }
    fetchFilters();
  }, []);

  // Sync state with parent props
  useEffect(() => {
    console.log('[DEBUG] UserArticleFilter: Syncing parent filters:', finalUserFilters, finalArticleFilters);
    setSessionUsers(finalUserFilters);
    setSessionArticles(finalArticleFilters);
  }, [finalUserFilters, finalArticleFilters]);

  // Clear selected filters
  const handleClearSession = () => {
    console.log('[DEBUG] UserArticleFilter: Clearing filters.');
    setSessionUsers([]);
    setSessionArticles([]);
    setUsersInputValue('');
    setArticlesInputValue('');
    setUserSuggestions([]);
    setArticleSuggestions([]);
    if (onClearFilters) {
      console.log('[DEBUG] UserArticleFilter: Calling onClearFilters callback.');
      onClearFilters();
    }
  };

  // Apply filters
  const handleActivateFilter = () => {
    console.log('[DEBUG] UserArticleFilter: Applying filters with users:', sessionUsers, 'and articles:', sessionArticles);
    if (onApplyFilters) {
      onApplyFilters(sessionUsers, sessionArticles);
    }
  };

  // Add user to session
  const handleAddUser = (user) => {
    if (!sessionUsers.includes(user)) {
      const newUsers = [...sessionUsers, user];
      console.log('[DEBUG] UserArticleFilter: Adding user:', user, 'New list:', newUsers);
      setSessionUsers(newUsers);
    }
    setUsersInputValue('');
    setUserSuggestions([]);
  };

  // Add article to session
  const handleAddArticle = (article) => {
    if (!sessionArticles.includes(article)) {
      const newArticles = [...sessionArticles, article];
      console.log('[DEBUG] UserArticleFilter: Adding article:', article, 'New list:', newArticles);
      setSessionArticles(newArticles);
    }
    setArticlesInputValue('');
    setArticleSuggestions([]);
  };

  // Remove selected user "chip"
  const handleRemoveSessionUser = (user) => {
    console.log('[DEBUG] UserArticleFilter: Removing user chip:', user);
    const newUsers = sessionUsers.filter((u) => u !== user);
    console.log('[DEBUG] UserArticleFilter: New user filter list:', newUsers);
    setSessionUsers(newUsers);
  };

  // Remove selected article "chip"
  const handleRemoveSessionArticle = (article) => {
    console.log('[DEBUG] UserArticleFilter: Removing article chip:', article);
    const newArticles = sessionArticles.filter((a) => a !== article);
    console.log('[DEBUG] UserArticleFilter: New article filter list:', newArticles);
    setSessionArticles(newArticles);
  };

  // Update input text and suggestions for Users
  const handleUsersInputChange = (e) => {
    const newValue = e.target.value;
    console.log('[DEBUG] UserArticleFilter: Users input changed:', newValue);
    setUsersInputValue(newValue);
    if (newValue) {
      const filtered = allUsers.filter(
        (user) =>
          user.toLowerCase().includes(newValue.toLowerCase()) &&
          !sessionUsers.includes(user)
      );
      setUserSuggestions(filtered);
    } else {
      setUserSuggestions([]);
    }
  };

  // Show suggestions dropdown on focus for Users
  const handleUsersFocus = () => {
    if (usersInputValue.trim() === '') {
      const suggestions = allUsers.filter((user) => !sessionUsers.includes(user));
      setUserSuggestions(suggestions);
    }
  };

  // Update input text and suggestions for Articles
  const handleArticlesInputChange = (e) => {
    const newValue = e.target.value;
    console.log('[DEBUG] UserArticleFilter: Articles input changed:', newValue);
    setArticlesInputValue(newValue);
    if (newValue) {
      const filtered = allArticleTitles.filter(
        (article) =>
          article.toLowerCase().includes(newValue.toLowerCase()) &&
          !sessionArticles.includes(article)
      );
      setArticleSuggestions(filtered);
    } else {
      setArticleSuggestions([]);
    }
  };

  // Show suggestions dropdown on focus for Articles
  const handleArticlesFocus = () => {
    if (articlesInputValue.trim() === '') {
      const suggestions = allArticleTitles.filter((article) => !sessionArticles.includes(article));
      setArticleSuggestions(suggestions);
    }
  };

  if (loading) return <div>Loading filters...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ marginTop: '40px', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* USERS SECTION */}
      <div>
        <p style={{ marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>Users</p>
        <div ref={usersContainerRef} style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Select Users"
            value={usersInputValue}
            onChange={handleUsersInputChange}
            onFocus={handleUsersFocus}
            style={{ 
              width: '100%', 
              padding: '8px', 
              boxSizing: 'border-box', 
              background: '#222', 
              color: '#fff', 
              border: '1px solid #555' 
            }}
          />
          {userSuggestions.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '100px',
              overflowY: 'auto',
              background: '#333',
              border: '1px solid #555',
              margin: 0,
              padding: 0,
              listStyleType: 'none',
              zIndex: 1,
              transition: 'opacity 0.3s ease'
            }}>
              {userSuggestions.map((user, index) => (
                <li 
                  key={index}
                  onClick={() => handleAddUser(user)}
                  style={{ padding: '8px', cursor: 'pointer', color: '#fff' }}
                >
                  {user}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', minHeight: '40px' }}>
          {sessionUsers.map((user) => (
            <span key={user} style={chipStyle}>
              {user}
              <button 
                onClick={() => handleRemoveSessionUser(user)} 
                style={{
                  marginLeft: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                x
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* ARTICLE TITLES SECTION */}
      <div>
        <p style={{ marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>Article Titles</p>
        <div ref={articlesContainerRef} style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Select Article Titles"
            value={articlesInputValue}
            onChange={handleArticlesInputChange}
            onFocus={handleArticlesFocus}
            style={{ 
              width: '100%', 
              padding: '8px', 
              boxSizing: 'border-box', 
              background: '#222', 
              color: '#fff', 
              border: '1px solid #555' 
            }}
          />
          {articleSuggestions.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '100px',
              overflowY: 'auto',
              background: '#333',
              border: '1px solid #555',
              margin: 0,
              padding: 0,
              listStyleType: 'none',
              zIndex: 1,
              transition: 'opacity 0.3s ease'
            }}>
              {articleSuggestions.map((article, index) => (
                <li 
                  key={index}
                  onClick={() => handleAddArticle(article)}
                  style={{ padding: '8px', cursor: 'pointer', color: '#fff' }}
                >
                  {article}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', minHeight: '40px' }}>
          {sessionArticles.map((article) => (
            <span key={article} style={chipStyle}>
              {article}
              <button 
                onClick={() => handleRemoveSessionArticle(article)} 
                style={{
                  marginLeft: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                x
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Buttons: Clear & Apply */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
        <button
          onClick={handleClearSession}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #333',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
        <button
          onClick={handleActivateFilter}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #333',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
}

export default UserArticleFilter;

// import React, { useState, useEffect, useRef } from 'react';
// import { fetchUserNames, fetchArticleTitles } from '../../api.js';

// /**
//  * UserArticleFilter
//  * A filter component for selecting users and article titles, now enhanced with animated dark mode dropdowns, chip transitions, and click‐outside detection.
//  *
//  * Props:
//  * @param {Array} finalUserFilters - Array of initially selected user filters.
//  * @param {Array} finalArticleFilters - Array of initially selected article title filters.
//  * @param {function} onApplyFilters - Callback invoked with (selectedUsers, selectedArticleTitles) when applying filters.
//  * @param {function} onClearFilters - Callback invoked when filters are cleared.
//  */
// function UserArticleFilter({ finalUserFilters = [], finalArticleFilters = [], onApplyFilters, onClearFilters }) {
//   const [allUsers, setAllUsers] = useState([]);
//   const [allArticleTitles, setAllArticleTitles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Local filter states
//   const [sessionUsers, setSessionUsers] = useState([]);
//   const [sessionArticles, setSessionArticles] = useState([]);

//   // Input text for autocomplete
//   const [usersInputValue, setUsersInputValue] = useState('');
//   const [articlesInputValue, setArticlesInputValue] = useState('');

//   // Suggestions for autocompletes
//   const [userSuggestions, setUserSuggestions] = useState([]);
//   const [articleSuggestions, setArticleSuggestions] = useState([]);

//   // Refs for click-outside detection on dropdown containers
//   const usersContainerRef = useRef(null);
//   const articlesContainerRef = useRef(null);

//   // Define chip style to match DynamicFilter's AnimatedChip
//   const chipStyle = {
//     display: 'inline-flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     background: '#424242',
//     color: '#fff',
//     height: '24px',
//     padding: '0 8px',
//     borderRadius: '16px',
//     fontSize: '12px',
//     transition: 'all 0.3s ease'
//   };

//   // Close dropdowns when clicking outside the container
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (usersContainerRef.current && !usersContainerRef.current.contains(event.target)) {
//         setUserSuggestions([]);
//       }
//       if (articlesContainerRef.current && !articlesContainerRef.current.contains(event.target)) {
//         setArticleSuggestions([]);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch available filter options on mount
//   useEffect(() => {
//     async function fetchFilters() {
//       console.log('[DEBUG] UserArticleFilter: Starting to fetch filters...');
//       try {
//         const [usersRes, articlesRes] = await Promise.all([
//           fetchUserNames(),
//           fetchArticleTitles(),
//         ]);
//         console.log('[DEBUG] UserArticleFilter: Fetched user names:', usersRes.data);
//         console.log('[DEBUG] UserArticleFilter: Fetched article titles:', articlesRes.data);
//         setAllUsers(usersRes.data.userNames || []);
//         setAllArticleTitles(articlesRes.data.titles || []);
//       } catch (err) {
//         console.error('[ERROR] UserArticleFilter: Failed to load filters:', err);
//         setError('Failed to load filters.');
//       } finally {
//         setLoading(false);
//         console.log('[DEBUG] UserArticleFilter: Finished fetching filters.');
//       }
//     }
//     fetchFilters();
//   }, []);

//   // Sync state with parent props
//   useEffect(() => {
//     console.log('[DEBUG] UserArticleFilter: Syncing parent filters:', finalUserFilters, finalArticleFilters);
//     setSessionUsers(finalUserFilters);
//     setSessionArticles(finalArticleFilters);
//   }, [finalUserFilters, finalArticleFilters]);

//   // Clear selected filters
//   const handleClearSession = () => {
//     console.log('[DEBUG] UserArticleFilter: Clearing filters.');
//     setSessionUsers([]);
//     setSessionArticles([]);
//     setUsersInputValue('');
//     setArticlesInputValue('');
//     setUserSuggestions([]);
//     setArticleSuggestions([]);
//     if (onClearFilters) {
//       console.log('[DEBUG] UserArticleFilter: Calling onClearFilters callback.');
//       onClearFilters();
//     }
//   };

//   // Apply filters
//   const handleActivateFilter = () => {
//     console.log('[DEBUG] UserArticleFilter: Applying filters with users:', sessionUsers, 'and articles:', sessionArticles);
//     if (onApplyFilters) {
//       onApplyFilters(sessionUsers, sessionArticles);
//     }
//   };

//   // Add user to session
//   const handleAddUser = (user) => {
//     if (!sessionUsers.includes(user)) {
//       const newUsers = [...sessionUsers, user];
//       console.log('[DEBUG] UserArticleFilter: Adding user:', user, 'New list:', newUsers);
//       setSessionUsers(newUsers);
//     }
//     setUsersInputValue('');
//     setUserSuggestions([]);
//   };

//   // Add article to session
//   const handleAddArticle = (article) => {
//     if (!sessionArticles.includes(article)) {
//       const newArticles = [...sessionArticles, article];
//       console.log('[DEBUG] UserArticleFilter: Adding article:', article, 'New list:', newArticles);
//       setSessionArticles(newArticles);
//     }
//     setArticlesInputValue('');
//     setArticleSuggestions([]);
//   };

//   // Remove selected user "chip"
//   const handleRemoveSessionUser = (user) => {
//     console.log('[DEBUG] UserArticleFilter: Removing user chip:', user);
//     const newUsers = sessionUsers.filter((u) => u !== user);
//     console.log('[DEBUG] UserArticleFilter: New user filter list:', newUsers);
//     setSessionUsers(newUsers);
//   };

//   // Remove selected article "chip"
//   const handleRemoveSessionArticle = (article) => {
//     console.log('[DEBUG] UserArticleFilter: Removing article chip:', article);
//     const newArticles = sessionArticles.filter((a) => a !== article);
//     console.log('[DEBUG] UserArticleFilter: New article filter list:', newArticles);
//     setSessionArticles(newArticles);
//   };

//   // Update input text and suggestions for Users
//   const handleUsersInputChange = (e) => {
//     const newValue = e.target.value;
//     console.log('[DEBUG] UserArticleFilter: Users input changed:', newValue);
//     setUsersInputValue(newValue);
//     if (newValue) {
//       const filtered = allUsers.filter(
//         (user) =>
//           user.toLowerCase().includes(newValue.toLowerCase()) &&
//           !sessionUsers.includes(user)
//       );
//       setUserSuggestions(filtered);
//     } else {
//       setUserSuggestions([]);
//     }
//   };

//   // Show suggestions dropdown on focus for Users
//   const handleUsersFocus = () => {
//     if (usersInputValue.trim() === '') {
//       const suggestions = allUsers.filter((user) => !sessionUsers.includes(user));
//       setUserSuggestions(suggestions);
//     }
//   };

//   // Update input text and suggestions for Articles
//   const handleArticlesInputChange = (e) => {
//     const newValue = e.target.value;
//     console.log('[DEBUG] UserArticleFilter: Articles input changed:', newValue);
//     setArticlesInputValue(newValue);
//     if (newValue) {
//       const filtered = allArticleTitles.filter(
//         (article) =>
//           article.toLowerCase().includes(newValue.toLowerCase()) &&
//           !sessionArticles.includes(article)
//       );
//       setArticleSuggestions(filtered);
//     } else {
//       setArticleSuggestions([]);
//     }
//   };

//   // Show suggestions dropdown on focus for Articles
//   const handleArticlesFocus = () => {
//     if (articlesInputValue.trim() === '') {
//       const suggestions = allArticleTitles.filter((article) => !sessionArticles.includes(article));
//       setArticleSuggestions(suggestions);
//     }
//   };

//   if (loading) return <div>Loading filters...</div>;
//   if (error) return <div style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div style={{ marginTop: '40px', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
//       {/* USERS SECTION */}
//       <div>
//         <p style={{ marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>Users</p>
//         <div ref={usersContainerRef} style={{ position: 'relative', width: '100%' }}>
//           <input
//             type="text"
//             placeholder="Select Users"
//             value={usersInputValue}
//             onChange={handleUsersInputChange}
//             onFocus={handleUsersFocus}
//             style={{ 
//               width: '100%', 
//               padding: '8px', 
//               boxSizing: 'border-box', 
//               background: '#222', 
//               color: '#fff', 
//               border: '1px solid #555' 
//             }}
//           />
//           {userSuggestions.length > 0 && (
//             <ul style={{
//               position: 'absolute',
//               top: '100%',
//               left: 0,
//               right: 0,
//               maxHeight: '100px',
//               overflowY: 'auto',
//               background: '#333',
//               border: '1px solid #555',
//               margin: 0,
//               padding: 0,
//               listStyleType: 'none',
//               zIndex: 1,
//               transition: 'opacity 0.3s ease'
//             }}>
//               {userSuggestions.map((user, index) => (
//                 <li 
//                   key={index}
//                   onClick={() => handleAddUser(user)}
//                   style={{ padding: '8px', cursor: 'pointer', color: '#fff' }}
//                 >
//                   {user}
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', minHeight: '40px' }}>
//           {sessionUsers.map((user) => (
//             <span key={user} style={chipStyle}>
//               {user}
//               <button 
//                 onClick={() => handleRemoveSessionUser(user)} 
//                 style={{
//                   marginLeft: '4px',
//                   border: 'none',
//                   background: 'transparent',
//                   color: '#fff',
//                   cursor: 'pointer'
//                 }}
//               >
//                 x
//               </button>
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* ARTICLE TITLES SECTION */}
//       <div>
//         <p style={{ marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>Article Titles</p>
//         <div ref={articlesContainerRef} style={{ position: 'relative', width: '100%' }}>
//           <input
//             type="text"
//             placeholder="Select Article Titles"
//             value={articlesInputValue}
//             onChange={handleArticlesInputChange}
//             onFocus={handleArticlesFocus}
//             style={{ 
//               width: '100%', 
//               padding: '8px', 
//               boxSizing: 'border-box', 
//               background: '#222', 
//               color: '#fff', 
//               border: '1px solid #555' 
//             }}
//           />
//           {articleSuggestions.length > 0 && (
//             <ul style={{
//               position: 'absolute',
//               top: '100%',
//               left: 0,
//               right: 0,
//               maxHeight: '100px',
//               overflowY: 'auto',
//               background: '#333',
//               border: '1px solid #555',
//               margin: 0,
//               padding: 0,
//               listStyleType: 'none',
//               zIndex: 1,
//               transition: 'opacity 0.3s ease'
//             }}>
//               {articleSuggestions.map((article, index) => (
//                 <li 
//                   key={index}
//                   onClick={() => handleAddArticle(article)}
//                   style={{ padding: '8px', cursor: 'pointer', color: '#fff' }}
//                 >
//                   {article}
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', minHeight: '40px' }}>
//           {sessionArticles.map((article) => (
//             <span key={article} style={chipStyle}>
//               {article}
//               <button 
//                 onClick={() => handleRemoveSessionArticle(article)} 
//                 style={{
//                   marginLeft: '4px',
//                   border: 'none',
//                   background: 'transparent',
//                   color: '#fff',
//                   cursor: 'pointer'
//                 }}
//               >
//                 x
//               </button>
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* Buttons: Clear & Apply */}
//       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
//         <button
//           onClick={handleClearSession}
//           style={{
//             backgroundColor: '#000',
//             color: '#fff',
//             border: '1px solid #333',
//             padding: '4px 8px',
//             borderRadius: '4px',
//             fontSize: '12px',
//             cursor: 'pointer'
//           }}
//         >
//           Clear Filters
//         </button>
//         <button
//           onClick={handleActivateFilter}
//           style={{
//             backgroundColor: '#000',
//             color: '#fff',
//             border: '1px solid #333',
//             padding: '4px 8px',
//             borderRadius: '4px',
//             fontSize: '12px',
//             cursor: 'pointer'
//           }}
//         >
//           Apply Filter
//         </button>
//       </div>
//     </div>
//   );
// }

// export default UserArticleFilter;
