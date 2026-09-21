import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MoreVertical, Search } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { CatBrand } from "@/components/CatBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NewChatDialog } from "@/components/NewChatDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConversations } from "@/hooks/useConversations";
import { presenceLabel, timeLabel } from "@/lib/chat";

const FILTERS = ["All", "Unread", "Groups", "Direct"] as const;
type Filter = (typeof FILTERS)[number];

export function ChatList() {
  const { conversations, loading, meId } = useConversations();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { chatId?: string };
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === "Unread" && c.unread === 0) return false;
      if (filter === "Groups" && !c.is_group) return false;
      if (filter === "Direct" && c.is_group) return false;
      if (!q) return true;
      const name = c.is_group ? (c.title ?? "") : c.others.map((o) => o.display_name).join(" ");
      return name.toLowerCase().includes(q);
    });
  }, [conversations, filter, query]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <header className="bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 font-display text-lg font-bold">
            <CatBrand compact /> VIBER UG
          </h1>
          <div className="flex items-center gap-1">
            <ThemeToggle onPrimary />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/15"
                  aria-label="Open menu"
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/communities">Communities</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/status">Status</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/70" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="border-primary-foreground/20 bg-primary-foreground/15 pl-9 text-primary-foreground placeholder:text-primary-foreground/70"
          />
        </div>
      </header>

      <div className="flex gap-2 border-b px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading your chats…</p>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-display text-base font-semibold">Nothing here yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the pencil button to find anyone by name, username or phone number.
            </p>
          </div>
        ) : (
          <ul>
            {visible.map((c) => {
              const other = c.others[0];
              const title = c.is_group ? (c.title ?? "Group") : (other?.display_name ?? "Chat");
              const active = params.chatId === c.id;
              return (
                <li key={c.id}>
                  <Link
                    to="/chat/$chatId"
                    params={{ chatId: c.id }}
                    className={`flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent/40 ${
                      active ? "bg-accent/60" : ""
                    }`}
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

      <NewChatDialog
        meId={meId}
        onCreated={(id) => navigate({ to: "/chat/$chatId", params: { chatId: id } })}
      />
    </div>
  );
}
