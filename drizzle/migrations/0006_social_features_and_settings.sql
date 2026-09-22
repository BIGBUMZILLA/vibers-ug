-- ============ per-user settings ============
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY,
  last_seen_visible boolean NOT NULL DEFAULT true,
  read_receipts boolean NOT NULL DEFAULT true,
  profile_photo_visibility text NOT NULL DEFAULT 'everyone',
  about_visibility text NOT NULL DEFAULT 'everyone',
  message_notifications boolean NOT NULL DEFAULT true,
  group_notifications boolean NOT NULL DEFAULT true,
  notification_sound boolean NOT NULL DEFAULT true,
  notification_preview boolean NOT NULL DEFAULT true,
  chat_wallpaper text NOT NULL DEFAULT 'doodles',
  enter_is_send boolean NOT NULL DEFAULT true,
  font_size text NOT NULL DEFAULT 'medium',
  media_auto_download boolean NOT NULL DEFAULT true,
  media_quality text NOT NULL DEFAULT 'standard',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ statuses ============
CREATE TABLE public.statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text,
  image_url text,
  background text NOT NULL DEFAULT 'red',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX statuses_expires_idx ON public.statuses (expires_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.statuses TO authenticated;
GRANT ALL ON public.statuses TO service_role;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own and contacts statuses" ON public.statuses FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (public.shares_conversation(auth.uid(), user_id) AND NOT public.is_blocked_between(auth.uid(), user_id)));
CREATE POLICY "Post own status" ON public.statuses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own status" ON public.statuses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.status_views (
  status_id uuid NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (status_id, viewer_id)
);
GRANT SELECT, INSERT ON public.status_views TO authenticated;
GRANT ALL ON public.status_views TO service_role;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read views of my statuses" ON public.status_views FOR SELECT TO authenticated
  USING (auth.uid() = viewer_id OR EXISTS (SELECT 1 FROM public.statuses s WHERE s.id = status_views.status_id AND s.user_id = auth.uid()));
CREATE POLICY "Record my view" ON public.status_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

-- ============ channels ============
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.channel_members (
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);
CREATE TABLE public.channel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = _channel_id AND user_id = _user_id);
$$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_posts TO authenticated;
GRANT ALL ON public.channels, public.channel_members, public.channel_posts TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can browse channels" ON public.channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create a channel" ON public.channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins update channel" ON public.channels FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Admins delete channel" ON public.channels FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Browse channel members" ON public.channel_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Join a channel" ON public.channel_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave a channel" ON public.channel_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Read channel posts" ON public.channel_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members post to channel" ON public.channel_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.is_channel_member(channel_id, auth.uid()));
CREATE POLICY "Delete own channel post" ON public.channel_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ============ communities ============
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.community_members (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
CREATE TABLE public.community_groups (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id),
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, conversation_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_groups TO authenticated;
GRANT ALL ON public.communities, public.community_members, public.community_groups TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Browse communities" ON public.communities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create a community" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins update community" ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Admins delete community" ON public.communities FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Browse community members" ON public.community_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Join a community" ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave a community" ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Read community groups" ON public.community_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Link group to own community" ON public.community_groups FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.created_by = auth.uid()));

-- ============ realtime ============
ALTER TABLE public.statuses REPLICA IDENTITY FULL;
ALTER TABLE public.channel_posts REPLICA IDENTITY FULL;
ALTER TABLE public.channel_members REPLICA IDENTITY FULL;
ALTER TABLE public.community_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;