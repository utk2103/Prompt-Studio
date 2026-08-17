'use client';

import { useEffect } from 'react';

interface Props {
  title: string;
  prompt: string;
  onClose: () => void;
  onCopy?: () => void;
}

export default function PromptModal({ title, prompt, onClose, onCopy }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = () => {
    navigator.clipboard.writeText(prompt).catch(() => {});
    onCopy?.();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(13,13,13,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--d-bg)', border: '1px solid var(--d-line)',
          width: 'min(760px, 100%)', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px', borderBottom: '1px solid var(--d-line)',
        }}>
          <span className="d-coord">/{title.toUpperCase()}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent', border: 0, color: 'var(--d-ink-mute)',
              fontSize: 20, cursor: 'pointer', padding: 4, lineHeight: 1,
            }}
          >×</button>
        </div>

        <textarea
          readOnly
          value={prompt}
          style={{
            flex: 1, minHeight: 240, resize: 'none',
            background: 'var(--d-bg-alt)', color: 'var(--d-ink)',
            border: 0, borderBottom: '1px solid var(--d-line)',
            padding: '18px 22px', fontSize: 14, lineHeight: 1.6,
            fontFamily: 'var(--font-manrope), sans-serif', outline: 'none',
          }}
        />

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '14px 22px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', background: 'transparent',
              color: 'var(--d-ink-mute)', border: '1px solid var(--d-line)',
              fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >Close</button>
          <button
            onClick={copy}
            style={{
              padding: '9px 18px', background: 'var(--d-accent)',
              color: '#fff', border: '1px solid var(--d-accent)',
              fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >Copy Prompt</button>
        </div>
      </div>
    </div>
  );
}
