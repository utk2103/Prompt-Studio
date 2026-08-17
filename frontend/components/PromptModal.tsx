'use client';

import { useEffect, useMemo, useState } from 'react';

interface Props {
  title: string;
  prompt: string;
  original?: string;
  onClose: () => void;
  onCopy?: () => void;
}

type Size = 'normal' | 'large' | 'dock';
type Row = { t: 'ctx' | 'add' | 'del'; line: string };

// LCS line diff. Enough for prompt optimize/compress where most edits are
// append/replace, not shuffle. Not word-level.
function diffLines(a: string, b: string): Row[] {
  const A = a.split('\n'), B = b.split('\n');
  const m = A.length, n = B.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Row[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) { out.push({ t: 'ctx', line: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: 'del', line: A[i++] }); }
    else { out.push({ t: 'add', line: B[j++] }); }
  }
  while (i < m) out.push({ t: 'del', line: A[i++] });
  while (j < n) out.push({ t: 'add', line: B[j++] });
  return out;
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, background: 'transparent',
        border: '1px solid var(--d-line)', color: 'var(--d-ink-mute)',
        cursor: 'pointer', padding: 0,
      }}
    >{children}</button>
  );
}

export default function PromptModal({ title, prompt, original, onClose, onCopy }: Props) {
  const [size, setSize] = useState<Size>('normal');
  const [view, setView] = useState<'diff' | 'raw'>(original ? 'diff' : 'raw');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = useMemo(() => (original ? diffLines(original, prompt) : []), [original, prompt]);
  const stats = useMemo(() => {
    let add = 0, del = 0;
    for (const r of rows) { if (r.t === 'add') add++; else if (r.t === 'del') del++; }
    return { add, del };
  }, [rows]);

  const copy = () => {
    navigator.clipboard.writeText(prompt).catch(() => {});
    onCopy?.();
  };

  const shell: React.CSSProperties =
    size === 'dock'
      ? {
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(560px, 55vw)',
          background: 'var(--d-bg)', border: 0, borderLeft: '1px solid var(--d-line)',
          display: 'flex', flexDirection: 'column', zIndex: 1001,
          boxShadow: '-14px 0 40px rgba(0,0,0,0.15)',
        }
      : size === 'large'
      ? {
          background: 'var(--d-bg)', border: '1px solid var(--d-line)',
          width: 'min(1200px, 95vw)', height: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }
      : {
          background: 'var(--d-bg)', border: '1px solid var(--d-line)',
          width: 'min(760px, 100%)', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        };

  const overlay: React.CSSProperties =
    size === 'dock'
      ? { position: 'fixed', inset: 0, background: 'transparent', pointerEvents: 'none', zIndex: 1000 }
      : {
          position: 'fixed', inset: 0, background: 'rgba(13,13,13,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24,
        };

  const body = (
    <div
      onClick={e => e.stopPropagation()}
      style={{ ...shell, pointerEvents: 'auto' }}
    >
      {/* header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px', borderBottom: '1px solid var(--d-line)', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
          <span className="d-coord" style={{ whiteSpace: 'nowrap' }}>/{title.toUpperCase()}</span>
          {original && (
            <span style={{
              fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11,
              color: 'var(--d-ink-mute)',
            }}>
              <span style={{ color: '#3fb950' }}>+{stats.add}</span>{' '}
              <span style={{ color: '#f85149' }}>-{stats.del}</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {original && (
            <button
              onClick={() => setView(v => (v === 'diff' ? 'raw' : 'diff'))}
              title={view === 'diff' ? 'Show plain' : 'Show diff'}
              style={{
                padding: '4px 10px', height: 28, border: '1px solid var(--d-line)',
                background: 'transparent',
                fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10.5,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--d-ink-mute)', cursor: 'pointer',
              }}
            >{view === 'diff' ? 'Raw' : 'Diff'}</button>
          )}
          <IconBtn label="Normal size" onClick={() => setSize('normal')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
          </IconBtn>
          <IconBtn label="Fullscreen" onClick={() => setSize('large')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 3h6M3 3v6M21 3h-6M21 3v6M3 21h6M3 21v-6M21 21h-6M21 21v-6" /></svg>
          </IconBtn>
          <IconBtn label="Dock right" onClick={() => setSize('dock')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="16" rx="1" /><line x1="14" y1="4" x2="14" y2="20" /></svg>
          </IconBtn>
          <IconBtn label="Close" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
          </IconBtn>
        </div>
      </div>

      {/* body */}
      {view === 'diff' && original ? (
        <div style={{
          flex: 1, minHeight: 240, overflow: 'auto',
          background: 'var(--d-bg-alt)', borderBottom: '1px solid var(--d-line)',
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 12.5, lineHeight: 1.55,
        }}>
          {rows.map((r, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid', gridTemplateColumns: '20px 1fr',
                background:
                  r.t === 'add' ? 'rgba(63,185,80,0.12)' :
                  r.t === 'del' ? 'rgba(248,81,73,0.12)' : 'transparent',
                color: 'var(--d-ink)',
              }}
            >
              <span style={{
                textAlign: 'center', userSelect: 'none',
                color:
                  r.t === 'add' ? '#3fb950' :
                  r.t === 'del' ? '#f85149' : 'var(--d-ink-mute)',
              }}>
                {r.t === 'add' ? '+' : r.t === 'del' ? '-' : ' '}
              </span>
              <span style={{ paddingRight: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {r.line || ' '}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <textarea
          readOnly
          value={prompt}
          style={{
            flex: 1, minHeight: 240, resize: 'none',
            background: 'var(--d-bg-alt)', color: 'var(--d-ink)',
            border: 0, borderBottom: '1px solid var(--d-line)',
            padding: '16px 20px', fontSize: 14, lineHeight: 1.6,
            fontFamily: 'var(--font-manrope), sans-serif', outline: 'none',
          }}
        />
      )}

      {/* footer */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 8,
        padding: '12px 18px',
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
  );

  return (
    <div
      onClick={size === 'dock' ? undefined : onClose}
      style={overlay}
    >
      {body}
    </div>
  );
}
