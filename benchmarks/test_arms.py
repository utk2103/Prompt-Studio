import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from benchmarks.arms import ARMS
from benchmarks.benchmark import TASKS, count_loc


def test_all_arms_return_messages_ending_with_user():
    task = "test task"
    for name, fn in ARMS.items():
        msgs = fn(task)
        assert msgs[-1] == {"role": "user", "content": task}, f"{name} last message must be user task"
        if name != "baseline":
            assert msgs[0]["role"] == "system", f"{name} must inject system prompt"


def test_lean_lite_smaller_than_lean_ultra():
    lite = ARMS["lean-lite"]("x")[0]["content"]
    full = ARMS["lean-full"]("x")[0]["content"]
    ultra = ARMS["lean-ultra"]("x")[0]["content"]
    assert len(lite) <= len(full) <= len(ultra) or len(lite) <= len(ultra)
    assert "LEAN MODE ACTIVE" in lite


def test_baseline_has_no_system():
    msgs = ARMS["baseline"]("x")
    assert len(msgs) == 1 and msgs[0]["role"] == "user"


def test_count_loc_strips_comments_and_blanks():
    text = "```python\ndef f():\n    # comment\n    return 1\n\n```"
    assert count_loc(text) == 2


def test_count_loc_falls_back_to_raw_text_without_fences():
    assert count_loc("line1\n\nline2") == 2


def test_tasks_include_provider_adapter_task():
    ids = [t[0] for t in TASKS]
    assert "chatml2xml" in ids
    assert "cost-est" in ids
