import Link from 'next/link';
import Shell from '@/components/marketing/Shell';
import PageHero from '@/components/marketing/PageHero';

const FEATURES = [
  { id: '/F.01', h: 'Analyze', body: 'Paste a prompt, get instant feedback on structure, clarity, and completeness. Runs the full pipeline: score, issues, token count, format preview.' },
  { id: '/F.02', h: 'Score', body: '7-dimension breakdown — clarity, specificity, context richness, format spec, mode alignment, token efficiency, constraints — rolled into an overall letter grade A–F.' },
  { id: '/F.03', h: 'Optimize', body: 'Rule-based improvement pass. Adds missing persona, format directives, few-shot examples, and constraints in one shot.' },
  { id: '/F.04', h: 'Compress', body: 'Strip filler tokens without losing semantic content. Ships shorter payloads at the same intent.' },
  { id: '/F.05', h: 'Token counter', body: 'Estimate input/output tokens and per-call USD cost across 7 models: GPT-4o, Claude 3.5, Gemini 1.5, GPT-3.5, Llama 3.1, Mistral Large, DeepSeek-V3.' },
  { id: '/F.06', h: 'Context map', body: 'Visualize how your prompt fits across every supported context window — 16K to 1M tokens.' },
  { id: '/F.07', h: 'Adaptive wizard', body: '7-question guided flow that auto-generates a well-structured prompt from your intent.' },
  { id: '/F.08', h: 'History + semantic search', body: 'Persistent session history backed by PostgreSQL. pgvector ivfflat index for cosine-similarity retrieval when embeddings are wired.' },
];

const API_ROUTES = [
  ['GET', '/models', 'List all supported models with metadata'],
  ['POST', '/analyze', 'Full pipeline — score + issues + token count + format preview'],
  ['POST', '/score', '7-dimension scoring + top-3 recommendations'],
  ['POST', '/tokens/count', 'Token count, context window %, per-call USD cost'],
  ['POST', '/validate/format', 'Issue detection + model-native format preview'],
  ['POST', '/optimize', 'Rule-based prompt improvement pass'],
  ['POST', '/compare/models', 'Cross-model compatibility matrix'],
  ['GET', '/wizard/questions', 'Adaptive wizard question set'],
  ['POST', '/wizard/generate', 'Build a prompt from collected wizard answers'],
  ['POST', '/prompt/compress', 'Filler-token compression pass'],
  ['GET', '/history', 'Fetch persisted session history'],
  ['POST', '/history', 'Save a history entry'],
];

export default function FeaturesPage() {
  return (
    <Shell>
      <PageHero
        eyebrow="/FEATURES [X 12.4, Y 08.1]"
        title={<><span style={{ color: 'var(--d-ink-mute)' }}>The workbench, </span>every surface.</>}
        subtitle="Prompt Studio is a structured workflow for writing better prompts — analyze, score, optimize, compress, count, map, generate, and persist. Every feature runs offline against a TypeScript fallback when the FastAPI backend isn't reachable."
        coordX="12.4"
        coordY="08.1"
      />

      <section style={{ borderTop: '1px solid var(--d-line)' }}>
        {FEATURES.map((f, i) => (
          <div key={f.id} style={{ borderTop: i === 0 ? 0 : '1px solid var(--d-line)', padding: '56px 0' }}>
            <div className="d-container" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 220px', gap: 40, alignItems: 'baseline' }}>
              <div className="d-coord">{f.id}</div>
              <h3 className="font-display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{f.h}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--d-ink-soft)' }}>{f.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="api" className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container">
          <div className="d-coord" style={{ marginBottom: 16 }}>/API [X 60.1, Y 22.8]</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '-0.025em', marginBottom: 32 }}>API Reference</h2>
          <div style={{ border: '1px solid var(--d-line)' }}>
            {API_ROUTES.map(([method, path, desc], i) => (
              <div key={path} style={{ display: 'grid', gridTemplateColumns: '80px 240px 1fr', padding: '14px 20px', borderTop: i === 0 ? 0 : '1px solid var(--d-line)', alignItems: 'center', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12 }}>
                <span style={{ color: 'var(--d-accent)', fontWeight: 600 }}>{method}</span>
                <span>{path}</span>
                <span style={{ color: 'var(--d-ink-soft)', fontFamily: 'var(--font-inter), sans-serif' }}>{desc}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <Link href="/studio" className="d-cta">Try in Studio</Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
