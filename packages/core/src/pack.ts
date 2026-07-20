import { z } from "zod";

export const GateStatusSchema = z.enum(["pass", "fail", "skip", "error"]);
export type GateStatus = z.infer<typeof GateStatusSchema>;

export const FindingSchema = z.object({
  code: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  path: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const GateResultSchema = z.object({
  gateId: z.string(),
  type: z.string(),
  status: GateStatusSchema,
  durationMs: z.number().nonnegative(),
  exitCode: z.number().optional(),
  summary: z.string(),
  findings: z.array(FindingSchema).default([]),
  metrics: z.record(z.unknown()).optional(),
});

export type GateResult = z.infer<typeof GateResultSchema>;

export const EvidencePackSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  createdAt: z.string().datetime(),
  git: z.object({
    head: z.string().nullable(),
    branch: z.string().nullable(),
    dirty: z.boolean(),
  }),
  configName: z.string().optional(),
  overall: GateStatusSchema,
  gates: z.array(GateResultSchema),
  /** Snapshot used by vitest adapter for delete detection */
  baselines: z
    .object({
      testFiles: z.array(z.string()).optional(),
      skippedTests: z.array(z.string()).optional(),
    })
    .optional(),
});

export type EvidencePack = z.infer<typeof EvidencePackSchema>;

export function overallFromGates(gates: GateResult[]): GateStatus {
  if (gates.some((g) => g.status === "error")) return "error";
  if (gates.some((g) => g.status === "fail")) return "fail";
  if (gates.every((g) => g.status === "skip")) return "skip";
  return "pass";
}
