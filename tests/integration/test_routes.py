from __future__ import annotations


def test_health(client) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_root(client) -> None:
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "online"


def test_models_list_under_v1(client) -> None:
    r = client.get("/api/v1/models")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert any(m["id"] == "claude-3-5" for m in r.json())


def test_score_empty_raises_400(client) -> None:
    r = client.post("/api/v1/score", json={"prompt": "   ", "mode": "TECHNICAL"})
    assert r.status_code == 400


def test_analyze_flow(client) -> None:
    body = {"prompt": "Analyze the JSON payload and output a markdown table.", "mode": "TECHNICAL"}
    r = client.post("/api/v1/analyze", json=body)
    assert r.status_code == 200
    j = r.json()
    assert "scores" in j and "tokens" in j
