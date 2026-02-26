

# Schedule Callback Calls via ElevenLabs Agent

## Overview

When a user says something like "meko 3 baje call karo" or "call me in 2 hours", Priya will:
1. Recognize the callback intent and ask for the phone number
2. Store the scheduled call in the database with conversation context
3. A cron job checks every minute for pending calls
4. At the scheduled time, trigger the ElevenLabs agent to call the user with the same conversation context

---

## Step 1: Create `scheduled_calls` Database Table

New table to store callback requests:

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| phone_number | text | User's phone number |
| scheduled_at | timestamptz | When to make the call |
| conversation_id | uuid | Link to existing conversation for context |
| session_id | text | Session identifier |
| context_summary | text | What the user was discussing (product names, preferences) |
| status | text | pending / calling / completed / failed |
| elevenlabs_conversation_id | text | ElevenLabs conversation ID after call is made |
| created_at | timestamptz | When the request was created |

RLS: Service role only (edge functions manage this table).

---

## Step 2: Update System Prompt in `chat/index.ts`

Add callback scheduling instructions to the Priya persona:

- Recognize phrases like: "baad mein call karo", "3 baje call karna", "I'm busy, call me later", "meko call karo"
- Ask for phone number naturally: "Zaroor! Aapka phone number bata dijiye, main 3 baje call karungi"
- After getting the number, output a new action block:

```
:::action
type: schedule_call
phone_number: 9876543210
scheduled_time: 15:00
context: User was looking at CEO Man perfume, interested in woody fragrances under 1000
:::
```

- Confirm to user: "Done! Main aapko 3:00 PM pe call karungi. Tab tak Priya aapke liye best deals ready rakhegi!"

---

## Step 3: Parse `schedule_call` Action in Frontend

Update `parseActions` in `Chat.tsx` to extract `schedule_call` actions with additional fields (phone_number, scheduled_time, context).

Update `handleActions` to call a new edge function `schedule-call` that stores the data in the `scheduled_calls` table.

Show a toast confirmation: "Call scheduled for 3:00 PM"

---

## Step 4: Create `schedule-call` Edge Function

A simple edge function that:
- Receives phone_number, scheduled_time, conversation_id, session_id, context_summary
- Converts the time (e.g., "15:00") to a full timestamp in IST (Asia/Kolkata timezone)
- Inserts a row into `scheduled_calls` with status = "pending"
- Returns success confirmation

---

## Step 5: Create `trigger-scheduled-calls` Edge Function

This function is called every minute by a cron job. It:
1. Queries `scheduled_calls` where `scheduled_at <= now()` and `status = 'pending'`
2. For each pending call:
   - Loads conversation history from `messages` table using `conversation_id`
   - Calls the ElevenLabs Conversational AI API to initiate an outbound call
   - Updates the row status to "calling"
3. Uses the ElevenLabs Agent API with conversation context override so Priya remembers what was discussed

**ElevenLabs Outbound Call API:**
```
POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call
Headers: xi-api-key: ELEVENLABS_API_KEY
Body: {
  agent_id: "YOUR_AGENT_ID",
  agent_phone_number_id: "YOUR_PHONE_NUMBER_ID",
  to_number: "+919876543210",
  conversation_initiation_client_data: {
    dynamic_variables: {
      user_name: "customer",
      context: "User was looking at CEO Man perfume..."
    }
  }
}
```

---

## Step 6: Set Up pg_cron Job

A cron job runs every minute to invoke the `trigger-scheduled-calls` edge function:

```sql
SELECT cron.schedule(
  'trigger-scheduled-calls',
  '* * * * *',
  $$ SELECT net.http_post(...) $$
);
```

---

## What You Need to Provide

Before I can implement this, I need:

1. **ElevenLabs Agent ID** -- the agent you set up for calling
2. **ElevenLabs Phone Number ID** -- the phone number registered in your ElevenLabs account for outbound calls (found in ElevenLabs dashboard under Phone Numbers)
3. **Confirmation** that your ElevenLabs agent has the Twilio/phone calling feature enabled

---

## Files to Create/Modify

| File | Change |
|------|--------|
| Database migration | Create `scheduled_calls` table |
| `supabase/functions/chat/index.ts` | Add callback intent recognition to system prompt |
| `src/pages/Chat.tsx` | Parse `schedule_call` action, call schedule edge function |
| `supabase/functions/schedule-call/index.ts` | New -- stores scheduled call in DB |
| `supabase/functions/trigger-scheduled-calls/index.ts` | New -- cron-triggered, initiates ElevenLabs outbound calls |
| `supabase/config.toml` | Add new edge function configs |
| pg_cron SQL | Schedule the minute-by-minute trigger |

