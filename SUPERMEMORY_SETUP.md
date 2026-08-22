# Supermemory Plugin — Install Transcript

Reference capture of the Supermemory plugin installation performed on
2026-08-21 against Prompt-Studio. Kept for the "next feature" work that
builds on top of Supermemory (planned).

Browser onboarding screens (`app.supermemory.ai`) are documented in
[`docs/supermemory-setup-flow.md`](docs/supermemory-setup-flow.md).

## In-session steps (Claude Code)

```
/plugin marketplace add supermemoryai/claude-supermemory
✓ Successfully added marketplace: supermemory-plugins

/plugin install supermemory
✓ Installed Supermemory. Run /reload-plugins to apply.

/reload-plugins
✓ Reloaded: 6 plugins · 1 skill · 10 agents · 18 hooks · 1 plugin MCP server · 0 plugin LSP servers
```

## `npx supermemory plugin` transcript

```
npx supermemory plugin
Need to install the following packages:
supermemory@4.25.4
Ok to proceed? (y) y


  █████ █   █ ████  █████ ████  █   █ █████ █   █  ███  ████  █   █
  █░░░░░█░  █░█░░░█ █░░░░░█░░░█ ██ ██░█░░░░░██ ██░█ ░░█ █░░░█  █ █ ░
  █████ █░  █░████ ░████  ████ ░█░█ █░████  █░█ █░█░  █░████ ░  █ ░
   ░░░█░█░  █░█░░░░ █░░░░ █░█░░ █░ ░█░█░░░░ █░ ░█░█░  █░█░█░░   █░
  █████░ ███ ░█░    █████ █░ █  █░  █░█████ █░  █░ ███ ░█░ █    █░
   ░░░░░  ░░░  ░     ░░░░░ ░  ░  ░   ░ ░░░░░ ░   ░  ░░░  ░  ░    ░
                                                         > PLUGINS

┌ Supermemory plugin
│ Detected integrations
│   [ready] Claude Code command claude
│   [missing] Cursor not detected
│   [missing] OpenCode not detected
│   [ready] Codex local config
└ scripts can use supermemory plugin --all

◇  Which integrations should Supermemory install?
│  Install all ready integrations
│
│
◇  Claude Code installed
│
◇  Codex installed

Supermemory plugin install summary

[ok] Claude Code: Claude Code install complete.
  claude plugin marketplace update supermemory-plugins (or add it when not registered)
  claude plugin install supermemory@supermemory-plugins --scope user

[ok] Codex: Codex install complete.
  npx -y codex-supermemory@latest install

  OAuth: install is ready; continuing to browser approval for Claude Code, Codex.

  Claude reload: run /reload-plugins inside any already-open Claude Code session.


┌ Supermemory OAuth
│ One approval connects Claude Code, Codex.
└ The same API key will be saved for each plugin your plan can use.

Authorize from this browser URL: https://app.supermemory.ai/auth/connect?callback=http%3A%2F%2F127.0.0.1%3A65225%2Fcallback%3Fstate%3D32d089cf8a2fa4ed9733c0bf801a04ff&client=claude_code&clients=claude_code%2Ccodex&hostname=Utkarshs-MacBook-Air.local&os=darwin-arm64&cwd=%2FUsers%2Futkarshupadhyay%2FDesktop%2Fexplore%2FPrompt-Studio&cli_version=0.1.0

│
◇  OAuth complete

Supermemory plugin auth summary

[ok] Claude Code: credentials saved to /Users/utkarshupadhyay/.supermemory-claude/credentials.json
[ok] Codex: credentials saved to /Users/utkarshupadhyay/.codex/supermemory/credentials.json
```

## Artefacts

- **Marketplace registered**: `supermemory-plugins` (source: `supermemoryai/claude-supermemory`)
- **Claude Code credentials**: `/Users/utkarshupadhyay/.supermemory-claude/credentials.json`
- **Codex credentials**: `/Users/utkarshupadhyay/.codex/supermemory/credentials.json`
- **npx package**: `supermemory@4.25.4`

## Reinstall / rehydrate on a fresh machine

```bash
# Claude Code
claude plugin marketplace add supermemoryai/claude-supermemory
claude plugin install supermemory@supermemory-plugins --scope user
# In an active session:
/reload-plugins

# Codex
npx -y codex-supermemory@latest install

# One command that covers every detected host (Claude Code, Codex, Cursor, OpenCode)
npx supermemory plugin --all
```

OAuth is a single browser approval — the same API key is written to each
host's credential store above.

## Available agent + skill surface after install

Confirmed loaded post-`/reload-plugins`:

- Agent: `supermemory:context-gatherer` — fans out searches across the
  project's Supermemory containers and returns a synthesized brief with
  provenance. Tools: `mcp__supermemory__search_memory`, `listSpaces`,
  `listMemories`, `whoAmI` (plus `mcp__plugin_supermemory_*` and
  `mcp__claude_ai_supermemory__*` mirrors).
- Skill: `supermemory:status` — prints Supermemory authentication and
  connection status.

## Next-feature notes

The existing Prompt-Studio branch `supermem-int` already wires Supermemory
as a backend in `app/services/memory.py` (commit `1ff08fb`). This plugin
install adds the *host-side* integration on top of the backend wiring, so
Claude Code / Codex sessions can call Supermemory tools directly without
going through the FastAPI adapter. Follow-up work:

1. Decide which Supermemory container the plugin should default to for
   Prompt-Studio sessions (project vs personal vs shared).
2. Confirm the OAuth token in `~/.supermemory-claude/credentials.json` is
   the same token the FastAPI backend reads via env — if so, unify on one.
3. Wire a `/lean-stats`-style skill for Supermemory (`/prompt-studio:memory-stats`?)
   that reports hit/miss counts against the backend.
