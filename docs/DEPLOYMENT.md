# Deploying Rebuilder Landing Page to GitHub Pages

This guide will help you deploy the Rebuilder Framework landing page to GitHub Pages.

## 📁 Files Created

- `docs/index.html` - Main landing page
- `docs/landing-styles.css` - Stylesheet
- `docs/landing-script.js` - Interactive JavaScript
- `landing-page.html` - Standalone version (all-in-one)

## 🚀 Quick Deploy to GitHub Pages

### Method 1: Using GitHub UI (Easiest)

1. **Commit the files:**
   ```bash
   git add docs/
   git commit -m "Add landing page for GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository: https://github.com/Jade-Leonard25/builder
   - Click **Settings** tab
   - Scroll to **Pages** section (left sidebar)
   - Under **Source**, select **Deploy from a branch**
   - Under **Branch**, select `main` and `/docs` folder
   - Click **Save**

3. **Wait for deployment** (usually 1-2 minutes)

4. **Visit your site:**
   ```
   https://jade-leonard25.github.io/builder/
   ```

### Method 2: Using GitHub Actions (Advanced)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## 📝 Pre-Deployment Checklist

Before deploying, make sure:

- [x] All links point to correct GitHub/npm URLs
- [x] Images and assets load correctly
- [x] Interactive demo works
- [x] Responsive design on mobile
- [x] Copy buttons function properly
- [x] Smooth scrolling works
- [x] Footer links are correct

## 🔧 Customization

### Update GitHub URLs

If you need to change the repository URL, update these in `docs/index.html`:

```html
<!-- Line 47, 51 -->
<a href="https://github.com/Jade-Leonard25/builder" target="_blank">GitHub</a>

<!-- Footer -->
<a href="https://github.com/Jade-Leonard25/builder">Documentation</a>
```

### Update npm Package Name

If your npm package name changes, update:

```html
<!-- Line 52 -->
<a href="https://npmjs.com/package/rebuilder-framework-cli" target="_blank">npm</a>

<!-- Quick Start section -->
<code>npm install -g rebuilder-framework-cli</code>
```

### Change Colors

Edit `docs/landing-styles.css` CSS variables:

```css
:root {
  --accent: #3b82f6;        /* Primary blue */
  --accent-hover: #2563eb;  /* Darker blue */
  --accent-light: #60a5fa;  /* Lighter blue */
}
```

## 🎨 Features Included

✅ **Responsive Design** - Works on all devices  
✅ **Interactive Demo** - Live counter example  
✅ **Smooth Animations** - Scroll-triggered animations  
✅ **Copy-to-Clipboard** - One-click command copying  
✅ **Syntax Highlighting** - Color-coded code examples  
✅ **SEO Optimized** - Meta tags and descriptions  
✅ **Fast Loading** - Minimal dependencies, pure CSS/JS  

## 📱 Mobile Responsive

The landing page automatically adjusts for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🧪 Testing Locally

Before deploying, test locally:

```bash
# Using Python
cd docs
python -m http.server 8000

# Using Node.js
npx serve docs

# Using PHP
cd docs
php -S localhost:8000
```

Then visit: `http://localhost:8000`

## 🌐 Custom Domain (Optional)

To use a custom domain like `rebuilder.dev`:

1. Add a `docs/CNAME` file with your domain:
   ```
   rebuilder.dev
   ```

2. Configure DNS with your domain provider:
   ```
   Type: CNAME
   Name: www (or @)
   Value: jade-leonard25.github.io
   ```

3. Enable "Enforce HTTPS" in GitHub Pages settings

## 📊 Analytics (Optional)

Add Google Analytics by inserting before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🐛 Troubleshooting

### Page shows 404
- Check that GitHub Pages is enabled
- Verify the branch and folder are correct
- Wait a few minutes for deployment

### Styles not loading
- Verify CSS file path in `index.html`
- Check browser console for errors
- Hard refresh: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)

### JavaScript not working
- Check browser console for errors
- Verify script file path
- Ensure JavaScript is enabled in browser

## 🔗 Useful Links

- **Live Site:** https://jade-leonard25.github.io/builder/
- **Repository:** https://github.com/Jade-Leonard25/builder
- **npm Package:** https://npmjs.com/package/rebuilder-framework-cli
- **GitHub Pages Docs:** https://docs.github.com/pages

## 📈 Next Steps

After deployment:

1. Share the landing page URL on social media
2. Add the link to your README.md
3. Submit to framework directories (awesome-lists, etc.)
4. Monitor analytics and user feedback
5. Iterate and improve based on feedback

## 🎉 You're Done!

Your landing page should now be live at:
**https://jade-leonard25.github.io/builder/**

Enjoy showcasing your framework! 🚀
