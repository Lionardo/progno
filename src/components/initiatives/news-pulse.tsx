import Link from "next/link";

import { formatDateTime } from "@/lib/dates";
import {
  formatNewsSourcePoliticalLean,
  getNewsSourcePoliticalLean,
} from "@/lib/news-source-bias";
import { cn } from "@/lib/utils";
import type { InitiativeNewsSnapshot } from "@/lib/types";

interface NewsPulseProps {
  snapshot: InitiativeNewsSnapshot | null;
}

function formatSentimentScore(score: number | null) {
  if (score == null) {
    return "Insufficient signal";
  }

  const prefix = score > 0 ? "+" : "";

  return `${prefix}${score.toFixed(1)}`;
}

function formatConfidence(confidenceScore: number | null) {
  if (confidenceScore == null) {
    return "--";
  }

  return `${Math.round(confidenceScore * 100)}%`;
}

export function NewsPulse({ snapshot }: NewsPulseProps) {
  if (!snapshot) {
    return (
      <section className="mt-12">
        <div className="rounded-[2.25rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-[color:var(--color-muted)] lg:p-7">
          <div className="text-xs uppercase tracking-[0.24em]">
            News pulse
          </div>
          <p className="mt-3 max-w-3xl">
            Automated Wednesday and Saturday news snapshots will appear here once
            the first sentiment refresh completes.
          </p>
        </div>
      </section>
    );
  }

  const citedSources = snapshot.sources.filter((source) => source.cited);
  const displaySources = (citedSources.length > 0 ? citedSources : snapshot.sources).slice(0, 5);
  const isInsufficientSignal = snapshot.status === "insufficient_signal";
  const toneLabel = isInsufficientSignal
    ? "Insufficient signal"
    : snapshot.sentiment_label === "positive"
      ? "Positive"
      : snapshot.sentiment_label === "negative"
        ? "Negative"
        : "Mixed";
  const toneClassName = isInsufficientSignal
    ? "border-[#f2c66d]/20 bg-[#f2c66d]/10 text-[#ffe7b1]"
    : snapshot.sentiment_label === "positive"
      ? "border-[#45d7c0]/20 bg-[#45d7c0]/10 text-[#c0fff3]"
      : snapshot.sentiment_label === "negative"
        ? "border-[#ff8e8e]/20 bg-[#ff8e8e]/10 text-[#ffd2d2]"
        : "border-white/10 bg-white/[0.05] text-[color:var(--color-ink)]";

  return (
    <section className="mt-12">
      <div className="space-y-5 rounded-[2.25rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6 lg:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              News pulse
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em]",
                  toneClassName,
                )}
              >
                {toneLabel}
              </span>
              <div className="font-serif text-4xl text-[color:var(--color-ink)]">
                {formatSentimentScore(snapshot.sentiment_score)}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Confidence
              </div>
              <div className="mt-2 text-[color:var(--color-ink)]">
                {formatConfidence(snapshot.confidence_score)}
              </div>
            </article>
            <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Articles reviewed
              </div>
              <div className="mt-2 text-[color:var(--color-ink)]">
                {snapshot.article_count}
              </div>
            </article>
            <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Last refreshed
              </div>
              <div className="mt-2 text-[color:var(--color-ink)]">
                {formatDateTime(snapshot.created_at)}
              </div>
            </article>
          </div>
        </div>

        <p className="max-w-4xl text-sm text-[color:var(--color-muted)]">
          {snapshot.summary_en ??
            "Not enough recent high-trust initiative coverage was available to publish a directional score this cycle."}
        </p>

        {displaySources.length > 0 ? (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Cited sources
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {displaySources.map((source) => {
                const leanLabel = formatNewsSourcePoliticalLean(
                  source.political_lean ?? getNewsSourcePoliticalLean(source.domain),
                );

                return (
                  <Link
                    key={source.url}
                    className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-[color:var(--color-muted)] transition hover:border-[color:var(--color-mint)] hover:text-[color:var(--color-ink)]"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="font-medium text-[color:var(--color-ink)]">
                      {source.title}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="break-all text-xs uppercase tracking-[0.18em]">
                        {source.domain}
                      </div>
                      {leanLabel ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                          {leanLabel}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
