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
  const base = mapId === 'slime_plains' ? '史莱姆' : mapId === 'dark_forest' ? '哥布林' : '迷雾野兽';
  const id = `${mapId}_${seed}`;

  const hpMax = 18 + level * 10;
  const atk = 4 + level * 3;
  const def = Math.floor(level * 0.8);

  return {
    id,
    name: base,
    level,
    hpMax,
    hp: hpMax,
    atk,
    def,
  };
}
