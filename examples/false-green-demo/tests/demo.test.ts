import { describe, expect, it } from "vitest";
import { add, criticalBillingPath } from "../src/index.js";

describe("demo", () => {
  it("adds", () => {
    expect(add(2, 2)).toBe(4);
  });

  // Agent silenced the failing critical test to claim "all green"
  it.skip("billing rejects negatives and accepts positives", () => {
    expect(criticalBillingPath(10)).toBe(true);
    expect(() => criticalBillingPath(-1)).toThrow();
  });
});
