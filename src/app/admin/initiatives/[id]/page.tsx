import { notFound } from "next/navigation";

import { MetricAdminPanel } from "@/components/admin/metric-admin-panel";
import { MarketHistoryChart } from "@/components/charts/market-history-chart";
import { MetricComponents } from "@/components/markets/metric-components";
import { requireAdmin } from "@/lib/auth";
import { getAdminInitiativePage } from "@/lib/data";
import { formatDateTime, formatVoteDate } from "@/lib/dates";
import type { AdminInitiativePageData } from "@/lib/types";

export default async function AdminInitiativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const adminUser = await requireAdmin();
  const { id } = await params;
  const detail = await getAdminInitiativePage(id, adminUser.id);

  if (!detail) {
    notFound();
  }

  const {
    aggregate,
    aiAggregate,
    aiHistory,
    approvedMetric,
    history,
    importRuns,
    initiative,
    metrics,
  } = detail;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6 rounded-[2.75rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(15,24,34,0.8)] p-7 lg:p-10">
          <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            {initiative.type} • {formatVoteDate(initiative.vote_date)}
          </div>
          <h1 className="font-serif text-5xl leading-[0.98] text-[color:var(--color-ink)] md:text-6xl">
            {initiative.official_title}
          </h1>
          <p className="max-w-3xl text-lg text-[color:var(--color-muted)]">
            {initiative.summary_en}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <AdminMetricTile label="If passes" value={aggregate.passAverage} />
            <AdminMetricTile label="If fails" value={aggregate.failAverage} />
            <AdminMetricTile
              label="Forecasts"
              rawValue={String(aggregate.forecastCount)}
            />
          </div>

          {aiAggregate ? <AdminAICompositePanel aggregate={aiAggregate} /> : null}
        </div>

        <MarketHistoryChart aiHistory={aiHistory} history={history} />
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-5">
          {approvedMetric ? (
            <>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                  Live public metric
                </div>
                <h2 className="font-serif text-4xl text-[color:var(--color-ink)]">
                  {approvedMetric.index_name}
                </h2>
                <p className="max-w-3xl text-sm text-[color:var(--color-muted)]">
                  {approvedMetric.ai_rationale}
                </p>
              </div>
              <MetricComponents components={approvedMetric.components} />
            </>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-[color:var(--color-muted)]">
              No approved metric is currently live for this initiative.
            </div>
          )}

          <div className="rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Import history
            </div>
            <div className="mt-4 space-y-3">
              {importRuns.length === 0 ? (
                <div className="text-sm text-[color:var(--color-muted)]">
                  No import runs tied to this initiative yet.
                </div>
              ) : (
                importRuns.map((run) => (
                  <div
                    className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm"
                    key={run.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[color:var(--color-ink)]">
                        {run.status.toUpperCase()}
                      </span>
                      <span className="text-[color:var(--color-muted)]">
                        {formatDateTime(run.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <MetricAdminPanel initiative={initiative} metrics={metrics} />
      </section>
    </main>
  );
}

function AdminAICompositePanel({
  aggregate,
}: {
  aggregate: NonNullable<AdminInitiativePageData["aiAggregate"]>;
}) {
  return (
    <div className="rounded-[1.7rem] border border-[#9f7cff]/25 bg-[#9f7cff]/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#d4c0ff]">
            AI composite
          </div>
          <p className="mt-2 text-sm text-[#eadfff]">
            {aggregate.providerCount}{" "}
            {aggregate.providerCount === 1 ? "model" : "models"} blended into
            the violet chart overlay.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-[1.2rem] border border-[#9f7cff]/25 bg-[rgba(10,4,24,0.24)] px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[#d4c0ff]">
              If passes
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#f2ecff]">
              {aggregate.passAverage?.toFixed(1) ?? "--"}
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-[#9f7cff]/25 bg-[rgba(10,4,24,0.24)] px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[#d4c0ff]">
              If fails
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#f2ecff]">
              {aggregate.failAverage?.toFixed(1) ?? "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminMetricTile({
  label,
  rawValue,
  value,
}: {
  label: string;
  rawValue?: string;
  value?: number | null;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className="mt-2 text-4xl font-semibold text-[color:var(--color-ink)]">
        {rawValue ?? value?.toFixed(1) ?? "--"}
      </div>
    </article>
  );
}
