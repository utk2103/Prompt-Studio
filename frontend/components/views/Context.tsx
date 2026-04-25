'use client';

import { useEffect, useRef } from 'react';
import type { AppState } from '@/lib/types';
import { tok, fmtN, wc } from '@/lib/utils';

interface Props {
  state: AppState;
}

function ModelRow({ m, inTok, active }: { m: AppState['models'][0]; inTok: number; active: boolean }) {
  const pct = Math.min(100, inTok / m.context * 100);
  const c_ = pct > 80 ? '#ff4444' : pct > 50 ? '#ffcc00' : '#33ff66';
  const fits = inTok <= m.context;
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = pct + '%';
  }, [pct]);

  return (
    <div style={{ marginBottom: 8, padding: '7px 10px', background: active ? '#001800' : '#010f01', border: `1px solid ${active ? '#00cc44' : '#003311'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: active ? '#00ccff' : '#e8ffe8', fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '.3px' }}>
          {m.name}{active ? ' ← active' : ''}
        </span>
        <span style={{ color: fits ? '#00cc44' : '#ff4444', fontSize: 9 }}>{fits ? '✓ FIT (' + pct.toFixed(1) + '%)' : '✗ EXCEEDS LIMIT'}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: '#004411', position: 'relative', overflow: 'hidden' }}>
        <div ref={fillRef} className="bar-fill" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: '100%', background: c_ }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ color: '#004411', fontSize: 9 }}>{fmtN(m.context)} ctx limit</span>
        <span style={{ color: '#004411', fontSize: 9 }}>Remaining: {fmtN(m.context - inTok)}</span>
        <span style={{ color: '#004411', fontSize: 9 }}>${m.cost_in}/${m.cost_out}/1M</span>
      </div>
    </div>
  );
}

export default function Context({ state }: Props) {
  const inTok = tok(state.prompt);
  return (
    <div>
      <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
        <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► CONTEXT WINDOW MAP</div>
        <span style={{ color: '#007722', fontSize: 9 }}>Compare prompt fit across all supported models</span>
      </div>
      <span style={{ color: '#007722', fontSize: 10, display: 'block', marginBottom: 10 }}>
        CURRENT PROMPT: {inTok} tokens · {wc(state.prompt)} words
      </span>
      {state.models.map(m => (
        <ModelRow key={m.id} m={m} inTok={inTok} active={m.id === state.model} />
      ))}
    </div>
  );
}
