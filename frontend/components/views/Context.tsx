'use client';

import { useEffect, useRef } from 'react';
import type { AppState } from '@/lib/types';
import { tok, fmtN, wc } from '@/lib/utils';
import ViewHeader from './ViewHeader';

interface Props {
  state: AppState;
}

function ModelRow({ m, inTok, active }: { m: AppState['models'][0]; inTok: number; active: boolean }) {
  const pct = Math.min(100, inTok / m.context * 100);
  const c_ = pct > 80 ? '#c8342a' : pct > 50 ? '#c9a227' : '#5b8f3d';
  const fits = inTok <= m.context;
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = pct + '%';
  }, [pct]);

  return (
    <div style={{ padding: '18px 20px', borderTop: '1px solid var(--d-line)', background: active ? 'var(--d-bg-alt)' : 'transparent', borderLeft: active ? '2px solid var(--d-accent)' : '2px solid transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: active ? 600 : 500 }}>
          {m.name}
          {active && <span className="d-coord" style={{ marginLeft: 10 }}>ACTIVE</span>}
        </span>
        <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: fits ? '#5b8f3d' : '#c8342a', letterSpacing: '0.14em' }}>
          {fits ? `FIT (${pct.toFixed(1)}%)` : 'EXCEEDS LIMIT'}
        </span>
      </div>
      <div style={{ width: '100%', height: 6, background: 'var(--d-line)', position: 'relative', overflow: 'hidden', marginBottom: 6 }}>
        <div ref={fillRef} className="bar-fill" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: '100%', background: c_ }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, color: 'var(--d-ink-mute)', letterSpacing: '0.1em' }}>
        <span>{fmtN(m.context)} ctx</span>
        <span>Remaining: {fmtN(Math.max(0, m.context - inTok))}</span>
        <span>${m.cost_in}/${m.cost_out}/1M</span>
      </div>
    </div>
  );
}

export default function Context({ state }: Props) {
  const inTok = tok(state.prompt);
  return (
    <div>
      <ViewHeader
        marker="/V.04 [X 44.6, Y 26.3]"
        title="Context Window Map"
        subtitle="Compare prompt fit across every supported model, from 16K to 1M tokens."
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="d-coord">/CURRENT PROMPT</span>
        <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: 'var(--d-ink-mute)' }}>
          {inTok} tokens · {wc(state.prompt)} words
        </span>
      </div>
      <div style={{ border: '1px solid var(--d-line)', borderTop: 0 }}>
        {state.models.map(m => (
          <ModelRow key={m.id} m={m} inTok={inTok} active={m.id === state.model} />
        ))}
      </div>
    </div>
  );
}
