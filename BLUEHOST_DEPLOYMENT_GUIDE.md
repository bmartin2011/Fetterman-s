# Bluehost Frontend Deployment Guide

## Overview
This guide covers deploying the Fetterman's React frontend to Bluehost shared hosting.

## Prerequisites
- Bluehost hosting account with cPanel access
- Domain configured and pointing to Bluehost
- FTP/File Manager access

## Step 1: Build the Production Version

```bash
# Install dependencies
npm install

# Create production build
npm run build:prod
```

This creates a `build` folder with optimized static files.

## Step 2: Upload Files to Bluehost

### Option A: Using cPanel File Manager
1. Log into your Bluehost cPanel
2. Open "File Manager"
3. Navigate to `public_html` (or your domain's folder)
4. Delete any existing files in the directory
5. Upload all contents from the `build` folder to `public_html`
6. Extract if uploaded as a zip file

### Option B: Using FTP Client
1. Use an FTP client (FileZilla, WinSCP, etc.)
2. Connect to your Bluehost server:
   - Host: your-domain.com or server IP
   - Username: your cPanel username
   - Password: your cPanel password
   - Port: 21 (FTP) or 22 (SFTP)
3. Navigate to `public_html`
4. Upload all files from the `build` folder

## Step 3: Configure React Router (Important!)

Create an `.htaccess` file in your `public_html` directory:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

## Step 4: Environment Variables

Since Bluehost doesn't support environment variables like Vercel, you'll need to:

1. **Create a production build with hardcoded values:**
   ```bash
   # Set environment variables before building
   set REACT_APP_SQUARE_APPLICATION_ID=your_actual_app_id
   set REACT_APP_SQUARE_ACCESS_TOKEN=your_actual_token
   set REACT_APP_SQUARE_ENVIRONMENT=production
   set REACT_APP_BACKEND_URL=https://your-backend-url.railway.app/api/square
   npm run build:prod
   ```

2. **Or modify the build process to include a config file:**
   - Create a `config.js` file in the public folder
   - Load configuration at runtime

## Step 5: SSL Certificate

1. In cPanel, go to "SSL/TLS"
2. Enable "Force HTTPS Redirect"
3. Install Let's Encrypt certificate (usually free with Bluehost)

## Step 6: Testing

1. Visit your domain
2. Test all routes (Home, Menu, About, Contact, etc.)
3. Test the shopping cart functionality
4. Verify mobile responsiveness
5. Check browser console for errors

## Deployment Script for Bluehost

Create `deploy-bluehost.ps1`:

```powershell
# Bluehost deployment script
Write-Host "Building for Bluehost deployment..." -ForegroundColor Green

# Build the project
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Create deployment package
Compress-Archive -Path "build\*" -DestinationPath "fettermans-bluehost-deploy.zip" -Force

Write-Host "Deployment package created: fettermans-bluehost-deploy.zip" -ForegroundColor Green
Write-Host "Upload this file to your Bluehost cPanel File Manager" -ForegroundColor Yellow
Write-Host "Extract it in the public_html directory" -ForegroundColor Yellow
```

## Maintenance Process

### For Updates:
1. Make changes to your code
2. Run `npm run build:prod`
3. Upload new files to Bluehost (overwrite existing)
4. Clear any caches

### Backup Strategy:
1. Download current `public_html` contents before updates
2. Keep local backups of working builds
3. Use Bluehost's backup features

## Limitations of Bluehost vs Vercel

| Feature | Bluehost | Vercel |
|---------|----------|--------|
| Deployment | Manual upload | Automatic from Git |
| Build Process | Local only | Cloud-based |
| CDN | Limited | Global edge network |
| SSL | Manual setup | Automatic |
| Environment Variables | Build-time only | Runtime support |
| Rollbacks | Manual | One-click |
| Performance | Shared hosting | Optimized edge |
| Cost | $2.95-13.95/month | Free tier available |

## Troubleshooting

### Common Issues:

1. **404 errors on refresh:**
   - Ensure `.htaccess` file is properly configured
   - Check if mod_rewrite is enabled

2. **Assets not loading:**
   - Verify file paths in the build
   - Check file permissions (755 for directories, 644 for files)

3. **API calls failing:**
   - Ensure CORS is properly configured on your backend
   - Check if HTTPS is enforced

4. **Slow loading:**
   - Enable gzip compression in `.htaccess`
   - Optimize images before deployment
   - Use browser caching headers

## Security Considerations

1. **Never commit sensitive data:**
   - Keep API keys secure
   - Use environment-specific builds

2. **Regular updates:**
   - Keep Bluehost account secure
   - Monitor for security updates

3. **File permissions:**
   - Set proper permissions (644 for files, 755 for directories)
   - Avoid 777 permissions

## Cost Comparison

**Bluehost Shared Hosting:**
- Basic: $2.95/month (promotional, then $7.99/month)
- Plus: $5.45/month (promotional, then $10.99/month)
- Choice Plus: $5.45/month (promotional, then $14.99/month)

**Additional Costs:**
- Domain: $15.99/year (often free first year)
- SSL: Usually included
- Backups: $2.99/month (optional)

**Total Monthly Cost: $3-15/month**

## Conclusion

While Bluehost can host your React application, it requires significantly more manual work compared to modern solutions like Vercel. The deployment process is more complex, performance is generally slower, and maintenance requires more effort.

**Recommended only if:**
- You already have a Bluehost account
- You need to consolidate hosting services
- You require specific shared hosting features
- Budget constraints require traditional hosting

For most React applications, especially with your traffic level (2-3k visitors/week), Vercel remains the superior choice for frontend hosting.