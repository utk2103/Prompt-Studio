'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppState, ToastType } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { scoreLocal, issuesLocal, normalizeIssues } from '@/lib/scoring';

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
      <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
        <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► ADAPTIVE WIZARD</div>
        <span style={{ color: '#007722', fontSize: 9 }}>Answer guided questions to auto-generate an optimized prompt</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ color: '#007722', fontSize: 10, display: 'block', marginBottom: 4 }}>PROGRESS: Step {state.wizardStep + 1} of {qs.length}</span>
        <div style={{ width: '100%', height: 3, background: '#004411', overflow: 'hidden', marginBottom: 6 }}>
          <div ref={fillRef} className="bar-fill" style={{ width: 0, height: '100%', background: '#00cc44' }} />
        </div>
        <div>
          {qs.map((_, i) => (
            <span key={i} style={{ color: i < state.wizardStep ? '#33ff66' : i === state.wizardStep ? '#00ccff' : '#004411', fontSize: 10 }}>
              {i < state.wizardStep ? '●' : i === state.wizardStep ? '◈' : '○'}{i < qs.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 12px', border: '1px solid #00cc44', background: '#010f01', marginBottom: 12 }}>
        <span style={{ color: '#004411', fontSize: 9, display: 'block', marginBottom: 4, letterSpacing: '.5px' }}>QUESTION {state.wizardStep + 1} OF {qs.length}</span>
        <div style={{ color: '#e8ffe8', fontSize: 12, fontWeight: 600, marginBottom: 3, lineHeight: '1.4' }}>{q.q}</div>
        <span style={{ color: '#007722', fontSize: 9 }}>Select an option or enter a custom answer below</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        {q.opts.map(opt => (
          <div
            key={opt}
            onClick={() => advance(q.id, opt)}
            style={{ padding: '7px 10px', border: '1px solid #003311', cursor: 'pointer', fontSize: 10, color: '#00cc44', background: '#010f01', letterSpacing: '.2px', lineHeight: '1.4', transition: 'all .1s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = '#004411'; el.style.borderColor = '#00cc44'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = '#010f01'; el.style.borderColor = '#003311'; }}
          >
            {opt}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) advance(q.id, custom.trim()); }}
          placeholder="Custom answer..."
          style={{ flex: 1, background: '#050e05', color: '#e8ffe8', border: '1px solid #003311', padding: '5px 8px', fontSize: 10 }}
        />
        <button
          onClick={() => { if (custom.trim()) advance(q.id, custom.trim()); }}
          style={{ background: 'transparent', color: '#00cc44', border: '1px solid #00cc44', padding: '3px 10px', fontSize: 11 }}
        >[ENTER]</button>
        {state.wizardStep > 0 && (
          <button
            onClick={() => update({ wizardStep: state.wizardStep - 1 })}
            style={{ background: 'transparent', color: '#007722', border: '1px solid #007722', padding: '3px 10px', fontSize: 11 }}
          >[← BACK]</button>
        )}
      </div>

      {Object.keys(state.wizardAnswers).length > 0 && (
        <div style={{ padding: '8px 10px', border: '1px solid #004411', background: '#010f01' }}>
          <span style={{ color: '#007722', fontSize: 9, display: 'block', marginBottom: 4, letterSpacing: '.3px' }}>COLLECTED ANSWERS:</span>
          {Object.keys(state.wizardAnswers).map(k => (
            <div key={k} style={{ fontSize: 9, marginBottom: 2 }}>
              <span style={{ color: '#004411' }}>{k.toUpperCase()}:  </span>
              <span style={{ color: '#00cc44' }}>{state.wizardAnswers[k]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
