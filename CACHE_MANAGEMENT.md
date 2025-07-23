# Browser Cache Management Guide

## Overview

This document explains how the caching system works in the Fetterman's application and provides instructions for managing browser caches, especially when deploying new versions of the application.

## How Browser Caching Works in This Application

The application uses several techniques to manage browser caching:

1. **Service Worker Caching**: A service worker (`sw.js`) manages caching of static assets and API responses using different strategies:
   - HTML and main application files: Network-first strategy
   - JavaScript and CSS: Network-first strategy
   - Images: Cache-first strategy with background updates
   - API responses: Network-first with cache fallback

2. **Version-Based Cache Busting**: The application uses version numbers to force cache refreshes:
   - `CACHE_VERSION` in the service worker determines cache storage names
   - `FRONTEND_VERSION` in index.html tracks frontend version changes
   - Query parameters (`?v=timestamp`) are added to static asset URLs

3. **Automatic Cache Refresh**: When a new version is deployed:
   - Service worker detects version changes and clears old caches
   - Client-side code checks for version changes and forces page reload
   - Periodic service worker updates check for new versions

## Handling Cache Issues

### When Users Report Seeing Outdated Content

If users report seeing outdated content after a deployment, you can take these actions:

1. **Increment Cache Version**: 
   - Edit `public/sw.js` and increase the `CACHE_VERSION` value
   - This forces all service workers to clear their caches and fetch fresh content

2. **Update Frontend Version**:
   - Edit `public/index.html` and update the `FRONTEND_VERSION` value
   - This triggers a page reload for users with the old version

3. **Run the Cache Busting Script**:
   ```
   npm run cache:clear
   ```
   This script updates version numbers and adds cache-busting parameters to asset URLs.

4. **Rebuild and Deploy**:
   ```
   npm run build:prod
   ```
   The build process automatically runs the cache-busting script.

### For Urgent Cache Issues

If you need to force all users to get the latest version immediately:

1. Increment the `CACHE_VERSION` in `public/sw.js` by a significant amount (e.g., from '3' to '10')
2. Change the `FRONTEND_VERSION` in `public/index.html` to a new value (e.g., current timestamp)
3. Run the build and deploy process

## How the Cache Busting System Works

The cache-busting system works through these components:

1. **Service Worker (`public/sw.js`)**:
   - Uses versioned cache names (`fettermans-v3`, `static-v3`, etc.)
   - Clears old caches during activation
   - Sends messages to clients when cache updates occur
   - Implements different caching strategies for different asset types

2. **Index HTML (`public/index.html`)**:
   - Tracks frontend version in localStorage
   - Detects version changes and forces page reload
   - Listens for cache update messages from service worker
   - Periodically checks for service worker updates

3. **Cache Busting Script (`public/cache-bust.js`)**:
   - Updates version numbers in service worker and index.html
   - Adds cache-busting query parameters to asset URLs
   - Runs automatically during the build process
   - Can be run manually with `npm run cache:clear`

## Best Practices for Deployments

1. **Always increment versions**: When deploying significant changes, increment the `CACHE_VERSION` in `public/sw.js`

2. **Use the build script**: Always use the provided build scripts (`npm run build` or `npm run build:prod`) which automatically handle cache busting

3. **Monitor after deployment**: After deploying, check that users are receiving the new version

4. **Communicate with users**: For major updates, consider notifying users to refresh their browsers

## Troubleshooting

If users still report cache issues after following the steps above:

1. Ask them to try a hard refresh (Ctrl+F5 or Cmd+Shift+R)

2. Ask them to clear their browser cache manually:
   - Chrome: Settings → Privacy and Security → Clear browsing data
   - Firefox: Options → Privacy & Security → Cookies and Site Data → Clear Data
   - Safari: Preferences → Advanced → Show Develop menu → Develop → Empty Caches

3. As a last resort, they can try opening the site in an incognito/private window