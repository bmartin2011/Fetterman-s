# Production Deployment Checklist

## ✅ Completed Tasks

### Code Cleanup
- [x] Removed development/debug files:
  - `src/components/debug/ImageDebugger.tsx`
  - `src/setupTests.ts`
  - `server/fetch_hours.js`
  - Various documentation files
  - `public/clear-cache.html` and `cache-bust.js`

### Configuration Files
- [x] Updated `package.json` scripts for production
- [x] Verified `vercel.json` configuration
- [x] Created `server/.env.example` for Railway deployment
- [x] Updated `README.md` for production deployment
- [x] Verified `.gitignore` files are properly configured

### Environment Setup
- [x] `.env.production` configured with placeholders
- [x] `.env.production.example` with detailed instructions
- [x] `server/.env.example` created for backend deployment

## 🚀 Ready for Deployment

### Frontend (Vercel)
1. **Environment Variables to Set:**
   ```
   REACT_APP_SQUARE_ACCESS_TOKEN=your_production_token
   REACT_APP_SQUARE_APPLICATION_ID=your_app_id
   REACT_APP_SQUARE_LOCATION_ID=your_location_id
   REACT_APP_SQUARE_ENVIRONMENT=production
   REACT_APP_BACKEND_URL=https://your-backend.railway.app
   ```

2. **Deploy Command:**
   ```bash
   npm run deploy:vercel
   ```

### Backend (Railway)
1. **Environment Variables to Set:**
   ```
   SQUARE_ACCESS_TOKEN=your_production_token
   SQUARE_APPLICATION_ID=your_app_id
   SQUARE_LOCATION_ID=your_location_id
   SQUARE_ENVIRONMENT=production
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

2. **Deploy:**
   - Connect Railway to your GitHub repository
   - Set the root directory to `/server`
   - Railway will automatically detect and deploy

## 📋 Final Steps

1. **Test Square Integration:**
   - Verify Square credentials are correct
   - Test payment flow in Square's sandbox first
   - Switch to production credentials

2. **Update CORS:**
   - Ensure backend FRONTEND_URL matches your Vercel domain
   - Test API calls from frontend to backend

3. **Performance Check:**
   - Run `npm run build:prod` to verify build
   - Check bundle size with `npm run analyze:bundle`
   - Verify service worker is working

4. **Security Verification:**
   - Ensure no secrets in code
   - Verify CSP headers are active
   - Test rate limiting

## 🎯 Project is Production Ready!

The codebase has been cleaned and optimized for production deployment on Vercel (frontend) and Railway (backend).