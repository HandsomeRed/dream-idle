/**
 * Dungeon System - v0.29
 * 副本系统：每日副本、难度选择、掉落奖励、扫荡功能
 */

// ==================== 枚举和类型定义 ====================

/**
 * 副本难度
 */
export enum DungeonDifficulty {
  Easy = 'easy',       // 普通
  Normal = 'normal',   // 困难
  Hard = 'hard',       // 地狱
}

/**
 * 副本类型
 */
export enum DungeonType {
  Gold = 'gold',       // 金币副本
  Exp = 'exp',         // 经验副本
  Equipment = 'equipment', // 装备副本
  Material = 'material',   // 材料副本
  Pet = 'pet',         // 宠物碎片副本
}

/**
 * 副本奖励类型
 */
export enum RewardType {
  Gold = 'gold',
  Exp = 'exp',
  Equipment = 'equipment',
  Material = 'material',
  PetFragment = 'pet_fragment',
  Diamond = 'diamond',
}

/**
 * 副本奖励
 */
export interface DungeonReward {
  type: RewardType;
  amount: number;
  item?: string;  // 物品 ID（装备/材料）
  quality?: number;  // 品质（1-5 星）
}

/**
 * 副本定义
 */
export interface Dungeon {
  id: string;
  name: string;
  type: DungeonType;
  difficulty: DungeonDifficulty;
  requiredLevel: number;  // 进入等级要求
  staminaCost: number;    // 体力消耗
  recommendedPower: number;  // 推荐战力
  baseRewards: DungeonReward[];
  firstClearReward?: DungeonReward;  // 首通奖励
  dropRates: DropRate[];
}

/**
 * 掉落概率
 */
export interface DropRate {
  item: string;
  type: RewardType;
  chance: number;  // 0-1
  minAmount?: number;
  maxAmount?: number;
  quality?: number;
}

/**
 * 玩家副本进度
 */
export interface DungeonProgress {
  dungeonId: string;
  stars: number;  // 星级评价（0-3）
  bestTime?: number;  // 最快通关时间（秒）
  clearedAt?: number;  // 通关时间戳
  firstClearRewardClaimed: boolean;  // 首通奖励是否已领取
}

/**
 * 玩家副本状态
 */
export interface DungeonState {
  stamina: number;  // 当前体力
  maxStamina: number;  // 最大体力
  staminaRecoverRate: number;  // 体力恢复速率（每分钟）
  dailyAttempts: number;  // 剩余每日挑战次数
  maxDailyAttempts: number;  // 每日最大挑战次数
  progresses: DungeonProgress[];
  sweepTickets: number;  // 扫荡券数量
}

/**
 * 副本挑战结果
 */
export interface DungeonChallengeResult {
  success: boolean;
  rewards: DungeonReward[];
  firstClearBonus?: DungeonReward;
  stars: number;
  timeUsed?: number;  // 用时（秒）
  message: string;
}

/**
 * 扫荡结果
 */
export interface SweepResult {
  success: boolean;
  totalRewards: DungeonReward[];
  times: number;
  message: string;
}

// ==================== 常量配置 ====================

/**
 * 基础奖励配置
 */
export const BASE_REWARDS: Record<DungeonType, Record<DungeonDifficulty, DungeonReward[]>> = {
  [DungeonType.Gold]: {
    [DungeonDifficulty.Easy]: [{ type: RewardType.Gold, amount: 1000 }],
    [DungeonDifficulty.Normal]: [{ type: RewardType.Gold, amount: 3000 }],
    [DungeonDifficulty.Hard]: [{ type: RewardType.Gold, amount: 8000 }],
  },
  [DungeonType.Exp]: {
    [DungeonDifficulty.Easy]: [{ type: RewardType.Exp, amount: 500 }],
    [DungeonDifficulty.Normal]: [{ type: RewardType.Exp, amount: 1500 }],
    [DungeonDifficulty.Hard]: [{ type: RewardType.Exp, amount: 4000 }],
  },
  [DungeonType.Equipment]: {
    [DungeonDifficulty.Easy]: [{ type: RewardType.Equipment, amount: 1, quality: 1 }],
    [DungeonDifficulty.Normal]: [{ type: RewardType.Equipment, amount: 2, quality: 2 }],
    [DungeonDifficulty.Hard]: [{ type: RewardType.Equipment, amount: 3, quality: 3 }],
  },
  [DungeonType.Material]: {
    [DungeonDifficulty.Easy]: [{ type: RewardType.Material, amount: 5 }],
    [DungeonDifficulty.Normal]: [{ type: RewardType.Material, amount: 15 }],
    [DungeonDifficulty.Hard]: [{ type: RewardType.Material, amount: 40 }],
  },
  [DungeonType.Pet]: {
    [DungeonDifficulty.Easy]: [{ type: RewardType.PetFragment, amount: 3 }],
    [DungeonDifficulty.Normal]: [{ type: RewardType.PetFragment, amount: 10 }],
    [DungeonDifficulty.Hard]: [{ type: RewardType.PetFragment, amount: 25 }],
  },
};

/**
 * 体力消耗配置
 */
export const STAMINA_COSTS: Record<DungeonDifficulty, number> = {
  [DungeonDifficulty.Easy]: 5,
  [DungeonDifficulty.Normal]: 10,
  [DungeonDifficulty.Hard]: 15,
};

/**
 * 推荐战力配置
 */
export const RECOMMENDED_POWER: Record<DungeonDifficulty, number> = {
  [DungeonDifficulty.Easy]: 500,
  [DungeonDifficulty.Normal]: 2000,
  [DungeonDifficulty.Hard]: 5000,
};

/**
 * 每日挑战次数
 */
export const MAX_DAILY_ATTEMPTS = 10;

/**
 * 体力上限
 */
export const MAX_STAMINA = 100;

/**
 * 体力恢复速率（每分钟）
 */
export const STAMINA_RECOVER_RATE = 1;

/**
 * 首通奖励配置
 */
export const FIRST_CLEAR_REWARDS: Record<DungeonDifficulty, DungeonReward> = {
  [DungeonDifficulty.Easy]: { type: RewardType.Diamond, amount: 50 },
  [DungeonDifficulty.Normal]: { type: RewardType.Diamond, amount: 100 },
  [DungeonDifficulty.Hard]: { type: RewardType.Diamond, amount: 200 },
};

/**
 * 星级评价标准（根据战力比）
 */
export const STAR_RATIOS = {
  1: 0.5,   // 战力达到推荐 50% → 1 星
  2: 0.8,   // 战力达到推荐 80% → 2 星
  3: 1.0,   // 战力达到推荐 100% → 3 星
};

// ==================== 副本数据 ====================

/**
 * 生成副本列表
 */
export function generateDungeons(): Dungeon[] {
  const dungeons: Dungeon[] = [];
  
  const types = Object.values(DungeonType);
  const difficulties = Object.values(DungeonDifficulty);
  
  let id = 1;
  types.forEach(type => {
    difficulties.forEach(difficulty => {
      const levelReq = difficulty === DungeonDifficulty.Easy ? 10 :
                       difficulty === DungeonDifficulty.Normal ? 30 : 50;
      
      dungeons.push({
        id: `dungeon_${type}_${difficulty}`,
        name: `${getDungeonTypeName(type)} - ${getDifficultyName(difficulty)}`,
        type,
        difficulty,
        requiredLevel: levelReq,
        staminaCost: STAMINA_COSTS[difficulty],
        recommendedPower: RECOMMENDED_POWER[difficulty],
        baseRewards: BASE_REWARDS[type][difficulty],
        firstClearReward: FIRST_CLEAR_REWARDS[difficulty],
        dropRates: generateDropRates(type, difficulty),
      });
      id++;
    });
  });
  
  return dungeons;
}

/**
 * 生成掉落表
 */
function generateDropRates(type: DungeonType, difficulty: DungeonDifficulty): DropRate[] {
  const baseChance = difficulty === DungeonDifficulty.Easy ? 0.1 :
                     difficulty === DungeonDifficulty.Normal ? 0.2 : 0.3;
  
  const drops: DropRate[] = [];
  
  // 根据副本类型添加特殊掉落
  if (type === DungeonType.Equipment) {
    drops.push({
      item: 'rare_equipment',
      type: RewardType.Equipment,
      chance: baseChance,
      quality: 3,
      minAmount: 1,
      maxAmount: 1,
    });
  }
  
  if (type === DungeonType.Pet) {
    drops.push({
      item: 'epic_pet_fragment',
      type: RewardType.PetFragment,
      chance: baseChance * 0.5,
      minAmount: 5,
      maxAmount: 10,
    });
  }
  
  if (type === DungeonType.Material) {
    drops.push({
      item: 'rare_material',
      type: RewardType.Material,
      chance: baseChance * 0.3,
      minAmount: 1,
      maxAmount: 3,
    });
  }
  
  return drops;
}

/**
 * 获取副本类型名称
 */
function getDungeonTypeName(type: DungeonType): string {
  const names: Record<DungeonType, string> = {
    [DungeonType.Gold]: '金币副本',
    [DungeonType.Exp]: '经验副本',
    [DungeonType.Equipment]: '装备副本',
    [DungeonType.Material]: '材料副本',
    [DungeonType.Pet]: '宠物副本',
  };
  return names[type];
}

/**
 * 获取难度名称
 */
function getDifficultyName(difficulty: DungeonDifficulty): string {
  const names: Record<DungeonDifficulty, string> = {
    [DungeonDifficulty.Easy]: '普通',
    [DungeonDifficulty.Normal]: '困难',
    [DungeonDifficulty.Hard]: '地狱',
  };
  return names[difficulty];
}

// ==================== 体力系统 ====================

/**
 * 恢复体力
 */
export function recoverStamina(state: DungeonState, minutes: number): void {
  const recover = Math.min(
    minutes * state.staminaRecoverRate,
    state.maxStamina - state.stamina
  );
  state.stamina += recover;
}

/**
 * 检查体力是否足够
 */
export function checkStamina(state: DungeonState, cost: number): boolean {
  return state.stamina >= cost;
}

/**
 * 消耗体力
 */
export function consumeStamina(state: DungeonState, cost: number): boolean {
  if (!checkStamina(state, cost)) {
    return false;
  }
  state.stamina -= cost;
  return true;
}

// ==================== 每日挑战次数系统 ====================

/**
 * 检查挑战次数
 */
export function checkDailyAttempts(state: DungeonState): boolean {
  return state.dailyAttempts > 0;
}

/**
 * 消耗挑战次数
 */
export function consumeDailyAttempt(state: DungeonState): boolean {
  if (!checkDailyAttempts(state)) {
    return false;
  }
  state.dailyAttempts--;
  return true;
}

/**
 * 重置每日挑战次数（每日凌晨 5 点）
 */
export function resetDailyAttempts(state: DungeonState): void {
  state.dailyAttempts = state.maxDailyAttempts;
}

// ==================== 副本挑战 ====================

/**
 * 计算胜率（基于战力比）
 */
export function calculateWinRate(playerPower: number, recommendedPower: number): number {
  const ratio = playerPower / recommendedPower;
  
  // 战力低于 30% 几乎不可能赢
  if (ratio < 0.3) return 0.05;
  
  // 战力达到推荐值 90% 以上必胜
  if (ratio >= 0.9) return 1.0;
  
  // 线性插值
  return 0.05 + (ratio - 0.3) * (0.95 / 0.6);
}

/**
 * 计算星级评价
 */
export function calculateStars(playerPower: number, recommendedPower: number): number {
  const ratio = playerPower / recommendedPower;
  
  if (ratio >= STAR_RATIOS[3]) return 3;
  if (ratio >= STAR_RATIOS[2]) return 2;
  if (ratio >= STAR_RATIOS[1]) return 1;
  return 0;
}

/**
 * 生成奖励
 */
export function generateRewards(
  baseRewards: DungeonReward[],
  dropRates: DropRate[],
  stars: number
): DungeonReward[] {
  // 深拷贝基础奖励，避免修改原数组
  const rewards = baseRewards.map(r => ({ ...r }));
  
  // 星级加成（3 星额外 +50% 奖励）
  const bonusMultiplier = 1 + (stars - 1) * 0.25;
  
  rewards.forEach(reward => {
    reward.amount = Math.floor(reward.amount * bonusMultiplier);
  });
  
  // 随机掉落
  dropRates.forEach(drop => {
    if (Math.random() < drop.chance) {
      const amount = drop.maxAmount 
        ? Math.floor(Math.random() * (drop.maxAmount - drop.minAmount! + 1)) + drop.minAmount!
        : 1;
      
      rewards.push({
        type: drop.type,
        amount,
        item: drop.item,
        quality: drop.quality,
      });
    }
  });
  
  return rewards;
}

/**
 * 挑战副本
 */
export function challengeDungeon(
  state: DungeonState,
  dungeon: Dungeon,
  playerPower: number,
  playerLevel: number
): DungeonChallengeResult {
  // 检查等级要求
  if (playerLevel < dungeon.requiredLevel) {
    return {
      success: false,
      rewards: [],
      stars: 0,
      message: `等级不足！需要 Lv.${dungeon.requiredLevel}`,
    };
  }
  
  // 检查体力
  if (!consumeStamina(state, dungeon.staminaCost)) {
    return {
      success: false,
      rewards: [],
      stars: 0,
      message: `体力不足！需要 ${dungeon.staminaCost} 点`,
    };
  }
  
  // 检查每日次数
  if (!consumeDailyAttempt(state)) {
    // 返还体力
    state.stamina += dungeon.staminaCost;
    return {
      success: false,
      rewards: [],
      stars: 0,
      message: '每日挑战次数已用完',
    };
  }
  
  // 计算胜率
  const winRate = calculateWinRate(playerPower, dungeon.recommendedPower);
  const roll = Math.random();
  const success = roll < winRate;
  
  if (success) {
    // 计算星级
    const stars = calculateStars(playerPower, dungeon.recommendedPower);
    
    // 生成奖励
    const rewards = generateRewards(dungeon.baseRewards, dungeon.dropRates, stars);
    
    // 检查首通奖励
    let firstClearBonus: DungeonReward | undefined;
    const progress = state.progresses.find(p => p.dungeonId === dungeon.id);
    
    if (!progress || !progress.firstClearRewardClaimed) {
      firstClearBonus = dungeon.firstClearReward;
      if (firstClearBonus) {
        rewards.push(firstClearBonus);
      }
      
      // 标记首通奖励已领取
      if (!progress) {
        state.progresses.push({
          dungeonId: dungeon.id,
          stars,
          firstClearRewardClaimed: true,
          clearedAt: Date.now(),
        });
      } else {
        progress.firstClearRewardClaimed = true;
      }
    }
    
    // 更新最佳星级
    if (progress && stars > progress.stars) {
      progress.stars = stars;
    }
    
    return {
      success: true,
      rewards,
      firstClearBonus,
      stars,
      message: `🎉 挑战成功！获得 ${stars} 星评价`,
    };
  } else {
    return {
      success: false,
      rewards: [],
      stars: 0,
      message: '❌ 挑战失败',
    };
  }
}

// ==================== 扫荡系统 ====================

/**
 * 检查是否可以扫荡
 */
export function canSweep(
  state: DungeonState,
  dungeon: Dungeon,
  playerLevel: number
): { can: boolean; reason?: string } {
  // 检查是否已通关
  const progress = state.progresses.find(p => p.dungeonId === dungeon.id);
  if (!progress || progress.stars < 3) {
    return { can: false, reason: '需要 3 星通关才能扫荡' };
  }
  
  // 检查等级
  if (playerLevel < dungeon.requiredLevel) {
    return { can: false, reason: `等级不足！需要 Lv.${dungeon.requiredLevel}` };
  }
  
  // 检查扫荡券
  if (state.sweepTickets < 1) {
    return { can: false, reason: '扫荡券不足' };
  }
  
  return { can: true };
}

/**
 * 扫荡副本
 */
export function sweepDungeon(
  state: DungeonState,
  dungeon: Dungeon,
  times: number = 1
): SweepResult {
  // 检查扫荡条件
  const { can, reason } = canSweep(state, dungeon, 999);  // 等级检查在外部处理
  if (!can) {
    return {
      success: false,
      totalRewards: [],
      times: 0,
      message: reason || '无法扫荡',
    };
  }
  
  // 检查扫荡券
  const actualTimes = Math.min(times, state.sweepTickets, state.dailyAttempts);
  
  if (actualTimes < 1) {
    return {
      success: false,
      totalRewards: [],
      times: 0,
      message: '扫荡券或挑战次数不足',
    };
  }
  
  const totalRewards: DungeonReward[] = [];
  
  // 执行扫荡
  for (let i = 0; i < actualTimes; i++) {
    state.sweepTickets--;
    state.dailyAttempts--;
    
    // 生成奖励（扫荡固定 3 星）
    const rewards = generateRewards(dungeon.baseRewards, dungeon.dropRates, 3);
    totalRewards.push(...rewards);
  }
  
  return {
    success: true,
    totalRewards,
    times: actualTimes,
    message: `✨ 扫荡完成！共 ${actualTimes} 次`,
  };
}

/**
 * 领取首通奖励
 */
export function claimFirstClearReward(
  state: DungeonState,
  dungeon: Dungeon
): { success: boolean; reward?: DungeonReward; message: string } {
  const progress = state.progresses.find(p => p.dungeonId === dungeon.id);
  
  if (!progress) {
    return {
      success: false,
      message: '尚未通关该副本',
    };
  }
  
  if (progress.firstClearRewardClaimed) {
    return {
      success: false,
      message: '首通奖励已领取',
    };
  }
  
  progress.firstClearRewardClaimed = true;
  
  return {
    success: true,
    reward: dungeon.firstClearReward,
    message: '🎉 首通奖励已领取',
  };
}

/**
 * 获取副本进度
 */
export function getDungeonProgress(
  state: DungeonState,
  dungeonId: string
): DungeonProgress | undefined {
  return state.progresses.find(p => p.dungeonId === dungeonId);
}

/**
 * 统计通关副本数量
 */
export function countClearedDungeons(state: DungeonState): number {
  return state.progresses.filter(p => p.stars > 0).length;
}

/**
 * 统计 3 星通关数量
 */
export function countThreeStarDungeons(state: DungeonState): number {
  return state.progresses.filter(p => p.stars >= 3).length;
}

/**
 * 初始化副本状态
 */
export function initializeDungeonState(): DungeonState {
  return {
    stamina: MAX_STAMINA,
    maxStamina: MAX_STAMINA,
    staminaRecoverRate: STAMINA_RECOVER_RATE,
    dailyAttempts: MAX_DAILY_ATTEMPTS,
    maxDailyAttempts: MAX_DAILY_ATTEMPTS,
    progresses: [],
    sweepTickets: 10,
  };
}
