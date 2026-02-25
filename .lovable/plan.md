

# Fix: Voice Bot Stuck at "Listening..." - Not Processing Input

## Problem Identified

After investigating, I found **two issues** causing the bot to get stuck:

### Issue 1: Published Version is Outdated
The live script on your Shopify store (`voice-cart-guide.lovable.app/ai-chat-widget.js`) is still the **old version** (1023 lines). Your project has the new version (1216 lines) with the Start/End Call flow, but it was **never published**. You need to click **Publish > Update** in Lovable.

### Issue 2: Recording Pipeline Bug (processAudio)
Even in the new code, the `processAudio` function does NOT send the `audioMimeType` to the STT backend. The STT backend hardcodes `audio/webm` for all recordings. On Safari/iOS, browsers record in `audio/mp4`, which causes Sarvam AI to reject the audio silently.

Additionally, when STT returns an empty transcript or fails, the bot shows "Didn't catch that" but does NOT auto-restart listening -- it just sits there, requiring a manual mic tap. Since this is a "continuous listening" bot, it should auto-retry.

## Fixes

### File 1: `public/ai-chat-widget.js`

**Fix processAudio to send audioMimeType:**
- Pass `blob.type` (e.g., `audio/webm`, `audio/mp4`) in the STT request body as `audioMimeType`
- This lets the backend use the correct MIME type when forwarding to Sarvam AI

**Fix auto-retry on empty transcript:**
- When STT returns empty/no transcript, auto-restart listening after 1.5 seconds instead of staying stuck at "idle"
- When STT errors out, also auto-restart listening

**Fix auto-retry on STT network error:**
- Same auto-restart behavior on catch block

### File 2: `supabase/functions/sarvam-stt/index.ts`

**Accept and use audioMimeType from request:**
- Read `audioMimeType` from the request body
- Use it when creating the Blob for Sarvam API (instead of hardcoded `audio/webm`)
- Derive the correct file extension (`.webm`, `.mp4`, `.ogg`) from the MIME type
- Fall back to `audio/webm` / `.webm` if not provided

## Technical Details

### Widget changes (processAudio function):
```javascript
// Before:
body: JSON.stringify({ audio: base64, sessionId: sessionId })

// After:
body: JSON.stringify({ audio: base64, sessionId: sessionId, audioMimeType: blob.type || "audio/webm" })
```

### Widget changes (auto-retry on empty transcript):
```javascript
// Before:
setVoiceState("idle", "Didn't catch that. Tap mic to try again.");
return;

// After:
setVoiceState("idle", "Didn't catch that. Listening again...");
setTimeout(startListening, 1500);
return;
```

### STT function changes:
```typescript
// Before:
formData.append("file", new Blob([binaryAudio], { type: "audio/webm" }), "recording.webm");

// After:
const mimeType = audioMimeType || "audio/webm";
const ext = mimeType.includes("mp4") ? ".mp4" : mimeType.includes("ogg") ? ".ogg" : ".webm";
formData.append("file", new Blob([binaryAudio], { type: mimeType }), "recording" + ext);
```

## Deployment

After these changes:
1. Click **Publish > Update** in Lovable
2. Hard-refresh the Shopify store page (Ctrl+Shift+R) to bypass cached script
3. If the old version still loads, add `?v=2` to the script URL in your Shopify theme.liquid (one-time edit)
4. **No other Shopify file changes needed**

