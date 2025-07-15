# PowerShell script for deploying Fetterman's Backend to Railway
# Run this script in PowerShell to deploy the backend

Write-Host "🚂 Deploying Fetterman's Backend to Railway..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if Railway CLI is installed
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI version: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Navigate to server directory
Set-Location server

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found in server directory" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
npm install

# Login to Railway
Write-Host "🔐 Logging into Railway..." -ForegroundColor Yellow
Write-Host "   A browser window will open for authentication" -ForegroundColor Cyan
railway login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway login failed" -ForegroundColor Red
    exit 1
}

# Initialize Railway project
Write-Host "🎯 Initializing Railway project..." -ForegroundColor Yellow
railway init

# Deploy to Railway
Write-Host "🌐 Deploying to Railway..." -ForegroundColor Yellow
railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Don't forget to:" -ForegroundColor Cyan
    Write-Host "   1. Set environment variables in Railway dashboard" -ForegroundColor White
    Write-Host "   2. Note down the Railway URL for frontend configuration" -ForegroundColor White
    Write-Host "   3. Update ALLOWED_ORIGINS to include your frontend domain" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🔗 Environment variables to set in Railway:" -ForegroundColor Cyan
    Write-Host "   REACT_APP_SQUARE_APPLICATION_ID=your_app_id" -ForegroundColor White
    Write-Host "   REACT_APP_SQUARE_ACCESS_TOKEN=your_access_token" -ForegroundColor White
    Write-Host "   REACT_APP_SQUARE_ENVIRONMENT=production" -ForegroundColor White
    Write-Host "   PORT=3001" -ForegroundColor White
    Write-Host "   NODE_ENV=production" -ForegroundColor White
    Write-Host "   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🎉 Your backend should now be available at: https://your-project-name.railway.app" -ForegroundColor Green
    Write-Host "📋 Use this URL as REACT_APP_BACKEND_URL in your frontend environment variables" -ForegroundColor Yellow
    Write-Host "   Format: https://your-project-name.railway.app/api/square" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}

# Return to root directory
Set-Location ..

Write-Host ""
Write-Host "🎉 Visit your Railway dashboard to manage your deployment!" -ForegroundColor Green
Write-Host "   Dashboard: https://railway.app/dashboard" -ForegroundColor Yellow