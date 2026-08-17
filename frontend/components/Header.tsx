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
  const warn = t > (m?.context || 1) * 0.8;

  const Cell = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--d-ink-mute)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: accent ? 'var(--d-accent)' : 'var(--d-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ borderTop: '1px solid var(--d-line)', borderBottom: '1px solid var(--d-line)', background: 'var(--d-bg-alt)', padding: '12px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 32, alignItems: 'center' }}>
      <Cell label="Mode" value={state.mode} />
      <Cell label="Model" value={m?.name || '·'} accent />
      <Cell label="Tokens" value={`${t} / ${m ? fmtN(m.context) : '·'} (${pct}%)`} />
      <Cell label="Context" value={warn ? 'NEAR LIMIT' : 'HEADROOM OK'} accent={warn} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: state.apiOnline ? 'var(--d-accent)' : 'var(--d-line)' }} />
        <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--d-ink-soft)' }}>
          {state.apiOnline ? 'API Live' : 'Local Fallback'}
        </span>
      </div>
    </div>
  );
}
