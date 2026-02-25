

# Voice Agent Actions with Visual Feedback on Shopify

## What Changes

The voice agent will execute real Shopify actions (add to cart, open product, checkout, apply discount) when the user speaks commands, AND show visual toast notifications so the user sees what's happening.

## Current State

The system prompt already instructs the AI to output `:::action` blocks for commands like "add to cart", "open product", "go to checkout", etc. The widget already parses these actions and executes them via Shopify's AJAX API (`/cart/add.js`, `/products/handle.js`, etc.).

**Problem**: There's no visual feedback. The add-to-cart result is only logged to `console.log`. The user has no idea the action happened.

## What Will Work After This Change

| Voice Command | Action | Visual Feedback |
|---|---|---|
| "Add [product] to cart" | Calls Shopify `/cart/add.js` | Toast: "Product added to cart!" with green check |
| "Open [product]" | Navigates to product page | Toast: "Opening product..." |
| "Go to checkout" | Redirects to `/checkout` | Toast: "Going to checkout..." |
| "Show my cart" | Redirects to `/cart` | Toast: "Opening cart..." |
| "Buy [product]" | Add to cart + go to checkout | Toast sequence |
| "Tell me about [product]" | AI responds with product info | Voice response plays |

## Technical Changes

### File: `public/ai-chat-widget.js`

**1. Add Toast Notification CSS**

New styles for a toast notification that slides in from the top of the overlay:
- `.aicw-toast` -- fixed position toast with icon, message, and auto-dismiss animation
- Success (green), info (blue), and error (red) variants
- Auto-fades out after 3 seconds

**2. Add `showToast(message, type)` function**

Creates a temporary toast element in the shadow DOM that auto-removes after 3 seconds. Types: "success", "info", "error".

**3. Update `executePendingActions()` with visual feedback**

Currently:
```javascript
case "add_to_cart":
  addToCartByProduct(action.product_name, action.product_link).then(function (result) {
    console.log("Add to cart result:", result.message);
  });
```

New behavior:
```javascript
case "add_to_cart":
  showToast("Adding " + action.product_name + " to cart...", "info");
  addToCartByProduct(action.product_name, action.product_link).then(function (result) {
    if (result.success) {
      showToast(result.message, "success");
    } else {
      showToast(result.message, "error");
    }
  });
```

Same pattern for all action types -- show a toast before navigation actions.

**4. Remove the `if (!isShopifyPlatform) return` guard for feedback**

Currently, actions silently fail on non-Shopify. Instead, show a toast saying "This action works on the Shopify store" so the user at least gets feedback during testing.

**5. Update Shopify cart count after add-to-cart**

After a successful add-to-cart, dispatch `cart:refresh` event AND update `[data-cart-count]` elements (already partially implemented in `shopify.ts`, will be inlined into the widget since it's a standalone IIFE).

### No Backend Changes Needed

The AI chat function already has the correct action prompt format. The Shopify APIs (`/cart/add.js`, `/products/handle.js`) are native Shopify endpoints that work automatically when the widget runs on a Shopify store.

