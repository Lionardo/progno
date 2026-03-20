"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { emailPasswordSchema } from "@/lib/schemas";

export interface AuthActionState {
  error?: string;
  message?: string;
}

export async function loginWithPassword(
  _previousState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const validated = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const nextPath = String(formData.get("next") ?? "/");

  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message ?? "Enter a valid email and password.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    return { error: error.message };
  }

  redirect(nextPath);
}

export async function signUpWithPassword(
  _previousState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const validated = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const nextPath = String(formData.get("next") ?? "/");

  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message ?? "Enter a valid email and password.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp(validated.data);

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect(nextPath);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword(
    validated.data,
  );

  if (!signInError) {
    redirect(nextPath);
  }

  return {
    message: "Account created. Sign in with your email and password.",
  };
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();
  redirect("/");
}
