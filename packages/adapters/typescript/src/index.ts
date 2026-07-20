import type { GateAdapter, GateContext, GateResult } from "@claimgate/core";
import { errorResult, failResult, passResult, resolveGateCwd, runCommand } from "@claimgate/core";
import { z } from "zod";

const OptionsSchema = z.object({
  command: z.string().default("pnpm exec tsc --noEmit"),
});

export function createTypescriptAdapter(): GateAdapter {
  return {
    type: "typescript",
    async run(ctx: GateContext): Promise<GateResult> {
      const start = Date.now();
      const parsed = OptionsSchema.safeParse(ctx.gate.options ?? {});
      if (!parsed.success) {
        return errorResult(ctx.gate, "Invalid typescript options", 0, parsed.error.message);
      }
      const cwd = resolveGateCwd(ctx.root, ctx.gate.cwd);
      const cmd = await runCommand({ cwd, command: parsed.data.command });
      const durationMs = Date.now() - start;

      if (cmd.exitCode !== 0 || cmd.timedOut) {
        return failResult(
          ctx.gate,
          `Typecheck failed (exit ${cmd.exitCode})`,
          [
            {
              code: "typecheck_failed",
              severity: "error",
              message: cmd.timedOut
                ? "Typecheck timed out"
                : `tsc exited with code ${cmd.exitCode}`,
              meta: {
                stderrTail: cmd.stderr.slice(-2000),
                stdoutTail: cmd.stdout.slice(-2000),
              },
            },
          ],
          durationMs,
          cmd.exitCode,
        );
      }

      return {
        ...passResult(ctx.gate, "Typecheck passed", durationMs, { exitCode: cmd.exitCode }),
        exitCode: cmd.exitCode,
      };
    },
  };
}

/** Generic shell command gate */
export function createCommandAdapter(): GateAdapter {
  return {
    type: "command",
    async run(ctx: GateContext): Promise<GateResult> {
      const start = Date.now();
      const Options = z.object({ command: z.string().min(1) });
      const parsed = Options.safeParse(ctx.gate.options ?? {});
      if (!parsed.success) {
        return errorResult(
          ctx.gate,
          "command gate requires options.command",
          0,
          parsed.error.message,
        );
      }
      const cwd = resolveGateCwd(ctx.root, ctx.gate.cwd);
      const cmd = await runCommand({ cwd, command: parsed.data.command });
      const durationMs = Date.now() - start;
      if (cmd.exitCode !== 0 || cmd.timedOut) {
        return failResult(
          ctx.gate,
          `Command failed (exit ${cmd.exitCode})`,
          [
            {
              code: "command_failed",
              severity: "error",
              message: cmd.timedOut
                ? "Command timed out"
                : `Command exited with code ${cmd.exitCode}`,
              meta: {
                command: parsed.data.command,
                stderrTail: cmd.stderr.slice(-2000),
              },
            },
          ],
          durationMs,
          cmd.exitCode,
        );
      }
      return {
        ...passResult(ctx.gate, "Command passed", durationMs, {
          command: parsed.data.command,
          exitCode: cmd.exitCode,
        }),
        exitCode: cmd.exitCode,
      };
    },
  };
}
