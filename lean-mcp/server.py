#!/usr/bin/env python3
"""Lean MCP server: serves the lazy-senior-dev ruleset over stdio.

Exposes a prompt (user-invoked) and a tool (for hosts that pull context via
tools). Does NOT replace Prompt-Studio's provider adapters — those inject the
ruleset in the system slot every turn. This server is the clean option for MCP
hosts whose only injection point is the prompt menu.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from mcp.server.fastmcp import FastMCP  # noqa: E402

from instructions import MODES, build_instructions, resolve_mode  # noqa: E402

mcp = FastMCP("lean")


@mcp.prompt(name="lean", description="Lazy senior dev instructions: YAGNI, stdlib first, smallest correct change.")
def lean_prompt(mode: str | None = None) -> str:
    """Return the Lean ruleset for the given intensity (lite, full, or ultra)."""
    return build_instructions(mode)


@mcp.tool(name="lean_instructions", description="Return the Lean ruleset for the given intensity (lite, full, or ultra).")
def lean_instructions(mode: str | None = None) -> dict:
    resolved = resolve_mode(mode)
    return {"mode": resolved, "instructions": build_instructions(resolved)}


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()

# lean: FastMCP wraps stdio + JSON-RPC; swap to low-level `mcp.server.Server` if we need custom handlers.
