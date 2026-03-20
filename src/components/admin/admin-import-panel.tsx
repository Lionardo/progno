"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  applyInitiativeImport,
  runInitiativeImport,
  type AdminActionState,
} from "@/app/actions/admin";
import { formatDateTime } from "@/lib/dates";
import type { ImportRunRow } from "@/lib/types";

interface AdminImportPanelProps {
  latestPreviewRun: ImportRunRow | null;
}

function ActionButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full border border-[color:var(--color-border-strong)] px-4 py-2 text-sm text-[color:var(--color-ink)] transition hover:border-[color:var(--color-mint)] disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

export function AdminImportPanel({ latestPreviewRun }: AdminImportPanelProps) {
  const [previewState, previewAction] = useActionState<AdminActionState, FormData>(
    runInitiativeImport,
    {},
  );
  const [applyState, applyAction] = useActionState<AdminActionState, FormData>(
    applyInitiativeImport,
    {},
  );

  return (
    <section className="space-y-5 rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
          Official import
        </div>
        <h2 className="font-serif text-3xl text-[color:var(--color-ink)]">
          Refresh federal initiatives
        </h2>
        <p className="max-w-2xl text-sm text-[color:var(--color-muted)]">
          Fetch the official federal vote announcement, store a raw snapshot,
          and review the parsed preview before applying it to the live market.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form action={previewAction}>
          <ActionButton label="Create fresh preview" />
        </form>
        {latestPreviewRun ? (
          <form action={applyAction}>
            <input name="run_id" type="hidden" value={latestPreviewRun.id} />
            <ActionButton label="Apply latest preview" />
          </form>
        ) : null}
      </div>

      {previewState.error || applyState.error ? (
        <p className="rounded-2xl border border-[#ef6b6b]/30 bg-[#ef6b6b]/8 px-4 py-3 text-sm text-[#ffb8b8]">
          {previewState.error ?? applyState.error}
        </p>
      ) : null}

      {previewState.message || applyState.message ? (
        <p className="rounded-2xl border border-[#45d7c0]/20 bg-[#45d7c0]/8 px-4 py-3 text-sm text-[#c0fff3]">
          {previewState.message ?? applyState.message}
        </p>
      ) : null}

      {latestPreviewRun ? (
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-[color:var(--color-muted)]">
          <div className="text-xs uppercase tracking-[0.18em]">
            Latest preview
          </div>
          <div className="mt-2 text-[color:var(--color-ink)]">
            {formatDateTime(latestPreviewRun.created_at)}
          </div>
          <div className="mt-1 break-all text-xs">{latestPreviewRun.source_url}</div>
        </div>
      ) : null}
    </section>
  );
}

