import Link from 'next/link';
import Logo from './Logo';
import Coord from './Coord';

const COLS: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/studio', label: 'Studio' },
      { href: '/models', label: 'Models' },
    ],
  },
  {
    heading: 'Layer',
    links: [
      { href: '/lean', label: 'Lean' },
      { href: '/mcp', label: 'MCP' },
      { href: 'https://github.com/utk2103/Prompt-Studio', label: 'Benchmarks' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: 'https://github.com/utk2103/Prompt-Studio', label: 'GitHub' },
      { href: '/features#api', label: 'Docs' },
      { href: 'https://github.com/utk2103/Prompt-Studio/blob/main/LICENSE', label: 'License' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="d-footer">
      <div className="d-container" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40, padding: '80px 32px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ opacity: 0.9, transform: 'scale(3.2)', transformOrigin: 'top left', marginLeft: 20, marginTop: 20 }}>
            <Logo size={40} color="#f2ede4" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {COLS.map(col => (
            <div key={col.heading}>
              <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.2em', color: '#8a857c', textTransform: 'uppercase', marginBottom: 18 }}>
                {col.heading}
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, listStyle: 'none' }}>
                {col.links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid #2a2a2c', marginTop: 60 }}>
        <div className="d-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a857c' }}>
          <span>PROMPT-STUDIO · 2026</span>
          <Coord x="02.3" y="80.4" />
          <span>Apache 2.0 · Built with love</span>
        </div>
      </div>
    </footer>
  );
}
