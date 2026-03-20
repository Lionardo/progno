import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function isAdminUser(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return data?.role === "admin";
}

export async function getViewer() {
  const user = await getCurrentUser();

  if (!user) {
    return { isAdmin: false, user: null };
  }

  return {
    isAdmin: await isAdminUser(user.id),
    user,
  };
}

export function buildLoginRedirect(nextPath?: string) {
  const target = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";

  return `/login${target}`;
}

export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(buildLoginRedirect(nextPath));
  }

  return user;
}

export async function requireAdmin(nextPath = "/admin/initiatives") {
  const user = await requireUser(nextPath);

  if (!(await isAdminUser(user.id))) {
    redirect("/");
  }

  return user;
}

