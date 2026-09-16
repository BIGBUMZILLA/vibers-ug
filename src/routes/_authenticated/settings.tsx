import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleHelp,
  Database,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  Moon,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · VIBER UG" },
      { name: "description", content: "Manage your VIBER UG profile, appearance, privacy, and chat preferences." },
      { property: "og:title", content: "Settings · VIBER UG" },
      { property: "og:description", content: "Manage your VIBER UG preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const pendingSections = [
  { icon: LockKeyhole, title: "Privacy", detail: "Last seen, read receipts and blocked contacts" },
  { icon: Bell, title: "Notifications", detail: "Message, group and sound preferences" },
  { icon: MessageSquareText, title: "Chats", detail: "Wallpaper, history and conversation settings" },
  { icon: Database, title: "Storage and data", detail: "Media quality and storage usage" },
  { icon: CircleHelp, title: "Help", detail: "Support, terms and app information" },
];

function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-3 py-3 text-primary-foreground">
        <Button asChild variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/15">
          <Link to="/chats" aria-label="Back to chats"><ArrowLeft /></Link>
        </Button>
        <h1 className="font-display text-lg font-semibold">Settings</h1>
      </header>

      <section className="border-b p-4">
        <Button asChild variant="ghost" className="h-auto w-full justify-start gap-4 px-2 py-3">
          <Link to="/profile">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground"><UserRound /></span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block font-semibold">Your profile</span>
              <span className="block truncate text-sm text-muted-foreground">Photo, name, username and status</span>
            </span>
            <ChevronRight className="text-muted-foreground" />
          </Link>
        </Button>
      </section>

      <section className="border-b p-4">
        <div className="flex items-center gap-4 px-2 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><Moon /></span>
          <label htmlFor="dark-mode" className="min-w-0 flex-1 cursor-pointer">
            <span className="block font-medium">Dark mode</span>
            <span className="block text-sm text-muted-foreground">Use this appearance on every page</span>
          </label>
          <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </section>

      <section className="divide-y">
        {pendingSections.map(({ icon: Icon, title, detail }) => (
          <div key={title} className="flex items-center gap-4 px-6 py-4">
            <Icon className="text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{title}</p>
              <p className="truncate text-sm text-muted-foreground">{detail}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </section>

      <div className="p-6">
        <Button variant="outline" className="w-full text-destructive" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
        <p className="mt-8 text-center font-display text-sm font-semibold text-primary">VIBER UG</p>
      </div>
    </main>
  );
}