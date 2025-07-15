#!/bin/bash

# Vercel Deployment Script for Fetterman's Frontend
# Run this script to deploy the frontend to Vercel

echo "🚀 Deploying Fetterman's Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building the project..."
npm run build:prod

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set environment variables in Vercel dashboard"
echo "   2. Configure custom domain if needed"
echo "   3. Update REACT_APP_BACKEND_URL to point to your backend"

echo ""
echo "🔗 Environment variables to set in Vercel:"
echo "   REACT_APP_SQUARE_APPLICATION_ID=your_app_id"
echo "   REACT_APP_SQUARE_ACCESS_TOKEN=your_access_token"
echo "   REACT_APP_SQUARE_ENVIRONMENT=production"
echo "   REACT_APP_BACKEND_URL=https://your-backend-url.railway.app/api/square"