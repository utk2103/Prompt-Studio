'use client';

import { useState } from 'react';
import type { AppState, ToastType } from '@/lib/types';
import { apiFetch, memoryHeader } from '@/lib/api';
import { scoreLocal, issuesLocal } from '@/lib/scoring';
import ViewHeader from './ViewHeader';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  toast: (msg: string, type?: ToastType) => void;
}

interface SearchHit {
  id?: string;
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

const TINT = (s: number) => s >= 75 ? '#5b8f3d' : s >= 50 ? '#c9a227' : '#c8342a';

export default function History({ state, update, toast }: Props) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const setBackend = (b: 'local' | 'supermemory') => {
    if (b === 'supermemory' && !state.supermemoryAvailable) {
      toast('Supermemory unavailable — set SUPERMEMORY_API_KEY on the backend.', 'warn');
      return;
    }
    update({ memoryBackend: b });
    toast(`Memory backend → ${b}`, 'ok');
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    if (state.memoryBackend !== 'supermemory') {
      toast('Semantic search requires the supermemory backend.', 'warn');
      return;
    }
    setSearching(true);
    try {
      const r = await apiFetch<{ supported: boolean; results: SearchHit[] }>(
        `/history/search?q=${encodeURIComponent(query)}&limit=8`,
        'GET', undefined, memoryHeader('supermemory'),
      );
      setHits(r.results);
      if (!r.results.length) toast('No matches yet — try after storing a few prompts.', 'info');
    } catch (e) {
      toast('Search failed: ' + (e as Error).message, 'err');
    } finally {
      setSearching(false);
    }
  };

  const backendPill = (b: 'local' | 'supermemory') => {
    const active = state.memoryBackend === b;
    const disabled = b === 'supermemory' && !state.supermemoryAvailable;
    return (
      <button
        key={b}
        onClick={() => setBackend(b)}
        disabled={disabled}
        title={disabled ? 'Set SUPERMEMORY_API_KEY on backend to enable' : ''}
        style={{
          padding: '6px 14px',
          background: active ? 'var(--d-accent)' : 'transparent',
          color: active ? '#fff' : disabled ? 'var(--d-ink-mute)' : 'var(--d-ink)',
          border: '1px solid ' + (active ? 'var(--d-accent)' : 'var(--d-line)'),
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        {b}
      </button>
    );
  };

  return (
    <div>
      <ViewHeader
        marker="/V.07 [X 74.8, Y 51.3]"
        title="Session History"
        subtitle="Recent analysis sessions. Toggle between local (in-process) and Supermemory (persistent + semantic search)."
      />

      <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <span className="d-coord">/MEMORY BACKEND</span>
        {backendPill('local')}
        {backendPill('supermemory')}
        {state.apiOnline && (
          <button
            onClick={async () => {
              try {
                const h = await apiFetch<typeof state.history>('/history', 'GET', undefined, memoryHeader(state.memoryBackend));
                update({ history: h });
                toast('History refreshed', 'ok');
              } catch { toast('Refresh failed', 'err'); }
            }}
            className="d-cta-ghost"
            style={{ padding: '6px 14px', fontSize: 10, marginLeft: 'auto' }}
          >
            ↻ Refresh
          </button>
        )}
      </div>

      {state.memoryBackend === 'supermemory' && (
        <div style={{ marginBottom: 24, padding: 18, border: '1px solid var(--d-line)', background: 'var(--d-bg-alt)' }}>
          <div className="d-coord" style={{ marginBottom: 10 }}>/SEMANTIC RECALL</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
              placeholder="Ask: what did I try for email validation prompts?"
              style={{
                flex: 1, background: 'var(--d-bg)', color: 'var(--d-ink)',
                border: '1px solid var(--d-line)', padding: '10px 14px',
                fontSize: 14, fontFamily: 'var(--font-manrope), sans-serif', outline: 'none',
              }}
            />
            <button onClick={runSearch} className="d-cta" style={{ border: 0 }} disabled={searching}>
              {searching ? '…' : 'Recall'}
            </button>
          </div>
          {hits.length > 0 && (
            <div style={{ marginTop: 14, border: '1px solid var(--d-line)' }}>
              {hits.map((h, i) => (
                <div key={h.id || i} style={{ padding: '12px 16px', borderTop: i === 0 ? 0 : '1px solid var(--d-line)' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10.5,
                    letterSpacing: '0.12em', color: 'var(--d-ink-mute)', marginBottom: 6,
                  }}>
                    <span>#{i + 1}</span>
                    {typeof h.score === 'number' && <span>score {h.score.toFixed(3)}</span>}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--d-ink)', whiteSpace: 'pre-wrap' }}>
                    {h.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!state.history.length && (
        <div style={{ fontSize: 14, color: 'var(--d-ink-mute)', padding: '40px 0', textAlign: 'center' }}>
          No history yet. Analyze a prompt to populate.
        </div>
      )}

      <div style={{ border: state.history.length ? '1px solid var(--d-line)' : 0 }}>
        {state.history.map((h_, i) => {
          const ts = new Date(h_.ts || Date.now());
          const tStr = ts.getHours().toString().padStart(2, '0') + ':' + ts.getMinutes().toString().padStart(2, '0') + ':' + ts.getSeconds().toString().padStart(2, '0');
          const sc = h_.score;
          const sc_ = sc != null ? TINT(sc) : 'var(--d-ink-mute)';
          return (
            <div key={h_.id || i} style={{ padding: '18px 20px', borderTop: i === 0 ? 0 : '1px solid var(--d-line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: 'var(--d-ink-mute)', letterSpacing: '0.12em' }}>
                  [{String(i + 1).padStart(2, '0')}] · {tStr} · {h_.mode || '·'} · {h_.model_id || h_.model || '·'}
                </span>
                {sc != null && (
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 14, color: sc_, fontWeight: 600 }}>
                    {sc}/100
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, color: 'var(--d-ink)', marginBottom: 10, lineHeight: 1.4 }}>
                {h_.prompt_preview || h_.prompt || '·'}
              </div>
              <button
                onClick={() => {
                  const prompt = h_.prompt_preview || h_.prompt || state.prompt;
                  const mode = (h_.mode as AppState['mode']) || state.mode;
                  const model = h_.model_id || h_.model || state.model;
                  update({ prompt, mode, model, scores: scoreLocal(prompt, mode), issues: issuesLocal(prompt, mode), view: 'ANALYZE' });
                  toast('Session restored', 'ok');
                }}
                className="d-cta-ghost"
                style={{ padding: '6px 14px', fontSize: 10 }}
              >
                Restore
              </button>
            </div>
          );
        })}
      </div>

      {state.history.length > 0 && (
        <button
          onClick={async () => {
            if (state.apiOnline) {
              try { await apiFetch('/history', 'DELETE', undefined, memoryHeader(state.memoryBackend)); } catch { }
            }
            update({ history: [] });
            toast('History cleared', 'warn');
          }}
          style={{
            marginTop: 20,
            padding: '9px 18px',
            background: 'transparent',
            color: '#c8342a',
            border: '1px solid #c8342a',
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Clear History
        </button>
      )}
    </div>
  );
}
