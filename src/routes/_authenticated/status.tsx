import { createFileRoute } from "@tanstack/react-router";
import { CircleDashed } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/_authenticated/status")({
  head: () => ({
    meta: [
      { title: "Status — VIBER UG" },
      { name: "description", content: "Share 24-hour status updates with your VIBER UG contacts." },
      { property: "og:title", content: "Status — VIBER UG" },
      { property: "og:description", content: "Share 24-hour status updates with your contacts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell pane="detail">
      <Placeholder
        icon={CircleDashed}
        title="Status"
        body="Disappearing photo and text updates land here soon."
      />
    </AppShell>
  ),
});
