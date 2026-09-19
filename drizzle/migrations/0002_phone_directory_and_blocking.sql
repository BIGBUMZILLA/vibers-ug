-- Normalised phone for directory search
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_e164 text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_e164_key ON public.profiles (phone_e164) WHERE phone_e164 IS NOT NULL;

-- Blocked contacts
CREATE TABLE IF NOT EXISTS public.blocked_contacts (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.blocked_contacts TO authenticated;
GRANT ALL ON public.blocked_contacts TO service_role;

ALTER TABLE public.blocked_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read blocks involving me" ON public.blocked_contacts
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Block someone" ON public.blocked_contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);

CREATE POLICY "Unblock someone" ON public.blocked_contacts
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- Helper: is there a block between two users
CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_contacts
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  );
$$;

-- Helper: does anyone in this conversation block the sender
CREATE OR REPLACE FUNCTION public.conversation_blocked_for(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants p
    WHERE p.conversation_id = _conversation_id
      AND p.user_id <> _user_id
      AND public.is_blocked_between(p.user_id, _user_id)
  );
$$;

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_participant(conversation_id, auth.uid())
    AND NOT public.conversation_blocked_for(conversation_id, auth.uid())
  );

ALTER TABLE public.blocked_contacts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_contacts;