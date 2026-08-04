import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
HOOKS = ROOT / "hooks"


def _run(script: str, tmp_path, stdin: str = "") -> subprocess.CompletedProcess:
    env = {
        **os.environ,
        "CLAUDE_PLUGIN_ROOT": str(ROOT),
        "CLAUDE_STATE_DIR": str(tmp_path),
    }
    return subprocess.run(
        [sys.executable, str(HOOKS / script)],
        input=stdin,
        env=env,
        capture_output=True,
        text=True,
        timeout=5,
    )


def test_activate_emits_lean_ruleset(tmp_path):
    res = _run("lean_activate.py", tmp_path)
    assert res.returncode == 0
    assert "LEAN MODE ACTIVE" in res.stdout
    assert (tmp_path / ".lean-active").exists()


def test_mode_tracker_switches_intensity(tmp_path):
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "/lean ultra"}))
    assert res.returncode == 0
    payload = json.loads(res.stdout)
    assert payload["hookSpecificOutput"]["systemMessage"] == "LEAN MODE → ultra"
    assert "LEAN MODE ACTIVE" in payload["hookSpecificOutput"]["additionalContext"]
    assert (tmp_path / ".lean-active").read_text().strip() == "ultra"


def test_mode_tracker_ignores_non_lean_prompts(tmp_path):
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "hello world"}))
    assert res.returncode == 0
    assert res.stdout == ""


def test_mode_tracker_rejects_unknown_mode(tmp_path):
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "/lean bogus"}))
    payload = json.loads(res.stdout)
    assert "unknown mode" in payload["hookSpecificOutput"]["systemMessage"]
    assert not (tmp_path / ".lean-active").exists()


def test_mode_tracker_off_clears_state(tmp_path):
    (tmp_path / ".lean-active").write_text("full")
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "stop lean"}))
    payload = json.loads(res.stdout)
    assert payload["hookSpecificOutput"]["systemMessage"] == "LEAN MODE OFF"
    assert not (tmp_path / ".lean-active").exists()


def test_subagent_injects_ruleset(tmp_path):
    (tmp_path / ".lean-active").write_text("lite")
    res = _run("lean_subagent.py", tmp_path)
    payload = json.loads(res.stdout)
    assert payload["hookSpecificOutput"]["hookEventName"] == "SubagentStart"
    assert "LEAN MODE ACTIVE" in payload["hookSpecificOutput"]["additionalContext"]


def test_manifest_paths_resolve():
    manifest = json.loads((HOOKS / "claude-codex-hooks.json").read_text())
    for events in manifest["hooks"].values():
        for group in events:
            for h in group["hooks"]:
                # Extract the script path from the shell command (strip python3 + quotes).
                cmd = h["command"]
                assert "${CLAUDE_PLUGIN_ROOT}/hooks/" in cmd
                script = cmd.split("hooks/")[1].rstrip('" ')
                assert (HOOKS / script).exists(), f"missing hook script: {script}"
