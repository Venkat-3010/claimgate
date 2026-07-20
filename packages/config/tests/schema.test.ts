import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { ClaimgateConfigSchema, defaultConfigYaml } from "../src/index.js";

describe("config schema", () => {
  it("parses default yaml", () => {
    const raw = parseYaml(defaultConfigYaml("demo"));
    const parsed = ClaimgateConfigSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.gates.length).toBeGreaterThan(0);
      expect(parsed.data.policy.failOnSkippedTests).toBe(true);
    }
  });
});
