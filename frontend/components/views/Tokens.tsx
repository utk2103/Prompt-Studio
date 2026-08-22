'use client';

import { useEffect, useRef } from 'react';
import type { AppState } from '@/lib/types';
import { tok, fmtN } from '@/lib/utils';
import ViewHeader from './ViewHeader';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

const TINT = (p: number) => p > 80 ? '#c8342a' : p > 50 ? '#c9a227' : '#5b8f3d';

export default function Tokens({ state, update }: Props) {
  const m = state.models.find(x => x.id === state.model) || state.models[1];
  const inTok = tok(state.prompt);
  const estMid = Math.round(inTok * 1.8);
  const estMin = Math.round(inTok * 0.8);
  const estMax = Math.round(inTok * 3.5);
  const ctxPct = m ? inTok / m.context * 100 : 0;
  const ctxC = TINT(ctxPct);

  const fillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = Math.min(100, ctxPct) + '%';
  }, [ctxPct]);

  const ci = (m?.cost_in || 0) / 1e6;
  const co = (m?.cost_out || 0) / 1e6;

  const Stat = ({ label, val, sub, tint }: { label: string; val: string | number; sub: string; tint?: string }) => (
    <div style={{ background: 'var(--d-bg-alt)', border: '1px solid var(--d-line)', padding: '18px 20px' }}>
      <div className="d-coord" style={{ marginBottom: 8 }}>{label}</div>
      <div className="font-display" style={{ fontSize: 32, letterSpacing: '-0.025em', color: tint || 'var(--d-ink)', marginBottom: 4 }}>{String(val)}</div>
      <div style={{ fontSize: 12, color: 'var(--d-ink-mute)' }}>{sub}</div>
    </div>
  );

  return (
    <div>
      <ViewHeader
        marker="/V.03 [X 34.9, Y 20.0]"
        title="Token Counter"
        subtitle="Estimate tokens, context window usage, and per-call API cost across every supported model."
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span className="d-coord">/ACTIVE MODEL</span>
        <select
          value={state.model}
          onChange={e => update({ model: e.target.value })}
          style={{
            background: 'var(--d-bg-alt)',
            color: 'var(--d-ink)',
            border: '1px solid var(--d-line)',
            padding: '8px 12px',
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 12,
            outline: 'none',
          }}
        >
          {state.models.map(mm => (
            <option key={mm.id} value={mm.id}>{mm.name} ({fmtN(mm.context)} ctx)</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        <Stat label="Input tokens"      val={inTok}                     sub={`~${Math.round(inTok * 0.75)} words`} />
        <Stat label="Est. output (min)" val={estMin}                    sub="conservative" />
        <Stat label="Est. output (max)" val={estMax}                    sub="expansive" tint="#c9a227" />
        <Stat label="Context used"      val={ctxPct.toFixed(1) + '%'}   sub={`${inTok} of ${m ? fmtN(m.context) : '·'}`} tint={ctxC} />
      </div>

      <div style={{ marginBottom: 32 }}>
        <div className="d-coord" style={{ marginBottom: 10 }}>/CONTEXT WINDOW UTILIZATION</div>
        <div style={{ width: '100%', height: 20, background: 'var(--d-line)', position: 'relative', overflow: 'hidden' }}>
          <div ref={fillRef} className="bar-fill" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: '100%', background: ctxC }} />
          <div style={{ position: 'absolute', right: 8, top: 0, height: '100%', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, color: 'var(--d-ink)', letterSpacing: '0.14em' }}>
            {m ? fmtN(m.context) : '·'} max
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {['0', '25%', '50%', '75%', '100%'].map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, color: 'var(--d-ink-mute)' }}>{t}</span>
          ))}
        </div>
        {ctxPct > 80 && (
          <div style={{ marginTop: 14, padding: '12px 16px', border: '1px solid #c8342a', color: '#c8342a', fontSize: 13 }}>
            CRITICAL: over 80% context used. Model may truncate output.
          </div>
        )}
        {ctxPct > 50 && ctxPct <= 80 && (
          <div style={{ marginTop: 14, padding: '12px 16px', border: '1px solid #c9a227', color: '#8a6a10', fontSize: 13 }}>
            WARNING: over 50% context used. Limited space for response.
          </div>
        )}
      </div>

      <div>
        <div className="d-coord" style={{ marginBottom: 10 }}>/ESTIMATED API COST (per call)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Input',         val: '$' + (inTok * ci).toFixed(6),                       tint: 'var(--d-ink)' },
            { label: 'Output (mid)',  val: '$' + (estMid * co).toFixed(6),                      tint: '#c9a227' },
            { label: 'Total (est.)',  val: '$' + ((inTok * ci) + (estMid * co)).toFixed(6),     tint: 'var(--d-accent)' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--d-bg-alt)', border: '1px solid var(--d-line)', padding: '16px 18px' }}>
              <div className="d-coord" style={{ marginBottom: 6 }}>{item.label}</div>
              <div className="font-display" style={{ fontSize: 24, letterSpacing: '-0.02em', color: item.tint }}>{item.val}</div>
              <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, color: 'var(--d-ink-mute)', marginTop: 4 }}>@ ${m?.cost_in}/${m?.cost_out}/1M</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--d-ink-mute)', marginTop: 12 }}>Output estimate assumes ×1.8 input length multiplier.</div>
      </div>
    </div>
  );
}
