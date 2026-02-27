import type { BattleLogEntry, BattleState, Enemy, Item, Player } from './types';

import { ENEMIES, STARTER_ITEMS } from './content';
import { getBattleText } from './i18n/battle';
import { rollDrop } from './loot/loot';
import { mulberry32, pickOne, rngInt } from './rng';
import { baseStatsForJob, calcDerived, expToNext } from './rules';

export function newGame(name: string, job: Player['job']): Player {
  const stats = baseStatsForJob(job);
  const starter = STARTER_ITEMS[job] ?? [];
  const derived = calcDerived(stats, starter);

  return {
    name: name.trim() || 'Adventurer',
    lang: 'en',
    job,
    level: 1,
    exp: 0,
    expToNext: expToNext(1),

    stats,
    derived,

    hp: derived.hpMax,
    resource: 0,
    gold: 25,

    inventory: [...starter],
    equipment: {},

    world: {
      seed: Math.floor(Date.now() / 1000),
      mapId: 'borderlands',
      nodeId: 'camp',
      danger: 1,
      fog: 0,
      chapter: 1,
      unlockedMaps: { borderlands: true },
    },
  };
}

export function recalcPlayer(p: Player): Player {
  const equipped = Object.values(p.equipment).filter(Boolean) as Item[];
  const derived = calcDerived(p.stats, [...equipped]);
  const hp = Math.min(p.hp, derived.hpMax);

  return {
    ...p,
    derived,
    hp,
    expToNext: expToNext(p.level),
  };
}

export function startBattle(seed: number, p: Player): BattleState {
  const r = mulberry32(seed);
  const base = pickOne(r, ENEMIES);
  const level = Math.max(1, Math.min(p.level + rngInt(r, -1, 1), p.level + 2));
  const enemy: Enemy = {
    ...base,
    id: `${base.id}_${seed}`,
    level,
    hpMax: Math.floor(base.hpMax * (1 + (level - 1) * 0.22)),
    atk: Math.floor(base.atk * (1 + (level - 1) * 0.18)),
    def: Math.floor(base.def * (1 + (level - 1) * 0.15)),
  };

  const bt = getBattleText(p.lang === 'zh' ? 'zh' : 'en');

  const log: BattleLogEntry[] = [
    { t: Date.now(), side: 'system', text: bt.encounter(enemy.name, enemy.level) },
  ];

  return {
    seed,
    turn: 1,
    playerHp: p.hp,
    playerResource: p.resource,
    enemy,
    enemyHp: enemy.hpMax,
    log,
    status: 'inBattle',
  };
}

function hitRoll(r: () => number, hit: number, dodge: number) {
  const chance = Math.max(5, Math.min(95, hit - dodge * 0.6));
  return r() * 100 < chance;
}

function critRoll(r: () => number, crit: number) {
  const chance = Math.max(0, Math.min(60, crit));
  return r() * 100 < chance;
}

function damage(atk: number, def: number) {
  const raw = atk - def;
  return Math.max(1, Math.floor(raw * (raw >= 0 ? 1 : 0.6)));
}

export type PlayerAction = 'attack' | 'defend' | 'skill1' | 'item' | 'escape';

export function stepBattle(p: Player, b: BattleState, action: PlayerAction) {
  if (b.status !== 'inBattle') return { player: p, battle: b };

  const r = mulberry32(b.seed + b.turn * 999);
  const log = [...b.log];

  const bt = getBattleText(p.lang === 'zh' ? 'zh' : 'en');

  const pHit = p.derived.hit;
  const pCrit = p.derived.crit;

  let playerHp = b.playerHp;
  let enemyHp = b.enemyHp;

  let defend = false;

  if (action === 'defend') {
    defend = true;
    log.push({ t: Date.now(), side: 'player', text: bt.brace(p.name) });
  } else if (action === 'escape') {
    const ok = r() < 0.45;
    if (ok) {
      log.push({ t: Date.now(), side: 'system', text: bt.escapeOk(p.name) });
      const battle: BattleState = { ...b, log, status: 'escaped', playerHp, enemyHp, turn: b.turn + 1 };
      return { player: { ...p, hp: playerHp }, battle };
    }
    log.push({ t: Date.now(), side: 'system', text: bt.escapeFail() });
  } else {
    const hit = hitRoll(r, pHit, 0);
    if (!hit) {
      log.push({ t: Date.now(), side: 'player', text: bt.miss(p.name) });
    } else {
      const crit = critRoll(r, pCrit);
      const dmg = damage(p.derived.atk, b.enemy.def);
      const dealt = crit ? Math.floor(dmg * 1.6) : dmg;
      enemyHp = Math.max(0, enemyHp - dealt);
      log.push({
        t: Date.now(),
        side: 'player',
        text: bt.hit(p.name, b.enemy.name, dealt, crit),
      });
    }
  }

  if (enemyHp <= 0) {
    const exp = 14 + b.enemy.level * 8;
    const gold = 6 + b.enemy.level * 4;

    const dropSeed = b.seed + 17;
    const drop = rollDrop(dropSeed, p.level, p.job, p.lang === 'zh' ? 'zh' : 'en');

    log.push({
      t: Date.now(),
      side: 'system',
      text: bt.defeated(b.enemy.name, exp, gold, drop.name),
    });

    let next: Player = {
      ...p,
      hp: playerHp,
      gold: p.gold + gold,
      exp: p.exp + exp,
      inventory: [drop, ...p.inventory],
    };
    next = levelUpIfNeeded(next, log);

    // If the player came from Explore and had a pending battle, clear it.
    if (next.world.pendingBattleSeed) {
      next = {
        ...next,
        world: {
          ...next.world,
          pendingBattleSeed: undefined,
        },
      };
    }

    const battle: BattleState = {
      ...b,
      log,
      enemyHp,
      playerHp,
      status: 'won',
      turn: b.turn + 1,
    };

    return { player: recalcPlayer(next), battle };
  }

  const enemyHit = hitRoll(r, 78 + b.enemy.level * 2, p.derived.dodge);
  if (!enemyHit) {
    log.push({ t: Date.now(), side: 'enemy', text: bt.enemyMiss(b.enemy.name) });
  } else {
    const dmg = damage(b.enemy.atk, p.derived.def);
    const reduced = defend ? Math.floor(dmg * 0.55) : dmg;
    playerHp = Math.max(0, playerHp - reduced);
    log.push({
      t: Date.now(),
      side: 'enemy',
      text: bt.enemyHit(b.enemy.name, reduced, defend),
    });
  }

  if (playerHp <= 0) {
    log.push({
      t: Date.now(),
      side: 'system',
      text: bt.playerDown(p.name),
    });

    const battle: BattleState = {
      ...b,
      log,
      enemyHp,
      playerHp,
      status: 'lost',
      turn: b.turn + 1,
    };

    return { player: { ...p, hp: 0 }, battle };
  }

  const battle: BattleState = {
    ...b,
    log,
    enemyHp,
    playerHp,
    turn: b.turn + 1,
  };

  return { player: { ...p, hp: playerHp }, battle };
}

function levelUpIfNeeded(p: Player, log: BattleLogEntry[]) {
  const bt = getBattleText(p.lang === 'zh' ? 'zh' : 'en');
  let cur = { ...p };

  while (cur.exp >= cur.expToNext) {
    cur.exp -= cur.expToNext;
    cur.level += 1;

    cur.stats = {
      ...cur.stats,
      vit: cur.stats.vit + 1,
    };

    log.push({ t: Date.now(), side: 'system', text: bt.levelUp(cur.level) });

    cur.expToNext = expToNext(cur.level);
    cur = recalcPlayer(cur);
    cur.hp = cur.derived.hpMax;
  }

  return cur;
}
