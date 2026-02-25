
# Native Shopify Actions via Voice Widget

## Overview

When embedded on a Shopify store, the widget will perform **real Shopify actions** -- adding products to the store's actual cart, navigating to product pages, and redirecting to checkout -- all triggered by voice or text commands.

## What Will Work After This

| Voice Command | Action |
|---|---|
| "Add this to cart" | Calls Shopify's `/cart/add.js` API -- item appears in the store's real cart |
| "Show me more about X" | Navigates the browser to the product's PDP page on the store |
| "Go to checkout" | Redirects to `/checkout` |
| "Open my cart" | Redirects to `/cart` |

## How It Works

The AI already returns structured action blocks like:

```text
:::action
type: add_to_cart
product_name: Product Name
:::
```

Right now the widget ignores these. The plan is to **parse and execute them as real Shopify actions** on the host page.

## Technical Details

### 1. Add Shopify Platform Detection (`src/embed/widget.ts`)

- Detect if the widget is running on a Shopify store by checking for `window.Shopify` (Shopify injects this global on all stores).
- When on Shopify, use native APIs. When not on Shopify, fall back to the current behavior (internal cart + external links).

### 2. Add Shopify Action Handlers (`src/embed/shopify.ts` -- new file)

Create a small module with these functions:

- **`shopifyAddToCart(variantId, quantity)`** -- POST to `/cart/add.js` with the variant ID. This adds the item to the store's real cart and shows Shopify's native cart notification.
- **`shopifyNavigate(url)`** -- `window.location.href = url` to navigate to a PDP or collection page.
- **`shopifyGoToCheckout()`** -- Redirect to `/checkout`.
- **`shopifyGoToCart()`** -- Redirect to `/cart`.

### 3. Parse Action Blocks in Widget (`src/embed/widget.ts`)

- Extend the `parseContent` function to detect `:::action` blocks (in addition to `:::product` blocks).
- When an action is detected:
  - `add_to_cart` -- Match the product name to a product card already shown, extract the Shopify product handle/link, call `/cart/add.js`.
  - `open_product` -- Navigate to the product's URL on the store.

### 4. Enrich Product Data for Shopify (`src/embed/types.ts`)

- Add optional `variantId` and `handle` fields to product cards so the widget knows which Shopify variant to add.
- The AI system prompt already includes product links. For Shopify stores, these links contain the product handle (e.g., `/products/bella-vita-perfume`), which can be used to fetch the variant ID via Shopify's `/products/{handle}.js` endpoint.

### 5. Update AI System Prompt (`supabase/functions/chat/index.ts`)

- Add a new action type `navigate_to_checkout` and `navigate_to_cart` to the system prompt so the AI can trigger those actions via voice.
- Ensure the `add_to_cart` action includes the product link so the widget can resolve it to a Shopify variant.

### 6. Config Extension (`src/embed/types.ts`)

- Add an optional `platform` field to `WidgetConfig`: `"shopify" | "generic"`.
- Auto-detect via `window.Shopify` if not specified.

### Flow Diagram

```text
User speaks "Add this to cart"
        |
        v
  AI returns :::action type: add_to_cart
        |
        v
  Widget parses action block
        |
        v
  Is Shopify? ──Yes──> Extract handle from product link
        |                      |
        No                     v
        |              GET /products/{handle}.js
        v                      |
  Internal cart                v
  (current behavior)   POST /cart/add.js (variant_id)
                               |
                               v
                    Item in real Shopify cart
```

### Files Changed

| File | Change |
|---|---|
| `src/embed/shopify.ts` | New -- Shopify Cart API + navigation helpers |
| `src/embed/widget.ts` | Parse `:::action` blocks, call Shopify handlers |
| `src/embed/types.ts` | Add `platform`, `variantId`, `handle` fields |
| `src/embed/index.ts` | Pass platform config, auto-detect Shopify |
| `supabase/functions/chat/index.ts` | Add checkout/cart navigation actions to prompt |
