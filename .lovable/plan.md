
# Fix: Product Collections Not Showing After Voice Recommendations

## Current Setup

The system works like this:
1. User speaks a request like "suggest party wear" or "dost ki shaadi"
2. Backend AI receives the request with the product catalog and a system prompt
3. AI is instructed to output `:::action` blocks (e.g., `navigate_to_search` with a query like "party perfume") alongside its spoken response
4. Widget extracts these action blocks, then after speaking the response, navigates the browser to Shopify's search page (`/search?q=party+perfume`)
5. The real Shopify search results page shows the product collection

## The Problem

The AI model sometimes **speaks about products but forgets to output the `:::action` block**. Without the action block, the widget has nothing to navigate to -- so the user hears product names but sees no collection/search results.

## Fix (Two Parts)

### 1. Add a fallback auto-search in the widget
**File: `public/ai-chat-widget.js`** (in `onChatComplete` function, ~line 743)

If the AI response mentions products but contains NO `navigate_to_search`, `navigate_to_collection`, or `open_product` action, the widget will auto-generate a search navigation from the user's original query. This is the safety net.

Logic:
```
if (isShopifyPlatform && actions.length === 0 && looksLikeProductRecommendation(fullResponse)) {
  pendingNavigation = "/search?q=" + encodeURIComponent(simplifyQuery(query));
}
```

`looksLikeProductRecommendation` checks if the response contains price indicators (Rs, rupees, numbers with prices) or multiple product-like mentions. `simplifyQuery` extracts key search terms from the user's spoken query (strips filler words).

### 2. Strengthen the system prompt
**File: `supabase/functions/chat/index.ts`** (~line 597)

Add a stronger reinforcement near the end of the native display instructions:

```
CRITICAL REMINDER: You MUST include a :::action block in EVERY response that discusses products.
If you recommend products, you MUST also output navigate_to_search or navigate_to_collection.
NEVER describe products without an accompanying action block. The user cannot see products unless you include the action.
```

## What Changes

| File | Change |
|------|--------|
| `public/ai-chat-widget.js` | Add fallback auto-search when AI omits action blocks but response looks like product recommendations |
| `supabase/functions/chat/index.ts` | Add stronger prompt reinforcement to always include action blocks with product recommendations |

## After Deploying

Update Shopify script tag to `?v=109` and hard refresh:
```text
<script
  src="https://voice-cart-guide.lovable.app/ai-chat-widget.js?v=109"
  data-store-id="bella-vita"
  data-api-url="https://cjgyelmkjgwgwbwydddz.supabase.co"
  data-api-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZ3llbG1ramd3Z3did3lkZGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjUzNzUsImV4cCI6MjA4NzUwMTM3NX0.pdf-BL2W6o4PFsiPjXYjanDWCEswWpt6SZoSqS86-sU"
  data-primary-color="#6c3beb"
  data-title="Bella Vita AI"
  data-platform="shopify"
></script>
```
