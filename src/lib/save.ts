import type { Player } from './types';

const KEY = 'text-rpg.save.v1';

export function loadSave(): Player | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Player;
  } catch {
    return null;
  }
}

export function writeSave(p: Player) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearSave() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
