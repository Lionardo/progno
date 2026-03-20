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

export type AuthFormInput = z.infer<typeof emailPasswordSchema>;
export type ForecastFormInput = z.infer<typeof forecastInputSchema>;
export type MetricProposalInput = z.infer<typeof metricProposalSchema>;

