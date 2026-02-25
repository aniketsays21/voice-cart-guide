

# Click Native Shopify Buttons Instead of API Calls

## Summary

When the user is on a Product Detail Page (PDP) and says "add to cart", the bot will **find and click the native Add to Cart button** on the Shopify theme instead of calling `/cart/add.js` via API. Similarly for checkout, the existing native button click approach will be kept and improved. This makes the interaction feel like a real person is controlling the browser.

## What Changes

### 1. Native "Add to Cart" Click (`public/ai-chat-widget.js`)

Currently, `add_to_cart` action calls `addToCartByProduct()` which uses the `/cart/add.js` API. This works but doesn't interact with the actual page UI.

**New approach:**
- When on a PDP (`/products/*`), first try to click the native "Add to Cart" button using common Shopify theme selectors:
  - `[type="submit"][name="add"]` (Dawn theme default)
  - `button.product-form__submit`
  - `.btn-addtocart`
  - `form[action="/cart/add"] button[type="submit"]`
  - `#AddToCart`
- If the native button is found and clicked, show a success toast
- If no native button is found (e.g., user is not on the PDP), fall back to the existing API approach (`/cart/add.js`)

### 2. Improved Checkout Click (already partially done)

The existing `shopifyGoToCheckout()` already tries to click native checkout buttons. We'll expand the selector list to cover more Shopify themes:
- `[name="checkout"]`
- `.cart__checkout-button`
- `button[type="submit"][value*="Check"]`
- `a[href="/checkout"]`
- `.cart__checkout`
- `#checkout`

### 3. Context-Aware Add to Cart

When the user is on a PDP and says "add this to cart" (without specifying a product name), the bot should:
- Detect we're on `/products/*`
- Click the native Add to Cart button directly (no need to search for the product -- it's already on screen)
- This is the most natural flow: user browses to a product page, bot clicks the button

When the user is NOT on a PDP but names a specific product, fall back to the API approach.

### 4. System Prompt Update (`supabase/functions/chat/index.ts`)

Add instructions telling the LLM:
- When the user is on a product page and says "add to cart" or "isko cart mein daalo", output an `add_to_cart` action. The widget will click the native button.
- When the user says "checkout karo" or "buy now", output `navigate_to_cart` first (if not already on cart), then `navigate_to_checkout` to click the checkout button.

## Technical Details

### New helper function: `clickNativeAddToCart()`

```text
function clickNativeAddToCart():
  selectors = [
    '[type="submit"][name="add"]',
    'button.product-form__submit',
    'form[action="/cart/add"] button[type="submit"]',
    '#AddToCart', '.btn-addtocart',
    'button[data-action="add-to-cart"]'
  ]
  for each selector:
    btn = document.querySelector(selector)
    if btn and btn is visible:
      btn.click()
      return true
  return false
```

### Updated `add_to_cart` handler logic

```text
if action.type == "add_to_cart":
  if on /products/* page:
    clicked = clickNativeAddToCart()
    if clicked:
      showToast("Added to cart!")
      dispatch cart:refresh event
    else:
      fall back to API (addToCartByProduct)
  else:
    use API (addToCartByProduct) as before
```

## Files to Modify

| File | Change |
|------|--------|
| `public/ai-chat-widget.js` | Add `clickNativeAddToCart()` helper; update `add_to_cart` handler to try native click first on PDP; expand checkout button selectors |
| `supabase/functions/chat/index.ts` | Update prompt to instruct LLM about context-aware add-to-cart and checkout flows |

## What Stays the Same
- Search/collection navigation -- unchanged
- Single product navigation (open_product) -- unchanged
- Voice pipeline (STT/TTS) -- unchanged
- Session persistence -- unchanged
- Floating bar UI -- unchanged
- API fallback for add-to-cart when not on PDP -- unchanged

