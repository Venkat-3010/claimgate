import { Command } from "commander";
import { describe, expect, it } from "vitest";

/**
 * Mirrors the verify command's --no-write option wiring.
 * Commander lone --no-* defaults the positive flag to true; passing `false`
 * as the default (the old bug) made packs never persist.
 */
function parseVerifyWrite(argv: string[]): boolean {
  let write: boolean | undefined;
  const program = new Command();
  program.exitOverride();
  program
    .command("verify")
    .option("--no-write", "Do not write pack to disk")
    .action((opts: { write?: boolean }) => {
      write = opts.write;
    });
  program.parse(["node", "claimgate", "verify", ...argv]);
  return write !== false;
}

describe("verify --no-write option", () => {
  it("writes packs by default", () => {
    expect(parseVerifyWrite([])).toBe(true);
  });

  it("opts out with --no-write", () => {
    expect(parseVerifyWrite(["--no-write"])).toBe(false);
  });
});
