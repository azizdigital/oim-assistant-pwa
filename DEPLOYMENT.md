# GitHub Pages Deployment Guide

## Quick Setup

### 1. Create GitHub Repository
```bash
# Go to GitHub.com and create new repository
# Name: oim-assist-pwa (or any name you like)
# Public or Private (your choice)
# Don't initialize with README (we already have one)
```

### 2. Push to GitHub
```bash
# In your local project folder
git init
git add .
git commit -m "Initial commit - OIM Assistant PWA v5.1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/oim-assist-pwa.git
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to repository Settings
2. Click "Pages" in left sidebar
3. Under "Source":
   - Branch: `main`
   - Folder: `/ (root)`
4. Click "Save"
5. Wait 1-2 minutes for deployment

### 4. Access Your App
Your app will be live at:
```
https://YOUR-USERNAME.github.io/oim-assist-pwa/
```

## Important Notes

### Service Worker Path
GitHub Pages serves from subdirectory. Update `pwa.js` if needed:

```javascript
// Change this line in pwa.js:
navigator.serviceWorker.register('/sw.js')

// To this (if not working):
navigator.serviceWorker.register('./sw.js')
```

### Manifest Path
If icons don't load, update `manifest.json`:

```json
{
  "start_url": "./",
  "scope": "./",
  "icons": [
    {
      "src": "./icons/icon-192.png",
      ...
    }
  ]
}
```

## Custom Domain (Optional)

### Using Your Own Domain
1. Go to repository Settings > Pages
2. Under "Custom domain", enter your domain
3. In your domain DNS settings, add:
   ```
   Type: CNAME
   Name: www (or subdomain)
   Value: YOUR-USERNAME.github.io
   ```
4. Wait for DNS propagation (5-30 minutes)

## Testing Locally

Before pushing, test locally:

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Open: `http://localhost:8000`

## Troubleshooting

### App Not Loading
- Clear browser cache
- Check browser console for errors
- Verify all files are committed and pushed
- Wait a few minutes after deployment

### Icons Not Showing
- Check paths in manifest.json
- Verify icons folder is uploaded
- Try using relative paths (./ instead of /)

### Service Worker Issues
- Check sw.js path in pwa.js
- Verify HTTPS (required for PWA)
- GitHub Pages automatically uses HTTPS
- Clear service worker cache: DevTools > Application > Clear storage

### Apple Pencil Not Working
- Ensure SignaturePad library is loaded
- Check browser console for errors
- Test on actual iPad/iPhone (not simulator)

## Updating Your App

```bash
# Make changes to files
git add .
git commit -m "Description of changes"
git push

# GitHub Pages auto-deploys in 1-2 minutes
```

## Best Practices

1. **Test Locally First** - Always test before pushing
2. **Use Branches** - Create feature branches for major changes
3. **Version Control** - Update version number in manifest.json
4. **Cache Busting** - Update CACHE_NAME in sw.js when making changes
5. **Backup Data** - Export JSON before major updates

## Cache Management

When you update the app, users might see old version due to caching:

### Force Update
In `sw.js`, increment version:
```javascript
const CACHE_NAME = 'oim-assist-v2'; // Change v1 to v2
```

### Clear Old Cache
The service worker automatically clears old caches on activation.

## Performance Tips

1. **Minimize External Dependencies** - Already optimized
2. **Compress Images** - Icons are already optimized
3. **Enable Gzip** - GitHub Pages does this automatically
4. **Use CDN for Libraries** - Already implemented

## Security

GitHub Pages provides:
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ CDN distribution
- ✅ No server-side code execution (static only)

All user data stays on device - nothing transmitted to servers.

## Monitoring

Check deployment status:
1. Repository > Actions (if enabled)
2. Settings > Pages (shows last deployment time)
3. Check live URL

## Support

If you encounter issues:
1. Check GitHub Pages status: https://www.githubstatus.com
2. Review repository settings
3. Check browser console for errors
4. Test in incognito/private mode

---

**Your app is now live and accessible from any device! 🚀**
