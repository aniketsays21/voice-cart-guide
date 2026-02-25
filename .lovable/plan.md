

# Voice Bot UX Overhaul: Start Call / End Call Flow

## What Changes

The current flow auto-triggers the welcome immediately when the widget opens. The new flow adds a clear "Start" and "End Call" pattern, continuous listening, and an updated welcome message.

## New User Journey

```text
1. User clicks "Bella Vita AI" button on Shopify
2. Widget opens full-screen with avatar + "Start" button
3. User taps "Start" → bot activates, speaks welcome, shows products
4. A red "End Call" button stays visible at all times
5. Bot continuously listens (no need to tap mic repeatedly)
6. User speaks → AI responds → products display → add to cart works
7. User taps "End Call" → bot stops, widget closes
```

## Changes Required

### File: `public/ai-chat-widget.js`

**1. New "pre-call" state**
- Add a `callActive` flag (starts `false`)
- When widget opens, show the avatar with a green "Start" button instead of auto-triggering welcome
- Tapping "Start" sets `callActive = true`, then triggers `triggerWelcome()`

**2. Persistent "End Call" button**
- Once `callActive` is true, render a red "End Call" button that is always visible on screen (both avatar view and product grid view)
- Tapping "End Call" cancels voice, resets state, and closes the widget

**3. Update welcome message**
- Change the hidden welcome query from the current text to something that prompts the AI to say: "Welcome, I am your AI assistant. Bella Vita store par aapka swagat hai, ye rahe kuch best selling products aapke liye"

**4. Continuous listening**
- The auto-listen-after-TTS already exists. Ensure the mic restarts after every response without user intervention (this is mostly working, just verify no gaps)

**5. CSS additions**
- `.aicw-start-btn`: Large green "Start" button style
- `.aicw-end-call-btn`: Red "End Call" button, always visible during active call

### File: `supabase/functions/chat/index.ts`

**6. Update welcome prompt in system prompt**
- Adjust the `WELCOME BEHAVIOR` section to instruct the AI to say: "Welcome, I am your AI assistant. Bella Vita store par aapka swagat hai, ye rahe kuch best selling products aapke liye" and then show top selling products

## Shopify Catalog Question

You asked: "Do we need an API for searching the Shopify catalog?"

No extra API key is needed. The widget already fetches your full live Shopify catalog using the public `/products.json` endpoint, and the backend also fetches it server-side. This works as long as the store is not password-protected (yours is live, so it works).

## Deployment

After these changes, you click **Publish > Update** in Lovable. No Shopify theme file edits needed -- the script auto-updates on page refresh.

