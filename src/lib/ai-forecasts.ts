import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { isMarketOpen } from "@/lib/dates";
import { getOpenAIForecastConfig } from "@/lib/env";
import { parseMetricVersion } from "@/lib/market";
import { aiForecastPredictionSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  AIForecastProvider,
  InitiativeRow,
  MetricVersionRow,
  RawMetricVersionRow,
} from "@/lib/types";
import { asErrorMessage, roundTo } from "@/lib/utils";

const AI_FORECAST_PROMPT_VERSION = "2026-04-14-v1";

interface ProviderPredictionInput {
  approvedMetric: MetricVersionRow;
  initiative: InitiativeRow;
}

interface ProviderPredictionOutput {
  failValue: number;
  model: string;
  passValue: number;
  promptVersion: string;
  provider: AIForecastProvider;
  rationale: string;
}

interface AIForecastProviderDefinition {
  generatePrediction: (
    input: ProviderPredictionInput,
  ) => Promise<ProviderPredictionOutput>;
  id: AIForecastProvider;
  isConfigured: () => boolean;
}

export interface AIForecastSyncItemResult {
  error?: string;
  initiativeId: string;
  model?: string;
  provider: AIForecastProvider;
  slug: string;
  status: "created" | "error" | "skipped" | "updated";
}

export interface AIForecastSyncResult {
  createdCount: number;
  failureCount: number;
  processedCount: number;
  results: AIForecastSyncItemResult[];
  skippedCount: number;
  updatedCount: number;
}

function describeMetricComponents(metric: MetricVersionRow) {
  return metric.components
    .map(
      (component) =>
        `- ${component.label} (${component.weight}%): ${component.direction === "higher_is_better" ? "higher is better" : "lower is better"}; source ${component.source}; rationale ${component.rationale}`,
    )
    .join("\n");
}

async function generateOpenAIForecast({
  approvedMetric,
  initiative,
}: ProviderPredictionInput): Promise<ProviderPredictionOutput> {
  const config = getOpenAIForecastConfig();

  if (!config) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    organization: config.organization,
    project: config.project,
  });

  const response = await client.responses.parse({
    model: config.model,
    instructions: [
      "You forecast Swiss public-interest welfare indices for a futarchy market.",
      "Return valid JSON only.",
      "Forecast the final 2036 index level on a 0-100 scale under both vote outcomes.",
      "Higher values always mean a better welfare outcome.",
      "Do not predict vote share or market consensus.",
      "Use the approved metric definition as the target, including component directions and weights.",
      "Keep the rationale concise and decision-useful for market participants.",
    ].join(" "),
    input: [
      {
        content: [
          {
            text: [
              `Initiative title: ${initiative.official_title}`,
              `Initiative type: ${initiative.type}`,
              `Vote date: ${initiative.vote_date}`,
              `Market closes at: ${initiative.market_closes_at}`,
              `English summary: ${initiative.summary_en}`,
              `Approved welfare index: ${approvedMetric.index_name}`,
              `Index thesis: ${approvedMetric.ai_rationale ?? "No thesis provided."}`,
              `Source notes: ${approvedMetric.source_notes ?? "No source notes provided."}`,
              "Index components:",
              describeMetricComponents(approvedMetric),
              "Task: estimate the final 2036 index value if the initiative passes and if it fails.",
            ].join("\n"),
            type: "input_text",
          },
        ],
        role: "user",
        type: "message",
      },
    ],
    text: {
      format: zodTextFormat(aiForecastPredictionSchema, "progno_ai_forecast"),
      verbosity: "medium",
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured AI forecast.");
  }

  return {
    failValue: roundTo(response.output_parsed.fail_value, 1),
    model: config.model,
    passValue: roundTo(response.output_parsed.pass_value, 1),
    promptVersion: AI_FORECAST_PROMPT_VERSION,
    provider: "openai",
    rationale: response.output_parsed.rationale.trim(),
  };
}

const AI_FORECAST_PROVIDERS: AIForecastProviderDefinition[] = [
  {
    generatePrediction: generateOpenAIForecast,
    id: "openai",
    isConfigured: () => Boolean(getOpenAIForecastConfig()),
  },
];

function getEnabledAIForecastProviders() {
  return AI_FORECAST_PROVIDERS.filter((provider) => provider.isConfigured());
}

async function fetchApprovedMetricsByInitiative(initiativeIds: string[]) {
  const admin = createAdminSupabaseClient();

  if (initiativeIds.length === 0) {
    return new Map<string, MetricVersionRow>();
  }

  const { data, error } = await admin
    .from("metric_versions")
    .select("*")
    .in("initiative_id", initiativeIds)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`AI forecast metric query failed: ${error.message}`);
  }

  const approvedMetrics = new Map<string, MetricVersionRow>();

  for (const row of (data ?? []) as RawMetricVersionRow[]) {
    const parsed = parseMetricVersion(row);

    if (parsed && !approvedMetrics.has(parsed.initiative_id)) {
      approvedMetrics.set(parsed.initiative_id, parsed);
    }
  }

  return approvedMetrics;
}

async function fetchSyncInitiatives() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("initiatives")
    .select("*")
    .eq("status", "published")
    .order("vote_date", { ascending: true });

  if (error) {
    throw new Error(`AI forecast initiative query failed: ${error.message}`);
  }

  return (data ?? []) as InitiativeRow[];
}

export async function syncInitiativeAIForecasts({
  force = false,
  initiatives,
}: {
  force?: boolean;
  initiatives?: InitiativeRow[];
} = {}): Promise<AIForecastSyncResult> {
  const providers = getEnabledAIForecastProviders();

  if (providers.length === 0) {
    return {
      createdCount: 0,
      failureCount: 0,
      processedCount: 0,
      results: [],
      skippedCount: 0,
      updatedCount: 0,
    };
  }

  const candidateInitiatives = (initiatives ?? (await fetchSyncInitiatives())).filter(
    (initiative) =>
      initiative.status === "published" && isMarketOpen(initiative.market_closes_at),
  );

  if (candidateInitiatives.length === 0) {
    return {
      createdCount: 0,
      failureCount: 0,
      processedCount: 0,
      results: [],
      skippedCount: 0,
      updatedCount: 0,
    };
  }

  const approvedMetrics = await fetchApprovedMetricsByInitiative(
    candidateInitiatives.map((initiative) => initiative.id),
  );
  const admin = createAdminSupabaseClient();
  const results: AIForecastSyncItemResult[] = [];
  const existingKeys = new Set<string>();
  const { data, error } = await admin
    .from("ai_model_forecasts")
    .select("initiative_id, provider")
    .in(
      "initiative_id",
      candidateInitiatives.map((initiative) => initiative.id),
    );

  if (error) {
    throw new Error(`AI forecast lookup failed: ${error.message}`);
  }

  for (const row of data ?? []) {
    existingKeys.add(`${row.initiative_id}:${row.provider}`);
  }

  for (const initiative of candidateInitiatives) {
    const approvedMetric = approvedMetrics.get(initiative.id);

    if (!approvedMetric) {
      for (const provider of providers) {
        results.push({
          initiativeId: initiative.id,
          provider: provider.id,
          slug: initiative.slug,
          status: "skipped",
        });
      }

      continue;
    }

    for (const provider of providers) {
      const key = `${initiative.id}:${provider.id}`;
      const hasExisting = existingKeys.has(key);

      if (!force && hasExisting) {
        results.push({
          initiativeId: initiative.id,
          provider: provider.id,
          slug: initiative.slug,
          status: "skipped",
        });
        continue;
      }

      try {
        const prediction = await provider.generatePrediction({
          approvedMetric,
          initiative,
        });
        const { error } = await admin.from("ai_model_forecasts").upsert(
          {
            fail_value: prediction.failValue,
            initiative_id: initiative.id,
            model: prediction.model,
            pass_value: prediction.passValue,
            prompt_version: prediction.promptVersion,
            provider: prediction.provider,
            rationale: prediction.rationale,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "initiative_id,provider" },
        );

        if (error) {
          throw new Error(error.message);
        }

        existingKeys.add(key);
        results.push({
          initiativeId: initiative.id,
          model: prediction.model,
          provider: prediction.provider,
          slug: initiative.slug,
          status: hasExisting ? "updated" : "created",
        });
      } catch (error) {
        results.push({
          error: asErrorMessage(error, "AI forecast generation failed."),
          initiativeId: initiative.id,
          provider: provider.id,
          slug: initiative.slug,
          status: "error",
        });
      }
    }
  }

  return {
    createdCount: results.filter((item) => item.status === "created").length,
    failureCount: results.filter((item) => item.status === "error").length,
    processedCount: results.length,
    results,
    skippedCount: results.filter((item) => item.status === "skipped").length,
    updatedCount: results.filter((item) => item.status === "updated").length,
  };
}

export async function ensureAIForecasts(initiatives: InitiativeRow[]) {
  try {
    return await syncInitiativeAIForecasts({
      force: false,
      initiatives,
    });
  } catch (error) {
    console.error(
      "AI forecast ensure failed:",
      asErrorMessage(error, "AI forecast ensure failed."),
    );

    return {
      createdCount: 0,
      failureCount: 1,
      processedCount: 0,
      results: [],
      skippedCount: 0,
      updatedCount: 0,
    } satisfies AIForecastSyncResult;
  }
}
