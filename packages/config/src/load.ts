import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { type ClaimgateConfig, ClaimgateConfigSchema, DEFAULT_CONFIG_FILENAMES } from "./schema.js";

export class ConfigError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ConfigError";
  }
}

export async function findConfigPath(root: string): Promise<string | null> {
  const { access } = await import("node:fs/promises");
  for (const name of DEFAULT_CONFIG_FILENAMES) {
    const candidate = join(root, name);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  return null;
}

export async function loadConfig(root: string, explicitPath?: string): Promise<ClaimgateConfig> {
  const path = explicitPath ?? (await findConfigPath(root));
  if (!path) {
    throw new ConfigError(
      `No claimgate.yaml found in ${root}. Run \`claimgate init\` to create one.`,
    );
  }

  let raw: unknown;
  try {
    const text = await readFile(path, "utf8");
    raw = parseYaml(text);
  } catch (err) {
    throw new ConfigError(`Failed to read config at ${path}`, { cause: err });
  }

  const parsed = ClaimgateConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ConfigError(`Invalid claimgate config: ${details}`);
  }

  return parsed.data;
}

export function defaultConfigYaml(projectName = "my-project"): string {
  return `# claimgate.yaml — evidence-gated verification
# Don't trust the agent. Trust the evidence.
version: 1
name: ${projectName}

gates:
  - id: typecheck
    type: typescript
    description: TypeScript must compile with no errors
    options:
      command: pnpm exec tsc --noEmit

  - id: unit-tests
    type: vitest
    description: Unit tests must pass; no new skips; no deleted tests
    options:
      command: pnpm exec vitest run
      testGlobs:
        - "**/*.{test,spec}.{ts,tsx,js,jsx}"

  - id: drizzle
    type: drizzle
    description: Schema changes must have matching migrations
    options:
      schemaPath: src/db/schema.ts
      migrationsDir: drizzle

  - id: env
    type: env
    description: Required env keys must match .env.example contract
    options:
      examplePath: .env.example
      # Optional: path to actual env file to check presence (not values)
      # envPath: .env

policy:
  bindToHead: true
  failOnSkippedTests: true
  failOnDeletedTests: true

evidence:
  packDir: .claimgate/packs
  retain: 20
`;
}
