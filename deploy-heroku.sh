#!/bin/bash

# Heroku Deployment Script for Fetterman's Backend
# Run this script to deploy the backend to Heroku

echo "🟣 Deploying Fetterman's Backend to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "📦 Please install Heroku CLI first:"
    echo "   Visit: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login to Heroku
echo "🔐 Logging into Heroku..."
heroku login

# Create Heroku app (replace 'your-app-name' with your desired name)
read -p "Enter your Heroku app name: " APP_NAME
echo "🎯 Creating Heroku app: $APP_NAME"
heroku create $APP_NAME

# Set environment variables
echo "🔧 Setting environment variables..."
read -p "Enter your Square Application ID: " SQUARE_APP_ID
read -p "Enter your Square Access Token: " SQUARE_ACCESS_TOKEN
read -p "Enter your frontend domain (e.g., https://yoursite.vercel.app): " FRONTEND_DOMAIN

heroku config:set NODE_ENV=production --app $APP_NAME
heroku config:set REACT_APP_SQUARE_APPLICATION_ID=$SQUARE_APP_ID --app $APP_NAME
heroku config:set REACT_APP_SQUARE_ACCESS_TOKEN=$SQUARE_ACCESS_TOKEN --app $APP_NAME
heroku config:set REACT_APP_SQUARE_ENVIRONMENT=production --app $APP_NAME
heroku config:set ALLOWED_ORIGINS=$FRONTEND_DOMAIN --app $APP_NAME

# Deploy server code to Heroku
echo "🌐 Deploying to Heroku..."
git subtree push --prefix server heroku main

echo "✅ Deployment complete!"
echo "🎉 Your backend is now available at: https://$APP_NAME.herokuapp.com"
echo "📋 Use this URL as REACT_APP_BACKEND_URL in your frontend: https://$APP_NAME.herokuapp.com/api/square"

echo ""
echo "📝 Next steps:"
echo "   1. Update your frontend environment variables"
echo "   2. Test the API endpoints"
echo "   3. Deploy your frontend to Netlify or Vercel"