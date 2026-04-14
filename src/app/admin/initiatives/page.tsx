import Link from "next/link";

import { AdminImportPanel } from "@/components/admin/admin-import-panel";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatVoteDate } from "@/lib/dates";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminInitiativesPage() {
  await requireAdmin();
  const dashboard = await getAdminDashboardData();

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <section className="mb-8 space-y-3">
        <div className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
          Admin control room
        </div>
        <h1 className="font-serif text-5xl text-[color:var(--color-ink)] md:text-6xl">
          Initiative operations
        </h1>
        <p className="max-w-3xl text-lg text-[color:var(--color-muted)]">
          Refresh official federal initiatives, review AI-generated welfare
          metrics, and publish the versions that will drive the public market.
        </p>
      </section>

      <AdminImportPanel latestPreviewRun={dashboard.latestPreviewRun} />

      <section className="mt-10 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Initiative list
            </div>
            <h2 className="mt-2 font-serif text-4xl text-[color:var(--color-ink)]">
              Live and draft initiatives
            </h2>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {dashboard.initiatives.map((item) => (
            <Link
              className="rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6 transition hover:border-[color:var(--color-mint)]"
              href={`/admin/initiatives/${item.initiative.id}`}
              key={item.initiative.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                    {item.initiative.type} • {formatVoteDate(item.initiative.vote_date)}
                  </div>
                  <h3 className="font-serif text-3xl text-[color:var(--color-ink)]">
                    {item.initiative.official_title}
                  </h3>
                  <p className="max-w-2xl text-sm text-[color:var(--color-muted)]">
                    {item.initiative.summary_en}
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  {item.draftMetricCount} draft metric
                  {item.draftMetricCount === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <AdminValue label="If passes" value={item.aggregate.passAverage} />
                <AdminValue label="If fails" value={item.aggregate.failAverage} />
                <AdminValue
                  label="Forecasts"
                  rawValue={String(item.aggregate.forecastCount)}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--color-muted)]">
                <span className="flex flex-wrap items-center gap-2">
                  {item.approvedMetric
                    ? `Live metric: ${item.approvedMetric.index_name}`
                    : "No public metric approved yet"}
                  {item.aiAggregate ? (
                    <span className="rounded-full border border-[#9f7cff]/25 bg-[#9f7cff]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#eadfff]">
                      AI {item.aiAggregate.passAverage?.toFixed(1)} /{" "}
                      {item.aiAggregate.failAverage?.toFixed(1)}
                    </span>
                  ) : null}
                </span>
                <span>
                  {item.latestImportRun
                    ? `Last import: ${formatDateTime(item.latestImportRun.created_at)}`
                    : "No import run recorded yet"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
            Import history
          </div>
          <h2 className="mt-2 font-serif text-4xl text-[color:var(--color-ink)]">
            Recent source snapshots
          </h2>
        </div>

        <div className="grid gap-4">
          {dashboard.importRuns.map((run) => (
            <article
              className="rounded-[1.5rem] border border-white/8 bg-[color:var(--color-panel)] px-5 py-4 text-sm"
              key={run.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[color:var(--color-ink)]">
                  {run.status.toUpperCase()}
                </div>
                <div className="text-[color:var(--color-muted)]">
                  {formatDateTime(run.created_at)}
                </div>
              </div>
              <div className="mt-2 break-all text-[color:var(--color-muted)]">
                {run.source_url}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function AdminValue({
  label,
  rawValue,
  value,
}: {
  label: string;
  rawValue?: string;
  value?: number | null;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-[color:var(--color-ink)]">
        {rawValue ?? value?.toFixed(1) ?? "--"}
      </div>
    </div>
  );
}
