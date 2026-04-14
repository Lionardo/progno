import Link from "next/link";

import { FutarchyExplainer } from "@/components/home/futarchy-explainer";
import { listHomepageMarkets } from "@/lib/data";

export default async function HomePage() {
  const markets = await listHomepageMarkets();
  const totalForecasts = markets.reduce(
    (sum, market) => sum + market.aggregate.forecastCount,
    0,
  );
  const approvedMetrics = markets.filter(
    (market) => market.approvedMetric,
  ).length;
  const seededMarkets = markets.filter(
    (market) => market.marketSource !== "live",
  ).length;
  const exampleMarket =
    markets.find((market) => market.approvedMetric) ?? markets[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2.75rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(15,24,34,0.8)] p-7 lg:p-10">
          <div className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
            Swiss direct democracy, shadow-priced
          </div>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.98] text-[color:var(--color-ink)] md:text-6xl">
            A play-points market for Switzerland&apos;s future.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[color:var(--color-muted)]">
            Progno mirrors Swiss federal initiatives with conditional welfare
            markets. For each proposal, the crowd forecasts a public 0-100
            welfare index in two ways: if the measure passes, and if it fails.
            Every participant gets one equal-weight forecast ticket per
            initiative.
          </p>
          {seededMarkets > 0 ? (
            <p className="mt-4 max-w-2xl text-sm text-[color:var(--color-muted)]">
              Thin markets are shown with seeded history until enough real
              participation accumulates for a fully live curve.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-[color:var(--color-mint)] px-5 py-3 text-sm font-medium text-[color:var(--color-obsidian)] transition hover:bg-[color:var(--color-gold)]"
              href={markets.length > 0 ? "/markets" : "/login"}
            >
              Open the market board
            </Link>
            <Link
              className="rounded-full border border-[color:var(--color-border-strong)] px-5 py-3 text-sm text-[color:var(--color-ink)] transition hover:border-[color:var(--color-gold)]"
              href="/login"
            >
              Sign in to forecast
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <StatTile label="Live initiatives" value={String(markets.length)} />
          <StatTile label="Approved indices" value={String(approvedMetrics)} />
          <StatTile label="Forecast tickets" value={String(totalForecasts)} />
        </div>
      </section>

      <FutarchyExplainer exampleMarket={exampleMarket} />
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6">
      <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className="mt-3 font-serif text-5xl text-[color:var(--color-ink)]">
        {value}
      </div>
    </article>
  );
}
