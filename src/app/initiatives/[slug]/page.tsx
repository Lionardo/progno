import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketHistoryChart } from "@/components/charts/market-history-chart";
import { ForecastForm } from "@/components/forecast/forecast-form";
import { MetricComponents } from "@/components/markets/metric-components";
import { getViewer } from "@/lib/auth";
import {
  formatDateTime,
  formatRelativeDeadline,
  formatVoteDate,
  isMarketOpen,
} from "@/lib/dates";
import { getPublishedInitiativeDetail } from "@/lib/data";

export default async function InitiativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getViewer();
  const detail = await getPublishedInitiativeDetail(slug, viewer.user?.id);

  if (!detail) {
    notFound();
  }

  const {
    aggregate,
    approvedMetric,
    history,
    initiative,
    latestForecast,
    marketSource,
  } = detail;
  const marketOpen = isMarketOpen(initiative.market_closes_at);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <section className="space-y-6 rounded-[2.75rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(15,24,34,0.8)] p-7 lg:p-10">
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          <span>{initiative.type}</span>
          <span>•</span>
          <span>{formatVoteDate(initiative.vote_date)}</span>
          <span>•</span>
          <span>{formatRelativeDeadline(initiative.market_closes_at)}</span>
        </div>
        <h1 className="max-w-5xl font-serif text-5xl leading-[0.98] text-[color:var(--color-ink)] md:text-6xl">
          {initiative.official_title}
        </h1>
        <p className="max-w-4xl text-lg text-[color:var(--color-muted)]">
          {initiative.summary_en}
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <ValueTile
            accent="mint"
            label="Avg index if passed"
            value={aggregate.passAverage}
          />
          <ValueTile
            accent="gold"
            label="Avg index if rejected"
            value={aggregate.failAverage}
          />
          <ValueTile
            accent="ink"
            label="Forecast tickets"
            rawValue={String(aggregate.forecastCount)}
          />
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-[color:var(--color-muted)]">
          <Link
            className="rounded-full border border-[color:var(--color-border-strong)] px-4 py-2 transition hover:border-[color:var(--color-mint)] hover:text-[color:var(--color-ink)]"
            href={initiative.source_url}
            rel="noreferrer"
            target="_blank"
          >
            Official source
          </Link>
          <div className="rounded-full border border-white/10 px-4 py-2">
            Market closes: {formatDateTime(initiative.market_closes_at)}
          </div>
          {marketSource === "demo" ? (
            <div className="rounded-full border border-[#f2c66d]/20 bg-[#f2c66d]/10 px-4 py-2 text-[#ffe7b1]">
              Demo crowd activity
            </div>
          ) : null}
          {marketSource === "seeded" ? (
            <div className="rounded-full border border-[#f2c66d]/20 bg-[#f2c66d]/10 px-4 py-2 text-[#ffe7b1]">
              Seeded history + live forecasts
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <div className="rounded-[2.25rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-5 lg:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                Conditional market
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              <span className="rounded-full border border-[#45d7c0]/20 bg-[#45d7c0]/10 px-3 py-2 text-[#c0fff3]">
                Mint: if passed
              </span>
              <span className="rounded-full border border-[#f2c66d]/20 bg-[#f2c66d]/10 px-3 py-2 text-[#ffe7b1]">
                Gold: if rejected
              </span>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm text-[color:var(--color-muted)]">
            {marketSource === "demo"
              ? "This market is currently showing seeded demo participation so new visitors can see how the interface works before live forecasts accumulate."
              : marketSource === "seeded"
                ? "This market already has live forecasts, but it is still using seeded history so the curve stays readable until more real participation accumulates."
                : "The chart tracks how the crowd&apos;s average 2036 index forecast has moved over time under each vote outcome."}
          </p>
          <MarketHistoryChart className="mt-5" history={history} />
        </div>

        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          {!approvedMetric ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-[color:var(--color-muted)]">
              Forecasting opens once the public metric is published for this
              initiative.
            </div>
          ) : viewer.user ? (
            marketOpen ? (
              <ForecastForm
                initialFail={latestForecast?.fail_value ?? null}
                initialPass={latestForecast?.pass_value ?? null}
                initiativeId={initiative.id}
                initiativeSlug={initiative.slug}
              />
            ) : (
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-[color:var(--color-muted)]">
                This market is closed. Historical crowd forecasts remain visible
                in the chart, but new revisions are no longer accepted.
              </div>
            )
          ) : (
            <div className="rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                Sign-in required
              </div>
              <h3 className="mt-3 font-serif text-3xl text-[color:var(--color-ink)]">
                Join the forecast
              </h3>
              <p className="mt-3 text-sm text-[color:var(--color-muted)]">
                Browse everything anonymously, but sign in with Supabase auth to
                use your one forecast ticket on this initiative.
              </p>
              <Link
                className="mt-5 inline-flex rounded-full bg-[color:var(--color-mint)] px-5 py-3 text-sm font-medium text-[color:var(--color-obsidian)] transition hover:bg-[color:var(--color-gold)]"
                href={`/login?next=${encodeURIComponent(`/initiatives/${initiative.slug}`)}`}
              >
                Sign in to forecast
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12 space-y-5">
        <div className="space-y-5 rounded-[2.25rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6 lg:p-7">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Welfare metric
            </div>
            <h2 className="font-serif text-4xl text-[color:var(--color-ink)]">
              {approvedMetric
                ? approvedMetric.index_name
                : "Metric review still in progress"}
            </h2>
            <p className="max-w-3xl text-sm text-[color:var(--color-muted)]">
              {approvedMetric
                ? approvedMetric.ai_rationale
                : "This initiative is live, but no approved 2036 welfare index has been published yet."}
            </p>
          </div>

          {approvedMetric ? (
            <>
              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-[color:var(--color-muted)]">
                <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]">
                  How to read this index
                </div>
                <p className="mt-2">
                  The final score always runs from{" "}
                  <span className="text-[color:var(--color-ink)]">0 to 100</span>,
                  where higher means a better overall Swiss welfare outcome by
                  2036. Individual ingredients do not all move in the same
                  direction: higher GDP per capita can improve the index, while{" "}
                  <span className="text-[color:var(--color-ink)]">
                    lower commute time
                  </span>{" "}
                  can also improve it because that component is marked as lower
                  is better.
                </p>
              </div>
              <MetricComponents components={approvedMetric.components} />
              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-[color:var(--color-muted)]">
                <div className="text-xs uppercase tracking-[0.18em]">
                  Source notes
                </div>
                <p className="mt-2">{approvedMetric.source_notes}</p>
              </div>
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-[color:var(--color-muted)]">
              Admin review is required before public forecasting opens on the
              composite metric.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ValueTile({
  accent,
  label,
  rawValue,
  value,
}: {
  accent: "gold" | "ink" | "mint";
  label: string;
  rawValue?: string;
  value?: number | null;
}) {
  const colors = {
    gold: "text-[color:var(--color-gold)]",
    ink: "text-[color:var(--color-ink)]",
    mint: "text-[color:var(--color-mint)]",
  };

  return (
    <article className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className={`mt-2 text-4xl font-semibold ${colors[accent]}`}>
        {rawValue ?? (value != null ? `${value.toFixed(1)} / 100` : "--")}
      </div>
    </article>
  );
}
