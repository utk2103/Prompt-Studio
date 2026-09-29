'use client';

import type { AppState, Issue, ScoreResult } from '@/lib/types';

export interface ChatMessage {
  id: string;
  ts: number;
  role: 'user' | 'assistant' | 'wizard';
  text: string;
  // assistant analysis attachments
  scores?: ScoreResult | null;
  issues?: Issue[];
  model_id?: string;
  mode?: string;
  // wizard-only
  wizardOptions?: string[];
  wizardQid?: string;
  onWizardPick?: (answer: string) => void;
  wizardDone?: boolean;
}

interface Props {
  msg: ChatMessage;
  state: AppState;
  update: (p: Partial<AppState>) => void;
}

const TINT = (v: number) => (v >= 75 ? '#5b8f3d' : v >= 50 ? '#c9a227' : '#c8342a');

function Chip({ label, value, tint, onClick }: { label: string; value: string; tint?: string; onClick?: () => void }) {
  const clickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '3px 8px',
        border: '1px solid var(--d-line)', background: 'var(--d-bg)',
        fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--d-ink-mute)', cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <span>{label}</span>
      <span style={{ color: tint || 'var(--d-ink)', fontWeight: 600 }}>{value}</span>
    </button>
  );
}

export default function Message({ msg, state, update }: Props) {
  const isUser = msg.role === 'user';
  const align = isUser ? 'flex-end' : 'flex-start';
  const bg = isUser ? 'var(--d-bg-alt)' : 'var(--d-bg)';
  const border = isUser ? '1px solid var(--d-line)' : '1px solid var(--d-line)';
  const time = new Date(msg.ts);
  const tStr = String(time.getHours()).padStart(2, '0') + ':' + String(time.getMinutes()).padStart(2, '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, gap: 6 }}>
      <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, letterSpacing: '0.14em', color: 'var(--d-ink-mute)' }}>
        {msg.role === 'wizard' ? 'WIZARD' : msg.role.toUpperCase()} · {tStr}
      </div>

      <div style={{
        maxWidth: '78%', padding: '14px 18px',
        background: bg, border, color: 'var(--d-ink)',
        fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap',
        fontFamily: 'var(--font-manrope), sans-serif',
      }}>
        {msg.text}
      </div>

      {/* assistant analysis chips */}
      {msg.role === 'assistant' && msg.scores && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip label="Score" value={`${msg.scores.overall}`} tint={TINT(msg.scores.overall)} onClick={() => update({ view: 'SCORE' })} />
          <Chip label="Grade" value={msg.scores.grade} onClick={() => update({ view: 'SCORE' })} />
          {msg.model_id && <Chip label="Model" value={state.models.find(m => m.id === msg.model_id)?.name || msg.model_id} onClick={() => update({ view: 'MODELS' })} />}
          {msg.mode && <Chip label="Mode" value={msg.mode} />}
          <Chip label="Tokens" value={String(state.models.find(m => m.id === (msg.model_id || state.model))?.context ? Math.ceil((msg.text.length) / 4) : 0)} onClick={() => update({ view: 'TOKENS' })} />
          {msg.issues && msg.issues.length > 0 && (
            <Chip
              label="Issues"
              value={String(msg.issues.length)}
              tint={msg.issues.some(i => i.t === 'ERR') ? '#c8342a' : '#c9a227'}
              onClick={() => update({ view: 'SCORE' })}
            />
          )}
        </div>
      )}

      {/* wizard option chips */}
      {msg.role === 'wizard' && !msg.wizardDone && msg.wizardOptions && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: '78%' }}>
          {msg.wizardOptions.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => msg.onWizardPick?.(opt)}
              style={{
                padding: '8px 14px', border: '1px solid var(--d-line)',
                background: 'var(--d-bg)', color: 'var(--d-ink)', cursor: 'pointer',
                fontFamily: 'var(--font-manrope), sans-serif', fontSize: 13,
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--d-accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--d-line)'; }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
