import type { ClaimgateConfig } from "@claimgate/config";
import type { EvidencePack, Finding } from "./pack.js";

export interface PolicyVerdict {
  ok: boolean;
  findings: Finding[];
}

/**
 * Policy checks on an evidence pack independent of gate adapters.
 * CI should re-run gates; local packs are advisory only for merge.
 */
export function evaluatePackPolicy(
  pack: EvidencePack,
  config: ClaimgateConfig,
  currentHead: string | null,
): PolicyVerdict {
  const findings: Finding[] = [];

  if (config.policy.bindToHead && currentHead && pack.git.head && pack.git.head !== currentHead) {
    findings.push({
      code: "head_mismatch",
      severity: "error",
      message: `Pack bound to ${pack.git.head.slice(0, 7)} but current HEAD is ${currentHead.slice(0, 7)}. Re-run claimgate verify.`,
    });
  }

  for (const gate of pack.gates) {
    const def = config.gates.find((g) => g.id === gate.gateId);
    if (!def || def.required === false) continue;

    if (gate.status === "pass" && gate.exitCode !== undefined && gate.exitCode !== 0) {
      findings.push({
        code: "false_green_exit",
        severity: "error",
        message: `Gate "${gate.gateId}" claimed pass with nonzero exit code ${gate.exitCode}`,
        path: gate.gateId,
      });
    }
  }

  if (pack.overall === "pass" && pack.gates.some((g) => g.status === "fail")) {
    const requiredFails = pack.gates.filter((g) => {
      if (g.status !== "fail") return false;
      const def = config.gates.find((d) => d.id === g.gateId);
      return def?.required !== false;
    });
    if (requiredFails.length > 0) {
      findings.push({
        code: "overall_inconsistency",
        severity: "error",
        message: "Pack overall is pass but required gates failed",
      });
    }
  }

  return { ok: findings.length === 0, findings };
}
