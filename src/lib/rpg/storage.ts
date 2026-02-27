import type { RpgRuntime } from './reducer';

const KEY = 'text-rpg.rpgsave.v1';

export function loadRpg(): RpgRuntime | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RpgRuntime;
  } catch {
    return null;
  }
}

export function saveRpg(rt: RpgRuntime) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(rt));
}

export function clearRpg() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
