import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { type ProjectStack, packageManagerExec } from "./detect.js";
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

const FALLBACK_STACK: ProjectStack = {
  packageManager: "pnpm",
  hasTypescript: true,
  hasVitest: true,
  hasDrizzle: true,
  hasEnvExample: true,
  hasNext: false,
  hasAgentRules: false,
};

function gateYaml(id: string, type: string, description: string, optionsLines: string[]): string {
  const opts =
    optionsLines.length === 0
      ? ""
      : `\n    options:\n${optionsLines.map((l) => `      ${l}`).join("\n")}`;
  return `  - id: ${id}
    type: ${type}
    description: ${description}${opts}`;
}

/** Build claimgate.yaml text from detected (or fallback) stack. */
export function defaultConfigYaml(
  projectName = "my-project",
  stack: ProjectStack = FALLBACK_STACK,
): string {
  const exec = packageManagerExec(stack.packageManager);
  const gates: string[] = [];

  if (stack.hasTypescript) {
    gates.push(
      gateYaml("typecheck", "typescript", "TypeScript must compile with no errors", [
        `command: ${exec} tsc --noEmit`,
      ]),
    );
  }

  if (stack.hasVitest) {
    gates.push(
      gateYaml("unit-tests", "vitest", "Unit tests must pass; no new skips; no deleted tests", [
        `command: ${exec} vitest run`,
        "testGlobs:",
        '  - "**/*.{test,spec}.{ts,tsx,js,jsx}"',
      ]),
    );
  }

  if (stack.hasNext) {
    gates.push(
      gateYaml(
        "lint",
        "command",
        "Lint must pass (Next build can succeed while lint fails — keep this gate)",
        [`command: ${exec} next lint`],
      ),
    );
    gates.push(
      gateYaml("build", "command", "Production build must succeed", [
        `command: ${exec} next build`,
      ]),
    );
  }

  if (stack.hasDrizzle) {
    gates.push(
      gateYaml("drizzle", "drizzle", "Schema changes must have matching migrations", [
        "schemaPath: src/db/schema.ts",
        "migrationsDir: drizzle",
      ]),
    );
  }

  if (stack.hasEnvExample) {
    gates.push(
      gateYaml("env", "env", "Required env keys must match .env.example contract", [
        "examplePath: .env.example",
        "# Optional: path to actual env file to check presence (not values)",
        "# envPath: .env",
      ]),
    );
  }

  if (stack.hasAgentRules) {
    gates.push(
      gateYaml("agent-rules", "agent-rules", "Required agent instruction files present", [
        "requiredFiles:",
        "  - AGENTS.md",
      ]),
    );
  }

  // Always emit at least one gate so schema validation succeeds
  if (gates.length === 0) {
    gates.push(
      gateYaml("unit-tests", "vitest", "Unit tests must pass; no new skips; no deleted tests", [
        `command: ${exec} vitest run`,
        "testGlobs:",
        '  - "**/*.{test,spec}.{ts,tsx,js,jsx}"',
      ]),
    );
  }

  const pmNote =
    stack.packageManager !== "pnpm"
      ? `\n# Detected package manager: ${stack.packageManager}\n`
      : "";

  const nextHint = stack.hasNext
    ? "\n# Next.js: build can pass while lint fails — lint gate is configured above.\n"
    : "";

  return `# claimgate.yaml — evidence-gated verification
# Don't trust the agent. Trust the evidence.${pmNote}${nextHint}version: 1
name: ${projectName}

gates:
${gates.join("\n\n")}

policy:
  bindToHead: true
  failOnSkippedTests: true
  failOnDeletedTests: true
  failOnEmptyTests: true

evidence:
  packDir: .claimgate/packs
  retain: 20
`;
}
