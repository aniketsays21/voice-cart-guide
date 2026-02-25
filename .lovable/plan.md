

# Deploy AI Chat Widget to Your Shopify Store

## Overview

Here's the complete end-to-end process to get your AI assistant live on your Shopify website. No Shopify API keys needed -- the widget uses Shopify's built-in public APIs automatically.

---

## Step-by-Step Process

### Step 1: Build the Widget Bundle

I'll add a build script to `package.json` so you can easily generate the widget file. Then you run:

```
npm run build:widget
```

This creates a single file: `dist-widget/ai-chat-widget.js`

### Step 2: Host the File

**Easiest option -- use your Shopify store itself:**

1. In your Shopify Admin, go to **Settings -> Files**
2. Click **Upload files** and upload the `ai-chat-widget.js` file
3. Shopify gives you a CDN URL like: `https://cdn.shopify.com/s/files/1/xxxx/xxxx/files/ai-chat-widget.js`
4. Copy that URL -- you'll need it in the next step

### Step 3: Add the Script to Your Shopify Theme

1. In Shopify Admin, go to **Online Store -> Themes**
2. Click **"..." -> Edit code** on your active theme
3. Open the file `theme.liquid` (under Layout)
4. Paste this code just **before** the closing `</body>` tag:

```html
<script
  src="YOUR_CDN_URL_FROM_STEP_2"
  data-store-id="your-store-name"
  data-api-url="https://cjgyelmkjgwgwbwydddz.supabase.co"
  data-api-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZ3llbG1ramd3Z3did3lkZGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjUzNzUsImV4cCI6MjA4NzUwMTM3NX0.pdf-BL2W6o4PFsiPjXYjanDWCEswWpt6SZoSqS86-sU"
  data-title="Bella Vita Assistant"
  data-primary-color="#6c3beb"
></script>
```

5. Click **Save**

### Step 4: Done -- It's Live!

Visit your Shopify store. You'll see the chat bubble in the bottom-right corner. The widget automatically:
- Detects it's on Shopify (via `window.Shopify`)
- Uses Shopify's native `/cart/add.js` for "add to cart" commands
- Navigates to real product pages on your store
- Handles checkout/cart redirects

---

## What I'll Change in Code

| File | Change |
|---|---|
| `package.json` | Add `"build:widget"` script for convenience |

This is a one-line change to make building easier. Everything else is already implemented.

---

## Checklist Before Going Live

- Build the widget: `npm run build:widget`
- Upload `dist-widget/ai-chat-widget.js` to Shopify Files
- Paste the script tag in `theme.liquid` before `</body>`
- Replace `YOUR_CDN_URL_FROM_STEP_2` with the actual Shopify CDN URL
- Replace `your-store-name` with your actual store identifier
- Visit your store and test the chat bubble

