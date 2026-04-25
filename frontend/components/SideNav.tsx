'use client';

import type { AppState, ModeType, ViewType } from '@/lib/types';

const VIEWS: ViewType[] = ['ANALYZE', 'SCORE', 'TOKENS', 'CONTEXT', 'MODELS', 'WIZARD', 'HISTORY'];
const MODES: ModeType[] = ['CREATIVE', 'TECHNICAL', 'SYSTEM'];

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

export default function SideNav({ state, update }: Props) {
  return (
    <div style={{ width: 134, borderRight: '1px solid #003311', padding: '10px 0', flexShrink: 0, background: '#0b100b' }}>
      <div style={{ color: '#004411', fontSize: 9, padding: '0 10px 6px', borderBottom: '1px solid #004411', marginBottom: 8, letterSpacing: '.5px' }}>── NAVIGATION ──</div>
      {VIEWS.map(v => {
        const active = state.view === v;
        return (
          <div
            key={v}
            onClick={() => update({ view: v })}
            style={{
              padding: '5px 10px', cursor: 'pointer',
              color: active ? '#33ff66' : '#007722',
              background: active ? '#011a01' : 'transparent',
              borderLeft: active ? '2px solid #33ff66' : '2px solid transparent',
              fontSize: 11, letterSpacing: '.3px', transition: 'all .1s',
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.color = '#00cc44'; (e.currentTarget as HTMLDivElement).style.background = '#010f01'; } }}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.color = '#007722'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; } }}
          >
            {(active ? '▶ ' : '  ')}[{v}]
          </div>
        );
      })}
      <div style={{ borderTop: '1px solid #004411', margin: '10px 0 6px' }} />
      <div style={{ padding: '0 10px' }}>
        <div style={{ color: '#004411', fontSize: 9, marginBottom: 5, letterSpacing: '.5px' }}>── MODES ──</div>
        {MODES.map(m => {
          const active = state.mode === m;
          return (
            <div
              key={m}
              onClick={() => update({ mode: m })}
              style={{
                padding: '3px 4px', cursor: 'pointer',
                color: active ? '#ffcc00' : '#007722',
                background: active ? '#1a1100' : 'transparent',
                fontSize: 10, marginBottom: 2, letterSpacing: '.2px',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = '#00cc44'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = '#007722'; }}
            >
              {active ? '● ' : '○ '}{m}
            </div>
          );
        })}
      </div>
    </div>
  );
}
