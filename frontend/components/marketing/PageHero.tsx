import Coord from './Coord';

export default function PageHero({
  eyebrow, title, subtitle, coordX, coordY,
}: {
  eyebrow: string; title: React.ReactNode; subtitle: string; coordX: string; coordY: string;
}) {
  return (
    <section className="d-container" style={{ padding: '80px 32px 60px' }}>
      <div className="d-coord" style={{ marginBottom: 20 }}>{eyebrow}</div>
      <h1 className="font-display" style={{ fontSize: 'clamp(44px, 6vw, 84px)', lineHeight: 1.02, letterSpacing: '-0.03em', maxWidth: 900 }}>
        {title}
      </h1>
      <div style={{ marginTop: 28, display: 'flex', gap: 40, alignItems: 'flex-end', maxWidth: 900 }}>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--d-ink-soft)', maxWidth: 560 }}>{subtitle}</p>
        <div style={{ marginLeft: 'auto' }}><Coord x={coordX} y={coordY} /></div>
      </div>
    </section>
  );
}
