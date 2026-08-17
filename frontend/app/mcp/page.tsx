import Link from 'next/link';
import Shell from '@/components/marketing/Shell';
import PageHero from '@/components/marketing/PageHero';

export default function McpPage() {
  return (
    <Shell>
      <PageHero
        eyebrow="/MCP [X 34.2, Y 40.8]"
        title={<><span style={{ color: 'var(--d-ink-mute)' }}>lean-mcp — </span>same rules, prompt-menu injection.</>}
        subtitle="A standalone MCP stdio server that serves the Lean ruleset for hosts whose only injection point is the prompt menu. Zero drift with the FastAPI adapters — both call get_lean_instructions()."
        coordX="34.2"
        coordY="40.8"
      />

      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
          <div>
            <div className="d-coord" style={{ marginBottom: 14 }}>/M.01 Install</div>
            <h3 className="font-display" style={{ fontSize: 36, marginBottom: 20, letterSpacing: '-0.02em' }}>Two lines.</h3>
            <pre style={{ background: 'var(--d-dark)', color: 'var(--d-dark-ink)', padding: 20, fontSize: 12, lineHeight: 1.6, fontFamily: 'var(--font-jetbrains), monospace' }}>
{`cd lean-mcp && pip install -e .
python server.py`}
            </pre>
          </div>
          <div>
            <div className="d-coord" style={{ marginBottom: 14 }}>/M.02 Client config</div>
            <h3 className="font-display" style={{ fontSize: 36, marginBottom: 20, letterSpacing: '-0.02em' }}>One JSON block.</h3>
            <pre style={{ background: 'var(--d-dark)', color: 'var(--d-dark-ink)', padding: 20, fontSize: 12, lineHeight: 1.6, fontFamily: 'var(--font-jetbrains), monospace' }}>
{`{
  "mcpServers": {
    "lean": {
      "command": "python",
      "args": ["lean-mcp/server.py"]
    }
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      <section className="d-section" style={{ borderTop: '1px solid var(--d-line)' }}>
        <div className="d-container">
          <div className="d-coord" style={{ marginBottom: 14 }}>/M.03 Surface</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.025em', marginBottom: 32 }}>
            One prompt, one tool.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="d-card">
              <div className="d-coord" style={{ marginBottom: 10 }}>prompt</div>
              <div className="font-display" style={{ fontSize: 40, marginBottom: 12 }}>lean</div>
              <p style={{ fontSize: 14, color: 'var(--d-ink-soft)', lineHeight: 1.55 }}>
                Accepts <code>mode</code> (lite/full/ultra). Returns the persona for the requested intensity.
              </p>
            </div>
            <div className="d-card">
              <div className="d-coord" style={{ marginBottom: 10 }}>tool</div>
              <div className="font-display" style={{ fontSize: 40, marginBottom: 12 }}>lean_instructions</div>
              <p style={{ fontSize: 14, color: 'var(--d-ink-soft)', lineHeight: 1.55 }}>
                Callable from the model. Same mode parameter, same output.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
            <Link href="/lean" className="d-cta-ghost">← Lean layer</Link>
            <Link href="/studio" className="d-cta">Launch Studio</Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
