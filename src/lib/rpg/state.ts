export type GameMode = 'CAMP' | 'EXPLORING' | 'COMBAT' | 'SHOP';

export type RegionId = 'breeze_plains' | 'whispering_forest' | 'ember_caverns';

export type XY = { x: number; y: number };

export type LogEntry = {
  id: string;
  t: number;
  text: string;
};

export type RpgItem = {
  id: string;
  name: string;
  kind: 'potion' | 'gear';
  qty?: number;
  price?: number;
};

export type CombatEnemy = {
  id: string;
  name: string;
  level: number;
  hpMax: number;
  hp: number;
  atk: number;
  def: number;
};

export type RpgSave = {
  version: 1;

  name: string;
  jobId: 'guard' | 'ranger' | 'warlock' | 'cleric' | 'rogue' | 'scholar';

  level: number;
  exp: number;
  expToNext: number;

  str: number;
  agi: number;
  int: number;
  con: number;

  hpMax: number;
  hp: number;
  mpMax: number;
  mp: number;

  gold: number;

  mode: GameMode;
  mapId: RegionId | null;
  pos: XY;

  inventory: RpgItem[];
  combat?: {
    enemy: CombatEnemy;
    turn: number;
  };

  seed: number;
};

export type Action =
  | { type: 'NEW_GAME'; name: string; jobId: RpgSave['jobId']; seed: number }
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'CAMP_REST' }
  | { type: 'CAMP_OPEN_SHOP' }
  | { type: 'SHOP_BUY'; itemId: string }
  | { type: 'SHOP_SELL'; itemId: string }
  | { type: 'SHOP_LEAVE' }
  | { type: 'CAMP_START_EXPLORE'; mapId: RegionId }
  | { type: 'MOVE'; dir: 'N' | 'S' | 'W' | 'E' }
  | { type: 'COMBAT_ATTACK' }
  | { type: 'COMBAT_ESCAPE' }
  | { type: 'USE_POTION' };
