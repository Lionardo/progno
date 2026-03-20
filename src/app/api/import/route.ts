import { NextResponse, type NextRequest } from "next/server";

import { getCronSecret } from "@/lib/env";
import { getImportRun } from "@/lib/data";
import { fetchFederalInitiativesPreview } from "@/lib/initiative-import";
import { isAdminUser } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { InitiativeImportPreview } from "@/lib/types";

function readPreviewPayload(value: unknown): InitiativeImportPreview | null {
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

async function authorizeImportRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = getCronSecret();

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { ok: true as const };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminUser(user.id))) {
    return { ok: false as const };
  }

  return { ok: true as const };
}

export async function POST(request: NextRequest) {
  const auth = await authorizeImportRequest(request);

  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === "apply" ? "apply" : "preview";
  const admin = createAdminSupabaseClient();

  if (mode === "preview") {
    const { preview, rawPayload } = await fetchFederalInitiativesPreview();
    const { data, error } = await admin
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      preview,
      runId: data?.id ?? null,
    });
  }

  const runId = typeof body.runId === "string" ? body.runId : "";
  const run = await getImportRun(runId);

  if (!run) {
    return NextResponse.json({ error: "Import run not found." }, { status: 404 });
  }

  const preview = readPreviewPayload(run.preview_payload);

  if (!preview) {
    return NextResponse.json(
      { error: "Import preview payload is invalid." },
      { status: 400 },
    );
  }

  const { data: upsertedRows, error: upsertError } = await admin
    .from("initiatives")
    .upsert(preview.initiatives, { onConflict: "slug" })
    .select("id");

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("initiative_import_runs")
    .update({
      applied_initiative_ids: (upsertedRows ?? []).map((row) => row.id),
      error_message: null,
      status: "applied",
    })
    .eq("id", runId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    appliedIds: (upsertedRows ?? []).map((row) => row.id),
    status: "applied",
  });
}
