import { MarketCard } from "@/components/markets/market-card";
import { listHomepageMarkets } from "@/lib/data";

export default async function MarketsPage() {
  const markets = await listHomepageMarkets();

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Market board
            </div>
            <h1 className="mt-2 font-serif text-4xl text-[color:var(--color-ink)] md:text-5xl">
              Federal vote markets
            </h1>
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
