'use client';

import type { Toast } from '@/lib/types';

const STYLES: Record<string, React.CSSProperties> = {
  ok:   { color: '#0d0d0d', background: '#e5f0d2', borderColor: '#9ab871' },
  err:  { color: '#ffffff', background: '#c8342a', borderColor: '#8b1a12' },
  warn: { color: '#0d0d0d', background: '#f2d382', borderColor: '#c9a227' },
  info: { color: '#ffffff', background: '#2a3bff', borderColor: '#1a2be6' },
};

export default function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast-animate"
          style={{
            padding: '12px 18px',
            border: '1px solid',
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: 13,
            letterSpacing: '-0.01em',
            pointerEvents: 'auto',
            minWidth: 240,
            ...STYLES[t.type],
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
