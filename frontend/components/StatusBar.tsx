'use client';

import type { AppState } from '@/lib/types';

interface Props {
  state: AppState;
}

export default function StatusBar({ state }: Props) {
  const errs = state.issues.filter(x => x.t === 'ERR' || x.t === 'WARN').length;
  const infos = state.issues.filter(x => x.t === 'INFO').length;

  const Cell = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--d-ink-soft)' }}>
      {children}
    </span>
  );

  return (
    <div style={{ borderTop: '1px solid var(--d-line)', background: 'var(--d-bg)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <Cell>Status: {state.prompt ? 'Prompt loaded' : 'Awaiting input'}</Cell>
        <Cell>Score: {state.scores ? `${state.scores.overall}/100` : 'N/A'}</Cell>
        <Cell>Issues: {errs} warn · {infos} info</Cell>
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <Cell>Hist: {state.history.length}</Cell>
        <Cell>{state.apiOnline ? 'API Live' : 'Local'}</Cell>
        <Cell>Prompt Studio v1.0</Cell>
      </div>
    </div>
  );
}
