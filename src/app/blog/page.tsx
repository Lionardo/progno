import type { Metadata } from "next";
import Link from "next/link";

import { getAllBlogArticles } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Essays and explainers about futarchy, Swiss initiatives, and how Progno's conditional markets work.",
};

export default function BlogIndexPage() {
  const articles = getAllBlogArticles();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-8 lg:py-14">
      <section className="rounded-[2.75rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(15,24,34,0.82)] p-7 lg:p-10">
        <div className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
          Progno Journal
        </div>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.98] text-[color:var(--color-ink)] md:text-6xl">
          Writing for people who need the model before the market.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-[color:var(--color-muted)]">
          The product uses conditional public-interest markets, which is not a
          familiar format for most users. This section explains the concepts in
          plain language before asking anyone to interpret a chart.
        </p>
      </section>

      <section className="mt-8 grid gap-6">
        {articles.map((article) => (
          <article
            className="rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6 lg:p-7"
            key={article.slug}
          >
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              <span>{article.eyebrow}</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>{formatBlogDate(article.publishedAt)}</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>{article.readingTime}</span>
            </div>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-[color:var(--color-ink)] md:text-4xl">
              {article.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base text-[color:var(--color-muted)] md:text-lg">
              {article.description}
            </p>
            <div className="mt-6">
              <Link
                className="inline-flex rounded-full bg-[color:var(--color-mint)] px-5 py-3 text-sm font-medium text-[color:var(--color-obsidian)] transition hover:bg-[color:var(--color-gold)]"
                href={`/blog/${article.slug}`}
              >
                Read article
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("en-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
