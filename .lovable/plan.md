

# Rich Shopify Product Cards in the Widget

## Problem

When the AI recommends products, they appear as plain text links (just product names with an arrow icon). The user wants full product cards matching the Shopify collection page style -- with images, prices, discount badges, ratings, and Add to Cart buttons.

## Root Cause

Two issues working together:

1. **System prompt (native mode)** tells the AI to NOT use `:::product` blocks and only use `:::action` blocks, which contain just a name and link -- no image, price, or other data.
2. **Widget render function** displays these actions as simple `<a>` text links with no visual richness.

The Shopify catalog IS being fetched client-side (into `shopifyCatalog`), but it's never used for display -- only sent to the backend for AI context.

## Solution

### 1. Backend: Update system prompt to include product details in action blocks

**File: `supabase/functions/chat/index.ts`**

Change the native display prompt so the AI outputs enriched action blocks that include handle for matching:

```
:::action
type: open_product
product_name: Product Name
product_handle: product-handle
:::
```

This is a minimal change -- the handle is already in the catalog data sent to the AI.

### 2. Widget: Match action blocks against client catalog for rich data

**File: `public/ai-chat-widget.js`**

When `open_product` actions are extracted, look up each product in the already-fetched `shopifyCatalog` array by handle (or fuzzy name match). This gives us the full product data: image, price, compare_at_price, variants, etc.

### 3. Widget: Replace plain text links with rich product cards

**File: `public/ai-chat-widget.js`**

Add CSS styles for product cards matching Shopify's collection page layout:
- Product image (aspect-square)
- Discount percentage badge (green, bottom-left of image)
- Product name (truncated)
- Price with strikethrough for discounted items
- "Add to Cart" button (full-width, styled)
- "In Cart" state with checkmark

Replace the `.aicw-product-links` rendering with a 2-column grid of these cards.

### 4. Widget: Wire up Add to Cart functionality

Each card's "Add to Cart" button will call the existing `shopifyAddToCart()` function (which uses Shopify's `/cart/add.js` endpoint). Track which products are in cart to show the "In Cart" state.

## Visual Change

```text
BEFORE (current):                    AFTER (new):
+---------------------------+        +---------------------------+
| GLAM Woman Perfume   [->] |        | [IMG]        | [IMG]      |
| Luxury Collection    [->] |        | GLAM Woman   | Luxury     |
| CEO Woman Perfume    [->] |        | Rs 599       | Rs 1299    |
| IMPACT Man Perfume   [->] |        | [Add to Cart]| [Add to Ct]|
| Luxury Oud Exp Set   [->] |        | [IMG]        | [IMG]      |
+---------------------------+        | CEO Woman    | IMPACT Man |
                                     | Rs 499       | Rs 699     |
                                     | [Add to Cart]| [Add to Ct]|
                                     +---------------------------+
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Add `product_handle` to the native display prompt so AI includes handles in action blocks |
| `public/ai-chat-widget.js` | Add product card CSS styles, catalog matching logic, rich card rendering with images/prices/buttons, and Add to Cart wiring |

## How It Works End-to-End

1. Widget opens, fetches `/products.json` from Shopify (already working)
2. User speaks, audio goes to STT, text goes to chat backend
3. Backend has the full catalog context, AI recommends products with handles
4. Widget extracts `:::action` blocks, matches handles against `shopifyCatalog`
5. Widget renders rich product cards with real images, prices from Shopify
6. User taps "Add to Cart" -- calls Shopify's `/cart/add.js` with the variant ID
7. Card updates to show "In Cart" state

No new dependencies or API keys needed. The Shopify catalog fetch and cart integration already exist.

