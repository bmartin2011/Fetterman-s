/**
 * Cache Busting Script
 * 
 * This script is used during the build process to add cache-busting query parameters
 * to static asset references in the HTML and CSS files, and to update version numbers
 * in the service worker and index.html.
 * 
 * Usage: node cache-bust.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate a timestamp-based version string
const timestamp = new Date().getTime();
const version = `v=${timestamp}`;
const shortVersion = Math.floor(timestamp / 1000).toString();

// Paths
const PUBLIC_DIR = __dirname;
const BUILD_DIR = path.join(__dirname, '..', 'build');

// Update the version in the service worker
function updateServiceWorkerVersion() {
  const swPaths = [
    path.join(PUBLIC_DIR, 'sw.js'),
    path.join(BUILD_DIR, 'sw.js')
  ];
  
  swPaths.forEach(swPath => {
    if (fs.existsSync(swPath)) {
      let swContent = fs.readFileSync(swPath, 'utf8');
      
      // Update the CACHE_VERSION
      swContent = swContent.replace(
        /const CACHE_VERSION = ['"](\d+)['"];/,
        `const CACHE_VERSION = '${shortVersion}';`
      );
      
      fs.writeFileSync(swPath, swContent);
      console.log(`Updated service worker cache version in ${swPath}`);
    }
  });
}

// Update the version in index.html
function updateIndexHtmlVersion() {
  const indexPaths = [
    path.join(PUBLIC_DIR, 'index.html'),
    path.join(BUILD_DIR, 'index.html')
  ];
  
  indexPaths.forEach(indexPath => {
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Update the FRONTEND_VERSION
      indexContent = indexContent.replace(
        /const FRONTEND_VERSION = ['"](.*)['"];/,
        `const FRONTEND_VERSION = '${timestamp}';`
      );
      
      fs.writeFileSync(indexPath, indexContent);
      console.log(`Updated frontend version in ${indexPath}`);
    }
  });
}

// Add cache busting to script and link tags in HTML
function addCacheBustingToHtml() {
  const indexPaths = [
    path.join(PUBLIC_DIR, 'index.html'),
    path.join(BUILD_DIR, 'index.html')
  ];
  
  indexPaths.forEach(indexPath => {
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Add version parameter to script sources that don't already have query params
      indexContent = indexContent.replace(
        /(<script[^>]+src=['"])([^'"?]+)(['"])/g,
        `$1$2?${version}$3`
      );
      
      // Add version parameter to link hrefs (CSS) that don't already have query params
      indexContent = indexContent.replace(
        /(<link[^>]+href=['"])([^'"?]+\.css)(['"])/g,
        `$1$2?${version}$3`
      );
      
      fs.writeFileSync(indexPath, indexContent);
      console.log(`Added cache busting to HTML resources in ${indexPath}`);
    }
  });
}

// Update asset references in build output JS and CSS files
function updateBuildAssetReferences() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.log('Build directory not found, skipping build asset updates');
    return;
  }
  
  // Process JS files in build/static/js
  const jsDir = path.join(BUILD_DIR, 'static', 'js');
  if (fs.existsSync(jsDir)) {
    fs.readdirSync(jsDir).forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(jsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add cache busting to any hardcoded asset URLs
        content = content.replace(
          /(\/static\/(?:media|css|js)\/[^"'?]+)(["'])/g,
          `$1?${version}$2`
        );
        
        fs.writeFileSync(filePath, content);
      }
    });
    console.log('Updated asset references in JS files');
  }
  
  // Process CSS files in build/static/css
  const cssDir = path.join(BUILD_DIR, 'static', 'css');
  if (fs.existsSync(cssDir)) {
    fs.readdirSync(cssDir).forEach(file => {
      if (file.endsWith('.css')) {
        const filePath = path.join(cssDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add cache busting to any hardcoded asset URLs
        content = content.replace(
          /(url\(['"]?\/static\/(?:media|css|js)\/[^)"'?]+)(['"]?\))/g,
          `$1?${version}$2`
        );
        
        fs.writeFileSync(filePath, content);
      }
    });
    console.log('Updated asset references in CSS files');
  }
}

// Clear browser caches via service worker
function clearBrowserCaches() {
  console.log('\nTo clear browser caches:');
  console.log('1. The service worker has been updated to version', shortVersion);
  console.log('2. Frontend version has been updated to', timestamp);
  console.log('3. All static assets now include cache-busting query parameters');
  console.log('\nUsers will automatically receive the new version on their next visit.');
  console.log('For immediate updates, users can refresh their browser or clear their browser cache.');
}

// Main function
function main() {
  try {
    console.log('Starting cache busting process...');
    
    // Update versions
    updateServiceWorkerVersion();
    updateIndexHtmlVersion();
    
    // Add cache busting to HTML and build assets
    addCacheBustingToHtml();
    updateBuildAssetReferences();
    
    // Display cache clearing instructions
    clearBrowserCaches();
    
    console.log('\nCache busting completed successfully!');
  } catch (error) {
    console.error('Error during cache busting:', error);
    process.exit(1);
  }
}

// Run the script
main();