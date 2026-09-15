-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  about text NOT NULL DEFAULT 'Hey there! I am using Rouge.',
  phone text,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- CONVERSATIONS
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  title text,
  avatar_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  last_read_at timestamptz NOT NULL DEFAULT 'epoch',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  );
$$;

CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.is_participant(id, auth.uid()));
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (public.is_participant(id, auth.uid()));

CREATE POLICY "View participants of own conversations"
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "Add participants to own or new conversations"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_participant(conversation_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
  );
CREATE POLICY "Update own participant row"
  ON public.conversation_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Leave conversation"
  ON public.conversation_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text,
  image_url text,
  reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "Senders can update own messages"
  ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "Senders can delete own messages"
  ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- REACTIONS
CREATE TABLE public.message_reactions (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read reactions in own conversations"
  ON public.message_reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_participant(m.conversation_id, auth.uid())));
CREATE POLICY "React in own conversations"
  ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_participant(m.conversation_id, auth.uid())));
CREATE POLICY "Remove own reactions"
  ON public.message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- bump conversation on new message
CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER messages_bump_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

-- auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base text;
  uname text;
  n int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user'), '[^a-z0-9_]', '', 'g'));
  IF base = '' THEN base := 'user'; END IF;
  uname := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = uname) LOOP
    n := n + 1;
    uname := base || n::text;
  END LOOP;
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    uname,
    coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', uname),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;