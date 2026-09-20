import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/_authenticated/communities")({
  head: () => ({
    meta: [
      { title: "Communities — VIBER UG" },
      { name: "description", content: "Bring related groups together in a VIBER UG community." },
      { property: "og:title", content: "Communities — VIBER UG" },
      { property: "og:description", content: "Bring related groups together in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell pane="detail">
      <Placeholder
        icon={Users}
        title="Communities"
        body="Group your chats into a community here soon."
      />
    </AppShell>
  ),
});
