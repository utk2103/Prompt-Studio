'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppState, ToastType, ScoreResult, Issue } from '@/lib/types';
import { apiFetch, memoryHeader, minDelay } from '@/lib/api';
import { scoreLocal, issuesLocal, normalizeIssues } from '@/lib/scoring';
import Message, { ChatMessage } from './Message';
import Composer from './Composer';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  toast: (msg: string, type?: ToastType) => void;
}

let uid = 0;
const mkId = () => `m${Date.now()}${uid++}`;

function synthesize(mode: string, ans: Record<string, string>): string {
  const goal = ans.goal || 'task', aud = ans.audience || 'users', fmt = ans.output_format || 'clear format', tone = ans.tone || 'professional';
  const constraints = ans.constraints || '', depth = ans.context_depth || '', examples = ans.examples || '';
  if (mode === 'SYSTEM') {
    return `You are an expert AI assistant specialized in ${goal.toLowerCase()}.\n\nYour role is to assist ${aud.toLowerCase()} with accurate, well-structured responses.\n\nGuidelines:\n- Maintain a ${tone.toLowerCase()} tone\n- Format responses as ${fmt.toLowerCase()}${constraints && constraints !== 'No constraints needed' ? '\n- Strictly enforce: ' + constraints.toLowerCase() : ''}\n- Prioritize clarity and accuracy`;
  }
  if (mode === 'CREATIVE') {
    return `Write a creative ${goal.toLowerCase()} for ${aud.toLowerCase()}.\n\nStyle requirements:\n- Tone: ${tone.toLowerCase()}\n- Format: ${fmt.toLowerCase()}${constraints && constraints !== 'No constraints needed' ? '\n- Constraints: ' + constraints.toLowerCase() : ''}\n${depth.includes('chain') ? '\nThink step-by-step before writing. First outline the structure, then execute.' : ''}\nEnsure the output is engaging, original, and directly serves the audience.`;
  }
  return `${goal.charAt(0).toUpperCase() + goal.slice(1).toLowerCase()} for ${aud.toLowerCase()}.\n\nOutput requirements:\n- Format: ${fmt.toLowerCase()}\n- Tone: ${tone.toLowerCase()}${constraints && constraints !== 'No constraints needed' ? '\n- Constraints: ' + constraints.toLowerCase() : ''}\n${depth.includes('chain') ? '\nReason step-by-step before providing your final answer.' : ''}\n${examples.includes('No') ? '' : 'Include ' + (examples.includes('3+') ? '3+ worked' : 'one') + ' example to demonstrate.\n'}\nBe precise, accurate, and ensure all claims are well-supported.`;
}

export default function ChatSurface({ state, update, toast }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [wizardActive, setWizardActive] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAns, setWizardAns] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  // avoid double-mounting wizard question in React strict mode
  const wizardPostedRef = useRef<number>(-1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const push = (m: Omit<ChatMessage, 'id' | 'ts'>) =>
    setMessages(ms => [...ms, { ...m, id: mkId(), ts: Date.now() }]);

  // ── analyze on send ─────────────────────────────────────
  const runAnalyze = async (prompt: string): Promise<{ scores: ScoreResult | null; issues: Issue[]; recs: string[] }> => {
    if (state.apiOnline) {
      const [data, sc] = await Promise.all([
        apiFetch<{ scores: ScoreResult | null; issues: { type: string; message: string }[] }>('/analyze', 'POST', { prompt, mode: state.mode, model_id: state.model }),
        apiFetch<{ recommendations: string[] }>('/score', 'POST', { prompt, mode: state.mode }).catch(() => ({ recommendations: [] })),
      ]);
      return { scores: data.scores, issues: normalizeIssues(data.issues), recs: sc.recommendations || [] };
    }
    return { scores: scoreLocal(prompt, state.mode), issues: issuesLocal(prompt, state.mode), recs: [] };
  };

  const persistHistory = async (prompt: string, scores: ScoreResult | null) => {
    const entry = {
      prompt_preview: prompt.slice(0, 80) + (prompt.length > 80 ? '…' : ''),
      mode: state.mode, model_id: state.model,
      score: scores?.overall, ts: Date.now(),
    };
    if (state.apiOnline) {
      try {
        const saved = await apiFetch<typeof entry>('/history', 'POST', entry, memoryHeader(state.memoryBackend));
        update({ history: [saved, ...state.history.slice(0, 19)] });
      } catch { }
    } else {
      update({ history: [{ ...entry, id: Math.random().toString(36).slice(2, 8) }, ...state.history.slice(0, 19)] });
    }
  };

  const send = async (text: string) => {
    push({ role: 'user', text });
    setBusy(true);
    update({ loading: true, loadingLabel: 'Analyzing' });
    try {
      const wait = minDelay();
      const { scores, issues, recs } = await runAnalyze(text);
      await wait;
      const reply =
        (scores ? `Overall ${scores.overall}/100 (${scores.grade} — ${scores.label}).\n` : '') +
        (issues.length ? `\nDiagnostics:\n${issues.map(i => `  [${i.t}] ${i.m}`).join('\n')}\n` : '') +
        (recs.length ? `\nRecommendations:\n${recs.map(r => `  • ${r}`).join('\n')}` : '') ||
        'Analyzed. Open a chip for detail.';
      push({ role: 'assistant', text: reply.trim(), scores, issues, model_id: state.model, mode: state.mode });
      update({ prompt: text, scores, issues, recs });
      persistHistory(text, scores);
    } catch (e) {
      toast('Analyze failed: ' + (e as Error).message, 'err');
    } finally {
      setBusy(false);
      update({ loading: false });
    }
  };

  const optimize = async () => {
    if (!state.prompt.trim()) return;
    setBusy(true);
    update({ loading: true, loadingLabel: 'Optimizing' });
    try {
      const wait = minDelay();
      let out = state.prompt;
      let note = '';
      if (state.apiOnline) {
        const r = await apiFetch<{ optimized_prompt: string; score_delta: number; changes_applied: string[] }>('/optimize', 'POST', { prompt: state.prompt, mode: state.mode });
        out = r.optimized_prompt;
        note = `Optimized. Δ ${r.score_delta > 0 ? '+' : ''}${r.score_delta} pts, ${r.changes_applied.length} change(s).`;
      } else {
        note = 'Optimized (local fallback).';
      }
      await wait;
      const scores = scoreLocal(out, state.mode);
      const issues = issuesLocal(out, state.mode);
      push({ role: 'assistant', text: `${note}\n\n---\n${out}`, scores, issues, model_id: state.model, mode: state.mode });
      update({ prompt: out, scores, issues });
    } catch (e) {
      toast('Optimize failed: ' + (e as Error).message, 'err');
    } finally {
      setBusy(false); update({ loading: false });
    }
  };

  const compress = async () => {
    if (!state.prompt.trim()) return;
    setBusy(true);
    update({ loading: true, loadingLabel: 'Compressing' });
    try {
      const wait = minDelay();
      let out = state.prompt;
      let note = 'Compressed (local fallback).';
      if (state.apiOnline) {
        const r = await apiFetch<{ compressed: string; tokens_saved: number; savings_pct: number }>('/prompt/compress', 'POST', { prompt: state.prompt, mode: state.mode });
        out = r.compressed;
        note = `Compressed. −${r.tokens_saved} tokens (${r.savings_pct}% smaller).`;
      }
      await wait;
      const scores = scoreLocal(out, state.mode);
      push({ role: 'assistant', text: `${note}\n\n---\n${out}`, scores, model_id: state.model, mode: state.mode });
      update({ prompt: out, scores, issues: issuesLocal(out, state.mode) });
    } catch (e) {
      toast('Compress failed: ' + (e as Error).message, 'err');
    } finally {
      setBusy(false); update({ loading: false });
    }
  };

  // ── in-chat wizard flow ─────────────────────────────────
  const startWizard = () => {
    if (wizardActive) return;
    setWizardActive(true);
    setWizardStep(0);
    setWizardAns({});
    wizardPostedRef.current = -1;
  };

  const askNext = (step: number, ans: Record<string, string>) => {
    if (wizardPostedRef.current === step) return;
    wizardPostedRef.current = step;
    const qs = state.wizardQ;
    const q = qs[step];
    push({
      role: 'wizard',
      text: `Q${step + 1}/${qs.length} — ${q.q}`,
      wizardOptions: q.opts,
      wizardQid: q.id,
      onWizardPick: (opt) => pickWizard(step, opt, ans),
    });
  };

  const pickWizard = async (step: number, opt: string, priorAns: Record<string, string>) => {
    const qs = state.wizardQ;
    const q = qs[step];
    const ans = { ...priorAns, [q.id]: opt };
    push({ role: 'user', text: opt });

    if (step < qs.length - 1) {
      setWizardStep(step + 1);
      setWizardAns(ans);
      askNext(step + 1, ans);
      return;
    }

    // final: synthesize the prompt
    setBusy(true);
    update({ loading: true, loadingLabel: 'Generating' });
    try {
      const wait = minDelay();
      let prompt = '';
      let scores: ScoreResult | null = null;
      let issues: Issue[] = [];
      if (state.apiOnline) {
        const r = await apiFetch<{ generated_prompt: string; scores: ScoreResult | null; issues: { type: string; message: string }[] }>('/wizard/generate', 'POST', { answers: ans, mode: state.mode });
        prompt = r.generated_prompt;
        scores = r.scores;
        issues = normalizeIssues(r.issues || []);
      } else {
        prompt = synthesize(state.mode, ans);
        scores = scoreLocal(prompt, state.mode);
        issues = issuesLocal(prompt, state.mode);
      }
      await wait;
      push({ role: 'assistant', text: `Prompt built:\n\n---\n${prompt}`, scores, issues, model_id: state.model, mode: state.mode });
      update({ prompt, scores, issues, recs: [] });
      persistHistory(prompt, scores);
    } catch (e) {
      toast('Wizard failed: ' + (e as Error).message, 'err');
    } finally {
      setBusy(false); update({ loading: false });
      setWizardActive(false);
      setWizardAns({});
      setWizardStep(0);
    }
  };

  useEffect(() => {
    if (wizardActive && state.wizardQ.length > 0) askNext(wizardStep, wizardAns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardActive]);

  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--d-ink-mute)', maxWidth: 520 }}>
            <div className="font-display" style={{ fontSize: 32, letterSpacing: '-0.02em', color: 'var(--d-ink)', marginBottom: 10 }}>
              Prompt Studio
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              Write a prompt below to analyze it — or tap ✧ to build one with the guided wizard.
              Score, tokens, and model fit appear as chips you can drill into.
            </div>
          </div>
        )}
        {messages.map(m => <Message key={m.id} msg={m} state={state} update={update} />)}
        {busy && (
          <div style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: 'var(--d-ink-mute)', letterSpacing: '0.14em' }}>
            {(state.loadingLabel || 'WORKING')}…
          </div>
        )}
      </div>
      <Composer
        state={state}
        update={update}
        onSend={send}
        onOptimize={optimize}
        onCompress={compress}
        onWizard={startWizard}
        busy={busy}
      />
    </section>
  );
}
