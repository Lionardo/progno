"use client";

import { useState } from "react";

import {
  loginWithPassword,
  signUpWithPassword,
  type AuthActionState,
} from "@/app/actions/auth";
import { PasswordAuthForm } from "@/components/auth/password-auth-form";

interface PasswordAuthPanelProps {
  nextPath: string;
}

type AuthMode = "sign_in" | "sign_up";

interface ModeConfig {
  action: (
    previousState: AuthActionState | undefined,
    formData: FormData,
  ) => Promise<AuthActionState>;
  buttonLabel: string;
  description: string;
  title: string;
}

const MODE_CONFIG: Record<AuthMode, ModeConfig> = {
  sign_in: {
    action: loginWithPassword,
    buttonLabel: "Sign in",
    description: "Use your existing Progno account.",
    title: "Sign in",
  },
  sign_up: {
    action: signUpWithPassword,
    buttonLabel: "Sign up",
    description: "Create an account and start forecasting immediately.",
    title: "Sign up",
  },
};

export function PasswordAuthPanel({ nextPath }: PasswordAuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const activeMode = MODE_CONFIG[mode];

  return (
    <section className="space-y-4">
      <div className="inline-flex rounded-full border border-[color:var(--color-border-strong)] bg-[color:rgba(9,15,23,0.72)] p-1">
        <button
          className={tabClassName(mode === "sign_in")}
          onClick={() => setMode("sign_in")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={tabClassName(mode === "sign_up")}
          onClick={() => setMode("sign_up")}
          type="button"
        >
          Sign up
        </button>
      </div>

      <PasswordAuthForm
        action={activeMode.action}
        buttonLabel={activeMode.buttonLabel}
        description={activeMode.description}
        nextPath={nextPath}
        title={activeMode.title}
      />
    </section>
  );
}

function tabClassName(isActive: boolean) {
  return [
    "rounded-full px-4 py-2 text-sm transition",
    isActive
      ? "bg-[color:var(--color-mint)] font-medium text-[color:var(--color-obsidian)]"
      : "text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]",
  ].join(" ");
}
