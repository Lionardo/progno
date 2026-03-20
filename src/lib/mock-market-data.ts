import { toChartTimestamp } from "@/lib/dates";
import type {
  InitiativeRow,
  MarketAggregate,
  MarketHistoryPoint,
} from "@/lib/types";
import { roundTo } from "@/lib/utils";

interface MockMarketPointTemplate {
  daysAgo: number;
  failAverage: number;
  passAverage: number;
  sampleSize: number;
}

interface MockMarketState {
  aggregate: MarketAggregate;
  history: MarketHistoryPoint[];
  marketSource: "demo";
}

const MOCK_MARKET_TEMPLATES: Record<string, MockMarketPointTemplate[]> = {
  "10-million-switzerland-initiative": [
    { daysAgo: -49, failAverage: 50.6, passAverage: 52.1, sampleSize: 6 },
    { daysAgo: -42, failAverage: 49.8, passAverage: 53.0, sampleSize: 9 },
    { daysAgo: -35, failAverage: 48.9, passAverage: 54.2, sampleSize: 12 },
    { daysAgo: -29, failAverage: 48.4, passAverage: 54.9, sampleSize: 14 },
    { daysAgo: -23, failAverage: 47.6, passAverage: 55.8, sampleSize: 17 },
    { daysAgo: -18, failAverage: 46.9, passAverage: 56.6, sampleSize: 19 },
    { daysAgo: -13, failAverage: 46.3, passAverage: 57.4, sampleSize: 22 },
    { daysAgo: -9, failAverage: 45.7, passAverage: 58.0, sampleSize: 24 },
    { daysAgo: -5, failAverage: 45.0, passAverage: 58.8, sampleSize: 27 },
    { daysAgo: -2, failAverage: 44.6, passAverage: 59.4, sampleSize: 29 },
  ],
  "civilian-service-act-amendment": [
    { daysAgo: -49, failAverage: 54.3, passAverage: 49.1, sampleSize: 5 },
    { daysAgo: -42, failAverage: 54.9, passAverage: 49.4, sampleSize: 7 },
    { daysAgo: -35, failAverage: 55.4, passAverage: 49.8, sampleSize: 10 },
    { daysAgo: -29, failAverage: 55.8, passAverage: 50.2, sampleSize: 12 },
    { daysAgo: -23, failAverage: 56.1, passAverage: 50.1, sampleSize: 15 },
    { daysAgo: -18, failAverage: 56.5, passAverage: 50.4, sampleSize: 18 },
    { daysAgo: -13, failAverage: 57.0, passAverage: 50.7, sampleSize: 20 },
    { daysAgo: -9, failAverage: 57.4, passAverage: 51.0, sampleSize: 22 },
    { daysAgo: -5, failAverage: 57.7, passAverage: 51.2, sampleSize: 24 },
    { daysAgo: -2, failAverage: 58.1, passAverage: 51.4, sampleSize: 26 },
  ],
};

function buildAnchorDate() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 11, 0, 0),
  );
}

export function buildMockMarketState(
  initiative: InitiativeRow,
): MockMarketState | null {
  const template = MOCK_MARKET_TEMPLATES[initiative.slug];

  if (!template) {
    return null;
  }

  const anchorDate = buildAnchorDate();
  const history = template.map((point) => {
    const at = new Date(anchorDate);
    at.setUTCDate(anchorDate.getUTCDate() + point.daysAgo);

    return {
      failAverage: point.failAverage,
      passAverage: point.passAverage,
      sampleSize: point.sampleSize,
      time: toChartTimestamp(at.toISOString()),
    } satisfies MarketHistoryPoint;
  });

  const lastTemplatePoint = template.at(-1);

  if (!lastTemplatePoint) {
    return null;
  }

  const lastUpdatedAt = new Date(anchorDate);
  lastUpdatedAt.setUTCDate(anchorDate.getUTCDate() + lastTemplatePoint.daysAgo);

  return {
    aggregate: {
      failAverage: lastTemplatePoint.failAverage,
      forecastCount: lastTemplatePoint.sampleSize,
      lastUpdated: lastUpdatedAt.toISOString(),
      passAverage: lastTemplatePoint.passAverage,
      spread: roundTo(
        lastTemplatePoint.passAverage - lastTemplatePoint.failAverage,
      ),
    },
    history,
    marketSource: "demo",
  };
}
