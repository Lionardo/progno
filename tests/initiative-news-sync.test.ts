import { describe, expect, it } from "vitest";

import { syncInitiativeNewsSnapshots } from "@/lib/initiative-news";
import type { InitiativeRow } from "@/lib/types";

function buildInitiative(id: string, slug: string): InitiativeRow {
  return {
    created_at: "2026-04-01T08:00:00.000Z",
    id,
    market_closes_at: "2026-06-14T00:00:00.000Z",
    official_title: `Initiative ${slug}`,
    slug,
    source_locale: "de",
    source_url: `https://www.admin.ch/${slug}`,
    status: "published",
    summary_en: `Summary for ${slug}`,
    type: "Popular Initiative",
    updated_at: "2026-04-01T08:00:00.000Z",
    vote_date: "2026-06-14",
  };
}

function createSyncAdmin(initiatives: InitiativeRow[]) {
  const upserts: Array<{ options: unknown; payload: unknown }> = [];

  const admin = {
    from(table: string) {
      if (table === "initiatives") {
        const query = {
          eq() {
            return query;
          },
          gt() {
            return query;
          },
          order() {
            return Promise.resolve({ data: initiatives, error: null });
          },
          select() {
            return query;
          },
        };

        return query;
      }

      if (table === "initiative_news_snapshots") {
        return {
          upsert(payload: unknown, options: unknown) {
            upserts.push({ options, payload });

            return Promise.resolve({ error: null });
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { admin, upserts };
}

describe("initiative news sync", () => {
  it("continues after per-initiative failures and upserts one row per initiative/day", async () => {
    const initiatives = [
      buildInitiative("initiative-1", "first"),
      buildInitiative("initiative-2", "second"),
    ];
    const { admin, upserts } = createSyncAdmin(initiatives);
    const now = new Date("2026-04-10T22:30:00.000Z");
    const result = await syncInitiativeNewsSnapshots({
      admin,
      analyzeInitiativeNews: async (initiative) => {
        if (initiative.slug === "second") {
          throw new Error("OpenAI unavailable");
        }

        return {
          articleCount: 4,
          confidenceScore: 0.72,
          keyThemes: ["campaign tone", "welfare framing"],
          sentimentScore: 38,
          sources: [
            {
              cited: true,
              domain: "srf.ch",
              title: "SRF report",
              url: "https://www.srf.ch/news/first",
            },
            {
              cited: true,
              domain: "nzz.ch",
              title: "NZZ report",
              url: "https://www.nzz.ch/first",
            },
          ],
          summaryEn: "Recent coverage has tilted positive.",
        };
      },
      now,
    });

    expect(result.processedCount).toBe(2);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(upserts).toHaveLength(2);
    expect(upserts[0]?.options).toEqual({
      onConflict: "initiative_id,scheduled_for",
    });
    expect(upserts[0]?.payload).toMatchObject({
      scheduled_for: "2026-04-11",
      status: "succeeded",
    });
    expect(upserts[1]?.payload).toMatchObject({
      error_message: "OpenAI unavailable",
      scheduled_for: "2026-04-11",
      status: "failed",
    });
  });

  it("downgrades low-signal coverage to insufficient_signal", async () => {
    const { admin, upserts } = createSyncAdmin([
      buildInitiative("initiative-1", "single-domain"),
    ]);
    const result = await syncInitiativeNewsSnapshots({
      admin,
      analyzeInitiativeNews: async () => ({
        articleCount: 2,
        confidenceScore: 0.82,
        keyThemes: ["campaign positioning"],
        sentimentScore: 44,
        sources: [
          {
            cited: true,
            domain: "srf.ch",
            title: "SRF only",
            url: "https://www.srf.ch/news/single-domain",
          },
        ],
        summaryEn: "Coverage is too thin to publish a directional score.",
      }),
      now: new Date("2026-04-10T06:00:00.000Z"),
    });

    expect(result.insufficientSignalCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(upserts[0]?.payload).toMatchObject({
      sentiment_label: "insufficient_signal",
      sentiment_score: null,
      status: "insufficient_signal",
    });
  });
});
