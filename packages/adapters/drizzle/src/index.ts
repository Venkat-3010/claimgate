import { createHash } from "node:crypto";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Finding, GateAdapter, GateContext, GateResult } from "@claimgate/core";
import { errorResult, failResult, passResult, resolveGateCwd } from "@claimgate/core";
import { z } from "zod";

const OptionsSchema = z.object({
  schemaPath: z.string().default("src/db/schema.ts"),
  migrationsDir: z.string().default("drizzle"),
  /** Optional journal file (drizzle meta) */
  journalPath: z.string().optional(),
});

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(path: string): Promise<string> {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

async function listMigrations(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && /\.(sql|ts|js)$/.test(e.name))
    .map((e) => e.name)
    .sort();
}

/**
 * Heuristic: if schema exists and mentions pgTable/sqliteTable/mysqlTable
 * but migrations dir is empty or missing, fail.
 * Also fail if schema mtime is newer than newest migration by a large margin
 * AND schema hash is not referenced in any migration meta — simple v0 check:
 * schema has table defs + zero migrations => fail.
 */
export async function checkDrizzleConsistency(
  cwd: string,
  schemaPath: string,
  migrationsDir: string,
  journalPath?: string,
): Promise<{ ok: boolean; findings: Finding[]; metrics: Record<string, unknown> }> {
  const findings: Finding[] = [];
  const absSchema = join(cwd, schemaPath);
  const absMigrations = join(cwd, migrationsDir);

  if (!(await exists(absSchema))) {
    findings.push({
      code: "schema_missing",
      severity: "error",
      message: `Drizzle schema not found at ${schemaPath}`,
      path: schemaPath,
    });
    return { ok: false, findings, metrics: {} };
  }

  const schemaSource = await readFile(absSchema, "utf8");
  const hasTables = /\b(?:pgTable|sqliteTable|mysqlTable|singlestoreTable)\s*\(/.test(schemaSource);

  const migrations = await listMigrations(absMigrations);
  const schemaHash = await hashFile(absSchema);
  const schemaStat = await stat(absSchema);

  let journalMigrations = 0;
  const journal = journalPath ?? join(migrationsDir, "meta", "_journal.json");
  const absJournal = join(cwd, journal);
  if (await exists(absJournal)) {
    try {
      const journalJson = JSON.parse(await readFile(absJournal, "utf8")) as {
        entries?: unknown[];
      };
      journalMigrations = journalJson.entries?.length ?? 0;
    } catch {
      findings.push({
        code: "journal_invalid",
        severity: "warning",
        message: `Could not parse drizzle journal at ${journal}`,
        path: journal,
      });
    }
  }

  if (hasTables && migrations.length === 0 && journalMigrations === 0) {
    findings.push({
      code: "missing_migration",
      severity: "error",
      message:
        "Drizzle schema defines tables but no migrations were found. Generate a migration before claiming done.",
      path: schemaPath,
    });
  }

  // Marker file convention: .claimgate-schema-hash in migrations dir from last generate
  const hashMarker = join(absMigrations, ".claimgate-schema-hash");
  if (await exists(hashMarker)) {
    const recorded = (await readFile(hashMarker, "utf8")).trim();
    if (recorded !== schemaHash && hasTables) {
      findings.push({
        code: "schema_drift",
        severity: "error",
        message: "Schema hash differs from last recorded migration hash. Run drizzle-kit generate.",
        path: schemaPath,
        meta: { schemaHash, recorded },
      });
    }
  }

  const metrics = {
    schemaPath,
    schemaHash,
    schemaMtime: schemaStat.mtime.toISOString(),
    migrationCount: migrations.length,
    journalMigrations,
    migrations,
  };

  return {
    ok: !findings.some((f) => f.severity === "error"),
    findings,
    metrics,
  };
}

export function createDrizzleAdapter(): GateAdapter {
  return {
    type: "drizzle",
    async run(ctx: GateContext): Promise<GateResult> {
      const start = Date.now();
      const parsed = OptionsSchema.safeParse(ctx.gate.options ?? {});
      if (!parsed.success) {
        return errorResult(ctx.gate, "Invalid drizzle options", 0, parsed.error.message);
      }
      const options = parsed.data;
      const cwd = resolveGateCwd(ctx.root, ctx.gate.cwd);

      try {
        const result = await checkDrizzleConsistency(
          cwd,
          options.schemaPath,
          options.migrationsDir,
          options.journalPath,
        );
        const durationMs = Date.now() - start;
        if (!result.ok) {
          return {
            ...failResult(
              ctx.gate,
              `Drizzle gate failed (${result.findings.length} finding(s))`,
              result.findings,
              durationMs,
            ),
            metrics: result.metrics,
          };
        }
        return {
          ...passResult(
            ctx.gate,
            `Drizzle schema/migrations consistent (${String(result.metrics.migrationCount)} migration(s))`,
            durationMs,
            result.metrics,
            result.findings,
          ),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult(ctx.gate, "Drizzle adapter error", Date.now() - start, message);
      }
    },
  };
}
