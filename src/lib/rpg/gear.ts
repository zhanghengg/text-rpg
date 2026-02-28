import type { Element, GearAffix, GearSlot, Rarity, RpgItem } from './state';

import { mulberry32, rngChoice, rngInt } from './rng';

const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 60,
  uncommon: 26,
  rare: 11,
  epic: 3,
};

export function rarityNameZh(r: Rarity): string {
  if (r === 'common') return '白';
  if (r === 'uncommon') return '绿';
  if (r === 'rare') return '蓝';
  return '紫';
}

export function elementNameZh(e: Element): string {
  if (e === 'water') return '水';
  if (e === 'wind') return '风';
  if (e === 'fire') return '火';
  return '木';
}

const AFFIX_POOL: GearAffix[] = [
  { id: 'str', nameZh: '力量', value: 1 },
  { id: 'agi', nameZh: '轻灵', value: 1 },
  { id: 'int', nameZh: '睿智', value: 1 },
  { id: 'con', nameZh: '坚韧', value: 1 },

  { id: 'lifesteal', nameZh: '吸血', value: 2 }, // %
  { id: 'thorns', nameZh: '荆棘', value: 1 }, // flat

  // New affixes (content expansion).
  { id: 'str', nameZh: '蛮力', value: 2 },
  { id: 'agi', nameZh: '疾步', value: 2 },
  { id: 'lifesteal', nameZh: '噬血', value: 3 },
  { id: 'thorns', nameZh: '棘甲', value: 2 },
];

export function rollRarity(r: () => number): Rarity {
  const items = Object.keys(RARITY_WEIGHT) as Rarity[];
  return rngChoice(r, items, (x) => RARITY_WEIGHT[x]);
}

export function rollAffixes(r: () => number, rarity: Rarity): GearAffix[] {
  const count = rarity === 'common' ? 0 : rarity === 'uncommon' ? 1 : rarity === 'rare' ? 2 : 3;
  const picked: GearAffix[] = [];

  const pool = [...AFFIX_POOL];
  for (let i = 0; i < count; i++) {
    const a = rngChoice(r, pool);
    const idx = pool.findIndex((x) => x.id === a.id);
    if (idx >= 0) pool.splice(idx, 1);

    const scale = rarity === 'epic' ? 2 : rarity === 'rare' ? 2 : 1;
    const variance = a.id === 'lifesteal' ? rngInt(r, 0, 2) : rngInt(r, 0, 1);
    picked.push({ ...a, value: a.value * scale + variance });
  }

  return picked;
}

export function gearNameZh(slot: GearSlot, rarity: Rarity, element?: Element): string {
  const base = slot === 'weapon' ? '武器' : slot === 'armor' ? '护甲' : '饰品';
  const ele = element ? elementNameZh(element) : '';
  return `${rarityNameZh(rarity)}${ele}${base}`;
}

export function rollGear(seed: number, slot: GearSlot, level: number, element?: Element): RpgItem & { kind: 'gear' } {
  const r = mulberry32(seed);
  const rarity = rollRarity(r);
  const affixes = rollAffixes(r, rarity);

  const basePower = slot === 'weapon' ? 4 : slot === 'armor' ? 2 : 1;
  const power = basePower + Math.floor(level * 1.3) + (rarity === 'epic' ? 6 : rarity === 'rare' ? 3 : rarity === 'uncommon' ? 1 : 0);

  return {
    id: `gear_${slot}_${seed}`,
    kind: 'gear',
    slot,
    rarity,
    element,
    power,
    affixes,
    name: gearNameZh(slot, rarity, element),
  };
}

export function applyGearToStats(
  base: { str: number; agi: number; int: number; con: number },
  gear: Partial<Record<GearSlot, (RpgItem & { kind: 'gear' }) | undefined>>,
): { str: number; agi: number; int: number; con: number; lifestealPct: number; thorns: number } {
  let str = base.str;
  let agi = base.agi;
  let int = base.int;
  let con = base.con;
  let lifestealPct = 0;
  let thorns = 0;

  const all = [gear.weapon, gear.armor, gear.accessory].filter(Boolean) as (RpgItem & { kind: 'gear' })[];
  for (const g of all) {
    for (const a of g.affixes) {
      if (a.id === 'str') str += a.value;
      else if (a.id === 'agi') agi += a.value;
      else if (a.id === 'int') int += a.value;
      else if (a.id === 'con') con += a.value;
      else if (a.id === 'lifesteal') lifestealPct += a.value;
      else if (a.id === 'thorns') thorns += a.value;
    }
  }

  return { str, agi, int, con, lifestealPct, thorns };
}
