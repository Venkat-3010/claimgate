import { z } from "zod";

export const GateTypeSchema = z.enum([
  "typescript",
  "vitest",
  "drizzle",
  "env",
  "agent-rules",
  "command",
]);

export type GateType = z.infer<typeof GateTypeSchema>;

export const GateDefinitionSchema = z.object({
  id: z.string().min(1),
  type: GateTypeSchema,
  description: z.string().optional(),
  /** Working directory relative to repo root */
  cwd: z.string().optional(),
  /** Adapter-specific options */
  options: z.record(z.unknown()).optional(),
  /** Fail the whole verify if this gate fails (default true) */
  required: z.boolean().default(true),
});

export type GateDefinition = z.infer<typeof GateDefinitionSchema>;

export const ClaimgateConfigSchema = z.object({
  version: z.literal(1).default(1),
  name: z.string().optional(),
  /** Gates that must pass for verify to succeed */
  gates: z.array(GateDefinitionSchema).min(1),
  /** Paths considered when detecting deleted/skipped tests (vitest) */
  evidence: z
    .object({
      packDir: z.string().default(".claimgate/packs"),
      retain: z.number().int().positive().default(20),
    })
    .default({}),
  policy: z
    .object({
      /** Reject packs whose git HEAD does not match current HEAD */
      bindToHead: z.boolean().default(true),
      /** Fail if vitest discovers new .skip / xit / xtest */
      failOnSkippedTests: z.boolean().default(true),
      /** Fail if test file count drops vs baseline pack */
      failOnDeletedTests: z.boolean().default(true),
      /** Fail when vitest finds no test files / empty suite (finding code: no_tests) */
      failOnEmptyTests: z.boolean().default(true),
    })
    .default({}),
});

export type ClaimgateConfig = z.infer<typeof ClaimgateConfigSchema>;

export const DEFAULT_CONFIG_FILENAMES = [
  "claimgate.yaml",
  "claimgate.yml",
  ".claimgate.yaml",
  ".claimgate.yml",
] as const;
