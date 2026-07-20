import { join } from "node:path";
import { createAgentRulesAdapter } from "@claimgate/adapter-agent-rules";
import { createDrizzleAdapter } from "@claimgate/adapter-drizzle";
import { createEnvAdapter } from "@claimgate/adapter-env";
import { createCommandAdapter, createTypescriptAdapter } from "@claimgate/adapter-typescript";
import { createVitestAdapter } from "@claimgate/adapter-vitest";
import { loadConfig } from "@claimgate/config";
import {
  createAdapterRegistry,
  evaluatePackPolicy,
  getGitInfo,
  latestPack,
  retainPacks,
  runGates,
  writePack,
} from "@claimgate/core";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/** Exactly three MCP tools — keep this list stable. */
export const MCP_TOOL_NAMES = ["verify", "status", "list_gates"] as const;
export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

export function createDefaultAdapters() {
  return createAdapterRegistry([
    createVitestAdapter(),
    createDrizzleAdapter(),
    createEnvAdapter(),
    createTypescriptAdapter(),
    createCommandAdapter(),
    createAgentRulesAdapter(),
  ]);
}

const VerifyArgs = z.object({
  cwd: z.string().optional(),
  only: z.array(z.string()).optional(),
});

const StatusArgs = z.object({
  cwd: z.string().optional(),
});

const ListGatesArgs = z.object({
  cwd: z.string().optional(),
});

function resolveRoot(cwd?: string): string {
  return cwd ?? process.cwd();
}

export async function toolVerify(args: z.infer<typeof VerifyArgs>) {
  const root = resolveRoot(args.cwd);
  const config = await loadConfig(root);
  const packDir = join(root, config.evidence.packDir);
  const previous = await latestPack(packDir);
  const { pack, exitCode } = await runGates({
    root,
    config,
    adapters: createDefaultAdapters(),
    previousPack: previous,
    only: args.only,
  });
  const git = await getGitInfo(root);
  const policy = evaluatePackPolicy(pack, config, git.head);
  if (!policy.ok) {
    pack.overall = "fail";
  }
  const path = await writePack(packDir, pack);
  await retainPacks(packDir, config.evidence.retain);
  return {
    ok: pack.overall === "pass" && policy.ok,
    exitCode: policy.ok ? exitCode : 1,
    packPath: path,
    pack,
    policyFindings: policy.findings,
  };
}

export async function toolStatus(args: z.infer<typeof StatusArgs>) {
  const root = resolveRoot(args.cwd);
  const config = await loadConfig(root);
  const pack = await latestPack(join(root, config.evidence.packDir));
  return { pack };
}

export async function toolListGates(args: z.infer<typeof ListGatesArgs>) {
  const root = resolveRoot(args.cwd);
  const config = await loadConfig(root);
  return {
    name: config.name,
    gates: config.gates.map((g) => ({
      id: g.id,
      type: g.type,
      description: g.description,
      required: g.required,
    })),
  };
}

export function createClaimgateMcpServer(): Server {
  const server = new Server(
    { name: "claimgate", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "verify",
        description:
          "Re-run Claimgate gates independently of the agent and write an evidence pack bound to git HEAD. Use when the agent claims work is done.",
        inputSchema: {
          type: "object",
          properties: {
            cwd: { type: "string", description: "Repo root (defaults to process cwd)" },
            only: {
              type: "array",
              items: { type: "string" },
              description: "Optional gate ids to run",
            },
          },
        },
      },
      {
        name: "status",
        description: "Return the latest Claimgate evidence pack for the repo, if any.",
        inputSchema: {
          type: "object",
          properties: {
            cwd: { type: "string", description: "Repo root (defaults to process cwd)" },
          },
        },
      },
      {
        name: "list_gates",
        description: "List gates declared in claimgate.yaml.",
        inputSchema: {
          type: "object",
          properties: {
            cwd: { type: "string", description: "Repo root (defaults to process cwd)" },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const raw = request.params.arguments ?? {};

    try {
      if (name === "verify") {
        const args = VerifyArgs.parse(raw);
        const result = await toolVerify(args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          isError: !result.ok,
        };
      }
      if (name === "status") {
        const args = StatusArgs.parse(raw);
        const result = await toolStatus(args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      if (name === "list_gates") {
        const args = ListGatesArgs.parse(raw);
        const result = await toolListGates(args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }
  });

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = createClaimgateMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
