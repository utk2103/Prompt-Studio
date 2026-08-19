'use client';

import type { AppState, ViewType } from '@/lib/types';
import Score from '@/components/views/Score';
import Tokens from '@/components/views/Tokens';
import Context from '@/components/views/Context';
import Models from '@/components/views/Models';

interface Props {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  onClose: () => void;
}

const TITLES: Partial<Record<ViewType, string>> = {
  SCORE: 'Score breakdown',
  TOKENS: 'Token usage',
  CONTEXT: 'Context fit',
  MODELS: 'Model compatibility',
};

export default function DetailDrawer({ state, update, onClose }: Props) {
  const view = state.view;
  if (!TITLES[view]) return null;

  const body = (() => {
    switch (view) {
      case 'SCORE': return <Score state={state} />;
      case 'TOKENS': return <Tokens state={state} update={update} />;
      case 'CONTEXT': return <Context state={state} />;
      case 'MODELS': return <Models state={state} update={update} />;
      default: return null;
    }
  })();

  return (
    <aside style={{
      width: 460, borderLeft: '1px solid var(--d-line)', background: 'var(--d-bg)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', borderBottom: '1px solid var(--d-line)', background: 'var(--d-bg-alt)',
      }}>
        <span className="d-coord">/{view}</span>
        <button onClick={onClose} title="Close"
          style={{
            background: 'transparent', border: '1px solid var(--d-line)',
            color: 'var(--d-ink)', width: 26, height: 26, cursor: 'pointer',
            fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12,
          }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {body}
      </div>
    </aside>
  );
}
