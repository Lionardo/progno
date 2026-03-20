"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function getBrowserSupabaseClient(url: string, publicKey: string) {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, publicKey);
  }

  return browserClient;
}

