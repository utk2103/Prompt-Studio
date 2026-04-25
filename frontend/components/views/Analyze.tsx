'use client';

import { useRef } from 'react';
import type { AppState, ToastType } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { scoreLocal, issuesLocal, normalizeIssues } from '@/lib/scoring';
import { tok, wc } from '@/lib/utils';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  toast: (msg: string, type?: ToastType) => void;
}

function Btn({ label, onClick, color = '#00cc44' }: { label: string; onClick: () => void; color?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{ background: 'transparent', color, border: `1px solid ${color}`, padding: '3px 10px', fontSize: 11, marginRight: 4, marginBottom: 3, fontWeight: 400, letterSpacing: '.3px' }}
      onMouseEnter={() => { if (ref.current) { ref.current.style.background = color; ref.current.style.color = '#080c08'; ref.current.style.boxShadow = `0 0 6px ${color}40`; } }}
      onMouseLeave={() => { if (ref.current) { ref.current.style.background = 'transparent'; ref.current.style.color = color; ref.current.style.boxShadow = 'none'; } }}
    >
      {label}
    </button>
  );
}

export default function Analyze({ state, update, toast }: Props) {
  const curModel = state.models.find(m => m.id === state.model) || state.models[1];
  const t = tok(state.prompt);

  const handleInput = (val: string) => {
    const scores = val.trim() ? scoreLocal(val, state.mode) : null;
    const issues = val.trim() ? issuesLocal(val, state.mode) : [];
    update({ prompt: val, scores, issues });
  };

  const handleAnalyze = async () => {
    if (!state.prompt.trim()) { toast('Enter a prompt first', 'warn'); return; }
    update({ loading: true });
    try {
      let scores = state.scores;
      let issues = state.issues;
      let recs: string[] = [];
      if (state.apiOnline) {
        const [data, sc] = await Promise.all([
          apiFetch<{ scores: typeof scores; issues: { type: string; message: string }[] }>('/analyze', 'POST', { prompt: state.prompt, mode: state.mode, model_id: state.model }),
          apiFetch<{ recommendations: string[] }>('/score', 'POST', { prompt: state.prompt, mode: state.mode }),
        ]);
        scores = data.scores;
        issues = normalizeIssues(data.issues);
        recs = sc.recommendations || [];
      } else {
        scores = scoreLocal(state.prompt, state.mode);
        issues = issuesLocal(state.prompt, state.mode);
      }
      const entry = { prompt_preview: state.prompt.slice(0, 80) + (state.prompt.length > 80 ? '...' : ''), mode: state.mode, model_id: state.model, score: scores?.overall, ts: Date.now() };
      let history = state.history;
      if (state.apiOnline) {
        try { const saved = await apiFetch<typeof entry>('/history', 'POST', entry); history = [saved, ...history.slice(0, 9)]; } catch { }
      } else {
        history = [{ ...entry, id: Math.random().toString(36).slice(2, 8) }, ...history.slice(0, 9)];
      }
      update({ scores, issues, recs, history, view: 'SCORE', loading: false });
    } catch (e: unknown) {
      toast('Analysis error: ' + (e as Error).message, 'err');
      update({ loading: false });
    }
  };

  const handleOptimize = async () => {
    if (!state.prompt.trim()) { toast('Enter a prompt first', 'warn'); return; }
    update({ loading: true });
    try {
      let prompt = state.prompt;
      if (state.apiOnline) {
        const r = await apiFetch<{ optimized_prompt: string; score_delta: number; changes_applied: string[] }>('/optimize', 'POST', { prompt: state.prompt, mode: state.mode });
        prompt = r.optimized_prompt;
        const delta = r.score_delta > 0 ? '+' + r.score_delta : String(r.score_delta || 0);
        toast('Optimized · score delta: ' + delta + ' pts · ' + r.changes_applied.length + ' change(s)', 'ok');
      } else {
        let out = state.prompt.trim();
        const ch: string[] = [];
        if (state.mode === 'SYSTEM' && !/you are|act as/i.test(out)) { out = 'You are an expert AI assistant.\n\n' + out; ch.push('persona added'); }
        if (!/format|output/i.test(out)) { out += '\n\nFormat your response clearly with proper structure.'; ch.push('format spec added'); }
        if (!/example|e\.g\./i.test(out)) { out += '\nInclude a concrete example to illustrate.'; ch.push('example added'); }
        if (!/only|avoid|do not|must|ensure/i.test(out)) { out += '\nEnsure accuracy and avoid speculation.'; ch.push('constraints added'); }
        prompt = out;
        toast('Applied: ' + (ch.join(', ') || 'prompt already well-formed'), 'ok');
      }
      update({ prompt, scores: scoreLocal(prompt, state.mode), issues: issuesLocal(prompt, state.mode), loading: false });
    } catch (e: unknown) {
      toast('Optimize failed: ' + (e as Error).message, 'err');
      update({ loading: false });
    }
  };

  const handleCompress = async () => {
    if (!state.prompt.trim()) { toast('Enter a prompt first', 'warn'); return; }
    if (state.apiOnline) {
      try {
        const r = await apiFetch<{ compressed: string; tokens_saved: number; savings_pct: number }>('/prompt/compress', 'POST', { prompt: state.prompt, mode: state.mode });
        update({ prompt: r.compressed, scores: scoreLocal(r.compressed, state.mode), issues: issuesLocal(r.compressed, state.mode) });
        toast('-' + r.tokens_saved + ' tokens (' + r.savings_pct + '% savings)', 'info');
      } catch { toast('Compress failed', 'err'); }
    } else {
      const fillers = [/\bplease\b/gi, /\bkindly\b/gi, /\bcould you\b/gi, /\bcan you\b/gi, /\bjust\b/gi, /\bbasically\b/gi];
      let out = state.prompt;
      fillers.forEach(f => (out = out.replace(f, '')));
      out = out.replace(/  +/g, ' ').trim();
      const saved = tok(state.prompt) - tok(out);
      update({ prompt: out, scores: scoreLocal(out, state.mode), issues: issuesLocal(out, state.mode) });
      toast('Compressed: -' + saved + ' tokens', 'info');
    }
  };

  const issueColor = (t: string) => t === 'ERR' ? '#ff4444' : t === 'WARN' ? '#ffcc00' : t === 'OK' ? '#33ff66' : '#007722';
  const issuePrefix: Record<string, string> = { ERR: '[FAIL] ', WARN: '[WARN] ', OK: '[ OK ] ', INFO: '[INFO] ' };

  const formatPreview = () => {
    if (!state.prompt) return '';
    const trunc = state.prompt.slice(0, 200) + (state.prompt.length > 200 ? '\n…' : '');
    const fmt = curModel?.format || 'ChatML';
    if (fmt === 'XML Tags') return `<prompt>\n  <mode>${state.mode.toLowerCase()}</mode>\n  <content>\n    ${trunc.replace(/\n/g, '\n    ')}\n  </content>\n</prompt>`;
    if (fmt === 'Llama Template') return `[INST] <<SYS>>\nMode: ${state.mode}\n<</SYS>>\n\n${trunc}\n[/INST]`;
    return `{"role":"${state.mode === 'SYSTEM' ? 'system' : 'user'}","content":"${trunc.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}`;
  };

  return (
    <div>
      <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
        <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► PROMPT ANALYZER</div>
        <span style={{ color: '#007722', fontSize: 9, letterSpacing: '.3px' }}>Validate format · detect issues · optimize & copy</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: '#007722', fontSize: 10, letterSpacing: '.3px' }}>PROMPT INPUT ▶</span>
        <span style={{ color: '#004411', fontSize: 9 }}>{t} tokens  ·  {state.prompt.length} chars  ·  {wc(state.prompt)} words</span>
      </div>

      <textarea
        style={{ width: '100%', background: '#030803', color: '#e8ffe8', border: '1px solid #003311', padding: '9px 10px', fontSize: 11, resize: 'vertical', minHeight: 110, lineHeight: '1.55', letterSpacing: '.2px', marginBottom: 8 }}
        placeholder="Enter your prompt here... or use [→ WIZARD] to build one adaptively"
        value={state.prompt}
        onChange={e => handleInput(e.target.value)}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 10 }}>
        <Btn label="[ANALYZE]" onClick={handleAnalyze} color="#33ff66" />
        <Btn label="[OPTIMIZE]" onClick={handleOptimize} color="#00ccff" />
        <Btn label="[COMPRESS]" onClick={handleCompress} color="#ffcc00" />
        <Btn label="[COPY]" onClick={() => { navigator.clipboard.writeText(state.prompt).catch(() => {}); toast('Copied to clipboard', 'ok'); }} color="#ffcc00" />
        <Btn label="[CLEAR]" onClick={() => update({ prompt: '', scores: null, issues: [] })} color="#ff4444" />
        <Btn label="[→ WIZARD]" onClick={() => update({ view: 'WIZARD', wizardStep: 0, wizardAnswers: {} })} color="#007722" />
      </div>

      {/* Issues */}
      <div style={{ marginBottom: 10 }}>
        {!state.issues.length && !state.prompt && (
          <span style={{ color: '#004411', fontSize: 10, display: 'block', padding: '4px 0' }}>── Enter a prompt above to see validation results ──</span>
        )}
        {state.issues.length > 0 && (
          <>
            <span style={{ color: '#007722', fontSize: 10, display: 'block', marginBottom: 5, letterSpacing: '.3px' }}>DIAGNOSTIC OUTPUT:</span>
            {state.issues.map((iss, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 3 }}>
                <span style={{ color: issueColor(iss.t), fontSize: 10, flexShrink: 0, fontWeight: 600 }}>{issuePrefix[iss.t] || '[INFO] '}</span>
                <span style={{ color: iss.t === 'OK' ? '#00cc44' : '#e8ffe8', fontSize: 10, lineHeight: '1.45' }}>{iss.m}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Format preview */}
      {state.prompt && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ color: '#007722', fontSize: 9, letterSpacing: '.3px' }}>FORMAT PREVIEW → {curModel?.name.toUpperCase()}</span>
            <span style={{ color: '#004411', fontSize: 9 }}>{curModel?.format}</span>
          </div>
          <pre style={{ background: '#030803', border: '1px solid #003311', padding: '8px 10px', fontSize: 10, color: '#e8ffe8', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto', lineHeight: '1.5', letterSpacing: '.2px' }}>
            {formatPreview()}
          </pre>
        </div>
      )}
    </div>
  );
}
