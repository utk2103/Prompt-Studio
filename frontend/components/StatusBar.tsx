'use client';

import type { AppState } from '@/lib/types';

interface Props {
  state: AppState;
}

export default function StatusBar({ state }: Props) {
  const errs = state.issues.filter(x => x.t === 'ERR' || x.t === 'WARN').length;
  const infos = state.issues.filter(x => x.t === 'INFO').length;

  return (
    <div style={{ background: '#010e01', borderTop: '1px solid #003311', padding: '4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, height: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ color: state.prompt ? '#00cc44' : '#007722', fontSize: 10 }}>
          STATUS: {state.prompt ? 'PROMPT LOADED' : 'AWAITING INPUT'}
        </span>
        <span style={{ color: '#003311', fontSize: 9 }}>│</span>
        <span style={{ color: state.scores ? '#00cc44' : '#007722', fontSize: 10 }}>
          SCORE: {state.scores ? state.scores.overall + '/100' : 'N/A'}
        </span>
        <span style={{ color: '#003311', fontSize: 9 }}>│</span>
        <span style={{ color: errs ? '#ffcc00' : '#007722', fontSize: 10 }}>
          ISSUES: {errs} warn · {infos} info
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: '#004411', fontSize: 9 }}>HIST: {state.history.length}</span>
        <span style={{ color: '#003311', fontSize: 9 }}>│</span>
        <span style={{ color: state.apiOnline ? '#00cc44' : '#004411', fontSize: 9 }}>
          API: {state.apiOnline ? 'LIVE' : 'LOCAL'}
        </span>
        <span style={{ color: '#003311', fontSize: 9 }}>│</span>
        <span style={{ color: '#004411', fontSize: 9 }}>Prompt_Studio v1.0</span>
      </div>
    </div>
  );
}
