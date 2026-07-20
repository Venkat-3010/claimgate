import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ClaimgateConfig } from "@claimgate/config";
import { describe, expect, it } from "vitest";
import { createVitestAdapter, inventoryTests, isEmptyTestSuite } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "..", "fixtures");

function baseConfig(failOnEmptyTests = true): ClaimgateConfig {
  return {
    version: 1,
    gates: [{ id: "unit-tests", type: "vitest", required: true }],
    evidence: { packDir: ".claimgate/packs", retain: 20 },
    policy: {
      bindToHead: true,
      failOnSkippedTests: true,
      failOnDeletedTests: true,
      failOnEmptyTests,
    },
  };
}

describe("vitest adapter inventory", () => {
  it("detects .skip / xit in false-green fixture", async () => {
    const fixture = join(fixtures, "skip-false-green");
    const inv = await inventoryTests(fixture, ["**/*.{test,spec}.ts"], ["**/node_modules/**"]);
    expect(inv.testFiles.length).toBeGreaterThan(0);
    expect(inv.skipped.length).toBeGreaterThan(0);
    expect(inv.skipped.some((s) => s.kind.includes("skip") || s.kind.includes("xit"))).toBe(true);
  });

  it("pass fixture has no skips", async () => {
    const fixture = join(fixtures, "pass");
    const inv = await inventoryTests(fixture, ["**/*.{test,spec}.ts"], ["**/node_modules/**"]);
    expect(inv.skipped).toHaveLength(0);
  });

  it("empty fixture has zero test files", async () => {
    const fixture = join(fixtures, "empty");
    const inv = await inventoryTests(fixture, ["**/*.{test,spec}.ts"], ["**/node_modules/**"]);
    expect(inv.testFiles).toHaveLength(0);
  });
});

describe("isEmptyTestSuite", () => {
  it("detects empty inventory", () => {
    expect(isEmptyTestSuite(0, "", "")).toBe(true);
  });

  it("detects vitest empty-suite message", () => {
    expect(isEmptyTestSuite(1, "No test files found, exiting with code 1", "")).toBe(true);
  });

  it("is false for normal output", () => {
    expect(isEmptyTestSuite(2, "Test Files  2 passed", "")).toBe(false);
  });
});

describe("vitest adapter no_tests", () => {
  it("surfaces no_tests instead of test_failure when suite is empty", async () => {
    const fixture = join(fixtures, "empty");
    const adapter = createVitestAdapter();
    const result = await adapter.run({
      root: fixture,
      config: baseConfig(true),
      gate: {
        id: "unit-tests",
        type: "vitest",
        required: true,
        options: {
          // Avoid depending on vitest in the fixture; simulate empty-suite exit
          command: "node -e \"console.error('No test files found'); process.exit(1)\"",
          testGlobs: ["**/*.{test,spec}.ts"],
        },
      },
      previousPack: null,
    });

    expect(result.status).toBe("fail");
    expect(result.findings.some((f) => f.code === "no_tests")).toBe(true);
    expect(result.findings.some((f) => f.code === "test_failure")).toBe(false);
  });

  it("ignores empty-suite exit when failOnEmptyTests is false", async () => {
    const fixture = join(fixtures, "empty");
    const adapter = createVitestAdapter();
    const result = await adapter.run({
      root: fixture,
      config: baseConfig(false),
      gate: {
        id: "unit-tests",
        type: "vitest",
        required: true,
        options: {
          command: "node -e \"console.error('No test files found'); process.exit(1)\"",
          testGlobs: ["**/*.{test,spec}.ts"],
        },
      },
      previousPack: null,
    });

    expect(result.status).toBe("pass");
    expect(result.findings.some((f) => f.code === "no_tests")).toBe(false);
  });
});
