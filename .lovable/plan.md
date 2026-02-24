

## In-Chat Shopping Cart with Auto-Applied Discounts

### Overview
Transform the chat experience into a complete shopping journey. Instead of redirecting users to external links, products recommended by the AI will have an "Add to Cart" button right inside the chat. A cart drawer will let users review items, and discounts will be auto-applied based on available coupon codes.

---

### Step 1: Create a Cart Context (Global State)

**New file:** `src/contexts/CartContext.tsx`

- Create a React Context to manage cart state across the app
- Cart items include: product ID, name, price, image, quantity, discount info
- Functions: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `getTotal`
- Auto-apply discounts: when an item is added, check the `discounts` table for matching product or category discounts and attach the best one automatically
- Persist cart to `localStorage` so it survives page refreshes

### Step 2: Create a Cart Drawer Component

**New file:** `src/components/cart/CartDrawer.tsx`

- Slide-in drawer (using the existing Vaul drawer component) showing all cart items
- Each item shows: image, name, quantity controls (+/-), original price, discounted price, applied coupon code
- Summary section at bottom: subtotal, total discount saved, final total
- "Proceed to Checkout" button that opens the external product link with the coupon code auto-appended
- Empty cart state with a friendly message

### Step 3: Update ProductCard for In-Chat "Add to Cart"

**Modified file:** `src/components/chat/ProductCard.tsx`

- Replace the "View Product" external link button with an "Add to Cart" button
- When clicked, adds the product to the cart context with all discount info
- Show a brief toast/animation confirming the item was added
- Keep a small "View Details" link to the external page as secondary action
- If item is already in cart, show "In Cart" indicator instead

### Step 4: Add Cart Icon with Badge to Chat Header

**Modified file:** `src/pages/Chat.tsx`

- Add a shopping cart icon in the chat header (next to voice toggle)
- Show a badge with the number of items in cart
- Clicking opens the Cart Drawer
- Wrap the Chat page with the CartProvider

### Step 5: Update AI System Prompt for Cart Guidance

**Modified file:** `supabase/functions/chat/index.ts`

- Update the system prompt to tell the AI that users can add products to cart directly in the chat
- Instruct the AI to suggest adding items to cart, ask about quantities, and mention auto-applied discounts
- When users ask for discounts, the AI should highlight available coupon codes and confirm they'll be auto-applied at checkout
- Add instructions for the AI to proactively mention: "I've included the discount -- it'll be auto-applied when you add to cart!"

### Step 6: Update Index Page "Add to Cart" Buttons

**Modified file:** `src/pages/Index.tsx`

- Replace the external link "Add to Cart" buttons with actual cart functionality using the CartContext
- Add the CartDrawer to the Index page as well
- Update the ShoppingCart icon in the header to open the drawer and show a badge

### Step 7: Wrap App with CartProvider

**Modified file:** `src/App.tsx`

- Wrap the app with `CartProvider` so cart state is available everywhere

---

### User Flow

```text
User: "Show me electronics under 2000"
AI: Recommends products with :::product cards (with discount info)
User: Taps "Add to Cart" on a product card
     --> Item added to cart, discount auto-applied, toast confirmation
User: "Do I get any discounts?"
AI: "Great news! The Wireless Earbuds have 15% off with code SAVE15 -- it's already applied in your cart!"
User: Taps cart icon in header
     --> Cart drawer opens showing items, discounts, total
User: Taps "Checkout"
     --> Opens external store link with coupon code in URL
```

### Technical Details

**New files:**
- `src/contexts/CartContext.tsx` -- Cart state management + discount auto-apply logic
- `src/components/cart/CartDrawer.tsx` -- Cart UI drawer component

**Modified files:**
- `src/components/chat/ProductCard.tsx` -- "Add to Cart" button instead of external link
- `src/pages/Chat.tsx` -- Cart icon in header, CartDrawer integration
- `src/pages/Index.tsx` -- Use CartContext for add-to-cart buttons
- `src/App.tsx` -- Wrap with CartProvider
- `supabase/functions/chat/index.ts` -- Update AI system prompt for cart-aware responses

**No new dependencies needed** -- uses existing Vaul drawer and Sonner toast components.

