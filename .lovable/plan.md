

# Voice Agent Mode for Shopify Widget

## What You'll Get
A new **Voice tab** inside the existing chat widget on Shopify. Customers tap a microphone button, speak naturally, and the assistant **responds with voice** while showing matching products as visual cards. No typing, no reading -- just talk and shop.

```text
+------------------------------------------+
|  Shopping Assistant              [X]     |
|  [ Chat ]  [ Voice ]                     |
|------------------------------------------|
|                                          |
|   [Product Card]  [Product Card]         |
|   [Product Card]  [Product Card]         |
|                                          |
|        "Here are some perfumes           |
|         under 500 rupees..."             |
|              (spoken aloud)              |
|                                          |
|         Status: Listening...             |
|                                          |
|          ~~~~ waveform ~~~~              |
|                                          |
|            [ MIC BUTTON ]                |
+------------------------------------------+
```

## How It Works (User Flow)
1. Customer opens widget and taps the **Voice** tab
2. Taps the large **microphone button** to start speaking
3. A waveform animation shows active listening
4. When they stop talking (silence detection), the audio is sent for processing
5. The AI responds with **spoken audio** (plays automatically)
6. Any product recommendations appear as **visual cards** in the display area
7. The mic automatically restarts to listen for follow-up questions
8. Customer taps the mic button again to stop the session

## Changes Required

### 1. Update `public/ai-chat-widget.js` (Main Change)

Add the entire voice mode to the self-contained widget bundle:

- **Two tabs in the header**: "Chat" and "Voice" toggle buttons
- **Voice UI**: Large circular mic button with pulsing animation, status text (Idle / Listening / Processing / Speaking), waveform canvas visualization, and a product results grid
- **Audio recording**: Use `MediaRecorder` API to capture microphone audio as WebM
- **Silence detection (VAD)**: Use Web Audio API + AnalyserNode to detect when the user stops talking (2 seconds of silence), then auto-submit
- **STT call**: Send recorded audio (base64) to the existing `sarvam-stt` edge function
- **Chat call**: Send transcript to the existing `chat` edge function (collect full response, not streaming, so we can extract text for TTS)
- **Product parsing**: Extract `:::product` blocks from AI response and render as visual cards
- **TTS call**: Strip markdown/special chars from the text portion of the response, send to the existing `sarvam-tts` edge function
- **Audio playback**: Play the returned base64 audio via `Audio` API
- **Auto-restart**: After playback ends, restart the microphone to listen for follow-up queries
- **Cancel button**: Allow user to interrupt at any point during processing/speaking

### 2. Update `public/embed-demo.html`

No changes needed -- the demo already loads `ai-chat-widget.js` and will automatically get the voice tab.

### 3. No Backend Changes Needed

All three edge functions already exist and work:
- `sarvam-stt` -- speech to text (Sarvam saaras:v3)
- `sarvam-tts` -- text to speech (Sarvam bulbul:v2)
- `chat` -- AI reasoning with product catalog (Gemini)

## Technical Details

### Voice Mode State Machine
```text
IDLE --> LISTENING --> PROCESSING --> SPEAKING --> IDLE
  ^                       |              |
  |                       v              v
  +---- (cancel) --------+-- (cancel) --+
```

### Chat API Usage (Non-Streaming for Voice)
For voice mode, the chat API will be called without streaming so the full response text can be:
1. Parsed for product cards (displayed visually)
2. Cleaned of markdown/emojis/special chars
3. Sent to TTS for voice output

The existing streaming endpoint will still be used for the Chat tab.

### New CSS Classes Added to Widget Styles
- `.aicw-tabs` -- Tab bar for Chat/Voice toggle
- `.aicw-voice-area` -- Main voice mode container
- `.aicw-mic-btn` -- Large circular microphone button with pulse animation
- `.aicw-waveform` -- Canvas element for audio visualization
- `.aicw-voice-status` -- Status text display
- `.aicw-voice-products` -- Product cards grid in voice mode

### Text Cleaning for TTS
Before sending to TTS, the AI response text is filtered to remove:
- `:::product` and `:::action` blocks (visual only)
- Markdown symbols (`**`, `*`, `#`, etc.)
- Emojis and special characters
- Keeps only natural spoken text with commas and periods

### Widget Size
The `public/ai-chat-widget.js` file will grow from ~565 lines to approximately ~900 lines. Still a single self-contained file with no dependencies.

