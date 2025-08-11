import React, { useState, useMemo } from 'react';

export default function CustomizedDataGrid_OfficeMabStats({ rows = [] }) {
  // Define columns that mirror the aggregated data structure
  const columns = [
    { field: 'url_id', headerName: 'URL ID', width: 80 },
    { field: 'total_clicks', headerName: 'Clicks', width: 80 },
    { field: 'total_impressions', headerName: 'Impressions', width: 110 },
    { field: 'office_ctr', headerName: 'CTR', width: 80 },
    { field: 'total_bookmarks', headerName: 'Bookmarks', width: 110 },
    { field: 'total_adds', headerName: 'Adds', width: 80 },
  ];

  // Function to uniquely identify a row
  function getRowId(row) {
    return row.url_id;
  }

  // Default pagination and page size options (mimicking the MUI defaults)
  const defaultPageSize = 10;
  const pageSizeOptions = [10, 20, 50];

  // Component state for pagination, selection, and filtering (to mimic CustomizedDataGridModel.jsx)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Filter rows if a filter is active
  const filteredRows = useMemo(() => {
    if (filterColumn && filterValue) {
      return rows.filter((row) => {
        const cellValue = row[filterColumn];
        return cellValue != null && cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    }
    return rows;
  }, [rows, filterColumn, filterValue]);

  // Determine paging parameters
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const currentRows = filteredRows.slice(startIdx, startIdx + pageSize);

  // Toggle selection for an individual row
  const toggleRowSelection = (rowId) => {
    setSelectedRows((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // Toggle "select all" for the current page
  const toggleSelectAll = () => {
    const allSelected =
      currentRows.length > 0 && currentRows.every((row) => selectedRows.includes(getRowId(row)));
    if (allSelected) {
      // Remove the visible rows from selection
      setSelectedRows((prev) =>
        prev.filter((id) => !currentRows.some((row) => getRowId(row) === id))
      );
    } else {
      // Add any unselected visible row to selection
      const newSelected = [...selectedRows];
      currentRows.forEach((row) => {
        const id = getRowId(row);
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedRows(newSelected);
    }
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Handle page size changes
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
      {/* Filter Toggle */}
      <button onClick={() => setFilterVisible((prev) => !prev)}>
        {filterVisible ? 'Hide Filter' : 'Show Filter'}
      </button>

      {/* Filter Panel */}
      {filterVisible && (
        <div
          style={{
            margin: '10px 0',
            padding: '8px',
            border: '1px solid #555',
            backgroundColor: '#2a2a2a',
          }}
        >
          <label>
            Column:&nbsp;
            <select
              className="signup-select"
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
            >
              <option value="">Select column</option>
              {columns.map((col) => (
                <option key={col.field} value={col.field}>
                  {col.headerName}
                </option>
              ))}
            </select>
          </label>
          &nbsp;&nbsp;
          <label>
            Value:&nbsp;
            <input
              type="text"
              value={filterValue}
              placeholder="Filter value"
              onChange={(e) => setFilterValue(e.target.value)}
              style={{
                backgroundColor: '#242424',
                color: 'rgba(255, 255, 255, 0.87)',
                border: '1px solid #646cff',
                borderRadius: '4px',
                padding: '4px',
              }}
            />
          </label>
        </div>
      )}

      {/* Data Grid Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
        <thead>
          <tr style={{ backgroundColor: '#1f1f1f' }}>
            <th style={{ border: '1px solid #555', padding: '4px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={
                  currentRows.length > 0 &&
                  currentRows.every((row) => selectedRows.includes(getRowId(row)))
                }
                onChange={toggleSelectAll}
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
          {currentRows.map((row, index) => (
            <tr key={getRowId(row)} style={{ backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#242424' }}>
              <td style={{ border: '1px solid #555', padding: '4px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(getRowId(row))}
                  onChange={() => toggleRowSelection(getRowId(row))}
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
          ))}
          {currentRows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} style={{ padding: '8px', textAlign: 'center' }}>
                No data available.
              </td>
            </tr>
          )}
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

// export default function CustomizedDataGrid_OfficeMabStats({ rows = [] }) {
//   // Updated columns to match the aggregated data (grouped only by url_id)
//   const columns = [
//     { field: 'url_id', headerName: 'URL ID', width: 80 },
//     { field: 'total_clicks', headerName: 'Clicks', width: 80 },
//     { field: 'total_impressions', headerName: 'Impressions', width: 110 },
//     { field: 'office_ctr', headerName: 'CTR', width: 80 },
//     { field: 'total_bookmarks', headerName: 'Bookmarks', width: 110 },
//     { field: 'total_adds', headerName: 'Adds', width: 80 },
//   ];

//   // Use url_id as the unique row key
//   function getRowId(row) {
//     return row.url_id;
//   }

//   return (
//     <Box sx={{ width: '100%', height: '100%' }}>
//       <DataGrid
//         rows={rows}
//         columns={columns}
//         getRowId={getRowId}
//         checkboxSelection
//         disableColumnResize
//         density="compact"
//         pageSizeOptions={[10, 20, 50]}
//         initialState={{
//           pagination: { paginationModel: { pageSize: 10 } },
//         }}
//       />
//     </Box>
//   );
// }
