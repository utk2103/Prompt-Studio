# lean-mcp

MCP server that serves Prompt-Studio's **Lean** ruleset (lazy-senior-dev
instructions: YAGNI, stdlib first, smallest correct change). Exposes the same
persona the provider adapters in `app/services/formats.py` inject into the
system slot, so every host emits identical rules.

Not a replacement for the always-on adapters. Those inject the ruleset every
turn via `build_messages()`. MCP prompts are user-invoked and there is no
portable MCP primitive for "inject on every turn" across hosts, so this server
is the clean option for MCP hosts whose only injection point is the prompt menu
or that pull context via tools.

## What it exposes

- **Prompt `lean`** — returns the ruleset as a user message. Optional `mode`
  argument: `lite`, `full`, or `ultra`. Omit for `full`.
- **Tool `lean_instructions`** — same text plus structured output
  (`{mode, instructions}`) for hosts that pull context via tools. Read-only.

Mode resolution reuses `app/services/skills.py`, so the served rules stay in
lockstep with the persona injected by the FastAPI provider adapters.

## Run it

```bash
cd lean-mcp
pip install -e .
python server.py            # speaks MCP over stdio
```

Point an MCP host at that command. Example client entry:

```json
{
  "mcpServers": {
    "lean": {
      "command": "python",
      "args": ["lean-mcp/server.py"]
    }
  }
}
```

## Test

```bash
pytest
```

Covers mode resolution and the instruction text. The MCP wiring in `server.py`
is thin: it maps the prompt and tool onto `build_instructions`.

## License

Apache-2.0 — see repo root. Author: [utk2103](https://github.com/utk2103).
Repo: <https://github.com/utk2103/Prompt-Studio>.
