"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  approveMetricAction,
  generateMetricProposalAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { formatDateTime } from "@/lib/dates";
import type { InitiativeRow, MetricVersionRow } from "@/lib/types";

interface MetricAdminPanelProps {
  initiative: InitiativeRow;
  metrics: MetricVersionRow[];
}

function PanelButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full border border-[color:var(--color-border-strong)] px-4 py-2 text-sm text-[color:var(--color-ink)] transition hover:border-[color:var(--color-gold)] disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

export function MetricAdminPanel({
  initiative,
  metrics,
}: MetricAdminPanelProps) {
  const [generateState, generateAction] = useActionState<
    AdminActionState,
    FormData
  >(generateMetricProposalAction, {});

  return (
    <section className="space-y-5 rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
          Metric review
        </div>
        <h2 className="font-serif text-3xl text-[color:var(--color-ink)]">
          Welfare index versions
        </h2>
        <p className="max-w-2xl text-sm text-[color:var(--color-muted)]">
          Generate structured proposals with OpenAI, then approve one version to
          make it public on the initiative market.
        </p>
      </div>

      <form action={generateAction}>
        <input name="initiative_id" type="hidden" value={initiative.id} />
        <PanelButton label="Generate metric draft" />
      </form>

      {generateState.error ? (
        <p className="rounded-2xl border border-[#ef6b6b]/30 bg-[#ef6b6b]/8 px-4 py-3 text-sm text-[#ffb8b8]">
          {generateState.error}
        </p>
      ) : null}

      {generateState.message ? (
        <p className="rounded-2xl border border-[#45d7c0]/20 bg-[#45d7c0]/8 px-4 py-3 text-sm text-[#c0fff3]">
          {generateState.message}
        </p>
      ) : null}

      <div className="space-y-4">
        {metrics.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-[color:var(--color-muted)]">
            No metric versions yet.
          </div>
        ) : (
          metrics.map((metric) => (
            <article
              className="space-y-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5"
              key={metric.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                    <span>{metric.status}</span>
                    <span>•</span>
                    <span>{metric.index_name}</span>
                  </div>
                  <p className="max-w-3xl text-sm text-[color:var(--color-muted)]">
                    {metric.ai_rationale}
                  </p>
                  <div className="text-xs text-[color:var(--color-muted)]">
                    Created {formatDateTime(metric.created_at)}
                  </div>
                </div>

                {metric.status !== "approved" ? (
                  <ApproveMetricForm initiative={initiative} metric={metric} />
                ) : (
                  <div className="rounded-full border border-[#45d7c0]/20 bg-[#45d7c0]/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#c0fff3]">
                    Live metric
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ApproveMetricForm({
  initiative,
  metric,
}: {
  initiative: InitiativeRow;
  metric: MetricVersionRow;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    approveMetricAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input name="initiative_id" type="hidden" value={initiative.id} />
      <input name="initiative_slug" type="hidden" value={initiative.slug} />
      <input name="metric_id" type="hidden" value={metric.id} />
      <PanelButton label="Approve" />
      {state.error ? (
        <p className="max-w-xs text-xs text-[#ffb8b8]">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="max-w-xs text-xs text-[#c0fff3]">{state.message}</p>
      ) : null}
    </form>
  );
}

