import { metricComponentSchema } from "@/lib/schemas";
import type {
  AIForecastAggregate,
  AIForecastHistoryPoint,
  AIForecastRevisionRow,
  ForecastRevisionRow,
  MarketAggregate,
  MarketHistoryPoint,
  MetricComponent,
  MetricVersionRow,
  RawMetricVersionRow,
} from "@/lib/types";
import { roundTo } from "@/lib/utils";
import { toChartTimestamp } from "@/lib/dates";

interface ConditionalRevisionLike {
  created_at: string;
  fail_value: number;
  id: string;
  pass_value: number;
}

export function parseMetricVersion(
  row: RawMetricVersionRow | null,
): MetricVersionRow | null {
  if (!row) {
    return null;
  }

  const parsedComponents = metricComponentSchema.array().safeParse(row.components);

  return {
    ...row,
    components: parsedComponents.success ? parsedComponents.data : [],
  };
}

function buildLatestRevisionMap<T extends ConditionalRevisionLike>(
  revisions: T[],
  getKey: (revision: T) => string,
) {
  const latestByKey = new Map<string, T>();

  for (const revision of revisions) {
    latestByKey.set(getKey(revision), revision);
  }

  return latestByKey;
}

function buildConditionalAggregateBase<T extends ConditionalRevisionLike>(
  revisions: T[],
  getKey: (revision: T) => string,
) {
  const latestByKey = buildLatestRevisionMap(revisions, getKey);
  const latestValues = Array.from(latestByKey.values());

  if (latestValues.length === 0) {
    return {
      count: 0,
      failAverage: null,
      lastUpdated: null,
      passAverage: null,
      spread: null,
    };
  }

  const passAverage = roundTo(
    latestValues.reduce((sum, item) => sum + item.pass_value, 0) /
      latestValues.length,
  );
  const failAverage = roundTo(
    latestValues.reduce((sum, item) => sum + item.fail_value, 0) /
      latestValues.length,
  );
  const lastUpdated = latestValues
    .map((item) => item.created_at)
    .sort((left, right) => right.localeCompare(left))[0];

  return {
    count: latestValues.length,
    failAverage,
    lastUpdated,
    passAverage,
    spread: roundTo(passAverage - failAverage),
  };
}

function buildConditionalHistoryBase<T extends ConditionalRevisionLike>(
  revisions: T[],
  getKey: (revision: T) => string,
) {
  const sortedRevisions = [...revisions].sort((left, right) => {
    const timeDiff =
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime();

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return left.id.localeCompare(right.id);
  });
  const latestByKey = new Map<string, T>();
  const history: Array<{
    count: number;
    failAverage: number;
    passAverage: number;
    time: number;
  }> = [];

  for (const revision of sortedRevisions) {
    latestByKey.set(getKey(revision), revision);
    const latestValues = Array.from(latestByKey.values());
    const passAverage =
      latestValues.reduce((sum, item) => sum + item.pass_value, 0) /
      latestValues.length;
    const failAverage =
      latestValues.reduce((sum, item) => sum + item.fail_value, 0) /
      latestValues.length;
    const point = {
      count: latestValues.length,
      failAverage: roundTo(failAverage),
      passAverage: roundTo(passAverage),
      time: toChartTimestamp(revision.created_at),
    };
    const previousPoint = history.at(-1);

    if (previousPoint?.time === point.time) {
      history[history.length - 1] = point;
    } else {
      history.push(point);
    }
  }

  return history;
}

export function buildMarketAggregate(
  revisions: ForecastRevisionRow[],
): MarketAggregate {
  const aggregate = buildConditionalAggregateBase(
    revisions,
    (revision) => revision.forecast_id,
  );

  return {
    failAverage: aggregate.failAverage,
    forecastCount: aggregate.count,
    lastUpdated: aggregate.lastUpdated,
    passAverage: aggregate.passAverage,
    spread: aggregate.spread,
  };
}

export function buildMarketHistory(
  revisions: ForecastRevisionRow[],
): MarketHistoryPoint[] {
  return buildConditionalHistoryBase(
    revisions,
    (revision) => revision.forecast_id,
  ).map((point) => ({
    failAverage: point.failAverage,
    passAverage: point.passAverage,
    sampleSize: point.count,
    time: point.time,
  }));
}

export function buildAIForecastAggregate(
  revisions: AIForecastRevisionRow[],
): AIForecastAggregate | null {
  const aggregate = buildConditionalAggregateBase(
    revisions,
    (revision) => revision.provider,
  );

  if (aggregate.count === 0) {
    return null;
  }

  return {
    failAverage: aggregate.failAverage,
    lastUpdated: aggregate.lastUpdated,
    passAverage: aggregate.passAverage,
    providerCount: aggregate.count,
    spread: aggregate.spread,
  };
}

export function buildAIForecastHistory(
  revisions: AIForecastRevisionRow[],
): AIForecastHistoryPoint[] {
  return buildConditionalHistoryBase(
    revisions,
    (revision) => revision.provider,
  ).map((point) => ({
    failAverage: point.failAverage,
    passAverage: point.passAverage,
    providerCount: point.count,
    time: point.time,
  }));
}

export function describeMetricDirection(direction: MetricComponent["direction"]) {
  return direction === "higher_is_better"
    ? "Higher values raise the overall index"
    : "Lower values raise the overall index";
}
