

## Sarvam AI Voice Assistant Integration

### Overview
Add a "tap to speak" microphone button to the AI Assistant chat page. Users tap the mic, speak in English or Hindi, and Sarvam AI transcribes their speech into text which is then sent as a chat message. Assistant responses are also spoken back using Sarvam AI text-to-speech.

---

### Step 1: Store the Sarvam API Key
- Add `SARVAM_API_KEY` as a secure backend secret (value: `sk_vu638xfv_wFhFSltFfATELxDLRPEjePCZ`)
- This key is only accessible from backend functions, never exposed to the browser

### Step 2: Create `sarvam-stt` Backend Function
**File:** `supabase/functions/sarvam-stt/index.ts`

- Accepts base64-encoded audio from the frontend
- Sends it to `https://api.sarvam.ai/speech-to-text` with model `saaras:v2`
- Uses `api-subscription-key` header for authentication
- Returns transcribed text to the frontend
- Supports English and Hindi auto-detection

### Step 3: Create `sarvam-tts` Backend Function
**File:** `supabase/functions/sarvam-tts/index.ts`

- Accepts text and optional language code from the frontend
- Sends it to `https://api.sarvam.ai/text-to-speech` with model `bulbul:v2`
- Returns base64-encoded audio for playback
- Uses appropriate voice based on detected language

### Step 4: Update Chat UI (`src/pages/Chat.tsx`)

**Microphone Button:**
- Add a mic icon button next to the send button
- Tapping starts recording using the browser's `MediaRecorder` API
- Shows a pulsing red animation while recording
- Tapping again stops recording, converts audio to base64, and sends to `sarvam-stt`
- Transcribed text is automatically sent as a chat message via the existing `send()` function

**Voice Playback:**
- After each assistant response completes, send the text to `sarvam-tts`
- Play the returned audio using the `Audio` API
- Show a small speaker icon on assistant messages while audio plays
- Add a voice toggle in the header to enable/disable auto-playback

```text
User Flow:
[Tap Mic] --> Record Audio --> [Tap Stop] --> sarvam-stt --> Transcribed Text --> send() --> AI Response --> sarvam-tts --> Play Audio
```

### Step 5: Register Functions in Config
- `supabase/config.toml` will auto-register `sarvam-stt` and `sarvam-tts` with `verify_jwt = false`

---

### Technical Details

**Files to create:**
- `supabase/functions/sarvam-stt/index.ts` -- Speech-to-Text proxy
- `supabase/functions/sarvam-tts/index.ts` -- Text-to-Speech proxy

**Files to modify:**
- `src/pages/Chat.tsx` -- Add mic button, recording state, audio playback, voice toggle

**No new npm dependencies needed** -- `MediaRecorder` and `Audio` are native browser APIs.

**Audio format:** MediaRecorder will record in WebM/opus format. The Sarvam STT API accepts WAV, so the edge function will handle the raw audio data. If needed, we can send the audio as-is since Sarvam also supports multiple formats.

