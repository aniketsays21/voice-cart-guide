

## Voice-First AI Assistant with Product Results Page

### Overview
Completely redesign the `/chat` page from a traditional chatbot into a **voice-first AI assistant**. The page will be split: **90% product results area** (matching the homepage product grid style) and **10% voice/text input bar** at the bottom. The experience starts with a prominent "Tap to Speak" button, transitions through listening/processing states, and displays results as a product listing page.

---

### User Flow

```text
1. User taps "AI Assistant" in bottom nav
2. Sees a hero screen with a large pulsing mic button: "Tap to Speak"
3. Taps the mic --> UI transitions to "Listening..." with animated waveform
4. Stops speaking --> Shows transcribed text + "Finding products..." spinner
5. Results arrive --> Products fill the 90% area as a grid (same style as homepage)
6. Bottom 10% stays as a compact input bar (mic + text field) for follow-up queries
```

### Screen States

**State 1: Initial (no results yet)**
- Full-screen hero with heading: "Your AI Shopping Assistant"
- Subtext: "Tap to speak or type what you're looking for"
- Large centered mic button (pulsing ring animation)
- Quick suggestion chips below
- Small text input at very bottom as fallback

**State 2: Listening**
- Mic button turns red with pulsing animation
- Text: "Listening..." with animated sound wave bars
- Tap again to stop

**State 3: Processing**
- Shows the transcribed text in a subtle card
- "Finding the best products for you..." with spinner
- Animated dots or progress indicator

**State 4: Results**
- 90% of screen: Product grid (2-column, identical to homepage cards with image, price, rating, discount badge, "Add to Cart" button)
- A small header showing the query: "Results for: wireless earbuds under 2000"
- 10% bottom bar: Compact input with mic button + text field + send button for follow-ups
- Cart icon with badge in header

---

### Technical Details

**Files to create:**
- `src/components/assistant/VoiceButton.tsx` -- Large animated mic button with listening/idle states and sound wave animation
- `src/components/assistant/ProductResults.tsx` -- Product grid display component (reuses the same card style as Index.tsx)
- `src/components/assistant/AssistantInput.tsx` -- Compact bottom input bar (mic + text + send)

**Files to modify:**
- `src/pages/Chat.tsx` -- Complete redesign: state machine (idle -> listening -> processing -> results), split layout (90/10), remove old chat message list
- `supabase/functions/chat/index.ts` -- Update system prompt to return structured JSON product data alongside text, so we can parse products into the grid reliably

**Key implementation details:**

1. **State machine in Chat.tsx:**
   - `idle` -- show hero with mic button
   - `listening` -- recording in progress
   - `transcribing` -- STT in progress, show transcribed text
   - `searching` -- AI is responding, show loading state
   - `results` -- products displayed in grid, input bar at bottom

2. **Product parsing from AI response:**
   - Reuse the existing `:::product` format from the AI
   - Parse products from streamed response into structured data
   - Render them in a grid identical to the Index.tsx product cards (image, price, rating, discount, add to cart)
   - Any non-product text (AI commentary) shows as a small banner above the grid

3. **Voice button animation:**
   - Idle: Large circle with mic icon + subtle pulsing ring
   - Listening: Red background, animated sound wave bars (CSS keyframes), "Listening..." label
   - Uses existing Sarvam STT/TTS integration

4. **Bottom input bar (10% section):**
   - Fixed at bottom, above the nav bar
   - Compact row: text input + mic button + send button
   - Same voice recording logic as current implementation
   - When user sends another query, transitions back to "searching" state, then updates results

5. **Product grid (90% section):**
   - Scrollable area above the input bar
   - 2-column grid with same card design as homepage (image, category tag, name, rating, price with discount, "Add to Cart" button)
   - Cart drawer accessible from header cart icon

6. **No chat bubbles** -- AI text responses show as a brief contextual message above the product grid, not as chat messages

