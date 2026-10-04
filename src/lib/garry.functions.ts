import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const askGarry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).max(30) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error("Garry is unavailable right now. Please try later.");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-6-astra", messages: [{ role: "system", content: "You are Garry, the friendly cat assistant of VIBER UG 256, an urban Kampala messenger. Use modern, natural Kampala English, never village Luganda or stereotyped slang. Help write messages, plan and explain things. Be concise, under 200 words unless more is requested. Never pretend you sent messages or changed app settings." }, ...data.messages] }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? `Garry couldn't respond (${response.status}). Please try later.`);
    }
    const result = await response.json();
    const text = result.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("Garry returned an empty response. Please try again.");
    return text;
  });
