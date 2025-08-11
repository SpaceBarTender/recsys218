import React, { useState, useMemo } from 'react';

/**
 * UserDataGrid_UsersList
 * A custom DataGrid displaying office users.
 *
 * Columns:
 * - created_at: The timestamp the user was created.
 * - username: The username of the user.
 * - office_code: The office code from the offices table.
 *
 * Features:
 * - Pagination with page size options [10, 20, 50]
 * - Dark themed UI with a filter panel (mimicking CustomizedDataGridModel.jsx)
 *
 * @param {Array} rows - The data rows for the grid.
 */
export default function UserDataGrid_UsersList({ rows = [] }) {
  // Column configuration
  const columns = [
    { field: 'created_at', headerName: 'Created At', width: 160 },
    { field: 'username', headerName: 'Username', width: 220 },
    { field: 'office_code', headerName: 'Office Code', width: 150 },
  ];

  // Default pagination settings
  const defaultPageSize = 20;
  const pageSizeOptions = [10, 20, 50];

  // Filter state
  const [filterVisible, setFailterVisible] = useState(false);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Apply filtering if a filter is active
  const filteredRows = useMemo(() => {
    if (filterColumn && filterValue) {
      return rows.filter(row => {
        const cellValue = row[filterColumn];
        return cellValue != null && cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    }
    return rows;
  }, [rows, filterColumn, filterValue]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const currentRows = filteredRows.slice(startIdx, startIdx + pageSize);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        backgroundColor: '#242424',
        color: 'rgba(255, 255, 255, 0.87)',
        padding: '16px',
        width: '700px',
        margin: '0 auto'
      }}
    >
      {/* Filter Toggle */}
      <button onClick={() => setFilterVisible(prev => !prev)}>
        {filterVisible ? 'Hide Filter' : 'Show Filter'}
      </button>

      {/* Filter Panel */}
      {filterVisible && (
        <div
          style={{
            margin: '10px 0',
            padding: '8px',
            border: '1px solid #555',
            backgroundColor: '#2a2a2a'
          }}
        >
          <label>
            Column:&nbsp;
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              style={{ marginRight: '8px' }}
            >
              <option value=''>Select column</option>
              {columns.map(col => (
                <option key={col.field} value={col.field}>
                  {col.headerName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Value:&nbsp;
            <input
              type='text'
              value={filterValue}
              placeholder='Filter value'
              onChange={(e) => setFilterValue(e.target.value)}
              style={{
                backgroundColor: '#242424',
                color: 'rgba(255, 255, 255, 0.87)',
                border: '1px solid #646cff',
                borderRadius: '4px',
                padding: '4px'
              }}
            />
          </label>
        </div>
      )}

      {/* Data Grid Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
        <thead>
          <tr style={{ backgroundColor: '#1f1f1f' }}>
            {columns.map(col => (
              <th
                key={col.field}
                style={{
                  width: col.width,
                  border: '1px solid #555',
                  padding: '4px',
                  textAlign: 'left',
                  backgroundColor: '#1f1f1f'
                }}
              >
                {col.headerName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, index) => (
            <tr
              key={row.username}
              style={{
                backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#242424'
              }}
            >
              {columns.map(col => (
                <td
                  key={col.field}
                  style={{
                    border: '1px solid #555',
                    padding: '4px',
                    width: col.width,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row[col.field] != null ? row[col.field] : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
          Prev
        </button>
        <span style={{ margin: '0 10px' }}>
          Page {page} of {totalPages}
        </span>
        <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
          Next
        </button>
        <span style={{ marginLeft: '10px' }}>
          <select value={pageSize} onChange={handlePageSizeChange} className="signup-select">
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt} per page
              </option>
            ))}
          </select>
        </span>
      </div>
    </div>
  );
}

// import React, { useState, useMemo } from 'react';

// /**
//  * UserDataGrid_UsersList
//  * A custom DataGrid displaying office users.
//  *
//  * Columns:
//  * - created_at: The timestamp the user was created.
//  * - username: The username of the user.
//  * - office_code: The office code from the offices table.
//  *
//  * Features:
//  * - Pagination with page size options [10, 20, 50]
//  * - Dark themed UI with a filter panel (mimicking CustomizedDataGridModel.jsx)
//  *
//  * @param {Array} rows - The data rows for the grid.
//  */
// export default function UserDataGrid_UsersList({ rows = [] }) {
//   // Column configuration
//   const columns = [
//     { field: 'created_at', headerName: 'Created At', width: 160 },
//     { field: 'username', headerName: 'Username', width: 220 },
//     { field: 'office_code', headerName: 'Office Code', width: 150 },
//   ];

//   // Default pagination settings
//   const defaultPageSize = 20;
//   const pageSizeOptions = [10, 20, 50];

//   // Filter state
//   const [filterVisible, setFailterVisible] = useState(false);
//   const [filterColumn, setFilterColumn] = useState('');
//   const [filterValue, setFilterValue] = useState('');

//   // Pagination state
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(defaultPageSize);

//   // Apply filtering if a filter is active
//   const filteredRows = useMemo(() => {
//     if (filterColumn && filterValue) {
//       return rows.filter(row => {
//         const cellValue = row[filterColumn];
//         return cellValue != null && cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
//       });
//     }
//     return rows;
//   }, [rows, filterColumn, filterValue]);

//   const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
//   const startIdx = (page - 1) * pageSize;
//   const currentRows = filteredRows.slice(startIdx, startIdx + pageSize);

//   // Pagination handlers
//   const handlePageChange = (newPage) => {
//     if (newPage < 1 || newPage > totalPages) return;
//     setPage(newPage);
//   };

//   const handlePageSizeChange = (e) => {
//     const newSize = Number(e.target.value);
//     setPageSize(newSize);
//     setPage(1);
//   };

//   return (
//     <div
//       style={{
//         fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
//         backgroundColor: '#242424',
//         color: 'rgba(255, 255, 255, 0.87)',
//         padding: '16px',
//         width: '700px',
//         margin: '0 auto'
//       }}
//     >
//       {/* Filter Toggle */}
//       <button onClick={() => setFilterVisible(prev => !prev)}>
//         {filterVisible ? 'Hide Filter' : 'Show Filter'}
//       </button>

//       {/* Filter Panel */}
//       {filterVisible && (
//         <div
//           style={{
//             margin: '10px 0',
//             padding: '8px',
//             border: '1px solid #555',
//             backgroundColor: '#2a2a2a'
//           }}
//         >
//           <label>
//             Column:&nbsp;
//             <select
//               value={filterColumn}
//               onChange={(e) => setFilterColumn(e.target.value)}
//               style={{ marginRight: '8px' }}
//             >
//               <option value=''>Select column</option>
//               {columns.map(col => (
//                 <option key={col.field} value={col.field}>
//                   {col.headerName}
//                 </option>
//               ))}
//             </select>
//           </label>
//           <label>
//             Value:&nbsp;
//             <input
//               type='text'
//               value={filterValue}
//               placeholder='Filter value'
//               onChange={(e) => setFilterValue(e.target.value)}
//               style={{
//                 backgroundColor: '#242424',
//                 color: 'rgba(255, 255, 255, 0.87)',
//                 border: '1px solid #646cff',
//                 borderRadius: '4px',
//                 padding: '4px'
//               }}
//             />
//           </label>
//         </div>
//       )}

//       {/* Data Grid Table */}
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
//         <thead>
//           <tr style={{ backgroundColor: '#1f1f1f' }}>
//             {columns.map(col => (
//               <th
//                 key={col.field}
//                 style={{
//                   width: col.width,
//                   border: '1px solid #555',
//                   padding: '4px',
//                   textAlign: 'left',
//                   backgroundColor: '#1f1f1f'
//                 }}
//               >
//                 {col.headerName}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {currentRows.map((row, index) => (
//             <tr
//               key={row.username}
//               style={{
//                 backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#242424'
//               }}
//             >
//               {columns.map(col => (
//                 <td
//                   key={col.field}
//                   style={{
//                     border: '1px solid #555',
//                     padding: '4px',
//                     width: col.width,
//                     overflow: 'hidden',
//                     textOverflow: 'ellipsis',
//                     whiteSpace: 'nowrap'
//                   }}
//                 >
//                   {row[col.field] != null ? row[col.field] : ''}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {/* Pagination Controls */}
//       <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
//         <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
//           Prev
//         </button>
//         <span style={{ margin: '0 10px' }}>
//           Page {page} of {totalPages}
//         </span>
//         <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
//           Next
//         </button>
//         <span style={{ marginLeft: '10px' }}>
//           <select value={pageSize} onChange={handlePageSizeChange} className="signup-select">
//             {pageSizeOptions.map(opt => (
//               <option key={opt} value={opt}>
//                 {opt} per page
//               </option>
//             ))}
//           </select>
//         </span>
//       </div>
//     </div>
//   );
// }
