'use client';

import type { AppState, ToastType } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { scoreLocal, issuesLocal } from '@/lib/scoring';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  toast: (msg: string, type?: ToastType) => void;
}

export default function History({ state, update, toast }: Props) {
  return (
    <div>
      <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
        <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► SESSION HISTORY</div>
        <span style={{ color: '#007722', fontSize: 9 }}>Recent analysis sessions · click to restore · API-persisted</span>
      </div>

      {state.apiOnline && (
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#007722', fontSize: 9 }}>API-persisted history · survives page reload</span>
          <button
            onClick={async () => {
              try { const h = await apiFetch<typeof state.history>('/history'); update({ history: h }); toast('History refreshed', 'ok'); }
              catch { toast('Refresh failed', 'err'); }
            }}
            style={{ background: 'transparent', color: '#00ccff', border: '1px solid #00ccff', padding: '3px 10px', fontSize: 11 }}
          >[↻ REFRESH]</button>
        </div>
      )}

      {!state.history.length && (
        <div style={{ color: '#007722', fontSize: 11, padding: '16px 0' }}>── No history yet. Analyze a prompt to populate ──</div>
      )}

      {state.history.map((h_, i) => {
        const ts = new Date(h_.ts || Date.now());
        const tStr = ts.getHours().toString().padStart(2, '0') + ':' + ts.getMinutes().toString().padStart(2, '0') + ':' + ts.getSeconds().toString().padStart(2, '0');
        const sc = h_.score;
        const sc_ = sc != null ? (sc >= 75 ? '#33ff66' : sc >= 50 ? '#ffcc00' : '#ff4444') : '#007722';
        return (
          <div
            key={h_.id || i}
            style={{ padding: '8px 10px', border: '1px solid #003311', marginBottom: 6, cursor: 'pointer', background: '#010f01', transition: 'border-color .1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#007722'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#003311'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: '#007722', fontSize: 9, letterSpacing: '.2px' }}>
                [{String(i + 1).padStart(2, '0')}]  {tStr}  {h_.mode || '—'}  {h_.model_id || h_.model || '—'}
              </span>
              {sc != null && <span style={{ color: sc_, fontSize: 11, fontWeight: 700 }}>{sc}/100</span>}
            </div>
            <div style={{ color: '#e8ffe8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400, letterSpacing: '.15px' }}>
              {h_.prompt_preview || h_.prompt || '—'}
            </div>
            <button
              onClick={() => {
                const prompt = h_.prompt_preview || h_.prompt || state.prompt;
                const mode = (h_.mode as AppState['mode']) || state.mode;
                const model = h_.model_id || h_.model || state.model;
                update({ prompt, mode, model, scores: scoreLocal(prompt, mode), issues: issuesLocal(prompt, mode), view: 'ANALYZE' });
                toast('Session restored', 'ok');
              }}
              style={{ marginTop: 5, background: 'transparent', color: '#00cc44', border: '1px solid #00cc44', padding: '3px 10px', fontSize: 11 }}
            >[RESTORE]</button>
          </div>
        );
      })}

      {state.history.length > 0 && (
        <button
          onClick={async () => {
            if (state.apiOnline) { try { await apiFetch('/history', 'DELETE'); } catch { } }
            update({ history: [] });
            toast('History cleared', 'warn');
          }}
          style={{ marginTop: 8, background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', padding: '3px 10px', fontSize: 11 }}
        >[CLEAR HISTORY]</button>
      )}
    </div>
  );
}
