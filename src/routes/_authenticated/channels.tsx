import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/_authenticated/channels")({
  head: () => ({
    meta: [
      { title: "Channels — VIBER UG" },
      { name: "description", content: "Follow broadcast channels inside VIBER UG." },
      { property: "og:title", content: "Channels — VIBER UG" },
      { property: "og:description", content: "Follow broadcast channels inside VIBER UG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell pane="detail">
      <Placeholder
        icon={Radio}
        title="Channels"
        body="One-way broadcast channels are on the way."
      />
    </AppShell>
  ),
});
