import Link from 'next/link';
import Shell from '@/components/marketing/Shell';
import Coord from '@/components/marketing/Coord';
import Logo from '@/components/marketing/Logo';

const FEATURES = [
  {
    id: '/A.01',
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
        <rect x="12" y="16" width="48" height="40" stroke="#2a2a2c" strokeWidth="2" />
        <path d="M22 30h28M22 38h20M22 46h24" stroke="#2a2a2c" strokeWidth="2" />
        <circle cx="56" cy="52" r="6" fill="#2a3bff" />
      </svg>
    ),
    title: <>Score any prompt, <span className="soft">seven ways</span></>,
    note: '7-dimension quality breakdown with letter grade. Clarity, specificity, context, format, mode-fit, token efficiency, constraints.',
  },
  {
    id: '/A.02',
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
        <g fill="#2a3bff">
          <circle cx="20" cy="28" r="5" />
          <circle cx="34" cy="20" r="5" />
          <circle cx="48" cy="30" r="5" />
          <circle cx="26" cy="46" r="5" />
          <circle cx="44" cy="48" r="5" />
        </g>
        <g fill="#8fdb8a">
          <circle cx="14" cy="42" r="4" />
          <circle cx="54" cy="48" r="4" />
          <circle cx="40" cy="34" r="4" />
        </g>
      </svg>
    ),
    title: <>Optimize <span className="soft">at the speed of iteration</span></>,
    note: 'Rule-based improvement pass adds missing persona, format, examples, constraints. Filler-token compression without semantic loss.',
  },
  {
    id: '/A.03',
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
        <rect x="14" y="34" width="14" height="24" fill="#c9a227" />
        <rect x="30" y="24" width="14" height="34" fill="#c9a227" />
        <rect x="46" y="14" width="14" height="44" fill="#c9a227" />
        <rect x="46" y="8" width="6" height="6" fill="#8fdb8a" />
      </svg>
    ),
    title: <>75% fewer tokens, <span className="soft">measured</span></>,
    note: 'Lean persona layer cuts LLM output size, cost, and latency. One SKILL.md, mode-filtered (lite/full/ultra), zero drift across hosts.',
  },
];

const NEWS = [
  { tag: 'Release', title: 'Prompt-Studio v1.0: the workbench + the layer, one repo', blurb: 'Analyze, score, optimize, and ship a persona that follows your agent across seven hosts.' },
  { tag: 'Lean', title: 'Lean intensity levels: lite / full / ultra', blurb: 'One SKILL.md, three payloads. Ultra for long agentic sessions, lite for cost-sensitive calls.' },
  { tag: 'Benchmark', title: 'Measuring what a persona actually costs', blurb: 'LOC, tokens, USD, latency across five arms. Anthropic + OpenAI + Gemini + Ollama backends.' },
  { tag: 'MCP', title: 'lean-mcp: same rules, prompt-menu injection', blurb: 'Stdio server for hosts whose only hook is the prompt menu. Zero drift with the FastAPI adapters.' },
];

export default function Landing() {
  return (
    <Shell>
      {/* Hero */}
      <section className="d-container" style={{ padding: '80px 32px 40px', position: 'relative', minHeight: '70vh' }}>
        <div style={{ maxWidth: 720 }}>
          <h1 className="font-display d-hero-h">
            The Lean Prompt<br />Workbench
          </h1>
          <p style={{ marginTop: 28, maxWidth: 460, fontSize: 15, lineHeight: 1.55, color: 'var(--d-ink-soft)' }}>
            We build the tooling and the persona layer that make LLM output shorter, cheaper, and closer to what you actually meant.
          </p>
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/studio" className="d-cta">Launch Studio</Link>
            <a href="https://pypi.org/project/promptstudio-ai/" target="_blank" rel="noopener" className="d-cta-ghost">Install from PyPI</a>
            <Coord x="47.6" y="57.2" />
          </div>
          <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--d-dark)', color: 'var(--d-dark-ink)', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12 }}>
            <span style={{ color: 'var(--d-ink-mute)' }}>$</span>
            <span>pip install promptstudio-ai</span>
          </div>
        </div>
        {/* Corner cross */}
        <div style={{ position: 'absolute', right: 40, top: '30%', transform: 'scale(6)', transformOrigin: 'top right', color: 'var(--d-accent)' }}>
          <Logo size={48} color="var(--d-accent)" />
        </div>
        {/* Diagonal hairline */}
        <svg style={{ position: 'absolute', right: 260, top: 60, pointerEvents: 'none' }} width="600" height="500" viewBox="0 0 600 500" fill="none" aria-hidden>
          <line x1="600" y1="0" x2="0" y2="500" stroke="var(--d-line)" strokeWidth="1" />
        </svg>
      </section>

      <hr className="d-hairline" />

      {/* Feature strip (screenshot 2) */}
      <section>
        {FEATURES.map((f, i) => (
          <div key={f.id} style={{ borderTop: i === 0 ? 0 : '1px solid var(--d-line)', padding: '80px 0' }}>
            <div className="d-container" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 220px', gap: 40, alignItems: 'center' }}>
              <div>{f.icon}</div>
              <h2 className="font-display d-feature-h">{f.title}</h2>
              <div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--d-ink-soft)', marginBottom: 14 }}>{f.note}</p>
                <span className="d-coord">{f.id}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Product intro (screenshot 3) */}
      <section className="d-section">
        <div className="d-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <Coord prefix="/D.01" x="34.6" y="70.2" />
            </div>
            <h2 className="font-display" style={{ fontSize: 'clamp(40px, 5vw, 60px)', lineHeight: 1.05, letterSpacing: '-0.025em' }}>
              <span className="soft" style={{ color: 'var(--d-ink-mute)' }}>Introducing </span>The<br />
              Prompt Studio<br />
              Optimization Stack
            </h2>
            <p style={{ marginTop: 24, maxWidth: 480, fontSize: 15, lineHeight: 1.55, color: 'var(--d-ink-soft)' }}>
              Analyze scores, token counts, and context-window fit across GPT, Claude, Gemini, Llama, Mistral, and DeepSeek. Optimize with rule-based passes, compress with filler-token stripping. Persist every run to PostgreSQL with pgvector semantic search.
            </p>
            <div style={{ marginTop: 32 }}>
              <Link href="/features" className="d-cta">Learn more</Link>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <StackGraphic />
            <div style={{ position: 'absolute', bottom: -30, right: 20 }}>
              <Coord x="91.7" y="54.0" />
            </div>
          </div>
        </div>
      </section>

      {/* Two-column product cards (screenshot 4) */}
      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 60, alignItems: 'stretch' }}>
          <ProductCard
            marker="/C.02"
            initial="L"
            title="LEAN"
            subtitle="Persona Layer"
            image={<LeanArt />}
            headline="One SKILL.md that follows your agent everywhere."
            body="Ships as a Claude Code plugin, a Codex adapter, a Copilot CLI plugin, a Devin plugin, a Qoder ruleset, and instruction files for Cursor / Windsurf / Cline / Kiro. Same source of truth, filtered per intensity."
            cta="Explore Lean"
            href="/lean"
          />
          <div style={{ background: 'var(--d-line)' }} />
          <ProductCard
            marker="/C.03"
            initial="M"
            title="LEAN-MCP"
            subtitle="Prompt-Menu Server"
            image={<McpArt />}
            headline="The only prompt-menu MCP for the Lean ruleset in production."
            body="Standalone stdio server for MCP hosts whose only injection point is the prompt menu. Zero drift with the FastAPI adapters · both call the same get_lean_instructions()."
            cta="See MCP"
            href="/mcp"
          />
        </div>
        <div className="d-container" style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <Coord x="71.0" y="60.4" />
        </div>
      </section>

      {/* News row (screenshot 5) */}
      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 40 }}>
            <h3 className="font-display" style={{ fontSize: 40, letterSpacing: '-0.02em' }}>Latest</h3>
            <Link href="/features" className="d-coord">All updates →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {NEWS.map(n => (
              <article key={n.title}>
                <div style={{ background: 'var(--d-bg-alt)', aspectRatio: '4/3', marginBottom: 18, border: '1px solid var(--d-line)' }} />
                <div className="d-coord" style={{ marginBottom: 8 }}>{n.tag}</div>
                <h4 style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.35, marginBottom: 10 }}>{n.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--d-ink-soft)', lineHeight: 1.5, marginBottom: 14 }}>{n.blurb}</p>
                <Link href="/features" className="d-coord">Read more →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function StackGraphic() {
  return (
    <svg width="360" height="320" viewBox="0 0 360 320" fill="none" aria-hidden>
      <defs>
        <pattern id="mesh" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#8a879a" strokeWidth="0.4" />
        </pattern>
      </defs>
      {[0, 1, 2, 3].map(i => {
        const y = 220 - i * 40;
        const w = 220 - i * 20;
        const x = 70 + i * 10;
        return (
          <g key={i}>
            <polygon
              points={`${x},${y} ${x + w},${y} ${x + w - 40},${y - 30} ${x - 40},${y - 30}`}
              fill="#b8b3c6"
              stroke="#5f5a70"
              strokeWidth="1"
            />
            <rect x={x - 40} y={y - 30} width={w} height="30" fill="url(#mesh)" opacity="0.5" />
          </g>
        );
      })}
    </svg>
  );
}

function ProductCard({
  marker, initial, title, subtitle, image, headline, body, cta, href,
}: {
  marker: string; initial: string; title: string; subtitle: string;
  image: React.ReactNode; headline: string; body: string; cta: string; href: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 46, height: 56, border: '1px solid var(--d-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--d-accent)', fontFamily: 'var(--font-manrope), sans-serif', fontSize: 28, fontWeight: 700 }}>
          {initial}
        </div>
        <div style={{ paddingTop: 4 }}>
          <div className="d-coord" style={{ marginBottom: 8 }}>{marker}</div>
          <div className="font-mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--d-ink)' }}>{title}</div>
          <div className="font-mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--d-ink-mute)' }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ marginBottom: 28, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--d-bg-alt)' }}>
        {image}
      </div>
      <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--d-ink)', marginBottom: 14 }}>
        {headline}
      </div>
      <p style={{ fontSize: 14, color: 'var(--d-ink-soft)', lineHeight: 1.55, marginBottom: 24 }}>{body}</p>
      <div>
        <Link href={href} className="d-cta-ghost">{cta}</Link>
      </div>
    </div>
  );
}

function LeanArt() {
  return (
    <svg width="220" height="180" viewBox="0 0 220 180" fill="none" aria-hidden>
      <rect x="0" y="0" width="220" height="180" fill="#e5decf" />
      <g opacity="0.85">
        <rect x="20" y="20" width="60" height="80" fill="#7a7788" />
        <rect x="90" y="40" width="50" height="60" fill="#3f4e6b" />
        <rect x="150" y="20" width="50" height="80" fill="#2b3446" />
        <circle cx="60" cy="130" r="12" fill="#a4c8b4" />
        <circle cx="120" cy="140" r="8" fill="#c9a227" />
        <circle cx="170" cy="130" r="10" fill="#8b9bc8" />
      </g>
    </svg>
  );
}

function McpArt() {
  return (
    <svg width="220" height="180" viewBox="0 0 220 180" fill="none" aria-hidden>
      <rect x="0" y="0" width="220" height="180" fill="#efe8db" />
      <g>
        <rect x="20" y="30" width="90" height="60" fill="#c9b8a8" />
        <rect x="110" y="10" width="90" height="80" fill="#8a7d6c" />
        <rect x="30" y="100" width="80" height="60" fill="#e6c7a3" />
        <rect x="120" y="100" width="80" height="60" fill="#a49484" />
        <text x="110" y="90" textAnchor="middle" fill="#0d0d0d" fontFamily="var(--font-manrope), sans-serif" fontSize="14" fontWeight="600">studio</text>
      </g>
    </svg>
  );
}
