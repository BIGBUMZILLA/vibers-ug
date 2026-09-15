import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Send, Smile, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { SignedImage } from "@/components/SignedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  markRead,
  presenceLabel,
  timeLabel,
  touchPresence,
  type Message,
  type Profile,
} from "@/lib/chat";

const QUICK_EMOJI = ["😀", "😂", "❤️", "🔥", "👍", "🎉", "😮", "😢", "🙏", "👏", "😍", "🤝"];
const REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🙏"];

export const Route = createFileRoute("/_authenticated/chat/$chatId")({
  head: () => ({
    meta: [
      { title: "Conversation · Rouge" },
      { name: "description", content: "Chat in real time and share photos on Rouge." },
      { property: "og:title", content: "Conversation · Rouge" },
      { property: "og:description", content: "Chat in real time and share photos on Rouge." },
    ],
  }),
  component: ChatRoom,
});

type Reaction = { message_id: string; user_id: string; emoji: string };

function ChatRoom() {
  const { chatId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [convo, setConvo] = useState<{
    is_group: boolean;
    title: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: c }, { data: parts }, { data: msgs }] = await Promise.all([
      supabase
        .from("conversations")
        .select("is_group, title, avatar_url")
        .eq("id", chatId)
        .maybeSingle(),
      supabase.from("conversation_participants").select("user_id").eq("conversation_id", chatId),
      supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", chatId)
        .order("created_at", { ascending: true }),
    ]);
    if (!c) {
      navigate({ to: "/chats", replace: true });
      return;
    }
    setConvo(c);
    setMessages((msgs ?? []) as Message[]);
    const ids = (parts ?? []).map((p) => p.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
      setPeople((profs ?? []) as Profile[]);
    }
    const msgIds = (msgs ?? []).map((m) => m.id);
    if (msgIds.length) {
      const { data: rx } = await supabase
        .from("message_reactions")
        .select("message_id, user_id, emoji")
        .in("message_id", msgIds);
      setReactions((rx ?? []) as Reaction[]);
    }
    void markRead(chatId, user.id);
  }, [chatId, user, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    void touchPresence(user.id);
    const beat = setInterval(() => void touchPresence(user.id), 45_000);
    const channel = supabase
      .channel(`room-${chatId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${chatId}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => void load(),
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () =>
        void load(),
      )
      .subscribe();
    return () => {
      clearInterval(beat);
      supabase.removeChannel(channel);
    };
  }, [chatId, user, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const others = people.filter((p) => p.id !== user?.id);
  const other = others[0];
  const title = convo?.is_group ? (convo.title ?? "Group") : (other?.display_name ?? "Chat");
  const subtitle = convo?.is_group
    ? people.map((p) => p.display_name.split(" ")[0]).join(", ")
    : other
      ? presenceLabel(other.last_seen)
      : "";

  async function send() {
    const text = draft.trim();
    if (!text || !user) return;
    setDraft("");
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: chatId, sender_id: user.id, content: text });
    setSending(false);
    if (error) toast.error("Message didn't send");
  }

  async function sendPhoto(file: File) {
    if (!user) return;
    const path = `${chatId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "")}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file);
    if (error) {
      toast.error("Couldn't upload that photo");
      return;
    }
    await supabase.from("messages").insert({
      conversation_id: chatId,
      sender_id: user.id,
      image_url: `chat-media/${path}`,
    });
  }

  async function react(messageId: string, emoji: string) {
    if (!user) return;
    const existing = reactions.find(
      (r) => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji,
    );
    if (existing) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("message_reactions")
        .insert({ message_id: messageId, user_id: user.id, emoji });
    }
  }

  async function removeMessage(id: string) {
    await supabase.from("messages").update({ is_deleted: true, content: null }).eq("id", id);
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col bg-background">
      <header className="flex items-center gap-3 bg-primary px-3 py-2.5 text-primary-foreground">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-white/15"
        >
          <Link to="/chats" aria-label="Back to chats">
            <ArrowLeft />
          </Link>
        </Button>
        <UserAvatar
          name={title}
          avatar={convo?.is_group ? convo.avatar_url : other?.avatar_url}
          size={40}
        />
        <div className="min-w-0">
          <p className="truncate font-display font-semibold leading-tight">{title}</p>
          <p className="truncate text-xs text-primary-foreground/80">{subtitle}</p>
        </div>
      </header>

      <div className="chat-wallpaper flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <p className="mx-auto w-fit rounded-full bg-card px-4 py-2 text-xs text-muted-foreground">
            No messages yet — say hello 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          const sender = people.find((p) => p.id === m.sender_id);
          const mine_reactions = reactions.filter((r) => r.message_id === m.id);
          return (
            <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                <div
                  className={`rounded-2xl px-3 py-2 shadow-sm ${
                    mine
                      ? "rounded-br-md bg-bubble-out text-bubble-out-foreground"
                      : "rounded-bl-md bg-bubble-in text-bubble-in-foreground"
                  }`}
                >
                  {convo?.is_group && !mine && (
                    <p className="mb-0.5 text-xs font-semibold text-primary">
                      {sender?.display_name ?? "Someone"}
                    </p>
                  )}
                  {m.is_deleted ? (
                    <p className="text-sm italic opacity-70">This message was deleted</p>
                  ) : (
                    <>
                      {m.image_url && (
                        <SignedImage
                          reference={m.image_url}
                          alt="Shared photo"
                          className="mb-1 max-h-72 w-full rounded-xl object-cover"
                        />
                      )}
                      {m.content && <p className="whitespace-pre-wrap text-sm">{m.content}</p>}
                    </>
                  )}
                  <p className="mt-1 text-right text-[10px] opacity-70">{timeLabel(m.created_at)}</p>
                </div>

                <div
                  className={`mt-1 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}
                >
                  {mine_reactions.length > 0 && (
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs shadow-sm">
                      {[...new Set(mine_reactions.map((r) => r.emoji))].join(" ")}{" "}
                      {mine_reactions.length}
                    </span>
                  )}
                  <span className="hidden gap-0.5 group-hover:flex">
                    {REACTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="rounded-full px-1 text-sm hover:bg-accent"
                        onClick={() => void react(m.id, e)}
                        aria-label={`React ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                    {mine && !m.is_deleted && (
                      <button
                        type="button"
                        onClick={() => void removeMessage(m.id)}
                        aria-label="Delete message"
                        className="rounded-full px-1 text-muted-foreground hover:bg-accent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {emojiOpen && (
        <div className="flex flex-wrap gap-1 border-t bg-card px-3 py-2">
          {QUICK_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              className="rounded-lg px-2 py-1 text-xl hover:bg-accent"
              onClick={() => setDraft((d) => d + e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2 border-t bg-card px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setEmojiOpen((o) => !o)}
          aria-label="Emoji"
        >
          <Smile />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          aria-label="Send a photo"
        >
          <ImagePlus />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void sendPhoto(f);
            e.target.value = "";
          }}
        />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          className="flex-1 rounded-full"
        />
        <Button type="submit" size="icon" className="rounded-full" disabled={sending} aria-label="Send">
          <Send />
        </Button>
      </form>
    </main>
  );
}
