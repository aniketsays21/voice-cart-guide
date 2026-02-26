

# Update Embed Widget Checkout + Auto-Checkout Listener

## What's Already Done
The `shopifyGoToCheckout()` function in `src/embed/shopify.ts` already uses the new browser-click flow (navigate to `/cart`, set `sessionStorage` flag). The `widget.ts` checkout handler at line 144-147 calls this function, so the action dispatch is correct.

## What's Missing
The `widget.ts` `createWidget()` function is missing the **auto-checkout page-load listener** — the code that detects the `bellaai_auto_checkout` sessionStorage flag when the widget loads on `/cart` and clicks the native checkout button. Without this, the flow breaks: the user lands on `/cart` but nothing clicks checkout.

## Changes

### File: `src/embed/widget.ts`

Add auto-checkout listener after line 96 (after `isShopifyPlatform` detection), matching what was added to `public/ai-chat-widget.js`:

```typescript
// Auto-checkout: if we navigated to /cart with the flag, click checkout button
if (isShopifyPlatform && typeof sessionStorage !== "undefined") {
  if (sessionStorage.getItem("bellaai_auto_checkout") === "1" && window.location.pathname === "/cart") {
    sessionStorage.removeItem("bellaai_auto_checkout");
    setTimeout(() => {
      // shopifyGoToCheckout will try clicking native button since we're on /cart
      shopifyGoToCheckout();
    }, 1500);
  }
}
```

This is a single small addition (~8 lines) to `src/embed/widget.ts`. No other files need changes.

