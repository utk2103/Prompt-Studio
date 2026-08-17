'use client';

import type { AppState, ToastType } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { scoreLocal, issuesLocal, normalizeIssues } from '@/lib/scoring';
import { tok, wc } from '@/lib/utils';
import ViewHeader from './ViewHeader';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  toast: (msg: string, type?: ToastType) => void;
}

function Btn({ label, onClick, variant = 'ghost' }: { label: string; onClick: () => void; variant?: 'solid' | 'ghost' | 'danger' }) {
  const styles: Record<string, React.CSSProperties> = {
    solid: { background: 'var(--d-accent)', color: '#fff', border: '1px solid var(--d-accent)' },
    ghost: { background: 'transparent', color: 'var(--d-accent)', border: '1px solid var(--d-accent)' },
    danger: { background: 'transparent', color: '#c8342a', border: '1px solid #c8342a' },
  };
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 18px',
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        ...styles[variant],
      }}
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
    update({ loading: true, loadingLabel: 'Analyzing' });
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
      const summary = scores
        ? `Overall: ${scores.overall}/100 (${scores.grade} — ${scores.label})\n\n` +
          `Dimensions:\n` +
          `  Clarity          ${scores.clarity}\n` +
          `  Specificity      ${scores.specificity}\n` +
          `  Context          ${scores.context}\n` +
          `  Format           ${scores.format}\n` +
          `  Mode alignment   ${scores.mode_alignment}\n` +
          `  Token efficiency ${scores.token_efficiency}\n` +
          `  Constraints      ${scores.constraints}\n\n` +
          (issues.length ? `Issues (${issues.length}):\n` + issues.map(i => `  [${i.t}] ${i.m}`).join('\n') + '\n\n' : '') +
          `--- Prompt ---\n${state.prompt}`
        : state.prompt;
      update({
        scores, issues, recs, history,
        view: 'SCORE', loading: false,
        modal: { title: 'Analysis Result', prompt: summary },
      });
    } catch (e: unknown) {
      toast('Analysis error: ' + (e as Error).message, 'err');
      update({ loading: false });
    }
  };

  const handleOptimize = async () => {
    if (!state.prompt.trim()) { toast('Enter a prompt first', 'warn'); return; }
    update({ loading: true, loadingLabel: 'Optimizing' });
    try {
      let prompt = state.prompt;
      if (state.apiOnline) {
        const r = await apiFetch<{ optimized_prompt: string; score_delta: number; changes_applied: string[] }>('/optimize', 'POST', { prompt: state.prompt, mode: state.mode });
        prompt = r.optimized_prompt;
        const delta = r.score_delta > 0 ? '+' + r.score_delta : String(r.score_delta || 0);
        toast('Optimized. Score delta: ' + delta + ' pts, ' + r.changes_applied.length + ' change(s)', 'ok');
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
      update({
        prompt,
        scores: scoreLocal(prompt, state.mode),
        issues: issuesLocal(prompt, state.mode),
        loading: false,
        modal: { title: 'Optimized Prompt', prompt },
      });
    } catch (e: unknown) {
      toast('Optimize failed: ' + (e as Error).message, 'err');
      update({ loading: false });
    }
  };

  const handleCompress = async () => {
    if (!state.prompt.trim()) { toast('Enter a prompt first', 'warn'); return; }
    update({ loading: true, loadingLabel: 'Compressing' });
    try {
      let out = state.prompt;
      if (state.apiOnline) {
        const r = await apiFetch<{ compressed: string; tokens_saved: number; savings_pct: number }>('/prompt/compress', 'POST', { prompt: state.prompt, mode: state.mode });
        out = r.compressed;
        toast('-' + r.tokens_saved + ' tokens (' + r.savings_pct + '% savings)', 'info');
      } else {
        const fillers = [/\bplease\b/gi, /\bkindly\b/gi, /\bcould you\b/gi, /\bcan you\b/gi, /\bjust\b/gi, /\bbasically\b/gi];
        fillers.forEach(f => (out = out.replace(f, '')));
        out = out.replace(/  +/g, ' ').trim();
        const saved = tok(state.prompt) - tok(out);
        toast('Compressed: -' + saved + ' tokens', 'info');
      }
      update({
        prompt: out,
        scores: scoreLocal(out, state.mode),
        issues: issuesLocal(out, state.mode),
        loading: false,
        modal: { title: 'Compressed Prompt', prompt: out },
      });
    } catch {
      toast('Compress failed', 'err');
      update({ loading: false });
    }
  };

  const issueTint = (t: string) => t === 'ERR' ? '#c8342a' : t === 'WARN' ? '#c9a227' : t === 'OK' ? '#5b8f3d' : 'var(--d-accent)';
  const issuePrefix: Record<string, string> = { ERR: '[FAIL]', WARN: '[WARN]', OK: '[ OK ]', INFO: '[INFO]' };

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
      <ViewHeader
        marker="/V.01 [X 12.4, Y 08.1]"
        title="Prompt Analyzer"
        subtitle="Validate format, detect issues, optimize and copy. Every action runs offline against a TypeScript fallback when the API is down."
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span className="d-coord">/PROMPT INPUT</span>
        <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: 'var(--d-ink-mute)' }}>
          {t} tokens · {state.prompt.length} chars · {wc(state.prompt)} words
        </span>
      </div>

      <textarea
        style={{
          width: '100%',
          background: 'var(--d-bg-alt)',
          color: 'var(--d-ink)',
          border: '1px solid var(--d-line)',
          padding: '16px 18px',
          fontSize: 14,
          resize: 'vertical',
          minHeight: 160,
          lineHeight: 1.6,
          fontFamily: 'var(--font-manrope), sans-serif',
          marginBottom: 16,
          outline: 'none',
        }}
        placeholder="Enter your prompt here, or use the Wizard to build one adaptively."
        value={state.prompt}
        onChange={e => handleInput(e.target.value)}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        <Btn label="Analyze"  onClick={handleAnalyze} variant="solid" />
        <Btn label="Optimize" onClick={handleOptimize} />
        <Btn label="Compress" onClick={handleCompress} />
        <Btn label="Copy"     onClick={() => { navigator.clipboard.writeText(state.prompt).catch(() => {}); toast('Copied to clipboard', 'ok'); }} />
        <Btn label="Clear"    onClick={() => update({ prompt: '', scores: null, issues: [] })} variant="danger" />
        <Btn label="→ Wizard" onClick={() => update({ view: 'WIZARD', wizardStep: 0, wizardAnswers: {} })} />
      </div>

      {/* Issues */}
      <div style={{ marginBottom: 24 }}>
        {!state.issues.length && !state.prompt && (
          <span style={{ fontSize: 13, color: 'var(--d-ink-mute)', display: 'block' }}>Enter a prompt above to see validation results.</span>
        )}
        {state.issues.length > 0 && (
          <>
            <div className="d-coord" style={{ marginBottom: 10 }}>/DIAGNOSTICS</div>
            <div style={{ border: '1px solid var(--d-line)' }}>
              {state.issues.map((iss, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderTop: i === 0 ? 0 : '1px solid var(--d-line)', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: issueTint(iss.t), fontWeight: 600, flexShrink: 0, letterSpacing: '0.08em' }}>
                    {issuePrefix[iss.t] || '[INFO]'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--d-ink)', lineHeight: 1.5 }}>{iss.m}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Format preview */}
      {state.prompt && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span className="d-coord">/FORMAT PREVIEW → {curModel?.name.toUpperCase()}</span>
            <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: 'var(--d-ink-mute)' }}>{curModel?.format}</span>
          </div>
          <pre style={{
            background: 'var(--d-dark)',
            color: 'var(--d-dark-ink)',
            padding: '16px 18px',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            maxHeight: 200,
            overflowY: 'auto',
            lineHeight: 1.6,
            fontFamily: 'var(--font-jetbrains), monospace',
          }}>
            {formatPreview()}
          </pre>
        </div>
      )}
    </div>
  );
}
