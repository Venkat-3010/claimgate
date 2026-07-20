import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitInfo {
  head: string | null;
  branch: string | null;
  dirty: boolean;
}

async function git(root: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: root, windowsHide: true });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getGitInfo(root: string): Promise<GitInfo> {
  const head = await git(root, ["rev-parse", "HEAD"]);
  const branch = await git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const status = await git(root, ["status", "--porcelain"]);
  return {
    head,
    branch,
    dirty: status !== null && status.length > 0,
  };
}
