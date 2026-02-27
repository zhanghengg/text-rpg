import type { CombatEnemy, RpgSave } from './state';

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

export function makeEnemy(mapId: string, seed: number, level: number): CombatEnemy {
  const id = `${mapId}_${seed}`;

  const hpMax = 18 + level * 10;
  const atk = 4 + level * 3;
  const def = Math.floor(level * 0.8);

  const roll = mulberry32(seed)();

  let name = '迷雾野兽';
  if (mapId === 'breeze_plains') {
    if (roll < 0.78) name = '史莱姆';
    else if (roll < 0.95) name = '分裂史莱姆';
    else name = '史莱姆王';
  } else if (mapId === 'whispering_forest') {
    if (roll < 0.55) name = '哥布林';
    else if (roll < 0.78) name = '蝙蝠';
    else if (roll < 0.92) name = '狂暴哥布林';
    else name = '幽林毒蛛';
  } else if (mapId === 'ember_caverns') {
    if (roll < 0.55) name = '洞窟蝙蝠';
    else if (roll < 0.82) name = '余烬史莱姆';
    else if (roll < 0.95) name = '余烬魔像';
    else name = '熔岩幼龙';
  }

  return {
    id,
    name,
    level,
    hpMax,
    hp: hpMax,
    atk,
    def,
  };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
