# Environment Setup Script for Fetterman's Website
# This script helps you configure environment variables for deployment

Write-Host "🔧 Fetterman's Environment Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Function to create .env file
function Create-EnvFile {
    param(
        [string]$FilePath,
        [hashtable]$Variables
    )
    
    $content = @()
    foreach ($key in $Variables.Keys) {
        $content += "$key=$($Variables[$key])"
    }
    
    $content | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Host "✅ Created: $FilePath" -ForegroundColor Green
}

# Get Square credentials
Write-Host "📋 Square API Configuration" -ForegroundColor Cyan
Write-Host "Please provide your Square API credentials:" -ForegroundColor White
Write-Host ""

$squareAppId = Read-Host "Square Application ID (starts with 'sq0idp-')"
while (-not $squareAppId -or -not $squareAppId.StartsWith("sq0idp-")) {
    Write-Host "❌ Invalid Application ID. It should start with 'sq0idp-'" -ForegroundColor Red
    $squareAppId = Read-Host "Square Application ID (starts with 'sq0idp-')"
}

$squareAccessToken = Read-Host "Square Access Token (starts with 'EAAAl' for production or 'EAAAEOa' for sandbox)" -AsSecureString
$squareAccessTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($squareAccessToken))

while (-not $squareAccessTokenPlain -or (-not $squareAccessTokenPlain.StartsWith("EAAAl") -and -not $squareAccessTokenPlain.StartsWith("EAAAEOa"))) {
    Write-Host "❌ Invalid Access Token. It should start with 'EAAAl' (production) or 'EAAAEOa' (sandbox)" -ForegroundColor Red
    $squareAccessToken = Read-Host "Square Access Token" -AsSecureString
    $squareAccessTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($squareAccessToken))
}

# Determine environment
$environment = "production"
if ($squareAccessTokenPlain.StartsWith("EAAAEOa")) {
    $environment = "sandbox"
    Write-Host "🧪 Detected Sandbox environment" -ForegroundColor Yellow
} else {
    Write-Host "🚀 Detected Production environment" -ForegroundColor Green
}

# Get deployment URLs
Write-Host ""
Write-Host "🌐 Deployment Configuration" -ForegroundColor Cyan

$backendUrl = Read-Host "Backend URL (e.g., https://your-app.railway.app/api/square) [Leave empty if deploying backend first]"
if (-not $backendUrl) {
    $backendUrl = "http://localhost:3001/api/square"
    Write-Host "   Using local backend URL for now: $backendUrl" -ForegroundColor Yellow
}

$frontendUrl = Read-Host "Frontend URL (e.g., https://your-app.vercel.app) [Leave empty if deploying frontend first]"
if (-not $frontendUrl) {
    $frontendUrl = "http://localhost:3000"
    Write-Host "   Using local frontend URL for now: $frontendUrl" -ForegroundColor Yellow
}

# Create frontend .env file
Write-Host ""
Write-Host "📝 Creating environment files..." -ForegroundColor Cyan

$frontendEnv = @{
    "REACT_APP_SQUARE_APPLICATION_ID" = $squareAppId
    "REACT_APP_SQUARE_ACCESS_TOKEN" = $squareAccessTokenPlain
    "REACT_APP_SQUARE_ENVIRONMENT" = $environment
    "REACT_APP_BACKEND_URL" = $backendUrl
}

Create-EnvFile -FilePath ".env" -Variables $frontendEnv

# Create backend .env file
$backendEnv = @{
    "REACT_APP_SQUARE_APPLICATION_ID" = $squareAppId
    "REACT_APP_SQUARE_ACCESS_TOKEN" = $squareAccessTokenPlain
    "REACT_APP_SQUARE_ENVIRONMENT" = $environment
    "PORT" = "3001"
    "NODE_ENV" = "production"
    "ALLOWED_ORIGINS" = $frontendUrl
}

Create-EnvFile -FilePath "server\.env" -Variables $backendEnv

# Create docker-compose environment file
$dockerEnv = @{
    "REACT_APP_SQUARE_APPLICATION_ID" = $squareAppId
    "REACT_APP_SQUARE_ACCESS_TOKEN" = $squareAccessTokenPlain
    "REACT_APP_SQUARE_ENVIRONMENT" = $environment
}

Create-EnvFile -FilePath ".env.docker" -Variables $dockerEnv

Write-Host ""
Write-Host "✅ Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Files created:" -ForegroundColor Cyan
Write-Host "   .env (Frontend environment variables)" -ForegroundColor White
Write-Host "   server\.env (Backend environment variables)" -ForegroundColor White
Write-Host "   .env.docker (Docker environment variables)" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Deploy backend first using deploy-railway.ps1 or deploy-heroku.sh" -ForegroundColor White
Write-Host "   2. Update REACT_APP_BACKEND_URL in .env with your backend URL" -ForegroundColor White
Write-Host "   3. Deploy frontend using deploy-vercel.ps1" -ForegroundColor White
Write-Host "   4. Update ALLOWED_ORIGINS in server\.env with your frontend URL" -ForegroundColor White

Write-Host ""
Write-Host "💡 For local testing, run:" -ForegroundColor Cyan
Write-Host "   Backend: cd server && npm start" -ForegroundColor White
Write-Host "   Frontend: npm start" -ForegroundColor White

Write-Host ""
Write-Host "🐳 For Docker deployment, run:" -ForegroundColor Cyan
Write-Host "   docker-compose --env-file .env.docker up -d" -ForegroundColor White