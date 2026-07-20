import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Finding, GateAdapter, GateContext, GateResult } from "@claimgate/core";
import { errorResult, failResult, passResult, resolveGateCwd } from "@claimgate/core";
import { z } from "zod";

const OptionsSchema = z.object({
  examplePath: z.string().default(".env.example"),
  /** If set, verify these keys exist (presence only, never log values) */
  envPath: z.string().optional(),
  /** Extra required keys beyond example file */
  requiredKeys: z.array(z.string()).optional(),
  /** Keys allowed to be missing from runtime env */
  optionalKeys: z.array(z.string()).default([]),
});

export function parseEnvKeys(content: string): string[] {
  const keys: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key) keys.push(key);
  }
  return keys;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function checkEnvContract(
  cwd: string,
  examplePath: string,
  envPath: string | undefined,
  requiredKeys: string[] | undefined,
  optionalKeys: string[],
): Promise<{ ok: boolean; findings: Finding[]; metrics: Record<string, unknown> }> {
  const findings: Finding[] = [];
  const absExample = join(cwd, examplePath);

  if (!(await exists(absExample))) {
    findings.push({
      code: "example_missing",
      severity: "error",
      message: `.env.example (or configured example) not found at ${examplePath}`,
      path: examplePath,
    });
    return { ok: false, findings, metrics: {} };
  }

  const exampleKeys = parseEnvKeys(await readFile(absExample, "utf8"));
  const contractKeys = [...new Set([...exampleKeys, ...(requiredKeys ?? [])])];
  const optional = new Set(optionalKeys);

  let runtimeKeys: string[] | null = null;
  if (envPath) {
    const absEnv = join(cwd, envPath);
    if (!(await exists(absEnv))) {
      findings.push({
        code: "env_missing",
        severity: "error",
        message: `Runtime env file not found at ${envPath}`,
        path: envPath,
      });
    } else {
      runtimeKeys = parseEnvKeys(await readFile(absEnv, "utf8"));
      const runtimeSet = new Set(runtimeKeys);
      for (const key of contractKeys) {
        if (optional.has(key)) continue;
        if (!runtimeSet.has(key)) {
          findings.push({
            code: "env_key_missing",
            severity: "error",
            message: `Required env key "${key}" from contract is missing in ${envPath}`,
            path: envPath,
            meta: { key },
          });
        }
      }
      for (const key of runtimeKeys) {
        if (!contractKeys.includes(key) && !optional.has(key)) {
          findings.push({
            code: "env_key_undeclared",
            severity: "warning",
            message: `Env key "${key}" present in ${envPath} but not in ${examplePath}`,
            path: envPath,
            meta: { key },
          });
        }
      }
    }
  }

  // Always validate example itself is non-empty when requiredKeys empty
  if (contractKeys.length === 0) {
    findings.push({
      code: "empty_contract",
      severity: "warning",
      message: "Env contract has no keys",
      path: examplePath,
    });
  }

  return {
    ok: !findings.some((f) => f.severity === "error"),
    findings,
    metrics: {
      examplePath,
      envPath: envPath ?? null,
      contractKeyCount: contractKeys.length,
      contractKeys,
      runtimeKeyCount: runtimeKeys?.length ?? null,
    },
  };
}

export function createEnvAdapter(): GateAdapter {
  return {
    type: "env",
    async run(ctx: GateContext): Promise<GateResult> {
      const start = Date.now();
      const parsed = OptionsSchema.safeParse(ctx.gate.options ?? {});
      if (!parsed.success) {
        return errorResult(ctx.gate, "Invalid env options", 0, parsed.error.message);
      }
      const options = parsed.data;
      const cwd = resolveGateCwd(ctx.root, ctx.gate.cwd);

      try {
        const result = await checkEnvContract(
          cwd,
          options.examplePath,
          options.envPath,
          options.requiredKeys,
          options.optionalKeys,
        );
        const durationMs = Date.now() - start;
        if (!result.ok) {
          return {
            ...failResult(
              ctx.gate,
              `Env contract failed (${result.findings.length} finding(s))`,
              result.findings,
              durationMs,
            ),
            metrics: result.metrics,
          };
        }
        return {
          ...passResult(
            ctx.gate,
            `Env contract OK (${String(result.metrics.contractKeyCount)} key(s))`,
            durationMs,
            result.metrics,
            result.findings,
          ),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult(ctx.gate, "Env adapter error", Date.now() - start, message);
      }
    },
  };
}
