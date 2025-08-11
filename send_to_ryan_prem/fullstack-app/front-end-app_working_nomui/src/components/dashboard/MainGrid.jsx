import React, { useEffect, useState } from "react";
import axios from "axios";

import CustomizedDataGridModel from "./CustomizedDataGridModel";
import CustomizedDataGrid_OfficeMabStats from "./CustomizedDataGrid_OfficeMabStats";
import PageViewsBarChart from "./PageViewsBarChart";

export default function MainGrid() {
  const [mabRankLogs, setMabRankLogs] = useState([]);
  const [officeMabStats, setOfficeMabStats] = useState([]);

  // Poll MAB Rank Logs every 10 seconds.
  useEffect(() => {
    const token = localStorage.getItem("session_token") || "";
    const headers = { Authorization: token };

    const fetchMabRankLogs = () => {
      axios
        .get(`/api/mab_rank_logs?cb=${new Date().getTime()}`, { headers })
        .then((response) => {
          setMabRankLogs(response.data.mab_rank_logs || []);
        })
        .catch((error) => console.error("Error fetching MAB Rank Logs:", error));
    };

    fetchMabRankLogs(); // Initial fetch
    const rankLogsInterval = setInterval(fetchMabRankLogs, 10000); // 10-second polling
    return () => clearInterval(rankLogsInterval);
  }, []);

  // Poll Office MAB Stats every 10 seconds.
  useEffect(() => {
    const token = localStorage.getItem("session_token") || "";
    const headers = { Authorization: token };

    const fetchOfficeStats = () => {
      axios
        .get(`/api/office_mab_stats?cb=${new Date().getTime()}`, { headers })
        .then((response) => {
          setOfficeMabStats(response.data.office_mab_stats || []);
        })
        .catch((error) => console.error("Error fetching Office MAB Stats:", error));
    };

    fetchOfficeStats(); // Initial fetch
    const officeStatsInterval = setInterval(fetchOfficeStats, 10000); // 10-second polling
    return () => clearInterval(officeStatsInterval);
  }, []);

  // Define a fixed width for the tables and chart container.
  const fixedWidth = 1000;

  // Dark theme styles aligned with index.css
  const containerStyle = {
    marginTop: "80px",
    color: "rgba(255, 255, 255, 0.87)"
  };

  const sectionStyle = {
    marginBottom: "24px"
  };

  const headerStyle = {
    marginBottom: "8px",
    textAlign: "center",
    fontSize: "1.25em",
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.87)"
  };

  const boxWithPaddingStyle = {
    width: `${fixedWidth}px`,
    margin: "0 auto",
    overflow: "auto",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "16px",
    position: "relative",
    backgroundColor: "#333"
  };

  const boxStyle = {
    width: `${fixedWidth}px`,
    margin: "0 auto",
    maxHeight: "400px",
    overflow: "auto",
    border: "1px solid #444",
    borderRadius: "4px",
    backgroundColor: "#333"
  };

  return (
    <div style={containerStyle}>
      {/* ----------- Bar Chart Visualization (Top) ----------- */}
      <div style={sectionStyle}>
        <div style={headerStyle}>CTR by URL (Ordered by Rank Position)</div>
        <div style={boxWithPaddingStyle}>
          <PageViewsBarChart />
        </div>
      </div>

      {/* ----------- Office MAB Stats Table (Second) ----------- */}
      <div style={sectionStyle}>
        <div style={headerStyle}>Office MAB Stats</div>
        <div style={boxStyle}>
          <CustomizedDataGrid_OfficeMabStats rows={officeMabStats} />
        </div>
      </div>

      {/* ----------- MAB Rank Logs Table (Third) ----------- */}
      <div style={sectionStyle}>
        <div style={headerStyle}>MAB Rank Logs</div>
        <div style={boxStyle}>
          <CustomizedDataGridModel rows={mabRankLogs} />
        </div>
      </div>
    </div>
  );
}

// import * as React from 'react';
// import Grid from '@mui/material/Grid';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import { useEffect, useState } from "react";
// import axios from "axios";

// import CustomizedDataGridModel from './CustomizedDataGridModel';
// import CustomizedDataGrid_OfficeMabStats from './CustomizedDataGrid_OfficeMabStats';
// import PageViewsBarChart from './PageViewsBarChart';

// export default function MainGrid() {
//   const [mabRankLogs, setMabRankLogs] = useState([]);
//   const [officeMabStats, setOfficeMabStats] = useState([]);

//   // Poll MAB Rank Logs every 10 seconds.
//   useEffect(() => {
//     const token = localStorage.getItem("session_token") || "";
//     const headers = { Authorization: token };

//     const fetchMabRankLogs = () => {
//       axios
//         .get(`/api/mab_rank_logs?cb=${new Date().getTime()}`, { headers })
//         .then((response) => {
//           setMabRankLogs(response.data.mab_rank_logs || []);
//         })
//         .catch((error) => console.error("Error fetching MAB Rank Logs:", error));
//     };

//     fetchMabRankLogs(); // Initial fetch
//     const rankLogsInterval = setInterval(fetchMabRankLogs, 10000); // 10-second polling
//     return () => clearInterval(rankLogsInterval);
//   }, []);

//   // Poll Office MAB Stats every 10 seconds.
//   useEffect(() => {
//     const token = localStorage.getItem("session_token") || "";
//     const headers = { Authorization: token };

//     const fetchOfficeStats = () => {
//       axios
//         .get(`/api/office_mab_stats?cb=${new Date().getTime()}`, { headers })
//         .then((response) => {
//           setOfficeMabStats(response.data.office_mab_stats || []);
//         })
//         .catch((error) => console.error("Error fetching Office MAB Stats:", error));
//     };

//     fetchOfficeStats(); // Initial fetch
//     const officeStatsInterval = setInterval(fetchOfficeStats, 10000); // 10-second polling
//     return () => clearInterval(officeStatsInterval);
//   }, []);

//   // Define a fixed width for the tables and chart container.
//   const fixedWidth = 1000;

//   return (
//     <Grid container spacing={3} sx={{ mt: 4 }}>
//       {/* ----------- Bar Chart Visualization (Top) ----------- */}
//       <Grid item xs={12}>
//         <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
//           CTR by URL (Ordered by Rank Position)
//         </Typography>
//         <Box
//           sx={{
//             width: fixedWidth,
//             mx: 'auto',
//             overflow: 'auto',
//             border: '1px solid #ccc',
//             borderRadius: 1,
//             p: 2,
//             position: 'relative',
//           }}
//         >
//           <PageViewsBarChart />
//         </Box>
//       </Grid>

//       {/* ----------- Office MAB Stats Table (Second) ----------- */}
//       <Grid item xs={12}>
//         <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
//           Office MAB Stats
//         </Typography>
//         <Box
//           sx={{
//             width: fixedWidth,
//             mx: 'auto',
//             maxHeight: 400,
//             overflow: 'auto',
//             border: '1px solid #ccc',
//             borderRadius: 1,
//           }}
//         >
//           <CustomizedDataGrid_OfficeMabStats rows={officeMabStats} />
//         </Box>
//       </Grid>

//       {/* ----------- MAB Rank Logs Table (Third) ----------- */}
//       <Grid item xs={12}>
//         <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
//           MAB Rank Logs
//         </Typography>
//         <Box
//           sx={{
//             width: fixedWidth,
//             mx: 'auto',
//             maxHeight: 400,
//             overflow: 'auto',
//             border: '1px solid #ccc',
//             borderRadius: 1,
//           }}
//         >
//           <CustomizedDataGridModel rows={mabRankLogs} />
//         </Box>
//       </Grid>
//     </Grid>
//   );
// }

