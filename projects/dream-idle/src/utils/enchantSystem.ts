// 附魔系统 - v0.70
// Enchantment system for equipment

/**
 * 附魔类型
 */
export type EnchantType = 'fire' | 'ice' | 'thunder' | 'holy' | 'dark' | 'wind';

/**
 * 附魔等级
 */
export type EnchantTier = 1 | 2 | 3 | 4 | 5;

/**
 * 附魔效果
 */
export interface EnchantEffect {
  type: EnchantType;
  tier: EnchantTier;
  /** 主属性加成（百分比） */
  mainBonus: number;
  /** 附加效果描述 */
  effectName: string;
  effectDesc: string;
  /** 触发概率（百分比） */
  procChance: number;
  /** 额外伤害倍率 */
  procDamage: number;
}

/**
 * 附魔配置
 */
export interface EnchantConfig {
  type: EnchantType;
  name: string;
  element: string;
  icon: string;
  tiers: Record<EnchantTier, {
    mainBonus: number;
    effectName: string;
    effectDesc: string;
    procChance: number;
    procDamage: number;
    cost: { gold: number; material: number };
    successRate: number;
  }>;
}

/**
 * 装备附魔状态
 */
export interface EquipEnchant {
  equipId: string;
  enchant: EnchantEffect | null;
  enchantHistory: { type: EnchantType; tier: EnchantTier; timestamp: number; success: boolean }[];
  protectionActive: boolean;
}

/**
 * 附魔系统状态
 */
export interface EnchantState {
  playerId: string;
  equips: Record<string, EquipEnchant>;
  materials: Record<EnchantType, number>;
  totalEnchants: number;
  totalSuccesses: number;
  totalFailures: number;
  highestTier: EnchantTier;
}

// ==================== 附魔配置 ====================

export const ENCHANT_CONFIGS: Record<EnchantType, EnchantConfig> = {
  fire: {
    type: 'fire', name: '烈焰', element: '火', icon: '🔥',
    tiers: {
      1: { mainBonus: 5, effectName: '灼烧', effectDesc: '攻击有概率灼烧敌人', procChance: 15, procDamage: 0.3, cost: { gold: 1000, material: 5 }, successRate: 100 },
      2: { mainBonus: 10, effectName: '焚天', effectDesc: '攻击有概率引燃敌人', procChance: 20, procDamage: 0.5, cost: { gold: 3000, material: 15 }, successRate: 80 },
      3: { mainBonus: 18, effectName: '炎爆', effectDesc: '攻击有概率造成爆燃', procChance: 25, procDamage: 0.8, cost: { gold: 8000, material: 30 }, successRate: 60 },
      4: { mainBonus: 28, effectName: '焚灭', effectDesc: '攻击有概率引发火焰风暴', procChance: 20, procDamage: 1.2, cost: { gold: 20000, material: 60 }, successRate: 40 },
      5: { mainBonus: 40, effectName: '灭世之焰', effectDesc: '攻击有概率召唤毁灭之火', procChance: 15, procDamage: 2.0, cost: { gold: 50000, material: 100 }, successRate: 20 },
    },
  },
  ice: {
    type: 'ice', name: '寒冰', element: '水', icon: '❄️',
    tiers: {
      1: { mainBonus: 5, effectName: '冰冻', effectDesc: '攻击有概率冻结敌人', procChance: 12, procDamage: 0.2, cost: { gold: 1000, material: 5 }, successRate: 100 },
      2: { mainBonus: 10, effectName: '霜寒', effectDesc: '攻击有概率减速敌人', procChance: 18, procDamage: 0.4, cost: { gold: 3000, material: 15 }, successRate: 80 },
      3: { mainBonus: 18, effectName: '冰封', effectDesc: '攻击有概率冰封敌人', procChance: 22, procDamage: 0.7, cost: { gold: 8000, material: 30 }, successRate: 60 },
      4: { mainBonus: 28, effectName: '极寒', effectDesc: '攻击有概率引发暴风雪', procChance: 18, procDamage: 1.0, cost: { gold: 20000, material: 60 }, successRate: 40 },
      5: { mainBonus: 40, effectName: '绝对零度', effectDesc: '攻击有概率冻结一切', procChance: 12, procDamage: 1.8, cost: { gold: 50000, material: 100 }, successRate: 20 },
    },
  },
  thunder: {
    type: 'thunder', name: '雷电', element: '雷', icon: '⚡',
    tiers: {
      1: { mainBonus: 5, effectName: '感电', effectDesc: '攻击有概率麻痹敌人', procChance: 10, procDamage: 0.4, cost: { gold: 1000, material: 5 }, successRate: 100 },
      2: { mainBonus: 10, effectName: '雷击', effectDesc: '攻击有概率雷击敌人', procChance: 15, procDamage: 0.6, cost: { gold: 3000, material: 15 }, successRate: 80 },
      3: { mainBonus: 18, effectName: '雷暴', effectDesc: '攻击有概率引发连锁雷电', procChance: 20, procDamage: 0.9, cost: { gold: 8000, material: 30 }, successRate: 60 },
      4: { mainBonus: 28, effectName: '天罚', effectDesc: '攻击有概率召唤天雷', procChance: 15, procDamage: 1.3, cost: { gold: 20000, material: 60 }, successRate: 40 },
      5: { mainBonus: 40, effectName: '万雷天劫', effectDesc: '攻击有概率引发雷劫', procChance: 10, procDamage: 2.2, cost: { gold: 50000, material: 100 }, successRate: 20 },
    },
  },
  holy: {
    type: 'holy', name: '神圣', element: '光', icon: '✨',
    tiers: {
      1: { mainBonus: 3, effectName: '净化', effectDesc: '攻击有概率净化debuff', procChance: 20, procDamage: 0.1, cost: { gold: 1000, material: 5 }, successRate: 100 },
      2: { mainBonus: 6, effectName: '圣光', effectDesc: '攻击有概率回复生命', procChance: 25, procDamage: 0.3, cost: { gold: 3000, material: 15 }, successRate: 80 },
      3: { mainBonus: 12, effectName: '神佑', effectDesc: '攻击有概率获得护盾', procChance: 20, procDamage: 0.5, cost: { gold: 8000, material: 30 }, successRate: 60 },
      4: { mainBonus: 20, effectName: '天恩', effectDesc: '攻击有概率全队回复', procChance: 15, procDamage: 0.8, cost: { gold: 20000, material: 60 }, successRate: 40 },
      5: { mainBonus: 30, effectName: '圣裁', effectDesc: '攻击有概率召唤圣光审判', procChance: 10, procDamage: 1.5, cost: { gold: 50000, material: 100 }, successRate: 20 },
    },
  },
  dark: {
    type: 'dark', name: '暗影', element: '暗', icon: '🌑',
    tiers: {
      1: { mainBonus: 5, effectName: '侵蚀', effectDesc: '攻击有概率侵蚀敌人', procChance: 12, procDamage: 0.3, cost: { gold: 1000, material: 5 }, successRate: 100 },
      2: { mainBonus: 10, effectName: '诅咒', effectDesc: '攻击有概率诅咒敌人', procChance: 18, procDamage: 0.5, cost: { gold: 3000, material: 15 }, successRate: 80 },
      3: { mainBonus: 18, effectName: '噬魂', effectDesc: '攻击有概率吸取灵魂', procChance: 15, procDamage: 0.8, cost: { gold: 8000, material: 30 }, successRate: 60 },
      4: { mainBonus: 28, effectName: '暗蚀', effectDesc: '攻击有概率暗影吞噬', procChance: 12, procDamage: 1.2, cost: { gold: 20000, material: 60 }, successRate: 40 },
      5: { mainBonus: 40, effectName: '虚无之力', effectDesc: '攻击有概率虚空吞噬', procChance: 8, procDamage: 2.5, cost: { gold: 50000, material: 100 }, successRate: 20 },
    },
  },
  wind: {
    type: 'wind', name: '疾风', element: '风', icon: '🌪️',
    tiers: {
      1: { mainBonus: 3, effectName: '疾步', effectDesc: '攻击有概率提升速度', procChance: 20, procDamage: 0.1, cost: { gold: 1000, material: 5 }, successRate: 100 },
      2: { mainBonus: 6, effectName: '风刃', effectDesc: '攻击有概率追加风刃', procChance: 22, procDamage: 0.3, cost: { gold: 3000, material: 15 }, successRate: 80 },
      3: { mainBonus: 12, effectName: '旋风', effectDesc: '攻击有概率引发旋风', procChance: 18, procDamage: 0.6, cost: { gold: 8000, material: 30 }, successRate: 60 },
      4: { mainBonus: 20, effectName: '风暴', effectDesc: '攻击有概率引发风暴', procChance: 15, procDamage: 1.0, cost: { gold: 20000, material: 60 }, successRate: 40 },
      5: { mainBonus: 30, effectName: '天风裂空', effectDesc: '攻击有概率裂空斩击', procChance: 12, procDamage: 1.8, cost: { gold: 50000, material: 100 }, successRate: 20 },
    },
  },
};

export const ENCHANT_TYPES: EnchantType[] = ['fire', 'ice', 'thunder', 'holy', 'dark', 'wind'];
export const MAX_HISTORY = 30;

// ==================== 核心函数 ====================

/**
 * 创建附魔系统状态
 */
export function createEnchantState(playerId: string): EnchantState {
  return {
    playerId,
    equips: {},
    materials: { fire: 0, ice: 0, thunder: 0, holy: 0, dark: 0, wind: 0 },
    totalEnchants: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    highestTier: 1,
  };
}

/**
 * 添加附魔材料
 */
export function addMaterial(state: EnchantState, type: EnchantType, amount: number): EnchantState {
  return {
    ...state,
    materials: { ...state.materials, [type]: (state.materials[type] || 0) + amount },
  };
}

/**
 * 获取或创建装备附魔状态
 */
function getEquipEnchant(state: EnchantState, equipId: string): EquipEnchant {
  return state.equips[equipId] || {
    equipId,
    enchant: null,
    enchantHistory: [],
    protectionActive: false,
  };
}

/**
 * 获取附魔效果
 */
export function getEnchantEffect(type: EnchantType, tier: EnchantTier): EnchantEffect {
  const config = ENCHANT_CONFIGS[type];
  const tierConfig = config.tiers[tier];
  return {
    type,
    tier,
    mainBonus: tierConfig.mainBonus,
    effectName: tierConfig.effectName,
    effectDesc: tierConfig.effectDesc,
    procChance: tierConfig.procChance,
    procDamage: tierConfig.procDamage,
  };
}

/**
 * 检查是否可以附魔
 */
export function canEnchant(
  state: EnchantState,
  equipId: string,
  type: EnchantType,
  tier: EnchantTier,
  playerGold: number
): { canEnchant: boolean; reason?: string } {
  const config = ENCHANT_CONFIGS[type];
  const tierConfig = config.tiers[tier];

  if (playerGold < tierConfig.cost.gold) {
    return { canEnchant: false, reason: `金币不足（需要${tierConfig.cost.gold}）` };
  }
  if ((state.materials[type] || 0) < tierConfig.cost.material) {
    return { canEnchant: false, reason: `${config.name}附魔石不足（需要${tierConfig.cost.material}）` };
  }

  // 升级附魔需要当前附魔为前一级
  if (tier > 1) {
    const equip = getEquipEnchant(state, equipId);
    if (!equip.enchant || equip.enchant.type !== type || equip.enchant.tier !== (tier - 1) as EnchantTier) {
      return { canEnchant: false, reason: `需要先拥有${config.name}${tier - 1}级附魔` };
    }
  }

  return { canEnchant: true };
}

/**
 * 执行附魔
 */
export function enchant(
  state: EnchantState,
  equipId: string,
  type: EnchantType,
  tier: EnchantTier,
  playerGold: number,
  rng?: () => number,
  now?: number
): { state: EnchantState; success: boolean; goldCost: number; effect?: EnchantEffect; error?: string } {
  const check = canEnchant(state, equipId, type, tier, playerGold);
  if (!check.canEnchant) {
    return { state, success: false, goldCost: 0, error: check.reason };
  }

  const config = ENCHANT_CONFIGS[type];
  const tierConfig = config.tiers[tier];
  const rand = rng ?? Math.random;

  let newState = { ...state };
  // 消耗材料
  newState.materials = { ...newState.materials, [type]: newState.materials[type] - tierConfig.cost.material };
  newState.totalEnchants++;

  const roll = rand() * 100;
  const success = roll < tierConfig.successRate;

  // 记录历史
  const equip = getEquipEnchant(newState, equipId);
  const historyEntry = { type, tier, timestamp: now ?? Date.now(), success };
  const newHistory = [historyEntry, ...equip.enchantHistory].slice(0, MAX_HISTORY);

  if (success) {
    const effect = getEnchantEffect(type, tier);
    newState.equips = {
      ...newState.equips,
      [equipId]: { ...equip, enchant: effect, enchantHistory: newHistory, protectionActive: false },
    };
    newState.totalSuccesses++;
    if (tier > newState.highestTier) {
      newState.highestTier = tier;
    }
    return { state: newState, success: true, goldCost: tierConfig.cost.gold, effect };
  } else {
    // 失败 - 如果有保护则不降级
    let newEnchant = equip.enchant;
    if (!equip.protectionActive && equip.enchant && equip.enchant.tier > 1) {
      // 降一级
      const newTier = (equip.enchant.tier - 1) as EnchantTier;
      newEnchant = getEnchantEffect(equip.enchant.type, newTier);
    }
    newState.equips = {
      ...newState.equips,
      [equipId]: { ...equip, enchant: newEnchant, enchantHistory: newHistory, protectionActive: false },
    };
    newState.totalFailures++;
    return { state: newState, success: false, goldCost: tierConfig.cost.gold };
  }
}

/**
 * 设置保护（防止降级）
 */
export function setProtection(state: EnchantState, equipId: string, active: boolean): EnchantState {
  const equip = getEquipEnchant(state, equipId);
  return {
    ...state,
    equips: { ...state.equips, [equipId]: { ...equip, protectionActive: active } },
  };
}

/**
 * 移除附魔
 */
export function removeEnchant(state: EnchantState, equipId: string): EnchantState {
  const equip = getEquipEnchant(state, equipId);
  return {
    ...state,
    equips: { ...state.equips, [equipId]: { ...equip, enchant: null } },
  };
}

/**
 * 获取装备附魔信息
 */
export function getEquipEnchantInfo(state: EnchantState, equipId: string): EquipEnchant {
  return getEquipEnchant(state, equipId);
}

/**
 * 获取附魔统计
 */
export function getEnchantStats(state: EnchantState): {
  totalEnchants: number;
  totalSuccesses: number;
  totalFailures: number;
  successRate: number;
  highestTier: EnchantTier;
  enchantedEquips: number;
  materials: Record<EnchantType, number>;
} {
  const enchantedEquips = Object.values(state.equips).filter(e => e.enchant !== null).length;
  return {
    totalEnchants: state.totalEnchants,
    totalSuccesses: state.totalSuccesses,
    totalFailures: state.totalFailures,
    successRate: state.totalEnchants > 0 ? Math.round((state.totalSuccesses / state.totalEnchants) * 100) : 0,
    highestTier: state.highestTier,
    enchantedEquips,
    materials: { ...state.materials },
  };
}

/**
 * 获取附魔名称
 */
export function getEnchantName(type: EnchantType): string {
  return ENCHANT_CONFIGS[type].name;
}

/**
 * 获取附魔图标
 */
export function getEnchantIcon(type: EnchantType): string {
  return ENCHANT_CONFIGS[type].icon;
}

/**
 * 导出数据
 */
export function exportEnchantData(state: EnchantState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importEnchantData(json: string): EnchantState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || typeof data.totalEnchants !== 'number') return null;
    return data as EnchantState;
  } catch {
    return null;
  }
}
