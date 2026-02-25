# Replicate In-App Assistant Flow to Shopify Widget

## What Changes

When a user clicks the purple mic button on Shopify, the widget will behave exactly like the in-app AI Assistant page — auto-loading top products on open, showing a rich scrollable product grid, and placing the mic in a compact bottom bar once results appear.

## Current vs. New Flow

```text
CURRENT SHOPIFY WIDGET:
+---------------------------+
| Header                    |
| Welcome text              |
| Products (basic cards)    |
| Transcript                |
| Status                    |
| Waveform                  |
| [BIG MIC BUTTON]          |
| Powered by AI             |
+---------------------------+

NEW FLOW (matches in-app):
+---------------------------+
| Header                [X] |
|                           |
| "Welcome to Bella Vita"   |  <-- loading state on open
| Connecting to assistant...|
|       [spinner]           |
|                           |
+---------------------------+
         |
         v  (auto-fetches products)
+---------------------------+
| Header                [X] |
| Results for: Welcome      |
| [Product] [Product]       |  <-- rich cards with badges,
| [Product] [Product]       |      ratings, discount %,
| [Product] [Product]       |      "View Details" links
|  (scrollable)             |
|---------------------------|
| [mic] ~~~waveform~~~      |  <-- compact bottom bar
|        "Tap mic..."       |
+---------------------------+
```

## Key Features to Replicate

### 1. Auto-Welcome on Open

When the widget opens, it immediately sends "Hi, show me top selling Bella Vita products" to the chat API and shows a loading spinner with "Welcome to Bella Vita / Connecting to your shopping assistant..." text.

### 2. Rich Product Cards

Product cards in the widget will match the in-app design:

- Product image with aspect-ratio square
- "Bestseller" badge (gold) for ratings >= 4.2
- Discount percentage badge (green) calculated from price vs discount_price
- Star rating with "Verified" text
- Price with strikethrough original price when discounted
- Discount coupon code display
- "View Details" link opens product in new tab

### 3. Two-Layout Mode

- **No results yet**: Full-screen centered layout with loading spinner or welcome mic button
- **Has results**: Scrollable product grid taking most of the space, with a compact bottom bar containing a small mic button, waveform visualization, and status text

### 4. Result Groups

Results are organized by query (e.g., "Welcome", then "perfumes under 500") with headers showing "Results for: [query]". New results appear at the top, previous results scroll below.

### 5. Continuous Listening

After voice response plays, the mic auto-restarts for follow-up questions (already partially implemented, will be refined).

## Technical Details

### File: `public/ai-chat-widget.js`

**New state variables:**

- `resultGroups` (array of `{query, products}`) -- tracks multiple query results
- `isWelcomeLoading` (boolean) -- shows loading spinner on first open
- `hasResults` (boolean) -- determines layout mode

**New/Modified functions:**

- `triggerWelcome()` -- auto-sends welcome query on open, parses response into result groups
- `renderProductCardRich(p)` -- enhanced product card with badges, ratings, discount calculation
- `renderVoiceMode()` -- completely rewritten to support two layouts:
  - Loading state (spinner + welcome text)
  - Results layout (scrollable grid + compact bottom bar)
  - Idle/no-results (centered mic button)
- `onChatComplete()` -- modified to append new result groups instead of replacing `voiceProducts`

**New CSS classes:**

- `.aicw-results-area` -- scrollable container for product grid
- `.aicw-result-group` -- wrapper per query result
- `.aicw-result-header` -- "Results for: [query]" label
- `.aicw-bottom-bar` -- compact mic + waveform bar
- `.aicw-product-badge` -- bestseller/discount badge overlay
- `.aicw-product-rating` -- star rating row
- `.aicw-loading-welcome` -- centered loading spinner state
- `.aicw-mic-btn.small` -- smaller mic button for bottom bar

**Removed:**

- `voiceProducts` flat array (replaced by `resultGroups`)
- Old single-layout voice area rendering

### Flow on open:

1. User clicks purple mic FAB
2. Widget opens showing "Welcome to Bella Vita" + spinner
3. Auto-sends welcome message to chat API (streaming, collected)
4. Products parsed from response, stored as first result group
5. Layout switches to results view with product grid
6. TTS plays the commentary
7. Mic auto-starts for follow-up questions

&nbsp;

everything is voice based, nothing is text based, it will take response in voice and respond back in voice. 