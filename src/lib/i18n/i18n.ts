export const LANGS = ['en', 'zh'] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}

export function normalizeLang(v: string | undefined | null): Lang {
  if (!v) return 'en';
  return isLang(v) ? v : 'en';
}
