'use client';

import type { AppState } from '@/lib/types';
import { scoreLocal } from '@/lib/scoring';
import { tok, fmtN } from '@/lib/utils';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

export default function Models({ state, update }: Props) {
  if (!state.prompt.trim()) {
    return (
      <div>
        <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
          <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► MODEL COMPATIBILITY</div>
          <span style={{ color: '#007722', fontSize: 9 }}>Cross-model evaluation · format compatibility · switching impact</span>
        </div>
        <div style={{ color: '#007722', fontSize: 11, padding: '16px 0' }}>── No prompt loaded. Enter a prompt in [ANALYZE] first ──</div>
      </div>
    );
  }

  const inTok = tok(state.prompt);
  const sc = state.scores || scoreLocal(state.prompt, state.mode) || { overall: 0 };
  const activeModel = state.models.find(x => x.id === state.model);

  return (
    <div>
      <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
        <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► MODEL COMPATIBILITY</div>
        <span style={{ color: '#007722', fontSize: 9 }}>Cross-model evaluation · format compatibility · switching impact</span>
      </div>
      <span style={{ color: '#007722', fontSize: 9, display: 'block', marginBottom: 10, letterSpacing: '.3px' }}>CROSS-MODEL EVALUATION MATRIX:</span>
      {state.models.map(m => {
        const fits = inTok <= m.context;
        const fmtB = m.format === 'XML Tags' && state.mode === 'SYSTEM' ? 7 : 0;
        const compat = Math.round((sc.overall * 0.6 + (85 + fmtB) * 0.4) * (fits ? 1 : 0.25));
        const cc = compat >= 70 ? '#33ff66' : compat >= 50 ? '#ffcc00' : '#ff4444';
        const active = m.id === state.model;

        return (
          <div key={m.id} style={{ marginBottom: 8, padding: '8px 10px', border: `1px solid ${active ? '#00cc44' : '#003311'}`, background: active ? '#001800' : '#010f01' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ color: active ? '#00ccff' : '#e8ffe8', fontSize: 11, fontWeight: 600, letterSpacing: '.2px' }}>{m.name}</span>
                <span style={{ color: '#007722', fontSize: 9, marginLeft: 8 }}>{m.provider} · {fmtN(m.context)} ctx · {m.format}</span>
              </div>
              <div style={{ color: cc, fontSize: 14, fontWeight: 700, border: `1px solid ${cc}`, padding: '1px 8px', letterSpacing: '-.5px' }}>{compat}%</div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { k: 'FITS CTX', v: fits ? '✓ YES' : '✗ NO', c: fits ? '#33ff66' : '#ff4444' },
                { k: 'FORMAT', v: m.format, c: '#00cc44' },
                { k: 'COST/CALL', v: '$' + ((inTok * m.cost_in / 1e6) + (inTok * 1.8 * m.cost_out / 1e6)).toFixed(5), c: '#ffcc00' },
              ].map(item => (
                <div key={item.k} style={{ fontSize: 9 }}>
                  <span style={{ color: '#004411' }}>{item.k}  </span>
                  <span style={{ color: item.c }}>{item.v}</span>
                </div>
              ))}
            </div>
            {!fits && (
              <div style={{ marginTop: 5, color: '#ff4444', fontSize: 9, padding: '2px 4px', background: '#1a0000' }}>
                ✗ INCOMPATIBLE: Reduce prompt by ~{inTok - m.context} tokens
              </div>
            )}
            {fits && activeModel && m.format !== activeModel.format && (
              <div style={{ marginTop: 5, color: '#00ccff', fontSize: 9, padding: '2px 4px', background: '#001122' }}>
                ⚡ Switching requires format adaptation: {m.format} wrapping
              </div>
            )}
            <button
              onClick={() => update({ model: m.id })}
              style={{ marginTop: 6, background: active ? '#00cc44' : 'transparent', color: active ? '#080c08' : '#007722', border: `1px solid ${active ? '#00cc44' : '#007722'}`, padding: '3px 10px', fontSize: 11, letterSpacing: '.3px' }}
            >
              [USE THIS MODEL]
            </button>
          </div>
        );
      })}
    </div>
  );
}
