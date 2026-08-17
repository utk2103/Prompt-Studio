'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppState, ToastType } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { scoreLocal, issuesLocal, normalizeIssues } from '@/lib/scoring';
import ViewHeader from './ViewHeader';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  toast: (msg: string, type?: ToastType) => void;
}

export default function Wizard({ state, update, toast }: Props) {
  const [custom, setCustom] = useState('');
  const qs = state.wizardQ;
  const q = qs[state.wizardStep];
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.width = ((state.wizardStep + 1) / qs.length * 100) + '%';
    }
  }, [state.wizardStep, qs.length]);

  if (!q) return null;

  const advance = async (qId: string, answer: string) => {
    const answers = { ...state.wizardAnswers, [qId]: answer };
    if (state.wizardStep < qs.length - 1) {
      update({ wizardAnswers: answers, wizardStep: state.wizardStep + 1 });
      setCustom('');
      return;
    }
    update({ loading: true });
    try {
      let prompt = '';
      let scores = null;
      let issues = [];
      if (state.apiOnline) {
        const r = await apiFetch<{ generated_prompt: string; scores: typeof scores; issues: { type: string; message: string }[] }>('/wizard/generate', 'POST', { answers, mode: state.mode });
        prompt = r.generated_prompt;
        scores = r.scores;
        issues = normalizeIssues(r.issues || []);
      } else {
        const ans = answers;
        const goal = ans.goal || 'task', aud = ans.audience || 'users', fmt = ans.output_format || 'clear format', tone = ans.tone || 'professional';
        const constraints = ans.constraints || '', depth = ans.context_depth || '', examples = ans.examples || '';
        if (state.mode === 'SYSTEM') {
          prompt = `You are an expert AI assistant specialized in ${goal.toLowerCase()}.\n\nYour role is to assist ${aud.toLowerCase()} with accurate, well-structured responses.\n\nGuidelines:\n- Maintain a ${tone.toLowerCase()} tone\n- Format responses as ${fmt.toLowerCase()}${constraints && constraints !== 'No constraints needed' ? '\n- Strictly enforce: ' + constraints.toLowerCase() : ''}\n- Prioritize clarity and accuracy`;
        } else if (state.mode === 'CREATIVE') {
          prompt = `Write a creative ${goal.toLowerCase()} for ${aud.toLowerCase()}.\n\nStyle requirements:\n- Tone: ${tone.toLowerCase()}\n- Format: ${fmt.toLowerCase()}${constraints && constraints !== 'No constraints needed' ? '\n- Constraints: ' + constraints.toLowerCase() : ''}\n${depth.includes('chain') ? '\nThink step-by-step before writing. First outline the structure, then execute.' : ''}\nEnsure the output is engaging, original, and directly serves the audience.`;
        } else {
          prompt = `${goal.charAt(0).toUpperCase() + goal.slice(1).toLowerCase()} for ${aud.toLowerCase()}.\n\nOutput requirements:\n- Format: ${fmt.toLowerCase()}\n- Tone: ${tone.toLowerCase()}${constraints && constraints !== 'No constraints needed' ? '\n- Constraints: ' + constraints.toLowerCase() : ''}\n${depth.includes('chain') ? '\nReason step-by-step before providing your final answer.' : ''}\n${examples.includes('No') ? '' : 'Include ' + (examples.includes('3+') ? '3+ worked' : 'one') + ' example to demonstrate.\n'}\nBe precise, accurate, and ensure all claims are well-supported.`;
        }
        scores = scoreLocal(prompt, state.mode);
        issues = issuesLocal(prompt, state.mode);
      }
      update({ prompt, scores, issues, recs: [], wizardStep: 0, wizardAnswers: {}, view: 'ANALYZE', loading: false });
      toast('Prompt generated successfully', 'ok');
    } catch (e: unknown) {
      toast('Wizard error: ' + (e as Error).message, 'err');
      update({ loading: false });
    }
  };

  return (
    <div>
      <ViewHeader
        marker="/V.06 [X 62.4, Y 44.9]"
        title="Adaptive Wizard"
        subtitle="Answer seven guided questions to auto-generate an optimized prompt from your intent."
      />

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span className="d-coord">STEP {state.wizardStep + 1} OF {qs.length}</span>
          <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: 'var(--d-ink-mute)' }}>
            {Math.round((state.wizardStep + 1) / qs.length * 100)}% complete
          </span>
        </div>
        <div style={{ width: '100%', height: 4, background: 'var(--d-line)', overflow: 'hidden', marginBottom: 12 }}>
          <div ref={fillRef} className="bar-fill" style={{ width: 0, height: '100%', background: 'var(--d-accent)' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {qs.map((_, i) => (
            <span key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i < state.wizardStep ? 'var(--d-accent)' : i === state.wizardStep ? 'var(--d-ink)' : 'transparent',
              border: '1px solid ' + (i <= state.wizardStep ? 'var(--d-accent)' : 'var(--d-line)'),
            }} />
          ))}
        </div>
      </div>

      <div style={{ padding: 28, border: '1px solid var(--d-line)', background: 'var(--d-bg-alt)', marginBottom: 24 }}>
        <div className="d-coord" style={{ marginBottom: 10 }}>QUESTION {state.wizardStep + 1}</div>
        <div className="font-display" style={{ fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 6 }}>{q.q}</div>
        <span style={{ fontSize: 13, color: 'var(--d-ink-mute)' }}>Select an option or enter a custom answer below.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {q.opts.map(opt => (
          <button
            key={opt}
            onClick={() => advance(q.id, opt)}
            style={{
              padding: '14px 18px',
              border: '1px solid var(--d-line)',
              background: 'var(--d-bg)',
              color: 'var(--d-ink)',
              cursor: 'pointer',
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: 14,
              lineHeight: 1.4,
              textAlign: 'left',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--d-accent)'; el.style.background = 'var(--d-bg-alt)'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--d-line)'; el.style.background = 'var(--d-bg)'; }}
          >
            {opt}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) advance(q.id, custom.trim()); }}
          placeholder="Custom answer..."
          style={{
            flex: 1,
            background: 'var(--d-bg-alt)',
            color: 'var(--d-ink)',
            border: '1px solid var(--d-line)',
            padding: '10px 14px',
            fontSize: 14,
            fontFamily: 'var(--font-manrope), sans-serif',
            outline: 'none',
          }}
        />
        <button
          onClick={() => { if (custom.trim()) advance(q.id, custom.trim()); }}
          className="d-cta"
          style={{ border: 0 }}
        >
          Enter
        </button>
        {state.wizardStep > 0 && (
          <button
            onClick={() => update({ wizardStep: state.wizardStep - 1 })}
            className="d-cta-ghost"
          >
            ← Back
          </button>
        )}
      </div>

      {Object.keys(state.wizardAnswers).length > 0 && (
        <div style={{ padding: 20, border: '1px solid var(--d-line)', background: 'var(--d-bg-alt)' }}>
          <div className="d-coord" style={{ marginBottom: 10 }}>COLLECTED ANSWERS</div>
          {Object.keys(state.wizardAnswers).map(k => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, padding: '6px 0', fontSize: 13 }}>
              <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: 'var(--d-ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {k}
              </span>
              <span style={{ color: 'var(--d-ink)' }}>{state.wizardAnswers[k]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
