'use client';

import { useState } from 'react';
import type { AppState, ToastType } from '@/lib/types';
import { apiFetch, memoryHeader } from '@/lib/api';
import { scoreLocal, issuesLocal } from '@/lib/scoring';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  toast: (msg: string, type?: ToastType) => void;
  onRestore: (prompt: string) => void;
}

interface Hit {
  id?: string;
  content: string;
  score?: number;
}

const TINT = (v: number) => (v >= 75 ? '#5b8f3d' : v >= 50 ? '#c9a227' : '#c8342a');

export default function HistoryRail({ state, update, toast, onRestore }: Props) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);

  const setBackend = (b: 'local' | 'supermemory') => {
    if (b === 'supermemory' && !state.supermemoryAvailable) {
      toast('Supermemory unavailable — set SUPERMEMORY_API_KEY on the backend.', 'warn');
      return;
    }
    update({ memoryBackend: b });
    setHits([]);
  };

  const runSearch = async () => {
    if (!query.trim() || state.memoryBackend !== 'supermemory') return;
    setBusy(true);
    try {
      const r = await apiFetch<{ results: Hit[] }>(`/history/search?q=${encodeURIComponent(query)}&limit=8`, 'GET', undefined, memoryHeader('supermemory'));
      setHits(r.results);
      if (!r.results.length) toast('No matches yet.', 'info');
    } catch (e) {
      toast('Search failed: ' + (e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside style={{ width: 260, borderRight: '1px solid var(--d-line)', background: 'var(--d-bg-alt)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--d-line)' }}>
        <div className="d-coord" style={{ marginBottom: 8 }}>/MEMORY</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['local', 'supermemory'] as const).map(b => {
            const active = state.memoryBackend === b;
            const disabled = b === 'supermemory' && !state.supermemoryAvailable;
            return (
              <button key={b} onClick={() => setBackend(b)} disabled={disabled} title={disabled ? 'Backend key missing' : ''}
                style={{
                  flex: 1, padding: '5px 8px', border: '1px solid ' + (active ? 'var(--d-accent)' : 'var(--d-line)'),
                  background: active ? 'var(--d-accent)' : 'transparent', color: active ? '#fff' : disabled ? 'var(--d-ink-mute)' : 'var(--d-ink)',
                  fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
                }}>
                {b === 'supermemory' ? 'super' : 'local'}
              </button>
            );
          })}
        </div>
      </div>

      {state.memoryBackend === 'supermemory' && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--d-line)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
              placeholder="Recall…"
              style={{
                flex: 1, background: 'var(--d-bg)', color: 'var(--d-ink)',
                border: '1px solid var(--d-line)', padding: '6px 8px',
                fontSize: 12, fontFamily: 'var(--font-manrope), sans-serif', outline: 'none',
              }}
            />
            <button onClick={runSearch} disabled={busy}
              style={{ padding: '6px 10px', background: 'var(--d-accent)', color: '#fff', border: 0, cursor: 'pointer',
                fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {busy ? '…' : '↵'}
            </button>
          </div>
          {hits.length > 0 && (
            <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--d-line)' }}>
              {hits.map((h, i) => (
                <button
                  key={h.id || i}
                  onClick={() => onRestore(h.content.replace(/^Prompt:\s*/i, '').split('\n')[0])}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 10px',
                    background: 'transparent', border: 0, borderTop: i === 0 ? 0 : '1px solid var(--d-line)',
                    color: 'var(--d-ink)', cursor: 'pointer', fontSize: 12, lineHeight: 1.4,
                    fontFamily: 'var(--font-manrope), sans-serif',
                  }}
                  title={h.content}
                >
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.content.slice(0, 60)}
                  </span>
                  {typeof h.score === 'number' && (
                    <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 9, color: 'var(--d-ink-mute)', letterSpacing: '0.14em' }}>
                      {h.score.toFixed(3)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        <div className="d-coord" style={{ marginBottom: 8 }}>/HISTORY</div>
        {!state.history.length && (
          <div style={{ fontSize: 12, color: 'var(--d-ink-mute)', padding: '10px 0' }}>
            No sessions yet.
          </div>
        )}
        {state.history.map((h_, i) => {
          const ts = new Date(h_.ts || Date.now());
          const tStr = String(ts.getHours()).padStart(2, '0') + ':' + String(ts.getMinutes()).padStart(2, '0');
          const sc = h_.score;
          return (
            <button
              key={h_.id || i}
              onClick={() => {
                const prompt = h_.prompt_preview || h_.prompt || '';
                const mode = (h_.mode as AppState['mode']) || state.mode;
                const model = h_.model_id || h_.model || state.model;
                update({ mode, model, scores: scoreLocal(prompt, mode), issues: issuesLocal(prompt, mode) });
                onRestore(prompt);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 12px', marginBottom: 6, border: '1px solid var(--d-line)',
                background: 'var(--d-bg)', color: 'var(--d-ink)', cursor: 'pointer',
                fontFamily: 'var(--font-manrope), sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--d-accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--d-line)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, color: 'var(--d-ink-mute)', letterSpacing: '0.14em', marginBottom: 4 }}>
                <span>{tStr} · {h_.mode || '·'}</span>
                {sc != null && <span style={{ color: TINT(sc), fontWeight: 600 }}>{sc}</span>}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {h_.prompt_preview || h_.prompt || '·'}
              </div>
            </button>
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
            margin: 12, padding: '6px 10px', background: 'transparent', color: '#c8342a',
            border: '1px solid #c8342a', cursor: 'pointer',
            fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
          Clear
        </button>
      )}
    </aside>
  );
}
