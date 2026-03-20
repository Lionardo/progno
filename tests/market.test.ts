import { describe, expect, it } from "vitest";

import { buildMarketAggregate, buildMarketHistory } from "@/lib/market";
import type { ForecastRevisionRow } from "@/lib/types";

const revisions: ForecastRevisionRow[] = [
  {
    created_at: "2026-03-20T10:00:00.000Z",
    fail_value: 48,
    forecast_id: "forecast-1",
    id: "rev-1",
    initiative_id: "initiative-1",
    pass_value: 54,
    points_used: 1,
  },
  {
    created_at: "2026-03-20T11:00:00.000Z",
    fail_value: 46,
    forecast_id: "forecast-2",
    id: "rev-2",
    initiative_id: "initiative-1",
    pass_value: 58,
    points_used: 1,
  },
  {
    created_at: "2026-03-20T12:00:00.000Z",
    fail_value: 50,
    forecast_id: "forecast-1",
    id: "rev-3",
    initiative_id: "initiative-1",
    pass_value: 60,
    points_used: 1,
  },
];

describe("market aggregation", () => {
  it("uses the latest revision per forecast to compute aggregate values", () => {
    const aggregate = buildMarketAggregate(revisions);

    expect(aggregate.forecastCount).toBe(2);
    expect(aggregate.passAverage).toBe(59);
    expect(aggregate.failAverage).toBe(48);
    expect(aggregate.spread).toBe(11);
  });

  it("builds historical points from each revision", () => {
    const history = buildMarketHistory(revisions);

    expect(history).toHaveLength(3);
    expect(history[0]?.passAverage).toBe(54);
    expect(history[1]?.passAverage).toBe(56);
    expect(history[2]?.passAverage).toBe(59);
  });
});

