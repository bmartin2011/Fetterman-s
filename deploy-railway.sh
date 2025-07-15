#!/bin/bash

# Railway Deployment Script for Fetterman's Backend
# Run this script to deploy the backend to Railway

echo "🚂 Deploying Fetterman's Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Navigate to server directory
cd server

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Initialize Railway project
echo "🎯 Initializing Railway project..."
railway init

# Deploy to Railway
echo "🌐 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set environment variables in Railway dashboard"
echo "   2. Note down the Railway URL for frontend configuration"
echo "   3. Update ALLOWED_ORIGINS to include your frontend domain"

echo ""
echo "🔗 Environment variables to set in Railway:"
echo "   REACT_APP_SQUARE_APPLICATION_ID=your_app_id"
echo "   REACT_APP_SQUARE_ACCESS_TOKEN=your_access_token"
echo "   REACT_APP_SQUARE_ENVIRONMENT=production"
echo "   PORT=3001"
echo "   NODE_ENV=production"
echo "   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app"

echo ""
echo "🎉 Your backend should now be available at: https://your-project-name.railway.app"
echo "📋 Use this URL as REACT_APP_BACKEND_URL in your frontend environment variables"