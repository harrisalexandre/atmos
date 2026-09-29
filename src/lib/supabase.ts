import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfig = {
  url,
  key,
  configured: Boolean(url && key),
};

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseConfig.configured) return null;

  return createClient(url!, key!, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
}
