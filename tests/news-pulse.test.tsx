import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NewsPulse } from "@/components/initiatives/news-pulse";
import type { InitiativeNewsSnapshot } from "@/lib/types";

const baseSnapshot: InitiativeNewsSnapshot = {
  article_count: 4,
  confidence_score: 0.74,
  created_at: "2026-04-10T06:00:00.000Z",
  error_message: null,
  id: "snapshot-1",
  initiative_id: "initiative-1",
  model: "gpt-5.4-mini",
  prompt_version: "2026-04-10-v2",
  scheduled_for: "2026-04-10",
  sentiment_label: "positive",
  sentiment_score: 28.5,
  sources: [
    {
      cited: true,
      domain: "srf.ch",
      title: "SRF overview",
      url: "https://www.srf.ch/news/example",
    },
  ],
  status: "succeeded",
  summary_en: "Coverage has recently leaned positive.",
};

describe("NewsPulse", () => {
  it("renders the empty state before the first snapshot exists", () => {
    const html = renderToStaticMarkup(<NewsPulse snapshot={null} />);

    expect(html).toContain("Automated Wednesday and Saturday news snapshots");
  });

  it("renders a successful sentiment snapshot", () => {
    const html = renderToStaticMarkup(<NewsPulse snapshot={baseSnapshot} />);

    expect(html).toContain("Positive");
    expect(html).toContain("+28.5");
    expect(html).toContain("Coverage has recently leaned positive.");
    expect(html).toContain("SRF overview");
  });

  it("renders the insufficient-signal state", () => {
    const html = renderToStaticMarkup(
      <NewsPulse
        snapshot={{
          ...baseSnapshot,
          sentiment_label: "insufficient_signal",
          sentiment_score: null,
          status: "insufficient_signal",
          summary_en: "Coverage is still too thin to publish a directional score.",
        }}
      />,
    );

    expect(html).toContain("Insufficient signal");
    expect(html).toContain("Coverage is still too thin to publish a directional score.");
  });
});
