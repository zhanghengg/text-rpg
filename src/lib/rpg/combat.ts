import type { CombatEnemy, Element, RpgSave } from './state';

import { applyGearToStats } from './gear';
import { elementMultiplier } from './rules';

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

export function playerAttackDamage(save: RpgSave, enemy: CombatEnemy): number {
  const ps = computePlayerStats(save);
  const weaponPower = save.equipment.weapon?.power ?? 0;

  const base = 6 + ps.str * 2 + save.level + weaponPower;
  const mult = elementMultiplier(playerElement(save), enemy.element);

  return Math.max(1, Math.floor(base * mult) - enemy.def);
}

export function enemyAttackDamage(save: RpgSave, enemy: CombatEnemy): number {
  const ps = computePlayerStats(save);
  const armorPower = save.equipment.armor?.power ?? 0;

  const baseDef = Math.floor(ps.con * 0.6) + Math.floor(armorPower * 0.8);
  return Math.max(1, enemy.atk - baseDef);
}
