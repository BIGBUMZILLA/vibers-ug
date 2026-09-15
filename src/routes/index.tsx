import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageCircleHeart, Images, Users, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rouge — private messaging in red" },
      {
        name: "description",
        content:
          "Rouge is a fast, private messenger for one-to-one chats, groups and photo sharing, in bold red light or dark mode.",
      },
      { property: "og:title", content: "Rouge — private messaging in red" },
      {
        property: "og:description",
        content: "Chat, create groups and share photos in real time. Light or dark, always red.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/chats", replace: true });
  }, [loading, session, navigate]);

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl font-bold tracking-tight text-primary">Rouge</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Switch theme">
            <Moon className={theme === "dark" ? "text-primary" : ""} />
          </Button>
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Messaging that feels <span className="text-primary">alive</span>, in red.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Real-time one-to-one chats, groups, photo sharing, reactions, read receipts and
          last-seen — with a light or dark theme you choose.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Create your account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">I already have one</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {[
            { icon: MessageCircleHeart, title: "Instant chats", body: "Messages land the moment they're sent, with typing and read ticks." },
            { icon: Users, title: "Groups", body: "Gather friends or a team in one conversation." },
            { icon: Images, title: "Photos", body: "Share pictures straight into any conversation." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card p-6">
              <Icon className="text-primary" />
              <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
