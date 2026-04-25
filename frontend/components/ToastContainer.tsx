'use client';

import type { Toast } from '@/lib/types';

interface Props {
  toasts: Toast[];
}

const STYLES: Record<string, React.CSSProperties> = {
  ok: { color: '#33ff66', borderColor: '#00cc44', background: '#010f01' },
  err: { color: '#ff4444', borderColor: '#ff4444', background: '#1a0000' },
  warn: { color: '#ffcc00', borderColor: '#554400', background: '#0f0f00' },
  info: { color: '#00ccff', borderColor: '#003355', background: '#00111a' },
};

export default function ToastContainer({ toasts }: Props) {
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast-animate"
          style={{ padding: '7px 13px', border: '1px solid', fontSize: 11, letterSpacing: '.3px', pointerEvents: 'auto', ...STYLES[t.type] }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
