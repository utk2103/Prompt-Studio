'use client';

import type { AppState } from '@/lib/types';
import { scoreLocal } from '@/lib/scoring';
import { tok, fmtN } from '@/lib/utils';
import ViewHeader from './ViewHeader';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

export default function Models({ state, update }: Props) {
  if (!state.prompt.trim()) {
    return (
      <div>
        <ViewHeader
          marker="/V.05 [X 55.2, Y 32.7]"
          title="Model Compatibility"
          subtitle="Cross-model evaluation. Format compatibility. Switching impact."
        />
        <div style={{ fontSize: 14, color: 'var(--d-ink-mute)', padding: '40px 0', textAlign: 'center' }}>
          No prompt loaded. Enter a prompt in Analyze first.
        </div>
      </div>
    );
  }

  const inTok = tok(state.prompt);
  const sc = state.scores || scoreLocal(state.prompt, state.mode) || { overall: 0 };
  const activeModel = state.models.find(x => x.id === state.model);

  return (
    <div>
      <ViewHeader
        marker="/V.05 [X 55.2, Y 32.7]"
        title="Model Compatibility"
        subtitle="Cross-model evaluation matrix. Format compatibility. Switching impact."
      />

      <div className="d-coord" style={{ marginBottom: 12 }}>/EVALUATION MATRIX</div>
      <div style={{ border: '1px solid var(--d-line)' }}>
        {state.models.map((m, i) => {
          const fits = inTok <= m.context;
          const fmtB = m.format === 'XML Tags' && state.mode === 'SYSTEM' ? 7 : 0;
          const compat = Math.round((sc.overall * 0.6 + (85 + fmtB) * 0.4) * (fits ? 1 : 0.25));
          const cc = compat >= 70 ? '#5b8f3d' : compat >= 50 ? '#c9a227' : '#c8342a';
          const active = m.id === state.model;

          return (
            <div key={m.id} style={{
              padding: '20px 24px',
              borderTop: i === 0 ? 0 : '1px solid var(--d-line)',
              background: active ? 'var(--d-bg-alt)' : 'transparent',
              borderLeft: active ? '2px solid var(--d-accent)' : '2px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: 'var(--d-ink-mute)', marginLeft: 12, letterSpacing: '0.14em' }}>
                    {m.provider} · {fmtN(m.context)} ctx · {m.format}
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 16,
                  fontWeight: 600,
                  color: cc,
                  border: `1px solid ${cc}`,
                  padding: '4px 14px',
                  letterSpacing: '0.05em',
                }}>
                  {compat}%
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--d-ink-mute)', letterSpacing: '0.1em' }}>
                <span>FITS CTX: <span style={{ color: fits ? '#5b8f3d' : '#c8342a' }}>{fits ? 'YES' : 'NO'}</span></span>
                <span>FORMAT: <span style={{ color: 'var(--d-ink)' }}>{m.format}</span></span>
                <span>COST/CALL: <span style={{ color: 'var(--d-ink)' }}>${((inTok * m.cost_in / 1e6) + (inTok * 1.8 * m.cost_out / 1e6)).toFixed(5)}</span></span>
              </div>
              {!fits && (
                <div style={{ marginTop: 12, fontSize: 12, color: '#c8342a' }}>
                  INCOMPATIBLE. Reduce prompt by ~{inTok - m.context} tokens.
                </div>
              )}
              {fits && activeModel && m.format !== activeModel.format && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--d-accent)' }}>
                  Switching requires format adaptation: {m.format} wrapping.
                </div>
              )}
              <button
                onClick={() => update({ model: m.id })}
                style={{
                  marginTop: 14,
                  padding: '8px 16px',
                  background: active ? 'var(--d-accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--d-accent)',
                  border: '1px solid var(--d-accent)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {active ? 'Currently Active' : 'Use This Model'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
