"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { getImportRun } from "@/lib/data";
import { fetchFederalInitiativesPreview } from "@/lib/initiative-import";
import { generateMetricProposal } from "@/lib/metrics";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { InitiativeImportPreview, InitiativeRow } from "@/lib/types";

export interface AdminActionState {
  error?: string;
  message?: string;
}

function readPreviewPayload(
  value: unknown,
): InitiativeImportPreview | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("initiatives" in value) ||
    !Array.isArray(value.initiatives)
  ) {
    return null;
  }

  return value as InitiativeImportPreview;
}

export async function runInitiativeImport(
  previousState: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  void previousState;
  void formData;
  const adminUser = await requireAdmin();
  const admin = createAdminSupabaseClient();

  try {
    const { preview, rawPayload } = await fetchFederalInitiativesPreview();
    const { error } = await admin.from("initiative_import_runs").insert({
      preview_payload: preview as unknown as Json,
      raw_payload: rawPayload,
      source_hash: preview.source_hash,
      source_key: preview.source_key,
      source_url: preview.source_url,
      status: "previewed",
      triggered_by: adminUser.id,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin/initiatives");

    return {
      message: `Import preview created with ${preview.initiatives.length} initiative rows.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Import preview failed.",
    };
  }
}

export async function applyInitiativeImport(
  _previousState: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const adminUser = await requireAdmin();
  const runId = String(formData.get("run_id") ?? "");

  if (!runId) {
    return { error: "No import preview was selected." };
  }

  const run = await getImportRun(runId);

  if (!run) {
    return { error: "The selected import preview could not be found." };
  }

  const preview = readPreviewPayload(run.preview_payload);

  if (!preview) {
    return { error: "The selected import preview payload is invalid." };
  }

  const admin = createAdminSupabaseClient();
  const { data: upsertedRows, error: upsertError } = await admin
    .from("initiatives")
    .upsert(preview.initiatives, { onConflict: "slug" })
    .select("id");

  if (upsertError) {
    return { error: upsertError.message };
  }

  const { error: updateError } = await admin
    .from("initiative_import_runs")
    .update({
      applied_initiative_ids: (upsertedRows ?? []).map((row) => row.id),
      error_message: null,
      status: "applied",
      triggered_by: adminUser.id,
    })
    .eq("id", runId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/initiatives");

  return { message: "Import preview applied to initiatives." };
}

export async function generateMetricProposalAction(
  _previousState: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const adminUser = await requireAdmin();
  const initiativeId = String(formData.get("initiative_id") ?? "");

  if (!initiativeId) {
    return { error: "No initiative was selected." };
  }

  const admin = createAdminSupabaseClient();
  const { data: initiativeData, error: initiativeError } = await admin
    .from("initiatives")
    .select("*")
    .eq("id", initiativeId)
    .maybeSingle();
  const initiative = (initiativeData as InitiativeRow | null) ?? null;

  if (initiativeError || !initiative) {
    return { error: "The initiative could not be loaded." };
  }

  try {
    const { model, proposal } = await generateMetricProposal(initiative);
    const { error } = await admin.from("metric_versions").insert({
      ai_model: model,
      ai_rationale: proposal.thesis,
      components: proposal.components as unknown as Json,
      created_by: adminUser.id,
      index_name: proposal.index_name,
      initiative_id: initiative.id,
      scale: "0-100",
      source_notes: proposal.source_notes,
      status: "draft",
      target_year: 2036,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin/initiatives");
    revalidatePath(`/admin/initiatives/${initiative.id}`);

    return { message: `Draft metric generated for ${initiative.official_title}.` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Metric generation failed.",
    };
  }
}

export async function approveMetricAction(
  _previousState: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const adminUser = await requireAdmin();
  const metricId = String(formData.get("metric_id") ?? "");
  const initiativeId = String(formData.get("initiative_id") ?? "");
  const initiativeSlug = String(formData.get("initiative_slug") ?? "");

  if (!metricId || !initiativeId || !initiativeSlug) {
    return { error: "Metric approval is missing context." };
  }

  const admin = createAdminSupabaseClient();
  const { error: rejectError } = await admin
    .from("metric_versions")
    .update({ status: "rejected" })
    .eq("initiative_id", initiativeId)
    .eq("status", "approved")
    .neq("id", metricId);

  if (rejectError) {
    return { error: rejectError.message };
  }

  const { error: approveError } = await admin
    .from("metric_versions")
    .update({
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
      status: "approved",
    })
    .eq("id", metricId);

  if (approveError) {
    return { error: approveError.message };
  }

  revalidatePath("/");
  revalidatePath(`/initiatives/${initiativeSlug}`);
  revalidatePath("/admin/initiatives");
  revalidatePath(`/admin/initiatives/${initiativeId}`);

  return { message: "Metric approved and published." };
}
