/**
 * Equipment Enhancement System - v0.28
 * 装备强化系统：强化、精炼、宝石镶嵌
 */

// ==================== 枚举和类型定义 ====================

/**
 * 强化等级 (-12 到 +15)
 * -12 到 -1: 装备损坏程度
 * 0: 未强化
 * +1 到 +15: 强化等级
 */
export type EnhancementLevel = number;

/**
 * 精炼等级 (1-5 星)
 */
export type RefinementLevel = 1 | 2 | 3 | 4 | 5;

/**
 * 宝石类型
 */
export enum GemType {
  Attack = 'attack',      // 红宝石 - 攻击
  Defense = 'defense',    // 蓝宝石 - 防御
  HP = 'hp',             // 绿宝石 - 生命
  Speed = 'speed',       // 黄宝石 - 速度
  Critical = 'critical'  // 紫宝石 - 暴击
}

/**
 * 宝石品质
 */
export enum GemQuality {
  Common = 'common',     // 普通
  Rare = 'rare',        // 稀有
  Epic = 'epic',        // 史诗
  Legendary = 'legendary' // 传说
}

/**
 * 宝石定义
 */
export interface Gem {
  id: string;
  type: GemType;
  quality: GemQuality;
  value: number;  // 属性值
}

/**
 * 强化结果
 */
export interface EnhancementResult {
  success: boolean;
  levelChanged: number;  // 等级变化
  isBroken: boolean;     // 是否损坏
  message: string;
}

/**
 * 精炼结果
 */
export interface RefinementResult {
  success: boolean;
  levelChanged: number;  // 精炼等级变化
  message: string;
}

/**
 * 宝石镶嵌结果
 */
export interface SocketResult {
  success: boolean;
  gemInstalled: Gem | null;
  gemRemoved: Gem | null;
  message: string;
}

/**
 * 装备强化状态
 */
export interface EnhancementState {
  level: EnhancementLevel;  // 强化等级
  exp: number;              // 强化经验
  isLocked: boolean;        // 是否锁定（防止降级）
  protectionUsed: boolean;  // 是否使用保护符
}

/**
 * 装备精炼状态
 */
export interface RefinementState {
  level: RefinementLevel;   // 精炼星级
  exp: number;              // 精炼经验
}

/**
 * 装备宝石槽
 */
export interface GemSocket {
  unlocked: boolean;        // 是否解锁
  gem: Gem | null;          // 已镶嵌的宝石
}

// ==================== 常量配置 ====================

/**
 * 强化成功率配置 (基础概率)
 * +1 到 +10: 较容易
 * +11 到 +13: 中等难度
 * +14 到 +15: 极高难度
 */
export const ENHANCE_SUCCESS_RATES: Record<number, number> = {
  1: 1.00,   // 100%
  2: 0.95,   // 95%
  3: 0.90,   // 90%
  4: 0.85,   // 85%
  5: 0.80,   // 80%
  6: 0.75,   // 75%
  7: 0.70,   // 70%
  8: 0.65,   // 65%
  9: 0.60,   // 60%
  10: 0.55,  // 55%
  11: 0.45,  // 45%
  12: 0.35,  // 35%
  13: 0.25,  // 25%
  14: 0.15,  // 15%
  15: 0.10   // 10%
};

/**
 * 强化失败惩罚
 * 正数：降级
 * 负数：损坏（需要修复）
 */
export const ENHANCE_FAIL_PENALTY: Record<number, number> = {
  1: 0,      // 不会失败
  2: 0,      // 不会降级
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: -1,     // +8 失败降 1 级
  9: -1,
  10: -2,    // +10 失败降 2 级
  11: -2,
  12: -3,    // +12 失败降 3 级
  13: -3,
  14: -5,    // +14 失败降 5 级
  15: -5     // +15 失败降 5 级
};

/**
 * 精炼成功率
 */
export const REFINEMENT_SUCCESS_RATES: Record<RefinementLevel, number> = {
  1: 1.00,   // 1 星→2 星：100%
  2: 0.80,   // 2 星→3 星：80%
  3: 0.60,   // 3 星→4 星：60%
  4: 0.40,   // 4 星→5 星：40%
  5: 0.00    // 已满级
};

/**
 * 宝石属性值
 */
export const GEM_VALUES: Record<GemQuality, number> = {
  [GemQuality.Common]: 10,
  [GemQuality.Rare]: 25,
  [GemQuality.Epic]: 50,
  [GemQuality.Legendary]: 100
};

/**
 * 宝石解锁等级
 */
export const SOCKET_UNLOCK_LEVELS = [0, 5, 10, 15];  // +0, +5, +10, +15 解锁宝石槽

// ==================== 强化系统 ====================

/**
 * 计算当前强化等级的成功率
 */
export function getEnhanceSuccessRate(currentLevel: number): number {
  const targetLevel = currentLevel + 1;
  return ENHANCE_SUCCESS_RATES[targetLevel] || 0;
}

/**
 * 计算强化消耗（金币）
 */
export function calculateEnhanceCost(currentLevel: number): number {
  const baseCost = 100;
  const multiplier = Math.pow(1.5, currentLevel);
  return Math.floor(baseCost * multiplier);
}

/**
 * 执行装备强化
 */
export function enhanceEquipment(
  state: EnhancementState,
  useProtection: boolean = false
): EnhancementResult {
  const { level, isLocked } = state;
  
  // 检查是否已满级
  if (level >= 15) {
    return {
      success: false,
      levelChanged: 0,
      isBroken: false,
      message: '装备已达到最高强化等级 (+15)'
    };
  }
  
  // 检查是否已损坏
  if (level <= -12) {
    return {
      success: false,
      levelChanged: 0,
      isBroken: true,
      message: '装备已完全损坏，需要修复'
    };
  }
  
  const successRate = getEnhanceSuccessRate(level);
  const roll = Math.random();
  const success = roll < successRate;
  
  if (success) {
    // 强化成功
    state.level = level + 1;
    state.exp = 0;
    
    return {
      success: true,
      levelChanged: 1,
      isBroken: false,
      message: `✨ 强化成功！当前等级：+${state.level}`
    };
  } else {
    // 强化失败
    let penalty = ENHANCE_FAIL_PENALTY[level + 1] || 0;
    
    // 使用保护符可以避免降级
    if (useProtection && penalty < 0) {
      penalty = 0;
      state.protectionUsed = true;
    }
    
    // 锁定状态可以避免降级
    if (isLocked && penalty < 0) {
      penalty = 0;
    }
    
    const newLevel = level + penalty;
    state.level = Math.max(-12, newLevel);
    state.exp = 0;
    
    const isBroken = state.level <= -12;
    
    return {
      success: false,
      levelChanged: penalty,
      isBroken,
      message: isBroken 
        ? '💔 强化失败！装备已损坏' 
        : `❌ 强化失败！当前等级：+${state.level}`
    };
  }
}

/**
 * 修复损坏的装备
 */
export function repairEquipment(state: EnhancementState, cost: number): boolean {
  if (state.level > -12) {
    return false; // 未损坏
  }
  
  // 修复后回到 0 强化
  state.level = 0;
  state.exp = 0;
  state.isLocked = false;
  
  return true;
}

/**
 * 获取修复费用
 */
export function getRepairCost(currentLevel: number): number {
  const damageLevel = Math.abs(currentLevel);
  return damageLevel * 500;
}

// ==================== 精炼系统 ====================

/**
 * 计算精炼消耗（精炼石）
 */
export function calculateRefinementCost(currentLevel: RefinementLevel): number {
  const costs = [0, 1, 3, 6, 10];  // 1→2: 1 个，2→3: 3 个，etc.
  return costs[currentLevel] || 0;
}

/**
 * 执行装备精炼
 */
export function refineEquipment(
  state: RefinementState,
  stones: number
): RefinementResult {
  const { level } = state;
  
  // 检查是否已满级
  if (level >= 5) {
    return {
      success: false,
      levelChanged: 0,
      message: '装备已达到最高精炼等级 (★★★★★)'
    };
  }
  
  const requiredStones = calculateRefinementCost(level);
  
  // 检查材料是否足够
  if (stones < requiredStones) {
    return {
      success: false,
      levelChanged: 0,
      message: `精炼石不足！需要 ${requiredStones} 个，当前 ${stones} 个`
    };
  }
  
  const successRate = REFINEMENT_SUCCESS_RATES[level];
  const roll = Math.random();
  const success = roll < successRate;
  
  if (success) {
    state.level = (level + 1) as RefinementLevel;
    state.exp = 0;
    
    return {
      success: true,
      levelChanged: 1,
      message: `✨ 精炼成功！当前等级：${'★'.repeat(state.level)}`
    };
  } else {
    return {
      success: false,
      levelChanged: 0,
      message: `❌ 精炼失败！精炼石已消耗`
    };
  }
}

/**
 * 获取精炼属性加成倍率
 */
export function getRefinementBonus(level: RefinementLevel): number {
  // 1★: 0% | 2★: 10% | 3★: 25% | 4★: 50% | 5★: 100%
  const bonuses = [0, 1.0, 1.1, 1.25, 1.5, 2.0];
  return bonuses[level] || 1.0;
}

// ==================== 宝石系统 ====================

/**
 * 生成随机宝石
 */
export function generateRandomGem(): Gem {
  const types = Object.values(GemType);
  const qualities = Object.values(GemQuality);
  
  // 品质概率
  const rand = Math.random();
  let quality = GemQuality.Common;
  if (rand > 0.99) quality = GemQuality.Legendary;
  else if (rand > 0.90) quality = GemQuality.Epic;
  else if (rand > 0.70) quality = GemQuality.Rare;
  
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    id: `gem_${type}_${quality}_${Date.now()}`,
    type,
    quality,
    value: GEM_VALUES[quality]
  };
}

/**
 * 初始化宝石槽
 */
export function initializeGemSockets(): GemSocket[] {
  return [
    { unlocked: true, gem: null },   // +0 解锁
    { unlocked: false, gem: null },  // +5 解锁
    { unlocked: false, gem: null },  // +10 解锁
    { unlocked: false, gem: null }   // +15 解锁
  ];
}

/**
 * 更新宝石槽解锁状态
 */
export function updateSocketUnlocks(
  sockets: GemSocket[],
  enhanceLevel: number
): void {
  sockets.forEach((socket, index) => {
    const requiredLevel = SOCKET_UNLOCK_LEVELS[index];
    socket.unlocked = enhanceLevel >= requiredLevel;
    
    // 如果解锁状态变为 false，移除宝石
    if (!socket.unlocked && socket.gem) {
      socket.gem = null;
    }
  });
}

/**
 * 镶嵌宝石
 */
export function installGem(
  sockets: GemSocket[],
  socketIndex: number,
  gem: Gem
): SocketResult {
  // 检查索引有效性
  if (socketIndex < 0 || socketIndex >= sockets.length) {
    return {
      success: false,
      gemInstalled: null,
      gemRemoved: null,
      message: '无效的宝石槽位置'
    };
  }
  
  const socket = sockets[socketIndex];
  
  // 检查是否解锁
  if (!socket.unlocked) {
    return {
      success: false,
      gemInstalled: null,
      gemRemoved: null,
      message: '宝石槽未解锁'
    };
  }
  
  // 检查是否已有宝石
  const removedGem = socket.gem;
  
  // 安装新宝石
  socket.gem = gem;
  
  return {
    success: true,
    gemInstalled: gem,
    gemRemoved: removedGem,
    message: removedGem 
      ? `✨ 宝石已更换：${getGemName(removedGem)} → ${getGemName(gem)}`
      : `✨ 宝石已镶嵌：${getGemName(gem)}`
  };
}

/**
 * 取下宝石
 */
export function removeGem(
  sockets: GemSocket[],
  socketIndex: number
): SocketResult {
  if (socketIndex < 0 || socketIndex >= sockets.length) {
    return {
      success: false,
      gemInstalled: null,
      gemRemoved: null,
      message: '无效的宝石槽位置'
    };
  }
  
  const socket = sockets[socketIndex];
  const removedGem = socket.gem;
  
  if (!removedGem) {
    return {
      success: false,
      gemInstalled: null,
      gemRemoved: null,
      message: '宝石槽为空'
    };
  }
  
  socket.gem = null;
  
  return {
    success: true,
    gemInstalled: null,
    gemRemoved: removedGem,
    message: `💎 宝石已取下：${getGemName(removedGem)}`
  };
}

/**
 * 获取宝石名称
 */
export function getGemName(gem: Gem): string {
  const typeNames: Record<GemType, string> = {
    [GemType.Attack]: '红宝石',
    [GemType.Defense]: '蓝宝石',
    [GemType.HP]: '绿宝石',
    [GemType.Speed]: '黄宝石',
    [GemType.Critical]: '紫宝石'
  };
  
  const qualityNames: Record<GemQuality, string> = {
    [GemQuality.Common]: '普通',
    [GemQuality.Rare]: '稀有',
    [GemQuality.Epic]: '史诗',
    [GemQuality.Legendary]: '传说'
  };
  
  return `${qualityNames[gem.quality]}${typeNames[gem.type]}`;
}

/**
 * 计算宝石总属性加成
 */
export function calculateGemBonus(sockets: GemSocket[]): Record<string, number> {
  const bonus: Record<string, number> = {
    attack: 0,
    defense: 0,
    hp: 0,
    speed: 0,
    critical: 0
  };
  
  sockets.forEach(socket => {
    if (socket.gem) {
      const { type, value } = socket.gem;
      bonus[type] = (bonus[type] || 0) + value;
    }
  });
  
  return bonus;
}

// ==================== 综合属性计算 ====================

/**
 * 计算装备最终属性
 */
export function calculateFinalStats(
  baseStats: Record<string, number>,
  enhanceLevel: number,
  refinementLevel: RefinementLevel,
  gemBonus: Record<string, number>
): Record<string, number> {
  const refinementBonus = getRefinementBonus(refinementLevel);
  const enhanceBonus = 1 + (enhanceLevel * 0.05);  // 每级 +5%
  
  const final: Record<string, number> = {};
  
  for (const [stat, value] of Object.entries(baseStats)) {
    // 基础属性 × 精炼加成 × 强化加成 + 宝石加成
    final[stat] = Math.floor(value * refinementBonus * enhanceBonus) + (gemBonus[stat] || 0);
  }
  
  return final;
}

/**
 * 获取强化等级显示文本
 */
export function getEnhanceDisplayText(level: number): string {
  if (level > 0) return `+${level}`;
  if (level === 0) return '+0';
  return `${level}`;  // 负数显示为 -1, -2, etc.
}

/**
 * 获取强化等级颜色
 */
export function getEnhanceColor(level: number): string {
  if (level >= 15) return '#ff6b6b';      // 红色 - 传说
  if (level >= 10) return '#f59f00';      // 橙色 - 史诗
  if (level >= 5) return '#4dabf7';       // 蓝色 - 稀有
  if (level >= 0) return '#51cf66';       // 绿色 - 普通
  return '#868e96';                        // 灰色 - 损坏
}
