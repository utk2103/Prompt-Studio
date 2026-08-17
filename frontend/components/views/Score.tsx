'use client';

import type { AppState } from '@/lib/types';
import { localRecs, modeAdvice } from '@/lib/scoring';
import BarViz from '@/components/BarViz';
import ViewHeader from './ViewHeader';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

const DIM_TINT = (v: number) => v >= 75 ? '#5b8f3d' : v >= 50 ? '#c9a227' : '#c8342a';

export default function Score({ state, update }: Props) {
  if (!state.scores || !state.prompt.trim()) {
    return (
      <div>
        <ViewHeader
          marker="/V.02 [X 22.1, Y 14.6]"
          title="Prompt Scorer"
          subtitle="Multi-dimensional quality analysis across seven dimensions with a letter grade."
        />
        <div style={{ fontSize: 14, color: 'var(--d-ink-mute)', padding: '40px 0', textAlign: 'center' }}>
          No prompt analyzed. Enter a prompt in Analyze first.
        </div>
        <button
          onClick={() => update({ view: 'ANALYZE' })}
          className="d-cta-ghost"
        >
          → Analyze
        </button>
      </div>
    );
  }

  const s = state.scores;
  const oc = DIM_TINT(s.overall);
  const recs = state.recs.length ? state.recs : localRecs(s);

  const dims = [
    { k: 'clarity' as const,          label: 'Clarity',          desc: 'Sentence structure and readability' },
    { k: 'specificity' as const,      label: 'Specificity',      desc: 'Action verbs and task precision' },
    { k: 'context' as const,          label: 'Context Richness', desc: 'Background, role and examples' },
    { k: 'format' as const,           label: 'Format Spec',      desc: 'Output structure definition' },
    { k: 'mode_alignment' as const,   label: 'Mode Alignment',   desc: 'Matches mode: ' + state.mode },
    { k: 'token_efficiency' as const, label: 'Token Efficiency', desc: 'Optimal length vs. complexity' },
    { k: 'constraints' as const,      label: 'Constraints',      desc: 'Boundaries and guardrails' },
  ];

  return (
    <div>
      <ViewHeader
        marker="/V.02 [X 22.1, Y 14.6]"
        title="Prompt Scorer"
        subtitle="Seven dimensions, rolled into an overall letter grade."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, padding: 28, background: 'var(--d-bg-alt)', border: '1px solid var(--d-line)', marginBottom: 32 }}>
        <div>
          <div className="d-coord" style={{ marginBottom: 8 }}>OVERALL SCORE</div>
          <div className="font-display" style={{ fontSize: 72, letterSpacing: '-0.035em', lineHeight: 1, color: oc }}>{s.overall}<span style={{ fontSize: 24, color: 'var(--d-ink-mute)' }}>/100</span></div>
          <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: oc, marginTop: 8 }}>
            Grade {s.grade} · {s.label}
          </div>
        </div>
        <div>
          <div className="d-coord" style={{ marginBottom: 12 }}>TOP RECOMMENDATIONS</div>
          {recs.slice(0, 3).map((r, i) => (
            <div key={i} style={{ fontSize: 14, color: 'var(--d-ink)', marginBottom: 10, paddingLeft: 12, borderLeft: '2px solid var(--d-accent)', lineHeight: 1.5 }}>
              {r}
            </div>
          ))}
        </div>
      </div>

      <div className="d-coord" style={{ marginBottom: 14 }}>/DIMENSION ANALYSIS</div>
      <div style={{ border: '1px solid var(--d-line)', marginBottom: 32 }}>
        {dims.map((d, i) => {
          const val = s[d.k] || 0;
          const fc = DIM_TINT(val);
          return (
            <div key={d.k} style={{ display: 'grid', gridTemplateColumns: '180px 260px 1fr', padding: '14px 20px', borderTop: i === 0 ? 0 : '1px solid var(--d-line)', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{d.label}</span>
              <BarViz val={val} maxW={200} fillColor={fc} />
              <span style={{ fontSize: 12, color: 'var(--d-ink-mute)' }}>{d.desc}</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 20, border: '1px solid var(--d-line)', background: 'var(--d-bg-alt)' }}>
        <div className="d-coord" style={{ marginBottom: 10 }}>MODE-SPECIFIC ADVICE ({state.mode})</div>
        {modeAdvice(state.mode).map((a, i) => (
          <div key={i} style={{ fontSize: 14, color: 'var(--d-ink)', marginBottom: 6 }}>
            <span style={{ color: 'var(--d-accent)', marginRight: 8 }}>◆</span>{a}
          </div>
        ))}
      </div>
    </div>
  );
}
