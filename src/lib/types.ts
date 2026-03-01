export type Id = string;

export type JobId = 'guard' | 'ranger' | 'warlock' | 'cleric' | 'rogue' | 'scholar';

export type GearSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'neck'
  | 'ring1'
  | 'ring2';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type StatKey = 'str' | 'dex' | 'int' | 'vit' | 'spi';

export type DerivedKey =
  | 'hpMax'
  | 'atk'
  | 'def'
  | 'crit'
  | 'hit'
  | 'dodge'
  | 'res';

export type Stats = Record<StatKey, number>;

export type Derived = Record<DerivedKey, number>;

export type Player = {
  name: string;
  lang?: 'en' | 'zh';
  job: JobId;
  level: number;
  exp: number;
  expToNext: number;

  stats: Stats;
  derived: Derived;

  hp: number;
  resource: number;
  gold: number;

  inventory: Item[];
  equipment: Partial<Record<GearSlot, Item>>;

  world: WorldState;
};

export type WorldState = {
  seed: number;
  mapId: MapId;
  nodeId: NodeId;
  danger: number;
  fog: number;
  chapter: number;
  unlockedMaps?: Partial<Record<MapId, boolean>>;

  // If set, clicking the "Game" button will start battle with this seed.
  pendingBattleSeed?: number;

  // Temporary exploration buffs (e.g., campfire).
  buffs?: {
    campfire?: { untilFog: number; atkPct: number; defPct: number };
  };
};

export type MapId = 'borderlands' | 'mistwood' | 'oldmine' | 'riftcorridor';
export type NodeId = string;

export type Item = {
  id: Id;
  name: string;
  slot: GearSlot;
  rarity: Rarity;
  levelReq: number;
  stats: Partial<Record<StatKey | DerivedKey, number>>;
  price: number;
  tags?: string[];
};

export type Enemy = {
  id: Id;
  name: string;
  level: number;
  hpMax: number;
  atk: number;
  def: number;
  traits?: string[];
};

export type BattleState = {
  seed: number;
  turn: number;
  playerHp: number;
  playerResource: number;
  enemy: Enemy;
  enemyHp: number;
  log: BattleLogEntry[];
  status: 'idle' | 'inBattle' | 'won' | 'lost' | 'escaped';
};

export type BattleLogEntry = {
  t: number;
  side: 'player' | 'enemy' | 'system';
  text: string;
};
