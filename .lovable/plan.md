

# Polish Bella Vita Voice Shopping Experience

## Current State (What's Already Working)

The core voice shopping flow is built and functional:
- Voice-first widget with avatar UI, mic, VAD, waveform
- Sarvam AI STT/TTS integration (Hindi/English)
- LLM-powered product recommendations from live Shopify catalog
- Multi-product grid display with live images, prices, discount badges
- Add to Cart from grid (both voice and tap)
- Persistent mic bar during product browsing
- Single product navigation to PDP
- Checkout/cart navigation via voice
- Auto-welcome on open with top-selling products

## Gaps to Fix for a Rock-Solid Bella Vita Experience

### 1. Welcome Message Reliability

**Problem**: The welcome trigger sends "Hi, show me top selling Bella Vita products" as a hidden user message, but no loading skeleton is shown -- the user sees a blank avatar area with a spinner status text.

**Fix** (`public/ai-chat-widget.js`):
- During `isWelcomeLoading`, show a subtle loading animation below the avatar (3 pulsing dots) instead of just status text
- Prevent the mic from being clickable during welcome load

### 2. Voice-to-Cart Feedback Loop

**Problem**: When the user says "add the first one to cart" via voice, the AI outputs an `add_to_cart` action and the cart API is called, but there's no audible confirmation -- TTS says the response, but the grid card update may not be visible if the user isn't looking.

**Fix** (`public/ai-chat-widget.js`):
- After a successful voice-triggered `add_to_cart`, show a larger, more prominent toast with a checkmark animation
- Briefly flash the card that was added (green border pulse for 1.5s)

### 3. Error Recovery

**Problem**: If STT, chat, or TTS fails, the widget shows error text but doesn't auto-recover gracefully. The mic might not restart.

**Fix** (`public/ai-chat-widget.js`):
- Add a retry mechanism: on STT failure, show "Didn't catch that. Tap mic to try again" and keep mic in idle state
- On chat error, show error message and auto-restart listening after 3 seconds
- On TTS error, still process actions (add to cart, navigate) even if speech fails

### 4. Product Grid Scroll and Empty State

**Problem**: If the catalog returns products without images, cards look broken. No empty state if the AI recommends products not in the catalog.

**Fix** (`public/ai-chat-widget.js`):
- Add a placeholder background/icon for cards without images
- If `enrichAction` returns no image and no price (product not found in catalog), show a "Product unavailable" state on the card instead of blank
- Ensure the grid scrolls properly with more than 6 cards

### 5. TTS Language Detection

**Problem**: TTS always uses `target_language_code: "hi-IN"` regardless of what language the user spoke or the AI responded in.

**Fix** (`public/ai-chat-widget.js`):
- Detect if the AI response is primarily English or Hindi using a simple heuristic (percentage of Devanagari characters)
- Pass `"en-IN"` for English responses and `"hi-IN"` for Hindi/Hinglish responses

### 6. Mic Auto-Listen After Cart Action

**Problem**: After adding to cart via voice (while grid is visible), the mic doesn't auto-restart. The user has to manually tap the mic again.

**Fix** (`public/ai-chat-widget.js`):
- After TTS finishes for a cart-action response, auto-start listening again (same as after product grid display)
- This already works for product grid responses but needs to be ensured for cart-action responses too

## Changes by File

### `public/ai-chat-widget.js`

1. **Welcome loading state**: Add pulsing dots animation below avatar during welcome load. Disable mic click during welcome.

2. **Cart feedback**: After successful `add_to_cart` in `onChatComplete`, add a CSS class `aicw-pcard-just-added` to the matching card that triggers a green border flash animation. Show a larger toast.

3. **Error recovery**: In `processAudio` catch handler and `sendToChat` catch handler, ensure `voiceState` resets to "idle" and offer a clear retry path. Add auto-retry after 3s for chat errors.

4. **Image placeholder**: In the product grid render, if `p.image` is empty, show a styled placeholder div with a shopping bag icon instead of a broken image.

5. **TTS language detection**: Before calling TTS, check response text for Hindi characters. Pass appropriate `target_language_code`.

6. **Auto-listen after cart**: In `onChatComplete`, after TTS ends for non-navigation, non-grid responses (like cart confirmations), auto-start listening.

### CSS additions in `getWidgetStyles`:

```text
.aicw-pcard-just-added  -- green border pulse animation (1.5s)
.aicw-pcard-placeholder -- grey background with centered bag icon for missing images
.aicw-loading-dots      -- 3 pulsing dots for welcome loading
```

### `supabase/functions/chat/index.ts`

No changes needed -- the system prompt and backend logic are already solid for Bella Vita.

## What the User Will Notice

- Widget opens with a smooth loading animation, then products appear
- Speaking "add the first one" shows a satisfying cart confirmation with card highlight
- If something goes wrong, the widget recovers gracefully and re-listens
- Products without images don't look broken
- TTS speaks in the correct language matching the conversation
- The mic is always ready -- the entire journey flows without manual taps

