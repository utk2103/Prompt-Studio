'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppState, Toast, ToastType } from '@/lib/types';
import { FB_MODELS, FB_WQ } from '@/lib/constants';
import { initAPI } from '@/lib/api';

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
      if (apiOnline) toast('API connected — enhanced mode active', 'ok');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderView = () => {
    if (state.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
          <div style={{ color: '#00cc44', fontSize: 16, letterSpacing: 5 }}>
            <span className="ldot">▪</span><span className="ldot">▪</span><span className="ldot">▪</span>
          </div>
          <span style={{ color: '#004411', fontSize: 10, letterSpacing: '.5px' }}>PROCESSING REQUEST</span>
        </div>
      );
    }
    const props = { state, update, toast };
    switch (state.view) {
      case 'ANALYZE': return <Analyze {...props} />;
      case 'SCORE': return <Score state={state} update={update} />;
      case 'TOKENS': return <Tokens state={state} update={update} />;
      case 'CONTEXT': return <Context state={state} />;
      case 'MODELS': return <Models state={state} update={update} />;
      case 'WIZARD': return <Wizard {...props} />;
      case 'HISTORY': return <History {...props} />;
      default: return <Analyze {...props} />;
    }
  };

  return (
    <div className="terminal">
      <div id="pf-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', border: '1px solid #003311', position: 'relative' }}>
        <Header state={state} />
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <SideNav state={state} update={update} />
          <div style={{ flex: 1, padding: '10px 14px', overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 70px)' }}>
            {renderView()}
          </div>
        </div>
        <StatusBar state={state} />
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}
