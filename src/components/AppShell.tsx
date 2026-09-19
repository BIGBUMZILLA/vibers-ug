import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CircleDashed, MessageCircle, Radio, Settings, Users } from "lucide-react";
import { ChatList } from "@/components/ChatList";
import { CatBrand } from "@/components/CatBrand";

const NAV = [
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/status", label: "Status", icon: CircleDashed },
  { to: "/channels", label: "Channels", icon: Radio },
  { to: "/communities", label: "Communities", icon: Users },
] as const;

function Rail({ vertical }: { vertical: boolean }) {
  const base = vertical
    ? "hidden md:flex w-16 shrink-0 flex-col items-center gap-2 border-r bg-card py-4"
    : "flex md:hidden items-center justify-around border-t bg-card py-2";
  return (
    <nav className={base} aria-label="Main navigation">
      {vertical && (
        <Link to="/chats" className="mb-3" aria-label="VIBER UG home">
          <CatBrand compact />
        </Link>
      )}
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          aria-label={label}
          className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          activeProps={{ className: "bg-accent text-primary" }}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px]">{label}</span>
        </Link>
      ))}
      <Link
        to="/garry"
        aria-label="GARRY assistant"
        className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        activeProps={{ className: "bg-accent text-primary" }}
      >
        <CatBrand compact />
        <span className="text-[10px]">GARRY</span>
      </Link>
      {vertical && <div className="flex-1" />}
      <Link
        to="/settings"
        aria-label="Settings"
        className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        activeProps={{ className: "bg-accent text-primary" }}
      >
        <Settings className="h-5 w-5" />
        <span className="text-[10px]">Settings</span>
      </Link>
    </nav>
  );
}

/**
 * WhatsApp-style shell: icon rail, conversation list, and the open pane.
 * `pane` decides which column is visible on small screens.
 */
export function AppShell({ children, pane }: { children: ReactNode; pane: "list" | "detail" }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Rail vertical />
      <div
        className={`${pane === "list" ? "flex" : "hidden"} min-h-0 w-full flex-col border-r md:flex md:w-[360px] md:shrink-0`}
      >
        <div className="min-h-0 flex-1">
          <ChatList />
        </div>
        <Rail vertical={false} />
      </div>
      <main
        className={`${pane === "detail" ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col md:flex`}
      >
        {children}
      </main>
    </div>
  );
}
