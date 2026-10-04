ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS cleared_at timestamptz NOT NULL DEFAULT '1970-01-01T00:00:00Z';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url text, ADD COLUMN IF NOT EXISTS file_name text;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
CREATE OR REPLACE FUNCTION public.clear_my_chats() RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$ UPDATE public.conversation_participants SET cleared_at = now(), last_read_at = now() WHERE user_id = auth.uid(); $$;
REVOKE ALL ON FUNCTION public.clear_my_chats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_my_chats() TO authenticated;