import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  about: string;
  last_seen: string;
  phone?: string | null;
  phone_e164?: string | null;
};

/** Turns any typed number into a comparable +digits form. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length < 6) return null;
  return `+${digits}`;
}

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  is_group: boolean;
  title: string | null;
  avatar_url: string | null;
  last_message_at: string;
  others: Profile[];
  lastMessage: Message | null;
  unread: number;
};

export async function getMyProfile(userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as Profile | null;
}

/** Everyone I can reach, optionally filtered by name, username or phone number. */
export async function searchProfiles(query: string, meId: string) {
  let q = supabase.from("profiles").select("*").neq("id", meId).limit(50);
  const term = query.trim();
  if (term) {
    const filters = [`username.ilike.%${term}%`, `display_name.ilike.%${term}%`];
    const phone = normalizePhone(term);
    if (phone) {
      filters.push(`phone_e164.ilike.%${phone.slice(1)}%`);
    }
    q = q.or(filters.join(","));
  }
  const [{ data }, blocked] = await Promise.all([q, listBlockRelations(meId)]);
  const hidden = new Set(blocked.map((b) => b.otherId));
  return ((data ?? []) as Profile[]).filter((p) => !hidden.has(p.id));
}

export type BlockRelation = { otherId: string; iBlockedThem: boolean };

export async function listBlockRelations(meId: string): Promise<BlockRelation[]> {
  const { data } = await supabase.from("blocked_contacts").select("blocker_id, blocked_id");
  return (data ?? []).map((r) => ({
    otherId: r.blocker_id === meId ? r.blocked_id : r.blocker_id,
    iBlockedThem: r.blocker_id === meId,
  }));
}

export async function blockUser(meId: string, otherId: string) {
  const { error } = await supabase
    .from("blocked_contacts")
    .insert({ blocker_id: meId, blocked_id: otherId });
  if (error) throw error;
}

export async function unblockUser(meId: string, otherId: string) {
  const { error } = await supabase
    .from("blocked_contacts")
    .delete()
    .eq("blocker_id", meId)
    .eq("blocked_id", otherId);
  if (error) throw error;
}

export async function listConversations(meId: string): Promise<ConversationSummary[]> {
  const { data: convos } = await supabase
    .from("conversations")
    .select("id, is_group, title, avatar_url, last_message_at")
    .order("last_message_at", { ascending: false });
  if (!convos?.length) return [];
  const ids = convos.map((c) => c.id);

  const { data: parts } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, last_read_at")
    .in("conversation_id", ids);

  const otherIds = [...new Set((parts ?? []).map((p) => p.user_id).filter((id) => id !== meId))];
  const { data: profiles } = otherIds.length
    ? await supabase.from("profiles").select("*").in("id", otherIds)
    : { data: [] as Profile[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  const { data: msgs } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false })
    .limit(500);

  return convos.map((c) => {
    const mine = (parts ?? []).find((p) => p.conversation_id === c.id && p.user_id === meId);
    const convoMsgs = (msgs ?? []).filter((m) => m.conversation_id === c.id) as Message[];
    const others = (parts ?? [])
      .filter((p) => p.conversation_id === c.id && p.user_id !== meId)
      .map((p) => profileMap.get(p.user_id))
      .filter(Boolean) as Profile[];
    const lastRead = mine ? new Date(mine.last_read_at).getTime() : 0;
    return {
      ...c,
      others,
      lastMessage: convoMsgs[0] ?? null,
      unread: convoMsgs.filter(
        (m) => m.sender_id !== meId && new Date(m.created_at).getTime() > lastRead,
      ).length,
    } as ConversationSummary;
  });
}

/** Finds an existing one-to-one chat with the given user, or creates one. */
export async function getOrCreateDirectChat(meId: string, otherId: string) {
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", meId);
  const myIds = (mine ?? []).map((r) => r.conversation_id);
  if (myIds.length) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherId)
      .in("conversation_id", myIds);
    const sharedIds = (shared ?? []).map((r) => r.conversation_id);
    if (sharedIds.length) {
      const { data: direct } = await supabase
        .from("conversations")
        .select("id")
        .eq("is_group", false)
        .in("id", sharedIds)
        .limit(1);
      if (direct?.length) return direct[0]!.id;
    }
  }
  const { data: convo, error } = await supabase
    .from("conversations")
    .insert({ is_group: false, created_by: meId })
    .select("id")
    .single();
  if (error || !convo) throw error ?? new Error("Could not start chat");
  const { error: pErr } = await supabase.from("conversation_participants").insert([
    { conversation_id: convo.id, user_id: meId, is_admin: true },
    { conversation_id: convo.id, user_id: otherId },
  ]);
  if (pErr) throw pErr;
  return convo.id;
}

export async function createGroupChat(meId: string, title: string, memberIds: string[]) {
  const { data: convo, error } = await supabase
    .from("conversations")
    .insert({ is_group: true, title, created_by: meId })
    .select("id")
    .single();
  if (error || !convo) throw error ?? new Error("Could not create group");
  const rows = [
    { conversation_id: convo.id, user_id: meId, is_admin: true },
    ...memberIds.map((id) => ({ conversation_id: convo.id, user_id: id })),
  ];
  const { error: pErr } = await supabase.from("conversation_participants").insert(rows);
  if (pErr) throw pErr;
  return convo.id;
}

export async function markRead(conversationId: string, meId: string) {
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", meId);
}

export async function touchPresence(meId: string) {
  await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", meId);
}

export function presenceLabel(lastSeen: string) {
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 70_000) return "online";
  const d = new Date(lastSeen);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? `last seen today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : `last seen ${d.toLocaleDateString()}`;
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
