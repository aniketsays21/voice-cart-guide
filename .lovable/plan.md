

# Show Real Shopify Product Collections for Category Queries

## Problem
When a user asks "show me party perfumes" or "recommend beach vibes perfumes", the bot currently only describes products conversationally and asks the user to pick one. It doesn't show them on the actual Shopify store. The user wants to see 5-6 real product cards on the Shopify website.

## Solution
Add a new `navigate_to_search` action type that the LLM can output for category/collection queries. This will navigate the user to Shopify's native search results or collection pages, showing real product cards on the store.

## How It Works

```text
User says: "Show me party perfumes"
     |
     v
LLM describes 3-5 products conversationally (voice)
     +
LLM outputs: :::action
             type: navigate_to_search
             query: party perfume
             :::
     |
     v
Widget navigates to /search?q=party+perfume
     |
     v
User sees real Shopify search results (5-6 product cards)
with the voice bot still active at the bottom
```

## Changes

### 1. System Prompt (`supabase/functions/chat/index.ts`)

Update the floating overlay mode instructions:
- For category/abstract queries ("party perfumes", "gifts under 1000", "beach vibes"), output a `navigate_to_search` action with a clean search query
- The bot still describes top picks conversationally via voice, but simultaneously navigates the user to see all matching products on the store
- For collection-specific queries, use `navigate_to_collection` if a known collection handle matches (e.g., "men's perfumes" -> `/collections/men`)

New action format:
```
:::action
type: navigate_to_search
query: party perfume for men
:::
```

Or for known collections:
```
:::action
type: navigate_to_collection
collection_handle: men
:::
```

### 2. Widget Action Handler (`public/ai-chat-widget.js`)

- Add handling for `navigate_to_search` action: sets `pendingNavigation = "/search?q=" + encodeURIComponent(action.query)`
- Add handling for `navigate_to_collection` action: sets `pendingNavigation = "/collections/" + action.collection_handle`
- Update `extractActions` to parse the new action types
- Remove the current logic that builds a search URL from the raw user message (lines 678-688) since the LLM will now provide a clean, optimized search query

### 3. Prompt Refinements

The LLM prompt will instruct:
- Single specific product query -> `open_product` (navigate to PDP) -- unchanged
- Category/abstract query -> `navigate_to_search` with an optimized Shopify search query + conversational voice description
- Known collection -> `navigate_to_collection` with the collection handle
- The search query should be clean and optimized for Shopify's search (e.g., "party perfume men" not the full user sentence)

## Files to Modify

| File | Change |
|------|--------|
| `public/ai-chat-widget.js` | Add `navigate_to_search` and `navigate_to_collection` action handlers; remove old multi-product search fallback logic |
| `supabase/functions/chat/index.ts` | Add new action types to system prompt with examples; instruct LLM to use `navigate_to_search` for category queries |

## What Stays the Same
- Single product navigation (open_product) -- unchanged
- Add to cart flow -- unchanged
- Cart/checkout navigation -- unchanged
- Voice pipeline (STT/TTS) -- unchanged
- Session persistence -- unchanged
- Floating bar UI -- unchanged

