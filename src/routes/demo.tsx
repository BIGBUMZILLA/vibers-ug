import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CloudOff, Send, Trash2 } from "lucide-react";
import { CatBrand } from "@/components/CatBrand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo mode · VIBER UG 256" },
      { name: "description", content: "Try VIBER UG 256 offline with the Garry demo account." },
      { property: "og:title", content: "Demo mode · VIBER UG 256" },
      { property: "og:description", content: "Try the Kampala messenger without an account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Demo,
});

type Msg = { id: string; me: boolean; text: string; at: number };
const KEY = "viber-ug-demo-chat";
const REPLIES = ["Sure thing, boss 😎", "Let's link up at Acacia later?", "Kampala traffic is mad today 🚗", "Haha, say less!", "Sending it now ✓"];

function Demo() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    try { setMsgs(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { setMsgs([]); }
  }, []);
  const persist = (m: Msg[]) => { setMsgs(m); localStorage.setItem(KEY, JSON.stringify(m)); };
  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const next = [...msgs, { id: crypto.randomUUID(), me: true, text, at: Date.now() }];
    persist(next);
    setTimeout(() => persist([...next, { id: crypto.randomUUID(), me: false, text: REPLIES[next.length % REPLIES.length]!, at: Date.now() }]), 900);
  }
  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col border-x bg-background">
      <header className="flex items-center gap-3 border-b bg-card px-3 py-2.5">
        <Button asChild variant="ghost" size="icon"><Link to="/auth" aria-label="Back"><ArrowLeft /></Link></Button>
        <CatBrand compact />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold">Garry (demo)</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><CloudOff className="h-3 w-3" /> Saved on this device only</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Clear demo chat" onClick={() => persist([])}><Trash2 /></Button>
      </header>
      <div className="chat-wallpaper flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {msgs.length === 0 && <p className="mx-auto w-fit rounded-full bg-card px-4 py-2 text-xs text-muted-foreground">Demo chat — create a real account to message real people.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.me ? "bg-bubble-out text-bubble-out-foreground" : "bg-bubble-in text-bubble-in-foreground"}`}>
              {m.text}
              <span className="ml-2 text-[10px] opacity-70">{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{m.me && " ✓✓"}</span>
            </div>
          </div>
        ))}
      </div>
      <form className="flex gap-2 border-t bg-card p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message" className="rounded-full" />
        <Button type="submit" size="icon" className="rounded-full" aria-label="Send"><Send /></Button>
      </form>
    </main>
  );
}
