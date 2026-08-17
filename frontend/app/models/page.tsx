import Link from 'next/link';
import Shell from '@/components/marketing/Shell';
import PageHero from '@/components/marketing/PageHero';

const MODELS = [
  ['GPT-4o', 'OpenAI', '128K', 'ChatML'],
  ['Claude 3.5 Sonnet', 'Anthropic', '200K', 'XML Tags'],
  ['Gemini 1.5 Pro', 'Google', '1M', 'Gemini Native'],
  ['GPT-3.5 Turbo', 'OpenAI', '16K', 'ChatML'],
  ['Llama 3.1 70B', 'Meta', '128K', 'Llama Template'],
  ['Mistral Large', 'Mistral AI', '32K', 'Mistral Native'],
  ['DeepSeek-V3', 'DeepSeek', '64K', 'ChatML'],
];

const DIMS = [
  ['Clarity', 'Sentence structure, optimal word count (~40–80 words ideal)'],
  ['Specificity', 'Presence of clear action verbs'],
  ['Context richness', 'Role definition, background, few-shot examples'],
  ['Format spec', 'Explicit output format (JSON, markdown, bullet list, etc.)'],
  ['Mode alignment', 'Vocabulary match for TECHNICAL / CREATIVE / SYSTEM mode'],
  ['Token efficiency', 'Length relative to task complexity'],
  ['Constraints', 'Boundaries, guardrails, and scope limiters'],
];

export default function ModelsPage() {
  return (
    <Shell>
      <PageHero
        eyebrow="/MODELS [X 44.8, Y 18.2]"
        title={<>Seven models, <span style={{ color: 'var(--d-ink-mute)' }}>one adapter surface.</span></>}
        subtitle="Each model has a native format · ChatML, XML tags, Gemini native, Llama template, Mistral native. Prompt Studio adapts your prompt into every one and reports the cross-model compatibility matrix in one call."
        coordX="44.8"
        coordY="18.2"
      />

      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container">
          <div className="d-coord" style={{ marginBottom: 14 }}>/S.01 Supported</div>
          <div style={{ border: '1px solid var(--d-line)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', padding: '14px 20px', borderBottom: '1px solid var(--d-line)', background: 'var(--d-bg-alt)', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--d-ink-mute)' }}>
              <span>Model</span>
              <span>Provider</span>
              <span>Context</span>
              <span>Format</span>
            </div>
            {MODELS.map(([m, p, ctx, fmt]) => (
              <div key={m} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', padding: '18px 20px', borderTop: '1px solid var(--d-line)', alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{m}</span>
                <span style={{ fontSize: 13, color: 'var(--d-ink-soft)' }}>{p}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: 'var(--d-accent)' }}>{ctx}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: 'var(--d-ink-soft)' }}>{fmt}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container">
          <div className="d-coord" style={{ marginBottom: 14 }}>/S.02 Scoring dimensions</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.025em', marginBottom: 32 }}>
            Seven axes, one grade.
          </h2>
          <div style={{ border: '1px solid var(--d-line)' }}>
            {DIMS.map(([d, m], i) => (
              <div key={d} style={{ display: 'grid', gridTemplateColumns: '80px 260px 1fr', padding: '18px 24px', borderTop: i === 0 ? 0 : '1px solid var(--d-line)', alignItems: 'baseline' }}>
                <span className="d-coord">{`/S.02.${String(i + 1).padStart(2, '0')}`}</span>
                <span className="font-display" style={{ fontSize: 22 }}>{d}</span>
                <span style={{ fontSize: 14, color: 'var(--d-ink-soft)', lineHeight: 1.55 }}>{m}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <Link href="/studio" className="d-cta">Score a prompt</Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
