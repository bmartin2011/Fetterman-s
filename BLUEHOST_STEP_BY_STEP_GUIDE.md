# Complete Step-by-Step Guide: Deploying Fetterman's Website to Bluehost

## 🚀 **COMPLETE DEPLOYMENT PROCESS**

### **PHASE 1: PRE-DEPLOYMENT SETUP**

#### **Step 1: Prepare Your Bluehost Account**
1. **Purchase Bluehost hosting plan** (Basic plan $2.95/month is sufficient)
2. **Set up your domain** (either register new or transfer existing)
3. **Access cPanel** - You'll receive login details via email
4. **Verify domain is pointing to Bluehost** (may take 24-48 hours)

#### **Step 2: Gather Required Information**
Before starting, collect:
- **Square Application ID** (from Square Developer Dashboard)
- **Square Access Token** (production token)
- **Backend URL** (your Railway backend URL)
- **Bluehost cPanel login credentials**

---

### **PHASE 2: CODE MODIFICATIONS**

#### **Step 3: Create Production Environment File**

1. **Create `.env.production` file** in your project root:
```bash
# Production Environment Variables for Bluehost
REACT_APP_SQUARE_APPLICATION_ID=your_actual_square_app_id
REACT_APP_SQUARE_ACCESS_TOKEN=your_actual_square_token
REACT_APP_SQUARE_ENVIRONMENT=production
REACT_APP_BACKEND_URL=https://your-backend-url.railway.app/api/square
GENERATE_SOURCEMAP=false
```

2. **Replace the placeholder values** with your actual:
   - Square Application ID
   - Square Access Token (production)
   - Your Railway backend URL

#### **Step 4: Create Bluehost Build Script**

1. **Create `build-bluehost.ps1`** in your project root:
```powershell
# Bluehost Production Build Script
Write-Host "=== FETTERMAN'S BLUEHOST DEPLOYMENT ==="
Write-Host "Starting production build for Bluehost..." -ForegroundColor Green

# Check if Node.js is installed
if (!(Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed!" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed!" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

# Load production environment variables
Write-Host "Loading production environment..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    Get-Content ".env.production" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
} else {
    Write-Host "Warning: .env.production file not found!" -ForegroundColor Yellow
}

# Build the project
Write-Host "Building production version..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "fettermans-bluehost-deploy.zip") {
    Remove-Item "fettermans-bluehost-deploy.zip" -Force
}

Compress-Archive -Path "build\*" -DestinationPath "fettermans-bluehost-deploy.zip" -Force

# Create .htaccess file
Write-Host "Creating .htaccess file..." -ForegroundColor Yellow
$htaccessContent = @"
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
"@

Set-Content -Path "build\.htaccess" -Value $htaccessContent

Write-Host "" 
Write-Host "=== BUILD COMPLETED SUCCESSFULLY! ===" -ForegroundColor Green
Write-Host "Deployment package: fettermans-bluehost-deploy.zip" -ForegroundColor Cyan
Write-Host "" 
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Log into your Bluehost cPanel" -ForegroundColor White
Write-Host "2. Open File Manager" -ForegroundColor White
Write-Host "3. Navigate to public_html" -ForegroundColor White
Write-Host "4. Delete all existing files" -ForegroundColor White
Write-Host "5. Upload fettermans-bluehost-deploy.zip" -ForegroundColor White
Write-Host "6. Extract the zip file" -ForegroundColor White
Write-Host "7. Test your website!" -ForegroundColor White
"@

Set-Content -Path "build-bluehost.ps1" -Value $buildScript
```

---

### **PHASE 3: BUILD AND PREPARE FILES**

#### **Step 5: Build Your Website**

1. **Open PowerShell** in your project directory
2. **Run the build script**:
```powershell
.\build-bluehost.ps1
```

3. **Verify the build completed successfully** - you should see:
   - `build` folder created
   - `fettermans-bluehost-deploy.zip` file created
   - `.htaccess` file in the build folder

---

### **PHASE 4: UPLOAD TO BLUEHOST**

#### **Step 6: Access Bluehost cPanel**

1. **Log into Bluehost**:
   - Go to `https://my.bluehost.com`
   - Enter your login credentials
   - Click "cPanel" or "Advanced"

2. **Open File Manager**:
   - Find "File Manager" in cPanel
   - Click to open

#### **Step 7: Prepare the Directory**

1. **Navigate to your domain folder**:
   - Click on `public_html` (for main domain)
   - OR click on your domain folder if it's an addon domain

2. **Clear existing files** (IMPORTANT!):
   - Select all files and folders in the directory
   - Click "Delete" 
   - Confirm deletion

#### **Step 8: Upload Your Website**

1. **Upload the deployment package**:
   - Click "Upload" button in File Manager
   - Select `fettermans-bluehost-deploy.zip`
   - Wait for upload to complete
   - Close the upload dialog

2. **Extract the files**:
   - Right-click on `fettermans-bluehost-deploy.zip`
   - Select "Extract"
   - Choose "Extract Here"
   - Wait for extraction to complete
   - Delete the zip file after extraction

---

### **PHASE 5: CONFIGURE SSL AND SECURITY**

#### **Step 9: Set Up SSL Certificate**

1. **In cPanel, find "SSL/TLS"**:
   - Click on "SSL/TLS" icon
   - Go to "Let's Encrypt SSL"

2. **Install SSL certificate**:
   - Select your domain
   - Click "Install"
   - Wait for installation (may take 5-10 minutes)

3. **Force HTTPS redirect**:
   - Go back to "SSL/TLS"
   - Click "Force HTTPS Redirect"
   - Enable the redirect

#### **Step 10: Set File Permissions**

1. **In File Manager**:
   - Select all files
   - Right-click → "Change Permissions"
   - Set files to `644`
   - Set folders to `755`

---

### **PHASE 6: TESTING AND VERIFICATION**

#### **Step 11: Test Your Website**

1. **Visit your domain** in a web browser
2. **Test all pages**:
   - Home page
   - Menu pages (Breakfast, Lunch, Deli, Meat & Cheese)
   - About page
   - Contact functionality
   - Shopping cart
   - Checkout process

3. **Test on mobile devices**
4. **Check browser console** for any errors

#### **Step 12: Performance Verification**

1. **Test loading speed** using:
   - Google PageSpeed Insights
   - GTmetrix
   - Pingdom

2. **Verify all images load correctly**
3. **Test form submissions**

---

### **PHASE 7: ONGOING MAINTENANCE**

#### **For Future Updates:**

1. **Make code changes locally**
2. **Run build script**: `.\build-bluehost.ps1`
3. **Upload new zip file to Bluehost**
4. **Extract and replace files**
5. **Test the updates**

#### **Backup Strategy:**

1. **Before each update**:
   - Download current `public_html` contents
   - Keep local backup of working build

2. **Use Bluehost backup features**:
   - Enable automatic backups in cPanel
   - Create manual backups before major changes

---

## 🔧 **REQUIRED FILE MODIFICATIONS**

### **Files You MUST Create:**
1. **`.env.production`** - Production environment variables
2. **`build-bluehost.ps1`** - Build and deployment script

### **Files That Will Be Generated:**
1. **`build/` folder** - Production build files
2. **`build/.htaccess`** - Server configuration
3. **`fettermans-bluehost-deploy.zip`** - Deployment package

### **No Changes Needed To:**
- Existing React components
- Package.json (already has `build:prod` script)
- TypeScript files
- CSS/styling files

---

## ⚠️ **IMPORTANT NOTES**

### **Environment Variables:**
- Unlike Vercel, Bluehost doesn't support runtime environment variables
- All variables must be built into the application at build time
- Keep your `.env.production` file secure and never commit it to Git

### **Domain Configuration:**
- Ensure your domain's nameservers point to Bluehost
- DNS changes can take 24-48 hours to propagate
- Test with both `www` and non-`www` versions

### **Performance Considerations:**
- Bluehost shared hosting is slower than Vercel
- Enable all caching options in the `.htaccess` file
- Consider upgrading to higher-tier hosting if performance is poor

---

## 💰 **TOTAL COST BREAKDOWN**

### **Bluehost Hosting:**
- **Basic Plan**: $2.95/month (promotional, then $7.99/month)
- **Plus Plan**: $5.45/month (promotional, then $10.99/month)

### **Additional Costs:**
- **Domain**: $15.99/year (often free first year)
- **SSL**: Included with Let's Encrypt
- **Backups**: $2.99/month (optional but recommended)

### **Total Monthly Cost: $3-11/month**

---

## 🆘 **TROUBLESHOOTING**

### **Common Issues:**

1. **"404 Not Found" on page refresh:**
   - Check if `.htaccess` file exists in `public_html`
   - Verify mod_rewrite is enabled (contact Bluehost support)

2. **Images not loading:**
   - Check file paths are correct
   - Verify file permissions (644 for files)
   - Ensure files were extracted properly

3. **Shopping cart not working:**
   - Verify backend URL in `.env.production`
   - Check CORS settings on Railway backend
   - Test API endpoints manually

4. **SSL certificate issues:**
   - Wait 24 hours after installation
   - Clear browser cache
   - Contact Bluehost support if persistent

### **Getting Help:**
- **Bluehost Support**: 24/7 chat and phone support
- **Documentation**: Available in cPanel help section
- **Community**: Bluehost community forums

---

## ✅ **FINAL CHECKLIST**

- [ ] Bluehost account set up and domain configured
- [ ] `.env.production` file created with actual values
- [ ] `build-bluehost.ps1` script created
- [ ] Production build completed successfully
- [ ] Files uploaded to `public_html`
- [ ] SSL certificate installed and HTTPS forced
- [ ] All pages tested and working
- [ ] Mobile responsiveness verified
- [ ] Shopping cart and checkout tested
- [ ] Performance checked
- [ ] Backup strategy implemented

**Congratulations! Your Fetterman's website is now live on Bluehost! 🎉**