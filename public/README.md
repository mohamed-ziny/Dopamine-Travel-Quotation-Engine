# Frontend Files

This folder contains the frontend HTML files served by Express.

## Files

- **index.html** - Main quotation system interface

## How It Works

When you start the server with `npm run dev`, Express serves these files:

- `http://localhost:5000/` → serves `public/index.html`
- `http://localhost:5000/api/*` → API endpoints

## Adding New Pages

To add more pages, just create them in this folder:

```
public/
├── index.html          # Main page (/)
├── reports.html        # Reports page (/reports.html)
├── settings.html       # Settings page (/settings.html)
└── assets/            # Optional: CSS, JS, images
    ├── styles.css
    └── logo.png
```

Then access them at:
- `http://localhost:5000/reports.html`
- `http://localhost:5000/settings.html`

## Customization

You can customize `index.html` directly. Changes will be visible after refreshing the browser (no need to restart the server).

## Production Notes

- All files in this folder are publicly accessible
- Don't store sensitive data or API keys here
- Use environment variables for configuration
