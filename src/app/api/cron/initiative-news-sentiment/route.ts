import { NextResponse, type NextRequest } from "next/server";

import { getCronSecret } from "@/lib/env";
import { syncInitiativeNewsSnapshots } from "@/lib/initiative-news";

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
    const result = await syncInitiativeNewsSnapshots();

    return NextResponse.json(result, {
      status: result.failureCount > 0 ? 500 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Initiative news sentiment sync failed.",
      },
      { status: 500 },
    );
  }
}
