'use client';

import type { AppState } from '@/lib/types';
import { localRecs, modeAdvice } from '@/lib/scoring';
import BarViz from '@/components/BarViz';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

export default function Score({ state, update }: Props) {
  if (!state.scores || !state.prompt.trim()) {
    return (
      <div>
        <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
          <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► PROMPT SCORER</div>
          <span style={{ color: '#007722', fontSize: 9 }}>Multi-dimensional quality analysis · 7 dimensions · letter grade</span>
        </div>
        <div style={{ color: '#007722', fontSize: 11, padding: '20px 0', textAlign: 'center' }}>── No prompt analyzed. Enter a prompt in [ANALYZE] first ──</div>
        <button onClick={() => update({ view: 'ANALYZE' })} style={{ marginTop: 8, background: 'transparent', color: '#00cc44', border: '1px solid #00cc44', padding: '3px 10px', fontSize: 11, letterSpacing: '.3px' }}>[→ ANALYZE]</button>
      </div>
    );
  }

  const s = state.scores;
  const oc = s.overall >= 75 ? '#33ff66' : s.overall >= 50 ? '#ffcc00' : '#ff4444';
  const recs = state.recs.length ? state.recs : localRecs(s);

  const dims = [
    { k: 'clarity' as const, label: 'CLARITY          ', desc: 'Sentence structure & readability' },
    { k: 'specificity' as const, label: 'SPECIFICITY      ', desc: 'Action verbs & task precision' },
    { k: 'context' as const, label: 'CONTEXT RICHNESS ', desc: 'Background, role & examples' },
    { k: 'format' as const, label: 'FORMAT SPEC      ', desc: 'Output structure definition' },
    { k: 'mode_alignment' as const, label: 'MODE ALIGNMENT   ', desc: 'Matches mode: ' + state.mode },
    { k: 'token_efficiency' as const, label: 'TOKEN EFFICIENCY ', desc: 'Optimal length vs. complexity' },
    { k: 'constraints' as const, label: 'CONSTRAINTS      ', desc: 'Boundaries & guardrails' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #004411' }}>
        <div className="glow" style={{ color: '#33ff66', fontSize: 14, fontWeight: 700, marginBottom: 3, letterSpacing: '.5px' }}>► PROMPT SCORER</div>
        <span style={{ color: '#007722', fontSize: 9 }}>Multi-dimensional quality analysis · 7 dimensions · letter grade</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, padding: '10px 12px', background: '#010f01', border: '1px solid #003311' }}>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <span style={{ color: '#004411', fontSize: 9, display: 'block', marginBottom: 2, letterSpacing: '.5px' }}>OVERALL SCORE</span>
          <div className="glow" style={{ color: oc, fontSize: 30, fontWeight: 700, lineHeight: '1.1', letterSpacing: '-1px' }}>{s.overall}/100</div>
          <span style={{ color: oc, fontSize: 9, display: 'block', marginTop: 2 }}>GRADE {s.grade} · {s.label}</span>
        </div>
        <div style={{ width: 1, background: '#003311', alignSelf: 'stretch', margin: '0 4px' }} />
        <div style={{ flex: 1 }}>
          <span style={{ color: '#007722', fontSize: 9, display: 'block', marginBottom: 6, letterSpacing: '.3px' }}>TOP RECOMMENDATIONS:</span>
          {recs.slice(0, 3).map((r, i) => (
            <div key={i} style={{ fontSize: 10, color: '#e8ffe8', marginBottom: 4, paddingLeft: 6, borderLeft: '2px solid #004411', lineHeight: '1.4' }}>→ {r}</div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ color: '#007722', fontSize: 9, display: 'block', marginBottom: 7, letterSpacing: '.5px', borderBottom: '1px solid #004411', paddingBottom: 5 }}>DIMENSION ANALYSIS:</span>
        {dims.map(d => {
          const val = s[d.k] || 0;
          const fc = val >= 75 ? '#33ff66' : val >= 50 ? '#ffcc00' : '#ff4444';
          return (
            <div key={d.k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ color: '#007722', fontSize: 10, width: 162, flexShrink: 0, letterSpacing: '.15px' }}>{d.label}</span>
              <BarViz val={val} maxW={158} fillColor={fc} />
              <span style={{ color: '#004411', fontSize: 9, marginLeft: 2 }}>{d.desc}</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '8px 10px', border: '1px solid #004411', background: '#010f01' }}>
        <span style={{ color: '#007722', fontSize: 9, display: 'block', marginBottom: 5, letterSpacing: '.3px' }}>MODE-SPECIFIC ADVICE ({state.mode}):</span>
        {modeAdvice(state.mode).map((a, i) => (
          <div key={i} style={{ color: '#00ccff', fontSize: 10, marginBottom: 3, paddingLeft: 2 }}>  ✦  {a}</div>
        ))}
      </div>
    </div>
  );
}
