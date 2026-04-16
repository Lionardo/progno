import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAllBlogArticles, getBlogArticleBySlug } from "@/lib/blog";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.description,
  };
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { slug } = await params;
  const article = getBlogArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const Content = article.Content;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 lg:px-8 lg:py-14">
      <article className="rounded-[2.75rem] border border-[color:var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(15,24,34,0.92),rgba(10,18,27,0.86))] p-7 lg:p-10">
        <Link
          className="inline-flex text-sm uppercase tracking-[0.18em] text-[color:var(--color-muted)] transition hover:text-[color:var(--color-mint)]"
          href="/blog"
        >
          Back to blog
        </Link>

        <div className="mt-6 text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
          {article.eyebrow}
        </div>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.98] text-[color:var(--color-ink)] md:text-6xl">
          {article.title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          <span>{formatBlogDate(article.publishedAt)}</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>{article.readingTime}</span>
        </div>
        <div className="mt-10 space-y-4">
          <Content />
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(7,16,24,0.62)] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Continue with the live product
            </div>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              Once the model is clear, the market board is easier to read: each
              initiative compares two predicted index outcomes, not two polling
              numbers.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-full bg-[color:var(--color-mint)] px-5 py-3 text-sm font-medium text-[color:var(--color-obsidian)] transition hover:bg-[color:var(--color-gold)]"
              href="/markets"
            >
              Open the markets
            </Link>
            <Link
              className="inline-flex rounded-full border border-[color:var(--color-border-strong)] px-5 py-3 text-sm text-[color:var(--color-ink)] transition hover:border-[color:var(--color-gold)]"
              href="/"
            >
              Return home
            </Link>
          </div>
        </div>
      </article>
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
