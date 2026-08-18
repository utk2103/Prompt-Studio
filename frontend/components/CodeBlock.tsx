'use client';

import { useCallback, useEffect, useState } from 'react';

interface Props {
  code: string;
  filename?: string;
  language?: string;
  stream?: boolean;      // reveal line-by-line, then hold; default true when >1 line
  lineMs?: number;
  holdMs?: number;
}

const DEFAULT_LINE_MS = 240;
const DEFAULT_HOLD_MS = 3200;

export default function CodeBlock({
  code,
  filename = 'snippet',
  language = 'shell',
  stream,
  lineMs = DEFAULT_LINE_MS,
  holdMs = DEFAULT_HOLD_MS,
}: Props) {
  const lines = code.replace(/\n$/, '').split('\n');
  const doStream = stream ?? lines.length > 1;
  const [count, setCount] = useState(doStream ? 0 : lines.length);
  const [copied, setCopied] = useState(false);
  const done = count >= lines.length;

  useEffect(() => {
    if (!doStream) return;
    const t = setTimeout(
      () => setCount(c => (c >= lines.length ? 0 : c + 1)),
      count === 0 ? 400 : done ? holdMs : lineMs,
    );
    return () => clearTimeout(t);
  }, [count, done, doStream, holdMs, lineMs, lines.length]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      background: 'var(--d-bg-alt)',
      border: '1px solid var(--d-line)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid var(--d-line)',
        background: 'var(--d-bg)',
      }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 12, fontWeight: 500, color: 'var(--d-ink)',
          }}>{filename}</span>
          <span style={{ fontSize: 11.5, color: 'var(--d-ink-mute)' }}>{language}</span>
        </span>
        <button
          aria-label="Copy code"
          onClick={copy}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            height: 24, padding: '0 8px', borderRadius: 4,
            background: 'transparent', border: 0,
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 11.5, fontWeight: 500,
            color: copied ? '#5b8f3d' : 'var(--d-ink-mute)',
            cursor: 'pointer', transition: 'color 100ms',
          }}
        >
          {copied ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre style={{
        margin: 0,
        minHeight: lines.length > 1 ? 137 : 44,
        background: 'var(--d-dark)',
        color: 'var(--d-dark-ink)',
        padding: '10px 14px',
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: 11.5,
        lineHeight: 1.7,
        overflow: 'auto',
      }}>
        {lines.slice(0, count).map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              animation: doStream ? 'fade-up 250ms cubic-bezier(0.23,1,0.32,1) both' : undefined,
            }}
          >
            <span style={{
              width: 20, flexShrink: 0, textAlign: 'right',
              fontSize: 10.5, lineHeight: '1.86',
              color: 'rgba(216,209,198,0.45)',
              userSelect: 'none',
            }}>{i + 1}</span>
            <span style={{ paddingLeft: 10, whiteSpace: 'pre' }}>
              {line || ' '}
              {doStream && i === count - 1 && !done && (
                <span style={{
                  display: 'inline-block',
                  marginLeft: 2, height: 12, width: 3,
                  transform: 'translateY(2px)',
                  borderRadius: 2, background: 'var(--d-accent)',
                }} />
              )}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}
