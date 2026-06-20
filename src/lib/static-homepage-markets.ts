import { buildMockMarketState } from "@/lib/mock-market-data";
import type { InitiativeCardData, InitiativeRow, MetricVersionRow } from "@/lib/types";

const STATIC_INITIATIVES = [
  {
    created_at: "2026-01-15T10:00:00.000Z",
    id: "static-initiative-10-million-switzerland",
    market_closes_at: "2027-02-28T00:00:00.000Z",
    official_title: "No 10-million Switzerland",
    slug: "10-million-switzerland-initiative",
    source_locale: "en",
    source_url: "https://www.admin.ch/",
    status: "published",
    summary_en:
      "A population policy proposal used here as a public example market for forecasting long-run welfare outcomes under acceptance or rejection.",
    type: "Popular Initiative",
    updated_at: "2026-01-15T10:00:00.000Z",
    vote_date: "2027-02-28",
  },
  {
    created_at: "2026-01-15T10:00:00.000Z",
    id: "static-initiative-civilian-service",
    market_closes_at: "2027-06-13T00:00:00.000Z",
    official_title: "Civilian Service Act amendment",
    slug: "civilian-service-act-amendment",
    source_locale: "en",
    source_url: "https://www.admin.ch/",
    status: "published",
    summary_en:
      "A public-service reform example for comparing the expected welfare index if the measure passes versus if it fails.",
    type: "Optional Referendum",
    updated_at: "2026-01-15T10:00:00.000Z",
    vote_date: "2027-06-13",
  },
] satisfies InitiativeRow[];

const STATIC_METRICS = [
  {
    ai_model: null,
    ai_rationale:
      "A compact public welfare index balancing household prosperity, access to housing, infrastructure pressure, and institutional capacity.",
    approved_at: "2026-01-15T10:00:00.000Z",
    approved_by: null,
    components: [
      {
        direction: "higher_is_better",
        label: "Household prosperity",
        rationale: "Tracks whether disposable living standards improve.",
        source: "Federal statistical indicators",
        weight: 35,
      },
      {
        direction: "higher_is_better",
        label: "Housing access",
        rationale: "Captures affordability and availability of housing.",
        source: "Housing market indicators",
        weight: 30,
      },
      {
        direction: "lower_is_better",
        label: "Infrastructure pressure",
        rationale: "Measures strain on transport, utilities, and public services.",
        source: "Public infrastructure indicators",
        weight: 35,
      },
    ],
    created_at: "2026-01-15T10:00:00.000Z",
    created_by: null,
    id: "static-metric-10-million-switzerland",
    index_name: "Population Capacity Index",
    initiative_id: "static-initiative-10-million-switzerland",
    scale: "0-100",
    source_notes:
      "Static demo metric assembled from representative public-policy dimensions.",
    status: "approved",
    target_year: 2036,
  },
  {
    ai_model: null,
    ai_rationale:
      "A public resilience index comparing service capacity, administrative fairness, and fiscal pressure.",
    approved_at: "2026-01-15T10:00:00.000Z",
    approved_by: null,
    components: [
      {
        direction: "higher_is_better",
        label: "Service capacity",
        rationale: "Tracks whether essential public service capacity improves.",
        source: "Public service indicators",
        weight: 40,
      },
      {
        direction: "higher_is_better",
        label: "Administrative fairness",
        rationale: "Captures whether obligations remain predictable and equitable.",
        source: "Federal implementation indicators",
        weight: 30,
      },
      {
        direction: "lower_is_better",
        label: "Fiscal pressure",
        rationale: "Measures expected public cost pressure from implementation.",
        source: "Federal budget indicators",
        weight: 30,
      },
    ],
    created_at: "2026-01-15T10:00:00.000Z",
    created_by: null,
    id: "static-metric-civilian-service",
    index_name: "Public Service Resilience Index",
    initiative_id: "static-initiative-civilian-service",
    scale: "0-100",
    source_notes:
      "Static demo metric assembled from representative public-policy dimensions.",
    status: "approved",
    target_year: 2036,
  },
] satisfies MetricVersionRow[];

function buildStaticMarket(
  initiative: InitiativeRow,
  approvedMetric: MetricVersionRow,
): InitiativeCardData {
  const mockMarket = buildMockMarketState(initiative);

  if (!mockMarket) {
    throw new Error(`Missing static market history for ${initiative.slug}`);
  }

  return {
    aggregate: mockMarket.aggregate,
    aiAggregate: null,
    aiHistory: [],
    approvedMetric,
    history: mockMarket.history,
    initiative,
    marketSource: mockMarket.marketSource,
  };
}

export function listStaticHomepageMarkets(): InitiativeCardData[] {
  return STATIC_INITIATIVES.map((initiative) => {
    const approvedMetric = STATIC_METRICS.find(
      (metric) => metric.initiative_id === initiative.id,
    );

    if (!approvedMetric) {
      throw new Error(`Missing static metric for ${initiative.slug}`);
    }

    return buildStaticMarket(initiative, approvedMetric);
  });
}
