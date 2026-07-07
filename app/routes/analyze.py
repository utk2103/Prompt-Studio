from __future__ import annotations

from fastapi import APIRouter

from app.schemas.prompts import AnalyzeRequest, CompareModelsRequest
from app.services.analyze import analyze_prompt, compare_across_models
from app.services.formats import format_for_model
from app.services.models_registry import get_model_or_default
from app.services.scoring import get_issues

router = APIRouter(tags=["analyze"])


@router.post("/analyze")
def analyze(req: AnalyzeRequest) -> dict:
    return analyze_prompt(req.prompt, req.mode, req.model_id)


@router.post("/validate/format")
def validate_format(req: AnalyzeRequest) -> dict:
    issues = get_issues(req.prompt, req.mode)
    critical = [i for i in issues if i["type"] == "ERROR"]
    warnings = [i for i in issues if i["type"] == "WARN"]
    mdl = get_model_or_default(req.model_id)
    return {
        "valid": len(critical) == 0,
        "critical_count": len(critical),
        "warning_count": len(warnings),
        "issues": issues,
        "format_preview": format_for_model(req.prompt, req.model_id, req.mode),
        "format_type": mdl["format"],
    }


@router.post("/compare/models")
def compare_models(req: CompareModelsRequest) -> dict:
    return compare_across_models(req.prompt, req.mode)
