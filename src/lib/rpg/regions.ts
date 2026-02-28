import type { RegionId, XY } from './state';

export type PoiId = 'campfire' | 'slime_throne' | 'hunter_hut' | 'spider_nest' | 'lava_anvil';

export type RegionDef = {
  id: RegionId;
  nameZh: string;
  w: number;
  h: number;
  pois: { id: PoiId; pos: XY; nameZh: string }[];

  encounterRate: number;
  rewardGold: { min: number; max: number };

  // Flavor difficulty knobs.
  trapRate: number;
  merchantRate: number;

  monsterPool: {
    normal: string[];
    elite: string[];
    boss: string[];
  };
};

export const REGIONS: Record<RegionId, RegionDef> = {
  breeze_plains: {
    id: 'breeze_plains',
    nameZh: '微风平原',
    w: 5,
    h: 5,
    pois: [
      { id: 'campfire', pos: { x: 2, y: 2 }, nameZh: '营火' },
      { id: 'slime_throne', pos: { x: 4, y: 4 }, nameZh: '史莱姆王座' },
    ],
    encounterRate: 0.38,
    rewardGold: { min: 4, max: 12 },
    trapRate: 0.10,
    merchantRate: 0.06,
    monsterPool: {
      normal: ['slime'],
      elite: ['slime_splitter'],
      boss: ['slime_king'],
    },
  },
  whispering_forest: {
    id: 'whispering_forest',
    nameZh: '絮语森林',
    w: 8,
    h: 8,
    pois: [
      { id: 'hunter_hut', pos: { x: 3, y: 5 }, nameZh: '猎人小屋' },
      { id: 'spider_nest', pos: { x: 7, y: 7 }, nameZh: '蜘蛛巢穴' },
    ],
    encounterRate: 0.45,
    rewardGold: { min: 8, max: 18 },
    trapRate: 0.14,
    merchantRate: 0.08,
    monsterPool: {
      normal: ['goblin', 'bat', 'wind_hawk'],
      elite: ['goblin_brute', 'forest_spider'],
      boss: ['spider_queen'],
    },
  },
  ember_caverns: {
    id: 'ember_caverns',
    nameZh: '余烬洞窟',
    w: 10,
    h: 10,
    pois: [{ id: 'lava_anvil', pos: { x: 5, y: 5 }, nameZh: '熔岩铁砧' }],
    encounterRate: 0.50,
    rewardGold: { min: 12, max: 26 },
    trapRate: 0.18,
    merchantRate: 0.05,
    monsterPool: {
      normal: ['cave_bat', 'ember_slime', 'ember_salamander'],
      elite: ['ember_golem'],
      boss: ['magma_wyrm'],
    },
  },
};

export function regionOf(id: RegionId) {
  return REGIONS[id];
}

export function inBounds(regionId: RegionId, p: XY): boolean {
  const r = regionOf(regionId);
  return p.x >= 0 && p.y >= 0 && p.x < r.w && p.y < r.h;
}

export function poiAt(regionId: RegionId, p: XY) {
  const r = regionOf(regionId);
  return r.pois.find((x) => x.pos.x === p.x && x.pos.y === p.y) ?? null;
}
