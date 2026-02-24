

## Sarvam AI Voice Assistant Integration

### What We'll Build
A "tap to speak" microphone button in the AI Assistant chat. You speak in English or Hindi, Sarvam AI transcribes your speech, sends it as a message, and the assistant's response is spoken back to you.

---

### Step 1: Store the Sarvam API Key Securely
- Save `SARVAM_API_KEY` as a secure backend secret
- Only accessible from backend functions, never exposed to the browser

### Step 2: Create Speech-to-Text Backend Function
**New file:** `supabase/functions/sarvam-stt/index.ts`

- Accepts base64-encoded audio from the frontend
- Sends it to Sarvam AI's speech-to-text API (`saaras:v2` model)
- Returns the transcribed text
- Auto-detects English and Hindi

### Step 3: Create Text-to-Speech Backend Function
**New file:** `supabase/functions/sarvam-tts/index.ts`

- Accepts text and optional language code
- Sends it to Sarvam AI's text-to-speech API (`bulbul:v2` model)
- Returns base64-encoded audio for playback
- Uses appropriate voice for Hindi vs English

### Step 4: Add Voice UI to Chat Page
**Modified file:** `src/pages/Chat.tsx`

**Microphone Button (next to send button):**
- Tap to start recording (uses browser's native MediaRecorder API)
- Pulsing red animation while recording
- Tap again to stop -- audio is sent to the STT function
- Transcribed text auto-sends as a chat message

**Voice Playback:**
- After each assistant response, text is sent to TTS function
- Audio plays automatically using the browser Audio API
- Small speaker icon shown while audio plays
- Voice toggle in the header to enable/disable auto-playback

### Step 5: Register Functions
- Both `sarvam-stt` and `sarvam-tts` will be registered in the backend config

---

### User Flow

```text
[Tap Mic] --> Record Audio --> [Tap Stop] --> STT --> Transcribed Text --> send() --> AI Response --> TTS --> Play Audio
```

### Technical Details

**Files to create:**
- `supabase/functions/sarvam-stt/index.ts` -- Speech-to-Text proxy
- `supabase/functions/sarvam-tts/index.ts` -- Text-to-Speech proxy

**Files to modify:**
- `src/pages/Chat.tsx` -- Add mic button, recording logic, audio playback, voice toggle
- `supabase/config.toml` -- Register new functions

**No new dependencies needed** -- MediaRecorder and Audio are native browser APIs.

**Sarvam API details:**
- STT endpoint: `https://api.sarvam.ai/speech-to-text` with `api-subscription-key` header
- TTS endpoint: `https://api.sarvam.ai/text-to-speech` with `api-subscription-key` header
- Audio format: MediaRecorder records WebM; Sarvam supports multiple formats including WAV
