# Supermemory Setup Flow — Screens

Companion to [`../SUPERMEMORY_SETUP.md`](../SUPERMEMORY_SETUP.md). Captures
the browser-side onboarding UI at `app.supermemory.ai` so a new contributor
can rebuild the flow from scratch without reading tribal knowledge.

## Where to place the screenshots

Drop the PNGs into `docs/assets/supermemory/` with these filenames:

| Filename | What it shows |
|----------|---------------|
| `setup-01-mcp-tab.png` | MCP tab — universal `https://mcp.supermemory.ai/mcp` URL, "Paste it into any MCP client" instructions, per-client setup guides link. |
| `setup-02-claude-code-tab.png` | Claude Code tab — two `/plugin` slash commands to install the plugin from a live Claude Code session. |

If a temp `NSIRD_screencaptureui_*` path expires before you save, retake with
`⌘⇧5` and choose "Save to → Downloads" (Desktop is fine too — the temp buffer
is not).

## Screen 1 — MCP tab

![MCP tab](assets/supermemory/setup-01-mcp-tab.png)

**Header**: "Use your brain where you work — Pick the tool you open every day
about 60 seconds."

**Tabs**: `MCP` (selected) · `Codex` · `Claude Code`

**Content** (three numbered steps):

1. **Copy your universal MCP URL** — the box shows `UNIVERSAL MCP URL`
   `https://mcp.supermemory.ai/mcp` with a "Copy URL" button on the right.
2. **Paste it into any MCP client** — link: "Per-client setup guides".
3. **Ask your brain to test it** — prompt sandbox reading
   `What do we know about [topic]?`.

Footer: "More tools (full catalog)" on the left; "Skip for now" / "Continue →"
on the right.

**Use this screen** when the target host speaks raw MCP (Cursor, Windsurf,
Zed, Cline, JetBrains AI Assistant, etc.). Copy the URL into the host's MCP
config — no OAuth in this path; you paste an API key the host asks for
separately.

## Screen 2 — Claude Code tab

![Claude Code tab](assets/supermemory/setup-02-claude-code-tab.png)

**Header**: same as Screen 1.

**Tabs**: `MCP` · `Codex` · `Claude Code` (selected)

**Subheader**: "Context in your terminal."

**Content** (two numbered steps):

1. **Install the plugin** — "Run these commands inside a Claude Code session":
   ```
   /plugin marketplace add supermemoryai/claude-supermemory
   /plugin install supermemory
   ```
2. **Ask your brain to test it** — prompt sandbox reading
   `What do we know about [topic]?`.

Footer identical to Screen 1.

**Use this screen** when installing inside Claude Code. Exactly the two
slash commands captured in `SUPERMEMORY_SETUP.md`; run `/reload-plugins`
afterwards to activate without restarting the session.

## Rebuilding the flow

1. Log in at `https://app.supermemory.ai` (Google / GitHub OAuth).
2. First-run onboarding lands on the "Use your brain where you work" carousel.
   Three tabs — MCP, Codex, Claude Code. Pick the tab matching the host you
   are wiring first; the other two can be revisited from the same onboarding
   page.
3. For Claude Code: run the two `/plugin` commands, then `/reload-plugins`.
   Credentials written to `~/.supermemory-claude/credentials.json`.
4. For Codex: `npx -y codex-supermemory@latest install`. Credentials written
   to `~/.codex/supermemory/credentials.json`.
5. For any other MCP host: copy `https://mcp.supermemory.ai/mcp` into the
   host's MCP server config, provide the API key when prompted.

One-shot alternative that runs all three at once and does the OAuth in a
single browser tab:

```bash
npx supermemory plugin --all
```

## Screenshot maintenance

- Retake if the onboarding UI adds a fourth tab or renames the "brain" copy.
- Keep both PNGs under 250 KB — resize with `sips -Z 1400 <file>` on macOS.
- Do not commit anything from `/private/var/folders/**/TemporaryItems/**` —
  those paths are volatile and the file will disappear before the commit
  hook can hash it. Save to `~/Downloads/` first, then move.
