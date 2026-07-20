# @claimgate/mcp

MCP server for Claimgate with **exactly three tools**:

| Tool | Purpose |
| --- | --- |
| `verify` | Re-run gates; write evidence pack |
| `status` | Latest evidence pack |
| `list_gates` | Gates from `claimgate.yaml` |

## Run

```bash
pnpm --filter @claimgate/mcp build
pnpm --filter @claimgate/mcp exec claimgate-mcp
```

## Cursor

```json
{
  "mcpServers": {
    "claimgate": {
      "command": "node",
      "args": ["packages/mcp/bin/claimgate-mcp.js"],
      "cwd": "/absolute/path/to/claimgate"
    }
  }
}
```

Build `@claimgate/mcp` first so `dist/` exists.

## Claude Desktop

Add the same stdio command under `mcpServers` in `claude_desktop_config.json`.

## Contract tests

```bash
pnpm --filter @claimgate/mcp test
```

Asserts the tool list length and names stay stable.
