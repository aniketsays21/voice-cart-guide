
-- Rate limits table for per-session throttling
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  function_name text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (session_id, function_name, window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for rate_limits" ON public.rate_limits
  FOR ALL USING (false);

-- Request logs table for monitoring
CREATE TABLE public.request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  function_name text NOT NULL,
  message_length integer,
  response_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for request_logs" ON public.request_logs
  FOR ALL USING (false);

-- Message content length validation trigger (instead of CHECK constraint for immutability)
CREATE OR REPLACE FUNCTION public.validate_message_content_length()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF char_length(NEW.content) > 5000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length of 5000 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_message_content
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_message_content_length();

-- Daily usage tracking table
CREATE TABLE public.daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  function_name text NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX idx_daily_usage_unique ON public.daily_usage (session_id, function_name, usage_date);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for daily_usage" ON public.daily_usage
  FOR ALL USING (false);
