import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

/** Turns a "bucket/path" reference into a temporary viewable URL. */
export async function signedUrl(ref: string | null | undefined): Promise<string | null> {
  if (!ref) return null;
  if (cache.has(ref)) return cache.get(ref)!;
  const slash = ref.indexOf("/");
  if (slash < 0) return null;
  const bucket = ref.slice(0, slash);
  const path = ref.slice(slash + 1);
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6);
  if (!data?.signedUrl) return null;
  cache.set(ref, data.signedUrl);
  return data.signedUrl;
}
