

# Navigate to Shopify Native Pages Instead of Showing Cards

## What Changes

When the AI recommends products, the widget will close and redirect the user to Shopify's native search results or collection page -- showing products with your store's own theme, product cards, images, prices, and buttons.

## How It Works

```text
User speaks: "party perfume"
       |
       v
STT converts to text -> sent to backend
       |
       v
AI analyzes catalog, identifies matching products
       |
       v
AI responds with speech + a navigation action
       |
       v
Widget speaks the response, then redirects to:
/search?q=party+perfume&type=product
       |
       v
User sees native Shopify search results page
with your store's theme, product cards, filters, etc.
```

## Changes by File

### 1. Backend: `supabase/functions/chat/index.ts`

Update the native display system prompt so the AI outputs a new action type `navigate_to_search` with the search query, instead of individual `open_product` actions for each product:

```
:::action
type: navigate_to_search
search_query: party perfume
:::
```

The AI will still speak a conversational response ("Here are some great party perfumes for you"), and the widget will navigate after the speech finishes.

For single-product requests ("tell me about Dynamite perfume"), it will still use `open_product` to go directly to that product page.

### 2. Widget: `public/ai-chat-widget.js`

- Add a `navigate_to_search` action handler that redirects to `/search?q={query}&type=product`
- Remove the product card grid rendering (the `.aicw-product-grid` section) since products will be shown on Shopify's native pages
- After TTS finishes speaking, auto-navigate to the search/collection page
- Keep the `open_product` action for single product navigation (already works)
- Keep `add_to_cart` action for direct cart additions via voice

### 3. Flow Change

| Scenario | Current Behavior | New Behavior |
|----------|-----------------|-------------|
| "Show me party perfumes" | Cards in widget | AI speaks, then redirects to `/search?q=party+perfume&type=product` |
| "Show me gift sets under 1000" | Cards in widget | AI speaks, then redirects to `/search?q=gift+sets&type=product` |
| "Tell me about Dynamite perfume" | Card in widget | AI speaks, then redirects to `/products/dynamite-perfume` |
| "Add this to cart" | Shopify cart API | Same (no change) |

## What the User Sees

1. Opens widget, speaks "party perfume"
2. AI responds via voice: "Here are some great party perfumes from Bella Vita"
3. After speech ends, the page navigates to the store's search results
4. User sees their Shopify store's native collection/search page with full product cards, filters, sorting -- everything from the theme

## Technical Details

- Search URL format: `/search?q={query}&type=product` (works on all Shopify stores)
- Navigation happens after TTS completes so the user hears the response first
- Product card CSS and rendering code will be removed from the widget since it's no longer needed
- The `productCards` array and `enrichAction` function will be simplified to only handle delayed navigation
