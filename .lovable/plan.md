

# Convert Voice Bot to Floating Overlay on Shopify Pages

## Summary

Transform the voice bot from a full-screen overlay (that renders its own product grid and avatar UI) into a **compact floating mic bar** that sits at the bottom of the real Shopify website. The bot will control actual Shopify pages -- navigating to real product pages, adding to cart via Shopify's API, and triggering checkout -- while staying visible and active throughout the entire journey.

## Current Problem

The widget currently takes over the entire screen (`position: fixed; inset: 0`), rendering its own avatar, product grids, and UI. This means:
- Users can't see the actual Shopify store while using the bot
- Product cards are rendered inside the widget instead of showing real Shopify pages
- The bot feels separate from the store experience

## What Changes

### 1. Widget Layout: Full-Screen to Floating Bar (`public/ai-chat-widget.js`)

**Remove:**
- Full-screen overlay (`host.style.inset = "0"`)
- Avatar circle and avatar area
- In-widget product card grid
- Header bar that takes full width

**Replace with:**
- A compact floating pill bar fixed at the bottom center (~56px tall, max-width 380px)
- Contains: mic button + status text (Listening/Speaking/Tap to speak)
- A small transcript bubble appears above the bar temporarily when the user speaks or the bot responds
- The bar is always visible and doesn't block Shopify content

```text
+------------------------------------------+
|                                          |
|        Actual Shopify Page               |
|        (PDP, Cart, Collections)          |
|                                          |
+------------------------------------------+
|   ["User said: show me perfumes"]        |  <-- transcript bubble (fades)
|   [mic] Listening...          [x close]  |  <-- floating bar
+------------------------------------------+
```

### 2. Navigation: Real Shopify Pages Instead of Widget Grid

**Single product recommendation:**
- Navigate to `/products/{handle}` (already works, keep as-is)

**Multiple product recommendations:**
- Instead of rendering a product grid inside the widget, navigate to Shopify search: `/search?q={query}` or a collection page
- The bot speaks about the products conversationally and lets the user browse the real store

**Add to Cart:**
- Call `/cart/add.js` (already works), show a toast on the real page, stay on current page

**Checkout:**
- Click the native checkout button on the cart page, or navigate to `/checkout`
- Since another tool handles checkout, the bot's job ends here

### 3. System Prompt Update (`supabase/functions/chat/index.ts`)

Update the prompt to reflect overlay mode:
- When recommending multiple products, describe them conversationally (name, price, key feature) and ask which one the user wants to see, rather than outputting multiple `open_product` action blocks
- For browsing categories, use a single `open_product` action that navigates to the collection or search page
- Remove instructions about rendering product grids

### 4. CSS Overhaul (within `public/ai-chat-widget.js`)

Replace all the avatar, panel, product-grid, and full-screen styles with:
- Floating bar styles: `position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%)`
- Transcript bubble: appears above the bar, auto-fades after 4 seconds
- Minimal footprint so it doesn't interfere with Shopify's native UI
- Subtle backdrop/shadow so it's visible on any page background

### 5. Session Persistence (Already Works)

The `sessionStorage`-based persistence already handles page navigations. No changes needed here -- the bot will restore conversation history and resume listening on each new Shopify page.

## Technical Details

### Floating Bar HTML Structure
```text
<div class="aicw-floating-bar">
  <button class="aicw-mic-btn {state}">mic icon</button>
  <span class="aicw-status">Listening...</span>
  <button class="aicw-close-btn">x</button>
</div>
<div class="aicw-transcript-bubble">transcript text</div>  <!-- temporary -->
```

### Multi-Product Flow Change
Currently: AI returns multiple `open_product` actions, widget renders grid
New: AI describes products in speech, uses a single action to navigate to search/collection. For example:
- User: "Show me perfumes for men"
- Bot speaks: "Yahan kuch best perfumes hain -- CEO Man, Fresh Guy, aur Royal Oud. Kaunsa dekhna hai?"
- If user says "CEO Man dikhao" -> navigate to `/products/ceo-man`
- If user says "sab dikhao" -> navigate to `/search?q=perfume+for+men` or `/collections/men`

### Checkout Trigger
On the cart page, when user says "checkout karo":
- Bot clicks the native checkout button: `document.querySelector('[name="checkout"], .cart__checkout-button, [type="submit"]').click()`
- Or falls back to `window.location.href = "/checkout"`

## Files to Modify

| File | Change |
|------|--------|
| `public/ai-chat-widget.js` | Replace full-screen overlay + avatar + product grid with compact floating mic bar; remove product grid rendering; use Shopify search/collection navigation for multi-product; add transcript bubble; add native checkout button click |
| `supabase/functions/chat/index.ts` | Update system prompt: describe products conversationally instead of grid format; prefer single navigation actions; add instruction for search/collection navigation |

## What Stays the Same
- STT pipeline (ElevenLabs Scribe v2) -- unchanged
- TTS pipeline (ElevenLabs Multilingual v2, Lily voice) -- unchanged
- Chat edge function streaming -- unchanged
- Cart add/navigate actions -- unchanged
- Session persistence via sessionStorage -- unchanged
- Page context detection -- unchanged

