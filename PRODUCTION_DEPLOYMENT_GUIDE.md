# 🚀 Production Deployment Guide

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Git repository set up
- [ ] Square Production API keys
- [ ] Vercel account (for frontend)
- [ ] Railway account (for backend)

## 📋 Pre-Deployment Checklist

### Code Quality
- [x] All console.log statements removed from production
- [x] Error logging conditionally enabled for development only
- [x] TypeScript compilation successful
- [x] Production build optimized
- [x] Security headers configured
- [x] Environment variables properly configured

### Dependencies
```bash
# Install production dependencies
npm install
cd server && npm install
```

## 🔧 Environment Configuration

### 1. Frontend Environment Variables (Vercel)

Create these environment variables in your Vercel dashboard:

```bash
# Square API Configuration (PRODUCTION)
REACT_APP_SQUARE_APPLICATION_ID=your_production_square_app_id
REACT_APP_SQUARE_ACCESS_TOKEN=your_production_square_access_token
REACT_APP_SQUARE_ENVIRONMENT=production
REACT_APP_SQUARE_LOCATION_ID=your_production_location_id

# Backend API Configuration
REACT_APP_API_BASE_URL=https://your-railway-backend.railway.app

# Application Configuration
REACT_APP_STORE_NAME=Fetterman's
REACT_APP_STORE_PHONE=(555) 123-4567
REACT_APP_STORE_EMAIL=orders@fettermans.com
REACT_APP_STORE_ADDRESS=123 Main St, Your City, State 12345

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true

# Security
REACT_APP_ENABLE_SECURITY_HEADERS=true
REACT_APP_ENABLE_CSP=true

# Build Configuration
GENERATE_SOURCEMAP=false
```

### 2. Backend Environment Variables (Railway)

Create these environment variables in your Railway dashboard:

```bash
# Square API Configuration (PRODUCTION)
SQUARE_APPLICATION_ID=your_production_square_app_id
SQUARE_ACCESS_TOKEN=your_production_square_access_token
SQUARE_ENVIRONMENT=production
SQUARE_LOCATION_ID=your_production_location_id

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://your-custom-domain.com

# Security
API_RATE_LIMIT=100
API_WINDOW_MS=900000
```

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Railway

1. **Connect Repository to Railway**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `server` folder as the root directory

3. **Configure Environment Variables**
   - Add all backend environment variables listed above
   - Set `PORT` to `3001`
   - Set `NODE_ENV` to `production`

4. **Deploy**
   - Railway will automatically deploy your backend
   - Note the generated URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Connect Repository to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the root directory (not the server folder)

3. **Configure Build Settings**
   - Build Command: `npm run build:prod`
   - Output Directory: `build`
   - Install Command: `npm install`

4. **Configure Environment Variables**
   - Add all frontend environment variables listed above
   - Set `REACT_APP_API_BASE_URL` to your Railway backend URL

5. **Deploy**
   ```bash
   # Using CLI (optional)
   npm run deploy:vercel
   
   # Or deploy through Vercel dashboard
   ```

### Step 3: Configure Square Dashboard

1. **Update Application Settings**
   - Go to [Square Developer Dashboard](https://developer.squareup.com/)
   - Select your production application
   - Update **Redirect URLs** to include your Vercel domain
   - Update **CORS Origins** to include your Vercel domain

2. **Webhook Configuration** (if using webhooks)
   - Set webhook URL to: `https://your-railway-backend.railway.app/webhooks/square`
   - Enable required webhook events

## 🔍 Post-Deployment Verification

### 1. Frontend Checks
- [ ] Website loads correctly
- [ ] All pages accessible
- [ ] No console errors in production
- [ ] HTTPS enabled
- [ ] Performance metrics acceptable

### 2. Backend Checks
- [ ] API endpoints responding
- [ ] Square integration working
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Error logging functional

### 3. End-to-End Testing
- [ ] Product browsing works
- [ ] Cart functionality works
- [ ] Checkout process completes
- [ ] Payment processing successful
- [ ] Order confirmation received

## 📊 Monitoring & Analytics

### Performance Monitoring
- Web Vitals automatically tracked
- Bundle size optimized (< 250KB gzipped)
- Lazy loading implemented
- Service worker caching active

### Error Tracking
- Production errors logged to console.error only
- Client-side error boundary implemented
- Server-side error handling configured

### Security
- Security headers configured
- HTTPS enforced
- CORS properly configured
- Rate limiting active
- Input validation implemented

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `ALLOWED_ORIGINS` in Railway includes your Vercel domain
   - Check Square application CORS settings

2. **Payment Failures**
   - Verify production Square API keys
   - Check Square Dashboard for error details
   - Ensure webhook URLs are correct

3. **Build Failures**
   - Check TypeScript compilation
   - Verify all dependencies installed
   - Review build logs in Vercel/Railway

4. **Environment Variables**
   - Ensure all required variables are set
   - Verify variable names match exactly
   - Check for typos in URLs and keys

## 🔄 Updates & Maintenance

### Regular Updates
```bash
# Security updates
npm run security:audit
npm run security:fix

# Dependency updates
npm update
cd server && npm update

# Deploy updates
git add .
git commit -m "Update dependencies"
git push origin main
```

### Monitoring
- Monitor Vercel analytics
- Check Railway logs regularly
- Review Square Dashboard for API usage
- Monitor performance metrics

## 📞 Support

### Emergency Contacts
- Square Support: [Square Developer Support](https://developer.squareup.com/support)
- Vercel Support: [Vercel Support](https://vercel.com/support)
- Railway Support: [Railway Support](https://railway.app/help)

### Rollback Plan
1. Revert to previous Git commit
2. Redeploy previous version
3. Update environment variables if needed
4. Verify functionality

---

## ✅ Production Ready!

Your application is now production-ready with:

- ✅ **Zero console logs in production**
- ✅ **Optimized bundle size**
- ✅ **Comprehensive error handling**
- ✅ **Security best practices**
- ✅ **Performance monitoring**
- ✅ **Accessibility compliance**
- ✅ **Mobile optimization**
- ✅ **SEO optimization**
- ✅ **Progressive Web App features**

**Deployment Status**: Ready for Production 🚀