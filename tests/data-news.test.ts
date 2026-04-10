import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createAdminSupabaseClient = vi.fn();
const ensureBaselineMetrics = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient,
}));

vi.mock("@/lib/baseline-metrics", () => ({
  ensureBaselineMetrics,
}));

function createFakeAdmin() {
  const data = {
    forecast_revisions: [],
    initiative_news_snapshots: [
      {
        article_count: 0,
        confidence_score: null,
        created_at: "2026-04-12T06:00:00.000Z",
        error_message: "bad run",
        id: "snapshot-failed",
        initiative_id: "initiative-1",
        model: "gpt-5.4-mini",
        prompt_version: "2026-04-10-v2",
        scheduled_for: "2026-04-12",
        sentiment_label: null,
        sentiment_score: null,
        sources: [],
        status: "failed",
        summary_en: null,
      },
      {
        article_count: 1,
        confidence_score: 0.28,
        created_at: "2026-04-11T06:00:00.000Z",
        error_message: null,
        id: "snapshot-insufficient",
        initiative_id: "initiative-1",
        model: "gpt-5.4-mini",
        prompt_version: "2026-04-10-v2",
        scheduled_for: "2026-04-11",
        sentiment_label: "insufficient_signal",
        sentiment_score: null,
        sources: [
          {
            cited: true,
            domain: "srf.ch",
            title: "SRF",
            url: "https://www.srf.ch/news/example",
          },
        ],
        status: "insufficient_signal",
        summary_en: "Not enough coverage yet.",
      },
      {
        article_count: 3,
        confidence_score: 0.71,
        created_at: "2026-04-10T06:00:00.000Z",
        error_message: null,
        id: "snapshot-succeeded",
        initiative_id: "initiative-1",
        model: "gpt-5.4-mini",
        prompt_version: "2026-04-10-v2",
        scheduled_for: "2026-04-10",
        sentiment_label: "positive",
        sentiment_score: 31.5,
        sources: [
          {
            cited: true,
            domain: "srf.ch",
            title: "SRF",
            url: "https://www.srf.ch/news/example",
          },
        ],
        status: "succeeded",
        summary_en: "Coverage leans positive.",
      },
    ],
    initiatives: [
      {
        created_at: "2026-04-01T08:00:00.000Z",
        id: "initiative-1",
        market_closes_at: "2026-06-14T00:00:00.000Z",
        official_title: "Test initiative",
        slug: "test-initiative",
        source_locale: "de",
        source_url: "https://www.admin.ch/test-initiative",
        status: "published",
        summary_en: "Summary",
        type: "Popular Initiative",
        updated_at: "2026-04-01T08:00:00.000Z",
        vote_date: "2026-06-14",
      },
    ],
    metric_versions: [],
  };

  function applyFilters(rows: Array<Record<string, unknown>>, filters: Array<{
    type: "eq" | "in";
    column: string;
    value: unknown;
  }>) {
    return filters.reduce((current, filter) => {
      if (filter.type === "eq") {
        return current.filter((row) => row[filter.column] === filter.value);
      }

      const values = new Set(filter.value as Array<unknown>);

      return current.filter((row) => values.has(row[filter.column]));
    }, rows);
  }

  function applyOrder(rows: Array<Record<string, unknown>>, orders: Array<{
    ascending: boolean;
    column: string;
  }>) {
    return [...rows].sort((left, right) => {
      for (const order of orders) {
        const leftValue = String(left[order.column] ?? "");
        const rightValue = String(right[order.column] ?? "");

        if (leftValue === rightValue) {
          continue;
        }

        return order.ascending
          ? leftValue.localeCompare(rightValue)
          : rightValue.localeCompare(leftValue);
      }

      return 0;
    });
  }

  return {
    from(table: keyof typeof data) {
      const filters: Array<{ column: string; type: "eq" | "in"; value: unknown }> = [];
      const orders: Array<{ ascending: boolean; column: string }> = [];
      let limitValue: number | null = null;

      const query = {
        eq(column: string, value: unknown) {
          filters.push({ column, type: "eq", value });

          return query;
        },
        in(column: string, value: unknown) {
          filters.push({ column, type: "in", value });

          return query;
        },
        limit(value: number) {
          limitValue = value;

          return query;
        },
        maybeSingle() {
          const rows = query.resolveRows();

          return Promise.resolve({
            data: rows[0] ?? null,
            error: null,
          });
        },
        order(column: string, options?: { ascending?: boolean }) {
          orders.push({ ascending: options?.ascending ?? true, column });

          return query;
        },
        resolveRows() {
          let rows = applyFilters(data[table], filters);
          rows = applyOrder(rows, orders);

          if (limitValue != null) {
            rows = rows.slice(0, limitValue);
          }

          return rows;
        },
        select() {
          return query;
        },
        then(
          onfulfilled?: (value: { data: unknown; error: null }) => unknown,
          onrejected?: (reason: unknown) => unknown,
        ) {
          return Promise.resolve({
            data: query.resolveRows(),
            error: null,
          }).then(onfulfilled, onrejected);
        },
      };

      return query;
    },
  };
}

describe("getPublishedInitiativeDetail news integration", () => {
  beforeEach(() => {
    ensureBaselineMetrics.mockResolvedValue(undefined);
    createAdminSupabaseClient.mockReturnValue(createFakeAdmin());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the latest public news snapshot and ignores failed rows", async () => {
    const { getPublishedInitiativeDetail } = await import("@/lib/data");
    const detail = await getPublishedInitiativeDetail("test-initiative");

    expect(detail?.latestNewsSnapshot?.status).toBe("insufficient_signal");
    expect(detail?.latestNewsSnapshot?.scheduled_for).toBe("2026-04-11");
    expect(detail?.latestNewsSnapshot?.summary_en).toBe("Not enough coverage yet.");
  });
});
