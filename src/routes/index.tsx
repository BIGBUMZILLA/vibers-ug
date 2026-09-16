import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageCircleHeart, Images, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CatBrand } from "@/components/CatBrand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VIBER UG — messaging in red" },
      {
        name: "description",
        content:
          "VIBER UG is a private real-time messenger for one-to-one chats, groups and photo sharing in red.",
      },
      { property: "og:title", content: "VIBER UG — messaging in red" },
      {
        property: "og:description",
        content: "Chat, create groups and share photos in real time. Light or dark, always red.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/chats", replace: true });
  }, [loading, session, navigate]);

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-3 font-display text-xl font-bold text-primary"><CatBrand compact /> VIBER UG</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          VIBER UG messaging feels <span className="text-primary">alive</span>.
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
