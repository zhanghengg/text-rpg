export type GameMode = 'CAMP' | 'EXPLORING' | 'COMBAT' | 'SHOP';

export type RegionId = 'breeze_plains' | 'whispering_forest' | 'ember_caverns';

export type XY = { x: number; y: number };

export type LogEntry = {
  id: string;
  t: number;
  text: string;
};

export type GearSlot = 'weapon' | 'armor' | 'accessory';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type AffixId = 'str' | 'agi' | 'int' | 'con' | 'lifesteal' | 'thorns';

export type GearAffix = {
  id: AffixId;
  nameZh: string;
  value: number;
};

export type Element = 'water' | 'wind' | 'fire' | 'wood';

export type MonsterArchetypeId =
  | 'slime'
  | 'slime_splitter'
  | 'slime_king'
  | 'goblin'
  | 'bat'
  | 'goblin_brute'
  | 'forest_spider'
  | 'spider_queen'
  | 'cave_bat'
  | 'ember_slime'
  | 'ember_golem'
  | 'magma_wyrm';

export type StatusId = 'poison' | 'bleed' | 'stun';

export type CombatStatus =
  | {
      id: 'poison';
      turns: number;
      pctMaxHpPerTurn: number;
    }
  | {
      id: 'bleed';
      turns: number;
      dmgPerTurn: number;
    }
  | {
      id: 'stun';
      turns: number;
    };

export type CombatEnemy = {
  id: string;
  archetypeId: MonsterArchetypeId;
  name: string;
  tier: 'normal' | 'elite' | 'boss';
  element: Element;
  level: number;
  hpMax: number;
  hp: number;
  atk: number;
  def: number;

  intent: null | { id: 'goblin_heavy_strike'; turnsLeft: number };
};

export type RpgItem =
  | {
      id: string;
      name: string;
      kind: 'potion';
      qty?: number;
      price?: number;
    }
  | {
      id: string;
      name: string;
      kind: 'gear';
      slot: GearSlot;
      rarity: Rarity;
      element?: Element;
      power: number;
      affixes: GearAffix[];
      price?: number;
    }
  | {
      id: string;
      name: string;
      kind: 'flag';
      price?: number;
    };

export type RpgSave = {
  version: 2;

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
  equipment: Partial<Record<GearSlot, Extract<RpgItem, { kind: 'gear' }>>>;

  statuses: CombatStatus[];

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
  | { type: 'USE_POTION' }
  | { type: 'EQUIP_GEAR'; itemId: string }
  | { type: 'UNEQUIP_GEAR'; slot: GearSlot };
