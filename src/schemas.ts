// SPDX-License-Identifier: MIT
import { z } from "zod";

export const organismSchema = z.enum([
  "human",
  "mouse",
  "rat",
  "zebrafish",
  "fly",
  "worm",
  "yeast",
]);
export type Organism = z.infer<typeof organismSchema>;

export const outputIdTypeSchema = z.enum(["symbol", "ensembl"]);
export type OutputIdType = z.infer<typeof outputIdTypeSchema>;

export const binResolutionSchema = z.union([
  z.literal(3),
  z.literal(5),
  z.literal(10),
]);
export type BinResolution = z.infer<typeof binResolutionSchema>;

export const matchedNullInputSchema = z
  .object({
    gene_list: z
      .string()
      .min(1, "Gene list must not be empty"),
    organism: organismSchema.optional().default("human"),
    output_id_type: outputIdTypeSchema.optional().default("symbol"),
    sort_output: z.boolean().optional().default(true),
    match_expression: z.boolean().optional().default(true),
    match_length: z.boolean().optional().default(true),
    match_gc: z.boolean().optional().default(true),
    match_biotype: z.boolean().optional().default(false),
    bin_resolution: binResolutionSchema.optional().default(3),
    sampling_with_replacement: z.boolean().optional().default(false),
    null_set_count: z
      .number()
      .int()
      .min(1, "null_set_count must be at least 1")
      .max(50, "null_set_count cannot exceed 50")
      .optional()
      .default(10),
    seed: z.number().int().optional(),
    custom_background: z.string().optional(),
    background_is_custom: z.boolean().optional().default(false),
    tab: z.enum(["generator", "history"]).optional(),
  })
  .passthrough();
export type MatchedNullInput = z.infer<typeof matchedNullInputSchema>;

export function parseRunInput(input: unknown): MatchedNullInput {
  return matchedNullInputSchema.parse(input);
}
