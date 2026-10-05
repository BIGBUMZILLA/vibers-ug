import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, LogOut, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { listBlockRelations, unblockUser } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · VIBER UG 256" },
      { name: "description", content: "Theme, privacy, notifications, chats, storage and help for VIBER UG 256." },
      { property: "og:title", content: "Settings · VIBER UG 256" },
      { property: "og:description", content: "Manage your VIBER UG 256 preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

type Settings = {
  last_seen_visible: boolean;
  read_receipts: boolean;
  message_notifications: boolean;
  group_notifications: boolean;
  notification_sound: boolean;
  notification_preview: boolean;
  enter_is_send: boolean;
  chat_wallpaper: string;
  font_size: string;
  media_auto_download: boolean;
  media_quality: string;
};
const DEFAULTS: Settings = {
  last_seen_visible: true, read_receipts: true, message_notifications: true, group_notifications: true,
  notification_sound: true, notification_preview: true, enter_is_send: true, chat_wallpaper: "doodles",
  font_size: "medium", media_auto_download: true, media_quality: "standard",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b px-4 py-4">
      <h2 className="mb-2 px-2 font-display text-xs font-bold uppercase tracking-widest text-primary">{title}</h2>
      {children}
    </section>
  );
}
function Toggle({ id, label, detail, checked, onChange }: { id: string; label: string; detail?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-4 px-2 py-2.5">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block font-medium">{label}</span>
        {detail && <span className="block text-sm text-muted-foreground">{detail}</span>}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-2 py-2.5">
      <span className="flex-1 font-medium">{label}</span>
      {options.map((o) => (
        <Button key={o} size="sm" variant={value === o ? "default" : "outline"} className="rounded-full capitalize" onClick={() => onChange(o)}>
          {o}
        </Button>
      ))}
    </div>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggle, doodles, toggleDoodles } = useTheme();
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    void supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setS({ ...DEFAULTS, ...(data as Partial<Settings>) });
    });
    void listBlockRelations(user.id).then((rows) =>
      setBlocked(rows.filter((r) => r.blocker_id === user.id).map((r) => r.blocked_id)),
    ).catch(() => {});
  }, [user]);

  async function save<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!user) return;
    setS((prev) => ({ ...prev, [key]: value }));
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, [key]: value, updated_at: new Date().toISOString() });
    if (error) toast.error("Couldn't save that setting");
  }

  async function clearChats() {
    if (!confirm("Clear the history of all your chats? Others keep their copy.")) return;
    const { error } = await supabase.rpc("clear_my_chats");
    if (error) toast.error("Couldn't clear chats");
    else toast.success("All chats cleared");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-card px-3 py-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/chats" aria-label="Back to chats"><ArrowLeft /></Link>
        </Button>
        <h1 className="font-display text-lg font-bold">Settings</h1>
      </header>

      <section className="border-b p-4">
        <Button asChild variant="ghost" className="h-auto w-full justify-start gap-4 px-2 py-3">
          <Link to="/profile">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><UserRound /></span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block font-semibold">Your profile <span className="text-xs text-primary">✔ Urban Verified</span></span>
              <span className="block truncate text-sm text-muted-foreground">Photo, name, username and about</span>
            </span>
            <ChevronRight className="text-muted-foreground" />
          </Link>
        </Button>
      </section>

      <Section title="Appearance">
        <Toggle id="dark" label="Dark mode" detail="Stays on across every page" checked={theme === "dark"} onChange={toggle} />
        <Toggle id="doodles" label="Background doodles" checked={doodles} onChange={toggleDoodles} />
      </Section>

      <Section title="Privacy">
        <Toggle id="ls" label="Show last seen" checked={s.last_seen_visible} onChange={(v) => void save("last_seen_visible", v)} />
        <Toggle id="rr" label="Read receipts" detail="Blue-style ticks when you read messages" checked={s.read_receipts} onChange={(v) => void save("read_receipts", v)} />
        <div className="px-2 py-2.5">
          <p className="font-medium">Blocked contacts</p>
          {blocked.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody blocked.</p>
          ) : (
            blocked.map((id) => (
              <div key={id} className="mt-2 flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">{id.slice(0, 8)}…</span>
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!user) return;
                  await unblockUser(user.id, id);
                  setBlocked((b) => b.filter((x) => x !== id));
                }}>Unblock</Button>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title="Notifications">
        <Toggle id="mn" label="Message notifications" checked={s.message_notifications} onChange={(v) => void save("message_notifications", v)} />
        <Toggle id="gn" label="Group notifications" checked={s.group_notifications} onChange={(v) => void save("group_notifications", v)} />
        <Toggle id="ns" label="Sounds" checked={s.notification_sound} onChange={(v) => void save("notification_sound", v)} />
        <Toggle id="np" label="Show preview" checked={s.notification_preview} onChange={(v) => void save("notification_preview", v)} />
      </Section>

      <Section title="Chats">
        <Toggle id="es" label="Enter is send" checked={s.enter_is_send} onChange={(v) => void save("enter_is_send", v)} />
        <Choice label="Wallpaper" value={s.chat_wallpaper} options={["doodles", "plain", "dots"]} onChange={(v) => void save("chat_wallpaper", v)} />
        <Choice label="Font size" value={s.font_size} options={["small", "medium", "large"]} onChange={(v) => void save("font_size", v)} />
        <Button variant="outline" className="mx-2 mt-2 text-destructive" onClick={clearChats}><Trash2 /> Clear all chats</Button>
      </Section>

      <Section title="Storage and data">
        <Toggle id="ad" label="Auto-download media" checked={s.media_auto_download} onChange={(v) => void save("media_auto_download", v)} />
        <Choice label="Upload quality" value={s.media_quality} options={["standard", "hd"]} onChange={(v) => void save("media_quality", v)} />
      </Section>

      <Section title="Help">
        <div className="space-y-1 px-2 text-sm text-muted-foreground">
          <p>Need a hand? Ask GARRY AI with the button at the bottom corner.</p>
          <p>Be respectful — no spam, scams or harassment. Accounts that break the rules get removed.</p>
          <p>VIBER UG 256 · Made in Kampala</p>
        </div>
      </Section>

      <div className="p-6">
        <Button variant="outline" className="w-full text-destructive" onClick={signOut}><LogOut /> Log out</Button>
      </div>
    </main>
  );
}
