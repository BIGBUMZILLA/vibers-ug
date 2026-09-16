import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CatBrand } from "@/components/CatBrand";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to VIBER UG" },
      { name: "description", content: "Sign in or create your VIBER UG account to start chatting." },
      { property: "og:title", content: "Sign in to VIBER UG" },
      { property: "og:description", content: "Create an account or sign in to start chatting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-8">
      <Doodles />
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-4 font-display text-3xl font-bold text-primary">
            VIBER UG
          </Link>
          <CatBrand />
          <h1 className="mt-5 font-display text-2xl font-bold text-foreground">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "A name, an email and you're chatting."
              : "Sign in to pick up your conversations."}
          </p>
        </div>

        {sent ? (
          <div className="mt-8 rounded-lg border bg-card p-5 text-sm text-card-foreground shadow-sm">
            Check your inbox — we sent a confirmation link to <strong>{email}</strong>. Open it to
            finish creating your account.
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Your name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Doe"
                    autoComplete="name"
                    className="h-12"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
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
                  className="h-12"
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full text-base font-semibold shadow-md shadow-primary/25"
                disabled={busy}
              >
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full border-2 border-primary text-base font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "I already have an account" : "Create an account"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or continue with
              <span className="h-px flex-1 bg-border" />
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
                  className="flex h-12 items-center justify-center gap-2 rounded-md border bg-card text-lg text-card-foreground transition-colors hover:bg-accent"
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
      className="pointer-events-none absolute inset-0 h-full w-full text-muted-foreground/20"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="31" cy="87" r="7" />
      <path d="M349 42c5-7 13-2 9 4-2 4-9 6-9 6s-7-2-9-6c-4-6 4-11 9-4z" />
      <path d="M53 247l7-11 7 11z" />
      <path d="M369 193h14v10h-9l-5 4z" />
      <path d="M23 681c7-8 17-8 24 0" />
      <circle cx="373" cy="729" r="5" />
      <path d="M371 727h4M371 731h4" />
      <path d="M91 151h16M91 155h9" />
      <path d="M298 673c4-5 10-5 14 0" />
      <circle cx="223" cy="22" r="2" />
      <circle cx="331" cy="469" r="3" />
      <circle cx="46" cy="516" r="2" />
      <path d="M113 594l4 4-4 4-4-4z" />
      <path d="M278 126l3 3-3 3-3-3z" />
      <path d="M18 395h10m-5-5v10" />
      <path d="M382 563h9m-4.5-4.5v9" />
      <circle cx="153" cy="747" r="3" />
    </svg>
  );
}

