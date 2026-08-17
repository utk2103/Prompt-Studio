import { API, FB_MODELS, FB_WQ } from './constants';
import type { HistoryEntry, Model, WizardQuestion } from './types';

// Feature routes are mounted under /api/v1 in app/main.py; meta routes (/health, /ui)
// stay at root. Prefix here so every caller can keep using the bare path.
const META_PREFIXES = ['/health', '/ui'];

export async function apiFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000) };
  if (body) opts.body = JSON.stringify(body);
  const url = META_PREFIXES.some(p => path === p || path.startsWith(p + '/'))
    ? API + path
    : API + '/api/v1' + path;
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json() as Promise<T>;
}

// Give LoadingState time to actually render. React 18 batches synchronous
// updates, and cache-hot API calls return in <50ms — both collapse the loader.
export const minDelay = (ms = 550) => new Promise<void>(r => setTimeout(r, ms));

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
