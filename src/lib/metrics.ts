import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { getOpenAIConfig } from "@/lib/env";
import { metricProposalSchema } from "@/lib/schemas";
import type { InitiativeRow } from "@/lib/types";

export async function generateMetricProposal(initiative: InitiativeRow) {
  const config = getOpenAIConfig();

  if (!config) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    organization: config.organization,
    project: config.project,
  });

  const response = await client.responses.parse({
    model: config.model,
    instructions: [
      "You design a public-interest welfare index for a Swiss futurarchy simulation.",
      "Return valid JSON only.",
      "Use exactly 3 to 5 components.",
      "Use integer weights that sum to exactly 100.",
      "Keep the proposal legible to policy-interested citizens, not only economists.",
      "Bias toward measurable Swiss federal statistics or durable public datasets.",
      "The final index must be normalized onto a 0-100 scale by 2036.",
    ].join(" "),
    input: [
      {
        content: [
          {
            text: [
              `Initiative title: ${initiative.official_title}`,
              `Initiative type: ${initiative.type}`,
              `Vote date: ${initiative.vote_date}`,
              `English summary: ${initiative.summary_en}`,
              "Task: propose a composite welfare metric for the initiative's pass/fail prediction market.",
            ].join("\n"),
            type: "input_text",
          },
        ],
        role: "user",
        type: "message",
      },
    ],
    text: {
      format: zodTextFormat(metricProposalSchema, "progno_metric_proposal"),
      verbosity: "medium",
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured metric proposal.");
  }

  return {
    model: config.model,
    proposal: response.output_parsed,
  };
}

