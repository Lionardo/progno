"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { isMarketOpen } from "@/lib/dates";
import { forecastInputSchema } from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface ForecastActionState {
  error?: string;
  message?: string;
}

export async function upsertForecast(
  _previousState: ForecastActionState | undefined,
  formData: FormData,
): Promise<ForecastActionState> {
  const user = await requireUser();
  const initiativeId = String(formData.get("initiative_id") ?? "");
  const initiativeSlug = String(formData.get("initiative_slug") ?? "");
  const validated = forecastInputSchema.safeParse({
    fail_value: formData.get("fail_value"),
    pass_value: formData.get("pass_value"),
  });

  if (!initiativeId || !initiativeSlug) {
    return { error: "The target initiative is missing." };
  }

  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message ?? "Enter values from 0 to 100.",
    };
  }

  const admin = createAdminSupabaseClient();
  const { data: initiative, error: initiativeError } = await admin
    .from("initiatives")
    .select("id, market_closes_at")
    .eq("id", initiativeId)
    .maybeSingle();

  if (initiativeError || !initiative) {
    return { error: "The selected initiative could not be loaded." };
  }

  if (!isMarketOpen(initiative.market_closes_at)) {
    return { error: "This market is closed." };
  }

  const { data: existing, error: existingError } = await admin
    .from("forecasts")
    .select("id")
    .eq("initiative_id", initiativeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  const payload = {
    fail_value: validated.data.fail_value,
    initiative_id: initiativeId,
    pass_value: validated.data.pass_value,
    points_used: 1,
    updated_at: new Date().toISOString(),
    user_id: user.id,
  };

  const mutation = existing
    ? admin.from("forecasts").update(payload).eq("id", existing.id)
    : admin.from("forecasts").insert(payload);
  const { error } = await mutation;

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/initiatives/${initiativeSlug}`);
  revalidatePath("/admin/initiatives");

  return { message: "Forecast saved." };
}

