import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type EvidencePack, EvidencePackSchema } from "./pack.js";

export async function ensurePackDir(packDir: string): Promise<void> {
  await mkdir(packDir, { recursive: true });
}

export async function writePack(packDir: string, pack: EvidencePack): Promise<string> {
  await ensurePackDir(packDir);
  const stamp = pack.createdAt.replace(/[:.]/g, "-");
  const filename = `${stamp}_${pack.id.slice(0, 8)}.json`;
  const path = join(packDir, filename);
  await writeFile(path, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return path;
}

export async function readPack(path: string): Promise<EvidencePack> {
  const text = await readFile(path, "utf8");
  return EvidencePackSchema.parse(JSON.parse(text));
}

export async function latestPack(packDir: string): Promise<EvidencePack | null> {
  try {
    const files = (await readdir(packDir))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    const first = files[0];
    if (!first) return null;
    return readPack(join(packDir, first));
  } catch {
    return null;
  }
}

export async function retainPacks(packDir: string, retain: number): Promise<void> {
  try {
    const files = (await readdir(packDir))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    const toDelete = files.slice(retain);
    await Promise.all(toDelete.map((f) => unlink(join(packDir, f))));
  } catch {
    // pack dir may not exist yet
  }
}
