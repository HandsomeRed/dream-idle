// 神器系统 - v0.72
// Artifact System - 独特传说级装备，全局增益

/**
 * 神器品质
 */
export type ArtifactRarity = 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 * 神器类型
 */
export type ArtifactType = 'weapon' | 'armor' | 'accessory' | 'relic';

/**
 * 神器效果
 */
export interface ArtifactEffect {
  type: 'atk_percent' | 'def_percent' | 'hp_percent' | 'spd_percent' | 'crit_rate' | 'crit_dmg' | 'gold_bonus' | 'exp_bonus' | 'drop_bonus' | 'heal_bonus' | 'skill_dmg' | 'dmg_reduction';
  value: number;
  description: string;
}

/**
 * 神器配置
 */
export interface ArtifactConfig {
  id: string;
  name: string;
  type: ArtifactType;
  rarity: ArtifactRarity;
  description: string;
  maxLevel: number;
  baseEffects: ArtifactEffect[];
  /** 每级效果增长倍率 */
  growthRate: number;
  /** 解锁条件描述 */
  unlockCondition: string;
  icon: string;
}

/**
 * 拥有的神器
 */
export interface OwnedArtifact {
  artifactId: string;
  level: number;
  exp: number;
  isEquipped: boolean;
  obtainedAt: number;
  /** 已激活的共鸣 */
  resonanceLevel: number;
}

/**
 * 神器共鸣（套装效果）
 */
export interface ResonanceBonus {
  count: number;
  effects: ArtifactEffect[];
  name: string;
}

/**
 * 神器系统状态
 */
export interface ArtifactState {
  playerId: string;
  owned: Record<string, OwnedArtifact>;
  equipped: string[]; // 最多装备3个
  maxEquipSlots: number;
  totalExp: number;
  /** 每日免费强化次数 */
  dailyFreeEnhance: number;
  dailyFreeEnhanceUsed: number;
  lastResetDate: string;
}

// ==================== 神器配置 ====================

export const ARTIFACT_CONFIGS: Record<string, ArtifactConfig> = {
  'art_sword_of_dawn': {
    id: 'art_sword_of_dawn', name: '黎明之剑', type: 'weapon', rarity: 'legendary',
    description: '传说中照亮黑暗的神剑，持有者攻击力大增',
    maxLevel: 30, baseEffects: [
      { type: 'atk_percent', value: 10, description: '攻击力+10%' },
      { type: 'crit_rate', value: 5, description: '暴击率+5%' },
    ], growthRate: 1.5, unlockCondition: '通关第50层塔', icon: '⚔️',
  },
  'art_shield_of_earth': {
    id: 'art_shield_of_earth', name: '大地之盾', type: 'armor', rarity: 'legendary',
    description: '大地之力凝结的护盾，坚不可摧',
    maxLevel: 30, baseEffects: [
      { type: 'def_percent', value: 15, description: '防御力+15%' },
      { type: 'hp_percent', value: 8, description: '生命+8%' },
    ], growthRate: 1.4, unlockCondition: '收集20个英雄', icon: '🛡️',
  },
  'art_ring_of_fortune': {
    id: 'art_ring_of_fortune', name: '幸运之戒', type: 'accessory', rarity: 'epic',
    description: '镶嵌幸运宝石的戒指，提升掉落率',
    maxLevel: 20, baseEffects: [
      { type: 'gold_bonus', value: 12, description: '金币获取+12%' },
      { type: 'drop_bonus', value: 8, description: '掉落率+8%' },
    ], growthRate: 1.3, unlockCondition: '完成100次副本', icon: '💍',
  },
  'art_crown_of_wisdom': {
    id: 'art_crown_of_wisdom', name: '智慧王冠', type: 'accessory', rarity: 'epic',
    description: '古代贤者的王冠，增加经验获取',
    maxLevel: 20, baseEffects: [
      { type: 'exp_bonus', value: 15, description: '经验获取+15%' },
      { type: 'skill_dmg', value: 5, description: '技能伤害+5%' },
    ], growthRate: 1.3, unlockCondition: '角色达到50级', icon: '👑',
  },
  'art_pendant_of_life': {
    id: 'art_pendant_of_life', name: '生命吊坠', type: 'accessory', rarity: 'rare',
    description: '蕴含生命力的翡翠吊坠',
    maxLevel: 15, baseEffects: [
      { type: 'hp_percent', value: 10, description: '生命+10%' },
      { type: 'heal_bonus', value: 8, description: '治疗效果+8%' },
    ], growthRate: 1.2, unlockCondition: '好感度达到5级', icon: '📿',
  },
  'art_eye_of_chaos': {
    id: 'art_eye_of_chaos', name: '混沌之眼', type: 'relic', rarity: 'mythic',
    description: '来自混沌深渊的神秘之眼，力量无穷',
    maxLevel: 50, baseEffects: [
      { type: 'atk_percent', value: 8, description: '攻击力+8%' },
      { type: 'crit_dmg', value: 15, description: '暴击伤害+15%' },
      { type: 'dmg_reduction', value: 5, description: '伤害减免+5%' },
    ], growthRate: 1.6, unlockCondition: '竞技场传说段位', icon: '👁️',
  },
  'art_boots_of_wind': {
    id: 'art_boots_of_wind', name: '疾风之靴', type: 'armor', rarity: 'rare',
    description: '轻若无物的神奇靴子',
    maxLevel: 15, baseEffects: [
      { type: 'spd_percent', value: 12, description: '速度+12%' },
    ], growthRate: 1.2, unlockCondition: '竞技场黄金段位', icon: '👢',
  },
};

export const RESONANCE_BONUSES: ResonanceBonus[] = [
  { count: 2, name: '双重共鸣', effects: [{ type: 'atk_percent', value: 3, description: '攻击力+3%' }] },
  { count: 3, name: '三重共鸣', effects: [
    { type: 'atk_percent', value: 5, description: '攻击力+5%' },
    { type: 'hp_percent', value: 5, description: '生命+5%' },
  ]},
];

export const EXP_PER_LEVEL_BASE = 100;
export const ENHANCE_COST_BASE = 500; // 金币
export const DAILY_FREE_ENHANCE = 5;
export const MAX_EQUIP_SLOTS = 3;

export const RARITY_NAMES: Record<ArtifactRarity, string> = {
  rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话',
};
export const RARITY_COLORS: Record<ArtifactRarity, string> = {
  rare: '#2196f3', epic: '#9c27b0', legendary: '#ff9800', mythic: '#f44336',
};
export const TYPE_NAMES: Record<ArtifactType, string> = {
  weapon: '武器', armor: '护甲', accessory: '饰品', relic: '圣物',
};

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getExpForLevel(level: number): number {
  return Math.floor(EXP_PER_LEVEL_BASE * Math.pow(1.15, level));
}

export function getEnhanceCost(level: number, rarity: ArtifactRarity): number {
  const rarityMultiplier: Record<ArtifactRarity, number> = { rare: 1, epic: 1.5, legendary: 2, mythic: 3 };
  return Math.floor(ENHANCE_COST_BASE * Math.pow(1.1, level) * rarityMultiplier[rarity]);
}

// ==================== 核心函数 ====================

export function createArtifactState(playerId: string): ArtifactState {
  return {
    playerId,
    owned: {},
    equipped: [],
    maxEquipSlots: MAX_EQUIP_SLOTS,
    totalExp: 0,
    dailyFreeEnhance: DAILY_FREE_ENHANCE,
    dailyFreeEnhanceUsed: 0,
    lastResetDate: getTodayStr(),
  };
}

export function unlockArtifact(state: ArtifactState, artifactId: string, now?: number): { state: ArtifactState; success: boolean; error?: string } {
  if (!ARTIFACT_CONFIGS[artifactId]) return { state, success: false, error: '神器不存在' };
  if (state.owned[artifactId]) return { state, success: false, error: '已拥有该神器' };

  const artifact: OwnedArtifact = {
    artifactId, level: 1, exp: 0, isEquipped: false,
    obtainedAt: now ?? Date.now(), resonanceLevel: 0,
  };

  return {
    state: { ...state, owned: { ...state.owned, [artifactId]: artifact } },
    success: true,
  };
}

export function enhanceArtifact(
  state: ArtifactState, artifactId: string, expAmount: number, goldSpent: number = 0
): { state: ArtifactState; success: boolean; levelsGained: number; error?: string } {
  const artifact = state.owned[artifactId];
  if (!artifact) return { state, success: false, levelsGained: 0, error: '未拥有该神器' };

  const config = ARTIFACT_CONFIGS[artifactId];
  if (artifact.level >= config.maxLevel) return { state, success: false, levelsGained: 0, error: '已达最大等级' };

  const newArtifact = { ...artifact };
  newArtifact.exp += expAmount;
  let levelsGained = 0;

  while (newArtifact.level < config.maxLevel) {
    const needed = getExpForLevel(newArtifact.level);
    if (newArtifact.exp >= needed) {
      newArtifact.exp -= needed;
      newArtifact.level++;
      levelsGained++;
    } else {
      break;
    }
  }

  if (newArtifact.level >= config.maxLevel) {
    newArtifact.exp = 0;
  }

  return {
    state: {
      ...state,
      owned: { ...state.owned, [artifactId]: newArtifact },
      totalExp: state.totalExp + expAmount,
    },
    success: true,
    levelsGained,
  };
}

export function equipArtifact(state: ArtifactState, artifactId: string): { state: ArtifactState; success: boolean; error?: string } {
  const artifact = state.owned[artifactId];
  if (!artifact) return { state, success: false, error: '未拥有该神器' };
  if (artifact.isEquipped) return { state, success: false, error: '已装备' };
  if (state.equipped.length >= state.maxEquipSlots) return { state, success: false, error: '装备槽已满' };

  const newArtifact = { ...artifact, isEquipped: true };
  return {
    state: {
      ...state,
      owned: { ...state.owned, [artifactId]: newArtifact },
      equipped: [...state.equipped, artifactId],
    },
    success: true,
  };
}

export function unequipArtifact(state: ArtifactState, artifactId: string): { state: ArtifactState; success: boolean; error?: string } {
  const artifact = state.owned[artifactId];
  if (!artifact) return { state, success: false, error: '未拥有该神器' };
  if (!artifact.isEquipped) return { state, success: false, error: '未装备' };

  const newArtifact = { ...artifact, isEquipped: false };
  return {
    state: {
      ...state,
      owned: { ...state.owned, [artifactId]: newArtifact },
      equipped: state.equipped.filter(id => id !== artifactId),
    },
    success: true,
  };
}

export function getArtifactEffects(artifact: OwnedArtifact): ArtifactEffect[] {
  const config = ARTIFACT_CONFIGS[artifact.artifactId];
  if (!config) return [];

  return config.baseEffects.map(effect => ({
    ...effect,
    value: Math.round(effect.value * (1 + (artifact.level - 1) * (config.growthRate - 1) * 0.1) * 10) / 10,
    description: `${effect.description.split('+')[0]}+${Math.round(effect.value * (1 + (artifact.level - 1) * (config.growthRate - 1) * 0.1) * 10) / 10}%`,
  }));
}

export function getResonanceBonus(equippedCount: number): ResonanceBonus | null {
  // 找到满足条件的最高共鸣
  const sorted = [...RESONANCE_BONUSES].sort((a, b) => b.count - a.count);
  return sorted.find(r => equippedCount >= r.count) ?? null;
}

export function getTotalEffects(state: ArtifactState): ArtifactEffect[] {
  const effects: ArtifactEffect[] = [];

  // 装备的神器效果
  for (const artifactId of state.equipped) {
    const artifact = state.owned[artifactId];
    if (artifact) {
      effects.push(...getArtifactEffects(artifact));
    }
  }

  // 共鸣加成
  const resonance = getResonanceBonus(state.equipped.length);
  if (resonance) {
    effects.push(...resonance.effects);
  }

  return effects;
}

export function getArtifactStats(state: ArtifactState): {
  totalOwned: number;
  totalEquipped: number;
  maxLevel: number;
  avgLevel: number;
  totalEffects: number;
  resonance: string | null;
} {
  const owned = Object.values(state.owned);
  const maxLevel = owned.reduce((max, a) => Math.max(max, a.level), 0);
  const avgLevel = owned.length > 0 ? Math.round(owned.reduce((sum, a) => sum + a.level, 0) / owned.length) : 0;
  const totalEffects = getTotalEffects(state).length;
  const resonance = getResonanceBonus(state.equipped.length);

  return {
    totalOwned: owned.length,
    totalEquipped: state.equipped.length,
    maxLevel,
    avgLevel,
    totalEffects,
    resonance: resonance?.name ?? null,
  };
}

export function checkDailyReset(state: ArtifactState, now?: number): ArtifactState {
  const today = getTodayStr(now);
  if (today !== state.lastResetDate) {
    return { ...state, dailyFreeEnhanceUsed: 0, lastResetDate: today };
  }
  return state;
}

export function getRarityName(rarity: ArtifactRarity): string { return RARITY_NAMES[rarity]; }
export function getRarityColor(rarity: ArtifactRarity): string { return RARITY_COLORS[rarity]; }
export function getTypeName(type: ArtifactType): string { return TYPE_NAMES[type]; }

export function exportArtifactData(state: ArtifactState): string { return JSON.stringify(state); }
export function importArtifactData(json: string): ArtifactState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !data.owned) return null;
    return data as ArtifactState;
  } catch { return null; }
}
