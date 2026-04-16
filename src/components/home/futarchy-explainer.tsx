import Link from "next/link";
import type { ReactNode } from "react";

import type { InitiativeCardData, MetricDirection } from "@/lib/types";

interface FutarchyExplainerProps {
  exampleMarket: InitiativeCardData | null;
}

interface IndexSlice {
  direction: MetricDirection;
  label: string;
  weight: number;
}

const FALLBACK_COMPONENTS: IndexSlice[] = [
  {
    direction: "higher_is_better",
    label: "Prosperity",
    weight: 40,
  },
  {
    direction: "higher_is_better",
    label: "Housing",
    weight: 30,
  },
  {
    direction: "lower_is_better",
    label: "Congestion",
    weight: 30,
  },
];

function shortenText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatScore(value: number) {
  return value.toFixed(1);
}

export function FutarchyExplainer({
  exampleMarket,
}: FutarchyExplainerProps) {
  const approvedMetric = exampleMarket?.approvedMetric ?? null;
  const passAverage = exampleMarket?.aggregate.passAverage ?? null;
  const failAverage = exampleMarket?.aggregate.failAverage ?? null;
  const showLiveScores = passAverage != null && failAverage != null;
  const passScore = showLiveScores ? passAverage : 64.2;
  const failScore = showLiveScores ? failAverage : 58.1;
  const exampleGap = Math.abs(passScore - failScore);
  const markerScore = Math.min(
    Math.max(Math.round((passScore + failScore) / 2), 8),
    92,
  );
  const leadingOutcomeLabel =
    passScore === failScore
      ? "No edge"
      : passScore > failScore
        ? "Pass edge"
        : "Reject edge";
  const leadingOutcomeTone =
    passScore >= failScore ? "text-[#c0fff3]" : "text-[#ffe7b1]";
  const initiativeTitle = shortenText(
    exampleMarket?.initiative.official_title ?? "Federal initiative under review",
    72,
  );
  const initiativeSummary = shortenText(
    exampleMarket?.initiative.summary_en ??
      "Every market starts with one concrete Swiss proposal and two possible futures.",
    150,
  );
  const indexName = approvedMetric?.index_name ?? "Swiss Welfare Index";
  const featuredComponents =
    approvedMetric?.components.slice(0, 3).map((component) => ({
      direction: component.direction,
      label: component.label,
      weight: component.weight,
    })) ?? FALLBACK_COMPONENTS;
  const exampleHref = exampleMarket
    ? `/initiatives/${exampleMarket.initiative.slug}`
    : "/markets";

  return (
    <section className="mt-12 rounded-[2.75rem] border border-[color:var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(15,24,34,0.92),rgba(10,18,27,0.86))] p-6 lg:p-8">
      <div className="max-w-3xl">
        <div className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
          How Futarchy Works
        </div>
        <h2 className="mt-4 font-serif text-4xl leading-tight text-[color:var(--color-ink)] md:text-5xl">
          Three steps: initiative, index, bet.
        </h2>
        <p className="mt-4 text-base text-[color:var(--color-muted)] md:text-lg">
          Progno does not ask you to bet on raw vote share. It asks you to
          forecast a public welfare index in two counterfactual worlds: one
          where the initiative passes, and one where it fails.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <StepCard
          eyebrow="Step 1"
          title="Initiative"
          description="Each market begins with one real Swiss proposal. The key question is not just who wins the vote, but what Switzerland looks like afterward under both outcomes."
        >
          <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              {exampleMarket?.initiative.type ?? "Federal initiative"}
            </div>
            <div className="mt-3 font-serif text-2xl leading-tight text-[color:var(--color-ink)]">
              {initiativeTitle}
            </div>
            <p className="mt-3 text-sm text-[color:var(--color-muted)]">
              {initiativeSummary}
            </p>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
              <div className="absolute left-1/2 top-[-1rem] hidden h-4 w-px -translate-x-1/2 bg-white/15 sm:block" />
              <div className="absolute left-1/4 right-1/4 top-0 hidden h-px bg-white/10 sm:block" />
              <OutcomeCard
                label="If passed"
                tone="mint"
                summary="Forecast the world where the proposal becomes law."
              />
              <OutcomeCard
                label="If rejected"
                tone="gold"
                summary="Forecast the world where the status quo remains."
              />
            </div>
          </div>
        </StepCard>

        <StepCard
          eyebrow="Step 2"
          title="Index"
          description="Every initiative gets a named 0-100 welfare index built from public indicators. Higher means a better Swiss outcome by 2036, even if some components are better when they go down."
        >
          <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Public welfare index
                </div>
                <div className="mt-2 font-serif text-2xl leading-tight text-[color:var(--color-ink)]">
                  {indexName}
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                0-100 scale
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                <span>0</span>
                <span>Higher is better by 2036</span>
                <span>100</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-[linear-gradient(90deg,rgba(242,198,109,0.26),rgba(69,215,192,0.42))]">
                <div className="relative h-full">
                  <div
                    className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-[color:var(--color-background)] bg-[color:var(--color-ink)] shadow-[0_0_0_4px_rgba(9,16,22,0.55)]"
                    style={{ left: `calc(${markerScore}% - 10px)` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {featuredComponents.map((component) => (
                <div
                  className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-3 py-3"
                  key={component.label}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[color:var(--color-ink)]">
                      {component.label}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                      {component.weight}%
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--color-muted)]">
                    {component.direction === "higher_is_better"
                      ? "Higher helps the index"
                      : "Lower helps the index"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StepCard>

        <StepCard
          eyebrow="Step 3"
          title="Bet"
          description="You get one forecast ticket per initiative and submit two numbers. Those numbers are your estimate of the index level under each outcome, not your guess about the referendum margin."
        >
          <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                One forecast ticket
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                2036 outcome
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <ForecastRow
                label="If passed"
                tone="mint"
                value={formatScore(passScore)}
              />
              <ForecastRow
                label="If rejected"
                tone="gold"
                value={formatScore(failScore)}
              />
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-white/8 bg-[color:rgba(7,16,24,0.65)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  What that means
                </span>
                <span className={`text-sm font-medium ${leadingOutcomeTone}`}>
                  {leadingOutcomeLabel}: {formatScore(exampleGap)} pts
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--color-muted)]">
                {passScore === failScore
                  ? "Your ticket says the initiative barely changes the measured welfare outcome."
                  : passScore > failScore
                    ? `Your ticket says passage leads to a better ${indexName} than rejection.`
                    : `Your ticket says rejection leads to a better ${indexName} than passage.`}
              </p>
            </div>
          </div>
        </StepCard>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(7,16,24,0.62)] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
            What you are actually betting on
          </div>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            The bet is the future value of the chosen index, conditional on each
            vote result. The spread between your two numbers is your view on
            whether the initiative helps or hurts the measured welfare outcome.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-full border border-[color:var(--color-border-strong)] px-5 py-3 text-sm text-[color:var(--color-ink)] transition hover:border-[color:var(--color-mint)]"
            href="/blog/what-is-futarchy"
          >
            Read the full primer
          </Link>
          <Link
            className="inline-flex rounded-full bg-[color:var(--color-mint)] px-5 py-3 text-sm font-medium text-[color:var(--color-obsidian)] transition hover:bg-[color:var(--color-gold)]"
            href={exampleHref}
          >
            {exampleMarket ? "Open a live example" : "Browse the market board"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <article className="h-full rounded-[2.2rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(255,255,255,0.02)] p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
        {eyebrow}
      </div>
      <h3 className="mt-3 font-serif text-3xl text-[color:var(--color-ink)]">
        {title}
      </h3>
      <p className="mt-3 text-sm text-[color:var(--color-muted)]">
        {description}
      </p>
      <div className="mt-6">{children}</div>
    </article>
  );
}

function OutcomeCard({
  label,
  summary,
  tone,
}: {
  label: string;
  summary: string;
  tone: "gold" | "mint";
}) {
  const tones = {
    gold: "border-[#f2c66d]/20 bg-[#f2c66d]/10 text-[#ffe7b1]",
    mint: "border-[#45d7c0]/20 bg-[#45d7c0]/10 text-[#c0fff3]",
  };

  return (
    <div
      className={`rounded-[1.25rem] border px-3 py-3 text-sm ${tones[tone]}`}
    >
      <div className="text-[11px] uppercase tracking-[0.18em]">{label}</div>
      <div className="mt-2 text-xs text-white/70">{summary}</div>
    </div>
  );
}

function ForecastRow({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "gold" | "mint";
  value: string;
}) {
  const tones = {
    gold: "border-[#f2c66d]/20 bg-[#f2c66d]/10 text-[#ffe7b1]",
    mint: "border-[#45d7c0]/20 bg-[#45d7c0]/10 text-[#c0fff3]",
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          {label}
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-muted)]">
          Forecast the index level if this world happens.
        </div>
      </div>
      <div
        className={`rounded-full border px-4 py-2 text-lg font-semibold ${tones[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}
