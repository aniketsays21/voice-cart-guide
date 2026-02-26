

# Two Changes: Smarter Checkout + Shorter Welcome Greeting

## Issue 1: Checkout Should Use Browser Click, Not Direct Navigation

Currently, when the user says "checkout karo", the bot navigates directly to `/checkout` via the Shopify AJAX approach. Instead, it should:

1. First navigate the user to `/cart` (if not already there)
2. Then find and click the native checkout button on the cart page (using existing `clickNativeCheckout()` function)

This mirrors how a real user would check out — go to cart, then click the checkout button.

### Changes in `public/ai-chat-widget.js`

- Modify the `navigate_to_checkout` action handler (around line 755-756) to:
  - If user is already on `/cart`, click the native checkout button directly
  - If user is NOT on `/cart`, navigate to `/cart` first, then after page load click the checkout button
- Add a small mechanism (e.g., URL parameter or sessionStorage flag) so that after navigating to `/cart`, the widget auto-clicks the checkout button once the page loads

---

## Issue 2: Welcome Greeting Should Be Short — Just Introduction

Currently, the welcome message sends a long query asking for bestselling products, which makes the bot respond with a product list immediately. Instead, Bella AI should just introduce itself and wait for the user to speak.

### Changes in `public/ai-chat-widget.js`

- Update the `triggerWelcome()` function (line 896) to send a simpler greeting:
  - New welcome query: `"Hi, introduce yourself briefly as Bella AI"`
- This will make the bot just say something like "Hi I am Bella AI, how can I help you?" and wait for user input

### Changes in `supabase/functions/chat/index.ts`

- Update the `WELCOME BEHAVIOR` section (lines 473-475) to instruct the bot:
  - On the first greeting, just introduce yourself briefly: "Hi, I am Bella AI! Aapki shopping assistant. Batao kya chahiye?"
  - Do NOT show products until the user asks
  - Keep it short since it will be spoken aloud

---

## Summary of File Changes

| File | What Changes |
|------|-------------|
| `public/ai-chat-widget.js` | Checkout flow: navigate to cart then click checkout button; Welcome: shorter intro query |
| `supabase/functions/chat/index.ts` | Welcome behavior prompt: introduce only, no products until asked |

After these changes, bump your Shopify script version (e.g., `?v=106`) and hard refresh.

