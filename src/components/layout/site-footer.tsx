export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 text-sm text-[color:var(--color-muted)] lg:px-8">
        <div className="font-serif text-xl text-[color:var(--color-ink)]">
          Progno
        </div>
        <p className="max-w-3xl">
          A public-interest, play-points simulation of Swiss federal futurarchy.
          No money, no payouts, no gambling mechanics. Just conditional forecasts,
          transparent metrics, and a readable market history.
        </p>
      </div>
    </footer>
  );
}

