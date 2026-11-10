import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  let key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-anon-key";

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://placeholder.supabase.co";
  }

  return createBrowserClient(url, key);
}
