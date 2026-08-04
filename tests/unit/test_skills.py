from app.services.formats import build_messages
from app.services.skills import (
    MODES,
    filter_skill_body_for_mode,
    get_lean_instructions,
    normalize_mode,
)


def test_normalize_mode_defaults_full():
    assert normalize_mode(None) == "full"
    assert normalize_mode("bogus") == "full"
    assert normalize_mode("ULTRA") == "ultra"


def test_filter_keeps_matching_table_row_drops_others():
    body = (
        "| **lite** | keep lite |\n"
        "| **full** | keep full |\n"
        "| **ultra** | keep ultra |\n"
        "regular rule line\n"
    )
    out = filter_skill_body_for_mode(body, "lite")
    assert "keep lite" in out
    assert "keep full" not in out
    assert "keep ultra" not in out
    assert "regular rule line" in out


def test_filter_keeps_non_mode_bullets():
    body = '- No unrequested abstractions: something\n- lite: "example"\n'
    out = filter_skill_body_for_mode(body, "full")
    assert "No unrequested abstractions" in out
    assert 'lite: "example"' not in out


def test_get_instructions_smaller_for_lite_than_full():
    lite = get_lean_instructions("lite")
    full = get_lean_instructions("full")
    ultra = get_lean_instructions("ultra")
    assert lite and full and ultra
    # lite ships strictly fewer or equal tokens than full (mode filter dropped rows)
    assert len(lite) <= len(full)
    assert all("LEAN MODE ACTIVE" in x for x in (lite, full, ultra))


def test_build_messages_puts_persona_in_system_slot():
    msgs = build_messages("hello world", "claude-3-5", intensity="full")
    assert msgs[0]["role"] == "system"
    assert "LEAN" in msgs[0]["content"]
    assert msgs[0]["cache_control"] == {"type": "ephemeral"}
    assert msgs[1] == {"role": "user", "content": "hello world"}


def test_build_messages_persona_opt_out():
    msgs = build_messages("x", "claude-3-5", persona=False)
    assert len(msgs) == 1 and msgs[0]["role"] == "user"


def test_modes_constant():
    assert set(MODES) == {"lite", "full", "ultra"}
