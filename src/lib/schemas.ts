import { z } from "zod";

export const emailPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

export const forecastInputSchema = z.object({
  fail_value: z.coerce
    .number()
    .min(0, "Use a value from 0 to 100.")
    .max(100, "Use a value from 0 to 100."),
  pass_value: z.coerce
    .number()
    .min(0, "Use a value from 0 to 100.")
    .max(100, "Use a value from 0 to 100."),
});

export const metricComponentSchema = z.object({
  direction: z.enum(["higher_is_better", "lower_is_better"]),
  label: z.string().min(2).max(40),
  rationale: z.string().min(16).max(320),
  source: z.string().min(2).max(120),
  weight: z.number().int().min(1).max(100),
});

export const metricProposalSchema = z
  .object({
    components: z.array(metricComponentSchema).min(3).max(5),
    index_name: z.string().min(4).max(80),
    source_notes: z.string().min(16).max(320),
    thesis: z.string().min(40).max(500),
  })
  .superRefine((proposal, ctx) => {
    const total = proposal.components.reduce(
      (sum, component) => sum + component.weight,
      0,
    );

    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Component weights must sum to exactly 100.",
        path: ["components"],
      });
    }
  });

export const aiForecastPredictionSchema = z.object({
  fail_value: z.number().min(0).max(100),
  pass_value: z.number().min(0).max(100),
  rationale: z.string().min(40).max(600),
});

export const initiativeNewsSourceSchema = z.object({
  cited: z.boolean(),
  domain: z.string().min(1).max(120),
  political_lean: z.enum(["left", "center", "right"]).nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
  title: z.string().min(1).max(240),
  url: z.string().url(),
});

export const initiativeNewsAnalysisSchema = z
  .object({
    article_count: z.number().int().min(0).max(50),
    confidence_score: z.number().min(0).max(1),
    key_themes: z.array(z.string().min(2).max(80)).min(1).max(5),
    sentiment_label: z.enum(["negative", "mixed", "positive"]),
    sentiment_score: z.number().min(-100).max(100),
    source_titles: z.array(z.string().min(1).max(240)).min(1).max(5),
    // Keep source URLs as plain strings here because OpenAI structured outputs
    // reject JSON schema `format: "uri"` in responses.parse().
    source_urls: z.array(z.string().min(1).max(2048)).min(1).max(5),
    summary_en: z.string().min(40).max(900),
  })
  .superRefine((payload, ctx) => {
    if (payload.source_titles.length !== payload.source_urls.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "source_titles and source_urls must have the same length.",
        path: ["source_titles"],
      });
    }
  });

export type AuthFormInput = z.infer<typeof emailPasswordSchema>;
export type ForecastFormInput = z.infer<typeof forecastInputSchema>;
export type AIForecastPredictionInput = z.infer<typeof aiForecastPredictionSchema>;
export type MetricProposalInput = z.infer<typeof metricProposalSchema>;
export type InitiativeNewsAnalysisInput = z.infer<typeof initiativeNewsAnalysisSchema>;
export type InitiativeNewsSourceInput = z.infer<typeof initiativeNewsSourceSchema>;
