import { ensureBaselineMetrics } from "@/lib/baseline-metrics";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildMarketAggregate, buildMarketHistory, parseMetricVersion } from "@/lib/market";
import type {
  AdminInitiativeOverview,
  AdminInitiativePageData,
  ForecastRow,
  ForecastRevisionRow,
  ImportRunRow,
  InitiativeCardData,
  InitiativeDetailData,
  InitiativeRow,
  MetricVersionRow,
  RawMetricVersionRow,
} from "@/lib/types";

function requireData<T>(data: T, error: { message: string } | null, label: string) {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }

  return data;
}

function groupRevisionsByInitiative(revisions: ForecastRevisionRow[]) {
  const grouped = new Map<string, ForecastRevisionRow[]>();

  for (const revision of revisions) {
    const current = grouped.get(revision.initiative_id) ?? [];
    current.push(revision);
    grouped.set(revision.initiative_id, current);
  }

  return grouped;
}

function groupMetricsByInitiative(metricRows: RawMetricVersionRow[]) {
  const approvedMetric = new Map<string, MetricVersionRow>();
  const metricRowsByInitiative = new Map<string, MetricVersionRow[]>();

  for (const row of metricRows) {
    const parsed = parseMetricVersion(row);

    if (!parsed) {
      continue;
    }

    const current = metricRowsByInitiative.get(parsed.initiative_id) ?? [];
    current.push(parsed);
    metricRowsByInitiative.set(parsed.initiative_id, current);

    if (parsed.status === "approved" && !approvedMetric.has(parsed.initiative_id)) {
      approvedMetric.set(parsed.initiative_id, parsed);
    }
  }

  return { approvedMetric, metricRowsByInitiative };
}

function runMentionsInitiative(run: ImportRunRow, initiative: InitiativeRow) {
  if (run.applied_initiative_ids?.includes(initiative.id)) {
    return true;
  }

  if (
    typeof run.preview_payload !== "object" ||
    run.preview_payload === null ||
    !("initiatives" in run.preview_payload)
  ) {
    return false;
  }

  const payload = run.preview_payload as {
    initiatives?: Array<{ slug?: string }>;
  };

  return payload.initiatives?.some((item) => item.slug === initiative.slug) ?? false;
}

function decorateInitiative(
  initiative: InitiativeRow,
  approvedMetric: MetricVersionRow | null,
  revisions: ForecastRevisionRow[],
): InitiativeCardData {
  return {
    aggregate: buildMarketAggregate(revisions),
    approvedMetric,
    history: buildMarketHistory(revisions),
    initiative,
  };
}

async function fetchSupportingRows(initiativeIds: string[]) {
  const admin = createAdminSupabaseClient();

  if (initiativeIds.length === 0) {
    return {
      metricRows: [] as RawMetricVersionRow[],
      revisions: [] as ForecastRevisionRow[],
    };
  }

  const [{ data: metricRows, error: metricError }, { data: revisions, error: revisionError }] =
    await Promise.all([
      admin
        .from("metric_versions")
        .select("*")
        .in("initiative_id", initiativeIds)
        .order("created_at", { ascending: false }),
      admin
        .from("forecast_revisions")
        .select("*")
        .in("initiative_id", initiativeIds)
        .order("created_at", { ascending: true }),
    ]);

  return {
    metricRows: requireData(
      metricRows ?? [],
      metricError,
      "Metric query failed",
    ) as RawMetricVersionRow[],
    revisions: requireData(
      revisions ?? [],
      revisionError,
      "Forecast history query failed",
    ) as ForecastRevisionRow[],
  };
}

export async function listHomepageMarkets() {
  const admin = createAdminSupabaseClient();
  const { data: initiatives, error } = await admin
    .from("initiatives")
    .select("*")
    .eq("status", "published")
    .order("vote_date", { ascending: true });

  const initiativeRows = requireData(
    initiatives ?? [],
    error,
    "Initiative query failed",
  ) as InitiativeRow[];
  await ensureBaselineMetrics(initiativeRows);
  const { metricRows, revisions } = await fetchSupportingRows(
    initiativeRows.map((initiative) => initiative.id),
  );
  const revisionsByInitiative = groupRevisionsByInitiative(revisions);
  const { approvedMetric } = groupMetricsByInitiative(metricRows);

  return initiativeRows.map((initiative) =>
    decorateInitiative(
      initiative,
      approvedMetric.get(initiative.id) ?? null,
      revisionsByInitiative.get(initiative.id) ?? [],
    ),
  );
}

export async function getPublishedInitiativeDetail(
  slug: string,
  userId?: string,
): Promise<InitiativeDetailData | null> {
  const admin = createAdminSupabaseClient();
  const { data: initiativeData, error } = await admin
    .from("initiatives")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  const initiative = (initiativeData as InitiativeRow | null) ?? null;

  if (error) {
    throw new Error(`Initiative query failed: ${error.message}`);
  }

  if (!initiative) {
    return null;
  }

  await ensureBaselineMetrics([initiative]);

  const [{ metricRows, revisions }, forecastResult] = await Promise.all([
    fetchSupportingRows([initiative.id]),
    userId
      ? admin
          .from("forecasts")
          .select("*")
          .eq("initiative_id", initiative.id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (forecastResult.error) {
    throw new Error(`Forecast query failed: ${forecastResult.error.message}`);
  }

  const { approvedMetric } = groupMetricsByInitiative(metricRows);
  const base = decorateInitiative(
    initiative,
    approvedMetric.get(initiative.id) ?? null,
    revisions,
  );

  return {
    ...base,
    latestForecast: (forecastResult.data as ForecastRow | null) ?? null,
  };
}

export async function listRecentImportRuns(limit = 8): Promise<ImportRunRow[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("initiative_import_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return requireData(data ?? [], error, "Import run query failed") as ImportRunRow[];
}

export async function getLatestPreviewRun(): Promise<ImportRunRow | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("initiative_import_runs")
    .select("*")
    .eq("status", "previewed")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(`Latest preview query failed: ${error.message}`);
  }

  return (data as ImportRunRow | null) ?? null;
}

export async function getImportRun(runId: string): Promise<ImportRunRow | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("initiative_import_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    throw new Error(`Import run lookup failed: ${error.message}`);
  }

  return (data as ImportRunRow | null) ?? null;
}

export async function getAdminDashboardData() {
  const [initiatives, importRuns] = await Promise.all([
    (async () => {
      const admin = createAdminSupabaseClient();
      const { data, error } = await admin
        .from("initiatives")
        .select("*")
        .order("vote_date", { ascending: true });

      return requireData(
        data ?? [],
        error,
        "Admin initiative query failed",
      ) as InitiativeRow[];
    })(),
    listRecentImportRuns(),
  ]);

  await ensureBaselineMetrics(initiatives);

  const { metricRows, revisions } = await fetchSupportingRows(
    initiatives.map((initiative) => initiative.id),
  );
  const { approvedMetric, metricRowsByInitiative } = groupMetricsByInitiative(metricRows);
  const revisionsByInitiative = groupRevisionsByInitiative(revisions);

  const items: AdminInitiativeOverview[] = initiatives.map((initiative) => {
    const base = decorateInitiative(
      initiative,
      approvedMetric.get(initiative.id) ?? null,
      revisionsByInitiative.get(initiative.id) ?? [],
    );
    const metrics = metricRowsByInitiative.get(initiative.id) ?? [];

    return {
      ...base,
      draftMetricCount: metrics.filter((metric) => metric.status === "draft").length,
      latestImportRun:
        importRuns.find((run) => runMentionsInitiative(run, initiative)) ?? null,
    };
  });

  return {
    importRuns,
    initiatives: items,
    latestPreviewRun: importRuns.find((run) => run.status === "previewed") ?? null,
  };
}

export async function getAdminInitiativePage(
  initiativeId: string,
  userId?: string,
): Promise<AdminInitiativePageData | null> {
  const admin = createAdminSupabaseClient();
  const { data: initiativeData, error } = await admin
    .from("initiatives")
    .select("*")
    .eq("id", initiativeId)
    .maybeSingle();
  const initiative = (initiativeData as InitiativeRow | null) ?? null;

  if (error) {
    throw new Error(`Admin initiative query failed: ${error.message}`);
  }

  if (!initiative) {
    return null;
  }

  await ensureBaselineMetrics([initiative]);

  const [{ metricRows, revisions }, importRuns, forecastResult] = await Promise.all([
    fetchSupportingRows([initiative.id]),
    listRecentImportRuns(12),
    userId
      ? admin
          .from("forecasts")
          .select("*")
          .eq("initiative_id", initiative.id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (forecastResult.error) {
    throw new Error(`Admin forecast query failed: ${forecastResult.error.message}`);
  }

  const { approvedMetric, metricRowsByInitiative } = groupMetricsByInitiative(metricRows);
  const metrics = metricRowsByInitiative.get(initiative.id) ?? [];
  const base = decorateInitiative(
    initiative,
    approvedMetric.get(initiative.id) ?? null,
    revisions,
  );

  return {
    ...base,
    importRuns: importRuns.filter((run) => runMentionsInitiative(run, initiative)),
    latestForecast: (forecastResult.data as ForecastRow | null) ?? null,
    metrics,
  };
}
