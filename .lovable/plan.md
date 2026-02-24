

## Sarvam AI Voice Assistant Integration

### Overview
Add voice input (Speech-to-Text) and voice output (Text-to-Speech) to the AI Assistant chat page using Sarvam AI APIs, supporting English and Hindi.

---

### Step 1: Store the API Key Securely
- Save the Sarvam AI API key (`SARVAM_API_KEY`) as a backend secret so it's only accessible from backend functions, never exposed to the browser.

### Step 2: Create Two Backend Functions

**`sarvam-stt` (Speech-to-Text)**
- Accepts audio data (base64-encoded WAV) from the frontend
- Calls Sarvam AI `https://api.sarvam.ai/speech-to-text` with model `saaras:v2`
- Returns the transcribed text back to the frontend
- Supports English + Hindi auto-detection

**`sarvam-tts` (Text-to-Speech)**
- Accepts text + language code from the frontend
- Calls Sarvam AI `https://api.sarvam.ai/text-to-speech` with model `bulbul:v2`
- Returns base64-encoded audio for playback
- Uses appropriate voice for Hindi vs English

### Step 3: Add Voice UI to Chat Page (`Chat.tsx`)

**Microphone Button**
- Add a mic icon button next to the send button in the input area
- When tapped, starts recording audio using the browser's `MediaRecorder` API (WebM/WAV format)
- Shows a visual "recording" indicator (pulsing red dot / animated mic icon)
- When tapped again (or after silence), stops recording and sends audio to `sarvam-stt`
- The transcribed text is automatically sent as a chat message

**Speaker / Auto-Play**
- After each assistant text response, automatically send the text to `sarvam-tts`
- Play the returned audio using the Web Audio API
- Show a small speaker icon on assistant messages indicating audio is playing
- Add a toggle to enable/disable voice output (so users can use text-only if preferred)

### Step 4: Update `supabase/config.toml`
- Register both new functions with `verify_jwt = false`

---

### Technical Details

```text
User Flow:
[Tap Mic] -> Record Audio -> [Stop] -> sarvam-stt -> Transcribed Text -> send() -> AI Response -> sarvam-tts -> Play Audio
```

**Files to create:**
- `supabase/functions/sarvam-stt/index.ts`
- `supabase/functions/sarvam-tts/index.ts`

**Files to modify:**
- `src/pages/Chat.tsx` — add mic button, recording state, audio playback
- `supabase/config.toml` — register new functions (auto-managed)

**No new dependencies needed** — `MediaRecorder` and `Audio` are native browser APIs.
