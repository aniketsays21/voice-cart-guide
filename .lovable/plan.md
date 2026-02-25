

# Display Multiple Products from Live Shopify Catalog Inside the Widget

## Overview

Instead of navigating away to Shopify search pages, the widget will display multiple product cards fetched from the live Shopify catalog directly inside the widget. The AI will recommend multiple products, and the widget will render them using real data (images, prices, availability) from the store.

## How It Works

```text
User speaks: "show me party perfumes"
       |
       v
AI analyzes catalog, picks 3-6 best matches
       |
       v
AI responds with speech + multiple open_product actions
       |
       v
Widget speaks the response
       |
       v
After speech ends, widget shows a product grid
populated with LIVE Shopify data from the client-side catalog
(real images, real prices, real availability)
       |
       v
User can tap "Add to Cart" or "View" on any product
```

## Changes by File

### 1. Backend: `supabase/functions/chat/index.ts`

Update the system prompt's NAVIGATION RULES to:
- Replace `navigate_to_search` with multiple `open_product` action blocks
- For category queries ("party perfumes", "gift sets under 1000"), the AI should output 3-6 `open_product` actions, one per recommended product
- For single product queries, output one `open_product` action (same as now)
- The AI picks the best matching products from the catalog using handles

Example AI output for "show me party perfumes":
```
Here are some amazing party perfumes from Bella Vita.

:::action
type: open_product
product_name: CEO Man
product_handle: ceo-man-perfume
product_link: /products/ceo-man-perfume
:::

:::action
type: open_product
product_name: Skai Aquatic
product_handle: skai-aquatic-perfume
product_link: /products/skai-aquatic-perfume
:::

:::action
type: open_product
product_name: Honey Oud
product_handle: honey-oud
product_link: /products/honey-oud
:::
```

### 2. Widget: `public/ai-chat-widget.js`

**onChatComplete changes:**
- When multiple `open_product` actions are found, instead of setting `pendingNavigation`, collect them into a `productCards` array
- Each product is enriched with live data from `shopifyCatalog` using the existing `enrichAction` function (images, prices, variant IDs)
- After TTS finishes speaking, show the product grid instead of navigating away

**Render changes:**
- After the AI speaks, switch the widget view from avatar mode to a product grid view
- The product grid uses the existing `.aicw-pcard` CSS (already defined in styles)
- Each card shows: product image, name, price (with compare-at-price strikethrough), and an "Add to Cart" button
- Tapping "Add to Cart" uses the existing `shopifyAddToCart` function with the live variant ID
- Tapping the product image or name navigates to the product detail page on Shopify
- A "Back" button returns to the avatar/mic view for another query

**Single product behavior:**
- If only one `open_product` action exists, navigate directly to the product page (same as current behavior)

### 3. Flow Comparison

| Scenario | Current Behavior | New Behavior |
|----------|-----------------|-------------|
| "Show me party perfumes" | Redirects to /search page | Shows 3-6 product cards in widget with live images and prices |
| "Gift sets under 1000" | Redirects to /search page | Shows matching gift set cards in widget |
| "Tell me about Dynamite" | Navigates to product page | Same -- navigates to product page (single product) |
| "Add to cart" | Shopify cart API | Same (no change) |

### 4. What the User Sees

1. Opens widget, speaks "party perfumes"
2. AI responds via voice: "Here are some great party perfumes from Bella Vita"
3. After speech ends, the avatar view transitions to a 2-column product grid
4. Each card shows the real product image, name, live price, and "Add to Cart" button -- all from the Shopify store's live data
5. User can add items to cart directly, tap a card to visit the product page, or tap "Back" to ask another question

### 5. Technical Details

- Product data comes from `shopifyCatalog` which is fetched client-side from `/products.json?limit=250` on widget initialization -- this is live Shopify data
- The `enrichAction` function already maps AI-provided handles to the local catalog, extracting variant IDs, images, prices, and availability
- The `.aicw-pcard` CSS styles are already defined in the widget stylesheet -- product cards, images, prices, badges, and "Add to Cart" buttons are all styled
- The `shopifyAddToCart` function uses Shopify's `/cart/add.js` API with variant IDs for reliable cart operations
- No page navigation occurs for multi-product responses -- the user stays on the current page with the widget overlay

