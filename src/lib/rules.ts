import type { Derived, Item, Player, Stats } from './types';

export function baseStatsForJob(job: Player['job']): Stats {
  switch (job) {
    case 'guard':
      return { str: 3, dex: 1, int: 0, vit: 3, spi: 0 };
    case 'ranger':
      return { str: 1, dex: 3, int: 0, vit: 2, spi: 0 };
    case 'warlock':
      return { str: 0, dex: 1, int: 3, vit: 1, spi: 1 };
    case 'cleric':
      return { str: 1, dex: 0, int: 1, vit: 2, spi: 2 };
    case 'rogue':
      return { str: 1, dex: 4, int: 0, vit: 1, spi: 0 };
    case 'scholar':
      return { str: 0, dex: 1, int: 4, vit: 0, spi: 1 };
  }
}

export function calcDerived(stats: Stats, items: Item[]): Derived {
  const bonus: Partial<Record<keyof Derived, number>> = {};

  for (const it of items) {
    for (const [k, v] of Object.entries(it.stats)) {
      const key = k as keyof Derived;
      if (typeof v !== 'number') continue;
      if (key in bonus) bonus[key] = (bonus[key] ?? 0) + v;
      else bonus[key] = v;
    }
  }

  const hpMax = 40 + stats.vit * 10 + (bonus.hpMax ?? 0);
  const atk = 4 + stats.str * 2 + Math.floor(stats.dex * 0.5) + (bonus.atk ?? 0);
  const def = 0 + stats.vit * 1 + Math.floor(stats.str * 0.5) + (bonus.def ?? 0);

  const crit = Math.min(60, 2 + stats.dex * 2 + (bonus.crit ?? 0));
  const hit = Math.min(95, 70 + stats.dex * 2 + (bonus.hit ?? 0));
  const dodge = Math.min(50, stats.dex * 1.2 + (bonus.dodge ?? 0));
  const res = Math.min(60, stats.spi * 2 + (bonus.res ?? 0));

  return { hpMax, atk, def, crit, hit, dodge, res };
}

export function expToNext(level: number) {
  return Math.floor(40 + level * level * 18);
}
