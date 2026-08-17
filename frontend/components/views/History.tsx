'use client';

import type { AppState, ToastType } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { scoreLocal, issuesLocal } from '@/lib/scoring';
import ViewHeader from './ViewHeader';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  toast: (msg: string, type?: ToastType) => void;
}

const TINT = (s: number) => s >= 75 ? '#5b8f3d' : s >= 50 ? '#c9a227' : '#c8342a';

export default function History({ state, update, toast }: Props) {
  return (
    <div>
      <ViewHeader
        marker="/V.07 [X 74.8, Y 51.3]"
        title="Session History"
        subtitle="Recent analysis sessions. Click Restore to reload prompt, mode, and model. API-persisted where available."
      />

      {state.apiOnline && (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="d-coord">API-PERSISTED · SURVIVES RELOAD</span>
          <button
            onClick={async () => {
              try { const h = await apiFetch<typeof state.history>('/history'); update({ history: h }); toast('History refreshed', 'ok'); }
              catch { toast('Refresh failed', 'err'); }
            }}
            className="d-cta-ghost"
            style={{ padding: '6px 14px', fontSize: 10 }}
          >
            ↻ Refresh
          </button>
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
            if (state.apiOnline) { try { await apiFetch('/history', 'DELETE'); } catch { } }
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
