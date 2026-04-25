import { API, FB_MODELS, FB_WQ } from './constants';
import type { HistoryEntry, Model, WizardQuestion } from './types';

export async function apiFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000) };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + path, opts);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json() as Promise<T>;
}

export async function initAPI(): Promise<{
  apiOnline: boolean;
  models: Model[];
  wizardQ: WizardQuestion[];
  history: HistoryEntry[];
}> {
  try {
    const [, models, wqData, history] = await Promise.all([
      apiFetch('/health'),
      apiFetch<Model[]>('/models'),
      apiFetch<{ questions: WizardQuestion[] }>('/wizard/questions'),
      apiFetch<HistoryEntry[]>('/history'),
    ]);
    return { apiOnline: true, models, wizardQ: wqData.questions || FB_WQ, history: history || [] };
  } catch {
    return { apiOnline: false, models: FB_MODELS, wizardQ: FB_WQ, history: [] };
  }
}
