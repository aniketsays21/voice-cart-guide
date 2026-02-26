

# Simultaneous Actions + Fix Callback Prompt Behavior

## Two Changes Needed

### 1. Execute Shopify Actions While Priya Speaks

Currently in `src/pages/Chat.tsx` (lines 299-303), actions and TTS already run in parallel — `handleActions` fires, then `playTTS` starts without awaiting actions. However, the Shopify **embed widget** (`src/embed/widget.ts`) only executes actions AFTER the full message renders, not during streaming.

**Fix**: In the embed widget, execute actions immediately as they're parsed during streaming rather than batching them for after render. This means when Priya says "Cart mein daal diya!", the add-to-cart action fires on the Shopify store simultaneously.

**Changes in `src/embed/widget.ts`**:
- Move action execution to happen immediately when parsed during streaming, not just after full render
- Make `executePendingActions()` run as soon as each action block is detected in the streamed response, rather than waiting for the complete message

**Changes in `src/pages/Chat.tsx`**:
- Ensure `handleActions` runs before (or in parallel with) `playTTS` — this is already the case at lines 299-303, so no change needed here. The current flow is correct: actions fire, then TTS starts playing simultaneously.

### 2. Fix Callback Scheduling — Only Trigger When User Says "I'm Busy"

The current system prompt (line 512-514) says:
> "When user says things like 'meko baad mein call karo'... First ask for their phone number"

This is too eager — Priya is bringing up the callback option proactively at conversation start.

**Fix in `supabase/functions/chat/index.ts`** (lines 512-529):
- Rewrite the CALLBACK SCHEDULING section to make it strictly reactive
- Priya should NEVER proactively suggest callbacks or ask for phone numbers
- Only activate callback flow when the user explicitly says things like:
  - "Abhi free nahi hu"
  - "Baad mein call karo"
  - "I don't have time right now"
  - "Meko 3 baje call karna"
- Remove any language that could make Priya volunteer the callback option
- Add explicit instruction: "NEVER suggest calling the user or ask for their phone number unless the user explicitly requests a callback or says they are busy/not free"

---

## Technical Details

### File: `src/embed/widget.ts`
- In the streaming/render loop, call `executePendingActions()` immediately after each streamed message chunk that contains a complete `:::action...:::` block
- This ensures Shopify cart additions, product page navigations, and checkout redirects happen while Priya's text response is still being displayed/spoken

### File: `supabase/functions/chat/index.ts` (lines 512-529)
- Replace the CALLBACK SCHEDULING prompt section with stricter wording:
  - "CALLBACK SCHEDULING: This feature is ONLY activated when the user explicitly says they are busy, not free, or asks you to call them later. Examples: 'abhi free nahi hu', 'baad mein call karo', 'meko 3 baje call karna', 'I dont have time now'. NEVER proactively suggest calling the user. NEVER ask for their phone number unless they have first requested a callback."
  - Keep the rest of the callback logic (phone number collection, action block output, confirmation) the same

