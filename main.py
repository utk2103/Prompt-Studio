"""
PromptForge FastAPI Backend — MVP Architecture
Prompt engineering assistant: validation, scoring, token analysis,
context-window evaluation, multi-model compatibility, adaptive wizard.
"""
from __future__ import annotations

import re
import uuid
import time
from typing import Optional, Literal
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from pathlib import Path
from collections import deque

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PromptForge API",
    description="Prompt engineering assistant: scoring, validation, token analysis, model compatibility",
    version="0.9.4-mvp",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Constants ────────────────────────────────────────────────────────────────

MODELS: dict[str, dict] = {
    "gpt-4o":       {"name": "GPT-4o",           "provider": "OpenAI",     "context": 128_000, "cost_in": 5.00, "cost_out": 15.00, "format": "ChatML"},
    "claude-3-5":   {"name": "Claude 3.5 Sonnet", "provider": "Anthropic",  "context": 200_000, "cost_in": 3.00, "cost_out": 15.00, "format": "XML Tags"},
    "gemini-15":    {"name": "Gemini 1.5 Pro",    "provider": "Google",     "context": 1_000_000,"cost_in": 1.25, "cost_out": 5.00,  "format": "Gemini Native"},
    "gpt-35":       {"name": "GPT-3.5 Turbo",     "provider": "OpenAI",     "context": 16_385,  "cost_in": 0.50, "cost_out": 1.50,  "format": "ChatML"},
    "llama3":       {"name": "Llama 3.1 70B",     "provider": "Meta",       "context": 128_000, "cost_in": 0.90, "cost_out": 0.90,  "format": "Llama Template"},
    "mistral":      {"name": "Mistral Large",      "provider": "Mistral AI", "context": 32_000,  "cost_in": 4.00, "cost_out": 12.00, "format": "Mistral Native"},
    "deepseek":     {"name": "DeepSeek-V3",        "provider": "DeepSeek",   "context": 64_000,  "cost_in": 0.27, "cost_out": 1.10,  "format": "ChatML"},
}

WIZARD_QUESTIONS = [
    {"id": "goal",         "q": "What is the PRIMARY objective of this prompt?",    "opts": ["Generate creative content","Analyze & evaluate data","Answer technical questions","Write/debug code","Summarize information","Transform/convert content","Extract structured data","Build a system persona"]},
    {"id": "audience",     "q": "Who is the TARGET AUDIENCE for the output?",        "opts": ["General public","Software developers","Business executives","Researchers/academics","Students/beginners","Domain experts","Internal team use"]},
    {"id": "output_format","q": "What OUTPUT FORMAT is required?",                   "opts": ["Free-form prose","Bullet points / list","JSON / structured data","Markdown with headers","Code block","Step-by-step numbered","Table format","Hybrid (prose + structured)"]},
    {"id": "tone",         "q": "What TONE should the response have?",               "opts": ["Professional / formal","Casual / conversational","Academic / scholarly","Creative / expressive","Concise / minimal","Instructional / didactic"]},
    {"id": "constraints",  "q": "Are there KEY CONSTRAINTS to enforce?",             "opts": ["Word/character limit","Avoid specific topics","Must cite sources","Stay in domain only","Language restrictions","Safety/content filters","No constraints needed"]},
    {"id": "context_depth","q": "How much CONTEXT should the prompt carry?",         "opts": ["Minimal – just the task","Some background context","Full domain background","Few-shot examples only","Chain-of-thought reasoning","Background + examples"]},
    {"id": "examples",     "q": "Should the prompt include EXAMPLES?",              "opts": ["Yes – 1-2 examples","Yes – 3+ examples (few-shot)","Negative examples only","Input/output pair examples","No examples needed"]},
]

# ─── Token Estimation ─────────────────────────────────────────────────────────

def estimate_tokens(text: str) -> int:
    """Approximate token count via char/4 heuristic (GPT-4 ballpark)."""
    return max(1, len(text) // 4)

# ─── Scoring Engine ───────────────────────────────────────────────────────────

def score_prompt(text: str, mode: str) -> dict:
    """Multi-dimensional prompt scoring (0-100 per dimension)."""
    words = text.strip().split()
    wc = len(words)
    if wc == 0:
        return {}

    # Clarity: coherent sentences, optimal length
    avg_word_len = len(text) / max(wc, 1)
    clarity = min(100, max(15, 100 - abs(wc - 60) * 0.7 - (50 if wc < 5 else 0)))

    # Specificity: action verbs
    actions = len(re.findall(r'\b(create|write|generate|analyze|explain|summarize|list|compare|describe|identify|implement|design|build|evaluate|review|translate|convert|extract|provide|suggest|determine|calculate|predict)\b', text, re.I))
    specificity = min(100, 20 + actions * 18 + (15 if wc > 15 else 0) + (10 if wc > 40 else 0))

    # Context richness: role, examples, background
    ctx_hits = len(re.findall(r'\b(context|background|you are|acting as|role|assume|given|based on|purpose|goal|objective|your task)\b', text, re.I))
    has_examples = bool(re.search(r'\b(example|e\.g\.|for instance|such as|input:|output:|sample)\b', text, re.I))
    context_score = min(100, 15 + ctx_hits * 22 + (28 if has_examples else 0) + (15 if wc > 50 else 0))

    # Format specification
    fmt_hits = len(re.findall(r'\b(format|json|markdown|list|bullet|numbered|table|paragraph|output|response|structure)\b', text, re.I))
    code_block = 20 if '```' in text or '###' in text else 0
    format_score = min(100, 15 + fmt_hits * 28 + code_block)

    # Mode alignment
    mode = mode.upper()
    if mode == "CREATIVE":
        m_hits = len(re.findall(r'\b(story|creative|imagine|narrative|character|scene|poem|fiction|voice|style|tone|vivid)\b', text, re.I))
    elif mode == "TECHNICAL":
        m_hits = len(re.findall(r'\b(code|function|algorithm|implement|debug|optimize|api|database|system|architecture|performance)\b', text, re.I))
    else:  # SYSTEM
        m_hits = len(re.findall(r'\b(you are|act as|your role|persona|instructions|constraints|rules|always|never|must|assistant)\b', text, re.I))
    mode_alignment = min(100, 30 + m_hits * 22)

    # Token efficiency: sweet spot 20-200 tokens
    tokens = estimate_tokens(text)
    if tokens < 5:       token_eff = 10
    elif tokens < 20:    token_eff = 55
    elif tokens < 200:   token_eff = 92
    elif tokens < 500:   token_eff = 75
    elif tokens < 1000:  token_eff = 58
    else:                token_eff = 38

    # Constraints
    con_hits = len(re.findall(r'\b(only|limit|max|minimum|do not|don\'t|avoid|must not|strictly|ensure|required|never|always)\b', text, re.I))
    constraints = min(100, 20 + con_hits * 22)

    dims = [clarity, specificity, context_score, format_score, mode_alignment, token_eff, constraints]
    overall = round(sum(dims) / len(dims))

    return {
        "overall":         overall,
        "clarity":         round(clarity),
        "specificity":     round(specificity),
        "context":         round(context_score),
        "format":          round(format_score),
        "mode_alignment":  round(mode_alignment),
        "token_efficiency":round(token_eff),
        "constraints":     round(constraints),
        "grade":           "A" if overall >= 85 else "B" if overall >= 70 else "C" if overall >= 55 else "D" if overall >= 40 else "F",
        "label":           "EXCELLENT" if overall >= 85 else "GOOD" if overall >= 70 else "FAIR" if overall >= 55 else "POOR" if overall >= 40 else "CRITICAL",
    }

# ─── Validation / Issue Detection ─────────────────────────────────────────────

def get_issues(text: str, mode: str) -> list[dict]:
    issues = []
    wc = len(text.strip().split())
    mode = mode.upper()

    if wc < 5:
        issues.append({"type": "ERROR", "code": "TOO_SHORT",       "message": "Prompt too short — insufficient context for reliable model inference"})
    if wc > 800:
        issues.append({"type": "WARN",  "code": "TOO_LONG",        "message": "Prompt exceeds 800 words — consider splitting into sub-prompts"})
    if not re.search(r'\b(create|write|generate|analyze|explain|summarize|list|compare|describe|identify|implement|build|evaluate|provide)\b', text, re.I):
        issues.append({"type": "WARN",  "code": "NO_ACTION_VERB",  "message": "No clear action verb — model lacks an explicit task directive"})
    if not re.search(r'\b(format|output|json|markdown|list|bullet|table|paragraph|step)\b', text, re.I):
        issues.append({"type": "INFO",  "code": "NO_FORMAT",       "message": "No output format specified — ambiguous structure may reduce quality"})
    if mode == "SYSTEM" and not re.search(r'\b(you are|act as|your role|persona)\b', text, re.I):
        issues.append({"type": "WARN",  "code": "NO_PERSONA",      "message": "SYSTEM mode: missing persona definition — add 'You are a...'"})
    if not re.search(r'\b(example|e\.g\.|for instance|input:|output:)\b', text, re.I):
        issues.append({"type": "INFO",  "code": "NO_EXAMPLES",     "message": "No examples detected — few-shot examples improve output fidelity 15-30%"})
    if not re.search(r'\b(only|limit|avoid|do not|must|ensure|strictly)\b', text, re.I):
        issues.append({"type": "INFO",  "code": "NO_CONSTRAINTS",  "message": "No constraints defined — open-ended prompts risk scope drift"})
    if re.search(r'\b(please|kindly|could you)\b', text, re.I):
        issues.append({"type": "INFO",  "code": "POLITENESS",      "message": "Politeness markers add tokens without improving model output quality"})
    if not issues:
        issues.append({"type": "OK",    "code": "CLEAN",           "message": "Format structure looks clean — no critical issues detected"})
    return issues

# ─── Format Preview ───────────────────────────────────────────────────────────

def format_for_model(text: str, model_id: str, mode: str) -> str:
    """Wrap prompt in model-native format."""
    mdl = MODELS.get(model_id, MODELS["claude-3-5"])
    fmt = mdl["format"]
    role = "system" if mode.upper() == "SYSTEM" else "user"
    if fmt == "XML Tags":
        return f"<prompt>\n  <mode>{mode.lower()}</mode>\n  <content>\n    {text[:500]}{'...' if len(text) > 500 else ''}\n  </content>\n</prompt>"
    elif fmt == "Llama Template":
        return f"[INST] <<SYS>>\nMode: {mode}\n<</SYS>>\n\n{text[:500]}{'...' if len(text) > 500 else ''}\n[/INST]"
    else:  # ChatML
        escaped = text[:500].replace('"', '\\"').replace('\n', '\\n')
        return f'{{"role": "{role}", "content": "{escaped}{"..." if len(text) > 500 else ""}"}}'

# ─── Optimizer ────────────────────────────────────────────────────────────────

def optimize_prompt(text: str, mode: str) -> dict:
    """Rule-based prompt improvement pass."""
    out = text.strip()
    changes = []
    mode = mode.upper()

    if mode == "SYSTEM" and not re.search(r'\b(you are|act as)\b', out, re.I):
        out = "You are an expert AI assistant.\n\n" + out
        changes.append("Added persona definition for SYSTEM mode")
    if not re.search(r'\b(format|output)\b', out, re.I):
        out += "\n\nFormat your response clearly with proper structure and headings where appropriate."
        changes.append("Added output format specification")
    if not re.search(r'\b(example|e\.g\.)\b', out, re.I):
        out += "\nInclude a concrete example to illustrate your answer."
        changes.append("Added example directive for few-shot clarity")
    if not re.search(r'\b(only|avoid|do not|must|ensure)\b', out, re.I):
        out += "\nEnsure accuracy and avoid speculation beyond the provided information."
        changes.append("Added accuracy constraint")
    if not changes:
        changes.append("No critical improvements needed — prompt is well-structured")

    original_score = score_prompt(text, mode).get("overall", 0)
    optimized_score = score_prompt(out, mode).get("overall", 0)
    return {
        "original_prompt": text,
        "optimized_prompt": out,
        "changes_applied": changes,
        "score_delta": optimized_score - original_score,
        "original_score": original_score,
        "optimized_score": optimized_score,
    }

# ─── Wizard Builder ───────────────────────────────────────────────────────────

def build_from_wizard(answers: dict, mode: str) -> str:
    goal          = answers.get("goal", "general task")
    audience      = answers.get("audience", "users")
    output_format = answers.get("output_format", "clear, structured format")
    tone          = answers.get("tone", "professional")
    constraints   = answers.get("constraints", "")
    context_depth = answers.get("context_depth", "")
    examples      = answers.get("examples", "No examples needed")
    mode = mode.upper()

    if mode == "SYSTEM":
        p = f"You are an expert AI assistant specialized in {goal.lower()}.\n\n"
        p += f"Your role is to assist {audience.lower()} by providing accurate, well-structured responses.\n\n"
        p += f"Behavioral guidelines:\n"
        p += f"- Maintain a {tone.lower()} tone at all times\n"
        p += f"- Format all responses as {output_format.lower()}\n"
        if constraints and constraints != "No constraints needed":
            p += f"- Strictly enforce: {constraints.lower()}\n"
        if "examples" in context_depth or "chain" in context_depth:
            p += "- Always include relevant examples or step-by-step reasoning\n"
        p += "- If uncertain, acknowledge limitations and suggest alternatives\n"
        p += "- Prioritize clarity, accuracy, and actionability in every response"

    elif mode == "CREATIVE":
        p = f"Write a creative {goal.lower()} for {audience.lower()}.\n\n"
        p += f"Style requirements:\n- Tone: {tone.lower()}\n- Format: {output_format.lower()}\n"
        if constraints and constraints != "No constraints needed":
            p += f"- Constraints: {constraints.lower()}\n"
        if "chain" in context_depth:
            p += "\nThink step-by-step before writing. First outline the structure, then execute fully.\n"
        if "No" not in examples:
            cnt = "3+" if "3+" in examples else "one illustrative"
            fmt_note = " as input/output pairs" if "pair" in examples else ""
            p += f"\nInclude {cnt} example{fmt_note} within your response."
        p += "\n\nEnsure the output is engaging, original, and directly serves the audience's expectations."

    else:  # TECHNICAL
        p = f"{goal.capitalize()} for {audience.lower()}.\n\n"
        p += f"Output requirements:\n- Format: {output_format.lower()}\n- Tone: {tone.lower()}\n"
        if constraints and constraints != "No constraints needed":
            p += f"- Constraints: {constraints.lower()}\n"
        if "chain" in context_depth:
            p += "\nReason step-by-step before providing your final answer. Show your reasoning process.\n"
        if "background" in context_depth:
            p += "Provide sufficient background context before diving into specifics.\n"
        if "No" not in examples:
            cnt = "3+ worked" if "3+" in examples else "one"
            fmt_note = " in input → output format" if "pair" in examples else ""
            p += f"\nInclude {cnt} example{fmt_note} to demonstrate.\n"
        p += "\nBe precise, accurate, and ensure all claims are well-supported."

    return p

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

PromptMode = Literal["CREATIVE", "TECHNICAL", "SYSTEM"]

class AnalyzeRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=50_000)
    mode: PromptMode = "TECHNICAL"
    model_id: str = "claude-3-5"

class ScoreRequest(BaseModel):
    prompt: str
    mode: PromptMode = "TECHNICAL"

class TokenRequest(BaseModel):
    prompt: str
    model_id: str = "claude-3-5"
    output_multiplier: float = 1.8

class OptimizeRequest(BaseModel):
    prompt: str
    mode: PromptMode = "TECHNICAL"

class WizardGenerateRequest(BaseModel):
    answers: dict
    mode: PromptMode = "TECHNICAL"

class CompareModelsRequest(BaseModel):
    prompt: str
    mode: PromptMode = "TECHNICAL"

class HistoryEntry(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    ts: int = Field(default_factory=lambda: int(time.time() * 1000))
    prompt_preview: str
    mode: str = "TECHNICAL"
    model_id: str = "claude-3-5"
    score: Optional[int] = None

_history: deque = deque(maxlen=50)

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"service": "PromptForge API", "version": "0.9.4-mvp", "status": "online"}


@app.get("/models")
def list_models():
    """Return all supported models with metadata."""
    return [{"id": k, **v} for k, v in MODELS.items()]


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """Full pipeline: score + issues + token count + format preview."""
    tokens = estimate_tokens(req.prompt)
    mdl = MODELS.get(req.model_id, MODELS["claude-3-5"])
    ctx_pct = round(tokens / mdl["context"] * 100, 2)

    return {
        "prompt_hash": hash(req.prompt) & 0xFFFFFFFF,
        "mode": req.mode,
        "model": mdl["name"],
        "scores": score_prompt(req.prompt, req.mode),
        "issues": get_issues(req.prompt, req.mode),
        "tokens": {
            "input": tokens,
            "context_limit": mdl["context"],
            "context_pct": ctx_pct,
            "fits": tokens <= mdl["context"],
        },
        "format_preview": format_for_model(req.prompt, req.model_id, req.mode),
        "format_type": mdl["format"],
    }


@app.post("/score")
def score(req: ScoreRequest):
    """Score prompt on 7 dimensions."""
    s = score_prompt(req.prompt, req.mode)
    if not s:
        raise HTTPException(400, "Empty prompt")
    # Build top recommendations
    dim_order = sorted(
        [("clarity", s["clarity"]), ("specificity", s["specificity"]),
         ("context", s["context"]), ("format", s["format"]),
         ("mode_alignment", s["mode_alignment"]), ("token_efficiency", s["token_efficiency"]),
         ("constraints", s["constraints"])],
        key=lambda x: x[1]
    )
    recs_map = {
        "clarity":         "Simplify sentence structure; aim for 40-80 word prompts with clear logic",
        "specificity":     "Add a clear action verb: generate, analyze, explain, implement, evaluate",
        "context":         "Add role/background context: 'You are a...', 'Given the following...'",
        "format":          "Specify output format explicitly: JSON, markdown, bullet list, table",
        "mode_alignment":  f"Use vocabulary aligned with {req.mode} mode (e.g., {'code/function' if req.mode=='TECHNICAL' else 'narrative/scene' if req.mode=='CREATIVE' else 'you are/must/always'})",
        "token_efficiency":"Optimize length: remove politeness filler, add domain-specific context",
        "constraints":     "Define constraints: word limits, topics to avoid, required inclusions",
    }
    recommendations = [recs_map[d] for d, _ in dim_order[:3]]
    return {**s, "recommendations": recommendations, "mode": req.mode}


@app.post("/tokens/count")
def count_tokens(req: TokenRequest):
    """Token count, context window usage, and cost estimate."""
    mdl = MODELS.get(req.model_id, MODELS["claude-3-5"])
    inp = estimate_tokens(req.prompt)
    out_est = round(inp * req.output_multiplier)
    ctx_pct = round(inp / mdl["context"] * 100, 2)
    cost_in = inp / 1_000_000 * mdl["cost_in"]
    cost_out = out_est / 1_000_000 * mdl["cost_out"]
    return {
        "input_tokens":    inp,
        "output_est_tokens": out_est,
        "total_est":       inp + out_est,
        "context_limit":   mdl["context"],
        "context_pct":     ctx_pct,
        "fits":            inp <= mdl["context"],
        "cost_usd": {
            "input":  round(cost_in, 8),
            "output": round(cost_out, 8),
            "total":  round(cost_in + cost_out, 8),
        },
        "model": mdl["name"],
        "rates": {"per_1m_input": mdl["cost_in"], "per_1m_output": mdl["cost_out"]},
    }


@app.post("/validate/format")
def validate_format(req: AnalyzeRequest):
    """Check prompt format and return model-native preview."""
    issues = get_issues(req.prompt, req.mode)
    critical = [i for i in issues if i["type"] == "ERROR"]
    warnings = [i for i in issues if i["type"] == "WARN"]
    return {
        "valid": len(critical) == 0,
        "critical_count": len(critical),
        "warning_count": len(warnings),
        "issues": issues,
        "format_preview": format_for_model(req.prompt, req.model_id, req.mode),
        "format_type": MODELS.get(req.model_id, MODELS["claude-3-5"])["format"],
    }


@app.post("/optimize")
def optimize(req: OptimizeRequest):
    """Apply rule-based optimization pass and return improved prompt."""
    return optimize_prompt(req.prompt, req.mode)


@app.post("/compare/models")
def compare_models(req: CompareModelsRequest):
    """Evaluate prompt compatibility and cost across all models."""
    inp = estimate_tokens(req.prompt)
    s = score_prompt(req.prompt, req.mode)
    base_score = s.get("overall", 0) if s else 0

    results = []
    for mid, mdl in MODELS.items():
        fits = inp <= mdl["context"]
        fmt_bonus = 7 if mdl["format"] == "XML Tags" and req.mode == "SYSTEM" else 0
        compat = round((base_score * 0.6 + (85 + fmt_bonus) * 0.4) * (1 if fits else 0.25))
        cost_per_call = round(inp / 1_000_000 * mdl["cost_in"] + (inp * 1.8) / 1_000_000 * mdl["cost_out"], 8)
        results.append({
            "model_id":        mid,
            "name":            mdl["name"],
            "provider":        mdl["provider"],
            "format":          mdl["format"],
            "context_limit":   mdl["context"],
            "context_pct":     round(inp / mdl["context"] * 100, 2),
            "fits":            fits,
            "compat_score":    compat,
            "cost_per_call":   cost_per_call,
            "needs_adaptation": mdl["format"] not in ["ChatML"],
        })

    results.sort(key=lambda x: x["compat_score"], reverse=True)
    return {
        "input_tokens": inp,
        "mode": req.mode,
        "results": results,
        "recommended": results[0]["model_id"] if results else None,
    }


@app.get("/wizard/questions")
def get_wizard_questions():
    """Return adaptive wizard question set."""
    return {"questions": WIZARD_QUESTIONS, "total": len(WIZARD_QUESTIONS)}


@app.post("/wizard/generate")
def wizard_generate(req: WizardGenerateRequest):
    """Generate a prompt from collected wizard answers."""
    prompt = build_from_wizard(req.answers, req.mode)
    s = score_prompt(prompt, req.mode)
    return {
        "generated_prompt": prompt,
        "token_estimate":   estimate_tokens(prompt),
        "scores":           s,
        "issues":           get_issues(prompt, req.mode),
        "mode":             req.mode,
        "answers_used":     req.answers,
    }


@app.post("/prompt/compress")
def compress_prompt(req: ScoreRequest):
    """Token compression — remove filler without losing semantic content."""
    text = req.prompt
    fillers = [r'\bplease\b', r'\bkindly\b', r'\bcould you\b', r'\bcan you\b',
               r'\bwould you\b', r'\bjust\b', r'\breally\b', r'\bvery\b', r'\bbasically\b']
    compressed = text
    for f in fillers:
        compressed = re.sub(f, '', compressed, flags=re.I)
    compressed = re.sub(r'  +', ' ', compressed).strip()
    original_tok = estimate_tokens(text)
    compressed_tok = estimate_tokens(compressed)
    return {
        "original": text,
        "compressed": compressed,
        "tokens_saved": original_tok - compressed_tok,
        "compression_ratio": round(compressed_tok / max(original_tok, 1), 3),
        "savings_pct": round((original_tok - compressed_tok) / max(original_tok, 1) * 100, 1),
    }


@app.get("/ui")
def serve_ui():
    """Serve the frontend terminal UI."""
    path = Path(__file__).parent / "frontend" / "index.html"
    if path.exists():
        return FileResponse(str(path))
    return {"message": "Frontend not found. Create frontend/index.html or open it directly."}

@app.get("/history")
def get_history():
    """Return session analysis history."""
    return list(_history)

@app.post("/history")
def add_to_history(entry: HistoryEntry):
    """Persist a prompt analysis entry."""
    item = entry.model_dump()
    _history.appendleft(item)
    return item

@app.delete("/history")
def clear_history_store():
    """Wipe all history."""
    _history.clear()
    return {"cleared": True}

@app.get("/health")
def health_check():
    return {"status": "healthy", "ts": int(time.time()), "models_loaded": len(MODELS)}
