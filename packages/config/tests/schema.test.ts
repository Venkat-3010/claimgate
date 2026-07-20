import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
  defaultConfigYaml,
  detectPackageManager,
  detectProjectStack,
  packageManagerExec,
} from "../src/index.js";
import { ClaimgateConfigSchema } from "../src/schema.js";

describe("config schema", () => {
  it("parses default yaml", () => {
    const raw = parseYaml(defaultConfigYaml("demo"));
    const parsed = ClaimgateConfigSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.gates.length).toBeGreaterThan(0);
      expect(parsed.data.policy.failOnSkippedTests).toBe(true);
      expect(parsed.data.policy.failOnEmptyTests).toBe(true);
    }
  });

  it("defaults failOnEmptyTests to true when omitted", () => {
    const parsed = ClaimgateConfigSchema.safeParse({
      version: 1,
      gates: [{ id: "t", type: "vitest" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.policy.failOnEmptyTests).toBe(true);
    }
  });
});

describe("defaultConfigYaml stack", () => {
  it("uses npm exec prefix and skips drizzle/env when absent", () => {
    const yaml = defaultConfigYaml("app", {
      packageManager: "npm",
      hasTypescript: true,
      hasVitest: true,
      hasDrizzle: false,
      hasEnvExample: false,
      hasNext: false,
      hasAgentRules: false,
    });
    expect(yaml).toContain("npx tsc --noEmit");
    expect(yaml).toContain("npx vitest run");
    expect(yaml).not.toContain("type: drizzle");
    expect(yaml).not.toContain("type: env");
  });

  it("includes next lint + build gates and hint", () => {
    const yaml = defaultConfigYaml("web", {
      packageManager: "pnpm",
      hasTypescript: true,
      hasVitest: false,
      hasDrizzle: false,
      hasEnvExample: false,
      hasNext: true,
      hasAgentRules: false,
    });
    expect(yaml).toContain("next lint");
    expect(yaml).toContain("next build");
    expect(yaml).toMatch(/build can pass while lint fails/i);
  });
});

describe("detectProjectStack", () => {
  it("detects npm lockfile and next dependency", async () => {
    const dir = await mkdtemp(join(tmpdir(), "claimgate-stack-"));
    await writeFile(join(dir, "package-lock.json"), "{}\n", "utf8");
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        dependencies: { next: "15.0.0" },
        devDependencies: { typescript: "5.0.0", vitest: "2.0.0" },
      }),
      "utf8",
    );
    await writeFile(join(dir, "tsconfig.json"), "{}\n", "utf8");
    await writeFile(join(dir, ".env.example"), "FOO=1\n", "utf8");
    await mkdir(join(dir, "drizzle"), { recursive: true });

    expect(await detectPackageManager(dir)).toBe("npm");
    expect(packageManagerExec("npm")).toBe("npx");

    const stack = await detectProjectStack(dir);
    expect(stack.packageManager).toBe("npm");
    expect(stack.hasNext).toBe(true);
    expect(stack.hasTypescript).toBe(true);
    expect(stack.hasVitest).toBe(true);
    expect(stack.hasEnvExample).toBe(true);
    expect(stack.hasDrizzle).toBe(true);
  });

  it("skips drizzle and env when not present", async () => {
    const dir = await mkdtemp(join(tmpdir(), "claimgate-stack-"));
    await writeFile(join(dir, "pnpm-lock.yaml"), "lockfileVersion: 9\n", "utf8");
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ name: "plain", devDependencies: { vitest: "2.0.0" } }),
      "utf8",
    );

    const stack = await detectProjectStack(dir);
    expect(stack.packageManager).toBe("pnpm");
    expect(stack.hasDrizzle).toBe(false);
    expect(stack.hasEnvExample).toBe(false);
    expect(stack.hasNext).toBe(false);
  });
});
