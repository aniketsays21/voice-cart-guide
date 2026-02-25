

# Auto-Welcome Message with Top Products on AI Assistant Open

## What Changes

When a user taps "AI Assistant", instead of seeing just a mic button, they'll immediately see a welcome greeting from the agent along with Bella Vita's top-selling products -- no user interaction needed.

## How It Works

1. **Auto-trigger on mount**: When the Chat page loads, automatically send a hidden welcome prompt to the AI backend (e.g., "Show me top selling products from Bella Vita") so the agent responds with a branded greeting and product cards.

2. **Welcome state UI**: While the welcome response loads, show a branded loading screen with "Welcome to Bella Vita" and a spinner, so the user never sees a blank screen.

3. **Agent greeting**: The AI will respond in Hinglish with something like "Welcome to Bella Vita store, mai aapki kaise madad kar sakti hu" along with top-selling product cards.

## Technical Details

### File: `src/pages/Chat.tsx`
- Add a `useEffect` on mount that auto-calls `send()` with a welcome prompt like `"Hi, show me top selling Bella Vita products"` -- but mark it as a system-initiated message so it doesn't show as a user bubble.
- Add a new state `isWelcomeLoading` that is true until the first response arrives.
- Replace the `showHero` idle screen with a branded welcome loading animation (Bella Vita logo area + "Connecting to your shopping assistant..." text).
- After the welcome response arrives, products appear as usual and the mic bar is shown at the bottom for follow-up.

### File: `supabase/functions/chat/index.ts`
- Update the system prompt to include a specific instruction: "If the user's first message is a greeting or asks for top products, respond with a warm welcome in Hinglish: 'Welcome to Bella Vita store, mai aapki kaise madad kar sakti hu. Ye kuch Bella Vita ke top selling products hai' and show the top 4-6 bestselling products sorted by rating."

### Changes Summary
- `src/pages/Chat.tsx` -- Add auto-welcome trigger on mount, welcome loading UI
- `supabase/functions/chat/index.ts` -- Add welcome greeting instruction to system prompt

