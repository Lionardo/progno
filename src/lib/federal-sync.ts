import { asErrorMessage } from "@/lib/utils";
import { fetchFederalInitiativesPreview } from "@/lib/initiative-import";
import { generateMetricProposal } from "@/lib/metrics";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { InitiativeRow } from "@/lib/types";

interface MetricSyncResult {
  error?: string;
  initiativeId: string;
  model?: string;
  slug: string;
  status: "created" | "skipped" | "error";
}

export interface FederalSyncResult {
  appliedCount: number;
  importRunId: string | null;
  metricErrors: string[];
  metricResults: MetricSyncResult[];
  newInitiativeCount: number;
  newInitiativeSlugs: string[];
  reusedImportRun: boolean;
  sourceHash: string;
  sourceKey: string;
}

async function createApprovedMetricForInitiative(initiative: InitiativeRow) {
  const admin = createAdminSupabaseClient();
  const { model, proposal } = await generateMetricProposal(initiative);
  const { error } = await admin.from("metric_versions").insert({
    ai_model: model,
    ai_rationale: proposal.thesis,
    approved_at: new Date().toISOString(),
    approved_by: null,
    components: proposal.components as unknown as Json,
    created_by: null,
    index_name: proposal.index_name,
    initiative_id: initiative.id,
    scale: "0-100",
    source_notes: proposal.source_notes,
    status: "approved",
    target_year: 2036,
  });

  if (error) {
    throw new Error(error.message);
  }

  return model;
}

export async function syncFederalInitiativesAndMetrics(): Promise<FederalSyncResult> {
  const admin = createAdminSupabaseClient();
  const { preview, rawPayload } = await fetchFederalInitiativesPreview();
  const previewSlugs = preview.initiatives.map((initiative) => initiative.slug);
  const { data: existingAppliedRunData, error: existingRunError } = await admin
    .from("initiative_import_runs")
    .select("id")
    .eq("source_hash", preview.source_hash)
    .eq("status", "applied")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRunError) {
    throw new Error(`Existing import run lookup failed: ${existingRunError.message}`);
  }

  const { data: existingInitiativeData, error: existingInitiativeError } = await admin
    .from("initiatives")
    .select("*")
    .in("slug", previewSlugs);

  if (existingInitiativeError) {
    throw new Error(`Existing initiative lookup failed: ${existingInitiativeError.message}`);
  }

  const existingInitiatives = (existingInitiativeData as InitiativeRow[] | null) ?? [];
  const existingSlugs = new Set(existingInitiatives.map((initiative) => initiative.slug));
  const newInitiativeSlugs = previewSlugs.filter((slug) => !existingSlugs.has(slug));
  const reusedImportRun = Boolean(existingAppliedRunData?.id);
  let importRunId = existingAppliedRunData?.id ?? null;

  if (!reusedImportRun) {
    const { data: importRunData, error: importRunError } = await admin
      .from("initiative_import_runs")
      .insert({
        preview_payload: preview as unknown as Json,
        raw_payload: rawPayload,
        source_hash: preview.source_hash,
        source_key: preview.source_key,
        source_url: preview.source_url,
        status: "previewed",
      })
      .select("id")
      .maybeSingle();

    if (importRunError) {
      throw new Error(`Import run insert failed: ${importRunError.message}`);
    }

    importRunId = importRunData?.id ?? null;
  }

  try {
    const { data: upsertedData, error: upsertError } = await admin
      .from("initiatives")
      .upsert(preview.initiatives, { onConflict: "slug" })
      .select("*");

    if (upsertError) {
      throw new Error(`Initiative upsert failed: ${upsertError.message}`);
    }

    const upsertedInitiatives = (upsertedData as InitiativeRow[] | null) ?? [];

    if (!reusedImportRun && importRunId) {
      const { error: applyUpdateError } = await admin
        .from("initiative_import_runs")
        .update({
          applied_initiative_ids: upsertedInitiatives.map((initiative) => initiative.id),
          error_message: null,
          status: "applied",
        })
        .eq("id", importRunId);

      if (applyUpdateError) {
        throw new Error(`Import run apply update failed: ${applyUpdateError.message}`);
      }
    }

    const { data: metricVersionData, error: metricVersionError } = await admin
      .from("metric_versions")
      .select("initiative_id, status")
      .in(
        "initiative_id",
        upsertedInitiatives.map((initiative) => initiative.id),
      );

    if (metricVersionError) {
      throw new Error(`Metric lookup failed: ${metricVersionError.message}`);
    }

    const approvedMetricIds = new Set(
      (metricVersionData ?? [])
        .filter((metric) => metric.status === "approved")
        .map((metric) => metric.initiative_id),
    );
    const initiativesNeedingMetrics = upsertedInitiatives.filter(
      (initiative) => !approvedMetricIds.has(initiative.id),
    );
    const metricResults: MetricSyncResult[] = [];
    const metricErrors: string[] = [];

    for (const initiative of upsertedInitiatives) {
      if (!initiativesNeedingMetrics.some((item) => item.id === initiative.id)) {
        metricResults.push({
          initiativeId: initiative.id,
          slug: initiative.slug,
          status: "skipped",
        });
        continue;
      }

      try {
        const model = await createApprovedMetricForInitiative(initiative);
        metricResults.push({
          initiativeId: initiative.id,
          model,
          slug: initiative.slug,
          status: "created",
        });
      } catch (error) {
        const message = asErrorMessage(
          error,
          `Metric generation failed for ${initiative.slug}.`,
        );
        metricErrors.push(`${initiative.slug}: ${message}`);
        metricResults.push({
          error: message,
          initiativeId: initiative.id,
          slug: initiative.slug,
          status: "error",
        });
      }
    }

    if (!reusedImportRun && importRunId && metricErrors.length > 0) {
      const { error: errorUpdateError } = await admin
        .from("initiative_import_runs")
        .update({
          error_message: metricErrors.join(" | "),
        })
        .eq("id", importRunId);

      if (errorUpdateError) {
        throw new Error(
          `Import run metric error update failed: ${errorUpdateError.message}`,
        );
      }
    }

    return {
      appliedCount: upsertedInitiatives.length,
      importRunId,
      metricErrors,
      metricResults,
      newInitiativeCount: newInitiativeSlugs.length,
      newInitiativeSlugs,
      reusedImportRun,
      sourceHash: preview.source_hash,
      sourceKey: preview.source_key,
    };
  } catch (error) {
    if (!reusedImportRun && importRunId) {
      await admin
        .from("initiative_import_runs")
        .update({
          error_message: asErrorMessage(error, "Federal sync failed."),
          status: "failed",
        })
        .eq("id", importRunId);
    }

    throw error;
  }
}
