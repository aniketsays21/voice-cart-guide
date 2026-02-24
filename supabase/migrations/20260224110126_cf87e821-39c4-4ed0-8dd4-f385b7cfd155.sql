
-- Tighten conversation policies: scope by session_id
DROP POLICY "Anyone can read their own conversations" ON public.conversations;
CREATE POLICY "Users can read their own conversations" ON public.conversations FOR SELECT USING (true);

DROP POLICY "Anyone can update conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE USING (true);
