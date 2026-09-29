'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AppState, ModeType } from '@/lib/types';
import { scoreLocal } from '@/lib/scoring';
import { tok } from '@/lib/utils';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  onSend: (text: string) => void;
  onOptimize: () => void;
  onCompress: () => void;
  onWizard: () => void;
  busy: boolean;
}

const MODES: ModeType[] = ['TECHNICAL', 'CREATIVE', 'SYSTEM'];

function ChevIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function Chip({ label, value, tint, onClick, title }: { label: string; value: string; tint?: string; onClick?: () => void; title?: string }) {
  const clickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '4px 10px',
        border: '1px solid var(--d-line)', background: 'var(--d-bg)',
        fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10.5,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--d-ink-mute)', cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <span>{label}</span>
      <span style={{ color: tint || 'var(--d-ink)', fontWeight: 600 }}>{value}</span>
    </button>
  );
}

const TINT = (v: number) => (v >= 75 ? '#5b8f3d' : v >= 50 ? '#c9a227' : '#c8342a');

export default function Composer({ state, update, onSend, onOptimize, onCompress, onWizard, busy }: Props) {
  const [draft, setDraft] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const model = state.models.find(m => m.id === state.model) || state.models[1];
  const t = tok(draft);
  const ctxPct = model ? (t / model.context) * 100 : 0;
  const live = draft.trim() ? scoreLocal(draft, state.mode) : null;

  // sync composer draft back to app state so chips/drawer reflect the live text
  useEffect(() => { update({ prompt: draft }); /* eslint-disable-line */ }, [draft]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    const h = Math.min(Math.max(el.scrollHeight, 46), 220);
    el.style.height = h + 'px';
    el.style.overflowY = el.scrollHeight > 220 ? 'auto' : 'hidden';
  }, [draft]);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setModelOpen(false);
        setModeOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    onSend(text);
    setDraft('');
  };

  const canSend = !!draft.trim() && !busy;

  return (
    <div ref={wrapRef} style={{ position: 'relative', borderTop: '1px solid var(--d-line)', background: 'var(--d-bg-alt)', padding: '14px 20px' }}>
      {/* inspector chips: all four render at rest; Score is disabled until there's a draft to score */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        <Chip label="Tokens" value={String(t)} tint={ctxPct > 80 ? '#c8342a' : undefined} title="Inspect token usage" onClick={() => update({ view: 'TOKENS' })} />
        <Chip label="Ctx" value={model ? `${ctxPct.toFixed(1)}%` : '—'} tint={ctxPct > 80 ? '#c8342a' : undefined} title="Inspect context fit" onClick={() => update({ view: 'CONTEXT' })} />
        <Chip label="Score" value={live ? `${live.overall}` : '—'} tint={live ? TINT(live.overall) : undefined}
          title={live ? 'Open score breakdown' : 'Type a prompt to score'}
          onClick={live ? () => update({ view: 'SCORE' }) : undefined} />
        <Chip label="Models" value={model?.format || '—'} title="Model compatibility" onClick={() => update({ view: 'MODELS' })} />
      </div>

      {/* composer box */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', border: '1px solid var(--d-line)', background: 'var(--d-bg)', padding: 10 }}>
        {/* mode picker */}
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => { setModelOpen(false); setModeOpen(o => !o); }}
            style={pillBtn(modeOpen)} title="Mode">
            {state.mode} <span style={{ color: 'var(--d-ink-mute)' }}><ChevIcon /></span>
          </button>
          {modeOpen && (
            <div style={menu()}>
              {MODES.map(m => (
                <button key={m} type="button" onClick={() => { update({ mode: m }); setModeOpen(false); }} style={menuItem(m === state.mode)}>{m}</button>
              ))}
            </div>
          )}
        </div>

        {/* model picker */}
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => { setModeOpen(false); setModelOpen(o => !o); }}
            style={pillBtn(modelOpen)} title="Model">
            {model?.name || 'Model'} <span style={{ color: 'var(--d-ink-mute)' }}><ChevIcon /></span>
          </button>
          {modelOpen && (
            <div style={{ ...menu(), minWidth: 200 }}>
              {state.models.map(m => (
                <button key={m.id} type="button" onClick={() => { update({ model: m.id }); setModelOpen(false); }} style={menuItem(m.id === state.model)}>
                  <span>{m.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--d-ink-mute)', marginLeft: 8 }}>{m.format}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Message the studio…  (Shift+Enter for newline)"
          style={{
            flex: 1, minHeight: 46, resize: 'none', background: 'transparent',
            color: 'var(--d-ink)', border: 0, outline: 'none',
            fontFamily: 'var(--font-manrope), sans-serif', fontSize: 14, lineHeight: 1.5,
            padding: '10px 4px',
          }}
        />

        {/* actions: draft tools are labeled, not bare glyphs */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button type="button" onClick={onWizard} disabled={busy} style={actionBtn()} title="Build a prompt with the guided wizard">
            ✧ Wizard
          </button>
          <button type="button" onClick={onOptimize} disabled={busy || !draft.trim()} style={actionBtn()} title="Optimize the current draft">
            ↑ Optimize
          </button>
          <button type="button" onClick={onCompress} disabled={busy || !draft.trim()} style={actionBtn()} title="Compress the current draft">
            ≡ Compress
          </button>
          <button type="button" onClick={send} disabled={!canSend} title="Analyze — send prompt (Enter)" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, marginLeft: 4,
            background: canSend ? 'var(--d-accent)' : 'var(--d-line)',
            color: canSend ? '#fff' : 'var(--d-ink-mute)',
            border: 0, cursor: canSend ? 'pointer' : 'not-allowed',
          }}>
            <SendIcon />
          </button>
        </div>
      </div>

      <div style={{ marginTop: 6, fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, color: 'var(--d-ink-mute)', letterSpacing: '0.14em' }}>
        {busy ? 'WORKING…' : 'ENTER TO SEND · SHIFT+ENTER FOR NEWLINE'}
      </div>
    </div>
  );
}

function pillBtn(open: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 10px', border: '1px solid var(--d-line)',
    background: open ? 'var(--d-bg-alt)' : 'transparent',
    color: 'var(--d-ink)', cursor: 'pointer',
    fontFamily: 'var(--font-jetbrains), monospace',
    fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
  };
}
function menu(): React.CSSProperties {
  return {
    position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 20,
    minWidth: 140, background: 'var(--d-bg)', border: '1px solid var(--d-line)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  };
}
function menuItem(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', width: '100%',
    padding: '8px 12px', border: 0, background: active ? 'var(--d-bg-alt)' : 'transparent',
    color: 'var(--d-ink)', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'var(--font-manrope), sans-serif', fontSize: 13,
  };
}
function actionBtn(): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    height: 28, padding: '0 10px', border: '1px solid var(--d-line)',
    background: 'transparent', color: 'var(--d-ink-mute)', cursor: 'pointer',
    fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10.5,
    letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap',
  };
}
