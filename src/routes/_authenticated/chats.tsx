import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreVertical, Search, Settings, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { CatBrand } from "@/components/CatBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createGroupChat,
  getOrCreateDirectChat,
  listConversations,
  presenceLabel,
  searchProfiles,
  timeLabel,
  touchPresence,
  type ConversationSummary,
  type Profile,
} from "@/lib/chat";

export const Route = createFileRoute("/_authenticated/chats")({
  head: () => ({
    meta: [
      { title: "Your chats · VIBER UG" },
      { name: "description", content: "All your VIBER UG conversations in one place." },
      { property: "og:title", content: "Your chats · VIBER UG" },
      { property: "og:description", content: "All your VIBER UG conversations in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatsPage,
});

function ChatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [filter, setFilter] = useState("");
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
      .channel("chat-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void refresh();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      clearInterval(beat);
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.is_group ? (c.title ?? "") : c.others.map((o) => o.display_name).join(" "))
        .toLowerCase()
        .includes(q),
    );
  }, [conversations, filter]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col border-x bg-background">
      <header className="sticky top-0 z-10 border-b bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 font-display text-xl font-bold"><CatBrand compact /> VIBER UG</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle onPrimary />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/15" aria-label="Open menu">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings"><Settings /> Settings</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/70" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search chats"
            className="border-primary-foreground/20 bg-primary-foreground/15 pl-9 text-primary-foreground placeholder:text-primary-foreground/70"
          />
        </div>
      </header>

      <div className="flex-1">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading your chats…</p>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-display text-lg font-semibold">No conversations yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap the button below to start your first chat.
            </p>
          </div>
        ) : (
          <ul>
            {visible.map((c) => {
              const other = c.others[0];
              const title = c.is_group ? (c.title ?? "Group") : (other?.display_name ?? "Chat");
              return (
                <li key={c.id}>
                  <Link
                    to="/chat/$chatId"
                    params={{ chatId: c.id }}
                    className="flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <UserAvatar
                      name={title}
                      avatar={c.is_group ? c.avatar_url : other?.avatar_url}
                      online={!c.is_group && !!other && presenceLabel(other.last_seen) === "online"}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">{title}</span>
                        {c.lastMessage && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {timeLabel(c.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-muted-foreground">
                          {c.lastMessage
                            ? c.lastMessage.is_deleted
                              ? "This message was deleted"
                              : (c.lastMessage.content ?? "📷 Photo")
                            : "Say hello"}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <NewChatButton
        meId={user?.id ?? ""}
        onCreated={(id) => navigate({ to: "/chat/$chatId", params: { chatId: id } })}
      />
    </main>
  );
}

function NewChatButton({
  meId,
  onCreated,
}: {
  meId: string;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Profile[]>([]);
  const [groupMode, setGroupMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!open || !meId) return;
    const t = setTimeout(() => {
      void searchProfiles(query, meId).then(setPeople);
    }, 200);
    return () => clearTimeout(t);
  }, [open, query, meId]);

  async function startDirect(other: Profile) {
    try {
      const id = await getOrCreateDirectChat(meId, other.id);
      setOpen(false);
      onCreated(id);
    } catch {
      toast.error("Couldn't start that chat");
    }
  }

  async function startGroup() {
    if (!groupName.trim() || selected.length === 0) {
      toast.error("Add a group name and at least one person");
      return;
    }
    try {
      const id = await createGroupChat(meId, groupName.trim(), selected);
      setOpen(false);
      onCreated(id);
    } catch {
      toast.error("Couldn't create the group");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-lg shadow-lg sm:right-[calc(50%-20rem)]"
          aria-label="New chat"
        >
          <SquarePen />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{groupMode ? "New group" : "New chat"}</DialogTitle>
        </DialogHeader>
        {groupMode && (
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
          />
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name or username"
        />
        <ul className="max-h-72 overflow-y-auto">
          {people.map((p) => {
            const picked = selected.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() =>
                    groupMode
                      ? setSelected((s) =>
                          picked ? s.filter((i) => i !== p.id) : [...s, p.id],
                        )
                      : void startDirect(p)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent/50 ${
                    picked ? "bg-accent/60" : ""
                  }`}
                >
                  <UserAvatar name={p.display_name} avatar={p.avatar_url} size={38} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.display_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      @{p.username}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {people.length === 0 && (
            <li className="px-2 py-4 text-sm text-muted-foreground">No people found yet.</li>
          )}
        </ul>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setGroupMode(!groupMode);
              setSelected([]);
            }}
          >
            {groupMode ? "Single chat" : "Create a group"}
          </Button>
          {groupMode && (
            <Button className="flex-1" onClick={startGroup}>
              Create group
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
