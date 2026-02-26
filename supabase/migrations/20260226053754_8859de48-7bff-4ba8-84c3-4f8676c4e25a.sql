CREATE TABLE public.scheduled_calls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id),
  session_id text NOT NULL,
  context_summary text,
  status text NOT NULL DEFAULT 'pending',
  elevenlabs_conversation_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for scheduled_calls" ON public.scheduled_calls
  AS RESTRICTIVE FOR ALL
  USING (false);