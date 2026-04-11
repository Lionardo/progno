import { describe, expect, it } from "vitest";

import {
  deriveInitiativeNewsSentimentLabel,
  getInitiativeNewsScheduledFor,
  isInitiativeNewsSourceFresh,
  parseInitiativeNewsSnapshot,
  shouldMarkInitiativeNewsAsInsufficientSignal,
} from "@/lib/initiative-news";
import { initiativeNewsAnalysisSchema } from "@/lib/schemas";
import type { RawInitiativeNewsSnapshotRow } from "@/lib/types";

describe("initiative news helpers", () => {
  it("maps sentiment scores to stable public labels", () => {
    expect(deriveInitiativeNewsSentimentLabel(34)).toBe("positive");
    expect(deriveInitiativeNewsSentimentLabel(-26)).toBe("negative");
    expect(deriveInitiativeNewsSentimentLabel(8)).toBe("mixed");
  });

  it("uses Zurich local date for scheduled snapshots", () => {
    expect(
      getInitiativeNewsScheduledFor(new Date("2026-04-10T22:30:00.000Z")),
    ).toBe("2026-04-11");
  });

  it("accepts sources from the last month and rejects older ones", () => {
    const now = new Date("2026-04-10T12:00:00.000Z");

    expect(isInitiativeNewsSourceFresh("2026-03-15T09:00:00.000Z", now)).toBe(true);
    expect(isInitiativeNewsSourceFresh("2026-03-09T09:00:00.000Z", now)).toBe(false);
  });

  it("marks low-confidence or single-domain coverage as insufficient signal", () => {
    expect(
      shouldMarkInitiativeNewsAsInsufficientSignal(0.8, [
        {
          cited: true,
          domain: "srf.ch",
          title: "SRF coverage",
          url: "https://www.srf.ch/news/example",
        },
      ]),
    ).toBe(true);

    expect(
      shouldMarkInitiativeNewsAsInsufficientSignal(0.2, [
        {
          cited: true,
          domain: "srf.ch",
          title: "SRF coverage",
          url: "https://www.srf.ch/news/example",
        },
        {
          cited: true,
          domain: "nzz.ch",
          title: "NZZ coverage",
          url: "https://www.nzz.ch/example",
        },
      ]),
    ).toBe(true);

    expect(
      shouldMarkInitiativeNewsAsInsufficientSignal(0.7, [
        {
          cited: true,
          domain: "srf.ch",
          title: "SRF coverage",
          url: "https://www.srf.ch/news/example",
        },
        {
          cited: true,
          domain: "nzz.ch",
          title: "NZZ coverage",
          url: "https://www.nzz.ch/example",
        },
      ]),
    ).toBe(false);
  });

  it("accepts source URL strings in the analysis schema", () => {
    const parsed = initiativeNewsAnalysisSchema.safeParse({
      article_count: 3,
      confidence_score: 0.64,
      key_themes: ["campaign tone", "cost debate"],
      sentiment_label: "mixed",
      sentiment_score: 12,
      source_titles: ["SRF piece", "NZZ piece"],
      source_urls: [
        "https://www.srf.ch/news/example",
        "https://www.nzz.ch/example",
      ],
      summary_en:
        "Recent coverage is mixed, with reporting split between implementation costs and campaign messaging.",
    });

    expect(parsed.success).toBe(true);
  });

  it("parses stored snapshot sources into the public shape", () => {
    const parsed = parseInitiativeNewsSnapshot({
      article_count: 4,
      confidence_score: 0.71,
      created_at: "2026-04-10T06:00:00.000Z",
      error_message: null,
      id: "snapshot-1",
      initiative_id: "initiative-1",
      model: "gpt-5.4-mini",
      prompt_version: "2026-04-10-v2",
      scheduled_for: "2026-04-10",
      sentiment_label: "positive",
      sentiment_score: 31.2,
      sources: [
        {
          cited: true,
          domain: "srf.ch",
          published_at: "2026-04-05T08:00:00.000Z",
          title: "Public sentiment shifts",
          url: "https://www.srf.ch/news/example",
        },
      ],
      status: "succeeded",
      summary_en: "Coverage has recently tilted positive.",
    } satisfies RawInitiativeNewsSnapshotRow);

    expect(parsed?.sources[0]?.title).toBe("Public sentiment shifts");
    expect(parsed?.sources[0]?.political_lean).toBe("center");
    expect(parsed?.sentiment_score).toBe(31.2);
  });
});
