-- helper: do two users share a conversation?
create or replace function public.shares_conversation(_a uuid, _b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants p1
    join public.conversation_participants p2
      on p1.conversation_id = p2.conversation_id
    where p1.user_id = _a and p2.user_id = _b
  )
$$;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;

create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can view profiles they share a conversation with"
on public.profiles for select
to authenticated
using (public.shares_conversation(auth.uid(), id));

-- directory search that never exposes phone numbers
create or replace function public.search_profiles(_term text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  about text,
  last_seen timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.about, p.last_seen
  from public.profiles p
  where p.id <> auth.uid()
    and not public.is_blocked_between(auth.uid(), p.id)
    and (
      coalesce(trim(_term), '') = ''
      or p.username ilike '%' || _term || '%'
      or p.display_name ilike '%' || _term || '%'
      or (
        length(regexp_replace(_term, '[^0-9]', '', 'g')) >= 6
        and p.phone_e164 = '+' || regexp_replace(_term, '[^0-9]', '', 'g')
      )
    )
  order by p.display_name
  limit 50
$$;

revoke all on function public.search_profiles(text) from public, anon;
grant execute on function public.search_profiles(text) to authenticated;
