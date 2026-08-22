'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppState, Toast, ToastType } from '@/lib/types';
import { FB_MODELS, FB_WQ } from '@/lib/constants';
import { initAPI } from '@/lib/api';

import Nav from '@/components/marketing/Nav';
import Header from '@/components/Header';
import ToastContainer from '@/components/ToastContainer';
import PromptModal from '@/components/PromptModal';
import ChatSurface from '@/components/chat/ChatSurface';
import HistoryRail from '@/components/chat/HistoryRail';
import DetailDrawer from '@/components/chat/DetailDrawer';

const INITIAL: AppState = {
  view: 'NONE',
  prompt: '',
  mode: 'TECHNICAL',
  model: 'claude-3-5',
  scores: null,
  issues: [],
  recs: [],
  history: [],
  wizardStep: 0,
  wizardAnswers: {},
  wizardQ: FB_WQ,
  models: FB_MODELS,
  apiOnline: false,
  loading: false,
  modal: null,
  memoryBackend: 'local',
  supermemoryAvailable: false,
};

export default function StudioPage() {
  const [state, setState] = useState<AppState>(INITIAL);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const update = useCallback((partial: Partial<AppState>) => {
    setState(s => ({ ...s, ...partial }));
  }, []);

  const toast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  useEffect(() => {
    initAPI().then(({ apiOnline, models, wizardQ, history, supermemoryAvailable }) => {
      update({ apiOnline, models, wizardQ, history, supermemoryAvailable });
      if (apiOnline) toast('API connected. Enhanced mode active.', 'ok');
      if (supermemoryAvailable) toast('Supermemory available. Toggle in the history rail.', 'info');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--d-bg)' }}>
      <Nav />
      <Header state={state} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <HistoryRail
          state={state}
          update={update}
          toast={toast}
          onRestore={(prompt) => update({ prompt })}
        />
        <ChatSurface state={state} update={update} toast={toast} />
        <DetailDrawer state={state} update={update} onClose={() => update({ view: 'NONE' })} />
      </div>
      <ToastContainer toasts={toasts} />
      {state.modal && (
        <PromptModal
          title={state.modal.title}
          prompt={state.modal.prompt}
          original={state.modal.original}
          onClose={() => update({ modal: null })}
          onCopy={() => toast('Copied to clipboard', 'ok')}
        />
      )}
    </div>
  );
}
