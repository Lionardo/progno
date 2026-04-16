"use client";

import { useState, useTransition } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

interface GoogleAuthButtonProps {
  appBaseUrl: string;
  nextPath: string;
  publicKey: string;
  supabaseUrl: string;
}

export function GoogleAuthButton({
  appBaseUrl,
  nextPath,
  publicKey,
  supabaseUrl,
}: GoogleAuthButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGoogleLogin() {
    startTransition(async () => {
      setError(null);

      const callbackUrl = new URL("/auth/callback", appBaseUrl);
      callbackUrl.searchParams.set("next", nextPath);

      const supabase = getBrowserSupabaseClient(supabaseUrl, publicKey);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        options: {
          redirectTo: callbackUrl.toString(),
        },
        provider: "google",
      });

      if (authError) {
        setError(authError.message);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
          Google auth
        </div>
        <h2 className="font-serif text-3xl text-[color:var(--color-ink)]">
          Continue with Google
        </h2>
        <p className="text-sm text-[color:var(--color-muted)]">
          Use Google provider for the fastest path into the market.
        </p>
      </div>

      <button
        className="w-full rounded-full border border-[color:var(--color-border-strong)] px-5 py-3 text-sm font-medium text-[color:var(--color-ink)] transition hover:border-[color:var(--color-gold)] hover:bg-white/[0.04] disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        onClick={handleGoogleLogin}
        type="button"
      >
        {pending ? "Redirecting..." : "Sign in with Google"}
      </button>

      {error ? (
        <p className="rounded-2xl border border-[#ef6b6b]/30 bg-[#ef6b6b]/8 px-4 py-3 text-sm text-[#ffb8b8]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
