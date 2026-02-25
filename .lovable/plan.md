

# Fix: Make AI Search Live Shopify Catalog and Display Rich Product Cards

## What You Want
User says "give me party perfume" -> AI searches the live Shopify store catalog -> displays rich product cards with images, prices, tags, and Add to Cart buttons. No new UI to build — the product card grid already exists in the widget code.

## Why It's Not Working Right Now

Three bugs are preventing it from working:

1. **`productLinks` is undefined** — In the widget code, there's a reference to `productLinks.push(...)` on line 374, but `productLinks` was never declared. This causes a JavaScript runtime error, so product actions silently fail and no cards appear.

2. **Price divided by 100 incorrectly** — The `enrichAction` function divides Shopify prices by 100 (lines 642-643), but Shopify's `/products.json` returns prices as strings like `"599.00"` (already in rupees, not paise). So a Rs 599 product shows as Rs 5.99.

3. **Welcome message sends wrong text** — `triggerWelcome()` pushes "Hi, show me top selling Bella Vita products" to `voiceMessages` but sends `"Welcome"` as the query to the chat function. This mismatch may confuse the AI.

## Fixes (3 files)

### File 1: `public/ai-chat-widget.js`

| Fix | What changes |
|-----|-------------|
| Remove `productLinks` reference | Delete the dead code in `executePendingActions` that tries to push to undefined `productLinks`. The `open_product` actions are already handled correctly in `onChatComplete` (line 663) where they get enriched and added to `productCards`. |
| Fix price calculation | Remove the `/ 100` division in `enrichAction`. Use the raw price string from Shopify as-is (already in rupees). |
| Fix welcome message | Make `sendToChat` use the same text as what's pushed to `voiceMessages`. |

### File 2: `supabase/functions/chat/index.ts`

| Fix | What changes |
|-----|-------------|
| Client product price mapping | In `mapClientProducts`, the price is also divided by 100 — fix this to use the raw value since Shopify Indian stores use rupees not paise. |

### File 3: No new files needed

The product card grid CSS and rendering logic already exist and work correctly. Once the three bugs above are fixed:

1. Widget opens, fetches `/products.json` from Shopify (already working)
2. User speaks "party perfume", STT converts to text
3. Text + full catalog sent to backend
4. Backend filters catalog by intent (category: Perfume, occasion: party)
5. AI picks the best matches and outputs `:::action` blocks with handles
6. Widget's `onChatComplete` extracts actions, calls `enrichAction` to match against local catalog
7. `productCards` array is populated with images, correct prices, variant IDs
8. Render function displays the 2-column product grid with images, prices, discount badges, and Add to Cart buttons

## End-to-End Flow After Fix

```text
User speaks: "party perfume"
       |
       v
STT (Sarvam AI) -> "party perfume"
       |
       v
Backend receives text + 250 Shopify products
       |
       v
Intent extraction: category=Perfume, occasion=party
       |
       v
Filtered catalog sent to LLM (Gemini) as context
       |
       v
LLM responds with product recommendations + :::action blocks
       |
       v
Widget extracts actions, matches handles to local catalog
       |
       v
Rich product cards rendered: images, prices (Rs 599), discount badges, Add to Cart
```

No new product card widget needed — the existing one just needs these 3 bug fixes to start working.
