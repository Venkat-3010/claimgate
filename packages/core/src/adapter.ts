import type { ClaimgateConfig, GateDefinition } from "@claimgate/config";
import type { Finding, GateResult } from "./pack.js";

export interface GateContext {
  root: string;
  config: ClaimgateConfig;
  gate: GateDefinition;
  /** Previous pack for baseline comparisons (deleted tests, etc.) */
  previousPack: import("./pack.js").EvidencePack | null;
}

export interface GateAdapter {
  type: string;
  run(ctx: GateContext): Promise<GateResult>;
}

export function failResult(
  gate: GateDefinition,
  summary: string,
  findings: Finding[],
  durationMs: number,
  exitCode?: number,
): GateResult {
  return {
    gateId: gate.id,
    type: gate.type,
    status: "fail",
    durationMs,
    exitCode,
    summary,
    findings,
  };
}

export function passResult(
  gate: GateDefinition,
  summary: string,
  durationMs: number,
  metrics?: Record<string, unknown>,
  findings: Finding[] = [],
): GateResult {
  return {
    gateId: gate.id,
    type: gate.type,
    status: "pass",
    durationMs,
    summary,
    findings,
    metrics,
  };
}

export function errorResult(
  gate: GateDefinition,
  summary: string,
  durationMs: number,
  cause?: string,
): GateResult {
  return {
    gateId: gate.id,
    type: gate.type,
    status: "error",
    durationMs,
    summary,
    findings: cause ? [{ code: "adapter_error", severity: "error", message: cause }] : [],
  };
}
