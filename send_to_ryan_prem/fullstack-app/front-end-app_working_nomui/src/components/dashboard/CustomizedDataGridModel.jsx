import React, { useState, useMemo } from 'react';

export default function CustomizedDataGrid({ rows = [] }) {
  // Define column configuration as before
  const columns = [
    { field: 'mab_rank_log_id', headerName: 'Log ID', width: 90 },
    { field: 'created_at', headerName: 'Created At', width: 160 },
    { field: 'office_id', headerName: 'Office ID', width: 220 },
    { field: 'user_id', headerName: 'User ID', width: 220 },
    { field: 'session_id', headerName: 'Session ID', width: 220 },
    { field: 'url_id', headerName: 'URL ID', width: 70 },
    { field: 'rank_position', headerName: 'Rank', width: 70 },
    { field: 'impressions_count', headerName: 'Impr.', width: 80 },
    { field: 'clicks_count', headerName: 'Clicks', width: 80 },
    { field: 'ucb_value', headerName: 'UCB', width: 80 },
    { field: 'time_index_t', headerName: 'Time Index', width: 100 },
    { field: 'c_param', headerName: 'C Param', width: 80 },
    { field: 'cold_threshold', headerName: 'Cold Thr.', width: 100 },
    {
      field: 'filter_topics',
      headerName: 'Filter Topics',
      width: 180,
      // Optionally, you could join an array here as: row.filter_topics.join(", ")
    },
    { field: 'filter_date', headerName: 'Filter Date', width: 120 },
  ];

  // Default pagination and page size options (mimicking the MUI defaults)
  const defaultPageSize = 20;
  const pageSizeOptions = [10, 20, 50];

  // State for pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  // State for row selection (storing selected row ids)
  const [selectedRows, setSelectedRows] = useState([]);
  // State for a simple filter panel
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

  // Toggle "select all" (for the current page)
  const toggleSelectAll = () => {
    const allSelected = currentRows.every((row) =>
      selectedRows.includes(row.mab_rank_log_id)
    );
    if (allSelected) {
      // Unselect all rows on this page
      const newSelected = selectedRows.filter(
        (id) => !currentRows.some((row) => row.mab_rank_log_id === id)
      );
      setSelectedRows(newSelected);
    } else {
      // Add all rows on this page to selection
      const newSelected = [...selectedRows];
      currentRows.forEach((row) => {
        if (!newSelected.includes(row.mab_rank_log_id)) {
          newSelected.push(row.mab_rank_log_id);
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
    <div style={{ 
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      backgroundColor: '#242424',
      color: 'rgba(255, 255, 255, 0.87)',
      padding: '16px'
    }}>
      {/* Filter Toggle */}
      <button onClick={() => setFilterVisible((prev) => !prev)}>
        {filterVisible ? 'Hide Filter' : 'Show Filter'}
      </button>

      {/* Filter Panel */}
      {filterVisible && (
        <div style={{ 
          margin: '10px 0', 
          padding: '8px', 
          border: '1px solid #555', 
          backgroundColor: '#2a2a2a'
        }}>
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
            <th style={{ border: '1px solid #555', padding: '4px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={
                  currentRows.length > 0 &&
                  currentRows.every((row) => selectedRows.includes(row.mab_rank_log_id))
                }
                onChange={toggleSelectAll}
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.field}
                style={{
                  width: column.width,
                  border: '1px solid #555',
                  padding: '4px',
                  textAlign: 'left',
                  backgroundColor: '#1f1f1f'
                }}
              >
                {column.headerName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, index) => (
            <tr
              key={row.mab_rank_log_id}
              className={index % 2 === 0 ? 'even' : 'odd'}
              style={{ backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#242424' }}
            >
              <td style={{ border: '1px solid #555', padding: '4px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(row.mab_rank_log_id)}
                  onChange={() => toggleRowSelection(row.mab_rank_log_id)}
                />
              </td>
              {columns.map((column) => (
                <td
                  key={column.field}
                  style={{
                    border: '1px solid #555',
                    padding: '4px',
                    width: column.width,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row[column.field]}
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

// export default function CustomizedDataGrid({ rows = [] }) {
//   const columns = [
//     { field: 'mab_rank_log_id', headerName: 'Log ID', width: 90 },
//     { field: 'created_at', headerName: 'Created At', width: 160 },
//     { field: 'office_id', headerName: 'Office ID', width: 220 },
//     { field: 'user_id', headerName: 'User ID', width: 220 },
//     { field: 'session_id', headerName: 'Session ID', width: 220 },
//     { field: 'url_id', headerName: 'URL ID', width: 70 },
//     { field: 'rank_position', headerName: 'Rank', width: 70 },
//     { field: 'impressions_count', headerName: 'Impr.', width: 80 },
//     { field: 'clicks_count', headerName: 'Clicks', width: 80 },
//     { field: 'ucb_value', headerName: 'UCB', width: 80 },
//     { field: 'time_index_t', headerName: 'Time Index', width: 100 },
//     { field: 'c_param', headerName: 'C Param', width: 80 },
//     { field: 'cold_threshold', headerName: 'Cold Thr.', width: 100 },
//     {
//       field: 'filter_topics',
//       headerName: 'Filter Topics',
//       width: 180,
//       // If you'd like to display the array as a comma-separated string:
//       // valueGetter: (params) => params.value?.join(", "),
//     },
//     { field: 'filter_date', headerName: 'Filter Date', width: 120 },
//   ];

//   return (
//     <DataGrid
//       rows={rows}
//       columns={columns}
//       getRowId={(row) => row.mab_rank_log_id}
//       checkboxSelection
//       getRowClassName={(params) =>
//         params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
//       }
//       initialState={{
//         pagination: { paginationModel: { pageSize: 20 } },
//       }}
//       pageSizeOptions={[10, 20, 50]}
//       disableColumnResize
//       density="compact"
//       slotProps={{
//         filterPanel: {
//           filterFormProps: {
//             logicOperatorInputProps: {
//               variant: 'outlined',
//               size: 'small',
//             },
//             columnInputProps: {
//               variant: 'outlined',
//               size: 'small',
//               sx: { mt: 'auto' },
//             },
//             operatorInputProps: {
//               variant: 'outlined',
//               size: 'small',
//               sx: { mt: 'auto' },
//             },
//             valueInputProps: {
//               InputComponentProps: {
//                 variant: 'outlined',
//                 size: 'small',
//               },
//             },
//           },
//         },
//       }}
//     />
//   );
// }
