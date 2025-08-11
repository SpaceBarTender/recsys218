import React, { useState, useEffect } from 'react';
// Removed Material UI components and replaced them with standard HTML elements for layout and styling
import { fetchOfficeUsers, fetchOfficeUserInteractions } from '../../api';
import UserDataGrid_UsersList from './UserDataGrid_UsersList';
import UserDataGrid_UserActivity from './UserDataGrid_UserActivity';
import UserArticleFilter from './UserArticleFilter';

/**
 * UserAnalytics
 * A page component that displays office user analytics.
 * It now places the Filters component on the left and the Office Users grid to the right,
 * all contained within a fixed-width centered container. The User Activity table remains
 * on its own row below.
 *
 * Note: Material UI components have been replaced with native HTML div elements and
 * inline styles that mimic the layout aesthetics of MainGrid.jsx.
 */
export default function UserAnalytics() {
  const [users, setUsers] = useState([]);
  const [userInteractions, setUserInteractions] = useState([]);

  // These state variables store the filtered results.
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredUserInteractions, setFilteredUserInteractions] = useState([]);

  // States to store currently applied filter values.
  const [filterUsers, setFilterUsers] = useState([]);
  const [filterArticles, setFilterArticles] = useState([]);

  const sessionToken = localStorage.getItem("session_token") || "";

  // Fetch office users from the API.
  useEffect(() => {
    fetchOfficeUsers(sessionToken)
      .then(response => {
        const data = response.data.users || [];
        setUsers(data);
        // Initially, no filters are applied.
        setFilteredUsers(data);
      })
      .catch(error => {
        console.error("Error fetching office users:", error);
      });
  }, [sessionToken]);

  // Fetch office user interactions from the API.
  useEffect(() => {
    fetchOfficeUserInteractions(sessionToken)
      .then(response => {
        const data = response.data.user_interactions || [];
        setUserInteractions(data);
        setFilteredUserInteractions(data);
      })
      .catch(error => {
        console.error("Error fetching user interactions:", error);
      });
  }, [sessionToken]);

  // When filters are applied, update the filtered arrays.
  const handleApplyFilters = (selectedUsers, selectedArticleTitles) => {
    setFilterUsers(selectedUsers);
    setFilterArticles(selectedArticleTitles);

    // Filter users by username if filter list is non-empty.
    const newFilteredUsers =
      selectedUsers.length > 0
        ? users.filter(u => selectedUsers.includes(u.username))
        : users;
    setFilteredUsers(newFilteredUsers);

    // Filter interactions by username and article title.
    let newFilteredInteractions = userInteractions;
    if (selectedUsers.length > 0) {
      newFilteredInteractions = newFilteredInteractions.filter(interaction =>
        selectedUsers.includes(interaction.username)
      );
    }
    if (selectedArticleTitles.length > 0) {
      newFilteredInteractions = newFilteredInteractions.filter(interaction =>
        selectedArticleTitles.some(title =>
          interaction.title.toLowerCase().includes(title.toLowerCase())
        )
      );
    }
    setFilteredUserInteractions(newFilteredInteractions);
  };

  // When filters are cleared, reset to the original data.
  const handleClearFilters = () => {
    setFilterUsers([]);
    setFilterArticles([]);
    setFilteredUsers(users);
    setFilteredUserInteractions(userInteractions);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '32px auto', padding: '0 16px' }}>
      {/* Top Row: Contains Filters (left) and Office Users grid (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 600px) 1fr', gap: '48px' }}>
        {/* Filters Column */}
        <div>
          <h6 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '24px' }}>Filters</h6>
          <div
            style={{
              height: '500px',
              width: '100%',
              overflow: 'auto',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '16px',
              backgroundColor: '#333',
              color: '#fff',
              marginRight: 0
            }}
          >
            <UserArticleFilter
              finalUserFilters={filterUsers}
              finalArticleFilters={filterArticles}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>
        {/* Office Users Grid Column */}
        <div>
          <h6 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '24px' }}>Office Users</h6>
          <div
            style={{
              maxHeight: '600px',
              width: '800px', 
              overflow: 'auto',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '16px',
              backgroundColor: '#333',
              color: '#fff',
              marginLeft: 'auto'
            }}
          >
            <UserDataGrid_UsersList rows={filteredUsers} />
          </div>
        </div>
      </div>
      {/* User Activity Table */}
      <div style={{ marginTop: '24px' }}>
        <h6 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '24px' }}>User Activity</h6>
        <div
          style={{
            width: '100%',
            overflow: 'auto',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '16px',
            backgroundColor: '#333',
            color: '#fff'
          }}
        >
          <UserDataGrid_UserActivity rows={filteredUserInteractions} />
        </div>
      </div>
    </div>
  );
}

// import React, { useState, useEffect } from 'react';
// // Removed Material UI components and replaced them with standard HTML elements for layout and styling
// import { fetchOfficeUsers, fetchOfficeUserInteractions } from '../../api';
// import UserDataGrid_UsersList from './UserDataGrid_UsersList';
// import UserDataGrid_UserActivity from './UserDataGrid_UserActivity';
// import UserArticleFilter from './UserArticleFilter';

// /**
//  * UserAnalytics
//  * A page component that displays office user analytics.
//  * It now places the Filters component on the left and the Office Users grid to the right,
//  * all contained within a fixed-width centered container. The User Activity table remains
//  * on its own row below.
//  *
//  * Note: Material UI components have been replaced with native HTML div elements and
//  * inline styles that mimic the layout aesthetics of MainGrid.jsx.
//  */
// export default function UserAnalytics() {
//   const [users, setUsers] = useState([]);
//   const [userInteractions, setUserInteractions] = useState([]);

//   // These state variables store the filtered results.
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [filteredUserInteractions, setFilteredUserInteractions] = useState([]);

//   // States to store currently applied filter values.
//   const [filterUsers, setFilterUsers] = useState([]);
//   const [filterArticles, setFilterArticles] = useState([]);

//   const sessionToken = localStorage.getItem("session_token") || "";

//   // Fetch office users from the API.
//   useEffect(() => {
//     fetchOfficeUsers(sessionToken)
//       .then(response => {
//         const data = response.data.users || [];
//         setUsers(data);
//         // Initially, no filters are applied.
//         setFilteredUsers(data);
//       })
//       .catch(error => {
//         console.error("Error fetching office users:", error);
//       });
//   }, [sessionToken]);

//   // Fetch office user interactions from the API.
//   useEffect(() => {
//     fetchOfficeUserInteractions(sessionToken)
//       .then(response => {
//         const data = response.data.user_interactions || [];
//         setUserInteractions(data);
//         setFilteredUserInteractions(data);
//       })
//       .catch(error => {
//         console.error("Error fetching user interactions:", error);
//       });
//   }, [sessionToken]);

//   // When filters are applied, update the filtered arrays.
//   const handleApplyFilters = (selectedUsers, selectedArticleTitles) => {
//     setFilterUsers(selectedUsers);
//     setFilterArticles(selectedArticleTitles);

//     // Filter users by username if filter list is non-empty.
//     const newFilteredUsers =
//       selectedUsers.length > 0
//         ? users.filter(u => selectedUsers.includes(u.username))
//         : users;
//     setFilteredUsers(newFilteredUsers);

//     // Filter interactions by username and article title.
//     let newFilteredInteractions = userInteractions;
//     if (selectedUsers.length > 0) {
//       newFilteredInteractions = newFilteredInteractions.filter(interaction =>
//         selectedUsers.includes(interaction.username)
//       );
//     }
//     if (selectedArticleTitles.length > 0) {
//       newFilteredInteractions = newFilteredInteractions.filter(interaction =>
//         selectedArticleTitles.some(title =>
//           interaction.title.toLowerCase().includes(title.toLowerCase())
//         )
//       );
//     }
//     setFilteredUserInteractions(newFilteredInteractions);
//   };

//   // When filters are cleared, reset to the original data.
//   const handleClearFilters = () => {
//     setFilterUsers([]);
//     setFilterArticles([]);
//     setFilteredUsers(users);
//     setFilteredUserInteractions(userInteractions);
//   };

//   return (
//     <div style={{ maxWidth: '1400px', margin: '32px auto', padding: '0 16px' }}>
//       {/* Top Row: Contains Filters (left) and Office Users grid (right) */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 600px) 1fr', gap: '48px' }}>
//         {/* Filters Column */}
//         <div>
//           <h6 style={{ marginBottom: '8px', textAlign: 'center' }}>Filters</h6>
//           <div
//             style={{
//               height: '500px',
//               width: '100%',
//               overflow: 'auto',
//               border: '1px solid #444',
//               borderRadius: '4px',
//               padding: '16px',
//               backgroundColor: '#333',
//               color: '#fff',
//               marginRight: 0
//             }}
//           >
//             <UserArticleFilter
//               finalUserFilters={filterUsers}
//               finalArticleFilters={filterArticles}
//               onApplyFilters={handleApplyFilters}
//               onClearFilters={handleClearFilters}
//             />
//           </div>
//         </div>
//         {/* Office Users Grid Column */}
//         <div>
//           <h6 style={{ marginBottom: '8px', textAlign: 'center' }}>Office Users</h6>
//           <div
//             style={{
//               maxHeight: '600px',
//               width: '800px', 
//               overflow: 'auto',
//               border: '1px solid #444',
//               borderRadius: '4px',
//               padding: '16px',
//               backgroundColor: '#333',
//               color: '#fff',
//               marginLeft: 'auto'
//             }}
//           >
//             <UserDataGrid_UsersList rows={filteredUsers} />
//           </div>
//         </div>
//       </div>
//       {/* User Activity Table */}
//       <div style={{ marginTop: '24px' }}>
//         <h6 style={{ marginBottom: '8px', textAlign: 'center' }}>User Activity</h6>
//         <div
//           style={{
//             width: '100%',
//             overflow: 'auto',
//             border: '1px solid #444',
//             borderRadius: '4px',
//             padding: '16px',
//             backgroundColor: '#333',
//             color: '#fff'
//           }}
//         >
//           <UserDataGrid_UserActivity rows={filteredUserInteractions} />
//         </div>
//       </div>
//     </div>
//   );
// }
