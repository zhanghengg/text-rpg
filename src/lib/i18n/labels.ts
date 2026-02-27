import type { JobId, MapId } from '@/lib/types';
import type { Lang } from './i18n';

export const JOB_LABEL: Record<Lang, Record<JobId, string>> = {
  en: {
    guard: 'Guard',
    ranger: 'Ranger',
    warlock: 'Warlock',
    cleric: 'Cleric',
    rogue: 'Rogue',
    scholar: 'Scholar',
  },
  zh: {
    guard: '战士',
    ranger: '游侠',
    warlock: '术士',
    cleric: '牧师',
    rogue: '盗贼',
    scholar: '学者',
  },
};

export const MAP_LABEL: Record<Lang, Record<MapId, string>> = {
  en: {
    borderlands: 'Borderlands',
    mistwood: 'Mistwood Paths',
    oldmine: 'Old Mine',
    riftcorridor: 'Rift Corridor',
  },
  zh: {
    borderlands: '边境地带',
    mistwood: '雾林小径',
    oldmine: '旧矿坑',
    riftcorridor: '裂隙回廊',
  },
};
