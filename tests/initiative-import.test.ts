import { describe, expect, it } from "vitest";

import { parseFederalInitiativesHtml } from "@/lib/initiative-import";

const sampleHtml = `
  <html>
    <body>
      <h1 class="h1 hero__title">Abstimmungsvorlagen für den 14. Juni 2026</h1>
      <p class="font--regular">Veröffentlicht am 11. Februar 2026</p>
      <p class="font--regular">1. Volksinitiative «Keine 10-Millionen-Schweiz!» (BBl <em>2026</em> 17);</p>
      <p class="font--regular">2. Änderung vom 26. September 2025 des Bundesgesetzes über den zivilen Ersatzdienst (Zivildienstgesetz, ZDG) (BBl <em>2025</em> 2896).</p>
    </body>
  </html>
`;

describe("parseFederalInitiativesHtml", () => {
  it("normalizes the June 2026 federal vote announcement into initiative previews", () => {
    const preview = parseFederalInitiativesHtml(sampleHtml);

    expect(preview.source_key).toBe("federal-vote-2026-06-14");
    expect(preview.initiatives).toHaveLength(2);
    expect(preview.initiatives[0]?.slug).toBe(
      "10-million-switzerland-initiative",
    );
    expect(preview.initiatives[0]?.type).toBe("Popular Initiative");
    expect(preview.initiatives[1]?.slug).toBe("civilian-service-act-amendment");
    expect(preview.initiatives[1]?.type).toBe("Optional Referendum");
  });
});
