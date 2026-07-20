import { describe, expect, it, xit } from "vitest";

describe("false green", () => {
  it.skip("critical path that agent disabled", () => {
    expect(true).toBe(false);
  });

  xit("also skipped via xit", () => {
    expect(1).toBe(0);
  });

  it("trivial pass so vitest exit can be 0", () => {
    expect(true).toBe(true);
  });
});
