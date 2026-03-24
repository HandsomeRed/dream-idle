// 幸运轮盘系统 - v0.63
// Lucky Wheel / 每日抽奖转盘

/**
 * 奖品稀有度
 */
export type PrizeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * 奖品类型
 */
export type PrizeType = 'gold' | 'diamond' | 'exp' | 'stamina' | 'summonTicket' | 'equipBox' | 'petShard' | 'heroShard' | 'skillBook' | 'vipExp';

/**
 * 奖品配置
 */
export interface PrizeConfig {
  id: string;
  name: string;
  type: PrizeType;
  amount: number;
  rarity: PrizeRarity;
  weight: number; // 权重（越高越容易中）
  icon: string;
}

/**
 * 轮盘配置
 */
export interface WheelConfig {
  id: string;
  name: string;
  prizes: PrizeConfig[];
  spinCost: { type: 'gold' | 'diamond' | 'free'; amount: number };
  dailyFreeSpins: number;
  maxDailySpins: number;
}

/**
 * 抽奖记录
 */
export interface SpinRecord {
  timestamp: number;
  wheelId: string;
  prizeId: string;
  prizeName: string;
  prizeRarity: PrizeRarity;
  isFree: boolean;
}

/**
 * 轮盘状态
 */
export interface WheelState {
  playerId: string;
  dailyFreeSpinsUsed: number;
  dailyPaidSpinsUsed: number;
  totalSpins: number;
  lastSpinTime: number;
  lastResetDate: string; // YYYY-MM-DD
  luckyValue: number; // 幸运值（保底机制）
  history: SpinRecord[];
  /** 累计奖励统计 */
  totalRewards: Record<PrizeType, number>;
}

// ==================== 奖品池配置 ====================

export const PRIZE_POOL: PrizeConfig[] = [
  // 普通奖品 (60%)
  { id: 'prize_gold_s', name: '金币×500', type: 'gold', amount: 500, rarity: 'common', weight: 200, icon: '🪙' },
  { id: 'prize_gold_m', name: '金币×2000', type: 'gold', amount: 2000, rarity: 'common', weight: 150, icon: '🪙' },
  { id: 'prize_exp_s', name: '经验×300', type: 'exp', amount: 300, rarity: 'common', weight: 150, icon: '✨' },
  { id: 'prize_stamina_s', name: '体力×20', type: 'stamina', amount: 20, rarity: 'common', weight: 100, icon: '⚡' },

  // 优良奖品 (25%)
  { id: 'prize_gold_l', name: '金币×5000', type: 'gold', amount: 5000, rarity: 'uncommon', weight: 80, icon: '💰' },
  { id: 'prize_exp_m', name: '经验×1000', type: 'exp', amount: 1000, rarity: 'uncommon', weight: 70, icon: '🌟' },
  { id: 'prize_stamina_m', name: '体力×50', type: 'stamina', amount: 50, rarity: 'uncommon', weight: 60, icon: '⚡' },
  { id: 'prize_vip_s', name: 'VIP经验×100', type: 'vipExp', amount: 100, rarity: 'uncommon', weight: 40, icon: '👑' },

  // 稀有奖品 (10%)
  { id: 'prize_diamond_s', name: '钻石×20', type: 'diamond', amount: 20, rarity: 'rare', weight: 35, icon: '💎' },
  { id: 'prize_summon_1', name: '召唤券×1', type: 'summonTicket', amount: 1, rarity: 'rare', weight: 30, icon: '🎫' },
  { id: 'prize_skillbook', name: '技能书×1', type: 'skillBook', amount: 1, rarity: 'rare', weight: 25, icon: '📖' },
  { id: 'prize_equip_box', name: '装备宝箱×1', type: 'equipBox', amount: 1, rarity: 'rare', weight: 10, icon: '📦' },

  // 史诗奖品 (4%)
  { id: 'prize_diamond_m', name: '钻石×100', type: 'diamond', amount: 100, rarity: 'epic', weight: 15, icon: '💎' },
  { id: 'prize_summon_3', name: '召唤券×3', type: 'summonTicket', amount: 3, rarity: 'epic', weight: 12, icon: '🎟️' },
  { id: 'prize_pet_shard', name: '宠物碎片×10', type: 'petShard', amount: 10, rarity: 'epic', weight: 8, icon: '🐾' },

  // 传说奖品 (1%)
  { id: 'prize_diamond_l', name: '钻石×500', type: 'diamond', amount: 500, rarity: 'legendary', weight: 5, icon: '💎' },
  { id: 'prize_hero_shard', name: '英雄碎片×20', type: 'heroShard', amount: 20, rarity: 'legendary', weight: 3, icon: '⭐' },
  { id: 'prize_summon_10', name: '召唤券×10', type: 'summonTicket', amount: 10, rarity: 'legendary', weight: 2, icon: '🎪' },
];

// ==================== 轮盘配置 ====================

export const WHEEL_CONFIGS: Record<string, WheelConfig> = {
  daily_wheel: {
    id: 'daily_wheel',
    name: '每日转盘',
    prizes: PRIZE_POOL,
    spinCost: { type: 'diamond', amount: 50 },
    dailyFreeSpins: 3,
    maxDailySpins: 20,
  },
};

export const LUCKY_THRESHOLDS = {
  /** 累计抽奖次数达到此值，保底出稀有+ */
  rareGuarantee: 10,
  /** 累计抽奖次数达到此值，保底出史诗+ */
  epicGuarantee: 30,
  /** 累计抽奖次数达到此值，保底出传说 */
  legendaryGuarantee: 100,
};

export const RARITY_ORDER: Record<PrizeRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export const RARITY_COLORS: Record<PrizeRarity, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
};

export const RARITY_NAMES: Record<PrizeRarity, string> = {
  common: '普通',
  uncommon: '优良',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

// ==================== 工具函数 ====================

/**
 * 获取今天的日期字符串
 */
export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 创建初始轮盘状态
 */
export function createWheelState(playerId: string): WheelState {
  return {
    playerId,
    dailyFreeSpinsUsed: 0,
    dailyPaidSpinsUsed: 0,
    totalSpins: 0,
    lastSpinTime: 0,
    lastResetDate: getTodayStr(),
    luckyValue: 0,
    history: [],
    totalRewards: {
      gold: 0,
      diamond: 0,
      exp: 0,
      stamina: 0,
      summonTicket: 0,
      equipBox: 0,
      petShard: 0,
      heroShard: 0,
      skillBook: 0,
      vipExp: 0,
    },
  };
}

/**
 * 检查是否需要每日重置
 */
export function needsDailyReset(state: WheelState, now?: number): boolean {
  return getTodayStr(now) !== state.lastResetDate;
}

/**
 * 执行每日重置
 */
export function resetDaily(state: WheelState, now?: number): WheelState {
  return {
    ...state,
    dailyFreeSpinsUsed: 0,
    dailyPaidSpinsUsed: 0,
    lastResetDate: getTodayStr(now),
  };
}

/**
 * 获取剩余免费次数
 */
export function getFreeSpinsLeft(state: WheelState, wheelId: string): number {
  const config = WHEEL_CONFIGS[wheelId];
  if (!config) return 0;
  return Math.max(0, config.dailyFreeSpins - state.dailyFreeSpinsUsed);
}

/**
 * 获取今日已用次数
 */
export function getDailySpinsUsed(state: WheelState): number {
  return state.dailyFreeSpinsUsed + state.dailyPaidSpinsUsed;
}

/**
 * 获取今日剩余次数
 */
export function getDailySpinsLeft(state: WheelState, wheelId: string): number {
  const config = WHEEL_CONFIGS[wheelId];
  if (!config) return 0;
  return Math.max(0, config.maxDailySpins - getDailySpinsUsed(state));
}

/**
 * 检查是否可以转盘
 */
export function canSpin(state: WheelState, wheelId: string, playerDiamonds: number): { canSpin: boolean; isFree: boolean; cost: number; reason?: string } {
  const config = WHEEL_CONFIGS[wheelId];
  if (!config) return { canSpin: false, isFree: false, cost: 0, reason: '轮盘不存在' };

  const dailyLeft = getDailySpinsLeft(state, wheelId);
  if (dailyLeft <= 0) return { canSpin: false, isFree: false, cost: 0, reason: '今日次数已用完' };

  const freeLeft = getFreeSpinsLeft(state, wheelId);
  if (freeLeft > 0) {
    return { canSpin: true, isFree: true, cost: 0 };
  }

  // 需要付费
  if (config.spinCost.type === 'diamond' && playerDiamonds < config.spinCost.amount) {
    return { canSpin: false, isFree: false, cost: config.spinCost.amount, reason: `钻石不足（需要${config.spinCost.amount}）` };
  }

  return { canSpin: true, isFree: false, cost: config.spinCost.amount };
}

/**
 * 根据权重选择奖品（支持保底）
 */
export function selectPrize(prizes: PrizeConfig[], luckyValue: number, rng?: () => number): PrizeConfig {
  const rand = rng ?? Math.random;

  // 保底检测
  let minRarity: PrizeRarity = 'common';
  if (luckyValue >= LUCKY_THRESHOLDS.legendaryGuarantee) {
    minRarity = 'legendary';
  } else if (luckyValue >= LUCKY_THRESHOLDS.epicGuarantee) {
    minRarity = 'epic';
  } else if (luckyValue >= LUCKY_THRESHOLDS.rareGuarantee) {
    minRarity = 'rare';
  }

  // 过滤满足最低稀有度的奖品
  const eligible = prizes.filter(p => RARITY_ORDER[p.rarity] >= RARITY_ORDER[minRarity]);
  const pool = eligible.length > 0 ? eligible : prizes;

  // 权重抽取
  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let roll = rand() * totalWeight;

  for (const prize of pool) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }

  return pool[pool.length - 1]; // fallback
}

/**
 * 执行一次抽奖
 */
export function spin(
  state: WheelState,
  wheelId: string,
  playerDiamonds: number,
  rng?: () => number,
  now?: number
): { state: WheelState; prize: PrizeConfig | null; isFree: boolean; diamondCost: number; error?: string } {
  const check = canSpin(state, wheelId, playerDiamonds);
  if (!check.canSpin) {
    return { state, prize: null, isFree: false, diamondCost: 0, error: check.reason };
  }

  const config = WHEEL_CONFIGS[wheelId];
  const prize = selectPrize(config.prizes, state.luckyValue, rng);

  const newState = { ...state };

  // 更新次数
  if (check.isFree) {
    newState.dailyFreeSpinsUsed++;
  } else {
    newState.dailyPaidSpinsUsed++;
  }
  newState.totalSpins++;
  newState.lastSpinTime = now ?? Date.now();

  // 更新幸运值（保底）
  if (RARITY_ORDER[prize.rarity] >= RARITY_ORDER['rare']) {
    newState.luckyValue = 0; // 抽到稀有+重置
  } else {
    newState.luckyValue++;
  }

  // 记录历史（保留最近 50 条）
  const record: SpinRecord = {
    timestamp: newState.lastSpinTime,
    wheelId,
    prizeId: prize.id,
    prizeName: prize.name,
    prizeRarity: prize.rarity,
    isFree: check.isFree,
  };
  newState.history = [record, ...state.history].slice(0, 50);

  // 累计奖励统计
  newState.totalRewards = { ...state.totalRewards };
  newState.totalRewards[prize.type] = (newState.totalRewards[prize.type] || 0) + prize.amount;

  return {
    state: newState,
    prize,
    isFree: check.isFree,
    diamondCost: check.isFree ? 0 : check.cost,
  };
}

/**
 * 批量抽奖（连抽）
 */
export function spinMultiple(
  state: WheelState,
  wheelId: string,
  count: number,
  playerDiamonds: number,
  rng?: () => number,
  now?: number
): { state: WheelState; results: { prize: PrizeConfig; isFree: boolean }[]; totalDiamondCost: number; errors: string[] } {
  let currentState = state;
  let diamonds = playerDiamonds;
  const results: { prize: PrizeConfig; isFree: boolean }[] = [];
  const errors: string[] = [];
  let totalDiamondCost = 0;

  for (let i = 0; i < count; i++) {
    const result = spin(currentState, wheelId, diamonds, rng, now);
    if (result.error) {
      errors.push(result.error);
      break;
    }
    currentState = result.state;
    diamonds -= result.diamondCost;
    totalDiamondCost += result.diamondCost;
    results.push({ prize: result.prize!, isFree: result.isFree });
  }

  return { state: currentState, results, totalDiamondCost, errors };
}

/**
 * 获取轮盘统计信息
 */
export function getWheelStats(state: WheelState, wheelId: string): {
  totalSpins: number;
  dailyFreeLeft: number;
  dailyTotalLeft: number;
  luckyValue: number;
  nextGuarantee: { type: string; spinsLeft: number } | null;
  rarityDistribution: Record<PrizeRarity, number>;
} {
  const dailyFreeLeft = getFreeSpinsLeft(state, wheelId);
  const dailyTotalLeft = getDailySpinsLeft(state, wheelId);

  // 计算稀有度分布
  const rarityDistribution: Record<PrizeRarity, number> = {
    common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0,
  };
  for (const record of state.history) {
    rarityDistribution[record.prizeRarity]++;
  }

  // 下一个保底
  let nextGuarantee: { type: string; spinsLeft: number } | null = null;
  if (state.luckyValue < LUCKY_THRESHOLDS.rareGuarantee) {
    nextGuarantee = { type: '稀有', spinsLeft: LUCKY_THRESHOLDS.rareGuarantee - state.luckyValue };
  } else if (state.luckyValue < LUCKY_THRESHOLDS.epicGuarantee) {
    nextGuarantee = { type: '史诗', spinsLeft: LUCKY_THRESHOLDS.epicGuarantee - state.luckyValue };
  } else if (state.luckyValue < LUCKY_THRESHOLDS.legendaryGuarantee) {
    nextGuarantee = { type: '传说', spinsLeft: LUCKY_THRESHOLDS.legendaryGuarantee - state.luckyValue };
  }

  return {
    totalSpins: state.totalSpins,
    dailyFreeLeft,
    dailyTotalLeft,
    luckyValue: state.luckyValue,
    nextGuarantee,
    rarityDistribution,
  };
}

/**
 * 获取稀有度颜色
 */
export function getRarityColor(rarity: PrizeRarity): string {
  return RARITY_COLORS[rarity];
}

/**
 * 获取稀有度名称
 */
export function getRarityName(rarity: PrizeRarity): string {
  return RARITY_NAMES[rarity];
}

/**
 * 导出数据
 */
export function exportWheelData(state: WheelState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importWheelData(json: string): WheelState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || typeof data.totalSpins !== 'number') return null;
    return data as WheelState;
  } catch {
    return null;
  }
}
