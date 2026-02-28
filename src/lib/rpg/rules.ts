// Core RPG combat rules, enemies, and status effects.

import type { CombatEnemy, CombatStatus, Element, MonsterArchetypeId, RpgSave, StatusId } from './state';

import { mulberry32, rngChoice, rngInt } from './rng';
import { regionOf } from './regions';

export function expToNext(level: number) {
  return Math.floor(40 + level * level * 18);
}

export function recalcVitals(p: RpgSave): RpgSave {
  const hpMax = 40 + p.con * 10 + p.level * 3;
  const mpMax = 10 + p.int * 6 + p.level * 2;
  return {
    ...p,
    hpMax,
    mpMax,
    hp: Math.min(p.hp, hpMax),
    mp: Math.min(p.mp, mpMax),
    expToNext: expToNext(p.level),
  };
}

export type MonsterDef = {
  id: MonsterArchetypeId;
  nameZh: string;
  tier: 'normal' | 'elite' | 'boss';
  element: Element;

  // Scales with player level.
  hpBase: number;
  hpPerLevel: number;
  atkBase: number;
  atkPerLevel: number;
  defBase: number;
  defPerLevel: number;

  skill?:
    | { id: 'slime_split' }
    | { id: 'bat_lifesteal'; ratio: number }
    | { id: 'goblin_heavy_strike'; windupTurns: 1; ratio: number }
    | { id: 'spider_poison_dot'; turns: number; pctMaxHpPerTurn: number }
    | { id: 'ember_burn_dot'; turns: number; dmgPerTurnBase: number };
};

export const MONSTERS: Record<MonsterArchetypeId, MonsterDef> = {
  slime: {
    id: 'slime',
    nameZh: '史莱姆',
    tier: 'normal',
    element: 'water',
    hpBase: 14,
    hpPerLevel: 8,
    atkBase: 3,
    atkPerLevel: 2,
    defBase: 0,
    defPerLevel: 1,
  },
  slime_splitter: {
    id: 'slime_splitter',
    nameZh: '分裂史莱姆',
    tier: 'elite',
    element: 'water',
    hpBase: 16,
    hpPerLevel: 9,
    atkBase: 4,
    atkPerLevel: 2,
    defBase: 1,
    defPerLevel: 1,
    skill: { id: 'slime_split' },
  },
  slime_king: {
    id: 'slime_king',
    nameZh: '史莱姆王',
    tier: 'boss',
    element: 'water',
    hpBase: 30,
    hpPerLevel: 14,
    atkBase: 7,
    atkPerLevel: 3,
    defBase: 2,
    defPerLevel: 1,
    skill: { id: 'slime_split' },
  },

  goblin: {
    id: 'goblin',
    nameZh: '哥布林',
    tier: 'normal',
    element: 'wind',
    hpBase: 14,
    hpPerLevel: 8,
    atkBase: 4,
    atkPerLevel: 2,
    defBase: 0,
    defPerLevel: 1,
  },
  bat: {
    id: 'bat',
    nameZh: '蝙蝠',
    tier: 'normal',
    element: 'wood',
    hpBase: 12,
    hpPerLevel: 7,
    atkBase: 3,
    atkPerLevel: 2,
    defBase: 0,
    defPerLevel: 1,
    skill: { id: 'bat_lifesteal', ratio: 0.35 },
  },
  goblin_brute: {
    id: 'goblin_brute',
    nameZh: '狂暴哥布林',
    tier: 'elite',
    element: 'wind',
    hpBase: 18,
    hpPerLevel: 10,
    atkBase: 6,
    atkPerLevel: 3,
    defBase: 1,
    defPerLevel: 1,
    skill: { id: 'goblin_heavy_strike', windupTurns: 1, ratio: 1.8 },
  },
  forest_spider: {
    id: 'forest_spider',
    nameZh: '幽林毒蛛',
    tier: 'elite',
    element: 'wood',
    hpBase: 16,
    hpPerLevel: 9,
    atkBase: 5,
    atkPerLevel: 2,
    defBase: 1,
    defPerLevel: 1,
    skill: { id: 'spider_poison_dot', turns: 3, pctMaxHpPerTurn: 0.05 },
  },
  spider_queen: {
    id: 'spider_queen',
    nameZh: '蛛后',
    tier: 'boss',
    element: 'wood',
    hpBase: 34,
    hpPerLevel: 14,
    atkBase: 8,
    atkPerLevel: 3,
    defBase: 2,
    defPerLevel: 1,
    skill: { id: 'spider_poison_dot', turns: 4, pctMaxHpPerTurn: 0.05 },
  },

  cave_bat: {
    id: 'cave_bat',
    nameZh: '洞窟蝙蝠',
    tier: 'normal',
    element: 'wood',
    hpBase: 14,
    hpPerLevel: 8,
    atkBase: 4,
    atkPerLevel: 2,
    defBase: 0,
    defPerLevel: 1,
    skill: { id: 'bat_lifesteal', ratio: 0.3 },
  },
  ember_slime: {
    id: 'ember_slime',
    nameZh: '余烬史莱姆',
    tier: 'normal',
    element: 'fire',
    hpBase: 16,
    hpPerLevel: 9,
    atkBase: 4,
    atkPerLevel: 2,
    defBase: 1,
    defPerLevel: 1,
  },
  ember_golem: {
    id: 'ember_golem',
    nameZh: '余烬魔像',
    tier: 'elite',
    element: 'fire',
    hpBase: 22,
    hpPerLevel: 12,
    atkBase: 7,
    atkPerLevel: 3,
    defBase: 2,
    defPerLevel: 2,
  },
  magma_wyrm: {
    id: 'magma_wyrm',
    nameZh: '熔岩幼龙',
    tier: 'boss',
    element: 'fire',
    hpBase: 36,
    hpPerLevel: 15,
    atkBase: 9,
    atkPerLevel: 3,
    defBase: 2,
    defPerLevel: 1,
  },

  wind_hawk: {
    id: 'wind_hawk',
    nameZh: '疾风隼',
    tier: 'normal',
    element: 'wind',
    hpBase: 13,
    hpPerLevel: 8,
    atkBase: 5,
    atkPerLevel: 2,
    defBase: 0,
    defPerLevel: 1,
    skill: { id: 'bat_lifesteal', ratio: 0.22 },
  },

  ember_salamander: {
    id: 'ember_salamander',
    nameZh: '余烬蝾螈',
    tier: 'elite',
    element: 'fire',
    hpBase: 20,
    hpPerLevel: 11,
    atkBase: 6,
    atkPerLevel: 3,
    defBase: 1,
    defPerLevel: 2,
    skill: { id: 'ember_burn_dot', turns: 3, dmgPerTurnBase: 3 },
  },
};

export function elementMultiplier(attacker: Element, defender: Element): number {
  // Simple cycle: water > fire > wood > wind > water
  if (attacker === defender) return 1;
  if (attacker === 'water' && defender === 'fire') return 1.2;
  if (attacker === 'fire' && defender === 'wood') return 1.2;
  if (attacker === 'wood' && defender === 'wind') return 1.2;
  if (attacker === 'wind' && defender === 'water') return 1.2;

  if (attacker === 'fire' && defender === 'water') return 0.85;
  if (attacker === 'wood' && defender === 'fire') return 0.85;
  if (attacker === 'wind' && defender === 'wood') return 0.85;
  if (attacker === 'water' && defender === 'wind') return 0.85;

  return 1;
}

export function makeEnemy(mapId: string, seed: number, playerLevel: number): CombatEnemy {
  const id = `${mapId}_${seed}`;

  const region = regionOf(mapId as never);
  const r = mulberry32(seed);

  // Region-specific difficulty knobs (keeps zones feeling distinct).
  const regionLevelBonus = mapId === 'breeze_plains' ? 0 : mapId === 'whispering_forest' ? 1 : 2;
  const hpMult = mapId === 'breeze_plains' ? 1.0 : mapId === 'whispering_forest' ? 1.08 : 1.16;
  const atkMult = mapId === 'breeze_plains' ? 1.0 : mapId === 'whispering_forest' ? 1.06 : 1.14;
  const defMult = mapId === 'breeze_plains' ? 1.0 : mapId === 'whispering_forest' ? 1.05 : 1.12;

  const pool = [...region.monsterPool.normal, ...region.monsterPool.elite, ...region.monsterPool.boss] as MonsterArchetypeId[];

  // Weighted by tier (but region affects how often elites/bosses appear).
  const tierWeight = (t: MonsterDef['tier']) => {
    if (mapId === 'breeze_plains') return t === 'normal' ? 7 : t === 'elite' ? 2 : 0.6;
    if (mapId === 'whispering_forest') return t === 'normal' ? 6 : t === 'elite' ? 3 : 0.9;
    return t === 'normal' ? 5 : t === 'elite' ? 3.4 : 1.2;
  };

  const pick = rngChoice(r, pool, (mid) => tierWeight(MONSTERS[mid].tier));

  const def = MONSTERS[pick];

  const levelJitter = rngInt(r, -1, 1);
  const level = Math.max(1, playerLevel + regionLevelBonus + levelJitter + (def.tier === 'elite' ? 1 : def.tier === 'boss' ? 3 : 0));

  const hpMax = Math.floor((def.hpBase + def.hpPerLevel * level) * hpMult);
  const atk = Math.floor((def.atkBase + def.atkPerLevel * level) * atkMult);
  const df = Math.floor((def.defBase + def.defPerLevel * level) * defMult);

  return {
    id,
    archetypeId: def.id,
    name: def.nameZh,
    tier: def.tier,
    element: def.element,
    level,
    hpMax,
    hp: hpMax,
    atk,
    def: df,
    intent: null,
  };
}

export function applyDotToPlayer(save: RpgSave, logs: string[]): { save: RpgSave; logs: string[] } {
  const poison = save.statuses.find((x) => x.id === 'poison');
  const bleed = save.statuses.find((x) => x.id === 'bleed');
  const burn = save.statuses.find((x) => x.id === 'burn');

  // Poison ticks.
  if (poison) {
    const dmg = Math.max(1, Math.floor(save.hpMax * poison.pctMaxHpPerTurn));
    const nextHp = Math.max(0, save.hp - dmg);
    const nextTurns = poison.turns - 1;

    logs.push(`毒素发作，你失去 ${dmg} HP。`);

    const nextStatuses =
      nextTurns > 0
        ? [{ ...poison, turns: nextTurns }, ...save.statuses.filter((x) => x.id !== 'poison')]
        : save.statuses.filter((x) => x.id !== 'poison');

    save = { ...save, hp: nextHp, statuses: nextStatuses };
  }

  // Bleed ticks.
  if (bleed) {
    const dmg = Math.max(1, bleed.dmgPerTurn);
    const nextHp = Math.max(0, save.hp - dmg);
    const nextTurns = bleed.turns - 1;

    logs.push(`伤口渗血，你失去 ${dmg} HP。`);

    const nextStatuses =
      nextTurns > 0
        ? [{ ...bleed, turns: nextTurns }, ...save.statuses.filter((x) => x.id !== 'bleed')]
        : save.statuses.filter((x) => x.id !== 'bleed');

    save = { ...save, hp: nextHp, statuses: nextStatuses };
  }

  // Burn ticks.
  if (burn) {
    const dmg = Math.max(1, burn.dmgPerTurn);
    const nextHp = Math.max(0, save.hp - dmg);
    const nextTurns = burn.turns - 1;

    logs.push(`灼烧发作，你失去 ${dmg} HP。`);

    const nextStatuses =
      nextTurns > 0
        ? [{ ...burn, turns: nextTurns }, ...save.statuses.filter((x) => x.id !== 'burn')]
        : save.statuses.filter((x) => x.id !== 'burn');

    save = { ...save, hp: nextHp, statuses: nextStatuses };
  }

  return { save, logs };
}

export function pushOrRefreshStatus(
  statuses: CombatStatus[],
  s: CombatStatus,
): CombatStatus[] {
  const rest = statuses.filter((x) => x.id !== s.id);
  return [s, ...rest];
}

export function statusNameZh(id: StatusId): string {
  if (id === 'poison') return '中毒';
  if (id === 'bleed') return '流血';
  if (id === 'burn') return '灼烧';
  if (id === 'stun') return '眩晕';
  return id;
}
