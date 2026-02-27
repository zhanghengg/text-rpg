import type { GeneratedMap, MapNode, NodeType, WorldGenState } from './world';
import type { MapId } from '@/lib/types';

import { mulberry32, pickOne, rngInt } from '@/lib/rng';

type NodeTpl = { type: NodeType; labelEn: string; labelZh: string };

type NodeWeights = Partial<Record<NodeType, number>>;

type MapTheme = {
  pool: NodeTpl[];
  weights: NodeWeights;
  len: { min: number; max: number };
  cols: number;
  extraBossLinksChance: number;
};

const MAP_META: Record<MapId, { nameEn: string; nameZh: string; danger: number }> = {
  borderlands: { nameEn: 'Borderlands', nameZh: '边境地带', danger: 1 },
  mistwood: { nameEn: 'Mistwood Paths', nameZh: '雾林小径', danger: 2 },
  oldmine: { nameEn: 'Old Mine', nameZh: '旧矿坑', danger: 3 },
  riftcorridor: { nameEn: 'Rift Corridor', nameZh: '裂隙回廊', danger: 4 },
};

const BASE_POOL: NodeTpl[] = [
  { type: 'fight', labelEn: 'Skirmish', labelZh: '遭遇战' },
  { type: 'event', labelEn: 'Strange Sign', labelZh: '诡异记号' },
  { type: 'treasure', labelEn: 'Cache', labelZh: '藏匿处' },
  { type: 'fight', labelEn: 'Ambush', labelZh: '伏击' },
  { type: 'event', labelEn: 'Whisper', labelZh: '低语' },
  { type: 'shop', labelEn: 'Peddler', labelZh: '小贩' },
  { type: 'elite', labelEn: 'Elite', labelZh: '精英' },
];

const MAP_THEME: Record<MapId, MapTheme> = {
  borderlands: {
    pool: [
      ...BASE_POOL,
      { type: 'event', labelEn: 'Broken Signpost', labelZh: '断裂的路标' },
      { type: 'treasure', labelEn: 'Booty Cache', labelZh: '战利品堆' },
    ],
    weights: { fight: 4, event: 3, treasure: 2, shop: 1, elite: 1 },
    len: { min: 10, max: 14 },
    cols: 4,
    extraBossLinksChance: 0.06,
  },
  mistwood: {
    pool: [
      ...BASE_POOL,
      { type: 'event', labelEn: 'Mushroom Ring', labelZh: '蘑菇圈' },
      { type: 'event', labelEn: 'Spider Silk', labelZh: '蛛丝' },
      { type: 'treasure', labelEn: 'Hollow Stump', labelZh: '空心树桩' },
    ],
    weights: { fight: 3, event: 5, treasure: 2, shop: 1, elite: 1 },
    len: { min: 11, max: 15 },
    cols: 3,
    extraBossLinksChance: 0.1,
  },
  oldmine: {
    pool: [
      ...BASE_POOL,
      { type: 'fight', labelEn: 'Tunnel Clash', labelZh: '矿道冲突' },
      { type: 'elite', labelEn: 'Foreman', labelZh: '监工' },
      { type: 'treasure', labelEn: 'Ore Chest', labelZh: '矿石箱' },
    ],
    weights: { fight: 5, event: 2, treasure: 2, shop: 1, elite: 2 },
    len: { min: 12, max: 16 },
    cols: 4,
    extraBossLinksChance: 0.12,
  },
  riftcorridor: {
    pool: [
      ...BASE_POOL,
      { type: 'event', labelEn: 'Time Echo', labelZh: '时间回声' },
      { type: 'elite', labelEn: 'Rift Knight', labelZh: '裂隙骑士' },
      { type: 'fight', labelEn: 'Warped Foe', labelZh: '扭曲敌影' },
    ],
    weights: { fight: 4, event: 3, treasure: 1, shop: 1, elite: 3 },
    len: { min: 13, max: 18 },
    cols: 5,
    extraBossLinksChance: 0.18,
  },
};

function rollType(r: () => number, w: NodeWeights): NodeType {
  const weights: [NodeType, number][] = [
    ['fight', w.fight ?? 1],
    ['event', w.event ?? 1],
    ['treasure', w.treasure ?? 1],
    ['shop', w.shop ?? 1],
    ['elite', w.elite ?? 1],
  ];

  const sum = weights.reduce((a, [, b]) => a + Math.max(0, b), 0) || 1;
  let x = r() * sum;
  for (const [t, n] of weights) {
    x -= Math.max(0, n);
    if (x <= 0) return t;
  }
  return 'fight';
}

function nodeId(ix: number) {
  return `n${ix}`;
}

function makeNode(id: string, type: NodeType, label: string, to: string[], x: number, y: number): MapNode {
  return { id, type, label, to, x, y };
}

export function generateMap(seed: number, mapId: MapId, lang: 'en' | 'zh'): WorldGenState {
  const r = mulberry32(seed);
  const meta = MAP_META[mapId];
  const theme = MAP_THEME[mapId];

  const nodes: Record<string, MapNode> = {};
  const start = 'camp';
  nodes[start] = makeNode(start, 'camp', lang === 'zh' ? '营地' : 'Camp', [nodeId(1)], 0, 0);

  const len = rngInt(r, theme.len.min, theme.len.max);

  const cols = theme.cols;
  const dx = 1;
  const dy = 1;

  for (let i = 1; i <= len; i++) {
    const desired = rollType(r, theme.weights);
    const candidates = theme.pool.filter((p) => p.type === desired);
    const tpl = pickOne(r, candidates.length ? candidates : theme.pool);
    const id = nodeId(i);

    const label = lang === 'zh' ? tpl.labelZh : tpl.labelEn;

    const col = (i - 1) % cols;
    const row = Math.floor((i - 1) / cols) + 1;
    const jitterX = (r() - 0.5) * 0.35;
    const jitterY = (r() - 0.5) * 0.35;

    nodes[id] = makeNode(id, tpl.type, label, [], col * dx + jitterX, row * dy + jitterY);
  }

  const bossId = 'boss';
  nodes[bossId] = makeNode(
    bossId,
    'boss',
    lang === 'zh' ? '首领' : 'Boss',
    [],
    (cols - 1) / 2,
    Math.floor(len / cols) + 2,
  );

  for (let i = 1; i <= len; i++) {
    const id = nodeId(i);
    const nextA = i === len ? bossId : nodeId(i + 1);
    const to = [nextA];

    if (i < len - 1 && r() < 0.3) {
      const skip = nodeId(i + 2);
      to.push(skip);
    }

    if (r() < 0.22) {
      const back = nodeId(Math.max(1, i - 1));
      if (!to.includes(back)) to.push(back);
    }

    nodes[id] = { ...nodes[id], to };
  }

  for (let i = 1; i <= len - 3; i++) {
    if (r() > 0.23) continue;
    const a = nodeId(i);
    const b = nodeId(i + rngInt(r, 2, 3));
    const na = nodes[a];
    if (!na) continue;
    if (na.to.includes(b)) continue;
    nodes[a] = { ...na, to: [...na.to, b] };
  }

  for (let i = Math.max(2, len - 3); i <= len; i++) {
    if (r() > theme.extraBossLinksChance) continue;
    const a = nodeId(i);
    const na = nodes[a];
    if (!na) continue;
    if (na.to.includes(bossId)) continue;
    nodes[a] = { ...na, to: [...na.to, bossId] };
  }

  nodes[bossId] = { ...nodes[bossId], to: [] };

  const map: GeneratedMap = {
    id: mapId,
    name: lang === 'zh' ? meta.nameZh : meta.nameEn,
    danger: meta.danger,
    nodes,
    start,
  };

  return { seed, map };
}
