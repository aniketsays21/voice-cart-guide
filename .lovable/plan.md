

# Three Improvements: Welcome Message, Faster Response, Simultaneous Actions

## 1. Updated Welcome Message

Change the greeting across all three locations to:

**English + Hindi**: "Hello, Welcome to Bella AI! I am your AI assistant to guide you through the process. Here are the bestselling products, what would you like to view? Hindi mein: Namaste, Bella AI mein aapka swagat hai! Main aapki AI assistant hoon, aapko guide karne ke liye. Ye rahe bestselling products, aap kya dekhna chahenge?"

### Files to update:
- **`src/pages/Chat.tsx`** (line 445) — the TTS greeting text
- **`public/ai-chat-widget.js`** (line 886) — the welcome query sent to the AI
- **`supabase/functions/chat/index.ts`** (line 474) — the WELCOME BEHAVIOR section in the system prompt

---

## 2. Faster Response — Switch TTS to ElevenLabs-First

Currently TTS tries Sarvam first, then ElevenLabs as fallback. Sarvam errors add ~2-3 seconds of wasted time before falling back. We will flip the order so ElevenLabs is tried first (faster, more reliable), with Sarvam as the fallback.

### File to update:
- **`supabase/functions/sarvam-tts/index.ts`** — Reorder the fallback chain:
  1. Try ElevenLabs first (faster, no 404 issues)
  2. Then Sarvam Key 1 as fallback
  3. Then Sarvam Key 2 as last resort

This mirrors the STT function which already uses ElevenLabs-first.

---

## 3. Simultaneous Actions While Speaking

Currently in the Shopify widget, navigation only happens AFTER TTS audio finishes playing (line 830-858). The fix: execute the pending navigation immediately when TTS starts playing, not when it ends. This way the user hears Priya speaking while the Shopify page navigates simultaneously.

### File to update:
- **`public/ai-chat-widget.js`** (lines 799-858) — Move `executeNavigation()` call to fire right when TTS audio starts playing (alongside `currentAudio.play()`), instead of inside `currentAudio.onended`. Keep the fallback navigation on error/no-audio paths.

---

## Technical Summary

| Change | File(s) | What |
|--------|---------|------|
| Welcome message | Chat.tsx, ai-chat-widget.js, chat/index.ts | New bilingual greeting |
| TTS speed | sarvam-tts/index.ts | ElevenLabs-first, Sarvam fallback |
| Simultaneous actions | ai-chat-widget.js | Navigate during TTS, not after |

