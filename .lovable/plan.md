

# Fix: Published Widget Script Is Outdated (1023 lines vs 1176 lines)

## Root Cause

The published file at `voice-cart-guide.lovable.app/ai-chat-widget.js` is still the **old 1023-line version** without:
- MIME normalization
- Container sniffing
- Auto-retry on STT failure
- Max recording timeout
- The simplified open/close flow

Your Shopify store loads this old script, which has a different recording pipeline that sends audio in a format Sarvam STT rejects (400 error). That is why STT logs show zero processing requests -- the old widget either doesn't send properly or fails silently.

## The Fix

Since publishing doesn't seem to be updating the static file, we need to force it by making a trivial change to the widget file (e.g., bumping the version comment) and then you publish again. Additionally, we should add a cache-busting query parameter to ensure Shopify loads the fresh version.

### Step 1: Bump version string in `public/ai-chat-widget.js`
- Change the version comment from `v2.1` to `v2.2` to force a content change on publish

### Step 2: You click Publish -> Update again

### Step 3: Update your Shopify `theme.liquid` script tag
Add a cache-busting parameter to ensure browsers and CDNs don't serve the stale file:
```html
<script src="https://voice-cart-guide.lovable.app/ai-chat-widget.js?v=3"></script>
```

### Step 4: Verify
After publishing, we will fetch the published URL again to confirm it now has 1176 lines with the `v2.2` header.

## Why This Keeps Happening
Static files in `public/` may be cached by the CDN or browser. A version bump + cache-busting parameter on the Shopify side is the permanent solution.
