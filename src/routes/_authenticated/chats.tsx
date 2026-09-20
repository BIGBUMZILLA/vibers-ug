import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CatBrand } from "@/components/CatBrand";

export const Route = createFileRoute("/_authenticated/chats")({
  head: () => ({
    meta: [
      { title: "Your chats · VIBER UG" },
      { name: "description", content: "All your VIBER UG conversations in one place." },
      { property: "og:title", content: "Your chats · VIBER UG" },
      { property: "og:description", content: "All your VIBER UG conversations in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatsPage,
});

function ChatsPage() {
  return (
    <AppShell pane="list">
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <CatBrand />
        <h1 className="font-display text-2xl font-bold text-primary">VIBER UG</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Pick a conversation on the left, or start a new one to message anyone by name, username or
          phone number.
        </p>
      </div>
    </AppShell>
  );
}
