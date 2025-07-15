# Fetterman's Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 14+ 
- Square Production Account
- SSL Certificate for HTTPS
- Production domain

### Environment Setup

#### 1. Frontend Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Production Configuration
REACT_APP_SQUARE_APPLICATION_ID=your_production_square_app_id
REACT_APP_SQUARE_ACCESS_TOKEN=your_production_square_access_token
REACT_APP_SQUARE_ENVIRONMENT=production
REACT_APP_BACKEND_URL=https://your-api-domain.com/api/square
```

#### 2. Backend Environment Variables
Copy `server/.env.example` to `server/.env` and configure:

```bash
# Production Configuration
REACT_APP_SQUARE_APPLICATION_ID=your_production_square_app_id
REACT_APP_SQUARE_ACCESS_TOKEN=your_production_square_access_token
REACT_APP_SQUARE_ENVIRONMENT=production
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Security Checklist

- [ ] ✅ Environment variables secured (not in repository)
- [ ] ✅ HTTPS enabled
- [ ] ✅ CORS configured for production domains
- [ ] ✅ Rate limiting enabled
- [ ] ✅ Security headers configured (Helmet)
- [ ] ✅ Input validation implemented
- [ ] ✅ Error handling without sensitive data exposure

### Deployment Options

#### Frontend (React App)

**Option 1: Netlify**
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure environment variables in Netlify dashboard

**Option 2: Vercel**
1. Import project from GitHub
2. Configure environment variables
3. Deploy automatically

**Option 3: AWS S3 + CloudFront**
1. Build: `npm run build`
2. Upload `build/` to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain with SSL

#### Backend (Express Server)

**Option 1: Heroku**
```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set REACT_APP_SQUARE_ACCESS_TOKEN=your_token
# ... other environment variables
git subtree push --prefix server heroku main
```

**Option 2: DigitalOcean App Platform**
1. Connect GitHub repository
2. Set source directory to `server/`
3. Configure environment variables
4. Deploy

**Option 3: AWS Elastic Beanstalk**
1. Create application
2. Upload server code
3. Configure environment variables
4. Deploy

### Performance Optimizations

1. **Enable Gzip Compression**
2. **Configure CDN for static assets**
3. **Implement caching strategies**
4. **Monitor performance with tools like New Relic**

### Monitoring & Logging

1. **Set up error tracking** (Sentry, Bugsnag)
2. **Configure application monitoring**
3. **Set up health check endpoints**
4. **Implement structured logging**

### Post-Deployment

1. **Test all functionality in production**
2. **Verify SSL certificate**
3. **Test payment processing**
4. **Monitor error logs**
5. **Set up backup procedures**

## 🔒 Security Best Practices

### Never Commit
- API keys or tokens
- Database credentials
- SSL certificates
- User data

### Regular Updates
- Keep dependencies updated
- Monitor security advisories
- Regular security audits

### Access Control
- Use principle of least privilege
- Regular access reviews
- Strong authentication

## 📞 Support

For deployment issues:
1. Check logs for errors
2. Verify environment variables
3. Test API connectivity
4. Review CORS settings

---

**⚠️ Important**: Always test in a staging environment before production deployment.