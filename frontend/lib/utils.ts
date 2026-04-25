export const tok = (t: string) => Math.ceil((t || '').length / 4);

export const fmtN = (n: number): string =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : String(n);

export const wc = (t: string) =>
  (t || '').trim().split(/\s+/).filter(Boolean).length;
