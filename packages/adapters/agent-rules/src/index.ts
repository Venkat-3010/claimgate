import { access } from "node:fs/promises";
import { join } from "node:path";
import type { Finding, GateAdapter, GateContext, GateResult } from "@claimgate/core";
import { errorResult, failResult, passResult, resolveGateCwd } from "@claimgate/core";
import { z } from "zod";

const OptionsSchema = z.object({
  requiredFiles: z.array(z.string()).default(["AGENTS.md"]),
});

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function createAgentRulesAdapter(): GateAdapter {
  return {
    type: "agent-rules",
    async run(ctx: GateContext): Promise<GateResult> {
      const start = Date.now();
      const parsed = OptionsSchema.safeParse(ctx.gate.options ?? {});
      if (!parsed.success) {
        return errorResult(ctx.gate, "Invalid agent-rules options", 0, parsed.error.message);
      }
      const cwd = resolveGateCwd(ctx.root, ctx.gate.cwd);
      const findings: Finding[] = [];

      for (const file of parsed.data.requiredFiles) {
        if (!(await exists(join(cwd, file)))) {
          findings.push({
            code: "rules_missing",
            severity: "error",
            message: `Required agent rules file missing: ${file}`,
            path: file,
          });
        }
      }

      const durationMs = Date.now() - start;
      if (findings.length > 0) {
        return failResult(
          ctx.gate,
          `Agent rules gate failed (${findings.length} missing)`,
          findings,
          durationMs,
        );
      }
      return passResult(
        ctx.gate,
        `Agent rules present (${parsed.data.requiredFiles.length} file(s))`,
        durationMs,
        { requiredFiles: parsed.data.requiredFiles },
      );
    },
  };
}
