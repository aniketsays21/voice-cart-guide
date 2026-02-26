

# Fix Recommendation Responses + Exact Shopify Script

## Problems Identified

1. **AI gateway 503 errors** — The AI service occasionally returns "503 no healthy upstream", causing the widget to show "Something went wrong" or get stuck in processing state with no recovery.
2. **No retry on failure** — When the AI call fails, the widget doesn't retry, leaving users without a response.
3. **Model sometimes ignores native display instructions** — The very long system prompt (~600+ lines) can cause the AI to occasionally output `:::product` blocks instead of `:::action` blocks in native display mode, resulting in no visible navigation.

## Plan

### 1. Add retry logic in the widget for failed AI calls
**File: `public/ai-chat-widget.js`**

In the `sendToChat` function (around line 665), add retry logic: if the chat endpoint returns a non-200 status (especially 503), retry once after 2 seconds before giving up.

### 2. Add fallback for 503 errors in the edge function
**File: `supabase/functions/chat/index.ts`**

Around line 808, when the AI gateway returns 503, retry once with a 1-second delay before returning an error to the client. This handles transient upstream issues.

### 3. Improve error recovery in the widget voice state
**File: `public/ai-chat-widget.js`**

In the error handler (around line 674), ensure the widget resets to "idle" state and auto-restarts listening after showing the error, instead of getting stuck.

### 4. Exact Shopify Script Tag

This is the complete script tag to place in your Shopify `theme.liquid` file, just before the closing `</body>` tag:

```text
<script
  src="https://voice-cart-guide.lovable.app/ai-chat-widget.js?v=108"
  data-store-id="bella-vita"
  data-api-url="https://cjgyelmkjgwgwbwydddz.supabase.co"
  data-api-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZ3llbG1ramd3Z3did3lkZGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjUzNzUsImV4cCI6MjA4NzUwMTM3NX0.pdf-BL2W6o4PFsiPjXYjanDWCEswWpt6SZoSqS86-sU"
  data-primary-color="#6c3beb"
  data-title="Bella Vita AI"
  data-platform="shopify"
></script>
```

Important: bump `?v=108` each time you update. After placing this, do a hard refresh (Ctrl+Shift+R).

## Technical Changes Summary

| File | Change |
|------|--------|
| `public/ai-chat-widget.js` | Add 1-retry logic in `sendToChat` for 503/500 errors; improve error recovery to auto-restart listening |
| `supabase/functions/chat/index.ts` | Add 1-retry with 1s delay when AI gateway returns 503 |

These changes ensure that transient AI service failures don't break the recommendation flow for users.

