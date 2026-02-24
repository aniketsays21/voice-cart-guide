

## Persistent Results + Product Detail Page (PDP) via Voice

### Overview
Two enhancements: (1) keep previous product results visible when asking follow-up questions, appending/updating rather than replacing, and (2) allow users to tap a product card to open a detailed Product Detail Page (PDP) where they can ask voice questions about that specific product and add it to cart.

---

### Change 1: Preserve Previous Results on Follow-up

**File: `src/pages/Chat.tsx`**

Currently, `send()` replaces `products` and `aiCommentary` entirely on each query. Instead:
- Maintain a **results history** array: `Array<{ query: string; commentary: string; products: AssistantProduct[] }>`
- Each new AI response appends a new entry to the array
- `ProductResults` renders all entries in order (newest at top or bottom), so previous results stay visible while scrolling
- When the AI responds with no products (e.g. a conversational follow-up), show just the commentary without clearing previous products

**File: `src/components/assistant/ProductResults.tsx`**
- Update props to accept an array of result groups instead of a single flat list
- Each group renders with its own query header and commentary, followed by its product grid

---

### Change 2: Product Detail Page (PDP) Overlay

**New file: `src/components/assistant/ProductDetailSheet.tsx`**

A bottom sheet / full-screen overlay that opens when user taps a product card:
- Large product image at top
- Product name, price, discount badge, rating, description
- "Add to Cart" button (same logic as grid cards)
- A small voice/text input bar at the bottom to ask questions about THIS product (e.g. "Is this waterproof?", "What colors does it come in?")
- AI responses about the product appear as brief text cards within the sheet
- Close button to return to results grid

**File: `src/components/assistant/ProductResults.tsx`**
- Make each product card tappable (onClick opens the PDP sheet)
- Pass selected product to the sheet

**File: `src/pages/Chat.tsx`**
- Add state for selected product (`selectedProduct: AssistantProduct | null`)
- When PDP is open and user asks a question, prepend context to the AI message: "The user is viewing [product name]. They ask: [question]"
- AI response shows inside the PDP sheet, not the main results area
- "Add to Cart" in PDP adds the product and shows confirmation

**File: `supabase/functions/chat/index.ts`**
- Update system prompt to handle product-specific questions:
  - "When a user asks about a specific product they are viewing, provide detailed information about that product only"
  - "If user says 'add this to cart' or 'buy this', confirm the item and encourage them to tap the Add to Cart button"
  - Keep existing instructions intact

---

### Technical Details

**State changes in Chat.tsx:**

```text
Current:  products: AssistantProduct[]
New:      resultGroups: Array<{ query: string; commentary: string; products: AssistantProduct[] }>
          selectedProduct: AssistantProduct | null
          pdpMessages: Array<{ role: string; content: string }>
```

**ProductDetailSheet component structure:**
- Uses the existing Vaul Drawer component for smooth bottom-sheet UX
- Contains: image, details section, AI Q&A area, input bar
- Sends questions through the same `chat` edge function but with product context prepended
- Supports both voice (mic button) and text input

**Product card interaction:**
- Short tap: opens PDP sheet
- "Add to Cart" button: adds to cart (stops event propagation so it doesn't open PDP)

**Follow-up behavior:**
- Results accumulate in the scrollable area
- Each result group has a divider with the query text
- New results appear at the top for easy visibility
- A "Clear results" button optionally resets to idle state

