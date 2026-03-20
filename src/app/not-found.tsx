import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center px-5 py-10 lg:px-8 lg:py-14">
      <div className="rounded-[2.75rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(15,24,34,0.8)] p-8 lg:p-10">
        <div className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
          404
        </div>
        <h1 className="mt-4 font-serif text-5xl text-[color:var(--color-ink)]">
          This market does not exist.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[color:var(--color-muted)]">
          The initiative may not be published yet, or the slug is wrong.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-[color:var(--color-mint)] px-5 py-3 text-sm font-medium text-[color:var(--color-obsidian)] transition hover:bg-[color:var(--color-gold)]"
          href="/"
        >
          Back to the market board
        </Link>
      </div>
    </main>
  );
}

