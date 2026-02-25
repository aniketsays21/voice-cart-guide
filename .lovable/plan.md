

# End-to-End Voice Shopping Journey: Discovery to Checkout

## Problem

Currently, when the widget displays the product grid, the microphone button disappears. The user loses the ability to speak and must click "Back" to return to the avatar view before they can talk again. This breaks the conversational shopping flow.

## Solution

Keep the mic button visible at all times -- even when the product grid is showing. The user can browse products visually AND continue speaking voice commands simultaneously, creating a seamless journey from discovery to checkout.

```text
User opens widget
       |
       v
"Show me party perfumes"  -->  AI speaks + shows product grid
       |                            (mic stays visible at bottom)
       v
"Add the first one to cart"  -->  AI identifies product, adds to cart
       |                            (grid stays, card updates to "In Cart")
       v
"Show me something cheaper"  -->  AI picks new products, grid refreshes
       |
       v
"Add CEO Man to cart"  -->  Adds specific product by name
       |
       v
"Go to checkout"  -->  Navigates to /checkout
```

## Changes by File

### 1. Widget: `public/ai-chat-widget.js`

**Layout Change -- Add mic to product grid view:**
- When `showProductGrid` is true, render the product grid BUT also show a compact mic button bar at the bottom (below the grid)
- The mic button will be smaller (40px) and positioned in a bottom bar alongside a status text
- This allows the user to tap mic and speak while viewing products

**Voice command handling in product grid context:**
- When the user speaks while the product grid is visible, the grid stays visible during processing/speaking
- After the AI responds, update the grid if new products are recommended, or keep the same grid if the action was "add to cart"
- Only hide the grid if the AI response has zero `open_product` actions (meaning the conversation moved away from product browsing)

**Contextual voice commands the AI already supports (via system prompt):**
- "Add [product name] to cart" -- triggers `add_to_cart` action, grid stays, card updates
- "Show me more" or "something cheaper" -- triggers new `open_product` actions, grid refreshes
- "Go to checkout" / "Open cart" -- navigates away
- "Tell me about [product]" -- single product, navigates to PDP

**Specific code changes:**

1. **Render function**: When `showProductGrid` is true, add a bottom bar with a compact mic button below the product grid, similar to the avatar view's mic but smaller
2. **onChatComplete**: When a new response comes in while the grid is showing:
   - If new `open_product` actions exist, refresh `productCards` and keep grid visible
   - If only `add_to_cart` actions, keep current grid, update the relevant card to "In Cart"
   - If no product actions (pure conversation), hide grid and return to avatar view
3. **Bind mic events** on the compact mic button in the product grid view
4. **Add bottom bar CSS** for the compact mic in grid view (`.aicw-grid-bar`)

### 2. Backend: `supabase/functions/chat/index.ts`

**Update system prompt** to add awareness of the conversational shopping journey:

- Add instructions for handling follow-up commands like "add the first one", "add CEO Man", "show me cheaper options"
- When the user says "add [product name] to cart", the AI should output an `add_to_cart` action block with the product name and handle
- When the user asks for more/different products, output new `open_product` action blocks
- When the user says "checkout" or "go to cart", output the appropriate navigation action

### 3. Visual Flow

| State | What User Sees | Mic Available? |
|-------|---------------|----------------|
| Initial | Avatar + large mic | Yes |
| Listening | Avatar pulsing + waveform | Yes (active) |
| Processing | Avatar + spinner | No (processing) |
| Speaking | Avatar pulsing | No (speaking) |
| Product Grid | 2-column cards + small mic at bottom | Yes |
| Grid + Listening | Cards + mic active (red) + waveform | Yes (active) |
| Grid + Processing | Cards + spinner in mic area | No (processing) |
| Grid + Speaking | Cards + speaking indicator | No (speaking) |

### 4. New CSS Additions

```text
.aicw-grid-bar
  - Fixed at bottom of panel, above "Powered by AI"
  - Contains: status text + compact mic button (40px)
  - Background: white with top border
  - Compact waveform canvas when listening
```

### 5. What Changes for the User

Before: Speak -> See products -> Click "Back" -> Speak again -> Repeat
After: Speak -> See products -> Speak again (mic is right there) -> Products update -> Speak "add to cart" -> Done -> "Checkout" -> Navigated

The entire journey from discovery to checkout happens through continuous voice conversation without ever needing to leave the product view.
