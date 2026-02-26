
## Callback flow explained in simple English

When Priya takes your number and time, this is the intended flow:

1. Priya’s response includes an internal action block:
   - `type: schedule_call`
   - `phone_number: ...`
   - `scheduled_time: ...`
2. The frontend must detect that action and call backend function `schedule-call`.
3. `schedule-call` stores the request in `scheduled_calls` table with:
   - phone number
   - scheduled timestamp (IST-based)
   - status = `pending`
   - conversation/session context
4. Every minute, an automated cron job calls `trigger-scheduled-calls`.
5. `trigger-scheduled-calls` picks pending rows whose `scheduled_at <= now`.
6. It sends an outbound call request to ElevenLabs (`/v1/convai/twilio/outbound-call`) and marks status (`calling`/`failed`).

---

## What I checked in your live project (actual diagnosis)

I validated the pipeline and found:

- Priya **is generating** `schedule_call` action blocks in conversation messages.
- `scheduled_calls` table is currently **empty**.
- No runtime logs for `schedule-call` function (means it is not being invoked).
- Cron is healthy:
  - cron job exists
  - runs every minute
  - `trigger-scheduled-calls` is being called successfully (HTTP 200 repeatedly).
- `trigger-scheduled-calls` cannot do anything because there are no rows to process.

### Root cause now
Your Shopify voice widget flow is not invoking callback scheduling:
- In `public/ai-chat-widget.js`, action handling supports:
  - `open_product`, `navigate_to_search`, `navigate_to_collection`, `add_to_cart`, `navigate_to_checkout`, `navigate_to_cart`
- It does **not** handle `schedule_call`.
- Same limitation exists in `src/embed/widget.ts` action type handling.

So Priya asks for number/time and even emits action text, but frontend never sends it to `schedule-call`, so no callback is stored.

---

## Is Sarvam AI causing callback failure?

Short answer: **No (not for callback scheduling).**

- Callback storage + calling path uses:
  - backend `schedule-call`
  - backend `trigger-scheduled-calls`
  - ElevenLabs outbound calling API
- Sarvam is only in voice STT/TTS conversation path.
- Even if Sarvam had issues, callback would still work **if** `schedule-call` is invoked correctly.

Current voice provider state from code:
- STT is already ElevenLabs-first (Sarvam fallback).
- TTS is Sarvam-first, then ElevenLabs fallback.

If you want, I can plan a clean switch to ElevenLabs-first for TTS too, but that is optimization — not the callback blocker.

---

## Exact user instructions: how to give number/time so callback works reliably

Use this pattern in one clear sentence (or two consecutive messages):

- “Priya, main busy hoon. Mujhe 5:30 PM pe call karna. Mera number 98XXXXXXXX.”

Best practices:
1. Give a **10-digit Indian mobile number**.
2. Give time in one of these formats:
   - `15:30`
   - `3:30 PM`
   - `11:45`
3. Prefer **time only** (current scheduler expects time, not full date parsing).
4. If you say a past time, system schedules for next day.
5. Time is interpreted in **IST**.

Avoid for now:
- “tomorrow 5:30”, “26 Feb 5:30 PM” (date text may not parse cleanly unless explicitly supported).

---

## Why you didn’t receive callback (summary)

Your backend scheduler is running, but callback requests are never inserted because the active widget/frontend flow does not execute the `schedule_call` action.

---

## Implementation plan to fix it properly

### Scope
Add callback action execution to the widget flow (where users are actually interacting), and add robust validation/logging.

### Changes
1. Extend widget action types to include:
   - `schedule_call`
   - `phone_number`, `scheduled_time`, `context`
2. In widget action handler (`public/ai-chat-widget.js` and source `src/embed/widget.ts`):
   - detect `schedule_call`
   - call backend `schedule-call` with:
     - phone_number
     - scheduled_time
     - conversation_id
     - session_id
     - context_summary
3. Add user feedback toasts:
   - “Scheduling callback...”
   - success/failure details
4. Add console logs for troubleshooting (request start, response status, response body).
5. Keep current cron + trigger logic unchanged (already healthy).

### Verification checklist (end-to-end)
1. Trigger callback request from widget using number + time.
2. Confirm success toast appears.
3. Confirm new row appears in `scheduled_calls` with `status = pending`.
4. Wait until scheduled time.
5. Confirm row changes to `calling` or `failed`.
6. Confirm phone receives call.
7. If failed, inspect trigger function logs for ElevenLabs response body and fix format/agent settings.

---

## Optional follow-up (if you want full ElevenLabs switch)

I can also prepare a second change set:
- make TTS ElevenLabs-first (Sarvam fallback or fully disabled),
- keep same output format and lower latency behavior,
- retain rollback toggle.

This is optional and separate from callback fix.
