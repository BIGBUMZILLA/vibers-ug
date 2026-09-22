-- Atomic, policy-proof chat creation so ANY signed-in user can start a chat.
CREATE OR REPLACE FUNCTION public.start_direct_chat(_other_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _cid uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _other_id IS NULL OR _other_id = _me THEN RAISE EXCEPTION 'Pick someone else'; END IF;
  IF public.is_blocked_between(_me, _other_id) THEN RAISE EXCEPTION 'This person is blocked'; END IF;

  SELECT c.id INTO _cid
  FROM public.conversations c
  JOIN public.conversation_participants a ON a.conversation_id = c.id AND a.user_id = _me
  JOIN public.conversation_participants b ON b.conversation_id = c.id AND b.user_id = _other_id
  WHERE c.is_group = false
  LIMIT 1;

  IF _cid IS NOT NULL THEN RETURN _cid; END IF;

  INSERT INTO public.conversations (is_group, created_by) VALUES (false, _me) RETURNING id INTO _cid;
  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
  VALUES (_cid, _me, true), (_cid, _other_id, false);
  RETURN _cid;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_group_chat(_title text, _member_ids uuid[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _cid uuid;
  _m uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  INSERT INTO public.conversations (is_group, title, created_by)
  VALUES (true, coalesce(nullif(trim(_title), ''), 'Group'), _me) RETURNING id INTO _cid;
  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin) VALUES (_cid, _me, true);
  FOREACH _m IN ARRAY coalesce(_member_ids, '{}'::uuid[]) LOOP
    IF _m <> _me THEN
      INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (_cid, _m)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RETURN _cid;
END;
$$;

REVOKE ALL ON FUNCTION public.start_direct_chat(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.start_group_chat(text, uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_direct_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_group_chat(text, uuid[]) TO authenticated;

-- Realtime completeness for participant rows
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;

-- Clean up empty conversations created by the previously failing path
DELETE FROM public.conversations c
WHERE NOT EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id = c.id);
