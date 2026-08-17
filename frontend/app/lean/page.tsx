import Link from 'next/link';
import Shell from '@/components/marketing/Shell';
import PageHero from '@/components/marketing/PageHero';

const INTENSITIES = [
  { level: 'lite', when: 'Minimum payload · small models, tight context, cost-sensitive calls.' },
  { level: 'full', when: 'Default · production balance of guidance and payload.' },
  { level: 'ultra', when: 'Maximum guidance · long agentic sessions with over-build risk.' },
];

const HOSTS = [
  ['Claude Code', 'Plugin · /plugin install prompt-studio@prompt-studio'],
  ['Codex', 'Plugin · codex plugin add prompt-studio@prompt-studio'],
  ['GitHub Copilot CLI', 'Plugin · copilot plugin install prompt-studio@prompt-studio'],
  ['Devin CLI', 'Plugin · devin plugins install utk2103/Prompt-Studio'],
  ['Qoder', 'Rules · .qoder/rules + hooks/qoder-hooks.json'],
  ['Cursor / Windsurf / Cline / Kiro / Zed', 'Rules file drop into host rules directory'],
  ['JetBrains / VS Code Copilot Chat / Amp / Jules / CodeWhale / Antigravity', 'AGENTS.md at repo root'],
];

export default function LeanPage() {
  return (
    <Shell>
      <PageHero
        eyebrow="/LEAN [X 08.4, Y 12.6]"
        title={<><span style={{ color: 'var(--d-ink-mute)' }}>The persona layer </span>your agent already speaks.</>}
        subtitle="One SKILL.md. Filtered per intensity by get_lean_instructions(mode) and injected in the system slot by per-provider adapters with Anthropic prompt-cache markers. Cuts LLM output size, cost, and latency · measured, not implied."
        coordX="08.4"
        coordY="12.6"
      />

      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div className="d-coord" style={{ marginBottom: 14 }}>/L.01 One source of truth</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: 20 }}>
              skills/lean/SKILL.md · <span style={{ color: 'var(--d-ink-mute)' }}>read once, shipped everywhere</span>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--d-ink-soft)', lineHeight: 1.55 }}>
              The plugin, MCP server, benchmark arms, and FastAPI adapters all read the same file. Bump it once · everything downstream picks it up. The system slot is marked <code style={{ background: 'var(--d-bg-alt)', padding: '2px 6px' }}>cache_control: ephemeral</code>, so the persona charges once per Anthropic prompt-cache TTL, not per turn.
            </p>
          </div>
          <pre style={{ background: 'var(--d-dark)', color: 'var(--d-dark-ink)', padding: 24, fontSize: 12, lineHeight: 1.6, overflow: 'auto', fontFamily: 'var(--font-jetbrains), monospace' }}>
{`from app.services.formats import build_messages

msgs = build_messages(
  text="Write a Python function that validates emails.",
  model_id="claude-3-5",
  intensity="full",   # "lite" | "full" | "ultra"
)
# msgs[0] → system slot with LEAN + cache_control: ephemeral
# msgs[1] → user turn`}
          </pre>
        </div>
      </section>

      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container">
          <div className="d-coord" style={{ marginBottom: 14 }}>/L.02 Intensity</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.025em', marginBottom: 40 }}>
            Three payloads, one file.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {INTENSITIES.map(i => (
              <div key={i.level} className="d-card">
                <div className="font-display" style={{ fontSize: 48, marginBottom: 12 }}>{i.level}</div>
                <p style={{ fontSize: 14, color: 'var(--d-ink-soft)', lineHeight: 1.55 }}>{i.when}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container">
          <div className="d-coord" style={{ marginBottom: 14 }}>/L.03 Hosts</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.025em', marginBottom: 32 }}>
            Ships across every major agent host.
          </h2>
          <div style={{ border: '1px solid var(--d-line)' }}>
            {HOSTS.map(([host, how], i) => (
              <div key={host} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', padding: '18px 24px', borderTop: i === 0 ? 0 : '1px solid var(--d-line)', alignItems: 'baseline' }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{host}</div>
                <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: 'var(--d-ink-soft)' }}>{how}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
            <Link href="/mcp" className="d-cta-ghost">MCP server →</Link>
            <Link href="https://github.com/utk2103/Prompt-Studio" className="d-cta">Install</Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
