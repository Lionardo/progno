import type { Json } from "@/lib/supabase/database.types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { InitiativeRow, MetricProposal } from "@/lib/types";

interface BaselineMetricDefinition {
  id: string;
  proposal: MetricProposal;
}

const BASELINE_METRICS: Record<string, BaselineMetricDefinition> = {
  "10-million-switzerland-initiative": {
    id: "91359e85-c812-4a88-b5ae-000000000001",
    proposal: {
      components: [
        {
          direction: "higher_is_better",
          label: "Real GDP per capita",
          rationale:
            "Captures whether the Swiss economy is generating more inflation-adjusted prosperity per resident by 2036.",
          source: "FSO national accounts / real GDP per capita",
          weight: 40,
        },
        {
          direction: "higher_is_better",
          label: "Housing affordability",
          rationale:
            "Measures whether households can still secure housing without an outsized rent or ownership burden.",
          source: "FSO housing cost burden and affordability indicators",
          weight: 20,
        },
        {
          direction: "lower_is_better",
          label: "Average commute time",
          rationale:
            "Tests whether population pressure translates into longer daily travel and weaker transport quality.",
          source: "FSO mobility and commuting indicators",
          weight: 20,
        },
        {
          direction: "higher_is_better",
          label: "Biodiversity and green space",
          rationale:
            "Preserves the environmental side of the debate by rewarding healthy land use and accessible nature.",
          source: "FOEN biodiversity and green-space proxy indicators",
          weight: 10,
        },
        {
          direction: "higher_is_better",
          label: "Subjective well-being",
          rationale:
            "Anchors the index in lived quality of life rather than relying only on hard macroeconomic outputs.",
          source: "FSO subjective well-being index",
          weight: 10,
        },
      ],
      index_name: "Swiss Prosperity Index",
      source_notes:
        "Baseline Progno launch metric combining prosperity, housing, congestion, environmental quality, and self-reported well-being.",
      thesis:
        "This baseline metric reflects the core tradeoff in the 10-million debate: Switzerland may gain output from growth, but that gain only counts if housing, mobility, nature, and lived quality of life remain strong enough to preserve broad prosperity by 2036.",
    },
  },
  "civilian-service-act-amendment": {
    id: "91359e85-c812-4a88-b5ae-000000000002",
    proposal: {
      components: [
        {
          direction: "higher_is_better",
          label: "Armed forces staffing",
          rationale:
            "Tracks whether stricter switching rules actually improve the staffing resilience the reform is meant to protect.",
          source: "VBS staffing and force-readiness indicators",
          weight: 30,
        },
        {
          direction: "lower_is_better",
          label: "Care-sector vacancy pressure",
          rationale:
            "Checks whether tighter civilian-service rules shift hidden costs into hospitals, care homes, and social institutions.",
          source: "FSO health and social-care vacancy indicators",
          weight: 25,
        },
        {
          direction: "higher_is_better",
          label: "Emergency readiness",
          rationale:
            "Represents the state-capacity argument by rewarding strong response capability across civilian protection systems.",
          source: "Civil protection and emergency-readiness reporting",
          weight: 20,
        },
        {
          direction: "higher_is_better",
          label: "Labor productivity",
          rationale:
            "Captures economy-wide efficiency effects rather than evaluating the initiative only through institutional staffing.",
          source: "SECO and FSO labor productivity indicators",
          weight: 15,
        },
        {
          direction: "higher_is_better",
          label: "Subjective well-being",
          rationale:
            "Keeps the metric tied to broader household welfare in case institutional gains come with social friction.",
          source: "FSO subjective well-being index",
          weight: 10,
        },
      ],
      index_name: "Swiss Civic Resilience Index",
      source_notes:
        "Baseline Progno launch metric designed to test whether stricter civilian-service rules improve readiness without degrading welfare elsewhere.",
      thesis:
        "This baseline metric treats the referendum as a state-capacity question with spillovers: the preferred outcome is the one that strengthens defense and emergency readiness by 2036 without simply pushing shortages, productivity losses, or welfare costs into other parts of Swiss society.",
    },
  },
};

export async function ensureBaselineMetrics(initiatives: InitiativeRow[]) {
  const matched = initiatives.flatMap((initiative) => {
    const baseline = BASELINE_METRICS[initiative.slug];

    return baseline ? [{ baseline, initiative }] : [];
  });

  if (matched.length === 0) {
    return;
  }

  const admin = createAdminSupabaseClient();
  const initiativeIds = matched.map(({ initiative }) => initiative.id);
  const { data, error } = await admin
    .from("metric_versions")
    .select("initiative_id")
    .in("initiative_id", initiativeIds)
    .eq("status", "approved");

  if (error) {
    throw new Error(`Baseline metric lookup failed: ${error.message}`);
  }

  const approvedInitiativeIds = new Set((data ?? []).map((row) => row.initiative_id));
  const approvedAt = new Date().toISOString();
  const inserts = matched
    .filter(({ initiative }) => !approvedInitiativeIds.has(initiative.id))
    .map(({ baseline, initiative }) => ({
      ai_model: "progno-baseline-v1",
      ai_rationale: baseline.proposal.thesis,
      approved_at: approvedAt,
      approved_by: null,
      components: baseline.proposal.components as unknown as Json,
      created_by: null,
      id: baseline.id,
      index_name: baseline.proposal.index_name,
      initiative_id: initiative.id,
      scale: "0-100",
      source_notes: baseline.proposal.source_notes,
      status: "approved" as const,
      target_year: 2036,
    }));

  if (inserts.length === 0) {
    return;
  }

  const { error: insertError } = await admin
    .from("metric_versions")
    .upsert(inserts, { onConflict: "id" });

  if (insertError) {
    throw new Error(`Baseline metric insert failed: ${insertError.message}`);
  }
}
