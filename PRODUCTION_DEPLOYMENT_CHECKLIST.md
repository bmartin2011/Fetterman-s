# Production Deployment Checklist - Updating Vercel & Railway

## 🔑 **PRODUCTION KEYS UPDATE PROCESS**

### **STEP 1: Update Railway Backend (Server)**

#### **1.1 Access Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Log into your Railway account
3. Select your Fetterman's backend project

#### **1.2 Update Environment Variables**
In Railway Dashboard → Variables tab, update:

```bash
# Replace with your PRODUCTION values
REACT_APP_SQUARE_APPLICATION_ID=your_production_app_id
REACT_APP_SQUARE_ACCESS_TOKEN=your_production_access_token
REACT_APP_SQUARE_ENVIRONMENT=production
NODE_ENV=production
PORT=3001

# Add CORS origins for your domain
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

#### **1.3 Deploy Backend Changes**
```bash
# In your server directory
cd server
git add .
git commit -m "Update to production Square API keys"
git push origin main
```

**Railway will automatically redeploy with new environment variables.**

---

### **STEP 2: Update Vercel Frontend**

#### **2.1 Access Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Log into your Vercel account
3. Select your Fetterman's frontend project

#### **2.2 Update Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:

```bash
# Replace with your PRODUCTION values
REACT_APP_SQUARE_APPLICATION_ID=your_production_app_id
REACT_APP_SQUARE_ACCESS_TOKEN=your_production_access_token
REACT_APP_SQUARE_ENVIRONMENT=production
REACT_APP_BACKEND_URL=https://your-railway-backend-url.railway.app/api/square
```

**Important**: Set these for **Production** environment in Vercel.

#### **2.3 Trigger Vercel Redeploy**
```bash
# In your main project directory
git add .
git commit -m "Update to production Square API keys"
git push origin main
```

**Vercel will automatically redeploy with new environment variables.**

---

### **STEP 3: Additional Changes Required**

#### **3.1 Square Dashboard Configuration**

**Update Square Application Settings:**
1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Select your application
3. **Update Redirect URLs**:
   ```
   https://your-domain.com/checkout/success
   https://your-domain.com/checkout/cancel
   https://www.your-domain.com/checkout/success
   https://www.your-domain.com/checkout/cancel
   ```

4. **Update Webhook URLs** (if using webhooks):
   ```
   https://your-railway-backend.railway.app/webhooks/square
   ```

5. **Verify CORS Origins** in Square settings:
   ```
   https://your-domain.com
   https://www.your-domain.com
   ```

#### **3.2 Domain Configuration**

**If you have a custom domain:**

1. **In Vercel Dashboard**:
   - Go to Domains tab
   - Add your custom domain
   - Configure DNS records as instructed

2. **Update Backend CORS**:
   ```bash
   # In Railway environment variables
   ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
   ```

#### **3.3 SSL Certificate Verification**

1. **Vercel**: SSL is automatic
2. **Railway**: SSL is automatic
3. **Verify HTTPS**: All URLs should use `https://`

---

### **STEP 4: Testing Production Setup**

#### **4.1 Frontend Testing**
✅ **Test these features on your live site:**
- [ ] Homepage loads correctly
- [ ] All menu pages display
- [ ] Product images load
- [ ] Shopping cart functionality
- [ ] Add/remove items
- [ ] Checkout process
- [ ] Payment processing (use test card)
- [ ] Success/cancel pages
- [ ] Mobile responsiveness

#### **4.2 Backend API Testing**
✅ **Verify API endpoints:**
- [ ] `GET /api/square/locations` - Returns locations
- [ ] `GET /api/square/catalog` - Returns menu items
- [ ] `POST /api/square/checkout` - Creates payment
- [ ] Health check endpoint works

#### **4.3 Payment Testing**

**Use Square's test card numbers:**
```
# Test Successful Payment
Card: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Zip: Any 5 digits

# Test Declined Payment
Card: 4000 0000 0000 0002
```

---

### **STEP 5: Environment-Specific Configuration**

#### **5.1 Update Local Development**
Create `.env.local` for development:
```bash
# Development environment (keep sandbox)
REACT_APP_SQUARE_APPLICATION_ID=your_sandbox_app_id
REACT_APP_SQUARE_ACCESS_TOKEN=your_sandbox_access_token
REACT_APP_SQUARE_ENVIRONMENT=sandbox
REACT_APP_BACKEND_URL=http://localhost:3001/api/square
```

#### **5.2 Update Server Environment**
Create `server/.env.local` for development:
```bash
# Development backend (keep sandbox)
REACT_APP_SQUARE_APPLICATION_ID=your_sandbox_app_id
REACT_APP_SQUARE_ACCESS_TOKEN=your_sandbox_access_token
REACT_APP_SQUARE_ENVIRONMENT=sandbox
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
```

---

### **STEP 6: Monitoring & Verification**

#### **6.1 Check Deployment Status**

**Railway:**
- Dashboard shows "Deployed" status
- Logs show no errors
- Health check endpoint responds

**Vercel:**
- Dashboard shows "Ready" status
- Build logs show success
- Website loads correctly

#### **6.2 Monitor for Issues**

**Check these logs for 24-48 hours:**
- Railway deployment logs
- Vercel function logs
- Square Developer Dashboard for API errors
- Browser console for frontend errors

---

## 🚨 **CRITICAL SECURITY NOTES**

### **Environment Variable Security:**
- ✅ **NEVER** commit production keys to Git
- ✅ Use different keys for development (sandbox) and production
- ✅ Regularly rotate access tokens
- ✅ Monitor Square Dashboard for unusual activity

### **Access Control:**
- ✅ Only authorized team members have access to production keys
- ✅ Use strong passwords for hosting accounts
- ✅ Enable 2FA on Square, Railway, and Vercel accounts

---

## 📋 **FINAL VERIFICATION CHECKLIST**

### **Before Going Live:**
- [ ] Production Square keys updated in both Railway and Vercel
- [ ] Square application configured with correct URLs
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active on all services
- [ ] CORS settings updated for production domain
- [ ] All payment flows tested with test cards
- [ ] Mobile responsiveness verified
- [ ] Performance tested (loading speed)
- [ ] Error handling tested
- [ ] Backup procedures documented

### **Post-Launch Monitoring:**
- [ ] Monitor payment transactions in Square Dashboard
- [ ] Check server logs for errors
- [ ] Verify website analytics
- [ ] Test customer journey end-to-end
- [ ] Monitor site performance

---

## 🆘 **TROUBLESHOOTING COMMON ISSUES**

### **Payment Failures:**
1. **Check Square Dashboard** for error details
2. **Verify API keys** are production keys
3. **Check CORS settings** in Square application
4. **Verify webhook URLs** if using webhooks

### **CORS Errors:**
1. **Update Railway ALLOWED_ORIGINS** with your domain
2. **Check Square application** CORS settings
3. **Verify domain spelling** (including www/non-www)

### **Deployment Issues:**
1. **Check build logs** in Vercel/Railway
2. **Verify environment variables** are set correctly
3. **Test API endpoints** directly
4. **Check DNS propagation** for custom domains

---

## 📞 **EMERGENCY CONTACTS**

**If issues arise:**
- **Square Support**: [Square Developer Support](https://developer.squareup.com/support)
- **Railway Support**: [Railway Help](https://railway.app/help)
- **Vercel Support**: [Vercel Support](https://vercel.com/support)

**Quick Rollback:**
- Revert to previous Git commit
- Update environment variables back to sandbox
- Redeploy both services

---

**🎉 Congratulations! Your Fetterman's website is now running in production with real payment processing!**