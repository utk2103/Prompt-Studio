'use client';

import Link from 'next/link';
import Logo from './Logo';

const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/lean', label: 'Lean Layer' },
  { href: '/mcp', label: 'MCP' },
  { href: '/models', label: 'Models' },
  { href: '/studio', label: 'Studio' },
];

export default function Nav() {
  return (
    <>
      <div className="d-topbar">
        <a href="https://pypi.org/project/promptstudio-ai/" target="_blank" rel="noopener" style={{ color: 'inherit' }}>
          Prompt Studio v1.0 is live on PyPI · pip install promptstudio-ai
        </a>
      </div>
      <nav className="d-nav">
        <div className="d-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--d-accent)' }}>
            <Logo />
            <span className="font-display" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>prompt-studio</span>
          </Link>
          <div style={{ display: 'flex', gap: 4 }}>
            {LINKS.map(l => (
              <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
            ))}
          </div>
          <Link href="/studio" className="d-cta-ghost">Launch Studio</Link>
        </div>
      </nav>
    </>
  );
}
