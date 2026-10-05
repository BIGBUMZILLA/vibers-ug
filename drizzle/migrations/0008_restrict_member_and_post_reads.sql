CREATE OR REPLACE FUNCTION public.is_community_member(_community_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_members WHERE community_id = _community_id AND user_id = _user_id);
$$;
GRANT EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Browse channel members" ON public.channel_members;
CREATE POLICY "Members see channel members" ON public.channel_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_channel_member(channel_id, auth.uid()));

DROP POLICY IF EXISTS "Browse community members" ON public.community_members;
CREATE POLICY "Members see community members" ON public.community_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Read channel posts" ON public.channel_posts;
CREATE POLICY "Members read channel posts" ON public.channel_posts FOR SELECT TO authenticated
  USING (public.is_channel_member(channel_id, auth.uid()));