

# Revert to "Speak First, Then Navigate"

## What's changing

Move the Shopify navigation (page redirect, checkout, etc.) so it fires **after** the voice bot finishes speaking, not simultaneously.

## Technical change

**File: `public/ai-chat-widget.js`** (lines 830-852)

- Move `executeNavigation()` from inside `currentAudio.play().then(...)` into `currentAudio.onended`
- This way the bot completes its spoken response first, then the Shopify store navigates

**Before (current):**
- `onended`: just restarts listening
- `play().then()`: triggers navigation immediately

**After (updated):**
- `onended`: triggers navigation first (if pending), then restarts listening
- `play().then()`: does nothing extra (just plays audio)

The fallback paths (no audio, TTS error, play error) will still execute navigation immediately since there's nothing to wait for.

