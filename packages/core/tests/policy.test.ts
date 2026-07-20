import type { ClaimgateConfig } from "@claimgate/config";
import { describe, expect, it } from "vitest";
import { type GateResult, overallFromGates } from "../src/pack.js";
import type { EvidencePack } from "../src/pack.js";
import { evaluatePackPolicy } from "../src/policy.js";

function gate(partial: Partial<GateResult> & Pick<GateResult, "gateId" | "status">): GateResult {
  return {
    type: "command",
    durationMs: 1,
    summary: "test",
    findings: [],
    ...partial,
  };
}

describe("overallFromGates", () => {
  it("returns pass when all pass", () => {
    expect(overallFromGates([gate({ gateId: "a", status: "pass" })])).toBe("pass");
  });

  it("returns fail when any fail", () => {
    expect(
      overallFromGates([
        gate({ gateId: "a", status: "pass" }),
        gate({ gateId: "b", status: "fail" }),
      ]),
    ).toBe("fail");
  });

  it("returns error when any error", () => {
    expect(overallFromGates([gate({ gateId: "a", status: "error" })])).toBe("error");
  });
});

describe("evaluatePackPolicy", () => {
  const config = {
    version: 1 as const,
    gates: [
      {
        id: "unit",
        type: "vitest" as const,
        required: true,
      },
    ],
    evidence: { packDir: ".claimgate/packs", retain: 20 },
    policy: {
      bindToHead: true,
      failOnSkippedTests: true,
      failOnDeletedTests: true,
    },
  } satisfies ClaimgateConfig;

  it("flags head mismatch", () => {
    const pack: EvidencePack = {
      schemaVersion: 1,
      id: "x",
      createdAt: new Date().toISOString(),
      git: { head: "aaa", branch: "main", dirty: false },
      overall: "pass",
      gates: [gate({ gateId: "unit", status: "pass", exitCode: 0 })],
    };
    const verdict = evaluatePackPolicy(pack, config, "bbb");
    expect(verdict.ok).toBe(false);
    expect(verdict.findings.some((f) => f.code === "head_mismatch")).toBe(true);
  });

  it("flags false-green exit codes", () => {
    const pack: EvidencePack = {
      schemaVersion: 1,
      id: "x",
      createdAt: new Date().toISOString(),
      git: { head: "aaa", branch: "main", dirty: false },
      overall: "pass",
      gates: [gate({ gateId: "unit", status: "pass", exitCode: 1 })],
    };
    const verdict = evaluatePackPolicy(pack, config, "aaa");
    expect(verdict.ok).toBe(false);
    expect(verdict.findings.some((f) => f.code === "false_green_exit")).toBe(true);
  });
});
