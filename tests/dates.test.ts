import { describe, expect, it } from "vitest";

import { buildMarketCloseAt } from "@/lib/dates";

describe("buildMarketCloseAt", () => {
  it("converts Zurich midnight to UTC for summer vote dates", () => {
    expect(buildMarketCloseAt("2026-06-14")).toBe("2026-06-13T22:00:00.000Z");
  });
});

