import Link from "next/link";

import { MarketHistoryChart } from "@/components/charts/market-history-chart";
import { formatRelativeDeadline, formatVoteDate } from "@/lib/dates";
import type { InitiativeCardData } from "@/lib/types";

interface MarketCardProps {
  market: InitiativeCardData;
}

export function MarketCard({ market }: MarketCardProps) {
  const { aggregate, approvedMetric, history, initiative } = market;

  return (
    <Link
      className="group block rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6 transition hover:-translate-y-1 hover:border-[color:var(--color-mint)]"
      href={`/initiatives/${initiative.slug}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
            {initiative.type}
          </div>
          <h2 className="font-serif text-2xl text-[color:var(--color-ink)]">
            {initiative.official_title}
          </h2>
          <p className="max-w-xl text-sm text-[color:var(--color-muted)]">
            {initiative.summary_en}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-3 text-right text-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            Vote date
          </div>
          <div className="font-medium text-[color:var(--color-ink)]">
            {formatVoteDate(initiative.vote_date)}
          </div>
          <div className="mt-2 text-xs text-[color:var(--color-muted)]">
            {formatRelativeDeadline(initiative.market_closes_at)}
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            If passes
          </div>
          <div className="mt-2 text-3xl font-semibold text-[color:var(--color-mint)]">
            {aggregate.passAverage?.toFixed(1) ?? "--"}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            If fails
          </div>
          <div className="mt-2 text-3xl font-semibold text-[color:var(--color-gold)]">
            {aggregate.failAverage?.toFixed(1) ?? "--"}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            Forecasts
          </div>
          <div className="mt-2 text-3xl font-semibold text-[color:var(--color-ink)]">
            {aggregate.forecastCount}
          </div>
        </div>
      </div>

      <MarketHistoryChart compact history={history} />

      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <div className="text-[color:var(--color-muted)]">
          {approvedMetric
            ? approvedMetric.index_name
            : "No approved welfare index yet"}
        </div>
        <div className="font-medium text-[color:var(--color-ink)] transition group-hover:text-[color:var(--color-mint)]">
          Open market
        </div>
      </div>
    </Link>
  );
}

