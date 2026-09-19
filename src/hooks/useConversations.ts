import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { listConversations, touchPresence, type ConversationSummary } from "@/lib/chat";

/** One shared live feed of the signed-in user's conversations. */
export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setConversations(await listConversations(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    void touchPresence(user.id);
    const beat = setInterval(() => void touchPresence(user.id), 45_000);
    const channel = supabase
      .channel(`shell-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () =>
        void refresh(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () =>
        void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        () => void refresh(),
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () =>
        void refresh(),
      )
      .subscribe();
    return () => {
      clearInterval(beat);
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return { conversations, loading, refresh, meId: user?.id ?? "" };
}
