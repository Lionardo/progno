import { describe, expect, it } from "vitest";

import { buildMarketAggregate, buildMarketHistory } from "@/lib/market";
import { buildMockMarketState } from "@/lib/mock-market-data";
import type { ForecastRevisionRow, InitiativeRow } from "@/lib/types";

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

  it("provides demo market activity when a launch initiative has no live revisions yet", () => {
    const initiative = {
      created_at: "2026-02-11T09:00:00.000Z",
      id: "initiative-10m",
      market_closes_at: "2026-06-14T00:00:00+02:00",
      official_title: "Volksinitiative «Keine 10-Millionen-Schweiz!»",
      slug: "10-million-switzerland-initiative",
      source_locale: "de",
      source_url: "https://example.com/source",
      status: "published",
      summary_en: "Summary",
      type: "Popular Initiative",
      updated_at: "2026-02-11T09:00:00.000Z",
      vote_date: "2026-06-14",
    } satisfies InitiativeRow;
    const mockState = buildMockMarketState(initiative);

    expect(mockState?.marketSource).toBe("demo");
    expect(mockState?.history).toHaveLength(10);
    expect(mockState?.aggregate.forecastCount).toBe(29);
    expect(mockState?.aggregate.passAverage).toBeGreaterThan(
      mockState?.aggregate.failAverage ?? 0,
    );
  });
});
