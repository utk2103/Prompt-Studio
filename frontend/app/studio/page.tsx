'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppState, Toast, ToastType } from '@/lib/types';
import { FB_MODELS, FB_WQ } from '@/lib/constants';
import { initAPI } from '@/lib/api';

import Nav from '@/components/marketing/Nav';
import Header from '@/components/Header';
import SideNav from '@/components/SideNav';
import StatusBar from '@/components/StatusBar';
import ToastContainer from '@/components/ToastContainer';
import Analyze from '@/components/views/Analyze';
import Score from '@/components/views/Score';
import Tokens from '@/components/views/Tokens';
import Context from '@/components/views/Context';
import Models from '@/components/views/Models';
import Wizard from '@/components/views/Wizard';
import History from '@/components/views/History';

const INITIAL: AppState = {
  view: 'ANALYZE',
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
    initAPI().then(({ apiOnline, models, wizardQ, history }) => {
      update({ apiOnline, models, wizardQ, history });
      if (apiOnline) toast('API connected. Enhanced mode active.', 'ok');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderView = () => {
    if (state.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 14 }}>
          <div style={{ color: 'var(--d-accent)', fontSize: 20, letterSpacing: 6 }}>
            <span className="ldot">▪</span><span className="ldot">▪</span><span className="ldot">▪</span>
          </div>
          <span className="d-coord">PROCESSING REQUEST</span>
        </div>
      );
    }
    const props = { state, update, toast };
    switch (state.view) {
      case 'ANALYZE': return <Analyze {...props} />;
      case 'SCORE':   return <Score state={state} update={update} />;
      case 'TOKENS':  return <Tokens state={state} update={update} />;
      case 'CONTEXT': return <Context state={state} />;
      case 'MODELS':  return <Models state={state} update={update} />;
      case 'WIZARD':  return <Wizard {...props} />;
      case 'HISTORY': return <History {...props} />;
      default: return <Analyze {...props} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--d-bg)' }}>
      <Nav />
      <Header state={state} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <SideNav state={state} update={update} />
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {renderView()}
        </div>
      </div>
      <StatusBar state={state} />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
