#!/usr/bin/env python3
"""Fail if any of the monorepo's version fields drift apart."""
import json, sys, tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def _toml_v(rel):  return tomllib.loads((ROOT / rel).read_text())["project"]["version"]
def _json_v(rel):  return json.loads((ROOT / rel).read_text())["version"]

V = {
    "pyproject.toml":              _toml_v("pyproject.toml"),
    "lean-mcp/pyproject.toml":     _toml_v("lean-mcp/pyproject.toml"),
    "frontend/package.json":       _json_v("frontend/package.json"),
    ".claude-plugin/plugin.json":  _json_v(".claude-plugin/plugin.json"),
    ".codex-plugin/plugin.json":   _json_v(".codex-plugin/plugin.json"),
    ".devin-plugin/plugin.json":   _json_v(".devin-plugin/plugin.json"),
    ".qoder-plugin/plugin.json":   _json_v(".qoder-plugin/plugin.json"),
}

for f, v in V.items():
    print(f"{f:32s} {v}")
if len(set(V.values())) != 1:
    print("\nERROR: versions out of sync", file=sys.stderr)
    sys.exit(1)
print("\nOK: all versions aligned")
