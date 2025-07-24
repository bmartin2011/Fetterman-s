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

# Store Status Control
# Set to 'true' to enable online ordering, 'false' to disable
STORE_ONLINE=true
```

## 🏪 Store Status Toggle Feature

### How It Works
The `STORE_ONLINE` environment variable provides centralized control over online ordering:

- **`STORE_ONLINE=true`**: Online ordering is enabled
- **`STORE_ONLINE=false`**: Online ordering is disabled with user-friendly message

### Protected Endpoints
The `checkStoreOnline` middleware protects these critical endpoints:
- `/api/square/orders` - Order creation
- `/api/square/payment` - Payment processing  
- `/api/square/create-checkout` - Checkout initiation

### Usage Scenarios
- **Maintenance Mode**: Disable ordering during system updates
- **Holiday Closures**: Turn off ordering during closed periods
- **Emergency Situations**: Quickly disable ordering without code deployment
- **Capacity Management**: Temporarily disable during high-demand periods

### Implementation
```javascript
// Server middleware in server/index.js
const checkStoreOnline = (req, res, next) => {
  const storeOnline = process.env.STORE_ONLINE === 'true';
  
  if (!storeOnline) {
    return res.status(503).json({ 
      error: 'Online ordering is currently unavailable. Please try again later or contact us directly.',
      storeOffline: true
    });
  }
  
  next();
};
```

## 📅 Pickup Date & Time System

### Current Implementation

#### 1. Date & Time Selection (`DateTimePicker.tsx`)
- **Available Dates**: Today + future dates (no past dates)
- **Store Hours Integration**: Fetches hours from Square API
- **Time Slots**: 15-minute intervals during store hours
- **Preparation Buffer**: 15-minute minimum for same-day orders
- **Validation**: Prevents selection of past times or closed periods

#### 2. State Management (`CartContext.tsx`)
- **Persistence**: Stored in `localStorage` for session continuity
- **State Fields**: 
  - `selectedPickupDate`: YYYY-MM-DD format
  - `selectedPickupTime`: HH:MM format
- **Methods**: `setPickupDateTime()`, `getEstimatedPickupTime()`

#### 3. Validation Flow
**Client-Side** (`CheckoutPage.tsx`):
```javascript
const validatePickupDateTime = () => {
  if (!selectedPickupDate) {
    toast.error('Please select a pickup date');
    return false;
  }
  if (!selectedPickupTime) {
    toast.error('Please select a pickup time');
    return false;
  }
  return true;
};
```

**Server-Side** (`server/index.js`):
```javascript
// Validates required pickup date and time
if (!pickupDate || !pickupTime) {
  return res.status(400).json({ 
    error: 'Pickup date and time are required. Please select a pickup time before proceeding.' 
  });
}
```

#### 4. Square Integration
- **Format**: Converts to ISO 8601 (`YYYY-MM-DDTHH:mm:ss`)
- **Timezone**: Uses customer's local timezone
- **Square Order**: Sent as `pickup_at` in fulfillment details

### How Date & Time Selection Works

1. **Customer Opens DateTimePicker**
   - Component fetches store hours from Square API
   - Displays current week with navigation
   - Shows available dates (grays out past dates and closed days)

2. **Date Selection**
   - Customer clicks on available date
   - System loads time slots for that date
   - Applies store hours and preparation buffer

3. **Time Selection**
   - Shows 15-minute intervals during store hours
   - For "Today": adds 15-minute preparation time
   - For future dates: shows all available slots

4. **Confirmation**
   - Customer confirms date/time selection
   - Values stored in cart context and localStorage
   - Displayed in cart and checkout pages

5. **Order Processing**
   - Validated on both client and server
   - Sent to Square API in proper format
   - Included in order confirmation

### Potential Improvements

#### Timezone Handling
**Current**: Uses customer's local timezone
**Recommendation**: Consider store's timezone for consistency
```javascript
// Potential improvement
const storeTimezone = 'America/New_York'; // Store's timezone
const pickupTime = moment.tz(`${pickupDate} ${pickupTime}`, storeTimezone);
```

#### Holiday/Special Hours
**Current**: Uses regular weekly schedule only
**Recommendation**: Add special hours configuration
```javascript
// Potential feature
const specialHours = {
  '2024-12-25': 'closed', // Christmas
  '2024-07-04': { open: '10:00', close: '15:00' } // July 4th
};
```

#### Advanced Scheduling
**Current**: Simple time slot system
**Potential Features**:
- Order capacity limits per time slot
- Different preparation times by item type
- Busy period warnings
- Estimated wait times

## 📊 Post-Deployment Verification

### Functionality Tests
- [ ] Menu loads correctly
- [ ] Products display with images
- [ ] Cart functionality works
- [ ] Pickup date/time selection works
- [ ] Checkout process completes
- [ ] Payment processing successful
- [ ] Order confirmation received
- [ ] Discount codes apply correctly
- [ ] Location selection works
- [ ] Store status toggle works (test STORE_ONLINE=false)
- [ ] Pickup time validation prevents past times
- [ ] Store hours integration working

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