import { metricComponentSchema } from "@/lib/schemas";
import type {
  ForecastRevisionRow,
  MarketAggregate,
  MarketHistoryPoint,
  MetricComponent,
  MetricVersionRow,
  RawMetricVersionRow,
} from "@/lib/types";
import { roundTo } from "@/lib/utils";
import { toChartTimestamp } from "@/lib/dates";

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

function buildLatestForecastMap(revisions: ForecastRevisionRow[]) {
  const latestByForecast = new Map<string, ForecastRevisionRow>();

  for (const revision of revisions) {
    latestByForecast.set(revision.forecast_id, revision);
  }

  return latestByForecast;
}

export function buildMarketAggregate(
  revisions: ForecastRevisionRow[],
): MarketAggregate {
  const latestByForecast = buildLatestForecastMap(revisions);
  const latestValues = Array.from(latestByForecast.values());

  if (latestValues.length === 0) {
    return {
      failAverage: null,
      forecastCount: 0,
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
    failAverage,
    forecastCount: latestValues.length,
    lastUpdated,
    passAverage,
    spread: roundTo(passAverage - failAverage),
  };
}

export function buildMarketHistory(
  revisions: ForecastRevisionRow[],
): MarketHistoryPoint[] {
  const sortedRevisions = [...revisions].sort((left, right) => {
    const timeDiff =
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime();

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return left.id.localeCompare(right.id);
  });

  const latestByForecast = new Map<string, ForecastRevisionRow>();
  const history: MarketHistoryPoint[] = [];

  for (const revision of sortedRevisions) {
    latestByForecast.set(revision.forecast_id, revision);
    const latestValues = Array.from(latestByForecast.values());
    const passAverage =
      latestValues.reduce((sum, item) => sum + item.pass_value, 0) /
      latestValues.length;
    const failAverage =
      latestValues.reduce((sum, item) => sum + item.fail_value, 0) /
      latestValues.length;
    const point: MarketHistoryPoint = {
      failAverage: roundTo(failAverage),
      passAverage: roundTo(passAverage),
      sampleSize: latestValues.length,
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

export function describeMetricDirection(direction: MetricComponent["direction"]) {
  return direction === "higher_is_better"
    ? "Higher values raise the overall index"
    : "Lower values raise the overall index";
}
