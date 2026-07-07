from __future__ import annotations

from fastapi import APIRouter

from app.exceptions import EmptyPromptError
from app.schemas.prompts import ScoreRequest
from app.services.scoring import RECOMMENDATIONS, mode_alignment_recommendation, score_prompt

router = APIRouter(tags=["score"])


@router.post("/score")
def score(req: ScoreRequest) -> dict:
    s = score_prompt(req.prompt, req.mode)
    if not s:
        raise EmptyPromptError()

    dims_list = [
        ("clarity", s["clarity"]),
        ("specificity", s["specificity"]),
        ("context", s["context"]),
        ("format", s["format"]),
        ("mode_alignment", s["mode_alignment"]),
        ("token_efficiency", s["token_efficiency"]),
        ("constraints", s["constraints"]),
    ]
    if "fref_score" in s:
        dims_list.append(("fref_score", s["fref_score"]))

    dim_order = sorted(dims_list, key=lambda x: x[1])

    recs: list[str] = []
    for name, _ in dim_order[:3]:
        if name == "mode_alignment":
            recs.append(mode_alignment_recommendation(req.mode))
        elif name in RECOMMENDATIONS:
            recs.append(RECOMMENDATIONS[name])

    return {**s, "recommendations": recs, "mode": req.mode}
