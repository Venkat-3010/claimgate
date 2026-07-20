import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import type { Finding, GateAdapter, GateContext, GateResult } from "@claimgate/core";
import { errorResult, failResult, passResult, resolveGateCwd, runCommand } from "@claimgate/core";
import fg from "fast-glob";
import { z } from "zod";

const OptionsSchema = z.object({
  command: z.string().default("pnpm exec vitest run"),
  testGlobs: z.array(z.string()).default(["**/*.{test,spec}.{ts,tsx,js,jsx,mjs,cjs}"]),
  ignore: z.array(z.string()).default(["**/node_modules/**", "**/dist/**"]),
});

/** Patterns that indicate intentionally skipped tests */
const SKIP_PATTERNS: RegExp[] = [
  /\b(?:it|test|describe)\.skip\s*\(/g,
  /\bxit\s*\(/g,
  /\bxtest\s*\(/g,
  /\bxdescribe\s*\(/g,
];

export interface TestInventory {
  testFiles: string[];
  skipped: Array<{ file: string; kind: string }>;
}

export async function inventoryTests(
  cwd: string,
  globs: string[],
  ignore: string[],
): Promise<TestInventory> {
  const files = await fg(globs, { cwd, ignore, absolute: false, onlyFiles: true });
  const skipped: TestInventory["skipped"] = [];

  for (const file of files) {
    let content: string;
    try {
      content = await readFile(`${cwd}/${file}`.replace(/\\/g, "/"), "utf8");
    } catch {
      // Windows path fallback
      const { join } = await import("node:path");
      content = await readFile(join(cwd, file), "utf8");
    }

    for (const pattern of SKIP_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = content.match(pattern);
      if (matches) {
        for (const m of matches) {
          skipped.push({ file, kind: m.trim().replace(/\($/, "") });
        }
      }
    }
  }

  return {
    testFiles: files.map((f) => f.replace(/\\/g, "/")).sort(),
    skipped,
  };
}

export function createVitestAdapter(): GateAdapter {
  return {
    type: "vitest",
    async run(ctx: GateContext): Promise<GateResult> {
      const start = Date.now();
      const parsed = OptionsSchema.safeParse(ctx.gate.options ?? {});
      if (!parsed.success) {
        return errorResult(ctx.gate, "Invalid vitest options", 0, parsed.error.message);
      }
      const options = parsed.data;
      const cwd = resolveGateCwd(ctx.root, ctx.gate.cwd);
      const findings: Finding[] = [];

      const inventory = await inventoryTests(cwd, options.testGlobs, options.ignore);
      const skipLabels = inventory.skipped.map((s) => `${s.file}:${s.kind}`);

      if (ctx.config.policy.failOnSkippedTests && inventory.skipped.length > 0) {
        // Compare against previous baseline — only fail on *new* skips if we have a baseline
        const prevSkipped = new Set(ctx.previousPack?.baselines?.skippedTests ?? []);
        const newSkips = skipLabels.filter((s) => !prevSkipped.has(s));

        // On first run (no baseline), any skip is a finding if policy says so
        const offending = ctx.previousPack ? newSkips : skipLabels;
        if (offending.length > 0) {
          for (const s of offending) {
            findings.push({
              code: "skipped_test",
              severity: "error",
              message: `Skipped/disabled test detected: ${s}`,
              path: s.split(":")[0],
            });
          }
        }
      }

      if (ctx.config.policy.failOnDeletedTests && ctx.previousPack?.baselines?.testFiles) {
        const prev = new Set(ctx.previousPack.baselines.testFiles);
        const curr = new Set(inventory.testFiles);
        const deleted = [...prev].filter((f) => !curr.has(f));
        for (const file of deleted) {
          findings.push({
            code: "deleted_test",
            severity: "error",
            message: `Test file disappeared vs previous evidence pack: ${file}`,
            path: file,
          });
        }
      }

      const cmd = await runCommand({ cwd, command: options.command });

      if (cmd.timedOut) {
        findings.push({
          code: "timeout",
          severity: "error",
          message: "Vitest command timed out",
        });
      }

      if (cmd.exitCode !== 0) {
        findings.push({
          code: "test_failure",
          severity: "error",
          message: `Vitest exited with code ${cmd.exitCode}`,
          meta: {
            stderrTail: cmd.stderr.slice(-2000),
            stdoutTail: cmd.stdout.slice(-2000),
          },
        });
      }

      // False green: agent claims pass but exit nonzero — already covered by exit check.
      // Also catch: exit 0 but we found skip/delete policy violations.
      const durationMs = Date.now() - start;
      const metrics = {
        testFiles: inventory.testFiles,
        skippedTests: skipLabels,
        exitCode: cmd.exitCode,
        relativeRoot: relative(ctx.root, cwd) || ".",
      };

      if (findings.some((f) => f.severity === "error") || cmd.exitCode !== 0) {
        return {
          ...failResult(
            ctx.gate,
            `Vitest gate failed (${findings.length} finding(s), exit ${cmd.exitCode})`,
            findings,
            durationMs,
            cmd.exitCode,
          ),
          metrics,
        };
      }

      return {
        ...passResult(
          ctx.gate,
          `Vitest passed (${inventory.testFiles.length} test file(s))`,
          durationMs,
          metrics,
          findings,
        ),
        exitCode: cmd.exitCode,
      };
    },
  };
}

export { OptionsSchema as VitestOptionsSchema };
