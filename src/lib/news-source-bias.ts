import type { InitiativeNewsSourceLean } from "@/lib/types";

const DOMAIN_POLITICAL_LEAN: Record<string, InitiativeNewsSourceLean> = {
  "admin.ch": "center",
  "ch.ch": "center",
  "letemps.ch": "center",
  "nzz.ch": "right",
  "parlament.ch": "center",
  "rsi.ch": "left",
  "rts.ch": "left",
  "srf.ch": "left",
  "swissinfo.ch": "center",
  "tagesanzeiger.ch": "left",
};

function normalizeDomain(domain: string) {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

export function getNewsSourcePoliticalLean(
  domain: string,
): InitiativeNewsSourceLean | null {
  const normalizedDomain = normalizeDomain(domain);

  for (const [candidateDomain, lean] of Object.entries(DOMAIN_POLITICAL_LEAN)) {
    if (
      normalizedDomain === candidateDomain ||
      normalizedDomain.endsWith(`.${candidateDomain}`)
    ) {
      return lean;
    }
  }

  return null;
}

export function formatNewsSourcePoliticalLean(
  lean: InitiativeNewsSourceLean | null | undefined,
) {
  if (lean === "left") {
    return "Left";
  }

  if (lean === "right") {
    return "Right";
  }

  if (lean === "center") {
    return "Center";
  }

  return null;
}
