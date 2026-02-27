import type { Lang } from './i18n';

export function trPrefix(lang: Lang, p: string) {
  if (lang !== 'zh') return p;

  const m: Record<string, string> = {
    Worn: '破旧的',
    Sharpened: '锋利的',
    'Fog-touched': '雾染的',
    Silvered: '镀银的',
    Ragged: '褴褛的',
    Sturdy: '坚固的',
  };
  return m[p] ?? p;
}

export function trSuffix(lang: Lang, s: string) {
  if (lang !== 'zh') return s;

  const m: Record<string, string> = {
    'of Sparks': '之火花',
    'of the Wolf': '之狼',
    'of Quiet': '之静默',
    'of Greed': '之贪欲',
    'of Iron': '之铁',
    'of Old Blood': '之旧血',
  };
  return m[s] ?? s;
}

export function trEnemyName(lang: Lang, name: string) {
  if (lang !== 'zh') return name;

  const m: Record<string, string> = {
    'Mist Rat': '雾鼠',
    'Fog Wolf': '雾狼',
    'Rust Golem': '锈魔像',
  };

  return m[name] ?? name;
}
