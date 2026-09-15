import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Rouge" },
      { name: "description", content: "Sign in or create your Rouge account to start chatting." },
      { property: "og:title", content: "Sign in to Rouge" },
      { property: "og:description", content: "Create an account or sign in to start chatting." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/chats", replace: true });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/chats", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple" | "microsoft") {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("That sign-in didn't work. Try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/chats", replace: true });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10">
      <Doodles />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="cat-badge flex h-28 w-28 items-center justify-center rounded-full bg-primary shadow-xl">
            <span className="cat-wiggle text-6xl" role="img" aria-label="Orange cat">
              🐱
            </span>
          </div>
          <Link to="/" className="mt-5 font-display text-3xl font-bold text-primary">
            Rouge
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-neutral-900">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {mode === "signup"
              ? "A name, an email and you're chatting."
              : "Sign in to pick up your conversations."}
          </p>
        </div>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
            Check your inbox — we sent a confirmation link to <strong>{email}</strong>. Open it to
            finish creating your account.
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-700">
                    Your name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Doe"
                    autoComplete="name"
                    className="h-12 rounded-xl border-neutral-200 bg-white text-neutral-900"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-12 rounded-xl border-neutral-200 bg-white text-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="h-12 rounded-xl border-neutral-200 bg-white text-neutral-900"
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/25"
                disabled={busy}
              >
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-xl border-2 border-primary text-base font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "I already have an account" : "Create an account"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200" /> or continue with
              <span className="h-px flex-1 bg-neutral-200" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["google", "Google", "G"],
                  ["apple", "Apple", ""],
                  ["microsoft", "Microsoft", "⊞"],
                ] as const
              ).map(([provider, label, glyph]) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => void handleOAuth(provider)}
                  aria-label={`Continue with ${label}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-lg text-neutral-800 transition-colors hover:bg-neutral-50"
                >
                  <span aria-hidden>{glyph}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Doodles() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-neutral-200"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="48" cy="70" r="22" />
      <path d="M330 60c14-18 34-6 24 10-6 10-24 16-24 16s-18-6-24-16c-10-16 10-28 24-10z" />
      <path d="M40 300l18-30 18 30z" />
      <path d="M340 250h44v34h-30l-14 12z" />
      <path d="M60 620c20-24 50-24 70 0" />
      <circle cx="356" cy="640" r="16" />
      <path d="M350 636h12M350 646h12" />
      <path d="M120 120h50M120 132h30" />
      <path d="M250 720c10-14 28-14 38 0" />
      <circle cx="200" cy="40" r="6" />
      <circle cx="300" cy="430" r="8" />
      <circle cx="70" cy="470" r="5" />
      <path d="M150 560l10 10-10 10-10-10z" />
      <path d="M270 160l8 8-8 8-8-8z" />
    </svg>
  );
}

