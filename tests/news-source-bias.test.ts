import { describe, expect, it } from "vitest";

import {
  formatNewsSourcePoliticalLean,
  getNewsSourcePoliticalLean,
} from "@/lib/news-source-bias";

describe("news source bias mapping", () => {
  it("maps known domains to a compact political lean", () => {
    expect(getNewsSourcePoliticalLean("srf.ch")).toBe("center");
    expect(getNewsSourcePoliticalLean("www.nzz.ch")).toBe("right");
    expect(getNewsSourcePoliticalLean("tagesanzeiger.ch")).toBe("left");
  });

  it("returns null for unknown domains", () => {
    expect(getNewsSourcePoliticalLean("example.com")).toBeNull();
  });

  it("formats lean values for the UI", () => {
    expect(formatNewsSourcePoliticalLean("left")).toBe("Left");
    expect(formatNewsSourcePoliticalLean("center")).toBe("Center");
    expect(formatNewsSourcePoliticalLean("right")).toBe("Right");
    expect(formatNewsSourcePoliticalLean(null)).toBeNull();
  });
});
