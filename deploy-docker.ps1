# Docker Deployment Script for Fetterman's Website
# This script deploys both frontend and backend using Docker

Write-Host "🐳 Deploying Fetterman's Website with Docker" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed and running
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker version: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose is available
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose version: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    Write-Host "   Please install Docker Compose" -ForegroundColor Yellow
    exit 1
}

# Check if environment file exists
if (-not (Test-Path ".env.docker")) {
    Write-Host "❌ .env.docker file not found" -ForegroundColor Red
    Write-Host "   Please run setup-environment.ps1 first to create environment files" -ForegroundColor Yellow
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start containers
Write-Host "🔨 Building and starting containers..." -ForegroundColor Yellow
docker-compose --env-file .env.docker up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your website is now running at:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:3001/api" -ForegroundColor White
    Write-Host "   Nginx Proxy: http://localhost:80" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📊 Container Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "📝 Useful commands:" -ForegroundColor Cyan
    Write-Host "   View logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "   Stop containers: docker-compose down" -ForegroundColor White
    Write-Host "   Restart containers: docker-compose restart" -ForegroundColor White
    Write-Host "   View container status: docker-compose ps" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🔍 Health Check:" -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get
        Write-Host "✅ Backend health check passed" -ForegroundColor Green
        Write-Host "   Status: $($healthResponse.status)" -ForegroundColor White
        Write-Host "   Environment: $($healthResponse.environment)" -ForegroundColor White
    } catch {
        Write-Host "⚠️  Backend health check failed - container may still be starting" -ForegroundColor Yellow
        Write-Host "   Try again in a few moments: curl http://localhost:3001/api/health" -ForegroundColor White
    }
    
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor Yellow
    Write-Host "   View logs with: docker-compose logs" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🎉 Docker deployment complete!" -ForegroundColor Green
Write-Host "   Your Fetterman's website is now running in containers" -ForegroundColor White