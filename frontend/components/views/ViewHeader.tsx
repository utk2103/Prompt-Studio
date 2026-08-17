export default function ViewHeader({ marker, title, subtitle }: { marker: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--d-line)' }}>
      <div className="d-coord" style={{ marginBottom: 10 }}>{marker}</div>
      <h1 className="font-display" style={{ fontSize: 42, letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: 8 }}>{title}</h1>
      <p style={{ fontSize: 14, color: 'var(--d-ink-soft)', lineHeight: 1.55, maxWidth: 640 }}>{subtitle}</p>
    </div>
  );
}
