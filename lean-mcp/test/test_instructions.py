import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from instructions import MODES, build_instructions, resolve_mode  # noqa: E402


def test_resolve_mode_keeps_valid_intensities():
    for mode in MODES:
        assert resolve_mode(mode) == mode


def test_resolve_mode_falls_back_for_off_unknown_empty():
    for bad in ("off", "review", "nonsense", "", None):
        assert resolve_mode(bad) in MODES


def test_build_instructions_tagged_with_resolved_mode():
    text = build_instructions("ultra")
    assert "LEAN MODE ACTIVE" in text
    assert "ultra" in text


def test_build_instructions_defaults_to_full_when_missing():
    text = build_instructions(None)
    assert "LEAN MODE ACTIVE" in text
    assert "full" in text
