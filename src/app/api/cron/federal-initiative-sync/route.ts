import { NextResponse, type NextRequest } from "next/server";

import { getCronSecret } from "@/lib/env";
import { syncFederalInitiativesAndMetrics } from "@/lib/federal-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
export const runtime = "nodejs";

function authorizeCronRequest(request: NextRequest) {
  const cronSecret = getCronSecret();
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncFederalInitiativesAndMetrics();
    const hasMetricErrors = result.metricErrors.length > 0;

    return NextResponse.json(result, {
      status: hasMetricErrors ? 500 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Federal sync failed.",
      },
      { status: 500 },
    );
  }
}
