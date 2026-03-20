"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthActionState } from "@/app/actions/auth";

interface PasswordAuthFormProps {
  action: (
    previousState: AuthActionState | undefined,
    formData: FormData,
  ) => Promise<AuthActionState>;
  buttonLabel: string;
  description: string;
  nextPath: string;
  title: string;
}

function AuthButton({ buttonLabel }: Pick<PasswordAuthFormProps, "buttonLabel">) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-[color:var(--color-mint)] px-5 py-3 text-sm font-medium text-[color:var(--color-obsidian)] transition hover:bg-[color:var(--color-gold)] disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Working..." : buttonLabel}
    </button>
  );
}

export function PasswordAuthForm({
  action,
  buttonLabel,
  description,
  nextPath,
  title,
}: PasswordAuthFormProps) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6"
    >
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
          Password auth
        </div>
        <h2 className="font-serif text-3xl text-[color:var(--color-ink)]">
          {title}
        </h2>
        <p className="text-sm text-[color:var(--color-muted)]">{description}</p>
      </div>

      <input name="next" type="hidden" value={nextPath} />

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--color-ink)]">Email</span>
        <input
          className="w-full rounded-2xl border border-white/8 bg-[color:rgba(9,15,23,0.72)] px-4 py-3 text-[color:var(--color-ink)] outline-none transition placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-mint)]"
          name="email"
          placeholder="you@progno.ch"
          type="email"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--color-ink)]">Password</span>
        <input
          className="w-full rounded-2xl border border-white/8 bg-[color:rgba(9,15,23,0.72)] px-4 py-3 text-[color:var(--color-ink)] outline-none transition placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-gold)]"
          minLength={8}
          name="password"
          placeholder="At least 8 characters"
          type="password"
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-[#ef6b6b]/30 bg-[#ef6b6b]/8 px-4 py-3 text-sm text-[#ffb8b8]">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-2xl border border-[#45d7c0]/20 bg-[#45d7c0]/8 px-4 py-3 text-sm text-[#c0fff3]">
          {state.message}
        </p>
      ) : null}

      <AuthButton buttonLabel={buttonLabel} />
    </form>
  );
}

