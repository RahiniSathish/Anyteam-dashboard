const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Google Sheets configuration - Using public CSV export (no credentials needed!)
const SPREADSHEET_ID = '1cEoULby4Ye6ul5wsTCHSdT8eL93qJks2KNmIP6hK_Ko';
const SMOKE_TEST_GID = '954974616';      // Smoke Test - Happy Path Scenarios
const REGRESSION_TEST_GID = '1915752702'; // Regression Test

// Fetch data from Google Sheets as CSV (public access, no authentication needed)
async function fetchSheetDataAsCSV(gid) {
  return new Promise((resolve, reject) => {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

    https.get(url, (response) => {
      let data = '';

      // Handle redirect (301, 302, 307, 308)
      if (response.statusCode === 301 || response.statusCode === 302 ||
          response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        const protocol = redirectUrl.startsWith('https') ? https : require('http');
        protocol.get(redirectUrl, (redirectResponse) => {
          let redirectData = '';
          redirectResponse.on('data', (chunk) => redirectData += chunk);
          redirectResponse.on('end', () => resolve(parseCSV(redirectData)));
          redirectResponse.on('error', reject);
        }).on('error', reject);
        return;
      }

      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(parseCSV(data));
        } else {
          reject(new Error(`Failed to fetch sheet. Status: ${response.statusCode}. Make sure your Google Sheet is published or set to "Anyone with the link can view"`));
        }
      });
    }).on('error', reject);
  });
}

// Simple CSV parser
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length === 0) {
    return { headers: [], data: [] };
  }

  // Parse all lines first
  const parseLine = (line) => {
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim().replace(/^"|"$/g, ''));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim().replace(/^"|"$/g, ''));
    return fields;
  };

  const allRows = lines.map(parseLine);

  // Find the first non-empty row with meaningful headers
  let headerRowIndex = -1;
  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    const hasContent = row.some(cell => cell && cell.length > 0);
    const hasHeaderKeywords = row.some(cell => {
      const lower = cell.toLowerCase();
      return (lower.includes('feature') && !lower.includes('automation')) ||
             (lower.includes('test') && lower.includes('case')) ||
             lower.includes('stor') ||
             lower.includes('prior') ||
             lower.includes('comment');
    });

    if (hasContent && hasHeaderKeywords) {
      headerRowIndex = i;
      break;
    }
  }

  // If no header row found, use first non-empty row
  if (headerRowIndex === -1) {
    headerRowIndex = allRows.findIndex(row => row.some(cell => cell && cell.length > 0));
  }

  const headers = headerRowIndex >= 0 ? allRows[headerRowIndex] : [];
  const data = allRows.slice(headerRowIndex + 1);

  return { headers, data };
}

// Process SMOKE TEST data - Comprehensive analysis with all columns
function processSmokeTestData(headers, data) {
  const metrics = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    passRate: 0,
    totalManual: 0,
    totalAutomated: 0,
    totalTestCases: 0,
    testsByModule: {},
    automationByModule: {},
    statusBreakdown: { done: 0, inprogress: 0, 'yet to start': 0, other: 0 },
    featureDetails: [],
    testsByPriority: {},
    recentTests: []
  };

  // Find column indices - more flexible matching
  const featureIdx = headers.findIndex(h => h.toLowerCase().includes('feature'));
  const testCaseIdx = headers.findIndex(h => {
    const lower = h.toLowerCase();
    return (lower.includes('test') && lower.includes('case')) || lower.includes('test cases') || lower.includes('test. cases');
  });
  const manualIdx = headers.findIndex(h => {
    const lower = h.toLowerCase();
    return (lower.includes('manual') && (lower.includes('tc') || lower.includes('case'))) || 
           lower === 'manual tcs' || lower === 'manual tc';
  });
  const automatedIdx = headers.findIndex(h => {
    const lower = h.toLowerCase();
    return (lower.includes('automated') && (lower.includes('tc') || lower.includes('case'))) ||
           lower === 'automated tcs' || lower === 'automated tc';
  });
  const automationPercentIdx = headers.findIndex(h => {
    const lower = h.toLowerCase();
    return lower.includes('automation') || lower.includes('%');
  });
  const commentsIdx = headers.findIndex(h => h.toLowerCase().includes('comment'));

  let currentFeature = '';

  data.forEach((row, index) => {
    // Skip completely empty rows
    if (!row || row.length === 0 || row.every(cell => !cell || cell.trim() === '')) {
      return;
    }

    // Skip header rows
    const rowText = row.join(' ').toLowerCase();
    if (rowText.includes('smoke test') || rowText.includes('automation status') || 
        rowText.includes('features') && rowText.includes('test cases')) {
      return;
    }

    const feature = featureIdx >= 0 ? (row[featureIdx] || '').trim() : '';
    const testCase = testCaseIdx >= 0 ? (row[testCaseIdx] || '').trim() : '';
    const manualCount = manualIdx >= 0 ? (parseInt(row[manualIdx]) || 0) : 0;
    const automatedCount = automatedIdx >= 0 ? (parseInt(row[automatedIdx]) || 0) : 0;
    const automationStatus = automationPercentIdx >= 0 ? (row[automationPercentIdx] || '').toLowerCase().trim() : '';
    const comments = commentsIdx >= 0 ? (row[commentsIdx] || '').trim() : '';

    // Update current feature if this row has one
    if (feature && feature.length > 0) {
      currentFeature = feature;
    }

    // Skip if no meaningful data (no test case, no manual, no automated)
    if (!testCase && manualCount === 0 && automatedCount === 0) {
      return;
    }

    const totalCases = manualCount + automatedCount;
    if (totalCases === 0 && !testCase) {
      return;
    }

    metrics.total++;
    metrics.totalManual += manualCount;
    metrics.totalAutomated += automatedCount;
    metrics.totalTestCases += totalCases;

    // Determine status from Automation% column
    let status = automationStatus || '';
    if (!status && comments) {
      status = comments.toLowerCase();
    }

    // Count statuses
    if (status.includes('done') || status.includes('completed')) {
      metrics.passed++;
      metrics.statusBreakdown.done++;
    } else if (status.includes('progress') || status.includes('inprogress') || status.includes('wip')) {
      metrics.skipped++;
      metrics.statusBreakdown.inprogress++;
    } else if (status.includes('yet to start') || status.includes('not started') || status.includes('todo')) {
      metrics.failed++;
      metrics.statusBreakdown['yet to start']++;
    } else if (status.includes('fail') || status.includes('block') || status.includes('error')) {
      metrics.failed++;
      metrics.statusBreakdown.other++;
    } else if (status) {
      metrics.skipped++;
      metrics.statusBreakdown.other++;
    } else {
      metrics.failed++;
      metrics.statusBreakdown['yet to start']++;
    }

    // Group by feature (module) - comprehensive tracking
    const moduleKey = currentFeature || 'Other';
    if (!metrics.testsByModule[moduleKey]) {
      metrics.testsByModule[moduleKey] = 0;
      metrics.automationByModule[moduleKey] = { 
        total: 0, 
        automated: 0, 
        manual: 0,
        testCases: []
      };
    }
    
    metrics.testsByModule[moduleKey]++;
    metrics.automationByModule[moduleKey].total += totalCases;
    metrics.automationByModule[moduleKey].automated += automatedCount;
    metrics.automationByModule[moduleKey].manual += manualCount;
    
    if (testCase) {
      metrics.automationByModule[moduleKey].testCases.push({
        name: testCase,
        manual: manualCount,
        automated: automatedCount,
        status: status || 'Not Started'
      });
    }

    // Store feature details for detailed analysis
    if (currentFeature) {
      const existingFeature = metrics.featureDetails.find(f => f.name === currentFeature);
      if (!existingFeature) {
        metrics.featureDetails.push({
          name: currentFeature,
          testCase: testCase || 'N/A',
          manual: manualCount,
          automated: automatedCount,
          total: totalCases,
          status: status || 'Not Started',
          comments: comments
        });
      }
    }

    // Add to recent tests
    if (metrics.recentTests.length < 15) {
      metrics.recentTests.push({
        name: testCase || `Feature: ${currentFeature}`,
        status: status || 'Not Started',
        module: currentFeature || 'Other',
        manual: manualCount,
        automated: automatedCount,
        date: 'N/A'
      });
    }
  });

  metrics.passRate = metrics.total > 0
    ? Math.round((metrics.passed / metrics.total) * 100)
    : 0;

  return metrics;
}

// Process REGRESSION TEST data
function processRegressionTestData(headers, data) {
  const metrics = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    passRate: 0,
    totalManual: 0,
    totalAutomated: 0,
    totalTestCases: 0,
    testsByModule: {},
    automationByModule: {},
    testsByPriority: {},
    recentTests: []
  };

  // Find column indices for regression test sheet
  const storyIdx = headers.findIndex(h => h.toLowerCase().includes('stor'));
  const priorityIdx = headers.findIndex(h => h.toLowerCase().includes('prior'));
  const statusIdx = headers.findIndex(h => h.toLowerCase().includes('status'));
  const totalCasesIdx = headers.findIndex(h => h.toLowerCase().includes('total') && h.toLowerCase().includes('case'));
  const automatedIdx = headers.findIndex(h => h.toLowerCase().includes('automated') && h.toLowerCase().includes('case'));

  data.forEach((row, index) => {
    // Skip empty rows or header rows
    if (!row || row.length === 0 || row.every(cell => !cell)) {
      return;
    }

    // Skip header rows and summary rows
    const rowText = row.join(' ').toLowerCase();
    if (rowText.includes('stories') && rowText.includes('total cases') ||
        rowText.includes('total use cases') ||
        rowText.includes('total case') && rowText.includes('automated case') ||
        rowText.includes('total') && (rowText.includes('use cases') || rowText.includes('case')) && !rowText.includes('stories')) {
      return;
    }

    const story = storyIdx >= 0 ? (row[storyIdx] || '').trim() : '';
    const priority = priorityIdx >= 0 ? row[priorityIdx] : '';
    const status = statusIdx >= 0 ? (row[statusIdx] || '').toLowerCase() : '';
    const totalCases = totalCasesIdx >= 0 ? parseInt(row[totalCasesIdx]) || 0 : 0;
    const automatedCases = automatedIdx >= 0 ? parseInt(row[automatedIdx]) || 0 : 0;
    const manualCases = totalCases - automatedCases;

    // Skip if no meaningful data (no story name and no test cases)
    if (!story && totalCases === 0) {
      return;
    }

    // Only count rows that have actual test cases
    if (totalCases > 0) {
      metrics.total++;
      metrics.totalManual += manualCases;
      metrics.totalAutomated += automatedCases;
      metrics.totalTestCases += totalCases;
    }

    // Count statuses only for rows with test cases
    if (totalCases > 0) {
      if (status.includes('done') || status.includes('completed') || status.includes('pass')) {
        metrics.passed++;
      } else if (status.includes('progress') || status.includes('pending') || status.includes('wip') || status.includes('in progress')) {
        metrics.skipped++;
      } else if (status.includes('not started') || status.includes('todo')) {
        metrics.skipped++;
      } else if (status.includes('fail') || status.includes('block') || status.includes('error')) {
        metrics.failed++;
      } else if (status) {
        metrics.skipped++; // Other statuses
      } else {
        metrics.skipped++; // Empty status treated as not started
      }

      // Group by story (module) - track both total and automated
      if (story) {
        metrics.testsByModule[story] = (metrics.testsByModule[story] || 0) + 1;
        if (!metrics.automationByModule[story]) {
          metrics.automationByModule[story] = { total: 0, automated: 0, manual: 0 };
        }
        metrics.automationByModule[story].total += totalCases;
        metrics.automationByModule[story].automated += automatedCases;
        metrics.automationByModule[story].manual += manualCases;
      }
    }

    // Group by priority
    if (priority) {
    metrics.testsByPriority[priority] = (metrics.testsByPriority[priority] || 0) + 1;
    }

    // Add to recent tests
    if (metrics.recentTests.length < 10) {
      metrics.recentTests.push({
        name: story || `Test ${index + 1}`,
        status: status || 'Not Started',
        module: story || 'Unknown',
        date: 'N/A',
        priority: priority || 'N/A'
      });
    }
  });

  metrics.passRate = metrics.total > 0
    ? Math.round((metrics.passed / metrics.total) * 100)
    : 0;

  return metrics;
}

// API Endpoints
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'local'
  });
});

app.get('/api/smoke-tests', async (req, res) => {
  try {
    const { headers, data } = await fetchSheetDataAsCSV(SMOKE_TEST_GID);
    const metrics = processSmokeTestData(headers, data);
    res.json({ success: true, headers, data, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/regression-tests', async (req, res) => {
  try {
    const { headers, data } = await fetchSheetDataAsCSV(REGRESSION_TEST_GID);
    const metrics = processRegressionTestData(headers, data);
    res.json({ success: true, headers, data, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard-data', async (req, res) => {
  try {
    console.log('Fetching dashboard data...');
    const smokeData = await fetchSheetDataAsCSV(SMOKE_TEST_GID);
    console.log('Smoke test data fetched:', smokeData.headers.length, 'headers,', smokeData.data.length, 'rows');
    
    const regressionData = await fetchSheetDataAsCSV(REGRESSION_TEST_GID);
    console.log('Regression test data fetched:', regressionData.headers.length, 'headers,', regressionData.data.length, 'rows');

    const smokeMetrics = processSmokeTestData(smokeData.headers, smokeData.data);
    const regressionMetrics = processRegressionTestData(regressionData.headers, regressionData.data);

    console.log('Smoke metrics:', smokeMetrics.total, 'total');
    console.log('Regression metrics:', regressionMetrics.total, 'total');

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      smokeTests: smokeMetrics,
      regressionTests: regressionMetrics,
      overall: {
        total: smokeMetrics.total + regressionMetrics.total,
        passed: smokeMetrics.passed + regressionMetrics.passed,
        failed: smokeMetrics.failed + regressionMetrics.failed,
        skipped: smokeMetrics.skipped + regressionMetrics.skipped,
        totalManual: (smokeMetrics.totalManual || 0) + (regressionMetrics.totalManual || 0),
        totalAutomated: (smokeMetrics.totalAutomated || 0) + (regressionMetrics.totalAutomated || 0),
        totalTestCases: (smokeMetrics.totalTestCases || 0) + (regressionMetrics.totalTestCases || 0),
        passRate: Math.round(
          ((smokeMetrics.passed + regressionMetrics.passed) /
          (smokeMetrics.total + regressionMetrics.total)) * 100
        ) || 0,
        automationRate: Math.round(
          (((smokeMetrics.totalAutomated || 0) + (regressionMetrics.totalAutomated || 0)) /
          ((smokeMetrics.totalTestCases || 0) + (regressionMetrics.totalTestCases || 0) || 1)) * 100
        ) || 0
      }
    });
  } catch (error) {
    console.error('Error in /api/dashboard-data:', error);
    console.error('Error stack:', error.stack);
    res.status(200).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║      Anyteam Dashboard Server - Updated & Running!        ║
╚════════════════════════════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}
📊 Dashboard URL:     http://localhost:${PORT}

📝 Sheet Structure Detected:
   Smoke Tests: Features → Status (Done/In Progress)
   Regression: Stories → Priority → Status (Done/In Progress/Not Started)

API Endpoints:
  • GET /api/smoke-tests
  • GET /api/regression-tests
  • GET /api/dashboard-data

✅ No credentials needed - using public sheet access
`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
