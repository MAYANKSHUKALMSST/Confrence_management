
-- Tighten INSERT policy: only allow inserts where user_id matches or via security definer functions
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "System insert via trigger"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
