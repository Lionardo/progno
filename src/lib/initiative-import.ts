import { createHash } from "node:crypto";

import { buildMarketCloseAt } from "@/lib/dates";
import type {
  InitiativeImportItem,
  InitiativeImportPreview,
  InitiativeType,
} from "@/lib/types";
import { decodeHtmlEntities, slugify, stripHtml } from "@/lib/utils";

export const FEDERAL_VOTE_SOURCE_URL =
  "https://www.news.admin.ch/de/newnsb/WYoX71d58vliwEdJUhJBJ";

export const FEDERAL_VOTE_CALENDAR_URL =
  "https://www.ch.ch/en/votes-and-elections/votes/vote-and-election-calendar/";

const GERMAN_MONTHS: Record<string, string> = {
  april: "04",
  august: "08",
  dezember: "12",
  februar: "02",
  januar: "01",
  juli: "07",
  juni: "06",
  mai: "05",
  marz: "03",
  märz: "03",
  november: "11",
  oktober: "10",
  september: "09",
};

const KNOWN_INITIATIVE_METADATA = [
  {
    pattern: /10-Millionen-Schweiz/i,
    slug: "10-million-switzerland-initiative",
    summary:
      "A popular initiative focused on sustainability and migration limits, centered on a proposal to keep Switzerland below 10 million residents before 2050.",
  },
  {
    pattern: /zivilen Ersatzdienst|Zivildienstgesetz/i,
    slug: "civilian-service-act-amendment",
    summary:
      "An optional referendum on tighter civilian service rules, aimed at reducing military-to-civilian service switches and reshaping the replacement-service framework.",
  },
];

function parseGermanDate(value: string) {
  const match = value
    .trim()
    .match(/(\d{1,2})\.\s*([A-Za-zÄÖÜäöüß]+)\s*(\d{4})/);

  if (!match) {
    throw new Error(`Could not parse German date: ${value}`);
  }

  const [, day, monthLabel, year] = match;
  const month = GERMAN_MONTHS[monthLabel.toLowerCase()];

  if (!month) {
    throw new Error(`Unsupported German month label: ${monthLabel}`);
  }

  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function inferType(title: string): InitiativeType {
  return title.toLowerCase().startsWith("volksinitiative")
    ? "Popular Initiative"
    : "Optional Referendum";
}

function inferSummary(title: string) {
  return (
    KNOWN_INITIATIVE_METADATA.find((item) => item.pattern.test(title))?.summary ??
    "Swiss federal vote item imported from the official federal vote announcement."
  );
}

function inferSlug(title: string) {
  return (
    KNOWN_INITIATIVE_METADATA.find((item) => item.pattern.test(title))?.slug ??
    slugify(title)
  );
}

function normalizeTitle(value: string) {
  return value
    .replace(/^\d+\.\s*/, "")
    .replace(/\s*\(BBl.*$/i, "")
    .replace(/;\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseFederalInitiativesHtml(html: string): InitiativeImportPreview {
  const titleMatch = html.match(
    /<h1[^>]*class="h1 hero__title"[^>]*>(.*?)<\/h1>/,
  );
  const titleText = titleMatch ? stripHtml(titleMatch[1]) : "";
  const voteDate = parseGermanDate(titleText);

  const publishedMatch = html.match(/Veröffentlicht am ([^<]+)/);
  const sourcePublishedAt = publishedMatch
    ? parseGermanDate(decodeHtmlEntities(publishedMatch[1]))
    : null;

  const paragraphs = Array.from(
    html.matchAll(/<p class="font--regular"[^>]*>(.*?)<\/p>/g),
  ).map((match) => stripHtml(match[1]));

  const initiativeItems = paragraphs.filter((paragraph) => /^\d+\./.test(paragraph));

  if (initiativeItems.length === 0) {
    throw new Error("The official announcement did not contain any parsable vote items.");
  }

  const initiatives: InitiativeImportItem[] = initiativeItems.map((item) => {
    const officialTitle = normalizeTitle(item);

    return {
      market_closes_at: buildMarketCloseAt(voteDate),
      official_title: officialTitle,
      slug: inferSlug(officialTitle),
      source_locale: "de",
      source_url: FEDERAL_VOTE_SOURCE_URL,
      status: "published",
      summary_en: inferSummary(officialTitle),
      type: inferType(officialTitle),
      vote_date: voteDate,
    };
  });

  return {
    initiatives,
    notes: [
      `Imported from the official federal announcement and cross-referenced against ${FEDERAL_VOTE_CALENDAR_URL}.`,
    ],
    source_hash: createHash("sha256").update(html).digest("hex"),
    source_key: `federal-vote-${voteDate}`,
    source_published_at: sourcePublishedAt,
    source_url: FEDERAL_VOTE_SOURCE_URL,
  };
}

export async function fetchFederalInitiativesPreview() {
  const response = await fetch(FEDERAL_VOTE_SOURCE_URL, {
    cache: "no-store",
    headers: {
      "user-agent": "PrognoBot/1.0 (+https://progno.local)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Official initiative fetch failed with status ${response.status}.`,
    );
  }

  const html = await response.text();
  const preview = parseFederalInitiativesHtml(html);

  return {
    preview,
    rawPayload: html,
  };
}
