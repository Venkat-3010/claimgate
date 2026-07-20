import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createAgentRulesAdapter } from "@claimgate/adapter-agent-rules";
import { createDrizzleAdapter } from "@claimgate/adapter-drizzle";
import { createEnvAdapter } from "@claimgate/adapter-env";
import { createCommandAdapter, createTypescriptAdapter } from "@claimgate/adapter-typescript";
import { createVitestAdapter } from "@claimgate/adapter-vitest";
import { defaultConfigYaml, findConfigPath, loadConfig } from "@claimgate/config";
import {
  type EvidencePack,
  createAdapterRegistry,
  evaluatePackPolicy,
  getGitInfo,
  latestPack,
  retainPacks,
  runGates,
  writePack,
} from "@claimgate/core";
import { Command } from "commander";
import pc from "picocolors";

export const VERSION = "0.1.0";

function defaultAdapters() {
  return createAdapterRegistry([
    createVitestAdapter(),
    createDrizzleAdapter(),
    createEnvAdapter(),
    createTypescriptAdapter(),
    createCommandAdapter(),
    createAgentRulesAdapter(),
  ]);
}

function printPackSummary(pack: EvidencePack): void {
  const icon =
    pack.overall === "pass"
      ? pc.green("PASS")
      : pack.overall === "fail"
        ? pc.red("FAIL")
        : pc.yellow(pack.overall.toUpperCase());

  console.log("");
  console.log(`${pc.bold("Claimgate")} ${icon}  pack=${pack.id.slice(0, 8)}`);
  if (pack.git.head) {
    console.log(
      `  git ${pack.git.head.slice(0, 7)} (${pack.git.branch ?? "?"})${pack.git.dirty ? pc.yellow(" dirty") : ""}`,
    );
  }
  console.log("");
  for (const g of pack.gates) {
    const st =
      g.status === "pass" ? pc.green("✓") : g.status === "fail" ? pc.red("✗") : pc.yellow("!");
    console.log(`  ${st} ${g.gateId} (${g.type}) — ${g.summary} [${g.durationMs}ms]`);
    for (const f of g.findings.filter((x) => x.severity === "error")) {
      console.log(`      ${pc.red("•")} ${f.message}`);
    }
  }
  console.log("");
}

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name("claimgate")
    .description(
      "Evidence-gated verification for AI coding agents.\nDon't trust the agent. Trust the evidence.",
    )
    .version(VERSION);

  program
    .command("init")
    .description("Create claimgate.yaml and .claimgate/ directory")
    .option("-f, --force", "Overwrite existing claimgate.yaml", false)
    .option("-n, --name <name>", "Project name for the config")
    .action(async (opts: { force?: boolean; name?: string }) => {
      const root = process.cwd();
      const existing = await findConfigPath(root);
      if (existing && !opts.force) {
        console.error(pc.yellow(`Config already exists at ${existing}. Use --force to overwrite.`));
        process.exitCode = 1;
        return;
      }
      const name = opts.name ?? root.split(/[/\\]/).filter(Boolean).pop() ?? "project";
      const yaml = defaultConfigYaml(name);
      const path = join(root, "claimgate.yaml");
      await writeFile(path, yaml, "utf8");
      await mkdir(join(root, ".claimgate", "packs"), { recursive: true });
      await writeFile(join(root, ".claimgate", "packs", ".gitkeep"), "", "utf8");
      console.log(pc.green(`Created ${path}`));
      console.log("Next: edit gates, then run `claimgate verify`");
    });

  program
    .command("verify")
    .description("Re-run configured gates and write an evidence pack")
    .option("-c, --config <path>", "Path to claimgate.yaml")
    .option("--only <ids>", "Comma-separated gate ids to run")
    .option("--json", "Print the evidence pack as JSON", false)
    .option("--no-write", "Do not write pack to disk", false)
    .action(
      async (opts: {
        config?: string;
        only?: string;
        json?: boolean;
        write?: boolean;
      }) => {
        const root = process.cwd();
        const config = await loadConfig(root, opts.config);
        const packDir = join(root, config.evidence.packDir);
        const previous = await latestPack(packDir);
        const only = opts.only
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const { pack, exitCode } = await runGates({
          root,
          config,
          adapters: defaultAdapters(),
          previousPack: previous,
          only,
        });

        const git = await getGitInfo(root);
        const policy = evaluatePackPolicy(pack, config, git.head);
        if (!policy.ok) {
          for (const f of policy.findings) {
            pack.gates.push({
              gateId: "_policy",
              type: "policy",
              status: "fail",
              durationMs: 0,
              summary: f.message,
              findings: [f],
            });
          }
          pack.overall = "fail";
        }

        if (opts.write !== false) {
          const path = await writePack(packDir, pack);
          await retainPacks(packDir, config.evidence.retain);
          if (!opts.json) {
            console.log(pc.dim(`Evidence pack: ${path}`));
          }
        }

        if (opts.json) {
          console.log(JSON.stringify(pack, null, 2));
        } else {
          printPackSummary(pack);
          if (pack.overall === "pass") {
            console.log(
              pc.dim(
                "CI tip: do not trust local packs for merge — re-run gates in GitHub Actions.",
              ),
            );
          }
        }

        process.exitCode = policy.ok ? exitCode : 1;
      },
    );

  program
    .command("status")
    .description("Show the latest evidence pack for this repo")
    .option("-c, --config <path>", "Path to claimgate.yaml")
    .option("--json", "Print JSON", false)
    .action(async (opts: { config?: string; json?: boolean }) => {
      const root = process.cwd();
      const config = await loadConfig(root, opts.config);
      const pack = await latestPack(join(root, config.evidence.packDir));
      if (!pack) {
        console.error("No evidence packs found. Run `claimgate verify` first.");
        process.exitCode = 1;
        return;
      }
      if (opts.json) {
        console.log(JSON.stringify(pack, null, 2));
      } else {
        printPackSummary(pack);
      }
    });

  program
    .command("list-gates")
    .description("List gates from claimgate.yaml")
    .option("-c, --config <path>", "Path to claimgate.yaml")
    .option("--json", "Print JSON", false)
    .action(async (opts: { config?: string; json?: boolean }) => {
      const root = process.cwd();
      const config = await loadConfig(root, opts.config);
      if (opts.json) {
        console.log(JSON.stringify(config.gates, null, 2));
        return;
      }
      console.log(pc.bold(`Gates (${config.gates.length})`));
      for (const g of config.gates) {
        console.log(
          `  - ${g.id} [${g.type}]${g.required === false ? " (optional)" : ""}${g.description ? ` — ${g.description}` : ""}`,
        );
      }
    });

  await program.parseAsync(argv);
}

export { defaultAdapters };
