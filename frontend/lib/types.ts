export interface Model {
  id: string;
  name: string;
  provider: string;
  context: number;
  cost_in: number;
  cost_out: number;
  format: string;
}

export interface WizardQuestion {
  id: string;
  q: string;
  opts: string[];
}

export interface HistoryEntry {
  id?: string;
  ts?: number;
  prompt_preview?: string;
  prompt?: string;
  mode?: string;
  model_id?: string;
  model?: string;
  score?: number;
}

export interface ScoreResult {
  overall: number;
  clarity: number;
  specificity: number;
  context: number;
  format: number;
  mode_alignment: number;
  token_efficiency: number;
  constraints: number;
  grade: string;
  label: string;
}

export interface Issue {
  t: 'ERR' | 'WARN' | 'OK' | 'INFO';
  m: string;
}

export type ViewType = 'ANALYZE' | 'SCORE' | 'TOKENS' | 'CONTEXT' | 'MODELS' | 'WIZARD' | 'HISTORY';
export type ModeType = 'TECHNICAL' | 'CREATIVE' | 'SYSTEM';

export interface AppState {
  view: ViewType;
  prompt: string;
  mode: ModeType;
  model: string;
  scores: ScoreResult | null;
  issues: Issue[];
  recs: string[];
  history: HistoryEntry[];
  wizardStep: number;
  wizardAnswers: Record<string, string>;
  wizardQ: WizardQuestion[];
  models: Model[];
  apiOnline: boolean;
  loading: boolean;
}

export type ToastType = 'ok' | 'err' | 'warn' | 'info';

export interface Toast {
  id: string;
  msg: string;
  type: ToastType;
}
