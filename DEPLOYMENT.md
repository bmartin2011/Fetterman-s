# Production Deployment Guide

## ✅ Pre-Deployment Checklist

### Code Quality
- [x] All console.log statements removed from production
- [x] Error logging conditionally enabled for development only
- [x] TypeScript compilation successful
- [x] ESLint warnings addressed
- [x] Production build successful (121.89 kB main bundle)

### Security
- [x] Environment variables properly configured
- [x] No secrets in codebase
- [x] CORS configured for production domains
- [x] Input validation implemented
- [x] XSS protection enabled

### Performance
- [x] Bundle size optimized (121.89 kB gzipped)
- [x] Code splitting implemented
- [x] Lazy loading configured
- [x] Web Vitals tracking enabled
- [x] Caching strategies implemented

### Accessibility
- [x] WCAG 2.1 AA compliance
- [x] Keyboard navigation support
- [x] Screen reader compatibility
- [x] Color contrast requirements met

## 🚀 Deployment Steps

### 1. Square Configuration

**Production Square Setup:**
```bash
# Required Square Settings
- Application ID: sq0idp-[your-production-id]
- Environment: production
- Web Payments SDK: Enabled
- Required Permissions:
  - ITEMS_READ
  - MERCHANT_PROFILE_READ
  - PAYMENTS_WRITE
  - ORDERS_WRITE
```

### 2. Backend Deployment (Railway)

```bash
cd server

# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up

# Set environment variables in Railway dashboard:
# SQUARE_ACCESS_TOKEN=EAAAEOxxx
# SQUARE_ENVIRONMENT=production
# NODE_ENV=production
# PORT=3001
```

### 3. Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# REACT_APP_SQUARE_APPLICATION_ID=sq0idp-xxx
# REACT_APP_SQUARE_LOCATION_ID=LRK9xxx
# REACT_APP_SQUARE_ENVIRONMENT=production
# REACT_APP_BACKEND_URL=https://your-backend.railway.app
```

### 4. Domain Configuration

**Custom Domain Setup:**
- Configure custom domain in Vercel
- Update CORS settings in backend
- Update Square webhook URLs
- Configure SSL certificates

## 🔧 Environment Variables

### Frontend (.env.production)
```env
REACT_APP_SQUARE_APPLICATION_ID=sq0idp-[production-id]
REACT_APP_SQUARE_LOCATION_ID=LRK9[location-id]
REACT_APP_SQUARE_ENVIRONMENT=production
REACT_APP_BACKEND_URL=https://fettermans-backend.railway.app
NODE_ENV=production
```

### Backend (Railway Environment)
```env
SQUARE_ACCESS_TOKEN=EAAAEOxxx[production-token]
SQUARE_ENVIRONMENT=production
NODE_ENV=production
PORT=3001
```

## 📊 Post-Deployment Verification

### Functionality Tests
- [ ] Menu loads correctly
- [ ] Products display with images
- [ ] Cart functionality works
- [ ] Checkout process completes
- [ ] Payment processing successful
- [ ] Order confirmation received
- [ ] Discount codes apply correctly
- [ ] Location selection works

### Performance Tests
- [ ] Lighthouse score > 90
- [ ] Page load time < 3 seconds
- [ ] Bundle size acceptable
- [ ] Mobile performance optimized

### Security Tests
- [ ] HTTPS enabled
- [ ] No console logs in production
- [ ] API endpoints secured
- [ ] Input validation working
- [ ] Error handling appropriate

## 🔍 Monitoring Setup

### Analytics Integration
```javascript
// Add to production environment
// Google Analytics, Mixpanel, or similar

// Error Tracking
// Sentry, LogRocket, or similar

// Performance Monitoring
// Web Vitals already implemented
```

### Health Checks
- Backend health endpoint: `/health`
- Frontend error boundaries active
- API response monitoring
- Payment processing alerts

## 🚨 Rollback Plan

### Quick Rollback Steps
1. **Vercel**: Revert to previous deployment
2. **Railway**: Rollback to previous version
3. **Square**: Revert webhook configurations
4. **DNS**: Update if domain changes made

### Emergency Contacts
- Square Support: [Square Developer Support]
- Vercel Support: [Vercel Support]
- Railway Support: [Railway Support]

## 📈 Performance Targets

### Lighthouse Scores
- **Performance**: 90+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 90+

### Core Web Vitals
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

### Bundle Metrics
- **Main Bundle**: 121.89 kB (current)
- **CSS Bundle**: 8.69 kB (current)
- **Total Load Time**: < 3s

## 🔧 Maintenance

### Regular Updates
- [ ] Dependencies security updates
- [ ] Square API version updates
- [ ] Performance monitoring review
- [ ] Error log analysis

### Backup Strategy
- Code: Git repository
- Environment variables: Secure documentation
- Square configuration: Dashboard backup
- Database: Not applicable (stateless)

---

## 🎉 Production Ready!

This application is now fully optimized and ready for production deployment with:

✅ **Zero console logs in production**  
✅ **Optimized bundle size (121.89 kB)**  
✅ **Comprehensive error handling**  
✅ **Security best practices**  
✅ **Performance monitoring**  
✅ **Accessibility compliance**  
✅ **Mobile optimization**  

**Deployment Status**: Ready for Production 🚀