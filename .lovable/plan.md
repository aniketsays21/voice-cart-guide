

# Full-Page Voice Agent via "Bella Vita AI" Menu Button

## What Changes

Replace the small floating widget panel with a **full-page overlay** that opens when the user clicks a "Bella Vita AI" button in the Shopify navigation. The experience will match the in-app AI Assistant exactly — full-screen product grid, voice-only interaction, compact mic bar at the bottom.

## Current vs. New

```text
CURRENT:
  [Purple mic FAB in corner]
     --> Opens small 400x600 panel

NEW:
  [Bella Vita AI] button in Shopify menu
     --> Opens full-screen overlay covering the entire page
     --> Auto-loads products, voice interaction, rich product grid
     --> Close button returns to the store
```

## Visual Layout

```text
+--------------------------------------------------+
| [X Close]                        Bella Vita AI    |
|--------------------------------------------------|
|                                                   |
|  Results for: Welcome                             |
|  [Product] [Product] [Product] [Product]          |
|  [Product] [Product] [Product] [Product]          |
|                                                   |
|  Results for: "perfumes under 500"                |
|  [Product] [Product] [Product] [Product]          |
|                                                   |
|--------------------------------------------------|
|  [mic]  ~~~~waveform~~~~   "Tap mic to ask..."    |
+--------------------------------------------------+
```

## Changes to `public/ai-chat-widget.js`

### 1. Remove the Floating Action Button (FAB)
- No more fixed-position purple circle button in the corner
- The widget no longer renders anything until `window.AIChatWidget.open()` is called

### 2. Full-Page Overlay Instead of Small Panel
- Replace the 400x600px `.aicw-panel` with a **full-screen overlay** (`position: fixed; inset: 0`)
- White background, covers the entire viewport
- Close button (X) in the top-right returns to the store page

### 3. Responsive Product Grid
- With full-screen space, expand the grid from 2 columns to **3-4 columns** on desktop, 2 on mobile
- Product cards get slightly more room for details

### 4. Update CSS
- `.aicw-panel` becomes `width: 100%; height: 100vh; border-radius: 0; max-width: none; max-height: none;`
- `.aicw-results-grid` uses `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))` for responsive columns
- Remove `.aicw-fab` styles (no longer needed)
- Add a header bar with "Bella Vita AI" title and close button

### 5. Host Element Changes
- Instead of a fixed-position corner element, the host element becomes a full-screen container with `position: fixed; inset: 0; z-index: 99999`
- Hidden by default, shown when `.open()` is called

### 6. Auto-Init Without FAB
- On load, the widget only sets up `window.AIChatWidget` API — no visible UI
- When `.open()` is called (from any Shopify button), it shows the full-page overlay and triggers the welcome flow

### Shopify Integration
Add a menu item or button anywhere in the Shopify theme:

```html
<button onclick="window.AIChatWidget.open()">Bella Vita AI</button>
```

Or add it to the Shopify navigation menu as a link with:
```html
<a href="#" onclick="event.preventDefault(); window.AIChatWidget.open();">Bella Vita AI</a>
```

## What Stays the Same
- All voice logic (recording, VAD, STT, TTS, auto-restart)
- Product card rendering (rich cards with badges, ratings, discounts)
- Result groups organized by query
- Auto-welcome on open
- Shopify actions (add to cart, navigate)
- `window.AIChatWidget` API (`.open()`, `.close()`, `.destroy()`)

