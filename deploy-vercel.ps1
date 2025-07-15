# PowerShell script for deploying Fetterman's Frontend to Vercel
# Run this script in PowerShell to deploy the frontend

Write-Host "Deploying Fetterman's Frontend to Vercel..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "Vercel CLI version: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Please check for errors." -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Don't forget to:" -ForegroundColor Cyan
    Write-Host "   1. Set environment variables in Vercel dashboard" -ForegroundColor White
    Write-Host "   2. Configure custom domain if needed" -ForegroundColor White
    Write-Host "   3. Update REACT_APP_BACKEND_URL to point to your backend" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Environment variables to set in Vercel:" -ForegroundColor Cyan
    Write-Host "   REACT_APP_SQUARE_APPLICATION_ID=your_app_id" -ForegroundColor White
    Write-Host "   REACT_APP_SQUARE_ACCESS_TOKEN=your_access_token" -ForegroundColor White
    Write-Host "   REACT_APP_SQUARE_ENVIRONMENT=production" -ForegroundColor White
    Write-Host "   REACT_APP_BACKEND_URL=https://your-backend-url.railway.app/api/square" -ForegroundColor White
} else {
    Write-Host "Deployment failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Visit your Vercel dashboard to see your deployed site!" -ForegroundColor Green
Write-Host "   Dashboard: https://vercel.com/dashboard" -ForegroundColor Yellow