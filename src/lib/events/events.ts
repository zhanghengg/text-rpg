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
];

export function rollEvent(seed: number, lang: Lang): WorldEvent {
  const r = mulberry32(seed);
  const tpl = pickOne(r, EVENT_POOL);

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
