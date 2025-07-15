# Complete Deployment Script for Fetterman's Website
# This script automates the entire deployment process

Write-Host "Fetterman's Complete Deployment Script" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "This script will:" -ForegroundColor Cyan
Write-Host "  1. Set up environment variables" -ForegroundColor White
Write-Host "  2. Deploy backend to Railway" -ForegroundColor White
Write-Host "  3. Deploy frontend to Vercel" -ForegroundColor White
Write-Host "  4. Configure cross-platform communication" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Do you want to continue? (y/N)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 1: Environment Setup
Write-Host ""
Write-Host "Step 1: Environment Setup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Write-Host "Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git not found. Please install Git" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
Set-Location server
npm install
Set-Location ..

# Get Square credentials
Write-Host ""
Write-Host "Square API Configuration" -ForegroundColor Cyan
Write-Host "Please provide your Square credentials:" -ForegroundColor White

$squareAppId = Read-Host "Square Application ID (starts with 'sq0idp-')"
$squareAccessToken = Read-Host "Square Access Token" -AsSecureString
$squareAccessTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($squareAccessToken))

# Determine environment
$environment = if ($squareAccessTokenPlain.StartsWith("EAAAEOa")) { "sandbox" } else { "production" }
Write-Host "Environment: $environment" -ForegroundColor $(if ($environment -eq "sandbox") { "Yellow" } else { "Green" })

# Step 2: Deploy Backend
Write-Host ""
Write-Host "Step 2: Backend Deployment (Railway)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Install Railway CLI if needed
try {
    railway --version | Out-Null
    Write-Host "Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Deploy backend
Set-Location server

# Create server .env
$serverEnv = @"
REACT_APP_SQUARE_APPLICATION_ID=$squareAppId
REACT_APP_SQUARE_ACCESS_TOKEN=$squareAccessTokenPlain
REACT_APP_SQUARE_ENVIRONMENT=$environment
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=*
"@

$serverEnv | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "Created server/.env" -ForegroundColor Green

Write-Host "Logging into Railway..." -ForegroundColor Yellow
railway login

Write-Host "Initializing Railway project..." -ForegroundColor Yellow
railway init

Write-Host "Deploying backend..." -ForegroundColor Yellow
railway up

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend deployment failed" -ForegroundColor Red
    exit 1
}

# Get Railway URL
Write-Host "Getting Railway deployment URL..." -ForegroundColor Yellow
$railwayUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
if (-not $railwayUrl) {
    $railwayUrl = Read-Host "Please enter your Railway app URL (e.g., https://your-app.railway.app)"
}

$backendUrl = "$railwayUrl/api/square"
Write-Host "Backend deployed at: $backendUrl" -ForegroundColor Green

Set-Location ..

# Step 3: Deploy Frontend
Write-Host ""
Write-Host "Step 3: Frontend Deployment (Vercel)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Install Vercel CLI if needed
try {
    vercel --version | Out-Null
    Write-Host "Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Create frontend .env
$frontendEnv = @"
REACT_APP_SQUARE_APPLICATION_ID=$squareAppId
REACT_APP_SQUARE_ACCESS_TOKEN=$squareAccessTokenPlain
REACT_APP_SQUARE_ENVIRONMENT=$environment
REACT_APP_BACKEND_URL=$backendUrl
"@

$frontendEnv | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "Created .env" -ForegroundColor Green

# Build and deploy frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying frontend..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend deployment failed" -ForegroundColor Red
    exit 1
}

# Get Vercel URL
$vercelUrl = vercel ls | Select-String -Pattern "https://.*\.vercel\.app" | ForEach-Object { $_.Matches[0].Value }
if (-not $vercelUrl) {
    $vercelUrl = Read-Host "Please enter your Vercel app URL (e.g., https://your-app.vercel.app)"
}

Write-Host "Frontend deployed at: $vercelUrl" -ForegroundColor Green

# Step 4: Update CORS Configuration
Write-Host ""
Write-Host "Step 4: Updating CORS Configuration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "Updating backend CORS settings..." -ForegroundColor Yellow

# Update server .env with frontend URL
$updatedServerEnv = @"
REACT_APP_SQUARE_APPLICATION_ID=$squareAppId
REACT_APP_SQUARE_ACCESS_TOKEN=$squareAccessTokenPlain
REACT_APP_SQUARE_ENVIRONMENT=$environment
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=$vercelUrl
"@

$updatedServerEnv | Out-File -FilePath "server\.env" -Encoding UTF8

# Redeploy backend with updated CORS
Set-Location server
railway up
Set-Location ..

Write-Host "CORS configuration updated" -ForegroundColor Green

# Step 5: Final Testing
Write-Host ""
Write-Host "Step 5: Testing Deployment" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

Write-Host "Testing backend health..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $healthResponse = Invoke-RestMethod -Uri "$railwayUrl/api/health" -Method Get
    Write-Host "Backend health check passed" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor White
} catch {
    Write-Host "Backend health check failed - may still be starting" -ForegroundColor Yellow
}

Write-Host "Testing frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri $vercelUrl -Method Get
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "Frontend test failed - may still be deploying" -ForegroundColor Yellow
}

# Success Summary
Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment Summary:" -ForegroundColor Cyan
Write-Host "   Frontend URL: $vercelUrl" -ForegroundColor White
Write-Host "   Backend URL:  $railwayUrl" -ForegroundColor White
Write-Host "   API Endpoint: $backendUrl" -ForegroundColor White
Write-Host "   Environment:  $environment" -ForegroundColor White

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test your website at: $vercelUrl" -ForegroundColor White
Write-Host "   2. Configure custom domain (optional)" -ForegroundColor White
Write-Host "   3. Set up monitoring and alerts" -ForegroundColor White
Write-Host "   4. Test payment processing thoroughly" -ForegroundColor White

Write-Host ""
Write-Host "Support:" -ForegroundColor Cyan
Write-Host "   - Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   - Railway Dashboard: https://railway.app/dashboard" -ForegroundColor White
Write-Host "   - Square Dashboard: https://developer.squareup.com" -ForegroundColor White

Write-Host ""
Write-Host "Your Fetterman's website is now live!" -ForegroundColor Green