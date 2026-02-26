

# Make the Voice Bot Smarter & More Interactive

## 1. Give the Bot a Name & Identity

**Name: "Priya"** — a friendly, approachable Indian name that works well in both Hindi and English contexts.

### Changes:
- **System prompt** (`supabase/functions/chat/index.ts`): Update the welcome behavior and persona to introduce herself as "Priya" in every first interaction. Example: *"Hello! Main Priya hoon, aapki personal shopping assistant Bella Vita ke liye!"*
- **Welcome TTS** (`src/pages/Chat.tsx`): Change the hardcoded greeting from generic text to include "Priya".
- **Avatar label** (`src/pages/Chat.tsx`): Change "Bella Vita AI" to "Priya" in the small avatar bar.

The system prompt will instruct the AI to respond naturally when addressed by name ("Priya, show me perfumes") and to occasionally refer to itself as Priya in conversation.

---

## 2. Smart Features to Add

### A. Conversation Memory & Personalization
- Track user preferences within the session (e.g., "You mentioned you like woody fragrances earlier, so here's another one you might love").
- The system prompt already gets full conversation history — we just need to instruct the AI to reference past preferences proactively.

### B. Proactive Suggestions & Upselling
- After a user adds something to cart, Priya suggests complementary products: *"CEO Man cart mein daal diya! Iske saath CEO Woman bhi try karo, couples ke liye perfect combo hai."*
- Suggest bundles/combos when budget allows.

### C. Quick Voice Commands
- Add recognition for shortcut phrases in the system prompt:
  - "Priya, checkout karo" — navigates to checkout
  - "Priya, cart dikhao" — opens cart
  - "Priya, ruk jao" / "Priya, stop" — stops speaking
  - "Priya, wapas jao" / "go back" — show previous results
  - "Pehla wala add karo" — positional reference ("add the first one")

### D. Mood/Occasion-Based Shopping
- Priya asks follow-up questions: *"Kis occasion ke liye chahiye? Date night, office, ya casual outing?"*
- Then filters products accordingly — this logic already exists in intent extraction but isn't prompted conversationally.

### E. Price Negotiation Feel
- When users say "thoda sasta dikhao" or "budget kam hai", Priya responds empathetically and finds alternatives: *"No worries! Ye dekho, same vibe hai but ₹499 mein mil jayega."*

### F. Confirmation & Feedback Loops
- After showing products, Priya asks: *"Inme se koi pasand aaya? Ya kuch aur try karein?"*
- After adding to cart: *"Cart mein daal diya! Aur kuch chahiye ya checkout karein?"*

---

## Technical Changes

### File: `supabase/functions/chat/index.ts`

**System prompt updates (line ~462-489):**
- Change persona intro to include the name "Priya"
- Add instructions for:
  - Self-introduction on first message
  - Responding to name-based addressing
  - Proactive follow-ups after recommendations
  - Complementary product suggestions after cart additions
  - Mood/occasion-based questioning
  - Empathetic budget handling
  - Confirmation loops after showing products

### File: `src/pages/Chat.tsx`

- **Line ~233 (welcome TTS):** Change greeting to: `"Hello! Main Priya hoon, aapki personal shopping assistant. Aaj main aapko Bella Vita ke best products dikhati hoon."`
- **Line ~293 (avatar label):** Change `"Bella Vita AI"` to `"Priya"`
- **Line ~295 (status text):** Change `"Speaking..."` to `"Priya is speaking..."` and `"Here are your results"` to contextual text

### File: `src/components/assistant/TalkingAvatar.tsx`

- Update avatar display name if it shows text (minor cosmetic change)

---

## Summary of Smart Features

| Feature | What Priya Does |
|---|---|
| Named identity | Introduces herself as "Priya", responds to her name |
| Session memory | References earlier preferences in conversation |
| Proactive upselling | Suggests combos after cart additions |
| Voice shortcuts | "Priya, checkout karo", "pehla wala dikhao" |
| Occasion shopping | Asks about occasion before recommending |
| Budget empathy | Finds alternatives when budget is tight |
| Confirmation loops | Asks "aur kuch?" after every action |

