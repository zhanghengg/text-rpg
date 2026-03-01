import type { GearItem, JobId, Rarity } from '@/lib/types';

import { mulberry32, pickOne, rngInt } from '@/lib/rng';

const RARITY_W: { r: Rarity; w: number }[] = [
  { r: 'common', w: 64 },
  { r: 'uncommon', w: 25 },
  { r: 'rare', w: 9 },
  { r: 'epic', w: 2 },
  { r: 'legendary', w: 0 },
];

const SLOT_POOL: GearItem['slot'][] = ['weapon', 'head', 'chest', 'hands', 'legs', 'feet', 'neck', 'ring1'];

function rollRarity(r: () => number): Rarity {
  const total = RARITY_W.reduce((a, x) => a + x.w, 0);
  let t = r() * total;
  for (const x of RARITY_W) {
    t -= x.w;
    if (t <= 0) return x.r;
  }
  return 'common';
}

function rarityMult(rr: Rarity) {
  switch (rr) {
    case 'common':
      return 1;
    case 'uncommon':
      return 1.18;
    case 'rare':
      return 1.42;
    case 'epic':
      return 1.75;
    case 'legendary':
      return 2.2;
  }
}

function prefix(r: () => number) {
  return pickOne(r, ['Worn', 'Sharpened', 'Fog-touched', 'Silvered', 'Ragged', 'Sturdy']);
}

function suffix(r: () => number) {
  return pickOne(r, ['of Sparks', 'of the Wolf', 'of Quiet', 'of Greed', 'of Iron', 'of Old Blood']);
}

export function rollDrop(seed: number, level: number, job: JobId, lang: 'en' | 'zh' = 'en'): GearItem {
  const r = mulberry32(seed);
  const rarity = rollRarity(r);
  const slot = pickOne(r, SLOT_POOL);

  const baseAtk = slot === 'weapon' ? 3 + level : 0;
  const baseDef = slot === 'chest' ? 1 + Math.floor(level / 2) : 0;

  const mult = rarityMult(rarity);

  const atk = Math.floor(baseAtk * mult);
  const def = Math.floor(baseDef * mult);

  const statRoll = rngInt(r, 0, 2);
  const stats: GearItem['stats'] = {
    ...(atk ? { atk } : null),
    ...(def ? { def } : null),
  };

  if (statRoll === 1) {
    const k = pickOne(r, job === 'warlock' || job === 'scholar' ? ['int', 'spi'] : job === 'ranger' || job === 'rogue' ? ['dex', 'crit'] : ['str', 'vit']);
    // @ts-expect-error indexed
    stats[k] = (stats[k] ?? 0) + 1 + Math.floor(mult);
  }

  const p = prefix(r);
  const s = suffix(r);

  // Lazy i18n: translate a few components when lang=zh.
  const zhPrefix: Record<string, string> = {
    Worn: '破旧的',
    Sharpened: '锋利的',
    'Fog-touched': '雾染的',
    Silvered: '镀银的',
    Ragged: '褴褛的',
    Sturdy: '坚固的',
  };

  const zhSuffix: Record<string, string> = {
    'of Sparks': '之火花',
    'of the Wolf': '之狼',
    'of Quiet': '之静默',
    'of Greed': '之贪欲',
    'of Iron': '之铁',
    'of Old Blood': '之旧血',
  };

  const slotNameZh: Record<GearItem['slot'], string> = {
    weapon: '武器',
    offhand: '副手',
    head: '头盔',
    chest: '胸甲',
    hands: '手套',
    legs: '护腿',
    feet: '靴子',
    neck: '项链',
    ring1: '戒指',
    ring2: '戒指',
  };

  const slotNameEn = slot.toUpperCase();
  const name =
    lang === 'zh'
      ? `${zhPrefix[p] ?? p}${slotNameZh[slot] ?? slot}${zhSuffix[s] ?? s}`
      : `${p} ${slotNameEn} ${s}`;

  return {
    id: `drop_${seed}`,
    name,
    slot: slot === 'ring1' ? 'ring1' : slot,
    rarity,
    levelReq: Math.max(1, level - 1),
    stats,
    price: 10 + Math.floor(level * 6 * mult),
    tags: ['drop'],
  };
}
