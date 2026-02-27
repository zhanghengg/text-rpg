import type { RpgSave } from './state';

import { recalcVitals } from './rules';

type SaveV1 = Omit<RpgSave, 'version' | 'equipment' | 'statuses'> & { version: 1 };

export function migrateSave(raw: unknown): RpgSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const anyRaw = raw as Record<string, unknown>;

  if (anyRaw.version === 2) {
    const save = raw as RpgSave;
    return recalcVitals({
      ...save,
      equipment: save.equipment ?? {},
      statuses: save.statuses ?? [],
    });
  }

  if (anyRaw.version === 1) {
    const v1 = raw as SaveV1;
    const migrated: RpgSave = {
      ...(v1 as unknown as Omit<RpgSave, 'version'>),
      version: 2,
      equipment: {},
      statuses: [],
    };
    return recalcVitals(migrated);
  }

  return null;
}
