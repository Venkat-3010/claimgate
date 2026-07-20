import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkDrizzleConsistency } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "..", "fixtures");

describe("drizzle adapter", () => {
  it("passes when migrations exist", async () => {
    const fixture = join(fixtures, "ok");
    const result = await checkDrizzleConsistency(fixture, "schema.ts", "drizzle");
    expect(result.ok).toBe(true);
  });

  it("fails when schema has tables but no migrations", async () => {
    const fixture = join(fixtures, "missing-migration");
    const result = await checkDrizzleConsistency(fixture, "schema.ts", "drizzle");
    expect(result.ok).toBe(false);
    expect(result.findings.some((f) => f.code === "missing_migration")).toBe(true);
  });
});
