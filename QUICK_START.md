# Quick Start Guide

Get your dashboard running in **2 minutes**!

## Step 1: Install Dependencies (1 minute)

```bash
cd "/Users/apple/Documents/Dashboard Anyteam"
npm install
```

## Step 2: Make Your Google Sheet Public (1 minute)

1. Open your Google Sheet:
   - https://docs.google.com/spreadsheets/d/1cEoULby4Ye6ul5wsTCHSdT8eL93qJks2KNmIP6hK_Ko/
2. Click the **Share** button (top right)
3. Change to **"Anyone with the link"**
4. Permission: **Viewer**
5. Click **Done**

## Step 3: Start the Dashboard!

```bash
npm start
```

Visit: **http://localhost:3000**

That's it! 🎉

## Troubleshooting

**"Unable to access Google Sheet"**
- Make sure your Google Sheet is set to "Anyone with the link can view"
- Check that the sheet URL in `server.js` is correct

**"No data available"**
- Verify the sheet has data in the expected format
- Check browser console (F12) for any errors

## Features

- Real-time data from Google Sheets
- No authentication required
- Auto-refresh every 5 minutes
- Beautiful charts and visualizations
- Detailed test case breakdowns
