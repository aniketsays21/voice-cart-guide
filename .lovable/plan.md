

# Fix Callback Scheduling — Root Cause Found

## The Problem

The AI **is** generating the `schedule_call` action blocks correctly (confirmed in the messages table — multiple entries with phone number 9729222530 and various times). The frontend parsing code also looks correct. **But the `scheduled_calls` table is completely empty.**

## Root Cause: JWT Verification Blocking the Edge Function

The `supabase/config.toml` file only has 3 functions listed with `verify_jwt = false`:
- `chat`
- `sarvam-stt`
- `sarvam-tts`

The `schedule-call` and `trigger-scheduled-calls` functions are **NOT listed**. This means they default to requiring a valid JWT token. The frontend sends the anon key as a Bearer token, which fails JWT verification, so every call to the `schedule-call` function is silently rejected with a 401 error.

## The Fix

### File: `supabase/config.toml`
Add both missing functions with `verify_jwt = false`:

```toml
[functions.schedule-call]
verify_jwt = false

[functions.trigger-scheduled-calls]
verify_jwt = false
```

### File: `src/pages/Chat.tsx` (minor improvement)
Add error logging to the `.catch()` block in `handleActions` so failures are visible in the console, not just a toast:

```javascript
.catch((err) => {
  console.error("[CALLBACK] Failed to invoke schedule-call:", err);
  toast.error("Failed to schedule call.");
});
```

Also add a `.then()` check for non-OK responses before parsing JSON, since a 401 response would cause a JSON parse error.

## Why the Call Never Happened

The chain is:
1. User says "call me at 11:45" with phone number -- WORKING
2. AI generates `:::action type: schedule_call:::` block -- WORKING (confirmed in DB)
3. Frontend parses the action block -- WORKING (code is correct)
4. Frontend calls `schedule-call` edge function -- **FAILING (401 JWT error)**
5. Nothing is inserted into `scheduled_calls` table -- empty
6. `trigger-scheduled-calls` cron job finds nothing to trigger -- no calls made

## Expected Result After Fix
- The `schedule-call` edge function will accept the request
- A row will be inserted into the `scheduled_calls` table
- The `trigger-scheduled-calls` cron job (already running every minute) will pick it up at the scheduled time
- ElevenLabs outbound call will be triggered to the user's phone number

