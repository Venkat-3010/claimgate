import { describe, expect, it } from "vitest";
import { MCP_TOOL_NAMES } from "../src/index.js";

describe("MCP tool contract", () => {
  it("exposes exactly three tools", () => {
    expect(MCP_TOOL_NAMES).toHaveLength(3);
  });

  it("tools are verify, status, list_gates", () => {
    expect([...MCP_TOOL_NAMES].sort()).toEqual(["list_gates", "status", "verify"].sort());
  });
});
