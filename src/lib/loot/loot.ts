import type { Item, JobId, Rarity } from '@/lib/types';

import { mulberry32, pickOne, rngInt } from '@/lib/rng';

const RARITY_W: { r: Rarity; w: number }[] = [
  { r: 'common', w: 64 },
  { r: 'uncommon', w: 25 },
  { r: 'rare', w: 9 },
  { r: 'epic', w: 2 },
  { r: 'legendary', w: 0 },
];

const SLOT_POOL: Item['slot'][] = ['weapon', 'head', 'chest', 'hands', 'legs', 'feet', 'neck', 'ring1'];

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

export function rollDrop(seed: number, level: number, job: JobId): Item {
  const r = mulberry32(seed);
  const rarity = rollRarity(r);
  const slot = pickOne(r, SLOT_POOL);

  const baseAtk = slot === 'weapon' ? 3 + level : 0;
  const baseDef = slot === 'chest' ? 1 + Math.floor(level / 2) : 0;

  const mult = rarityMult(rarity);

  const atk = Math.floor(baseAtk * mult);
  const def = Math.floor(baseDef * mult);

  const statRoll = rngInt(r, 0, 2);
  const stats: Item['stats'] = {
    ...(atk ? { atk } : null),
    ...(def ? { def } : null),
  };

  if (statRoll === 1) {
    const k = pickOne(r, job === 'warlock' || job === 'scholar' ? ['int', 'spi'] : job === 'ranger' || job === 'rogue' ? ['dex', 'crit'] : ['str', 'vit']);
    // @ts-expect-error indexed
    stats[k] = (stats[k] ?? 0) + 1 + Math.floor(mult);
  }

  const name = `${prefix(r)} ${slot.toUpperCase()} ${suffix(r)}`;

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
