import { spawn } from "node:child_process";
import { join } from "node:path";

export interface RunCommandOptions {
  cwd: string;
  command: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}

export interface RunCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

export async function runCommand(opts: RunCommandOptions): Promise<RunCommandResult> {
  const start = Date.now();
  const timeoutMs = opts.timeoutMs ?? 120_000;

  return new Promise((resolve) => {
    const child = spawn(opts.command, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      shell: true,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    const finish = (exitCode: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        exitCode,
        stdout,
        stderr,
        durationMs: Date.now() - start,
        timedOut,
      });
    };

    child.on("error", (err) => {
      stderr += err.message;
      finish(1);
    });

    child.on("close", (code) => {
      finish(code ?? 1);
    });
  });
}

export function resolveGateCwd(root: string, gateCwd?: string): string {
  if (!gateCwd) return root;
  return join(root, gateCwd);
}
