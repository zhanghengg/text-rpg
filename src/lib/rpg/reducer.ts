import type { Action, LogEntry, RpgItem, RpgSave } from './state';

import { inBounds, poiAt, regionOf } from './regions';

import { chance, mulberry32, rngInt } from './rng';
import { rollGear } from './gear';
import { applyDotToPlayer, expToNext, makeEnemy, pushOrRefreshStatus, recalcVitals } from './rules';
import { SHOP_STOCK, sellPrice } from './shop';

import { computePlayerStats, enemyAttackDamage, playerAttackDamage, playerElement, rollHit } from './combat';

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
    version: 2,
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
    equipment: {},
    statuses: [],
    seed,
  };

  return {
    save: recalcVitals(save),
    logs: [
      { id: 'init', t: Date.now(), text: '你回到了营地。火堆噼啪作响，迷雾在远处翻涌。' },
      { id: 'hint', t: Date.now(), text: '提示：从营地出发探索，移动会触发遭遇、物资或事件。' },
      { id: 'hint2', t: Date.now(), text: '提示：击败怪物有概率掉落装备（武器/护甲/饰品），在背包里可穿戴。' },
    ],
  };
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
  const enemy = makeEnemy(save.mapId ?? 'breeze_plains', save.seed + save.pos.x * 31 + save.pos.y * 97, save.level);

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
      version: 2,
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
      equipment: {},
      statuses: [],
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

  if (action.type === 'SET_MODE') {
    if (action.mode !== 'CAMP') return rt;
    save = recalcVitals({ ...save, mode: 'CAMP', mapId: null, pos: { x: 0, y: 0 }, combat: undefined });
    logs = pushLog(logs, '你回到了营地。火堆噼啪作响，迷雾在远处翻涌。');
    return { save, logs };
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

  if (action.type === 'CAMP_OPEN_SHOP') {
    if (save.mode !== 'CAMP') return rt;
    save = { ...save, mode: 'SHOP' };
    logs = pushLog(logs, '你走进营地商店。老板抬头看了你一眼。');
    return { save, logs };
  }

  if (action.type === 'SHOP_BUY') {
    if (save.mode !== 'SHOP') return rt;
    const stock = SHOP_STOCK.find((x) => x.id === action.itemId);
    if (!stock || !stock.price) return rt;

    if (save.gold < stock.price) {
      return { save, logs: pushLog(logs, '金币不足。') };
    }

    // Add one item (stack potions).
    const inv = [...save.inventory];
    const ex = inv.find((x) => x.id === stock.id);
    if (ex && ex.kind === 'potion') ex.qty = (ex.qty ?? 1) + 1;
    else inv.push({ ...stock, kind: 'potion', qty: 1 });

    save = { ...save, gold: save.gold - stock.price, inventory: inv };
    logs = pushLog(logs, `购买：${stock.name}（-${stock.price}金币）。`);
    return { save, logs };
  }

  if (action.type === 'SHOP_SELL') {
    if (save.mode !== 'SHOP') return rt;
    const inv = [...save.inventory];
    const idx = inv.findIndex((x) => x.id === action.itemId);
    if (idx < 0) return rt;

    const it = { ...inv[idx] };
    const price = sellPrice(it);

    if (it.kind === 'potion' && it.qty && it.qty > 1) {
      it.qty -= 1;
      inv[idx] = it;
    } else {
      inv.splice(idx, 1);
    }

    save = { ...save, gold: save.gold + price, inventory: inv };
    logs = pushLog(logs, `出售：${it.name}（+${price}金币）。`);
    return { save, logs };
  }

  if (action.type === 'SHOP_LEAVE') {
    if (save.mode !== 'SHOP') return rt;
    save = { ...save, mode: 'CAMP' };
    logs = pushLog(logs, '你离开商店，回到营地。');
    return { save, logs };
  }

  if (action.type === 'CAMP_START_EXPLORE') {
    if (save.mode !== 'CAMP') return rt;

    const mapId = action.mapId as unknown as RpgSave['mapId'];
    if (!mapId) return rt;
    const region = regionOf(mapId);

    save = { ...save, mode: 'EXPLORING', mapId, pos: { x: 0, y: 0 } };
    logs = pushLog(logs, `你离开营地，进入区域：${region.nameZh}（0,0）。`);
    return { save, logs };
  }

  if (action.type === 'MOVE') {
    if (save.mode !== 'EXPLORING' || !save.mapId) return rt;

    const region = regionOf(save.mapId);
    const dx = action.dir === 'E' ? 1 : action.dir === 'W' ? -1 : 0;
    const dy = action.dir === 'S' ? 1 : action.dir === 'N' ? -1 : 0;

    const next = { x: save.pos.x + dx, y: save.pos.y + dy };
    if (!inBounds(save.mapId, next)) {
      return { save, logs: pushLog(logs, '你撞上了边界，走不动。') };
    }

    save = { ...save, pos: next };
    logs = pushLog(logs, `你移动到 (${next.x},${next.y})。`);

    const poi = poiAt(save.mapId!, next);
    if (poi?.id === 'campfire') {
      const key = `poi_${save.mapId}_campfire_used`;
      const used = save.inventory.some((x) => x.id === key);
      if (!used) {
        save = recalcVitals({ ...save, hp: save.hpMax, mp: save.mpMax, inventory: [...save.inventory, { id: key, name: '营火记忆', kind: 'flag' }] });
        logs = pushLog(logs, '你在营火旁坐下，免费恢复一次 HP/MP。');
      } else {
        logs = pushLog(logs, '营火已经熄灭，只剩余温。');
      }
      return { save, logs };
    }

    if (poi?.id === 'slime_throne') {
      return enterCombat({ save, logs }, '你踏入王座之地，黏液如潮水般翻涌。');
    }

    if (poi?.id === 'hunter_hut') {
      // Hidden shop: sells a couple of class-neutral consumables and one random gear.
      const r0 = mulberry32(save.seed + next.x * 31 + next.y * 97 + 1337);
      const offerGear = rollGear(save.seed + next.x * 999 + next.y * 777 + 4242, chance(r0, 0.5) ? 'accessory' : 'weapon', save.level + 1, 'wind');

      const key = `poi_${save.mapId}_hunter_hut_opened`;
      const opened = save.inventory.some((x) => x.id === key);
      if (!opened) {
        save = { ...save, inventory: [...save.inventory, { id: key, name: '猎人暗号', kind: 'flag' }] };
        logs = pushLog(logs, '你敲了敲门。猎人打量你一眼，悄悄推开暗门：隐藏商店开启。');
      } else {
        logs = pushLog(logs, '猎人小屋的暗门仍开着，你可以继续交易。');
      }

      const prices = {
        potion: 12,
        bandage: 14,
        gear: 28,
      };

      // Auto-buy micro flow (keeps UI simple): if enough gold, you can get one thing per visit.
      if (save.gold >= prices.gear && chance(r0, 0.35)) {
        save = { ...save, gold: save.gold - prices.gear, inventory: [offerGear, ...save.inventory] };
        logs = pushLog(logs, `你从隐藏货架挑走一件装备（-${prices.gear}金币）：${offerGear.name}。`);
      } else if (save.gold >= prices.bandage && chance(r0, 0.5)) {
        const heal = rngInt(r0, 10, 18);
        save = { ...save, gold: save.gold - prices.bandage, hp: Math.min(save.hpMax, save.hp + heal) };
        logs = pushLog(logs, `你买到一卷绷带（-${prices.bandage}金币），当场处理伤口：HP +${heal}。`);
      } else if (save.gold >= prices.potion) {
        // Add potion (stack).
        const inv = [...save.inventory];
        const ex = inv.find((x) => x.id === 'potion_small');
        if (ex && ex.kind === 'potion') ex.qty = (ex.qty ?? 1) + 1;
        else inv.push({ id: 'potion_small', name: '小型血瓶', kind: 'potion', qty: 1 });
        save = { ...save, gold: save.gold - prices.potion, inventory: inv };
        logs = pushLog(logs, `你从猎人手里买到一瓶血瓶（-${prices.potion}金币）。`);
      } else {
        logs = pushLog(logs, '你掏了掏口袋……金币不够，猎人耸耸肩。');
      }

      return { save, logs };
    }

    if (poi?.id === 'spider_nest') {
      return enterCombat({ save, logs }, '你闯入蜘蛛巢穴。腐叶下的视线齐刷刷落在你身上。');
    }

    if (poi?.id === 'lava_anvil') {
      const key = `poi_${save.mapId}_lava_anvil_used`;
      const used = save.inventory.some((x) => x.id === key);

      if (used) {
        logs = pushLog(logs, '熔岩铁砧已经冷却。');
        return { save, logs };
      }

      // One-time upgrade: improve equipped weapon/armor/accessory by +1 power.
      // Picks the best available slot (weapon > armor > accessory) for clarity.
      const slot = save.equipment.weapon ? 'weapon' : save.equipment.armor ? 'armor' : save.equipment.accessory ? 'accessory' : null;
      if (!slot) {
        save = { ...save, inventory: [...save.inventory, { id: key, name: '铁砧印记', kind: 'flag' }] };
        logs = pushLog(logs, '你靠近熔岩铁砧，但身上没有可升级的装备（仍消耗一次机会）。');
        return { save, logs };
      }

      const prev = save.equipment[slot]!;
      const nextGear = { ...prev, power: prev.power + 1 };

      save = recalcVitals({
        ...save,
        equipment: { ...save.equipment, [slot]: nextGear },
        inventory: [...save.inventory, { id: key, name: '铁砧印记', kind: 'flag' }],
      });

      logs = pushLog(logs, `熔岩铁砧轰鸣作响：${prev.name} 被强化（战力 +1）。`);
      return { save, logs };
    }

    const r = mulberry32(save.seed + next.x * 31 + next.y * 97 + region.w * 1000 + region.h * 2000);
    const roll = r();

    if (roll < region.encounterRate) {
      return enterCombat({ save, logs }, '迷雾翻涌，脚下传来急促的声响。');
    }

    if (roll < region.encounterRate + 0.18) {
      const g = rngInt(r, region.rewardGold.min, region.rewardGold.max);
      save = { ...save, gold: save.gold + g };
      logs = pushLog(logs, `你找到一些物资：+${g}金币。`);
      return { save, logs };
    }

    const merchantGate = region.encounterRate + 0.18;
    const trapGate = merchantGate + region.merchantRate;
    const miscGate = trapGate + region.trapRate;

    // Mysterious merchant.
    if (roll < trapGate) {
      const buy = chance(r, 0.6);
      const offer = chance(r, 0.5)
        ? { kind: 'potion' as const, price: 13, label: '小型血瓶' }
        : { kind: 'gear' as const, price: 30, label: '一件随机装备' };

      if (!buy) {
        logs = pushLog(logs, '神秘商人从雾里探出头，见你沉默便又缩了回去。');
        return { save, logs };
      }

      if (save.gold < offer.price) {
        logs = pushLog(logs, `神秘商人展示了“${offer.label}”（${offer.price}金币），但你付不起。`);
        return { save, logs };
      }

      if (offer.kind === 'potion') {
        const inv = [...save.inventory];
        const ex = inv.find((x) => x.id === 'potion_small');
        if (ex && ex.kind === 'potion') ex.qty = (ex.qty ?? 1) + 1;
        else inv.push({ id: 'potion_small', name: '小型血瓶', kind: 'potion', qty: 1 });
        save = { ...save, gold: save.gold - offer.price, inventory: inv };
        logs = pushLog(logs, `你向神秘商人购买：${offer.label}（-${offer.price}金币）。`);
        return { save, logs };
      }

      const slot = chance(r, 0.33) ? 'weapon' : chance(r, 0.5) ? 'armor' : 'accessory';
      const gear = rollGear(save.seed + next.x * 31 + next.y * 97 + 8080, slot, save.level + 1, playerElement(save));
      save = { ...save, gold: save.gold - offer.price, inventory: [gear, ...save.inventory] };
      logs = pushLog(logs, `你向神秘商人购买：${gear.name}（-${offer.price}金币）。`);
      return { save, logs };
    }

    // Hidden trap: agility check + bleed.
    if (roll < miscGate) {
      const ps = computePlayerStats(save);
      const dc = save.mapId === 'ember_caverns' ? 12 : save.mapId === 'whispering_forest' ? 10 : 8;
      const check = ps.agi + rngInt(r, 1, 12);
      if (check >= dc) {
        logs = pushLog(logs, '你发现地面异常，及时避开：敏捷判定成功。');
      } else {
        const dmg = rngInt(r, 3, 8) + (save.mapId === 'ember_caverns' ? 2 : 0);
        save = { ...save, hp: Math.max(0, save.hp - dmg), statuses: pushOrRefreshStatus(save.statuses, { id: 'bleed', turns: 3, dmgPerTurn: 3 }) };
        logs = pushLog(logs, `你踩中隐蔽陷阱，失去 ${dmg} HP，并进入流血（3回合）。`);
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
    const combat = save.combat;

    // Start of player turn: status DOTs tick.
    {
      const dot = applyDotToPlayer(save, []);
      if (dot.logs.length) logs = [...logs, ...dot.logs.map((t) => ({ id: logId(Date.now()), t: Date.now(), text: t }))];
      save = dot.save;
      if (save.hp <= 0) {
        save = recalcVitals({ ...save, mode: 'CAMP', mapId: null, pos: { x: 0, y: 0 }, combat: undefined, gold: Math.max(0, save.gold - 15) });
        logs = pushLog(logs, '你在毒素中倒下，被人拖回营地。你损失了一些金币。');
        return { save, logs };
      }
    }

    const enemy = { ...combat.enemy };

    // Player attack: hit/crit.
    const ps = computePlayerStats(save);
    const hitSeed = save.seed + combat.turn * 911 + save.pos.x * 31 + save.pos.y * 97 + enemy.level * 17;
    const hit = rollHit(hitSeed, save, enemy);

    if (!hit.hit) {
      logs = pushLog(logs, `你出手攻击 ${enemy.name}，但被闪开了（命中 ${(hit.hitChance * 100).toFixed(0)}%）。`);
    } else {
      const dmg = playerAttackDamage(save, enemy, { crit: hit.crit });
      enemy.hp = Math.max(0, enemy.hp - dmg);

      // Lifesteal on player hit.
      if (ps.lifestealPct > 0) {
        const heal = Math.max(0, Math.floor((dmg * ps.lifestealPct) / 100));
        if (heal > 0) save = { ...save, hp: Math.min(save.hpMax, save.hp + heal) };
        logs = pushLog(
          logs,
          `你攻击 ${enemy.name}，造成 ${dmg} 点伤害${hit.crit ? '（暴击）' : ''}（吸血 +${Math.max(0, Math.floor((dmg * ps.lifestealPct) / 100))}）。`,
        );
      } else {
        logs = pushLog(logs, `你攻击 ${enemy.name}，造成 ${dmg} 点伤害${hit.crit ? '（暴击）' : ''}。`);
      }
    }

    if (enemy.hp <= 0) {
      const exp = 12 + enemy.level * 6 + (enemy.tier === 'elite' ? 12 : enemy.tier === 'boss' ? 35 : 0);
      const gold = 6 + enemy.level * 4 + (enemy.tier === 'elite' ? 10 : enemy.tier === 'boss' ? 25 : 0);

      // Dark-ish gear drop.
      const r = mulberry32(save.seed + enemy.level * 777 + save.pos.x * 31 + save.pos.y * 97);
      const dropRoll = r();
      const drops: RpgItem[] = [];
      if (dropRoll < (enemy.tier === 'boss' ? 0.95 : enemy.tier === 'elite' ? 0.55 : 0.25)) {
        const slot = dropRoll < 0.33 ? 'weapon' : dropRoll < 0.66 ? 'armor' : 'accessory';
        const gear = rollGear(save.seed + enemy.level * 999 + save.pos.x * 31 + save.pos.y * 97, slot, save.level, enemy.element);
        drops.push(gear);

        // Spider Nest is explicitly "high risk / high reward": guaranteed extra drop.
        // Use a stable roll (avoid reusing the same RNG state after dropRoll decisions).
        if (save.mapId === 'whispering_forest' && save.pos.x === 7 && save.pos.y === 7) {
          const rr = mulberry32(save.seed + enemy.level * 2003 + save.pos.x * 131 + save.pos.y * 197 + 77);
          const slot2 = rr() < 0.34 ? 'accessory' : rr() < 0.67 ? 'weapon' : 'armor';
          const gear2 = rollGear(save.seed + enemy.level * 1999 + save.pos.x * 131 + save.pos.y * 197 + 77, slot2, save.level + 1, enemy.element);
          drops.push(gear2);
          logs = pushLog(logs, '蜘蛛巢穴的战利品格外丰厚……你又摸到一件额外掉落。');
        }
      }

      save = {
        ...save,
        mode: 'EXPLORING',
        combat: undefined,
        exp: save.exp + exp,
        gold: save.gold + gold,
        statuses: [],
        inventory: [...save.inventory, ...drops],
      };
      logs = pushLog(logs, `${enemy.name} 被击败！+${exp} 经验，+${gold} 金币。`);
      for (const d of drops) logs = pushLog(logs, `掉落：${d.name}。`);
      return levelUpIfNeeded({ save, logs });
    }

    // Enemy turn.

    // Intent/windup: goblin brute heavy strike.
    if (enemy.intent?.id === 'goblin_heavy_strike') {
      const turnsLeft = enemy.intent.turnsLeft - 1;
      if (turnsLeft > 0) {
        enemy.intent = { id: 'goblin_heavy_strike', turnsLeft };
        logs = pushLog(logs, `${enemy.name} 正在蓄力重击……`);
      } else {
        enemy.intent = null;
        const base = enemyAttackDamage(save, enemy);
        const heavy = Math.max(1, Math.floor(base * 1.8));
        save = { ...save, hp: Math.max(0, save.hp - heavy) };
        logs = pushLog(logs, `${enemy.name} 释放重击！你失去 ${heavy} HP。`);
      }
    } else {
      // Passive enemy skills.
      if (enemy.archetypeId === 'goblin_brute') {
        // Start windup.
        enemy.intent = { id: 'goblin_heavy_strike', turnsLeft: 1 };
        logs = pushLog(logs, `${enemy.name} 抬起巨棒，开始蓄力……`);
      } else {
        const eDmg = enemyAttackDamage(save, enemy);
        save = { ...save, hp: Math.max(0, save.hp - eDmg) };
        logs = pushLog(logs, `${enemy.name} 攻击，造成 ${eDmg} 点伤害。`);

        // Bat lifesteal.
        if (enemy.archetypeId === 'bat' || enemy.archetypeId === 'cave_bat') {
          const heal = Math.max(0, Math.floor(eDmg * (enemy.archetypeId === 'bat' ? 0.35 : 0.3)));
          if (heal > 0) {
            enemy.hp = Math.min(enemy.hpMax, enemy.hp + heal);
            logs = pushLog(logs, `${enemy.name} 吸血，恢复 ${heal} HP。`);
          }
        }

        // Spider poison.
        if (enemy.archetypeId === 'forest_spider' || enemy.archetypeId === 'spider_queen') {
          save = { ...save, statuses: pushOrRefreshStatus(save.statuses, { id: 'poison', turns: enemy.archetypeId === 'spider_queen' ? 4 : 3, pctMaxHpPerTurn: 0.05 }) };
          logs = pushLog(logs, '毒牙刺入皮肤：你中毒了（每回合扣最大HP 5%）。');
        }

        // Ember slime/golem burns.
        if (enemy.archetypeId === 'ember_slime' || enemy.archetypeId === 'ember_golem' || enemy.archetypeId === 'magma_wyrm') {
          const turns = enemy.archetypeId === 'magma_wyrm' ? 3 : 2;
          const dmgPerTurn = enemy.archetypeId === 'ember_golem' ? 5 : enemy.archetypeId === 'magma_wyrm' ? 7 : 4;
          save = { ...save, statuses: pushOrRefreshStatus(save.statuses, { id: 'burn', turns, dmgPerTurn }) };
          logs = pushLog(logs, `炽热的余烬粘在你身上：你被灼烧了（${turns}回合）。`);
        }

        // Slime split: heal itself a bit (represents splitting).
        if (enemy.archetypeId === 'slime_splitter' || enemy.archetypeId === 'slime_king') {
          const heal = Math.max(1, Math.floor(enemy.hpMax * 0.06));
          enemy.hp = Math.min(enemy.hpMax, enemy.hp + heal);
          logs = pushLog(logs, `${enemy.name} 分裂再聚合，恢复 ${heal} HP。`);
        }
      }
    }

    save = { ...save, combat: { enemy, turn: combat.turn + 1 } };

    // Thorns retaliation.
    const ps2 = computePlayerStats(save);
    if (ps2.thorns > 0) {
      enemy.hp = Math.max(0, enemy.hp - ps2.thorns);
      logs = pushLog(logs, `你的荆棘反伤：${enemy.name} 受到 ${ps2.thorns} 伤害。`);
      save = { ...save, combat: { enemy, turn: combat.turn } };
      if (enemy.hp <= 0) {
        const exp = 12 + enemy.level * 6;
        const gold = 6 + enemy.level * 4;
        save = { ...save, mode: 'EXPLORING', combat: undefined, exp: save.exp + exp, gold: save.gold + gold, statuses: [] };
        logs = pushLog(logs, `${enemy.name} 被反伤击败！+${exp} 经验，+${gold} 金币。`);
        return levelUpIfNeeded({ save, logs });
      }
    }

    if (save.hp <= 0) {
      save = recalcVitals({ ...save, mode: 'CAMP', mapId: null, pos: { x: 0, y: 0 }, gold: Math.max(0, save.gold - 15) });
      logs = pushLog(logs, '你倒下了。醒来时你已在营地，损失了一些金币。');
      return { save, logs };
    }

    return { save, logs };
  }

  if (action.type === 'COMBAT_ESCAPE') {
    if (save.mode !== 'COMBAT' || !save.combat) return rt;

    const combat = save.combat;
    const r = mulberry32(save.seed + combat.turn * 999);
    const ok = r() < 0.45;
    if (ok) {
      save = { ...save, mode: 'EXPLORING', combat: undefined };
      logs = pushLog(logs, '你成功逃跑，退回迷雾之中。');
      return { save, logs };
    }

    logs = pushLog(logs, '你试图逃跑，但失败了！');
    const enemy = { ...combat.enemy };
    const eDmg = enemyAttackDamage(save, enemy);
    save = { ...save, hp: Math.max(0, save.hp - eDmg), combat: { enemy, turn: combat.turn + 1 } };
    logs = pushLog(logs, `${enemy.name} 追击，造成 ${eDmg} 点伤害。`);

    if (save.hp <= 0) {
      save = recalcVitals({ ...save, mode: 'CAMP', mapId: null, pos: { x: 0, y: 0 }, gold: Math.max(0, save.gold - 15) });
      logs = pushLog(logs, '你倒下了。醒来时你已在营地，损失了一些金币。');
    }

    return { save, logs };
  }

  if (action.type === 'EQUIP_GEAR') {
    const idx = save.inventory.findIndex((x) => x.id === action.itemId);
    if (idx < 0) return rt;
    const it = save.inventory[idx];
    if (!isGear(it)) return { save, logs: pushLog(logs, '这不是装备，无法穿戴。') };

    const nextInv = [...save.inventory];
    nextInv.splice(idx, 1);

    const prev = save.equipment[it.slot];
    if (prev) nextInv.push(prev);

    save = recalcVitals({ ...save, inventory: nextInv, equipment: { ...save.equipment, [it.slot]: it } });
    logs = pushLog(logs, `你穿戴了：${it.name}。`);
    if (prev) logs = pushLog(logs, `卸下：${prev.name}。`);
    return { save, logs };
  }

  if (action.type === 'UNEQUIP_GEAR') {
    const prev = save.equipment[action.slot];
    if (!prev) return rt;
    const nextInv = [...save.inventory, prev];
    const nextEq = { ...save.equipment };
    delete nextEq[action.slot];

    save = recalcVitals({ ...save, inventory: nextInv, equipment: nextEq });
    logs = pushLog(logs, `你卸下了：${prev.name}。`);
    return { save, logs };
  }

  if (action.type === 'USE_POTION') {
    const pid = action.potionId ?? 'potion_small';
    const it = save.inventory.find((x) => x.kind === 'potion' && x.id === pid);

    if (!it || it.kind !== 'potion' || !it.qty || it.qty <= 0) {
      return { save, logs: pushLog(logs, pid === 'potion_mana' ? '你没有蓝瓶。' : '你没有血瓶。') };
    }

    if (pid === 'potion_mana') {
      if (save.mp >= save.mpMax) {
        return { save, logs: pushLog(logs, '你现在不需要用蓝瓶。') };
      }
      const heal = 18;
      save = { ...save, mp: Math.min(save.mpMax, save.mp + heal) };
      it.qty -= 1;
      save = {
        ...save,
        inventory: save.inventory.filter((x) => x.kind !== 'potion' || x.qty === undefined || x.qty > 0),
      };
      logs = pushLog(logs, `你使用小型蓝瓶，恢复 ${heal} MP。`);
      return { save, logs };
    }

    const heal = pid === 'potion_big' ? 45 : 18;
    if (save.hp >= save.hpMax) {
      return { save, logs: pushLog(logs, '你现在不需要用血瓶。') };
    }

    save = { ...save, hp: Math.min(save.hpMax, save.hp + heal) };
    it.qty -= 1;
    save = {
      ...save,
      inventory: save.inventory.filter((x) => x.kind !== 'potion' || x.qty === undefined || x.qty > 0),
    };
    logs = pushLog(logs, `你使用${pid === 'potion_big' ? '中型' : '小型'}血瓶，恢复 ${heal} HP。`);
    return { save, logs };
  }

  return rt;
}

function isGear(it: RpgItem): it is Extract<RpgItem, { kind: 'gear' }> {
  return it.kind === 'gear';
}
