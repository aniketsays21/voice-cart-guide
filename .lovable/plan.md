

# Bella Vita AI - Avatar Experience + Shopify Product Cards

## Overview

Redesign the `/chat` page into an immersive AI assistant experience. When the user taps "Bella Vita AI" in the bottom nav, they land on a page with a talking avatar that greets them. Products only appear after the AI mentions them -- until then, the avatar is front and center.

## Key Changes

### 1. Talking Avatar Component (`src/components/assistant/TalkingAvatar.tsx`)

A new animated avatar that serves as the visual presence of the AI:

- Circular avatar with a pulsing glow effect when the AI is "speaking"
- Animated mouth/wave visualization synced to TTS audio playback
- Three states: **idle** (subtle breathing animation), **speaking** (active lip-sync pulse + glow), **listening** (shows the user's audio waveform instead)
- Uses a placeholder avatar image (a stylized AI assistant icon) -- can be replaced with a real 3D model later
- Greeting text displayed below: "Hi! I'm your Bella Vita assistant"

### 2. Redesigned Chat Page (`src/pages/Chat.tsx`)

Split into two visual phases:

**Phase 1 - Avatar Mode (initial)**
- Full-screen avatar centered on the page
- AI auto-greets with TTS: "Hello! Welcome to Bella Vita. Let me show you our best selling products"
- While greeting plays, avatar shows speaking animation
- Voice button at the bottom for the user to respond
- No products visible yet

**Phase 2 - Products Mode (after AI responds with products)**
- Avatar shrinks to a small floating circle at the top
- Product grid appears below (Shopify-style cards)
- Avatar still animates when AI speaks
- Voice bar at the bottom for continued conversation

The transition happens when the AI response contains `:::product` blocks.

### 3. Shopify-Style Product Cards (`src/components/assistant/ShopifyProductCard.tsx`)

A new product card component that exactly matches the Shopify collection page style used on the Index page:

- Product image with aspect-square ratio
- "Bestseller" badge (top-left, gold) for high-rated products
- Discount percentage badge (bottom-left, green)
- Category label (small uppercase text)
- Product name (truncated)
- Star rating with "Verified" badge
- Price with strikethrough for discounted items
- "Add to Cart" button (full-width, dark background, uppercase)
- "In Cart" state with checkmark

This matches the exact card layout already used in `Index.tsx` (lines 130-214), ensuring visual consistency.

### 4. Updated ProductResults (`src/components/assistant/ProductResults.tsx`)

- Replace the current product card rendering with the new `ShopifyProductCard` component
- Keep the 2-column grid layout
- Products fetched from Shopify will display with live prices and images

### 5. Auto-Greeting Flow

Current behavior: sends "Hi, show me top selling Bella Vita products" silently on mount.

New behavior:
1. Page opens -- avatar appears with idle animation
2. After 500ms, AI greeting TTS plays: "Hello! Welcome to Bella Vita"
3. Avatar shows speaking animation during TTS
4. Simultaneously, the welcome API call fires to fetch products
5. When products arrive AND TTS finishes, avatar shrinks up and products slide in from below
6. Voice button activates for user interaction

## Visual Layout

```text
Phase 1 (Greeting):                Phase 2 (Products):
+------------------+               +------------------+
|                  |               | [small avatar]   |
|                  |               | "Results for..." |
|    [AVATAR]      |               +------------------+
|   (speaking)     |               | [card] | [card]  |
|                  |               | [card] | [card]  |
|  "Hello! I'm    |               | [card] | [card]  |
|   your Bella     |               |                  |
|   Vita asst."    |               +------------------+
|                  |               | [mic] [waveform] |
|    [MIC BTN]     |               +------------------+
+------------------+
```

## Files

| File | Change |
|------|--------|
| `src/components/assistant/TalkingAvatar.tsx` | **New** - Animated avatar component with idle/speaking/listening states |
| `src/components/assistant/ShopifyProductCard.tsx` | **New** - Shopify-style product card matching Index.tsx design |
| `src/pages/Chat.tsx` | **Modified** - Two-phase layout (avatar first, then products), auto-greeting with TTS |
| `src/components/assistant/ProductResults.tsx` | **Modified** - Use ShopifyProductCard instead of inline card markup |

## Technical Notes

- The avatar is CSS-animated (no heavy 3D library needed). It uses radial gradients, scale transforms, and opacity transitions to simulate a speaking effect
- TTS audio playback is detected via the `HTMLAudioElement.onplay` and `onended` events to toggle the avatar's speaking state
- The phase transition (avatar to products) uses a CSS transition with `transform` and `opacity` for a smooth slide-up effect
- Product data comes from Shopify via the existing chat edge function integration (already implemented)
