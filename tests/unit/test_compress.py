from __future__ import annotations

from app.services.compress import caveman_compress


def test_compress_removes_articles_and_fillers() -> None:
    out = caveman_compress("Please just analyze the file for me.")
    assert "please" not in out.lower()
    assert " just " not in out


def test_compress_preserves_code_blocks() -> None:
    src = "Explain the code:\n```python\nprint('hi')\n```"
    out = caveman_compress(src)
    assert "```python" in out
    assert "print('hi')" in out


def test_compress_preserves_urls_and_paths() -> None:
    src = "See https://example.com/foo and the /etc/passwd file."
    out = caveman_compress(src)
    assert "https://example.com/foo" in out
    assert "/etc/passwd" in out
