
Problem confirmed from logs and current code behavior:

1) The voice pipeline is reaching the backend, but STT is failing.
- Backend logs repeatedly show: `Sarvam STT error: 400 - Failed to read the file, please check the audio format`.
- This means mic capture is happening, but the uploaded audio container/metadata is being rejected before transcription.

2) Yes, something changed vs earlier behavior.
- The widget now sends `audioMimeType: blob.type` from the browser.
- On Chrome this is often `audio/webm;codecs=opus` (with codec suffix).
- Backend currently forwards that type as-is, which can produce parser rejection on STT side in some cases.

3) “Chrome is not asking mic permission now” is usually expected.
- Browsers only prompt once per site unless permission is reset.
- So missing popup does not mean mic is not being accessed.
- Your screenshot state (“Listening...”) indicates getUserMedia is succeeding.

4) There is one workflow regression to fix too:
- In the current widget API, `open()` still calls `triggerWelcome()` immediately.
- That bypasses the intended Start button flow and can make voice state transitions harder to reason about.

Implementation plan to fix this permanently:

Phase 1 — Stabilize audio format handling (highest priority)
- File: `public/ai-chat-widget.js`
  - Add a MIME normalization helper before STT request:
    - Any `*webm*` => `audio/webm`
    - Any `*ogg*` => `audio/ogg`
    - Any `*mp4*` / `*m4a*` / `*aac*` => `audio/mp4`
    - fallback => `audio/webm`
  - Send both:
    - `audioMimeType` (normalized)
    - `audioMimeTypeRaw` (original `blob.type`) for diagnostics
  - Keep the existing auto-retry, but only after explicit STT error parsing so we don’t silently loop without insight.
  - Add short debug logs in widget:
    - selected recorder mime
    - blob mime + size
    - normalized mime sent to STT

- File: `supabase/functions/sarvam-stt/index.ts`
  - Sanitize incoming MIME (`lowercase`, strip `;codecs=...`).
  - Add lightweight container sniffing from first bytes:
    - WebM/Matroska signature
    - OGG signature
    - MP4 `ftyp`
  - If sniffed type differs from client MIME, prefer sniffed type.
  - Build file extension from resolved MIME (`.webm`, `.ogg`, `.mp4`).
  - Add controlled logging:
    - `audioMimeTypeRaw`, normalized MIME, sniffed MIME, payload byte length.
  - Return clearer JSON errors for frontend retry decisions.

Phase 2 — Restore the intended Start/End call UX contract
- File: `public/ai-chat-widget.js`
  - Update `open()` so it only opens UI, not auto-start welcome.
  - Keep welcome trigger only behind explicit Start button action.
  - This ensures clear user gesture flow and predictable mic lifecycle.

Phase 3 — Improve “stuck listening” resilience
- File: `public/ai-chat-widget.js`
  - Add max recording timeout safeguard (e.g., auto-stop at 8–10s) if VAD never detects silence.
  - On repeated STT format failures (e.g., 2 consecutive), show explicit message:
    - “Audio format issue detected, retrying with compatible mode…”
  - Optional compatibility fallback:
    - If available, try alternate recorder MIME order once (e.g., ogg/webm/mp4 preference by support).

Phase 4 — Verification checklist (must pass before publish)
1. End-to-end flow on Chrome desktop:
   - Open widget → Start → welcome spoken → user speaks → transcript processed → response spoken.
2. Confirm no STT 400 “Failed to read file” errors in backend logs.
3. Verify add-to-cart voice action still works.
4. Repeat on Android Chrome and iPhone Safari.
5. Confirm Start/End call behavior remains consistent and no auto-start on open.

Technical notes and expected outcome:
- Root cause is not “mic permission missing”; it’s a format-compatibility break in STT upload metadata/packaging.
- After normalization + backend MIME sniffing, STT should return transcripts again instead of 400s.
- After `open()` fix, the UX will match your requested workflow exactly.

What I will implement immediately after approval:
1) MIME normalization + diagnostics in widget
2) MIME sanitization + container sniffing in backend STT function
3) `open()` no-auto-welcome fix
4) max-recording timeout safety
5) final end-to-end validation steps
