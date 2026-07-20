import { randomUUID } from "node:crypto";
import type { ClaimgateConfig } from "@claimgate/config";
import type { GateAdapter } from "./adapter.js";
import { errorResult } from "./adapter.js";
import { getGitInfo } from "./git.js";
import { type EvidencePack, type GateResult, overallFromGates } from "./pack.js";

export interface RunnerOptions {
  root: string;
  config: ClaimgateConfig;
  adapters: Map<string, GateAdapter>;
  previousPack?: EvidencePack | null;
  /** Only run these gate ids (optional) */
  only?: string[];
}

export interface RunnerResult {
  pack: EvidencePack;
  exitCode: number;
}

export async function runGates(opts: RunnerOptions): Promise<RunnerResult> {
  const { root, config, adapters } = opts;
  const previousPack = opts.previousPack ?? null;
  const gates = opts.only ? config.gates.filter((g) => opts.only?.includes(g.id)) : config.gates;

  const results: GateResult[] = [];

  for (const gate of gates) {
    const adapter = adapters.get(gate.type);
    if (!adapter) {
      results.push(
        errorResult(
          gate,
          `No adapter registered for gate type "${gate.type}"`,
          0,
          `Unknown gate type: ${gate.type}`,
        ),
      );
      continue;
    }

    try {
      const result = await adapter.run({
        root,
        config,
        gate,
        previousPack,
      });
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push(errorResult(gate, `Adapter threw: ${message}`, 0, message));
    }
  }

  const git = await getGitInfo(root);
  const overall = overallFromGates(
    results.filter((r) => {
      const def = config.gates.find((g) => g.id === r.gateId);
      return def?.required !== false;
    }),
  );

  const baselines = collectBaselines(results);

  const pack: EvidencePack = {
    schemaVersion: 1,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    git,
    configName: config.name,
    overall,
    gates: results,
    baselines,
  };

  const exitCode = overall === "pass" || overall === "skip" ? 0 : 1;
  return { pack, exitCode };
}

function collectBaselines(results: GateResult[]): EvidencePack["baselines"] {
  const testFiles: string[] = [];
  const skippedTests: string[] = [];

  for (const r of results) {
    const files = r.metrics?.testFiles;
    if (Array.isArray(files)) {
      for (const f of files) {
        if (typeof f === "string") testFiles.push(f);
      }
    }
    const skipped = r.metrics?.skippedTests;
    if (Array.isArray(skipped)) {
      for (const s of skipped) {
        if (typeof s === "string") skippedTests.push(s);
      }
    }
  }

  if (testFiles.length === 0 && skippedTests.length === 0) return undefined;
  return { testFiles, skippedTests };
}
