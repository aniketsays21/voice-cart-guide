

# Switch to Sarvam AI for TTS and STT with Fallback Chain

## Summary

Replace ElevenLabs as the primary voice provider with Sarvam AI, which offers native Indian voices (pure Hindi/Hinglish). The system will try three providers in order:

1. **Sarvam AI Key 1** (primary)
2. **Sarvam AI Key 2** (fallback)
3. **ElevenLabs** (last resort)

When any key returns a 429 (rate limit) or 403 (credits exhausted) error, the system automatically tries the next one.

## What Changes

### 1. Store the two Sarvam API keys as secrets

- `SARVAM_API_KEY` already exists -- will be updated to Key 1
- `SARVAM_API_KEY_2` -- new secret for Key 2

### 2. Rewrite `supabase/functions/sarvam-tts/index.ts`

**New flow:**
```text
Try Sarvam Key 1 (bulbul:v3, speaker "Ratan")
  -> If 429/403, try Sarvam Key 2
    -> If 429/403, try ElevenLabs
      -> If all fail, return error
```

**Sarvam TTS API call:**
- URL: `https://api.sarvam.ai/text-to-speech`
- Header: `api-subscription-key: <key>`
- Body: `{ text, target_language_code: "hi-IN", model: "bulbul:v3", speaker: "Ratan", pace: 1.0 }`
- Response: `{ audios: ["base64-wav-string"] }`

The response format stays the same for the client (`{ audio, audioFormat }`), but `audioFormat` will be `"wav"` when Sarvam is used and `"mp3"` when ElevenLabs is used.

**Speaker choice:** "Ratan" -- a natural Indian male voice on bulbul:v3 that sounds authentic for Hinglish conversations. Can be changed easily.

### 3. Rewrite `supabase/functions/sarvam-stt/index.ts`

**New flow:**
```text
Try Sarvam Key 1 (saaras:v3, mode "transcribe")
  -> If 429/403, try Sarvam Key 2
    -> If 429/403, try ElevenLabs
      -> If all fail, return error
```

**Sarvam STT API call:**
- URL: `https://api.sarvam.ai/speech-to-text/transcribe`
- Multipart form: `file` (audio blob), `model: "saaras:v3"`, `language_code: "unknown"` (auto-detect)
- Response: `{ transcript: "...", language_code: "hi-IN" }`

The response format already matches what the client expects.

### 4. Update client audio handling (`src/pages/Chat.tsx`)

Sarvam returns WAV audio (not MP3). The client already uses base64 data URIs for playback, so we just need to handle the `audioFormat` field:
- If `audioFormat === "wav"` -> use `data:audio/wav;base64,...`
- If `audioFormat === "mp3"` -> use `data:audio/mpeg;base64,...` (existing behavior)

## How Credit Exhaustion Detection Works

When Sarvam API credits are exhausted, they return:
- **HTTP 429**: Too many requests / rate limit
- **HTTP 403**: Forbidden (subscription expired or credits used up)

The edge function catches these status codes and immediately retries with the next key. Console logs will indicate which provider was used:
```text
TTS: Sarvam key1 failed (429), trying key2...
TTS: Sarvam key2 failed (403), falling back to ElevenLabs...
```

## Files to Modify

| File | Change |
|------|--------|
| Secrets | Add `SARVAM_API_KEY_2`; update `SARVAM_API_KEY` to new value |
| `supabase/functions/sarvam-tts/index.ts` | Rewrite to use Sarvam TTS as primary with fallback chain |
| `supabase/functions/sarvam-stt/index.ts` | Rewrite to use Sarvam STT as primary with fallback chain |
| `src/pages/Chat.tsx` | Handle `audioFormat: "wav"` in addition to `"mp3"` for playback |

## What Stays the Same
- Chat function (LLM reasoning) -- unchanged
- Widget embed code -- unchanged
- Rate limiting logic -- unchanged
- Session management -- unchanged
- All existing client UI -- unchanged

