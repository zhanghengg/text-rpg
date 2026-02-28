import type { CombatEnemy, Element, RpgSave } from './state';

import { applyGearToStats } from './gear';
import { mulberry32 } from './rng';
import { elementMultiplier } from './rules';

export type HitRoll = {
  hit: boolean;
  crit: boolean;
  hitChance: number;
  critChance: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function rollHit(seed: number, save: RpgSave, enemy: CombatEnemy): HitRoll {
  const ps = computePlayerStats(save);

  // Hit is mostly AGI-driven; higher-level enemies are harder to connect with.
  // Formula doc (lightweight):
  // - hitChance = clamp01(0.72 + AGI*0.02 - enemyLevel*0.015)
  const hitChance = clamp01(0.72 + ps.agi * 0.02 - enemy.level * 0.015);

  // Crit is also AGI-driven; small bonus when you have element advantage.
  // - critChance = clamp01(0.05 + AGI*0.01 + (elemAdv ? 0.03 : 0))
  const mult = elementMultiplier(playerElement(save), enemy.element);
  const critChance = clamp01(0.05 + ps.agi * 0.01 + (mult > 1 ? 0.03 : 0));

  const r = mulberry32(seed);
  const roll1 = r();
  const roll2 = r();

  const hit = roll1 < hitChance;
  const crit = hit && roll2 < critChance;

  return { hit, crit, hitChance, critChance };
}

export function playerElement(save: RpgSave): Element {
  return save.jobId === 'warlock'
    ? 'fire'
    : save.jobId === 'ranger'
      ? 'wind'
      : save.jobId === 'cleric'
        ? 'water'
        : save.jobId === 'rogue'
          ? 'wind'
          : save.jobId === 'scholar'
            ? 'wood'
            : 'wood';
}

export function computePlayerStats(save: RpgSave) {
  return applyGearToStats({ str: save.str, agi: save.agi, int: save.int, con: save.con }, save.equipment);
}

export function playerAttackDamage(
  save: RpgSave,
  enemy: CombatEnemy,
  opts?: { crit?: boolean },
): number {
  const ps = computePlayerStats(save);
  const weaponPower = save.equipment.weapon?.power ?? 0;

  const base = 6 + ps.str * 2 + save.level + weaponPower;
  const mult = elementMultiplier(playerElement(save), enemy.element);

  const critMult = opts?.crit ? 1.75 : 1;

  return Math.max(1, Math.floor(base * mult * critMult) - enemy.def);
}

export function enemyAttackDamage(save: RpgSave, enemy: CombatEnemy): number {
  const ps = computePlayerStats(save);
  const armorPower = save.equipment.armor?.power ?? 0;

  const baseDef = Math.floor(ps.con * 0.6) + Math.floor(armorPower * 0.8);
  return Math.max(1, enemy.atk - baseDef);
}
