import type { RpgRuntime } from './reducer';

import { migrateSave } from './migrate';

const KEY_V2 = 'text-rpg.rpgsave.v2';
const KEY_V1 = 'text-rpg.rpgsave.v1';

export function loadRpg(): RpgRuntime | null {
  if (typeof window === 'undefined') return null;

  const rawV2 = window.localStorage.getItem(KEY_V2);
  if (rawV2) {
    try {
      const parsed = JSON.parse(rawV2) as RpgRuntime;
      const save = migrateSave(parsed.save);
      if (!save) return null;
      return { ...parsed, save };
    } catch {
      // fallthrough
    }
  }

  const rawV1 = window.localStorage.getItem(KEY_V1);
  if (rawV1) {
    try {
      const parsed = JSON.parse(rawV1) as RpgRuntime;
      const save = migrateSave(parsed.save);
      if (!save) return null;
      return { ...parsed, save };
    } catch {
      return null;
    }
  }

  return null;
}

export function saveRpg(rt: RpgRuntime) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY_V2, JSON.stringify(rt));
}

export function clearRpg() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY_V2);
  window.localStorage.removeItem(KEY_V1);
}
