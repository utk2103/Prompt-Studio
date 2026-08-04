#!/usr/bin/env python3
"""Fail if the monorepo's four version fields drift apart."""
import json, sys, tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = {
    "pyproject.toml":              tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]["version"],
    "lean-mcp/pyproject.toml":     tomllib.loads((ROOT / "lean-mcp/pyproject.toml").read_text())["project"]["version"],
    ".claude-plugin/plugin.json":  json.loads((ROOT / ".claude-plugin/plugin.json").read_text())["version"],
    "frontend/package.json":       json.loads((ROOT / "frontend/package.json").read_text())["version"],
}

for f, v in V.items():
    print(f"{f:32s} {v}")
if len(set(V.values())) != 1:
    print("\nERROR: versions out of sync", file=sys.stderr)
    sys.exit(1)
print("\nOK: all versions aligned")
