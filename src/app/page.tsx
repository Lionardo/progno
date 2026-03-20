import Link from "next/link";

import { MarketCard } from "@/components/markets/market-card";
import { listHomepageMarkets } from "@/lib/data";

export default async function HomePage() {
  const markets = await listHomepageMarkets();
  const totalForecasts = markets.reduce(
    (sum, market) => sum + market.aggregate.forecastCount,
    0,
  );
  const approvedMetrics = markets.filter((market) => market.approvedMetric).length;
  const seededMarkets = markets.filter((market) => market.marketSource !== "live").length;

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
            markets. Every participant gets one equal-weight forecast ticket per
            initiative. The crowd prices 2036 outcomes under both pass and fail
            scenarios.
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
              href={markets[0] ? `/initiatives/${markets[0].initiative.slug}` : "/login"}
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

      <section className="mt-12 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Market board
            </div>
            <h2 className="mt-2 font-serif text-4xl text-[color:var(--color-ink)]">
              Federal vote markets
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-[color:var(--color-muted)]">
            Each card tracks the current crowd estimate for the 2036 welfare
            index if the measure passes versus if it fails. No real money, no
            balances, just public conditional forecasting.
          </p>
        </div>

        {markets.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center text-[color:var(--color-muted)]">
            No initiatives are published yet. Seed the database or apply an admin
            import preview to populate the first federal vote.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {markets.map((market) => (
              <MarketCard key={market.initiative.id} market={market} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
