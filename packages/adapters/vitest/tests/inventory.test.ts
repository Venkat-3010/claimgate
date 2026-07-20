import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { inventoryTests } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "..", "fixtures");

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
});
