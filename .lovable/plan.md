
# Fix Response Latency + Callback Scheduling

## Problem 1: Slow Response Time

Three bottlenecks are adding unnecessary delay:

### A. Sarvam API Failing — Wasted Fallback Calls (~2-4s wasted)
- **STT**: Sarvam returns 404 on every call, then falls back to ElevenLabs. Two wasted API calls per transcription.
- **TTS**: Sarvam returns 400 because the speaker name "arvind" is invalid. Valid names include "priya", "anushka", etc. Then falls back to ElevenLabs. Two more wasted API calls.

**Fix**: Change TTS speaker from "arvind" to "priya" in `supabase/functions/sarvam-tts/index.ts` (line 45). This alone should fix TTS and save ~2-3 seconds. For STT, Sarvam's API endpoint may have changed — switch STT to try ElevenLabs first since it's currently the only one working.

### B. VAD Silence Detection Too Long (2.5s wait)
Currently waits 2500ms of silence before stopping recording. This can be reduced to 1500ms for faster response.

**Fix**: Change VAD timeout from 2500 to 1500 in `src/pages/Chat.tsx` (line 330).

### C. TTS Waits for Full AI Response
Currently the entire AI response streams completely before TTS starts. We can start TTS on the commentary text as soon as streaming finishes (this is already the flow, but fixing Sarvam will make it much faster).

## Problem 2: Callback Never Fires

The `scheduled_calls` table is empty — the `schedule-call` edge function was never called. The cron job is running correctly every minute, but there's nothing to trigger.

Root cause: Either Priya didn't generate the `:::action type: schedule_call:::` block, or the frontend parsing missed it. Two fixes needed:

### A. Frontend Parsing Issue
The `parseActions` function in `Chat.tsx` uses `getVal("type")` which looks for `type:` in the action block. But the action block from the AI might have spacing issues. Also, the `handleActions` function only triggers schedule-call if BOTH `phoneNumber` AND `scheduledTime` are present in a single action block — but the AI asks for the phone number in a separate message, so they may never appear together.

**Fix**: Update the prompt to instruct Priya to output the schedule_call action block ONLY in the message where she confirms both the time AND phone number, ensuring both values are in the same block.

### B. Make Schedule-Call More Robust
Add logging to the schedule-call invocation in `handleActions` so we can see if/when it fires. Also add a toast when the action is detected.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/sarvam-tts/index.ts` | Change speaker from "arvind" to "priya" (line 45) |
| `supabase/functions/sarvam-stt/index.ts` | Reorder fallback: try ElevenLabs first since Sarvam STT is returning 404 |
| `src/pages/Chat.tsx` | Reduce VAD timeout from 2500 to 1500 (line 330) |
| `supabase/functions/chat/index.ts` | Strengthen the schedule_call prompt to ensure both phone + time appear in the same action block |

## Expected Impact
- **Latency**: ~3-5 seconds faster response (fixing Sarvam TTS saves ~2-3s, reducing VAD saves ~1s)
- **Callback**: Will actually store scheduled calls and trigger them via the existing cron job
