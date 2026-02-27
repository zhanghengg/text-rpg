import type { Enemy, Item, JobId } from './types';

export const STARTER_ITEMS: Record<JobId, Item[]> = {
  guard: [
    {
      id: 'it_guard_sword_1',
      name: 'Worn Longsword',
      slot: 'weapon',
      rarity: 'common',
      levelReq: 1,
      stats: { atk: 3, str: 1 },
      price: 15,
      tags: ['starter'],
    },
  ],
  ranger: [
    {
      id: 'it_ranger_bow_1',
      name: 'Bent Ash Bow',
      slot: 'weapon',
      rarity: 'common',
      levelReq: 1,
      stats: { atk: 3, dex: 1, hit: 1 },
      price: 15,
      tags: ['starter'],
    },
  ],
  warlock: [
    {
      id: 'it_warlock_staff_1',
      name: 'Charred Staff',
      slot: 'weapon',
      rarity: 'common',
      levelReq: 1,
      stats: { atk: 2, int: 2 },
      price: 15,
      tags: ['starter'],
    },
  ],
  cleric: [
    {
      id: 'it_cleric_mace_1',
      name: 'Silvered Mace',
      slot: 'weapon',
      rarity: 'common',
      levelReq: 1,
      stats: { atk: 2, spi: 2 },
      price: 15,
      tags: ['starter'],
    },
  ],
  rogue: [
    {
      id: 'it_rogue_dagger_1',
      name: 'Thin Dagger',
      slot: 'weapon',
      rarity: 'common',
      levelReq: 1,
      stats: { atk: 2, dex: 2, crit: 1 },
      price: 15,
      tags: ['starter'],
    },
  ],
  scholar: [
    {
      id: 'it_scholar_tome_1',
      name: 'Weathered Tome',
      slot: 'offhand',
      rarity: 'common',
      levelReq: 1,
      stats: { int: 1, spi: 1, res: 1 },
      price: 15,
      tags: ['starter'],
    },
  ],
};

export const ENEMIES: Enemy[] = [
  {
    id: 'en_mist_rat',
    name: 'Mist Rat',
    level: 1,
    hpMax: 18,
    atk: 4,
    def: 0,
    traits: ['beast'],
  },
  {
    id: 'en_fog_wolf',
    name: 'Fog Wolf',
    level: 2,
    hpMax: 26,
    atk: 6,
    def: 1,
    traits: ['beast'],
  },
  {
    id: 'en_rust_golem',
    name: 'Rust Golem',
    level: 3,
    hpMax: 42,
    atk: 7,
    def: 3,
    traits: ['construct'],
  },
];
