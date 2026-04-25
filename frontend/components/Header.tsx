'use client';

import type { AppState } from '@/lib/types';
import { fmtN, tok } from '@/lib/utils';

interface Props {
  state: AppState;
}

export default function Header({ state }: Props) {
  const m = state.models.find(x => x.id === state.model) || state.models[1];
  const t = tok(state.prompt);
  const pct = m ? (t / m.context * 100).toFixed(1) : '0.0';
  const tc = t > (m?.context || 1) * 0.8 ? '#ff4444' : t > (m?.context || 1) * 0.5 ? '#ffcc00' : '#00cc44';

  return (
    <div style={{ background: '#010e01', borderBottom: '1px solid #003311', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, height: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, letterSpacing: 1.5 }}>◈ Prompt_Studio</span>
        <span style={{ color: '#004411', fontSize: 10, letterSpacing: '.5px' }}>v1.0</span>
        <span style={{ color: '#003311', fontSize: 10 }}>│</span>
        <span className="glow-y" style={{ color: '#ffcc00', fontSize: 10, letterSpacing: '.3px' }}>MODE: {state.mode}</span>
        <span style={{ color: '#003311', fontSize: 10 }}>│</span>
        <span className="glow-c" style={{ color: '#00ccff', fontSize: 10, letterSpacing: '.3px' }}>MODEL: {m?.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: tc, fontSize: 10 }}>TOKENS: {t} / {m ? fmtN(m.context) : '—'} ({pct}%)</span>
        <span style={{ color: '#003311', fontSize: 10 }}>│</span>
        <span style={{ color: state.apiOnline ? '#00cc44' : '#004411', fontSize: 10, letterSpacing: '.3px' }}>
          API: {state.apiOnline ? '● LIVE' : '○ LOCAL'}
        </span>
      </div>
    </div>
  );
}
