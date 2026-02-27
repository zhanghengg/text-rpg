import type { Lang } from './i18n';

export type BattleText = {
  encounter: (enemyName: string, level: number) => string;
  brace: (playerName: string) => string;
  escapeOk: (playerName: string) => string;
  escapeFail: () => string;
  miss: (playerName: string) => string;
  hit: (playerName: string, enemyName: string, dmg: number, crit: boolean) => string;
  enemyMiss: (enemyName: string) => string;
  enemyHit: (enemyName: string, dmg: number, guarded: boolean) => string;
  defeated: (enemyName: string, exp: number, gold: number, dropName: string) => string;
  levelUp: (level: number) => string;
  playerDown: (playerName: string) => string;
};

const en: BattleText = {
  encounter: (enemyName, level) => `A wild ${enemyName} (Lv.${level}) emerges from the fog.`,
  brace: (playerName) => `${playerName} braces for impact.`,
  escapeOk: (playerName) => `${playerName} slips away into the mist.`,
  escapeFail: () => 'Escape failed.',
  miss: (playerName) => `${playerName} attacks but misses.`,
  hit: (playerName, enemyName, dmg, crit) =>
    `${playerName} hits ${enemyName} for ${dmg}${crit ? ' (CRIT)' : ''}.`,
  enemyMiss: (enemyName) => `${enemyName} snaps, but misses.`,
  enemyHit: (enemyName, dmg, guarded) => `${enemyName} hits for ${dmg}${guarded ? ' (guarded)' : ''}.`,
  defeated: (enemyName, exp, gold, dropName) => `${enemyName} is defeated. +${exp} EXP, +${gold}g. Found: ${dropName}.`,
  levelUp: (level) => `Level up! You are now Lv.${level}. (+1 VIT)`,
  playerDown: (playerName) => `${playerName} falls. The fog takes what it is owed.`,
};

const zh: BattleText = {
  encounter: (enemyName, level) => `迷雾中出现了 ${enemyName}（Lv.${level}）。`,
  brace: (playerName) => `${playerName} 做好防御姿态。`,
  escapeOk: (playerName) => `${playerName} 退入迷雾，成功脱离战斗。`,
  escapeFail: () => '逃跑失败。',
  miss: (playerName) => `${playerName} 出手落空。`,
  hit: (playerName, enemyName, dmg, crit) =>
    `${playerName} 命中 ${enemyName}，造成 ${dmg} 点伤害${crit ? '（暴击）' : ''}。`,
  enemyMiss: (enemyName) => `${enemyName} 攻击未命中。`,
  enemyHit: (enemyName, dmg, guarded) => `${enemyName} 造成 ${dmg} 点伤害${guarded ? '（已防御）' : ''}。`,
  defeated: (enemyName, exp, gold, dropName) => `${enemyName} 被击败。+${exp} 经验，+${gold} 金币。获得：${dropName}。`,
  levelUp: (level) => `升级！你现在是 Lv.${level}（体质+1）`,
  playerDown: (playerName) => `${playerName} 倒下了。迷雾索取它应得的代价。`,
};

export function getBattleText(lang: Lang): BattleText {
  return lang === 'zh' ? zh : en;
}
