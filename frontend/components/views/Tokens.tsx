'use client';

import { useEffect, useRef } from 'react';
import type { AppState } from '@/lib/types';
import { tok, fmtN } from '@/lib/utils';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

export default function Tokens({ state, update }: Props) {
  const m = state.models.find(x => x.id === state.model) || state.models[1];
  const inTok = tok(state.prompt);
  const estMid = Math.round(inTok * 1.8);
  const estMin = Math.round(inTok * 0.8);
  const estMax = Math.round(inTok * 3.5);
  const ctxPct = m ? inTok / m.context * 100 : 0;
  const ctxC = ctxPct > 80 ? '#ff4444' : ctxPct > 50 ? '#ffcc00' : '#33ff66';

  const fillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = Math.min(100, ctxPct) + '%';
  }, [ctxPct]);

  const ci = (m?.cost_in || 0) / 1e6;
  const co = (m?.cost_out || 0) / 1e6;

  return (
    <div>
      <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
        <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► TOKEN COUNTER</div>
        <span style={{ color: '#007722', fontSize: 9 }}>Estimate tokens, context window usage, and per-call API cost</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: '#007722', fontSize: 10, letterSpacing: '.3px' }}>ACTIVE MODEL:</span>
        <select
          style={{ background: '#050e05', color: '#33ff66', border: '1px solid #003311', fontSize: 10, padding: '3px 8px' }}
          value={state.model}
          onChange={e => update({ model: e.target.value })}
        >
          {state.models.map(mm => (
            <option key={mm.id} value={mm.id}>{mm.name} ({fmtN(mm.context)} ctx)</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'INPUT TOKENS', val: inTok, sub: '~' + Math.round(inTok * 0.75) + ' words', c: '#33ff66' },
          { label: 'EST. OUTPUT (min)', val: estMin, sub: 'conservative', c: '#00cc44' },
          { label: 'EST. OUTPUT (max)', val: estMax, sub: 'expansive', c: '#ffcc00' },
          { label: 'CONTEXT USED', val: ctxPct.toFixed(1) + '%', sub: inTok + ' of ' + (m ? fmtN(m.context) : '—'), c: ctxC },
        ].map(s_ => (
          <div key={s_.label} style={{ background: '#010f01', border: '1px solid #003311', padding: '8px 10px' }}>
            <span style={{ color: '#004411', fontSize: 9, display: 'block', marginBottom: 2, letterSpacing: '.5px' }}>{s_.label}</span>
            <div style={{ color: s_.c, fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 2 }}>{String(s_.val)}</div>
            <span style={{ color: '#007722', fontSize: 9 }}>{s_.sub}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ color: '#007722', fontSize: 9, display: 'block', marginBottom: 6, letterSpacing: '.3px' }}>CONTEXT WINDOW UTILIZATION:</span>
        <div style={{ width: '100%', height: 14, background: '#004411', border: '1px solid #003311', position: 'relative', overflow: 'hidden' }}>
          <div ref={fillRef} className="bar-fill" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: '100%', background: ctxC }} />
          <div style={{ position: 'absolute', right: 4, top: 0, height: '100%', display: 'flex', alignItems: 'center', fontSize: 9, color: '#080c08', fontWeight: 600 }}>
            {m ? fmtN(m.context) : '—'} max
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          {['0', '25%', '50%', '75%', '100%'].map(t => <span key={t} style={{ color: '#004411', fontSize: 9 }}>{t}</span>)}
        </div>
        {ctxPct > 80 && (
          <div style={{ color: '#ff4444', fontSize: 10, marginTop: 6, padding: '4px 8px', border: '1px solid #ff4444', background: '#1a0000' }}>⚠ CRITICAL: &gt;80% context used — model may truncate output</div>
        )}
        {ctxPct > 50 && ctxPct <= 80 && (
          <div style={{ color: '#ffcc00', fontSize: 10, marginTop: 6, padding: '4px 8px', border: '1px solid #554400', background: '#0f0f00' }}>⚡ WARNING: &gt;50% context used — limited space for response</div>
        )}
      </div>

      <div>
        <span style={{ color: '#007722', fontSize: 9, display: 'block', marginBottom: 6, letterSpacing: '.3px' }}>ESTIMATED API COST (per call):</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            { label: 'Input', val: '$' + (inTok * ci).toFixed(6), c: '#00cc44' },
            { label: 'Output (mid)', val: '$' + (estMid * co).toFixed(6), c: '#ffcc00' },
            { label: 'Total (est.)', val: '$' + ((inTok * ci) + (estMid * co)).toFixed(6), c: '#33ff66' },
          ].map(item => (
            <div key={item.label} style={{ background: '#010f01', border: '1px solid #003311', padding: '6px 8px' }}>
              <span style={{ color: '#004411', fontSize: 9, display: 'block', marginBottom: 2 }}>{item.label}</span>
              <div style={{ color: item.c, fontSize: 13, fontWeight: 700 }}>{item.val}</div>
              <span style={{ color: '#004411', fontSize: 9 }}>@ ${m?.cost_in}/${m?.cost_out}/1M</span>
            </div>
          ))}
        </div>
        <span style={{ color: '#004411', fontSize: 9, display: 'block', marginTop: 6 }}>Output estimate assumes ×1.8 input length multiplier.</span>
      </div>
    </div>
  );
}
