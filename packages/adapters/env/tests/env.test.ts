import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkEnvContract, parseEnvKeys } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "..", "fixtures");

describe("env adapter", () => {
  it("parses env keys", () => {
    expect(parseEnvKeys("FOO=1\n# c\nBAR=2\n")).toEqual(["FOO", "BAR"]);
  });

  it("passes matching contract", async () => {
    const fixture = join(fixtures, "ok");
    const result = await checkEnvContract(fixture, "example.env", "runtime.env", undefined, []);
    expect(result.ok).toBe(true);
  });

  it("fails on drift", async () => {
    const fixture = join(fixtures, "drift");
    const result = await checkEnvContract(fixture, "example.env", "runtime.env", undefined, []);
    expect(result.ok).toBe(false);
    expect(result.findings.some((f) => f.code === "env_key_missing")).toBe(true);
  });
});
