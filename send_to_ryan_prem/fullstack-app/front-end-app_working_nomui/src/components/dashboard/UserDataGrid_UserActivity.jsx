import React, { useState, useEffect } from 'react';

export default function UserDataGrid_UserActivity({ rows = [] }) {
  const columns = [
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'title', headerName: 'Title', width: 250 },
    { field: 'defensenews_url', headerName: 'Defense News URL', width: 250 },
    { field: 'interaction_type', headerName: 'Interaction Type', width: 150 },
    { field: 'interaction_time', headerName: 'Interaction Time', width: 180 },
  ];

  // Function to generate a unique row id
  const getRowId = (row) =>
    row.interaction_id
      ? `${row.interaction_id}-${row.defensenews_url_id || 'null'}`
      : `${row.username}-${row.interaction_time}`;

  // Pagination state (1-indexed)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  // Selection state – stored as an array of unique row ids
  const [selectedRows, setSelectedRows] = useState([]);

  // Determine visible rows based on current pagination
  const startIdx = (page - 1) * pageSize;
  const currentRows = rows.slice(startIdx, startIdx + pageSize);

  // Toggle selection for an individual row
  const toggleRowSelection = (rowId) => {
    setSelectedRows((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // Toggle "select all" for the current page
  const toggleSelectAll = () => {
    const allSelected =
      currentRows.length > 0 &&
      currentRows.every((row) => selectedRows.includes(getRowId(row)));
    if (allSelected) {
      const newSelected = selectedRows.filter(
        (id) => !currentRows.some((row) => getRowId(row) === id)
      );
      setSelectedRows(newSelected);
    } else {
      const newSelected = [...selectedRows];
      currentRows.forEach((row) => {
        const rowId = getRowId(row);
        if (!newSelected.includes(rowId)) {
          newSelected.push(rowId);
        }
      });
      setSelectedRows(newSelected);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Handle page size change
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
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
        <thead>
          <tr style={{ backgroundColor: '#1f1f1f' }}>
            <th style={{ border: '1px solid #555', padding: '4px', textAlign: 'center' }}>
              <input
                type="checkbox"
                onChange={toggleSelectAll}
                checked={
                  currentRows.length > 0 &&
                  currentRows.every((row) => selectedRows.includes(getRowId(row)))
                }
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.field}
                style={{
                  width: col.width,
                  border: '1px solid #555',
                  padding: '4px',
                  textAlign: 'left',
                  backgroundColor: '#1f1f1f',
                }}
              >
                {col.headerName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.length > 0 ? (
            currentRows.map((row, index) => {
              const rowId = getRowId(row);
              return (
                <tr key={rowId} style={{ backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#242424' }}>
                  <td style={{ border: '1px solid #555', padding: '4px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rowId)}
                      onChange={() => toggleRowSelection(rowId)}
                    />
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.field}
                      style={{
                        border: '1px solid #555',
                        padding: '4px',
                        width: col.width,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row[col.field]}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td style={{ border: '1px solid #555', padding: '4px' }} colSpan={columns.length + 1}>
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
          <select className="signup-select" value={pageSize} onChange={handlePageSizeChange}>
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
        </span>
      </div>
    </div>
  );
}

// import * as React from 'react';
// import { DataGrid } from '@mui/x-data-grid';
// import Box from '@mui/material/Box';

// /**
//  * UserDataGrid_UserActivity
//  * A DataGrid displaying user activity in the office.
//  *
//  * Columns:
//  * - username: The user's name.
//  * - title: The article title from urls_content.
//  * - defensenews_url: The URL from defensenews_urls.
//  * - interaction_type: The type of interaction (click, add, bookmark, etc.).
//  * - interaction_time: The timestamp of the interaction.
//  *
//  * The row id is constructed by combining interaction_id and defensenews_url_id.
//  *
//  * @param {Array} rows - The data rows for the grid.
//  */
// export default function UserDataGrid_UserActivity({ rows = [] }) {
//   const columns = [
//     { field: 'username', headerName: 'Username', width: 150 },
//     { field: 'title', headerName: 'Title', width: 250 },
//     { field: 'defensenews_url', headerName: 'Defense News URL', width: 250 },
//     { field: 'interaction_type', headerName: 'Interaction Type', width: 150 },
//     { field: 'interaction_time', headerName: 'Interaction Time', width: 180 },
//   ];

//   return (
//     <Box>
//       <DataGrid
//         rows={rows}
//         columns={columns}
//         getRowId={(row) =>
//           row.interaction_id
//             ? `${row.interaction_id}-${row.defensenews_url_id || 'null'}`
//             : `${row.username}-${row.interaction_time}`
//         }
//         checkboxSelection
//         initialState={{
//           pagination: { paginationModel: { pageSize: 20 } },
//         }}
//         pageSizeOptions={[10, 20, 50]}
//         disableColumnResize
//         density="compact"
//       />
//     </Box>
//   );
// }
