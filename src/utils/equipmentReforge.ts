// v0.47 装备重铸系统

/**
 * 装备部位
 */
export type EquipmentSlot = 'weapon' | 'helmet' | 'armor' | 'boots' | 'necklace' | 'ring';

/**
 * 装备品质
 */
export type EquipmentQuality = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 * 属性类型
 */
export type StatType = 'attack' | 'defense' | 'hp' | 'mp' | 'speed' | 'mag' | 'res' | 'crit' | 'critDmg' | 'lifesteal';

/**
 * 重铸结果
 */
export interface ReforgeResult {
  success: boolean;
  oldStats: Partial<Record<StatType, number>>;
  newStats: Partial<Record<StatType, number>>;
  cost: ReforgeCost;
  message: string;
}

/**
 * 重铸消耗
 */
export interface ReforgeCost {
  gold: number;
  reforgeStones: number;
  equipmentId?: string; // 作为材料的装备 ID
}

/**
 * 重铸配置
 */
export interface ReforgeConfig {
  maxStats: number; // 最大属性条数
  minStats: number; // 最小属性条数
  qualityMultipliers: Record<EquipmentQuality, number>; // 品质系数
  slotStats: Record<EquipmentSlot, StatType[]>; // 部位可用属性
  baseCost: {
    gold: number;
    reforgeStones: number;
  };
}

/**
 * 属性配置
 */
export interface StatConfig {
  type: StatType;
  name: string;
  baseValue: number;
  growthMultiplier: number;
  maxRoll: number;
}

/**
 * 装备重铸配置
 */
export const REFORGE_CONFIG: ReforgeConfig = {
  maxStats: 5,
  minStats: 2,
  qualityMultipliers: {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0,
    mythic: 5.0,
  },
  slotStats: {
    weapon: ['attack', 'mag', 'crit', 'critDmg', 'speed'],
    helmet: ['hp', 'defense', 'res', 'mp', 'defense'],
    armor: ['hp', 'defense', 'res', 'attack', 'defense'],
    boots: ['speed', 'defense', 'hp', 'attack', 'res'],
    necklace: ['mag', 'res', 'mp', 'attack', 'crit'],
    ring: ['crit', 'critDmg', 'attack', 'lifesteal', 'speed'],
  },
  baseCost: {
    gold: 1000,
    reforgeStones: 10,
  },
};

/**
 * 属性池配置
 */
export const STAT_CONFIGS: Record<StatType, StatConfig> = {
  attack: { type: 'attack', name: '攻击力', baseValue: 10, growthMultiplier: 1.5, maxRoll: 100 },
  defense: { type: 'defense', name: '防御力', baseValue: 8, growthMultiplier: 1.3, maxRoll: 80 },
  hp: { type: 'hp', name: '生命值', baseValue: 100, growthMultiplier: 2.0, maxRoll: 1000 },
  mp: { type: 'mp', name: '魔法值', baseValue: 50, growthMultiplier: 1.5, maxRoll: 500 },
  speed: { type: 'speed', name: '速度', baseValue: 5, growthMultiplier: 1.2, maxRoll: 50 },
  mag: { type: 'mag', name: '法术强度', baseValue: 12, growthMultiplier: 1.6, maxRoll: 120 },
  res: { type: 'res', name: '法术抗性', baseValue: 8, growthMultiplier: 1.3, maxRoll: 80 },
  crit: { type: 'crit', name: '暴击率', baseValue: 0.5, growthMultiplier: 0.1, maxRoll: 5 },
  critDmg: { type: 'critDmg', name: '暴击伤害', baseValue: 5, growthMultiplier: 1.0, maxRoll: 50 },
  lifesteal: { type: 'lifesteal', name: '吸血', baseValue: 1, growthMultiplier: 0.5, maxRoll: 10 },
};

/**
 * 计算重铸消耗
 */
export function calculateReforgeCost(
  quality: EquipmentQuality,
  itemLevel: number,
  statCount: number
): ReforgeCost {
  const qualityMult = REFORGE_CONFIG.qualityMultipliers[quality];
  const levelMult = 1 + (itemLevel - 1) * 0.1;
  const statMult = 1 + (statCount - 1) * 0.2;

  return {
    gold: Math.floor(REFORGE_CONFIG.baseCost.gold * qualityMult * levelMult * statMult),
    reforgeStones: Math.ceil(REFORGE_CONFIG.baseCost.reforgeStones * qualityMult),
  };
}

/**
 * 随机生成属性值
 */
export function rollStatValue(stat: StatConfig, quality: EquipmentQuality): number {
  const qualityMult = REFORGE_CONFIG.qualityMultipliers[quality];
  const baseRoll = Math.random() * stat.maxRoll;
  const value = stat.baseValue + baseRoll * stat.growthMultiplier * qualityMult;
  return Math.floor(value * 10) / 10; // 保留 1 位小数
}

/**
 * 随机生成属性
 */
export function generateRandomStats(
  slot: EquipmentSlot,
  quality: EquipmentQuality,
  minCount: number = REFORGE_CONFIG.minStats,
  maxCount: number = REFORGE_CONFIG.maxStats
): Partial<Record<StatType, number>> {
  const availableStats = REFORGE_CONFIG.slotStats[slot];
  const statCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  
  // 随机选择属性
  const shuffled = [...availableStats].sort(() => Math.random() - 0.5);
  const selectedStats = shuffled.slice(0, statCount);
  
  const stats: Partial<Record<StatType, number>> = {};
  for (const statType of selectedStats) {
    const config = STAT_CONFIGS[statType];
    stats[statType] = rollStatValue(config, quality);
  }
  
  return stats;
}

/**
 * 锁定属性
 */
export interface LockedStats {
  [statType: string]: boolean;
}

/**
 * 重铸系统主类
 */
export class EquipmentReforgeSystem {
  private reforgeHistory: Map<string, ReforgeResult[]>; // itemId -> history
  private playerReforgeStones: number;
  private playerGold: number;

  constructor(initialGold: number = 100000, initialStones: number = 100) {
    this.reforgeHistory = new Map();
    this.playerGold = initialGold;
    this.playerReforgeStones = initialStones;
  }

  /**
   * 重铸装备属性
   */
  reforgeEquipment(
    itemId: string,
    slot: EquipmentSlot,
    quality: EquipmentQuality,
    itemLevel: number,
    currentStats: Partial<Record<StatType, number>>,
    lockedStats: LockedStats = {}
  ): ReforgeResult {
    // 计算消耗
    const statCount = Object.keys(currentStats).length;
    const cost = calculateReforgeCost(quality, itemLevel, statCount);

    // 检查资源
    if (this.playerGold < cost.gold) {
      return {
        success: false,
        oldStats: currentStats,
        newStats: currentStats,
        cost,
        message: `金币不足，需要${cost.gold}`,
      };
    }

    if (this.playerReforgeStones < cost.reforgeStones) {
      return {
        success: false,
        oldStats: currentStats,
        newStats: currentStats,
        cost,
        message: `重铸石不足，需要${cost.reforgeStones}`,
      };
    }

    // 生成新属性
    const newStats = generateRandomStats(slot, quality);

    // 应用锁定的属性
    for (const [statType, isLocked] of Object.entries(lockedStats)) {
      if (isLocked && currentStats[statType as StatType]) {
        newStats[statType as StatType] = currentStats[statType as StatType];
      }
    }

    // 扣除资源
    this.playerGold -= cost.gold;
    this.playerReforgeStones -= cost.reforgeStones;

    // 记录历史
    const result: ReforgeResult = {
      success: true,
      oldStats: currentStats,
      newStats,
      cost,
      message: '重铸成功',
    };

    this.saveReforgeHistory(itemId, result);

    return result;
  }

  /**
   * 批量重铸（直到出现满意属性）
   */
  batchReforge(
    itemId: string,
    slot: EquipmentSlot,
    quality: EquipmentQuality,
    itemLevel: number,
    currentStats: Partial<Record<StatType, number>>,
    targetStats: Partial<Record<StatType, number>>,
    maxAttempts: number = 10
  ): { results: ReforgeResult[]; totalCost: ReforgeCost; bestResult?: ReforgeResult } {
    const results: ReforgeResult[] = [];
    let totalCost: ReforgeCost = { gold: 0, reforgeStones: 0 };
    let bestResult: ReforgeResult | undefined;
    let bestScore = 0;

    for (let i = 0; i < maxAttempts; i++) {
      const result = this.reforgeEquipment(itemId, slot, quality, itemLevel, currentStats);
      
      if (!result.success) {
        break;
      }

      results.push(result);
      totalCost.gold += result.cost.gold;
      totalCost.reforgeStones += result.cost.reforgeStones;

      // 计算评分
      const score = this.calculateStatScore(result.newStats, targetStats);
      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }

      // 如果达到目标评分，停止重铸
      if (score >= 0.9) {
        break;
      }
    }

    return { results, totalCost, bestResult };
  }

  /**
   * 计算属性评分
   */
  private calculateStatScore(
    actual: Partial<Record<StatType, number>>,
    target: Partial<Record<StatType, number>>
  ): number {
    let totalScore = 0;
    let statCount = 0;

    for (const [statType, targetValue] of Object.entries(target)) {
      const actualValue = actual[statType as StatType];
      if (actualValue !== undefined) {
        const ratio = Math.min(actualValue / targetValue, 1.5); // 最高 150% 算满分
        totalScore += ratio;
        statCount++;
      }
    }

    return statCount > 0 ? totalScore / statCount : 0;
  }

  /**
   * 保存重铸历史
   */
  private saveReforgeHistory(itemId: string, result: ReforgeResult) {
    const history = this.reforgeHistory.get(itemId) || [];
    history.push(result);
    
    // 只保留最近 50 次
    if (history.length > 50) {
      history.shift();
    }
    
    this.reforgeHistory.set(itemId, history);
  }

  /**
   * 获取重铸历史
   */
  getReforgeHistory(itemId: string): ReforgeResult[] {
    return this.reforgeHistory.get(itemId) || [];
  }

  /**
   * 获取玩家资源
   */
  getPlayerResources(): { gold: number; reforgeStones: number } {
    return {
      gold: this.playerGold,
      reforgeStones: this.playerReforgeStones,
    };
  }

  /**
   * 添加资源
   */
  addResources(gold: number = 0, reforgeStones: number = 0) {
    this.playerGold += gold;
    this.playerReforgeStones += reforgeStones;
  }

  /**
   * 导出存档数据
   */
  exportData(): any {
    return {
      reforgeHistory: Array.from(this.reforgeHistory.entries()),
      playerGold: this.playerGold,
      playerReforgeStones: this.playerReforgeStones,
    };
  }

  /**
   * 导入存档数据
   */
  importData(data: any): void {
    this.reforgeHistory = new Map(data.reforgeHistory || []);
    this.playerGold = data.playerGold || 0;
    this.playerReforgeStones = data.playerReforgeStones || 0;
  }
}

/**
 * 创建装备重铸系统实例
 */
export function createEquipmentReforgeSystem(gold?: number, stones?: number): EquipmentReforgeSystem {
  return new EquipmentReforgeSystem(gold, stones);
}
