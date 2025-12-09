# Anyteam Testing Dashboard

A beautiful, real-time testing dashboard that displays live data from Google Sheets. **No authentication or credentials needed!**

## Features

- ✅ **No Setup Required**: Works without Google API credentials
- ✅ **Real-time Data**: Pulls data directly from public Google Sheets
- ✅ **Auto-refresh**: Updates every 5 minutes automatically
- ✅ **Beautiful Charts**: Interactive visualizations with Chart.js
- ✅ **Test Metrics**: Pass rates, distributions, module breakdowns
- ✅ **Responsive Design**: Works on desktop and mobile

## What You'll See

- **Summary Cards**: Total, Passed, Failed, Skipped tests
- **Pass Rate Chart**: Doughnut chart showing test results
- **Distribution Chart**: Smoke vs Regression test breakdown
- **Module Chart**: Tests grouped by module/feature
- **Priority Chart**: Tests grouped by priority level
- **Recent Tests Table**: Last 10 test executions

## Quick Start (2 Steps!)

### 1. Install Dependencies

```bash
cd "/Users/apple/Documents/Dashboard Anyteam"
npm install
```

### 2. Make Your Google Sheet Public

1. Open your Google Sheet:
   - https://docs.google.com/spreadsheets/d/1cEoULby4Ye6ul5wsTCHSdT8eL93qJks2KNmIP6hK_Ko/
2. Click the **Share** button (top right)
3. Change to **"Anyone with the link"**
4. Permission: **Viewer**
5. Click **Done**

### 3. Start the Dashboard!

```bash
npm start
```

Visit: **http://localhost:3000**

That's it! 🎉

## How It Works

The dashboard fetches data directly from your Google Sheets using the public CSV export feature. No API keys, no authentication, no credentials file needed!

## Your Google Sheets

Currently configured for:
- **Spreadsheet ID**: `1cEoULby4Ye6ul5wsTCHSdT8eL93qJks2KNmIP6hK_Ko`
- **Smoke Tests**: Sheet with gid=954974616
- **Regression Tests**: Sheet with gid=1915752702

## Project Structure

```
Dashboard Anyteam/
├── server.js         # Backend API (fetches Google Sheets as CSV)
├── dashboard.html    # Dashboard UI
├── dashboard.js      # Charts & real-time updates
├── styles.css        # Professional styling
├── package.json      # Dependencies
└── README.md         # This file
```

## Customization

### Change Auto-refresh Time

Edit `dashboard.js` line 6:

```javascript
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes (in milliseconds)
```

### Use Different Google Sheets

Edit `server.js` lines 15-17:

```javascript
const SPREADSHEET_ID = 'your-spreadsheet-id';
const SMOKE_TEST_GID = 'your-smoke-test-gid';
const REGRESSION_TEST_GID = 'your-regression-test-gid';
```

**To find GID**: Look at your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid={GID}
```

## API Endpoints

- `GET /` - Dashboard home page
- `GET /api/dashboard-data` - Combined metrics from both sheets
- `GET /api/smoke-tests` - Smoke test data only
- `GET /api/regression-tests` - Regression test data only

## Troubleshooting

### "Failed to fetch sheet" Error

**Solution:**
- Make sure your Google Sheet is set to "Anyone with the link can view"
- Open your sheet → Click Share → Change access to "Anyone with the link"

### "No data showing"

**Solution:**
- Check that your Google Sheet has data
- Verify the sheet is publicly accessible
- Open browser console (F12) to see detailed errors

### Charts not displaying

**Solution:**
- Make sure your sheet has columns with keywords like:
  - "status" or "result" (for test status)
  - "module" or "feature" (for grouping)
  - "priority" or "severity" (for priority)
  - "name" or "test" (for test names)

## Development Mode

```bash
npm run dev
```

This will auto-restart the server when you make changes.

## Production Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name anyteam-dashboard
pm2 save
pm2 startup
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t anyteam-dashboard .
docker run -p 3000:3000 anyteam-dashboard
```

### Deploy to Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login and create app
heroku login
heroku create anyteam-dashboard

# Deploy
git init
git add .
git commit -m "Initial commit"
git push heroku main

# Open dashboard
heroku open
```

### Deploy to Vercel (Recommended - Easiest!)

#### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "Add New Project"**
3. **Import your GitHub repository**:
   - Select `RahiniSathish/Anyteam-dashboard` from the list
   - Or paste: `https://github.com/RahiniSathish/Anyteam-dashboard.git`
4. **Configure Project**:
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as default)
   - Build Command: Leave empty (or `npm install`)
   - Output Directory: Leave empty
   - Install Command: `npm install`
5. **Click "Deploy"**
6. **Done!** Your dashboard will be live at `https://your-project.vercel.app`

#### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project directory)
cd "/Users/apple/Documents/Dashboard Anyteam"
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? anyteam-dashboard (or press Enter for default)
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

**That's it!** Your dashboard will be live and automatically deployed on every push to GitHub.

#### Vercel Configuration

The project includes a `vercel.json` file that configures:
- Serverless function routing for Express
- API routes handling
- Static file serving

No additional configuration needed! 🎉

## Technical Details

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + Chart.js
- **Data Source**: Google Sheets (CSV export)
- **Authentication**: None required!
- **Hosting**: Any Node.js hosting (Heroku, AWS, DigitalOcean, etc.)

## License

MIT License

## Built With

- [Express.js](https://expressjs.com/) - Web framework
- [Chart.js](https://www.chartjs.org/) - Charts library
- [Google Sheets](https://sheets.google.com/) - Data source

---

**Made with ❤️ for Anyteam**

**No credentials. No setup. Just works! 🚀**
