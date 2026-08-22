import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
HOOKS = ROOT / "hooks"


def _flag(tmp_path: Path) -> Path:
    # Mirror hooks/_lean_common._project_scope: sha1[:8] of CLAUDE_PROJECT_DIR.
    scope = "-" + hashlib.sha1(str(tmp_path).encode("utf-8")).hexdigest()[:8]
    return tmp_path / f".lean-active{scope}"


def _run(script: str, tmp_path, stdin: str = "") -> subprocess.CompletedProcess:
    env = {
        **os.environ,
        "CLAUDE_PLUGIN_ROOT": str(ROOT),
        "CLAUDE_STATE_DIR": str(tmp_path),
        "CLAUDE_PROJECT_DIR": str(tmp_path),
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
    # Fresh state: ruleset must still be emitted, but the hook must NOT write
    # the default back to disk — writing a drifted-key default would orphan a
    # real preference persisted under a different key from a prior launch.
    res = _run("lean_activate.py", tmp_path)
    assert res.returncode == 0
    assert "LEAN MODE ACTIVE" in res.stdout
    assert not _flag(tmp_path).exists()
    assert not (tmp_path / ".lean-active").exists()


def test_activate_preserves_persisted_mode(tmp_path):
    _flag(tmp_path).write_text("ultra")
    res = _run("lean_activate.py", tmp_path)
    assert res.returncode == 0
    assert "LEAN MODE ACTIVE" in res.stdout
    # Ultra content survives byte-for-byte (no default overwrite).
    assert _flag(tmp_path).read_text().strip() == "ultra"


def test_activate_falls_through_to_global_flag(tmp_path):
    # Simulate the "project-key drift" case: the project-scoped flag is
    # missing but the un-scoped global flag holds the user's real preference.
    (tmp_path / ".lean-active").write_text("ultra")
    res = _run("lean_activate.py", tmp_path)
    assert res.returncode == 0
    assert "LEAN MODE ACTIVE" in res.stdout
    # Global flag stays put; project-scoped write only happens when
    # something was already persisted at *either* location.
    assert (tmp_path / ".lean-active").read_text().strip() == "ultra"


def test_mode_tracker_switches_intensity(tmp_path):
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "/lean ultra"}))
    assert res.returncode == 0
    payload = json.loads(res.stdout)
    assert payload["hookSpecificOutput"]["systemMessage"] == "LEAN MODE → ultra"
    assert "LEAN MODE ACTIVE" in payload["hookSpecificOutput"]["additionalContext"]
    assert _flag(tmp_path).read_text().strip() == "ultra"


def test_mode_tracker_ignores_non_lean_prompts(tmp_path):
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "hello world"}))
    assert res.returncode == 0
    assert res.stdout == ""


def test_mode_tracker_rejects_unknown_mode(tmp_path):
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "/lean bogus"}))
    payload = json.loads(res.stdout)
    assert "unknown mode" in payload["hookSpecificOutput"]["systemMessage"]
    assert not _flag(tmp_path).exists()


def test_mode_tracker_accepts_namespaced_form(tmp_path):
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "/prompt-studio:lean full"}))
    payload = json.loads(res.stdout)
    assert payload["hookSpecificOutput"]["systemMessage"] == "LEAN MODE → full"
    assert _flag(tmp_path).read_text().strip() == "full"


def test_mode_tracker_off_persists_state(tmp_path):
    # #488: "off" persists across sessions instead of deleting the flag file.
    _flag(tmp_path).write_text("full")
    res = _run("lean_mode_tracker.py", tmp_path, stdin=json.dumps({"prompt": "stop lean"}))
    payload = json.loads(res.stdout)
    assert payload["hookSpecificOutput"]["systemMessage"] == "LEAN MODE OFF"
    assert _flag(tmp_path).read_text().strip() == "off"


def test_mode_tracker_lean_stats_reports_usage(tmp_path):
    # Fabricate a transcript at the payload's transcript_path so the stats
    # aggregator has something to sum without touching the user's real logs.
    transcript = tmp_path / "sess.jsonl"
    transcript.write_text(
        json.dumps({"message": {"usage": {
            "input_tokens": 10, "output_tokens": 20,
            "cache_read_input_tokens": 5, "cache_creation_input_tokens": 7}}}) + "\n"
        + json.dumps({"message": {"usage": {
            "input_tokens": 3, "output_tokens": 40,
            "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0}}}) + "\n"
    )
    res = _run(
        "lean_mode_tracker.py",
        tmp_path,
        stdin=json.dumps({"prompt": "/lean-stats", "transcript_path": str(transcript)}),
    )
    assert res.returncode == 0
    payload = json.loads(res.stdout)
    msg = payload["hookSpecificOutput"]["systemMessage"]
    assert "LEAN STATS" in msg
    assert "Turns:              2" in msg
    assert "Output tokens:      60" in msg


def test_subagent_injects_ruleset(tmp_path):
    _flag(tmp_path).write_text("lite")
    res = _run("lean_subagent.py", tmp_path)
    payload = json.loads(res.stdout)
    assert payload["hookSpecificOutput"]["hookEventName"] == "SubagentStart"
    assert "LEAN MODE ACTIVE" in payload["hookSpecificOutput"]["additionalContext"]


def test_manifest_paths_resolve():
    manifest = json.loads((HOOKS / "claude-codex-hooks.json").read_text())
    # Commands use $CLAUDE_PLUGIN_ROOT/hooks/<script>.py (with or without braces,
    # in sh -c wrappers or PowerShell). Extract every referenced script path.
    ref = re.compile(r"\$(?:\{)?CLAUDE_PLUGIN_ROOT(?:\})?[/\\]hooks[/\\]([A-Za-z0-9_.-]+\.py)")
    for events in manifest["hooks"].values():
        for group in events:
            for h in group["hooks"]:
                for cmd in (h.get("command", ""), h.get("commandWindows", "")):
                    for script in ref.findall(cmd):
                        assert (HOOKS / script).exists(), f"missing hook script: {script}"
