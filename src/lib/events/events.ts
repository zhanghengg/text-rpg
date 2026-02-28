import type { Lang } from '@/lib/i18n/i18n';
import { mulberry32, pickOne } from '@/lib/rng';

export type EventOutcome = {
  text: string;
  goldDelta?: number;
  hpDelta?: number;
  fogDelta?: number;
};

export type WorldEvent = {
  id: string;
  title: string;
  body: string;
  options: { id: string; label: string; outcome: EventOutcome }[];
};

type EventTpl = {
  id: string;
  mapId: 'any' | 'borderlands' | 'mistwood' | 'oldmine' | 'riftcorridor';
  titleEn: string;
  titleZh: string;
  bodyEn: string;
  bodyZh: string;
  options: {
    id: string;
    labelEn: string;
    labelZh: string;
    outcomeEn: EventOutcome;
    outcomeZh: EventOutcome;
  }[];
};

const EVENT_POOL: EventTpl[] = [
  {
    id: 'ev_lantern',
    mapId: 'any',
    titleEn: 'A Lantern That Should Not Burn',
    titleZh: '不该燃烧的灯',
    bodyEn: 'A lantern hangs in the fog with no post, no hand. It burns anyway.',
    bodyZh: '迷雾里悬着一盏灯，没有灯杆也没有手，却偏偏在燃烧。',
    options: [
      {
        id: 'take',
        labelEn: 'Take the oil',
        labelZh: '取走灯油',
        outcomeEn: { text: 'You siphon a vial of oil. It smells like rain. +8g', goldDelta: 8 },
        outcomeZh: { text: '你抽走一小瓶灯油，闻起来像雨。+8金币', goldDelta: 8 },
      },
      {
        id: 'leave',
        labelEn: 'Leave it alone',
        labelZh: '别碰',
        outcomeEn: { text: 'You walk away. The lantern keeps judging you silently.', fogDelta: -1 },
        outcomeZh: { text: '你转身离开。那盏灯继续无声地审判你。雾值-1', fogDelta: -1 },
      },
    ],
  },
  {
    id: 'ev_bloodmoss',
    mapId: 'any',
    titleEn: 'Bloodmoss',
    titleZh: '血苔',
    bodyEn: 'Red moss grows on stone like a fresh wound. It pulses faintly.',
    bodyZh: '红色苔藓像新鲜的伤口一样攀在石头上，微微跳动。',
    options: [
      {
        id: 'harvest',
        labelEn: 'Harvest carefully',
        labelZh: '小心采集',
        outcomeEn: { text: 'You keep your hands steady. +12g', goldDelta: 12 },
        outcomeZh: { text: '你稳住手，采到一小包。+12金币', goldDelta: 12 },
      },
      {
        id: 'taste',
        labelEn: 'Taste it (bad idea)',
        labelZh: '尝一口（坏主意）',
        outcomeEn: { text: 'It tastes like iron and regret. -6 HP', hpDelta: -6 },
        outcomeZh: { text: '味道像铁锈和后悔。生命-6', hpDelta: -6 },
      },
    ],
  },
  {
    id: 'ev_cointrail',
    mapId: 'any',
    titleEn: 'Coin Trail',
    titleZh: '金币痕迹',
    bodyEn: 'A line of coins disappears into the fog, too neat to be real.',
    bodyZh: '一排金币整齐地延伸进迷雾，整齐得不像真的。',
    options: [
      {
        id: 'follow',
        labelEn: 'Follow the trail',
        labelZh: '跟上去',
        outcomeEn: { text: 'You pocket a few before it vanishes. +10g, fog +1', goldDelta: 10, fogDelta: 1 },
        outcomeZh: { text: '你先揣走几枚，痕迹随即消失。+10金币，雾值+1', goldDelta: 10, fogDelta: 1 },
      },
      {
        id: 'ignore',
        labelEn: 'Ignore it',
        labelZh: '无视',
        outcomeEn: { text: 'Discipline hurts. But less than traps.', fogDelta: -1 },
        outcomeZh: { text: '自律很痛，但比陷阱轻。雾值-1', fogDelta: -1 },
      },
    ],
  },
  {
    id: 'ev_auto_202602271145',
    mapId: 'any',
    titleEn: 'A Note Written in Ash',
    titleZh: '灰烬写下的便签',
    bodyEn: 'Someone left a message on stone. The fog tries to erase it as you read.',
    bodyZh: '有人在石头上留了字。你阅读时，迷雾试图把它擦掉。',
    options: [
      {
        id: 'pocket',
        labelEn: 'Pocket the charcoal',
        labelZh: '收走木炭',
        outcomeEn: { text: 'You keep the charcoal. It still feels warm. +6g', goldDelta: 6 },
        outcomeZh: { text: '你把木炭收起来，它仍带余温。+6金币', goldDelta: 6 },
      },
      {
        id: 'burn',
        labelEn: 'Burn the note',
        labelZh: '烧掉便签',
        outcomeEn: { text: 'The smoke curls like a warning. Fog -1', fogDelta: -1 },
        outcomeZh: { text: '烟雾盘旋，像警告。雾值-1', fogDelta: -1 },
      },
    ],
  },
  {
    id: 'ev_auto_shrine',
    mapId: 'any',
    titleEn: 'A Half-Buried Shrine',
    titleZh: '半埋的祠龛',
    bodyEn: 'Stone teeth peek from the earth. A shrine, old enough that the fog has forgotten its name.',
    bodyZh: '石头的“牙齿”从泥土里露出。那是一座祠龛，古老到连迷雾都快忘了它的名字。',
    options: [
      {
        id: 'offer',
        labelEn: 'Leave an offering (5g)',
        labelZh: '献上供奉（5金币）',
        outcomeEn: { text: 'You leave coins and feel the air lighten. Fog -2, -5g', goldDelta: -5, fogDelta: -2 },
        outcomeZh: { text: '你留下金币，空气似乎变轻了。雾值-2，-5金币', goldDelta: -5, fogDelta: -2 },
      },
      {
        id: 'pry',
        labelEn: 'Pry loose the idol',
        labelZh: '撬走神像',
        outcomeEn: { text: 'The stone cracks with a sigh. +14g, fog +1', goldDelta: 14, fogDelta: 1 },
        outcomeZh: { text: '石头发出一声叹息般的裂响。+14金币，雾值+1', goldDelta: 14, fogDelta: 1 },
      },
    ],
  },

  // Borderlands (+)
  {
    id: 'ev_border_windpost',
    mapId: 'borderlands',
    titleEn: 'A Wind-Carved Post',
    titleZh: '风刻的木桩',
    bodyEn: 'A lone post stands where roads used to meet. The wind whistles through old nails.',
    bodyZh: '一根孤零零的木桩立在曾经的路口。风穿过旧钉子，发出哨音。',
    options: [
      {
        id: 'search',
        labelEn: 'Search the base',
        labelZh: '翻找底部',
        outcomeEn: { text: 'You find a small pouch of grit and coin. +9g', goldDelta: 9 },
        outcomeZh: { text: '你在底部摸到一只小布袋，里面混着沙和钱。+9金币', goldDelta: 9 },
      },
      {
        id: 'rest',
        labelEn: 'Lean and rest a moment',
        labelZh: '靠着歇会儿',
        outcomeEn: { text: 'The wind clears your head. Fog -1', fogDelta: -1 },
        outcomeZh: { text: '风把你脑子里的杂音吹散。雾值-1', fogDelta: -1 },
      },
    ],
  },
  {
    id: 'ev_border_scavengers',
    mapId: 'borderlands',
    titleEn: 'Scavengers in the Grass',
    titleZh: '草丛里的拾荒者',
    bodyEn: 'Two silhouettes freeze when you arrive. Not enemies. Not friends either.',
    bodyZh: '你一出现，两道影子就僵住了。不是敌人，也绝不是朋友。',
    options: [
      {
        id: 'trade',
        labelEn: 'Trade scraps (gain 7g)',
        labelZh: '用废料交换（+7金币）',
        outcomeEn: { text: 'A quick exchange, no names. +7g', goldDelta: 7 },
        outcomeZh: { text: '交易迅速，没人报名字。+7金币', goldDelta: 7 },
      },
      {
        id: 'push',
        labelEn: 'Push your luck',
        labelZh: '趁火打劫',
        outcomeEn: { text: 'You get a handful of coins and a scratch. +12g, -4 HP', goldDelta: 12, hpDelta: -4 },
        outcomeZh: { text: '你抢到一把钱，也挨了一下。+12金币，生命-4', goldDelta: 12, hpDelta: -4 },
      },
    ],
  },

  // Mistwood (+)
  {
    id: 'ev_mist_fireflies',
    mapId: 'mistwood',
    titleEn: "Fireflies That Don't Blink",
    titleZh: '不眨眼的萤火',
    bodyEn: 'A cluster of lights hangs still, like someone pinned the night to a branch.',
    bodyZh: '一团光点静止不动，像有人把夜色钉在树枝上。',
    options: [
      {
        id: 'catch',
        labelEn: 'Catch one',
        labelZh: '捉一只',
        outcomeEn: { text: 'It dissolves into dust in your palm. Fog -1', fogDelta: -1 },
        outcomeZh: { text: '它在你掌心化成粉尘。雾值-1', fogDelta: -1 },
      },
      {
        id: 'follow',
        labelEn: 'Follow the lights',
        labelZh: '跟着走',
        outcomeEn: { text: 'They lead you to dropped coins. +11g, fog +1', goldDelta: 11, fogDelta: 1 },
        outcomeZh: { text: '它们把你引到一堆散落金币。+11金币，雾值+1', goldDelta: 11, fogDelta: 1 },
      },
    ],
  },
  {
    id: 'ev_mist_bitterroot',
    mapId: 'mistwood',
    titleEn: 'Bitterroot',
    titleZh: '苦根',
    bodyEn: 'A pale root juts from the soil, smelling of medicine and wet bark.',
    bodyZh: '一截苍白的根从泥里露出，闻起来像药和湿树皮。',
    options: [
      {
        id: 'brew',
        labelEn: 'Brew a quick tea',
        labelZh: '煮一杯速茶',
        outcomeEn: { text: 'Warmth spreads through you. +5 HP', hpDelta: 5 },
        outcomeZh: { text: '暖意从腹中扩散。生命+5', hpDelta: 5 },
      },
      {
        id: 'sell',
        labelEn: 'Bundle and sell later (+8g)',
        labelZh: '捆起来以后卖（+8金币）',
        outcomeEn: { text: 'You pack it carefully. +8g', goldDelta: 8 },
        outcomeZh: { text: '你把它扎好收起。+8金币', goldDelta: 8 },
      },
    ],
  },

  // Old Mine (+)
  {
    id: 'ev_mine_rattlecart',
    mapId: 'oldmine',
    titleEn: 'The Rattlecart',
    titleZh: '叮当矿车',
    bodyEn: 'An empty mine cart rolls by itself, rattling like laughter in a tunnel.',
    bodyZh: '一辆空矿车自己滑过，叮当作响，像隧道里的笑声。',
    options: [
      {
        id: 'ride',
        labelEn: 'Hop on (risky)',
        labelZh: '跳上去（有风险）',
        outcomeEn: { text: 'You crash into a stash. +15g, -5 HP', goldDelta: 15, hpDelta: -5 },
        outcomeZh: { text: '你撞进一处藏匿点。+15金币，生命-5', goldDelta: 15, hpDelta: -5 },
      },
      {
        id: 'letpass',
        labelEn: 'Let it pass',
        labelZh: '让它过去',
        outcomeEn: { text: 'You stay still. The mine feels less hostile. Fog -1', fogDelta: -1 },
        outcomeZh: { text: '你保持不动。矿坑的敌意少了一点。雾值-1', fogDelta: -1 },
      },
    ],
  },
  {
    id: 'ev_mine_orevein',
    mapId: 'oldmine',
    titleEn: 'A Singing Ore Vein',
    titleZh: '会唱歌的矿脉',
    bodyEn: 'A thin vein hums when you touch it, as if the stone remembers a melody.',
    bodyZh: '你一碰那条细矿脉，它就嗡鸣起来，仿佛石头记得旋律。',
    options: [
      {
        id: 'chip',
        labelEn: 'Chip off a sample',
        labelZh: '凿一点样品',
        outcomeEn: { text: 'You get usable ore. +13g, fog +1', goldDelta: 13, fogDelta: 1 },
        outcomeZh: { text: '你凿到可用矿石。+13金币，雾值+1', goldDelta: 13, fogDelta: 1 },
      },
      {
        id: 'listen',
        labelEn: 'Just listen',
        labelZh: '只是听',
        outcomeEn: { text: 'The humming syncs with your breath. +3 HP', hpDelta: 3 },
        outcomeZh: { text: '嗡鸣与你呼吸同频。生命+3', hpDelta: 3 },
      },
    ],
  },

  // Rift Corridor (+)
  {
    id: 'ev_rift_afterimage',
    mapId: 'riftcorridor',
    titleEn: 'Afterimage',
    titleZh: '残像',
    bodyEn: 'You see yourself half a step ahead. It turns its head. You feel late.',
    bodyZh: '你看到“自己”提前半步走在前面。它回头看你。你觉得自己迟到了。',
    options: [
      {
        id: 'sync',
        labelEn: 'Match its pace',
        labelZh: '跟上它的步伐',
        outcomeEn: { text: 'The world steadies. Fog -2', fogDelta: -2 },
        outcomeZh: { text: '世界稳住了。雾值-2', fogDelta: -2 },
      },
      {
        id: 'chase',
        labelEn: 'Chase it down',
        labelZh: '追上去',
        outcomeEn: { text: 'You slam into invisible glass. -6 HP, +10g', hpDelta: -6, goldDelta: 10 },
        outcomeZh: { text: '你撞上看不见的玻璃。生命-6，+10金币', hpDelta: -6, goldDelta: 10 },
      },
    ],
  },
  {
    id: 'ev_rift_nullroom',
    mapId: 'riftcorridor',
    titleEn: 'A Room With No Sound',
    titleZh: '无声之室',
    bodyEn: "For a moment, even the fog is quiet. Your heartbeat is a drum you can't unhear.",
    bodyZh: '有那么一瞬间，连迷雾都安静了。你的心跳像鼓点，躲也躲不开。',
    options: [
      {
        id: 'meditate',
        labelEn: 'Meditate',
        labelZh: '冥想',
        outcomeEn: { text: 'You leave calmer than you entered. Fog -1, +2 HP', fogDelta: -1, hpDelta: 2 },
        outcomeZh: { text: '你离开时比进来更平静。雾值-1，生命+2', fogDelta: -1, hpDelta: 2 },
      },
      {
        id: 'loot',
        labelEn: 'Loot the silence',
        labelZh: '掠夺这份安静',
        outcomeEn: { text: 'You find coins where sound should be. +16g, fog +1', goldDelta: 16, fogDelta: 1 },
        outcomeZh: { text: '你在“本该有声音的地方”摸到金币。+16金币，雾值+1', goldDelta: 16, fogDelta: 1 },
      },
    ],
  },

  // New: region-specific events (backstop)
  {
    id: 'ev_border_wishing_stone',
    mapId: 'borderlands',
    titleEn: 'A Wishing Stone',
    titleZh: '许愿石',
    bodyEn: 'A smooth stone sits in the grass. A shallow groove suggests many coins have tried their luck.',
    bodyZh: '草地里有一块光滑的石头，上面有一道浅浅的凹槽，像是无数枚硬币试过运气。',
    options: [
      {
        id: 'pay',
        labelEn: 'Pay 6g and wish',
        labelZh: '投6金币许愿',
        outcomeEn: { text: 'The stone feels warm. You feel steadier. -6g, +6 HP', goldDelta: -6, hpDelta: 6 },
        outcomeZh: { text: '石头微微发热，你的心也稳了一些。-6金币，生命+6', goldDelta: -6, hpDelta: 6 },
      },
      {
        id: 'pry',
        labelEn: 'Pry the groove (risky)',
        labelZh: '撬凹槽（有风险）',
        outcomeEn: { text: 'A sharp edge bites your finger. +10g, -5 HP', goldDelta: 10, hpDelta: -5 },
        outcomeZh: { text: '石头边缘割破手指。+10金币，生命-5', goldDelta: 10, hpDelta: -5 },
      },
    ],
  },
  {
    id: 'ev_mist_hunter_cache',
    mapId: 'mistwood',
    titleEn: "Hunter's Cache",
    titleZh: '猎人藏匿点',
    bodyEn: 'You spot a mark carved into bark: a hunter sign. Something is buried nearby.',
    bodyZh: '你在树皮上看到一道刻痕：猎人的暗号。附近似乎埋着什么。',
    options: [
      {
        id: 'dig',
        labelEn: 'Dig it up',
        labelZh: '挖出来',
        outcomeEn: { text: 'You find a wrapped bundle. +14g, fog +1', goldDelta: 14, fogDelta: 1 },
        outcomeZh: { text: '你挖出一包用布裹好的东西。+14金币，雾值+1', goldDelta: 14, fogDelta: 1 },
      },
      {
        id: 'leave',
        labelEn: 'Leave the sign alone',
        labelZh: '别动暗号',
        outcomeEn: { text: 'Respect earns quiet. Fog -1', fogDelta: -1 },
        outcomeZh: { text: '尊重换来安静。雾值-1', fogDelta: -1 },
      },
    ],
  },


];

export function rollEvent(seed: number, lang: Lang, mapId: EventTpl['mapId'] = 'any'): WorldEvent {
  const r = mulberry32(seed);
  const pool = EVENT_POOL.filter((e) => e.mapId === 'any' || e.mapId === mapId);
  const tpl = pickOne(r, pool.length ? pool : EVENT_POOL);

  return {
    id: `${tpl.id}_${seed}`,
    title: lang === 'zh' ? tpl.titleZh : tpl.titleEn,
    body: lang === 'zh' ? tpl.bodyZh : tpl.bodyEn,
    options: tpl.options.map((o) => ({
      id: o.id,
      label: lang === 'zh' ? o.labelZh : o.labelEn,
      outcome: lang === 'zh' ? o.outcomeZh : o.outcomeEn,
    })),
  };
}
