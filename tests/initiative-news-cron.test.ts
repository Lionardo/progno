import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const getCronSecret = vi.fn();
const syncInitiativeNewsSnapshots = vi.fn();

vi.mock("@/lib/env", () => ({
  getCronSecret,
}));

vi.mock("@/lib/initiative-news", () => ({
  syncInitiativeNewsSnapshots,
}));

describe("initiative news cron route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthorized requests", async () => {
    getCronSecret.mockReturnValue("secret");

    const { GET } = await import("@/app/api/cron/initiative-news-sentiment/route");
    const response = await GET(
      new NextRequest("http://localhost/api/cron/initiative-news-sentiment"),
    );

    expect(response.status).toBe(401);
    expect(syncInitiativeNewsSnapshots).not.toHaveBeenCalled();
  });

  it("returns batch results and surfaces partial failures", async () => {
    getCronSecret.mockReturnValue("secret");
    syncInitiativeNewsSnapshots.mockResolvedValue({
      failureCount: 1,
      insufficientSignalCount: 0,
      processedCount: 2,
      results: [],
      scheduledFor: "2026-04-10",
      successCount: 1,
    });

    const { GET } = await import("@/app/api/cron/initiative-news-sentiment/route");
    const response = await GET(
      new NextRequest("http://localhost/api/cron/initiative-news-sentiment", {
        headers: {
          authorization: "Bearer secret",
        },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      failureCount: 1,
      successCount: 1,
    });
  });
});
