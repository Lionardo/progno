import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminSupabaseClient() {
  const { secretKey, url } = getSupabaseServiceEnv();

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

