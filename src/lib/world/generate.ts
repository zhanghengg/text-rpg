import type { GeneratedMap, MapNode, NodeType, WorldGenState } from './world';
import type { MapId } from '@/lib/types';

import { mulberry32, pickOne, rngInt } from '@/lib/rng';

type NodeTpl = { type: NodeType; labelEn: string; labelZh: string };

const MAP_META: Record<MapId, { nameEn: string; nameZh: string; danger: number }> = {
  borderlands: { nameEn: 'Borderlands', nameZh: '边境地带', danger: 1 },
  mistwood: { nameEn: 'Mistwood Paths', nameZh: '雾林小径', danger: 2 },
  oldmine: { nameEn: 'Old Mine', nameZh: '旧矿坑', danger: 3 },
  riftcorridor: { nameEn: 'Rift Corridor', nameZh: '裂隙回廊', danger: 4 },
};

const NODE_POOL: NodeTpl[] = [
  { type: 'fight', labelEn: 'Skirmish', labelZh: '遭遇战' },
  { type: 'event', labelEn: 'Strange Sign', labelZh: '诡异记号' },
  { type: 'treasure', labelEn: 'Cache', labelZh: '藏匿处' },
  { type: 'fight', labelEn: 'Ambush', labelZh: '伏击' },
  { type: 'event', labelEn: 'Whisper', labelZh: '低语' },
  { type: 'shop', labelEn: 'Peddler', labelZh: '小贩' },
];

function nodeId(ix: number) {
  return `n${ix}`;
}

function makeNode(id: string, type: NodeType, label: string, to: string[], x: number, y: number): MapNode {
  return { id, type, label, to, x, y };
}

export function generateMap(seed: number, mapId: MapId, lang: 'en' | 'zh'): WorldGenState {
  const r = mulberry32(seed);
  const meta = MAP_META[mapId];

  const nodes: Record<string, MapNode> = {};
  const start = 'camp';
  nodes[start] = makeNode(start, 'camp', lang === 'zh' ? '营地' : 'Camp', [nodeId(1)], 0, 0);

  const len = rngInt(r, 10, 14);

  const cols = 4;
  const dx = 1;
  const dy = 1;

  for (let i = 1; i <= len; i++) {
    const tpl = pickOne(r, NODE_POOL);
    const id = nodeId(i);

    const label = lang === 'zh' ? tpl.labelZh : tpl.labelEn;

    const col = (i - 1) % cols;
    const row = Math.floor((i - 1) / cols) + 1;
    const jitterX = (r() - 0.5) * 0.35;
    const jitterY = (r() - 0.5) * 0.35;

    nodes[id] = makeNode(id, tpl.type, label, [], col * dx + jitterX, row * dy + jitterY);
  }

  const bossId = `boss`;
  nodes[bossId] = makeNode(bossId, 'boss', lang === 'zh' ? '首领' : 'Boss', [], 1.5, Math.floor(len / cols) + 2);

  for (let i = 1; i <= len; i++) {
    const id = nodeId(i);
    const nextA = i === len ? bossId : nodeId(i + 1);
    const to = [nextA];

    if (i < len - 1 && r() < 0.30) {
      const skip = nodeId(i + 2);
      to.push(skip);
    }

    if (r() < 0.22) {
      const back = nodeId(Math.max(1, i - 1));
      if (!to.includes(back)) to.push(back);
    }

    nodes[id] = { ...nodes[id], to };
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
