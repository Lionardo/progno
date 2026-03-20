import { describeMetricDirection } from "@/lib/market";
import type { MetricComponent } from "@/lib/types";

interface MetricComponentsProps {
  components: MetricComponent[];
}

export function MetricComponents({ components }: MetricComponentsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {components.map((component) => (
        <article
          className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4"
          key={`${component.label}-${component.weight}`}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-medium text-[color:var(--color-ink)]">
              {component.label}
            </h3>
            <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-gold)]">
              {component.weight}%
            </div>
          </div>
          <p className="text-sm text-[color:var(--color-muted)]">
            {component.rationale}
          </p>
          <div className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-ink)]">
            Direction
          </div>
          <div className="mt-1 text-xs text-[color:var(--color-muted)]">
            {describeMetricDirection(component.direction)}
          </div>
          <div className="mt-4 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            {component.source}
          </div>
        </article>
      ))}
    </div>
  );
}
