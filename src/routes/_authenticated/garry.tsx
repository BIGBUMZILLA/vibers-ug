import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CatBrand } from "@/components/CatBrand";

export const Route = createFileRoute("/_authenticated/garry")({
  head: () => ({
    meta: [
      { title: "GARRY — VIBER UG assistant" },
      { name: "description", content: "GARRY is the VIBER UG cat assistant that helps you write and plan." },
      { property: "og:title", content: "GARRY — VIBER UG assistant" },
      { property: "og:description", content: "Chat with GARRY, the VIBER UG cat assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell pane="detail">
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <CatBrand />
        <h1 className="font-display text-2xl font-bold text-primary">GARRY</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your cat assistant is warming up. Soon he'll help you draft messages, summarise chats and
          translate on the fly.
        </p>
      </div>
    </AppShell>
  ),
});
