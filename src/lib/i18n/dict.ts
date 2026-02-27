import type { Lang } from './i18n';

export type Dict = {
  appName: string;
  tagline: string;
  enterGame: string;
  github: string;

  jobs: string;
  maps: string;
  loop: string;

  jobsValue: string;
  mapsValue: string;
  loopValue: string;

  footer: string;

  nav: {
    home: string;
    game: string;
    camp: string;
    map: string;
    gear: string;
    battle: string;
    explore: string;
  };

  status: {
    title: string;
    noSave: string;
    name: string;
    job: string;
    level: string;
    hp: string;
    gold: string;
    map: string;
    newGame: string;
    fight: string;
    deleteSave: string;
  };

  camp: {
    title: string;
    noSave: string;
    text: string;
    note: string;
  };

  mapView: {
    title: string;
    noSave: string;
    currentRegion: string;
    node: string;
    placeholder: string;
  };

  gear: {
    title: string;
    noSave: string;
    inventory: string;
    equip: string;
    unequip: string;
    next: string;
    rarity: {
      common: string;
      uncommon: string;
      rare: string;
      epic: string;
      legendary: string;
    };
  };

  battle: {
    title: string;
    noBattle: string;
    attack: string;
    defend: string;
    escape: string;
  };

  prompts: {
    name: string;
    pickJob: string;
    deleteSave: string;
  };
};

const en: Dict = {
  appName: 'Mist Ring: Text RPG',
  tagline: 'A turn-based text RPG about fog, steel, and bad decisions.',
  enterGame: 'Enter Game',
  github: 'GitHub',

  jobs: 'Jobs',
  maps: 'Maps',
  loop: 'Loop',

  jobsValue: 'Guard · Ranger · Warlock · Cleric · Rogue · Scholar',
  mapsValue: 'Borderlands · Mistwood · Old Mine · Rift Corridor',
  loopValue: 'Explore → Battle → Loot → Upgrade → Push deeper',

  footer: 'MVP2 foundation build: systems first, content next.',

  nav: {
    home: 'Home',
    game: 'Game',
    camp: 'Camp',
    map: 'Map',
    gear: 'Gear',
    battle: 'Battle',
    explore: 'Explore',
  },

  status: {
    title: 'Status',
    noSave: 'No local save loaded.',
    name: 'Name',
    job: 'Job',
    level: 'Level',
    hp: 'HP',
    gold: 'Gold',
    map: 'Map',
    newGame: 'New Game',
    fight: 'Fight',
    deleteSave: 'Delete Save',
  },

  camp: {
    title: 'Camp',
    noSave: 'Start a new game to generate a local save.',
    text: 'The camp sits at the edge of the Borderlands. The fog pulses beyond the lanterns, waiting.',
    note: 'MVP2 scope note: maps, gear slots, jobs are defined; content depth (events, item pools, skills) will be expanded next.',
  },

  mapView: {
    title: 'Map',
    noSave: 'No save.',
    currentRegion: 'Current region',
    node: 'Node',
    placeholder: '(Placeholder node graph; next step will make this procedural + event-driven.)',
  },

  gear: {
    title: 'Gear',
    noSave: 'No save.',
    inventory: 'Inventory',
    equip: 'Equip',
    unequip: 'Unequip',
    next: '(Next: sell, compare, crafting, random affixes.)',
    rarity: {
      common: 'common',
      uncommon: 'uncommon',
      rare: 'rare',
      epic: 'epic',
      legendary: 'legendary',
    },
  },

  battle: {
    title: 'Battle',
    noBattle: 'No active battle.',
    attack: 'Attack',
    defend: 'Defend',
    escape: 'Escape',
  },

  prompts: {
    name: 'Name your adventurer:',
    pickJob: 'Pick a job: guard / ranger / warlock / cleric / rogue / scholar',
    deleteSave: 'Delete local save?',
  },
};

const zh: Dict = {
  appName: '雾环：文字RPG',
  tagline: '一款关于迷雾、钢铁和糟糕决定的回合制文字RPG。',
  enterGame: '进入游戏',
  github: 'GitHub',

  jobs: '职业',
  maps: '地图',
  loop: '循环',

  jobsValue: '战士 · 游侠 · 术士 · 牧师 · 盗贼 · 学者',
  mapsValue: '边境地带 · 雾林小径 · 旧矿坑 · 裂隙回廊',
  loopValue: '探索 → 战斗 → 掉落 → 强化 → 深入迷雾',

  footer: 'MVP2 底座版本：先做系统，再补内容。',

  nav: {
    home: '首页',
    game: '游戏',
    camp: '营地',
    map: '地图',
    gear: '装备',
    battle: '战斗',
    explore: '探索',
  },

  status: {
    title: '状态',
    noSave: '未加载本地存档。',
    name: '名字',
    job: '职业',
    level: '等级',
    hp: '生命',
    gold: '金币',
    map: '地图',
    newGame: '新建存档',
    fight: '开打',
    deleteSave: '删除存档',
  },

  camp: {
    title: '营地',
    noSave: '创建新游戏以生成本地存档。',
    text: '营地坐落在边境地带的尽头，灯火之外迷雾起伏，像在呼吸。',
    note: 'MVP2 范围提示：地图、装备槽位、职业已定义；内容深度（事件、掉落池、技能）会在下一步补齐。',
  },

  mapView: {
    title: '地图',
    noSave: '没有存档。',
    currentRegion: '当前区域',
    node: '节点',
    placeholder: '（节点图占位；下一步会做成程序化 + 事件驱动。）',
  },

  gear: {
    title: '装备',
    noSave: '没有存档。',
    inventory: '背包',
    equip: '装备',
    unequip: '卸下',
    next: '（下一步：出售、对比、锻造、随机词条。）',
    rarity: {
      common: '普通',
      uncommon: '精良',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
    },
  },

  battle: {
    title: '战斗',
    noBattle: '当前没有战斗。',
    attack: '攻击',
    defend: '防御',
    escape: '逃跑',
  },

  prompts: {
    name: '给你的冒险者起个名字：',
    pickJob: '选择职业：guard / ranger / warlock / cleric / rogue / scholar',
    deleteSave: '确定删除本地存档？',
  },
};

export function getDict(lang: Lang): Dict {
  return lang === 'zh' ? zh : en;
}
