'use client';

import type { AppState, ModeType, ViewType } from '@/lib/types';

const VIEWS: { id: ViewType; label: string; marker: string }[] = [
  { id: 'ANALYZE',  label: 'Analyze',  marker: '/N.01' },
  { id: 'SCORE',    label: 'Score',    marker: '/N.02' },
  { id: 'TOKENS',   label: 'Tokens',   marker: '/N.03' },
  { id: 'CONTEXT',  label: 'Context',  marker: '/N.04' },
  { id: 'MODELS',   label: 'Models',   marker: '/N.05' },
  { id: 'WIZARD',   label: 'Wizard',   marker: '/N.06' },
  { id: 'HISTORY',  label: 'History',  marker: '/N.07' },
];

const MODES: ModeType[] = ['CREATIVE', 'TECHNICAL', 'SYSTEM'];

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

export default function SideNav({ state, update }: Props) {
  return (
    <aside style={{ width: 240, borderRight: '1px solid var(--d-line)', padding: '28px 0', flexShrink: 0, background: 'var(--d-bg)' }}>
      <div style={{ padding: '0 24px 12px' }}>
        <span className="d-coord">/NAVIGATION</span>
      </div>
      <nav>
        {VIEWS.map(v => {
          const active = state.view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => update({ view: v.id })}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '10px 24px',
                background: active ? 'var(--d-bg-alt)' : 'transparent',
                border: 0,
                borderLeft: active ? '2px solid var(--d-accent)' : '2px solid transparent',
                color: active ? 'var(--d-ink)' : 'var(--d-ink-soft)',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'var(--font-manrope), sans-serif',
                fontSize: 15,
                fontWeight: active ? 600 : 400,
                letterSpacing: '-0.01em',
                transition: 'background 0.12s',
              }}
            >
              <span>{v.label}</span>
              <span className="d-coord" style={{ fontSize: 9, opacity: active ? 1 : 0.5 }}>{v.marker}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '32px 24px 12px' }}>
        <span className="d-coord">/MODE</span>
      </div>
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MODES.map(m => {
          const active = state.mode === m;
          return (
            <button
              key={m}
              onClick={() => update({ mode: m })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                background: 'transparent',
                border: 0,
                color: active ? 'var(--d-accent)' : 'var(--d-ink-soft)',
                cursor: 'pointer',
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textAlign: 'left',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--d-accent)' : 'transparent', border: '1px solid ' + (active ? 'var(--d-accent)' : 'var(--d-line)') }} />
              {m}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
