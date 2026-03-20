"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  type ForecastActionState,
  upsertForecast,
} from "@/app/actions/forecasts";

interface ForecastFormProps {
  initialFail: number | null;
  initialPass: number | null;
  initiativeId: string;
  initiativeSlug: string;
}

function SaveForecastButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-[color:var(--color-mint)] px-5 py-3 text-sm font-medium text-[color:var(--color-obsidian)] transition hover:bg-[color:var(--color-gold)] disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Save forecast"}
    </button>
  );
}

export function ForecastForm({
  initialFail,
  initialPass,
  initiativeId,
  initiativeSlug,
}: ForecastFormProps) {
  const [state, formAction] = useActionState<ForecastActionState, FormData>(
    upsertForecast,
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] p-6"
    >
      <input name="initiative_id" type="hidden" value={initiativeId} />
      <input name="initiative_slug" type="hidden" value={initiativeSlug} />

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
          Forecast ticket
        </div>
        <h3 className="font-serif text-2xl text-[color:var(--color-ink)]">
          Predict the 2036 index under both outcomes
        </h3>
        <p className="max-w-xl text-sm text-[color:var(--color-muted)]">
          Enter the final <span className="text-[color:var(--color-ink)]">0-100</span> score
          you expect this initiative&apos;s published welfare index to reach by
          2036. Your one Progno point is not divided into 100 pieces. It simply
          gives you one equal-weight ticket on this market.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-[color:var(--color-muted)]">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]">
            0-100 score
          </div>
          <p className="mt-2">
            <span className="text-[color:var(--color-ink)]">0</span> means a very weak
            long-run outcome and <span className="text-[color:var(--color-ink)]">100</span>
            means an excellent one.
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-[color:var(--color-muted)]">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]">
            One ticket
          </div>
          <p className="mt-2">
            You are not allocating points across outcomes. You are submitting
            one forecast ticket with two scenario values.
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-[color:var(--color-muted)]">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]">
            Two scenarios
          </div>
          <p className="mt-2">
            Estimate the final index once <span className="text-[color:var(--color-ink)]">if
            voters pass it</span> and once <span className="text-[color:var(--color-ink)]">if
            voters reject it</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
          <span className="text-sm font-medium text-[color:var(--color-ink)]">
            Predicted index score if voters approve it
          </span>
          <p className="text-sm text-[color:var(--color-muted)]">
            Example: <span className="text-[color:var(--color-ink)]">62.4 / 100</span>
            means you expect the final 2036 index to end at 62.4 if this
            initiative passes.
          </p>
          <input
            className="w-full rounded-2xl border border-white/8 bg-[color:rgba(9,15,23,0.72)] px-4 py-3 text-[color:var(--color-ink)] outline-none transition placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-mint)]"
            defaultValue={initialPass ?? 50}
            max="100"
            min="0"
            name="pass_value"
            placeholder="e.g. 62.4"
            step="0.1"
            type="number"
          />
        </label>

        <label className="space-y-2 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
          <span className="text-sm font-medium text-[color:var(--color-ink)]">
            Predicted index score if voters reject it
          </span>
          <p className="text-sm text-[color:var(--color-muted)]">
            Example: <span className="text-[color:var(--color-ink)]">48.0 / 100</span>
            means you expect the final 2036 index to end at 48.0 if this
            initiative fails.
          </p>
          <input
            className="w-full rounded-2xl border border-white/8 bg-[color:rgba(9,15,23,0.72)] px-4 py-3 text-[color:var(--color-ink)] outline-none transition placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-gold)]"
            defaultValue={initialFail ?? 50}
            max="100"
            min="0"
            name="fail_value"
            placeholder="e.g. 48.0"
            step="0.1"
            type="number"
          />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-[#ef6b6b]/30 bg-[#ef6b6b]/8 px-4 py-3 text-sm text-[#ffb8b8]">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-2xl border border-[#45d7c0]/20 bg-[#45d7c0]/8 px-4 py-3 text-sm text-[#c0fff3]">
          {state.message}
        </p>
      ) : null}

      <SaveForecastButton />
    </form>
  );
}
