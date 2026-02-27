import type { Action, LogEntry, RpgSave } from './state';

import { chance, mulberry32, rngInt } from './rng';
import { expToNext, makeEnemy, recalcVitals } from './rules';

function logId(t: number) {
  return `${t}_${Math.random().toString(16).slice(2)}`;
}

export function pushLog(logs: LogEntry[], text: string): LogEntry[] {
  const t = Date.now();
  return [...logs, { id: logId(t), t, text }];
}

export type RpgRuntime = {
  save: RpgSave;
  logs: LogEntry[];
};

export function initialRuntime(): RpgRuntime {
  const seed = Math.floor(Date.now() / 1000);
  const save: RpgSave = {
    version: 1,
    name: '冒险者',
    jobId: 'guard',
    level: 1,
    exp: 0,
    expToNext: expToNext(1),
    str: 2,
    agi: 2,
    int: 1,
    con: 2,
    hpMax: 60,
    hp: 60,
    mpMax: 20,
    mp: 20,
    gold: 25,
    mode: 'CAMP',
    mapId: null,
    pos: { x: 0, y: 0 },
    inventory: [{ id: 'potion_small', name: '小型血瓶', kind: 'potion', qty: 2 }],
    seed,
  };

  return {
    save: recalcVitals(save),
    logs: [
      { id: 'init', t: Date.now(), text: '你回到了营地。火堆噼啪作响，迷雾在远处翻涌。' },
      { id: 'hint', t: Date.now(), text: '提示：从营地出发探索，移动会触发遭遇、物资或事件。' },
    ],
  };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function levelUpIfNeeded(rt: RpgRuntime): RpgRuntime {
  let { save, logs } = rt;
  let leveled = false;

  while (save.exp >= save.expToNext) {
    save = { ...save, exp: save.exp - save.expToNext, level: save.level + 1, con: save.con + 1 };
    save = recalcVitals(save);
    save = { ...save, hp: save.hpMax, mp: save.mpMax };
    logs = pushLog(logs, `升级！你现在是 Lv.${save.level}（体质+1，HP/MP回满）`);
    leveled = true;
  }

  return leveled ? { save, logs } : rt;
}

function enterCombat(rt: RpgRuntime, reason: string): RpgRuntime {
  const { save } = rt;
  const enemy = makeEnemy(save.mapId ?? 'wilds', save.seed + save.pos.x * 31 + save.pos.y * 97, save.level);

  return {
    save: {
      ...save,
      mode: 'COMBAT',
      combat: { enemy, turn: 1 },
    },
    logs: pushLog(rt.logs, reason + ` 你遭遇了 ${enemy.name}（Lv.${enemy.level}）！`),
  };
}

export function step(rt: RpgRuntime, action: Action): RpgRuntime {
  let { save, logs } = rt;

  if (action.type === 'NEW_GAME') {
    const seed = action.seed;
    const base: RpgSave = {
      version: 1,
      name: action.name.trim() || '冒险者',
      jobId: action.jobId,
      level: 1,
      exp: 0,
      expToNext: expToNext(1),
      str: action.jobId === 'guard' ? 3 : action.jobId === 'ranger' ? 2 : 1,
      agi: action.jobId === 'rogue' ? 3 : 2,
      int: action.jobId === 'warlock' || action.jobId === 'scholar' ? 3 : 1,
      con: 2,
      hpMax: 60,
      hp: 60,
      mpMax: 20,
      mp: 20,
      gold: 25,
      mode: 'CAMP',
      mapId: null,
      pos: { x: 0, y: 0 },
      inventory: [{ id: 'potion_small', name: '小型血瓶', kind: 'potion', qty: 2 }],
      seed,
    };

    return {
      save: recalcVitals(base),
      logs: [
        { id: 'init', t: Date.now(), text: `欢迎，${base.name}。你在营地醒来。` },
        { id: 'hint', t: Date.now(), text: '从营地选择“出城探索”进入地图。' },
      ],
    };
  }

  if (action.type === 'CAMP_REST') {
    if (save.mode !== 'CAMP') return rt;
    const cost = 10;
    if (save.gold < cost) {
      return { save, logs: pushLog(logs, '金币不足，无法休息。') };
    }
    save = recalcVitals({ ...save, gold: save.gold - cost, hp: save.hpMax, mp: save.mpMax });
    logs = pushLog(logs, `你休息了一会儿（-${cost}金币），HP/MP已恢复。`);
    return { save, logs };
  }

  if (action.type === 'CAMP_START_EXPLORE') {
    if (save.mode !== 'CAMP') return rt;
    save = { ...save, mode: 'EXPLORING', mapId: action.mapId, pos: { x: 0, y: 0 } };
    logs = pushLog(logs, `你离开营地，进入区域：${action.mapId === 'slime_plains' ? '史莱姆平原' : '幽暗森林'}（0,0）。`);
    return { save, logs };
  }

  if (action.type === 'MOVE') {
    if (save.mode !== 'EXPLORING') return rt;

    const size = 5;
    const dx = action.dir === 'E' ? 1 : action.dir === 'W' ? -1 : 0;
    const dy = action.dir === 'S' ? 1 : action.dir === 'N' ? -1 : 0;

    const nx = clamp(save.pos.x + dx, 0, size - 1);
    const ny = clamp(save.pos.y + dy, 0, size - 1);

    if (nx === save.pos.x && ny === save.pos.y) {
      return { save, logs: pushLog(logs, '你撞上了边界，走不动。') };
    }

    save = { ...save, pos: { x: nx, y: ny } };
    logs = pushLog(logs, `你移动到 (${nx},${ny})。`);

    const r = mulberry32(save.seed + nx * 31 + ny * 97);
    const roll = r();

    if (roll < 0.40) {
      return enterCombat({ save, logs }, '迷雾翻涌，脚下传来急促的声响。');
    }

    if (roll < 0.60) {
      const g = rngInt(r, 4, 12);
      save = { ...save, gold: save.gold + g };
      logs = pushLog(logs, `你找到一些物资：+${g}金币。`);
      return { save, logs };
    }

    if (roll < 0.70) {
      if (chance(r, 0.5)) {
        const dmg = rngInt(r, 3, 9);
        save = { ...save, hp: Math.max(0, save.hp - dmg) };
        logs = pushLog(logs, `你踩中陷阱，失去 ${dmg} HP。`);
      } else {
        const heal = rngInt(r, 4, 10);
        save = { ...save, hp: Math.min(save.hpMax, save.hp + heal) };
        logs = pushLog(logs, `你发现一处泉水，恢复 ${heal} HP。`);
      }

      if (save.hp <= 0) {
        save = recalcVitals({ ...save, mode: 'CAMP', mapId: null, pos: { x: 0, y: 0 }, gold: Math.max(0, save.gold - 10) });
        logs = pushLog(logs, '你倒下了，被人拖回营地。你损失了一些金币。');
      }

      return { save, logs };
    }

    logs = pushLog(logs, '这里暂时很安全，没有发生什么。');
    return { save, logs };
  }

  if (action.type === 'COMBAT_ATTACK') {
    if (save.mode !== 'COMBAT' || !save.combat) return rt;

    const enemy = { ...save.combat.enemy };
    const pAtk = 6 + save.str * 2 + save.level;
    const dmg = Math.max(1, pAtk - enemy.def);
    enemy.hp = Math.max(0, enemy.hp - dmg);
    logs = pushLog(logs, `你攻击 ${enemy.name}，造成 ${dmg} 点伤害。`);

    if (enemy.hp <= 0) {
      const exp = 12 + enemy.level * 6;
      const gold = 6 + enemy.level * 4;
      save = { ...save, mode: 'EXPLORING', combat: undefined, exp: save.exp + exp, gold: save.gold + gold };
      logs = pushLog(logs, `${enemy.name} 被击败！+${exp} 经验，+${gold} 金币。`);
      return levelUpIfNeeded({ save, logs });
    }

    const eDmg = Math.max(1, enemy.atk - Math.floor(save.con * 0.6));
    save = { ...save, hp: Math.max(0, save.hp - eDmg), combat: { enemy, turn: save.combat.turn + 1 } };
    logs = pushLog(logs, `${enemy.name} 反击，造成 ${eDmg} 点伤害。`);

    if (save.hp <= 0) {
      save = recalcVitals({ ...save, mode: 'CAMP', mapId: null, pos: { x: 0, y: 0 }, gold: Math.max(0, save.gold - 15) });
      logs = pushLog(logs, '你倒下了。醒来时你已在营地，损失了一些金币。');
      return { save, logs };
    }

    return { save, logs };
  }

  if (action.type === 'COMBAT_ESCAPE') {
    if (save.mode !== 'COMBAT' || !save.combat) return rt;

    const r = mulberry32(save.seed + save.combat.turn * 999);
    const ok = r() < 0.45;
    if (ok) {
      save = { ...save, mode: 'EXPLORING', combat: undefined };
      logs = pushLog(logs, '你成功逃跑，退回迷雾之中。');
      return { save, logs };
    }

    logs = pushLog(logs, '你试图逃跑，但失败了！');
    const enemy = { ...save.combat.enemy };
    const eDmg = Math.max(1, enemy.atk - Math.floor(save.con * 0.6));
    save = { ...save, hp: Math.max(0, save.hp - eDmg), combat: { enemy, turn: save.combat.turn + 1 } };
    logs = pushLog(logs, `${enemy.name} 追击，造成 ${eDmg} 点伤害。`);

    if (save.hp <= 0) {
      save = recalcVitals({ ...save, mode: 'CAMP', mapId: null, pos: { x: 0, y: 0 }, gold: Math.max(0, save.gold - 15) });
      logs = pushLog(logs, '你倒下了。醒来时你已在营地，损失了一些金币。');
    }

    return { save, logs };
  }

  if (action.type === 'USE_POTION') {
    const it = save.inventory.find((x) => x.id === 'potion_small');
    if (!it || !it.qty) {
      return { save, logs: pushLog(logs, '你没有血瓶。') };
    }
    if (save.hp >= save.hpMax) {
      return { save, logs: pushLog(logs, '你现在不需要用血瓶。') };
    }

    const heal = 18;
    save = { ...save, hp: Math.min(save.hpMax, save.hp + heal) };
    it.qty -= 1;
    save = { ...save, inventory: save.inventory.filter((x) => x.qty === undefined || x.qty > 0) };
    logs = pushLog(logs, `你使用小型血瓶，恢复 ${heal} HP。`);
    return { save, logs };
  }

  return rt;
}
