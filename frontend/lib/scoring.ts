import type { Issue, ModeType, ScoreResult } from './types';
import { tok } from './utils';

export function scoreLocal(text: string, mode: ModeType): ScoreResult | null {
  if (!text?.trim()) return null;
  const words = text.trim().split(/\s+/);
  const wc_ = words.length;
  const acts = (text.match(/\b(create|write|generate|analyze|explain|summarize|list|compare|describe|identify|implement|design|build|evaluate|review|translate|convert|extract|provide|suggest)\b/gi) || []).length;
  const ctxH = (text.match(/\b(context|background|you are|acting as|role|assume|given|based on|purpose|goal|objective|your task)\b/gi) || []).length;
  const fmtH = (text.match(/\b(format|json|markdown|list|bullet|numbered|table|paragraph|output|response)\b/gi) || []).length;
  const hasEx = /(example|e\.g\.|for instance|input:|output:|sample)/i.test(text);
  const conH = (text.match(/\b(only|limit|max|minimum|do not|don't|avoid|must not|strictly|ensure|required|never|always)\b/gi) || []).length;
  const clarity = Math.min(100, Math.max(15, 100 - Math.abs(wc_ - 60) * 0.7 - (wc_ < 5 ? 50 : 0)));
  const spec = Math.min(100, 20 + acts * 18 + (wc_ > 15 ? 15 : 0) + (wc_ > 40 ? 10 : 0));
  const ctx = Math.min(100, 15 + ctxH * 22 + (hasEx ? 28 : 0) + (wc_ > 50 ? 15 : 0));
  const fmt = Math.min(100, 15 + fmtH * 28 + (text.includes('```') || text.includes('###') ? 20 : 0));
  let mAl = 40;
  if (mode === 'CREATIVE') {
    const m = (text.match(/\b(story|creative|imagine|narrative|character|scene|poem|fiction|voice|style|tone|vivid)\b/gi) || []).length;
    mAl = Math.min(100, 30 + m * 22);
  } else if (mode === 'TECHNICAL') {
    const m = (text.match(/\b(code|function|algorithm|implement|debug|optimize|api|database|system|architecture|performance)\b/gi) || []).length;
    mAl = Math.min(100, 30 + m * 22);
  } else {
    const m = (text.match(/\b(you are|act as|your role|persona|instructions|constraints|rules|always|never|must|assistant)\b/gi) || []).length;
    mAl = Math.min(100, 30 + m * 22);
  }
  const t = tok(text);
  const tE = t < 5 ? 10 : t < 20 ? 55 : t < 200 ? 92 : t < 500 ? 75 : t < 1000 ? 58 : 38;
  const con = Math.min(100, 20 + conH * 22);
  const ov = Math.round((clarity + spec + ctx + fmt + mAl + tE + con) / 7);
  return {
    overall: ov,
    clarity: Math.round(clarity),
    specificity: Math.round(spec),
    context: Math.round(ctx),
    format: Math.round(fmt),
    mode_alignment: Math.round(mAl),
    token_efficiency: Math.round(tE),
    constraints: Math.round(con),
    grade: ov >= 85 ? 'A' : ov >= 70 ? 'B' : ov >= 55 ? 'C' : ov >= 40 ? 'D' : 'F',
    label: ov >= 85 ? 'EXCELLENT' : ov >= 70 ? 'GOOD' : ov >= 55 ? 'FAIR' : ov >= 40 ? 'POOR' : 'CRITICAL',
  };
}

export function issuesLocal(text: string, mode: ModeType): Issue[] {
  if (!text?.trim()) return [];
  const issues: Issue[] = [];
  const wc_ = text.trim().split(/\s+/).length;
  if (wc_ < 5) issues.push({ t: 'ERR', m: 'Prompt too short — insufficient context for model inference' });
  if (wc_ > 800) issues.push({ t: 'WARN', m: 'Prompt exceeds 800 words — consider chunking into sub-prompts' });
  if (!/\b(create|write|generate|analyze|explain|summarize|list|compare|describe|identify|implement|build|evaluate|provide)\b/i.test(text))
    issues.push({ t: 'WARN', m: 'No clear action verb — model lacks explicit task directive' });
  if (!/\b(format|output|json|markdown|list|bullet|table|paragraph|step)\b/i.test(text))
    issues.push({ t: 'INFO', m: 'No output format specified — ambiguous structure may reduce quality' });
  if (mode === 'SYSTEM' && !/\b(you are|act as|your role|persona)\b/i.test(text))
    issues.push({ t: 'WARN', m: 'SYSTEM mode: missing persona definition (e.g., "You are a...")' });
  if (!/\b(example|e\.g\.|for instance|input:|output:)\b/i.test(text))
    issues.push({ t: 'INFO', m: 'No examples detected — few-shot examples improve fidelity +15-30%' });
  if (!/\b(only|limit|avoid|do not|must|ensure|strictly)\b/i.test(text))
    issues.push({ t: 'INFO', m: 'No constraints defined — open-ended prompts risk scope drift' });
  if (/\b(please|kindly|could you)\b/i.test(text))
    issues.push({ t: 'INFO', m: 'Politeness markers add tokens without improving model outputs' });
  if (wc_ > 5 && !issues.length)
    issues.push({ t: 'OK', m: 'Format structure looks clean — no critical issues detected' });
  return issues;
}

export function normalizeIssues(issues: Array<{ type?: string; message?: string; t?: string; m?: string }>): Issue[] {
  return issues.map(i => ({
    t: (i.type === 'ERROR' ? 'ERR' : i.type || i.t || 'INFO') as Issue['t'],
    m: i.message || i.m || '',
  }));
}

export function localRecs(s: ScoreResult): string[] {
  return [
    { score: s.context, r: 'Add role definition or background context to ground the model' },
    { score: s.format, r: 'Specify output format explicitly (JSON, markdown, bullet list)' },
    { score: s.constraints, r: 'Define constraints: word limits, topics to avoid, required inclusions' },
    { score: s.specificity, r: 'Add a clear action verb (generate, analyze, explain, create)' },
    { score: s.mode_alignment, r: 'Align vocabulary and structure with selected mode' },
  ]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(x => x.r);
}

export function modeAdvice(mode: ModeType): string[] {
  if (mode === 'CREATIVE')
    return [
      'Use sensory/evocative language to set scene and tone',
      'Define narrative voice (first/third person, protagonist details)',
      'Specify length and pacing (flash fiction vs. multi-scene)',
    ];
  if (mode === 'TECHNICAL')
    return [
      'Include language/framework constraints (e.g., "in Python 3.11")',
      'Specify error handling and edge cases explicitly',
      'Add performance or complexity requirements if relevant',
    ];
  return [
    'Begin with "You are a [role] specialized in [domain]"',
    'Define explicit behavioral rules using always/never directives',
    'Specify response format, length, and escalation protocols',
  ];
}
