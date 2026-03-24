// 称号系统 - v0.68
// Title System - 收集、装备、展示称号

/**
 * 称号来源
 */
export type TitleSource = 'achievement' | 'season' | 'event' | 'collection' | 'combat' | 'special';

/**
 * 称号稀有度
 */
export type TitleRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 * 称号配置
 */
export interface TitleConfig {
  id: string;
  name: string;
  description: string;
  source: TitleSource;
  rarity: TitleRarity;
  /** 属性加成 */
  bonuses: TitleBonus[];
  /** 获取条件描述 */
  requirement: string;
  /** 颜色代码 */
  color: string;
  /** 特效 */
  effect?: string;
  /** 是否限时 */
  isLimited?: boolean;
  /** 排序优先级（越高越前） */
  priority: number;
}

/**
 * 称号属性加成
 */
export interface TitleBonus {
  stat: 'attack' | 'defense' | 'hp' | 'speed' | 'critRate' | 'critDmg' | 'goldBonus' | 'expBonus';
  value: number;
  isPercent: boolean;
}

/**
 * 已拥有的称号
 */
export interface OwnedTitle {
  titleId: string;
  obtainedAt: number;
  /** 限时称号过期时间 */
  expiresAt?: number;
}

/**
 * 称号系统状态
 */
export interface TitleState {
  playerId: string;
  /** 当前装备的称号 */
  equippedTitle: string | null;
  /** 拥有的称号 */
  ownedTitles: OwnedTitle[];
  /** 收藏的称号（置顶） */
  favorites: string[];
  /** 最近获得 */
  recentlyObtained: string[];
}

// ==================== 称号库 ====================

export const TITLE_CONFIGS: Record<string, TitleConfig> = {
  // 成就称号
  'title_newbie': {
    id: 'title_newbie', name: '初入梦境', description: '完成新手引导',
    source: 'achievement', rarity: 'common', requirement: '完成新手引导',
    bonuses: [{ stat: 'expBonus', value: 5, isPercent: true }],
    color: '#9e9e9e', priority: 10,
  },
  'title_warrior': {
    id: 'title_warrior', name: '战斗达人', description: '完成100场战斗',
    source: 'combat', rarity: 'rare', requirement: '累计完成100场战斗',
    bonuses: [{ stat: 'attack', value: 50, isPercent: false }],
    color: '#2196f3', priority: 20,
  },
  'title_collector': {
    id: 'title_collector', name: '收藏大师', description: '收集50个图鉴条目',
    source: 'collection', rarity: 'rare', requirement: '图鉴收集50个条目',
    bonuses: [{ stat: 'goldBonus', value: 10, isPercent: true }],
    color: '#4caf50', priority: 25,
  },
  'title_tower_master': {
    id: 'title_tower_master', name: '塔中豪杰', description: '爬塔到100层',
    source: 'combat', rarity: 'epic', requirement: '爬塔达到100层',
    bonuses: [
      { stat: 'attack', value: 100, isPercent: false },
      { stat: 'defense', value: 50, isPercent: false },
    ],
    color: '#9c27b0', priority: 40,
  },
  'title_arena_champion': {
    id: 'title_arena_champion', name: '竞技之王', description: '竞技场达到传说段位',
    source: 'combat', rarity: 'epic', requirement: '竞技场传说段位',
    bonuses: [
      { stat: 'attack', value: 80, isPercent: false },
      { stat: 'speed', value: 20, isPercent: false },
    ],
    color: '#ff5722', priority: 45,
  },
  'title_pet_lover': {
    id: 'title_pet_lover', name: '宠物大师', description: '拥有全部传说宠物',
    source: 'collection', rarity: 'legendary', requirement: '收集全部传说品质宠物',
    bonuses: [
      { stat: 'attack', value: 5, isPercent: true },
      { stat: 'hp', value: 5, isPercent: true },
    ],
    color: '#ff9800', effect: 'glow_gold', priority: 60,
  },
  'title_hero_king': {
    id: 'title_hero_king', name: '英雄之王', description: '拥有全部神话英雄',
    source: 'collection', rarity: 'legendary', requirement: '收集全部神话品质英雄',
    bonuses: [
      { stat: 'attack', value: 8, isPercent: true },
      { stat: 'critRate', value: 5, isPercent: true },
    ],
    color: '#ffd700', effect: 'glow_rainbow', priority: 70,
  },
  'title_rebirth_sage': {
    id: 'title_rebirth_sage', name: '轮回贤者', description: '完成10次转生',
    source: 'achievement', rarity: 'legendary', requirement: '累计转生10次',
    bonuses: [
      { stat: 'expBonus', value: 15, isPercent: true },
      { stat: 'goldBonus', value: 15, isPercent: true },
    ],
    color: '#e91e63', effect: 'aura_purple', priority: 65,
  },
  'title_season_1': {
    id: 'title_season_1', name: '春日行者', description: '第一赛季通行证满级',
    source: 'season', rarity: 'epic', requirement: '赛季通行证达到50级',
    bonuses: [{ stat: 'expBonus', value: 10, isPercent: true }],
    color: '#8bc34a', isLimited: true, priority: 50,
  },
  'title_first_blood': {
    id: 'title_first_blood', name: '开服勇者', description: '开服首日登录',
    source: 'special', rarity: 'rare', requirement: '开服首日登录',
    bonuses: [{ stat: 'goldBonus', value: 5, isPercent: true }],
    color: '#f44336', isLimited: true, priority: 30,
  },
  'title_whale': {
    id: 'title_whale', name: '梦境守护者', description: 'VIP达到15级',
    source: 'special', rarity: 'mythic', requirement: 'VIP等级达到15级',
    bonuses: [
      { stat: 'attack', value: 10, isPercent: true },
      { stat: 'defense', value: 10, isPercent: true },
      { stat: 'hp', value: 10, isPercent: true },
    ],
    color: '#ff1744', effect: 'aura_diamond', priority: 100,
  },
  'title_puzzle_genius': {
    id: 'title_puzzle_genius', name: '智慧之星', description: '每日谜题全部答对',
    source: 'achievement', rarity: 'rare', requirement: '每日谜题10题全对',
    bonuses: [{ stat: 'expBonus', value: 8, isPercent: true }],
    color: '#00bcd4', priority: 22,
  },
};

export const RARITY_NAMES: Record<TitleRarity, string> = {
  common: '普通', rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话',
};

export const RARITY_COLORS: Record<TitleRarity, string> = {
  common: '#9e9e9e', rare: '#2196f3', epic: '#9c27b0', legendary: '#ff9800', mythic: '#ff1744',
};

export const RARITY_ORDER: Record<TitleRarity, number> = {
  common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4,
};

export const SOURCE_NAMES: Record<TitleSource, string> = {
  achievement: '成就', season: '赛季', event: '活动', collection: '收集', combat: '战斗', special: '特殊',
};

export const STAT_NAMES: Record<string, string> = {
  attack: '攻击', defense: '防御', hp: '生命', speed: '速度',
  critRate: '暴击率', critDmg: '暴击伤害', goldBonus: '金币加成', expBonus: '经验加成',
};

// ==================== 核心函数 ====================

/**
 * 创建称号系统状态
 */
export function createTitleState(playerId: string): TitleState {
  return {
    playerId,
    equippedTitle: null,
    ownedTitles: [],
    favorites: [],
    recentlyObtained: [],
  };
}

/**
 * 授予称号
 */
export function grantTitle(state: TitleState, titleId: string, expiresAt?: number, now?: number): { state: TitleState; isNew: boolean } {
  const config = TITLE_CONFIGS[titleId];
  if (!config) return { state, isNew: false };
  if (state.ownedTitles.some(t => t.titleId === titleId)) return { state, isNew: false };

  const owned: OwnedTitle = {
    titleId,
    obtainedAt: now ?? Date.now(),
    expiresAt: config.isLimited ? expiresAt : undefined,
  };

  return {
    state: {
      ...state,
      ownedTitles: [...state.ownedTitles, owned],
      recentlyObtained: [titleId, ...state.recentlyObtained].slice(0, 10),
    },
    isNew: true,
  };
}

/**
 * 装备称号
 */
export function equipTitle(state: TitleState, titleId: string): { state: TitleState; success: boolean; error?: string } {
  if (!state.ownedTitles.some(t => t.titleId === titleId)) {
    return { state, success: false, error: '未拥有该称号' };
  }
  return { state: { ...state, equippedTitle: titleId }, success: true };
}

/**
 * 卸下称号
 */
export function unequipTitle(state: TitleState): TitleState {
  return { ...state, equippedTitle: null };
}

/**
 * 收藏/取消收藏称号
 */
export function toggleFavorite(state: TitleState, titleId: string): TitleState {
  if (!state.ownedTitles.some(t => t.titleId === titleId)) return state;
  const isFav = state.favorites.includes(titleId);
  return {
    ...state,
    favorites: isFav
      ? state.favorites.filter(id => id !== titleId)
      : [...state.favorites, titleId],
  };
}

/**
 * 获取当前装备称号的属性加成
 */
export function getEquippedBonuses(state: TitleState): TitleBonus[] {
  if (!state.equippedTitle) return [];
  const config = TITLE_CONFIGS[state.equippedTitle];
  if (!config) return [];
  return config.bonuses;
}

/**
 * 计算所有称号的总属性加成（仅装备的）
 */
export function calculateTotalBonuses(state: TitleState): Record<string, { flat: number; percent: number }> {
  const bonuses: Record<string, { flat: number; percent: number }> = {};
  const equipped = getEquippedBonuses(state);

  for (const bonus of equipped) {
    if (!bonuses[bonus.stat]) bonuses[bonus.stat] = { flat: 0, percent: 0 };
    if (bonus.isPercent) {
      bonuses[bonus.stat].percent += bonus.value;
    } else {
      bonuses[bonus.stat].flat += bonus.value;
    }
  }

  return bonuses;
}

/**
 * 清理过期称号
 */
export function cleanExpiredTitles(state: TitleState, now?: number): TitleState {
  const currentTime = now ?? Date.now();
  const expired = state.ownedTitles.filter(t => t.expiresAt && t.expiresAt < currentTime).map(t => t.titleId);
  if (expired.length === 0) return state;

  return {
    ...state,
    ownedTitles: state.ownedTitles.filter(t => !t.expiresAt || t.expiresAt >= currentTime),
    equippedTitle: expired.includes(state.equippedTitle ?? '') ? null : state.equippedTitle,
    favorites: state.favorites.filter(id => !expired.includes(id)),
  };
}

/**
 * 获取拥有的称号列表（带配置）
 */
export function getOwnedTitlesList(state: TitleState): (OwnedTitle & { config: TitleConfig })[] {
  return state.ownedTitles
    .map(t => ({ ...t, config: TITLE_CONFIGS[t.titleId] }))
    .filter(t => t.config)
    .sort((a, b) => {
      // 收藏的优先
      const aFav = state.favorites.includes(a.titleId) ? 1 : 0;
      const bFav = state.favorites.includes(b.titleId) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      // 然后按优先级
      return b.config.priority - a.config.priority;
    });
}

/**
 * 按来源筛选称号
 */
export function filterBySource(state: TitleState, source: TitleSource): OwnedTitle[] {
  return state.ownedTitles.filter(t => {
    const config = TITLE_CONFIGS[t.titleId];
    return config && config.source === source;
  });
}

/**
 * 按稀有度筛选称号
 */
export function filterByRarity(state: TitleState, rarity: TitleRarity): OwnedTitle[] {
  return state.ownedTitles.filter(t => {
    const config = TITLE_CONFIGS[t.titleId];
    return config && config.rarity === rarity;
  });
}

/**
 * 搜索称号
 */
export function searchTitles(query: string): TitleConfig[] {
  const q = query.toLowerCase();
  return Object.values(TITLE_CONFIGS).filter(t =>
    t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  );
}

/**
 * 获取称号统计
 */
export function getTitleStats(state: TitleState): {
  totalOwned: number;
  totalAvailable: number;
  completionRate: number;
  rarityBreakdown: Record<TitleRarity, { owned: number; total: number }>;
  sourceBreakdown: Record<TitleSource, { owned: number; total: number }>;
  equippedTitle: TitleConfig | null;
} {
  const allConfigs = Object.values(TITLE_CONFIGS);
  const ownedIds = new Set(state.ownedTitles.map(t => t.titleId));

  const rarityBreakdown: Record<TitleRarity, { owned: number; total: number }> = {
    common: { owned: 0, total: 0 }, rare: { owned: 0, total: 0 },
    epic: { owned: 0, total: 0 }, legendary: { owned: 0, total: 0 },
    mythic: { owned: 0, total: 0 },
  };

  const sourceBreakdown: Record<TitleSource, { owned: number; total: number }> = {
    achievement: { owned: 0, total: 0 }, season: { owned: 0, total: 0 },
    event: { owned: 0, total: 0 }, collection: { owned: 0, total: 0 },
    combat: { owned: 0, total: 0 }, special: { owned: 0, total: 0 },
  };

  for (const config of allConfigs) {
    rarityBreakdown[config.rarity].total++;
    sourceBreakdown[config.source].total++;
    if (ownedIds.has(config.id)) {
      rarityBreakdown[config.rarity].owned++;
      sourceBreakdown[config.source].owned++;
    }
  }

  return {
    totalOwned: state.ownedTitles.length,
    totalAvailable: allConfigs.length,
    completionRate: allConfigs.length > 0 ? Math.round((state.ownedTitles.length / allConfigs.length) * 100) : 0,
    rarityBreakdown,
    sourceBreakdown,
    equippedTitle: state.equippedTitle ? TITLE_CONFIGS[state.equippedTitle] ?? null : null,
  };
}

/**
 * 格式化加成文本
 */
export function formatBonus(bonus: TitleBonus): string {
  const name = STAT_NAMES[bonus.stat] || bonus.stat;
  return bonus.isPercent ? `${name}+${bonus.value}%` : `${name}+${bonus.value}`;
}

/**
 * 格式化所有加成
 */
export function formatAllBonuses(bonuses: TitleBonus[]): string[] {
  return bonuses.map(formatBonus);
}

/**
 * 导出数据
 */
export function exportTitleData(state: TitleState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importTitleData(json: string): TitleState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !Array.isArray(data.ownedTitles)) return null;
    return data as TitleState;
  } catch {
    return null;
  }
}
