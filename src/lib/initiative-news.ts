import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { subMonths } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { Response } from "openai/resources/responses/responses";

import { APP_TIMEZONE } from "@/lib/dates";
import { getOpenAINewsConfig, getOpenAINewsModel } from "@/lib/env";
import {
  initiativeNewsAnalysisSchema,
  initiativeNewsSourceSchema,
} from "@/lib/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type {
  InitiativeNewsSentimentLabel,
  InitiativeNewsSnapshot,
  InitiativeNewsSnapshotStatus,
  InitiativeNewsSource,
  InitiativeRow,
  RawInitiativeNewsSnapshotRow,
} from "@/lib/types";
import { asErrorMessage, roundTo } from "@/lib/utils";

const NEWS_SENTIMENT_ALLOWED_DOMAINS = [
  "admin.ch",
  "parlament.ch",
  "ch.ch",
  "swissinfo.ch",
  "srf.ch",
  "rts.ch",
  "rsi.ch",
  "nzz.ch",
  "tagesanzeiger.ch",
  "letemps.ch",
] as const;

const NEWS_SENTIMENT_PROMPT_VERSION = "2026-04-10-v2";
const INSUFFICIENT_SIGNAL_CONFIDENCE_THRESHOLD = 0.35;
const NEWS_SENTIMENT_MAX_SOURCE_AGE_MONTHS = 1;
const NEWS_SOURCE_FETCH_TIMEOUT_MS = 8_000;
const POSITIVE_SENTIMENT_MIN = 20;
const NEGATIVE_SENTIMENT_MAX = -20;
const PUBLICATION_DATE_META_KEYS = new Set([
  "article:published_time",
  "article:published",
  "date",
  "datepublished",
  "dc.date",
  "dc.date.issued",
  "dcterms.created",
  "parsely-pub-date",
  "pubdate",
  "publish-date",
]);

interface InitiativeNewsAdminLike {
  from(table: string): unknown;
}

interface InitiativeNewsAnalysis {
  articleCount: number;
  confidenceScore: number;
  keyThemes: string[];
  sentimentScore: number;
  sources: InitiativeNewsSource[];
  summaryEn: string;
}

interface InitiativeNewsStructuredOutput {
  article_count: number;
  confidence_score: number;
  key_themes: string[];
  sentiment_label: "negative" | "mixed" | "positive";
  sentiment_score: number;
  source_titles: string[];
  source_urls: string[];
  summary_en: string;
}

export interface InitiativeNewsSyncItemResult {
  articleCount: number;
  confidenceScore: number | null;
  error?: string;
  initiativeId: string;
  slug: string;
  status: InitiativeNewsSnapshotStatus;
}

export interface InitiativeNewsSyncResult {
  failureCount: number;
  insufficientSignalCount: number;
  processedCount: number;
  results: InitiativeNewsSyncItemResult[];
  scheduledFor: string;
  successCount: number;
}

interface SyncInitiativeNewsOptions {
  admin?: InitiativeNewsAdminLike;
  analyzeInitiativeNews?: (initiative: InitiativeRow) => Promise<InitiativeNewsAnalysis>;
  now?: Date;
}

interface InitiativeNewsSnapshotUpsert {
  article_count: number;
  confidence_score: number | null;
  error_message: string | null;
  initiative_id: string;
  model: string;
  prompt_version: string;
  scheduled_for: string;
  sentiment_label: InitiativeNewsSentimentLabel | null;
  sentiment_score: number | null;
  sources: Json;
  status: InitiativeNewsSnapshotStatus;
  summary_en: string | null;
}

interface InitiativeSelectionQuery {
  eq(column: string, value: unknown): InitiativeSelectionQuery;
  gt(column: string, value: string): InitiativeSelectionQuery;
  order(
    column: string,
    options?: { ascending?: boolean },
  ): Promise<{
    data: InitiativeRow[] | null;
    error: { message: string } | null;
  }>;
  select(columns: string): InitiativeSelectionQuery;
}

interface InitiativeNewsSnapshotTable {
  upsert(
    payload: InitiativeNewsSnapshotUpsert,
    options: { onConflict: string },
  ): Promise<{ error: { message: string } | null }>;
}

function normalizeSourceUrl(url: string) {
  try {
    const parsed = new URL(url);

    parsed.hash = "";

    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function normalizePublicationDate(value: string) {
  const parsed = new Date(value.trim());

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function parseHtmlAttributes(tag: string) {
  const attributes = new Map<string, string>();

  for (const match of tag.matchAll(
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
  )) {
    const key = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";

    if (key) {
      attributes.set(key, value);
    }
  }

  return attributes;
}

function extractPublicationDateFromJson(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractPublicationDateFromJson(item);

      if (found) {
        return found;
      }
    }

    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  if ("datePublished" in value && typeof value.datePublished === "string") {
    return normalizePublicationDate(value.datePublished);
  }

  for (const nestedValue of Object.values(value)) {
    const found = extractPublicationDateFromJson(nestedValue);

    if (found) {
      return found;
    }
  }

  return null;
}

function extractPublicationDateFromHtml(html: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = parseHtmlAttributes(tag);
    const key =
      attributes.get("property") ??
      attributes.get("name") ??
      attributes.get("itemprop");
    const content = attributes.get("content");

    if (!key || !content) {
      continue;
    }

    if (PUBLICATION_DATE_META_KEYS.has(key.toLowerCase())) {
      const normalized = normalizePublicationDate(content);

      if (normalized) {
        return normalized;
      }
    }
  }

  for (const match of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const rawContent = match[1]?.trim();

    if (!rawContent) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawContent);
      const normalized = extractPublicationDateFromJson(parsed);

      if (normalized) {
        return normalized;
      }
    } catch {
      continue;
    }
  }

  const timeMatch = html.match(/<time[^>]+datetime=["']([^"']+)["']/i);

  if (timeMatch?.[1]) {
    return normalizePublicationDate(timeMatch[1]);
  }

  return null;
}

async function fetchSourcePublishedAt(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "PrognoNewsBot/1.0",
      },
      signal: AbortSignal.timeout(NEWS_SOURCE_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html")) {
      return null;
    }

    return extractPublicationDateFromHtml(await response.text());
  } catch {
    return null;
  }
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.trim();
  }
}

function dedupeSources(sources: InitiativeNewsSource[]) {
  const uniqueByUrl = new Map<string, InitiativeNewsSource>();

  for (const source of sources) {
    const normalizedUrl = normalizeSourceUrl(source.url);
    const next: InitiativeNewsSource = {
      ...source,
      domain: source.domain.trim(),
      title: source.title.trim(),
      url: normalizedUrl,
    };
    const existing = uniqueByUrl.get(normalizedUrl);

    if (!existing) {
      uniqueByUrl.set(normalizedUrl, next);
      continue;
    }

    uniqueByUrl.set(normalizedUrl, {
      ...existing,
      cited: existing.cited || next.cited,
      title: existing.title.length >= next.title.length ? existing.title : next.title,
    });
  }

  return Array.from(uniqueByUrl.values()).slice(0, 5);
}

function extractRetrievedSourceUrls(
  response: Response,
) {
  const urls = new Set<string>();

  for (const item of response.output) {
    if (item.type !== "web_search_call" || item.action.type !== "search") {
      continue;
    }

    for (const source of item.action.sources ?? []) {
      urls.add(normalizeSourceUrl(source.url));
    }
  }

  return urls;
}

function extractCitedSourceTitles(response: Response) {
  const titlesByUrl = new Map<string, string>();

  for (const item of response.output) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content) {
      if (content.type !== "output_text") {
        continue;
      }

      for (const annotation of content.annotations) {
        if (annotation.type !== "url_citation") {
          continue;
        }

        titlesByUrl.set(normalizeSourceUrl(annotation.url), annotation.title);
      }
    }
  }

  return titlesByUrl;
}

function toStoredSources(
  analysis: {
    source_titles: string[];
    source_urls: string[];
  },
  response: Response,
) {
  const retrievedSourceUrls = extractRetrievedSourceUrls(response);
  const citedSourceTitles = extractCitedSourceTitles(response);
  const sources: InitiativeNewsSource[] = [];

  for (let index = 0; index < analysis.source_urls.length; index += 1) {
    const url = normalizeSourceUrl(analysis.source_urls[index] ?? "");

    if (!url) {
      continue;
    }

    if (retrievedSourceUrls.size > 0 && !retrievedSourceUrls.has(url)) {
      continue;
    }

    sources.push({
      cited: citedSourceTitles.has(url),
      domain: domainFromUrl(url),
      title:
        citedSourceTitles.get(url) ??
        (analysis.source_titles[index] ?? domainFromUrl(url)),
      url,
    });
  }

  return dedupeSources(sources);
}

export function getInitiativeNewsScheduledFor(now = new Date()) {
  return formatInTimeZone(now, APP_TIMEZONE, "yyyy-MM-dd");
}

export function isInitiativeNewsSourceFresh(
  publishedAt: string,
  now = new Date(),
) {
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return false;
  }

  return publishedTime >= subMonths(now, NEWS_SENTIMENT_MAX_SOURCE_AGE_MONTHS).getTime();
}

export function deriveInitiativeNewsSentimentLabel(
  score: number,
): Exclude<InitiativeNewsSentimentLabel, "insufficient_signal"> {
  if (score >= POSITIVE_SENTIMENT_MIN) {
    return "positive";
  }

  if (score <= NEGATIVE_SENTIMENT_MAX) {
    return "negative";
  }

  return "mixed";
}

export function shouldMarkInitiativeNewsAsInsufficientSignal(
  confidenceScore: number,
  sources: InitiativeNewsSource[],
) {
  const distinctDomains = new Set(sources.map((source) => source.domain)).size;

  return (
    confidenceScore < INSUFFICIENT_SIGNAL_CONFIDENCE_THRESHOLD ||
    distinctDomains < 2
  );
}

export function parseInitiativeNewsSnapshot(
  row: RawInitiativeNewsSnapshotRow | null,
): InitiativeNewsSnapshot | null {
  if (!row) {
    return null;
  }

  const parsedSources = initiativeNewsSourceSchema.array().safeParse(row.sources);

  return {
    ...row,
    sources: parsedSources.success ? parsedSources.data : [],
  };
}

function buildNewsPrompt(initiative: InitiativeRow, now: Date) {
  const todayInZurich = formatInTimeZone(now, APP_TIMEZONE, "yyyy-MM-dd");

  return [
    `Today in Europe/Zurich: ${todayInZurich}`,
    `Initiative title: ${initiative.official_title}`,
    `Initiative type: ${initiative.type}`,
    `Official source URL: ${initiative.source_url}`,
    `Vote date: ${initiative.vote_date}`,
    `Market closes at: ${initiative.market_closes_at}`,
    `English summary: ${initiative.summary_en}`,
    "",
    "Task: search for initiative-specific coverage from the last 1 month only.",
    "Assess the tone of recent news coverage around the initiative itself, not the prediction market.",
    "Return a single JSON object with sentiment_score, sentiment_label, confidence_score, article_count, summary_en, source_urls, source_titles, and key_themes.",
    "The summary must be in English even if sources are in German, French, or Italian.",
    "Only include claims that are supported by the retrieved sources.",
    "Only include source URLs that came from the search results and are no older than 1 month.",
    "Use 3 to 4 source URLs and matching source titles.",
    "Keep source titles concise.",
  ].join("\n");
}

function extractJsonObjectCandidate(rawText: string) {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return rawText.slice(firstBrace, lastBrace + 1).trim();
  }

  return rawText.trim();
}

function parseInitiativeNewsAnalysisOutput(
  rawText: string,
): InitiativeNewsStructuredOutput {
  const jsonCandidate = extractJsonObjectCandidate(rawText);
  const parsedJson = JSON.parse(jsonCandidate);
  const parsed = initiativeNewsAnalysisSchema.safeParse(parsedJson);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      issue?.message
        ? `Initiative news output failed schema validation: ${issue.message}`
        : "Initiative news output failed schema validation.",
    );
  }

  return parsed.data;
}

function buildNewsAnalysisInstructions(retryCount: number) {
  const baseInstructions = [
    "You analyze public news coverage for Swiss federal initiatives.",
    "Use web search with the curated source list only.",
    "Focus on coverage published in the last 1 month.",
    "Do not mention prediction market prices or speculate about vote outcomes beyond what recent reporting supports.",
    "Return valid JSON only.",
  ];

  if (retryCount === 0) {
    return baseInstructions.join(" ");
  }

  return [
    ...baseInstructions,
    "Do not include markdown, comments, explanations, or code fences.",
    "Return exactly one compact JSON object that matches the schema.",
  ].join(" ");
}

async function verifyRecentSources(
  sources: InitiativeNewsSource[],
  now: Date,
) {
  const verifiedSources = await Promise.all(
    sources.map(async (source) => {
      const publishedAt = await fetchSourcePublishedAt(source.url);

      if (!publishedAt || !isInitiativeNewsSourceFresh(publishedAt, now)) {
        return null;
      }

      return {
        ...source,
        published_at: publishedAt,
      };
    }),
  );

  return verifiedSources.filter((source) => source != null);
}

export async function analyzeInitiativeNews(
  initiative: InitiativeRow,
  now = new Date(),
): Promise<InitiativeNewsAnalysis> {
  const config = getOpenAINewsConfig();

  if (!config) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    organization: config.organization,
    project: config.project,
  });

  let analysis: InitiativeNewsStructuredOutput | null = null;
  let response: Awaited<ReturnType<typeof client.responses.create>> | null = null;
  let lastError: unknown = null;

  for (let retryCount = 0; retryCount < 2; retryCount += 1) {
    try {
      const maxOutputTokens = retryCount === 0 ? 1400 : 2200;

      response = await client.responses.create({
        model: config.model,
        include: ["web_search_call.action.sources"],
        input: [
          {
            content: [
              {
                text: buildNewsPrompt(initiative, now),
                type: "input_text",
              },
            ],
            role: "user",
            type: "message",
          },
        ],
        instructions: buildNewsAnalysisInstructions(retryCount),
        max_output_tokens: maxOutputTokens,
        reasoning: { effort: "low" },
        text: {
          format: zodTextFormat(
            initiativeNewsAnalysisSchema,
            "progno_initiative_news_sentiment",
          ),
          verbosity: retryCount === 0 ? "medium" : "low",
        },
        tool_choice: "auto",
        tools: [
          {
            filters: {
              allowed_domains: [...NEWS_SENTIMENT_ALLOWED_DOMAINS],
            },
            search_context_size: "medium",
            type: "web_search",
            user_location: {
              country: "CH",
              timezone: APP_TIMEZONE,
              type: "approximate",
            },
          },
        ],
      });

      analysis = parseInitiativeNewsAnalysisOutput(response.output_text);
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response || !analysis) {
    throw new Error(
      lastError instanceof Error
        ? lastError.message
        : "OpenAI returned no structured initiative news payload.",
    );
  }

  const sources = toStoredSources(analysis, response);
  const verifiedSources = await verifyRecentSources(sources, now);

  if (verifiedSources.length !== sources.length) {
    return {
      articleCount: verifiedSources.length,
      confidenceScore: 0,
      keyThemes: analysis.key_themes,
      sentimentScore: roundTo(analysis.sentiment_score),
      sources: verifiedSources,
      summaryEn:
        "Recent coverage could not be fully verified within the last month, so this cycle was downgraded to insufficient signal.",
    };
  }

  return {
    articleCount: Math.max(analysis.article_count, verifiedSources.length),
    confidenceScore: roundTo(analysis.confidence_score),
    keyThemes: analysis.key_themes,
    sentimentScore: roundTo(analysis.sentiment_score),
    sources: verifiedSources,
    summaryEn: analysis.summary_en,
  };
}

function buildSuccessfulSnapshot(
  initiative: InitiativeRow,
  analysis: InitiativeNewsAnalysis,
  scheduledFor: string,
): InitiativeNewsSnapshotUpsert {
  const insufficientSignal = shouldMarkInitiativeNewsAsInsufficientSignal(
    analysis.confidenceScore,
    analysis.sources,
  );
  const status: InitiativeNewsSnapshotStatus = insufficientSignal
    ? "insufficient_signal"
    : "succeeded";

  return {
    article_count: analysis.articleCount,
    confidence_score: analysis.confidenceScore,
    error_message: null,
    initiative_id: initiative.id,
    model: getOpenAINewsModel(),
    prompt_version: NEWS_SENTIMENT_PROMPT_VERSION,
    scheduled_for: scheduledFor,
    sentiment_label: insufficientSignal
      ? "insufficient_signal"
      : deriveInitiativeNewsSentimentLabel(analysis.sentimentScore),
    sentiment_score: insufficientSignal ? null : analysis.sentimentScore,
    sources: analysis.sources as unknown as Json,
    status,
    summary_en: analysis.summaryEn,
  };
}

function buildFailedSnapshot(
  initiative: InitiativeRow,
  error: unknown,
  scheduledFor: string,
): InitiativeNewsSnapshotUpsert {
  return {
    article_count: 0,
    confidence_score: null,
    error_message: asErrorMessage(error, "Initiative news sentiment sync failed."),
    initiative_id: initiative.id,
    model: getOpenAINewsModel(),
    prompt_version: NEWS_SENTIMENT_PROMPT_VERSION,
    scheduled_for: scheduledFor,
    sentiment_label: null,
    sentiment_score: null,
    sources: [] as unknown as Json,
    status: "failed" as const,
    summary_en: null,
  };
}

async function upsertInitiativeNewsSnapshot(
  admin: InitiativeNewsAdminLike,
  snapshot: InitiativeNewsSnapshotUpsert,
) {
  const table = admin.from(
    "initiative_news_snapshots",
  ) as InitiativeNewsSnapshotTable;
  const { error } = await table.upsert(snapshot, {
    onConflict: "initiative_id,scheduled_for",
  });

  if (error) {
    throw new Error(`Initiative news snapshot upsert failed: ${error.message}`);
  }
}

export async function syncInitiativeNewsSnapshots(
  options: SyncInitiativeNewsOptions = {},
): Promise<InitiativeNewsSyncResult> {
  const admin = options.admin ?? createAdminSupabaseClient();
  const now = options.now ?? new Date();
  const scheduledFor = getInitiativeNewsScheduledFor(now);
  const analyze = options.analyzeInitiativeNews ?? ((initiative: InitiativeRow) =>
    analyzeInitiativeNews(initiative, now));
  const initiativesQuery = admin.from("initiatives") as InitiativeSelectionQuery;
  const { data, error } = await initiativesQuery
    .select("*")
    .eq("status", "published")
    .gt("market_closes_at", now.toISOString())
    .order("vote_date", { ascending: true });

  if (error) {
    throw new Error(`Open initiative query failed: ${error.message}`);
  }

  const initiatives = (data as InitiativeRow[] | null) ?? [];
  const results: InitiativeNewsSyncItemResult[] = [];

  for (const initiative of initiatives) {
    try {
      const analysis = await analyze(initiative);
      const snapshot = buildSuccessfulSnapshot(initiative, analysis, scheduledFor);

      await upsertInitiativeNewsSnapshot(admin, snapshot);
      results.push({
        articleCount: snapshot.article_count,
        confidenceScore: snapshot.confidence_score,
        initiativeId: initiative.id,
        slug: initiative.slug,
        status: snapshot.status,
      });
    } catch (error) {
      const failedSnapshot = buildFailedSnapshot(initiative, error, scheduledFor);

      try {
        await upsertInitiativeNewsSnapshot(admin, failedSnapshot);
      } catch (persistError) {
        results.push({
          articleCount: 0,
          confidenceScore: null,
          error: asErrorMessage(
            persistError,
            "Failed to persist initiative news sync error.",
          ),
          initiativeId: initiative.id,
          slug: initiative.slug,
          status: "failed",
        });
        continue;
      }

      results.push({
        articleCount: 0,
        confidenceScore: null,
        error: failedSnapshot.error_message ?? undefined,
        initiativeId: initiative.id,
        slug: initiative.slug,
        status: "failed",
      });
    }
  }

  return {
    failureCount: results.filter((result) => result.status === "failed").length,
    insufficientSignalCount: results.filter(
      (result) => result.status === "insufficient_signal",
    ).length,
    processedCount: results.length,
    results,
    scheduledFor,
    successCount: results.filter((result) => result.status === "succeeded").length,
  };
}
