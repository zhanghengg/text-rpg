import type { MapId, NodeId } from '@/lib/types';

export type NodeType = 'camp' | 'fight' | 'event' | 'shop' | 'elite' | 'boss' | 'treasure';

export type MapNode = {
  id: NodeId;
  type: NodeType;
  label: string;
  to: NodeId[];
  x: number;
  y: number;
};

export type GeneratedMap = {
  id: MapId;
  name: string;
  danger: number;
  nodes: Record<NodeId, MapNode>;
  start: NodeId;
};

export type WorldGenState = {
  seed: number;
  map: GeneratedMap;
};
