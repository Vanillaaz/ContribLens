import { z } from "zod";

export const AnalyticsRequestSchema = z.object({
  login: z.string()
    .min(1, "GitHub login is required")
    .max(39, "GitHub login cannot exceed 39 characters")
    .regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, "Invalid GitHub login format"),
  
  window: z.union([
    z.literal("1y"),
    z.literal("all"),
    // Could add strict ISO8601 validation for custom windows here if needed
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, "Custom window must be ISO8601 UTC")
  ]).default("1y"),

  theme: z.string().default("default-dark"),
  
  // Cache busting or forced refresh flag for the API
  refresh: z.boolean().default(false).or(z.string().transform(s => s === "true")),
});

export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;
