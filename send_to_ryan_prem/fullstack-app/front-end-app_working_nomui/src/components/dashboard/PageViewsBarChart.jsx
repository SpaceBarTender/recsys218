import * as React from 'react';
import axios from 'axios';

// A custom bar chart component built with SVG to mimic the Material UI x-charts bar chart.
function CustomBarChart({ width, height, margin, xAxisData, redData, greenData, yDomain }) {
  const effWidth = width - margin.left - margin.right;
  const effHeight = height - margin.top - margin.bottom;
  const xCount = xAxisData.length;
  const xStep = xCount > 0 ? effWidth / xCount : 0;
  const bandGapRatio = 0.4; // mimics categoryGapRatio in the original
  const bandWidth = xStep * (1 - bandGapRatio);
  const yMax = yDomain[1]; // assuming yDomain is [min, max], e.g., [0, 1]

  // Generate y-axis grid lines and labels (ticks at every 0.2 increment up to yMax)
  const tickInterval = 0.2;
  const yTicks = [];
  for (let t = 0; t <= yMax; t += tickInterval) {
    yTicks.push(parseFloat(t.toFixed(2)));
  }

  return (
    <svg width={width} height={height}>
      {/* Horizontal grid lines */}
      {yTicks.map((tick) => {
        const yPos = margin.top + effHeight - (tick / yMax) * effHeight;
        return (
          <line
            key={'grid-' + tick}
            x1={margin.left}
            y1={yPos}
            x2={width - margin.right}
            y2={yPos}
            stroke="rgba(255,255,255,0.2)"
          />
        );
      })}
      {/* Y-axis labels */}
      {yTicks.map((tick) => {
        const yPos = margin.top + effHeight - (tick / yMax) * effHeight;
        return (
          <text
            key={'yLabel-' + tick}
            x={margin.left - 5}
            y={yPos + 3} // slight vertical adjustment
            fontSize="10"
            fill="rgba(255,255,255,0.87)"
            textAnchor="end"
          >
            {tick}
          </text>
        );
      })}

      {/* X-axis line */}
      <line
        x1={margin.left}
        y1={margin.top + effHeight}
        x2={width - margin.right}
        y2={margin.top + effHeight}
        stroke="rgba(255,255,255,0.87)"
      />

      {/* Bars and x-axis labels */}
      {xAxisData.map((label, i) => {
        // Retrieve values from both series. Since they are mutually exclusive in our setup, we can stack them.
        const redVal = redData[i] != null ? redData[i] : 0;
        const greenVal = greenData[i] != null ? greenData[i] : 0;
        const redHeight = (redVal / yMax) * effHeight;
        const greenHeight = (greenVal / yMax) * effHeight;
        const totalHeight = redHeight + greenHeight;
        // Calculate x-position: center the bar in its band.
        const xPos = margin.left + i * xStep + (xStep - bandWidth) / 2;
        // Build red (bottom) and green (stacked above) segments.
        const redY = margin.top + effHeight - redHeight;
        const greenY = margin.top + effHeight - totalHeight;

        return (
          <g key={'bar-' + i}>
            {redVal > 0 && (
              <rect
                x={xPos}
                y={redY}
                width={bandWidth}
                height={redHeight}
                fill="red"
              />
            )}
            {greenVal > 0 && (
              <rect
                x={xPos}
                y={greenY}
                width={bandWidth}
                height={greenHeight}
                fill="green"
              />
            )}
            {/* X-axis label */}
            <text
              x={xPos + bandWidth / 2}
              y={height - margin.bottom + 15}
              fontSize="10"
              fill="rgba(255,255,255,0.87)"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PageViewsBarChart() {
  const [xAxisUrls, setXAxisUrls] = React.useState([]);  // Array of url_id, sorted by rank
  const [redData, setRedData] = React.useState([]);       // For CTR=0 (red bars)
  const [greenData, setGreenData] = React.useState([]);     // For CTR>0 (green bars)
  const [totalViews, setTotalViews] = React.useState(0);    // Total CTR value (for display)

  // Memoized fetchData; stable between renders.
  const fetchData = React.useCallback(() => {
    const token = localStorage.getItem("session_token") || "";
    const headers = { Authorization: token };

    Promise.all([
      axios.get("/api/mab_rank_logs", { headers }),
      axios.get("/api/user_mab_stats", { headers }), //switch to office_mab_stats for office-wide visualization
    ]) // replace all user stats related variables wtih office for office-wide visualization
      .then(([logsResp, statsResp]) => {
        const mabLogs = logsResp.data.mab_rank_logs || [];
        const userStats = statsResp.data.user_mab_stats || [];

        // Map from url_id to its lowest rank_position.
        const rankMap = {};
        mabLogs.forEach((row) => {
          const { url_id, rank_position } = row;
          if (!(url_id in rankMap) || rank_position < rankMap[url_id]) {
            rankMap[url_id] = rank_position;
          }
        });

        // Map from url_id to its maximum CTR (converted to number).
        const ctrMap = {};
        userStats.forEach((row) => {
          const { url_id, user_ctr } = row;
          const ctrValue = Number(user_ctr);
          if (!(url_id in ctrMap)) {
            ctrMap[url_id] = ctrValue;
          } else {
            ctrMap[url_id] = Math.max(ctrMap[url_id], ctrValue);
          }
        });

        // Sort url_ids based on rank.
        const sortedUrls = Object.keys(rankMap).sort(
          (a, b) => rankMap[a] - rankMap[b]
        );

        // Prepare data arrays for the custom bar chart.
        // For articles with 0 CTR, use a minimal value for redData.
        const redSeries = [];
        const greenSeries = [];
        let total = 0;
        sortedUrls.forEach((u) => {
          const val = Number(ctrMap[u]) || 0;
          if (val === 0) {
            redSeries.push(0.01);
            greenSeries.push(null);
          } else {
            redSeries.push(null);
            greenSeries.push(val);
          }
          total += val;
        });

        setXAxisUrls(sortedUrls);
        setRedData(redSeries);
        setGreenData(greenSeries);
        setTotalViews(total.toFixed(1));
      })
      .catch((err) => {
        console.error("Error fetching data for bar chart:", err);
      });
  }, []); // No dependencies

  // Polling every 1 second.
  React.useEffect(() => {
    console.log("Setting interval for fetchData");
    fetchData(); // Initial fetch
    const interval = setInterval(() => {
      console.log("Polling fetchData");
      fetchData();
    }, 1000);
    return () => {
      console.log("Clearing interval for fetchData");
      clearInterval(interval);
    };
  }, [fetchData]);

  // Determine dynamic width based on the number of x-axis items.
  const barWidth = 20;
  const dynamicWidth = Math.max(800, xAxisUrls.length * barWidth);

  // Chart dimensions and margin settings.
  const chartHeight = 300;
  const margin = { left: 50, right: 10, top: 20, bottom: 40 };
  const yDomain = [0, 1];

  return (
    <div style={{ width: '100%', marginTop: '8px', border: '1px solid #646cff', borderRadius: '4px', backgroundColor: '#242424' }}>
      <div style={{ padding: '16px', color: 'rgba(255,255,255,0.87)' }}>
        {/* Uncomment below to show header and total views if desired */}
        {/*
        <h2 style={{ margin: 0, fontSize: '1rem' }}>CTR by URL (Ordered by Rank)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <p style={{ fontSize: '1.5rem', margin: 0 }}>{totalViews}</p>
          <span style={{ padding: '2px 6px', background: '#4caf50', color: '#fff', borderRadius: '4px', fontSize: '0.75rem' }}>
            +12%
          </span>
        </div>
        <p style={{ color: '#bbb', fontSize: '0.75rem' }}>
          Sum of CTR values for demonstration
        </p>
        */}
        {/* Outer container with horizontal scrolling */}
        <div style={{ marginTop: '16px', overflowX: 'auto' }}>
          {/* Inner container with dynamic width */}
          <div style={{ width: dynamicWidth }}>
            <CustomBarChart
              width={dynamicWidth}
              height={chartHeight}
              margin={margin}
              xAxisData={xAxisUrls}
              redData={redData}
              greenData={greenData}
              yDomain={yDomain}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


// import * as React from 'react';
// import Card from '@mui/material/Card';
// import CardContent from '@mui/material/CardContent';
// import Chip from '@mui/material/Chip';
// import Typography from '@mui/material/Typography';
// import Stack from '@mui/material/Stack';
// import Box from '@mui/material/Box';
// import { BarChart } from '@mui/x-charts/BarChart';
// import { useTheme } from '@mui/material/styles';
// import axios from 'axios';

// export default function PageViewsBarChart() {
//   const [xAxisUrls, setXAxisUrls] = React.useState([]);  // Array of url_id, sorted by rank
//   const [redData, setRedData] = React.useState([]);       // For CTR=0 (red bars)
//   const [greenData, setGreenData] = React.useState([]);     // For CTR>0 (green bars)
//   const [totalViews, setTotalViews] = React.useState(0);    // Total CTR value (for display)

//   const theme = useTheme();

//   // Memoize fetchData so that it is stable between renders.
//   const fetchData = React.useCallback(() => {
//     const token = localStorage.getItem("session_token") || "";
//     const headers = { Authorization: token };

//     Promise.all([
//       axios.get("/api/mab_rank_logs", { headers }),
//       axios.get("/api/office_mab_stats", { headers }),
//     ])
//       .then(([logsResp, statsResp]) => {
//         const mabLogs = logsResp.data.mab_rank_logs || [];
//         const officeStats = statsResp.data.office_mab_stats || [];

//         // Build a mapping from url_id to the lowest rank_position.
//         const rankMap = {};
//         mabLogs.forEach((row) => {
//           const { url_id, rank_position } = row;
//           if (!(url_id in rankMap) || rank_position < rankMap[url_id]) {
//             rankMap[url_id] = rank_position;
//           }
//         });

//         // Build a mapping from url_id to the maximum CTR, converting values to numbers.
//         const ctrMap = {};
//         officeStats.forEach((row) => {
//           const { url_id, office_ctr } = row;
//           const ctrValue = Number(office_ctr);
//           if (!(url_id in ctrMap)) {
//             ctrMap[url_id] = ctrValue;
//           } else {
//             ctrMap[url_id] = Math.max(ctrMap[url_id], ctrValue);
//           }
//         });

//         // Sort the url_ids by their rank.
//         const sortedUrls = Object.keys(rankMap).sort(
//           (a, b) => rankMap[a] - rankMap[b]
//         );

//         // Build the data arrays for the bar chart.
//         // For articles with 0 CTR, push a default 0.1 for the red series to ensure the bar is visible.
//         const redSeries = [];
//         const greenSeries = [];
//         let total = 0;
//         sortedUrls.forEach((u) => {
//           const val = Number(ctrMap[u]) || 0;
//           if (val === 0) {
//             redSeries.push(0.01);
//             greenSeries.push(null);
//           } else {
//             redSeries.push(null);
//             greenSeries.push(val);
//           }
//           total += val;
//         });

//         setXAxisUrls(sortedUrls);
//         setRedData(redSeries);
//         setGreenData(greenSeries);
//         setTotalViews(total.toFixed(1));
//       })
//       .catch((err) => {
//         console.error("Error fetching data for bar chart:", err);
//       });
//   }, []); // No dependencies, so this function remains stable

//   // Set up polling with a 10-second interval.
//   React.useEffect(() => {
//     console.log("Setting interval for fetchData");
//     fetchData(); // Initial fetch
//     const interval = setInterval(() => {
//       console.log("Polling fetchData");
//       fetchData();
//     }, 1000); // 1 seconds
//     return () => {
//       console.log("Clearing interval for fetchData");
//       clearInterval(interval);
//     };
//   }, [fetchData]);

//   // Calculate dynamic width based on the number of x-axis items.
//   const barWidth = 20;
//   const dynamicWidth = Math.max(800, xAxisUrls.length * barWidth);

//   return (
//     <Card variant="outlined" sx={{ width: '100%' }}>
//       <CardContent>
//        {/* <Typography component="h2" variant="subtitle2" gutterBottom>
//           CTR by URL (Ordered by Rank)
//         </Typography>
//         <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
//           <Typography variant="h4" component="p">
//             {totalViews}
//           </Typography>
//           <Chip size="small" color="success" label="+12%" />
//         </Stack>
//         <Typography variant="caption" sx={{ color: 'text.secondary' }}>
//           Sum of CTR values for demonstration
//         </Typography> */}
//         {/* Outer container with horizontal scrolling */}
//         <Box sx={{ mt: 2, overflowX: 'auto' }}>
//           {/* Inner container with dynamic width */}
//           <Box sx={{ width: dynamicWidth }}>
//             <BarChart
//               height={300}
//               margin={{ left: 50, right: 10, top: 20, bottom: 40 }}
//               xAxis={[
//                 {
//                   scaleType: 'band',
//                   categoryGapRatio: 0.4,
//                   data: xAxisUrls,
//                 },
//               ]}
//               yAxis={[
//                 {
//                   domain: [0, 5],
//                 },
//               ]}
//               series={[
//                 {
//                   id: 'zero-ctr',
//                   label: 'CTR=0',
//                   data: redData,
//                   stack: 'ctrStack',
//                   color: 'red',
//                 },
//                 {
//                   id: 'nonzero-ctr',
//                   label: 'CTR>0',
//                   data: greenData,
//                   stack: 'ctrStack',
//                   color: 'green',
//                 },
//               ]}
//               grid={{ horizontal: true }}
//               slotProps={{
//                 legend: { hidden: true },
//               }}
//             />
//           </Box>
//         </Box>
//       </CardContent>
//     </Card>
//   );
// }
