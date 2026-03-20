import type {
  Inserts,
  Tables,
} from "@/lib/supabase/database.types";

export type InitiativeRow = Tables<"initiatives">;
export type ImportRunRow = Tables<"initiative_import_runs">;
export type RawMetricVersionRow = Tables<"metric_versions">;
export type ForecastRow = Tables<"forecasts">;
export type ForecastRevisionRow = Tables<"forecast_revisions">;

export type InitiativeInsert = Inserts<"initiatives">;

export type InitiativeStatus = InitiativeRow["status"];
export type InitiativeType = "Optional Referendum" | "Popular Initiative";
export type MetricDirection = "higher_is_better" | "lower_is_better";

export interface MetricComponent {
  direction: MetricDirection;
  label: string;
  rationale: string;
  source: string;
  weight: number;
}

export interface MetricProposal {
  components: MetricComponent[];
  index_name: string;
  source_notes: string;
  thesis: string;
}

export interface MetricVersionRow
  extends Omit<RawMetricVersionRow, "components"> {
  components: MetricComponent[];
}

export interface InitiativeImportItem {
  market_closes_at: string;
  official_title: string;
  slug: string;
  source_locale: string;
  source_url: string;
  status: InitiativeStatus;
  summary_en: string;
  type: InitiativeType;
  vote_date: string;
}

export interface InitiativeImportPreview {
  initiatives: InitiativeImportItem[];
  notes: string[];
  source_hash: string;
  source_key: string;
  source_published_at: string | null;
  source_url: string;
}

export interface MarketAggregate {
  failAverage: number | null;
  forecastCount: number;
  lastUpdated: string | null;
  passAverage: number | null;
  spread: number | null;
}

export interface MarketHistoryPoint {
  failAverage: number;
  passAverage: number;
  sampleSize: number;
  time: number;
}

export interface InitiativeCardData {
  aggregate: MarketAggregate;
  approvedMetric: MetricVersionRow | null;
  history: MarketHistoryPoint[];
  initiative: InitiativeRow;
}

export interface InitiativeDetailData extends InitiativeCardData {
  latestForecast: ForecastRow | null;
}

export interface AdminInitiativeOverview extends InitiativeCardData {
  draftMetricCount: number;
  latestImportRun: ImportRunRow | null;
}

export interface AdminInitiativePageData extends InitiativeDetailData {
  importRuns: ImportRunRow[];
  metrics: MetricVersionRow[];
}

