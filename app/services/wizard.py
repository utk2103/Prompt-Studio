from __future__ import annotations

WIZARD_QUESTIONS: list[dict] = [
    {"id": "goal", "q": "What is the PRIMARY objective of this prompt?", "opts": [
        "Generate creative content", "Analyze & evaluate data", "Answer technical questions",
        "Write/debug code", "Summarize information", "Transform/convert content",
        "Extract structured data", "Build a system persona",
    ]},
    {"id": "audience", "q": "Who is the TARGET AUDIENCE for the output?", "opts": [
        "General public", "Software developers", "Business executives", "Researchers/academics",
        "Students/beginners", "Domain experts", "Internal team use",
    ]},
    {"id": "output_format", "q": "What OUTPUT FORMAT is required?", "opts": [
        "Free-form prose", "Bullet points / list", "JSON / structured data",
        "Markdown with headers", "Code block", "Step-by-step numbered", "Table format",
        "Hybrid (prose + structured)",
    ]},
    {"id": "tone", "q": "What TONE should the response have?", "opts": [
        "Professional / formal", "Casual / conversational", "Academic / scholarly",
        "Creative / expressive", "Concise / minimal", "Instructional / didactic",
    ]},
    {"id": "constraints", "q": "Are there KEY CONSTRAINTS to enforce?", "opts": [
        "Word/character limit", "Avoid specific topics", "Must cite sources", "Stay in domain only",
        "Language restrictions", "Safety/content filters", "No constraints needed",
    ]},
    {"id": "context_depth", "q": "How much CONTEXT should the prompt carry?", "opts": [
        "Minimal – just the task", "Some background context", "Full domain background",
        "Few-shot examples only", "Chain-of-thought reasoning", "Background + examples",
    ]},
    {"id": "examples", "q": "Should the prompt include EXAMPLES?", "opts": [
        "Yes – 1-2 examples", "Yes – 3+ examples (few-shot)", "Negative examples only",
        "Input/output pair examples", "No examples needed",
    ]},
]


def build_from_wizard(answers: dict, mode: str) -> str:
    goal = answers.get("goal", "general task")
    audience = answers.get("audience", "users")
    output_format = answers.get("output_format", "clear, structured format")
    tone = answers.get("tone", "professional")
    constraints = answers.get("constraints", "")
    context_depth = answers.get("context_depth", "")
    examples = answers.get("examples", "No examples needed")
    mode = mode.upper()

    if mode == "SYSTEM":
        p = f"You are an expert AI assistant specialized in {goal.lower()}.\n\n"
        p += f"Your role is to assist {audience.lower()} by providing accurate, well-structured responses.\n\n"
        p += "Behavioral guidelines:\n"
        p += f"- Maintain a {tone.lower()} tone at all times\n"
        p += f"- Format all responses as {output_format.lower()}\n"
        if constraints and constraints != "No constraints needed":
            p += f"- Strictly enforce: {constraints.lower()}\n"
        if "examples" in context_depth or "chain" in context_depth:
            p += "- Always include relevant examples or step-by-step reasoning\n"
        p += "- If uncertain, acknowledge limitations and suggest alternatives\n"
        p += "- Prioritize clarity, accuracy, and actionability in every response"
        return p

    if mode == "CREATIVE":
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
        return p

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
