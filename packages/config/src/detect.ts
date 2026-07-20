import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn";

export interface ProjectStack {
  packageManager: PackageManager;
  hasTypescript: boolean;
  hasVitest: boolean;
  hasDrizzle: boolean;
  hasEnvExample: boolean;
  hasNext: boolean;
  hasAgentRules: boolean;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function hasDep(
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
  name: string,
): boolean {
  return Boolean(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

export function packageManagerExec(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return "pnpm exec";
    case "yarn":
      return "yarn";
    default:
      return "npx";
  }
}

export async function detectPackageManager(root: string): Promise<PackageManager> {
  if (await exists(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (await exists(join(root, "yarn.lock"))) return "yarn";
  if (await exists(join(root, "package-lock.json"))) return "npm";
  if (await exists(join(root, "bun.lockb"))) return "npm";
  return "pnpm";
}

export async function detectProjectStack(root: string): Promise<ProjectStack> {
  const packageManager = await detectPackageManager(root);

  let pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } = {};
  try {
    const raw = await readFile(join(root, "package.json"), "utf8");
    pkg = JSON.parse(raw) as typeof pkg;
  } catch {
    // no package.json
  }

  const hasTypescript = (await exists(join(root, "tsconfig.json"))) || hasDep(pkg, "typescript");
  const hasVitest = hasDep(pkg, "vitest");
  const hasDrizzle =
    hasDep(pkg, "drizzle-orm") ||
    (await exists(join(root, "drizzle.config.ts"))) ||
    (await exists(join(root, "drizzle.config.js"))) ||
    (await exists(join(root, "drizzle")));
  const hasEnvExample = await exists(join(root, ".env.example"));
  const hasNext = hasDep(pkg, "next");
  const hasAgentRules =
    (await exists(join(root, "AGENTS.md"))) ||
    (await exists(join(root, "CLAUDE.md"))) ||
    (await exists(join(root, ".cursorrules"))) ||
    (await exists(join(root, ".cursor", "rules")));

  return {
    packageManager,
    hasTypescript,
    hasVitest,
    hasDrizzle,
    hasEnvExample,
    hasNext,
    hasAgentRules,
  };
}
