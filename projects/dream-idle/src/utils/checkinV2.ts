// 签到系统 v2 - v0.78
// Check-in System Extended - 累计签到/补签/月度奖励/特殊日期

/**
 * 奖励物品
 */
export interface RewardItem {
  type: 'gold' | 'diamond' | 'exp' | 'stamina' | 'petFood' | 'petShard' | 'equipBox' | 'material' | 'artifact' | 'title' | 'summonTicket';
  amount: number;
  name: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 签到奖励配置
 */
export interface CheckinReward {
  day: number;
  rewards: RewardItem[];
  isSpecial: boolean;
  specialName?: string;
}

/**
 * 月度签到配置
 */
export interface MonthlyCheckinConfig {
  month: number; // 1-12
  rewards: CheckinReward[];
  bonusDays: number[]; // 额外奖励日期
}

/**
 * 签到记录
 */
export interface CheckinRecord {
  date: string; // YYYY-MM-DD
  timestamp: number;
  isMakeup: boolean; // 是否补签
}

/**
 * 签到系统状态
 */
export interface CheckinState {
  playerId: string;
  /** 当前月份 */
  currentMonth: string; // YYYY-MM
  /** 本月已签到天数 */
  checkedInDays: number;
  /** 累计签到天数 */
  totalCheckins: number;
  /** 连续签到天数 */
  streak: number;
  /** 最大连续签到 */
  maxStreak: number;
  /** 签到记录 */
  records: CheckinRecord[];
  /** 已领取的日期 */
  claimedDays: number[];
  /** 补签次数 */
  makeupCount: number;
  /** 最大补签次数 */
  maxMakeupCount: number;
  /** 最后签到时间 */
  lastCheckinTime: number;
}

// ==================== 月度配置 ====================

export const MONTHLY_REWARDS: CheckinReward[] = [
  { day: 1, rewards: [{ type: 'diamond', amount: 50, name: '钻石' }], isSpecial: true, specialName: '月初奖励' },
  { day: 2, rewards: [{ type: 'gold', amount: 2000, name: '金币' }], isSpecial: false },
  { day: 3, rewards: [{ type: 'exp', amount: 500, name: '经验' }], isSpecial: false },
  { day: 4, rewards: [{ type: 'stamina', amount: 30, name: '体力' }], isSpecial: false },
  { day: 5, rewards: [{ type: 'gold', amount: 3000, name: '金币' }], isSpecial: false },
  { day: 6, rewards: [{ type: 'exp', amount: 800, name: '经验' }], isSpecial: false },
  { day: 7, rewards: [{ type: 'diamond', amount: 100, name: '钻石' }, { type: 'summonTicket', amount: 1, name: '召唤券' }], isSpecial: true, specialName: '周奖励' },
  { day: 8, rewards: [{ type: 'gold', amount: 4000, name: '金币' }], isSpecial: false },
  { day: 9, rewards: [{ type: 'exp', amount: 1000, name: '经验' }], isSpecial: false },
  { day: 10, rewards: [{ type: 'stamina', amount: 50, name: '体力' }], isSpecial: false },
  { day: 11, rewards: [{ type: 'gold', amount: 5000, name: '金币' }], isSpecial: false },
  { day: 12, rewards: [{ type: 'exp', amount: 1200, name: '经验' }], isSpecial: false },
  { day: 13, rewards: [{ type: 'diamond', amount: 80, name: '钻石' }], isSpecial: false },
  { day: 14, rewards: [{ type: 'diamond', amount: 150, name: '钻石' }, { type: 'summonTicket', amount: 2, name: '召唤券' }], isSpecial: true, specialName: '双周奖励' },
  { day: 15, rewards: [{ type: 'gold', amount: 10000, name: '金币' }], isSpecial: true, specialName: '月中大奖' },
  { day: 16, rewards: [{ type: 'exp', amount: 1500, name: '经验' }], isSpecial: false },
  { day: 17, rewards: [{ type: 'stamina', amount: 60, name: '体力' }], isSpecial: false },
  { day: 18, rewards: [{ type: 'gold', amount: 8000, name: '金币' }], isSpecial: false },
  { day: 19, rewards: [{ type: 'exp', amount: 1800, name: '经验' }], isSpecial: false },
  { day: 20, rewards: [{ type: 'diamond', amount: 100, name: '钻石' }], isSpecial: false },
  { day: 21, rewards: [{ type: 'diamond', amount: 200, name: '钻石' }, { type: 'summonTicket', amount: 3, name: '召唤券' }], isSpecial: true, specialName: '三周奖励' },
  { day: 22, rewards: [{ type: 'gold', amount: 12000, name: '金币' }], isSpecial: false },
  { day: 23, rewards: [{ type: 'exp', amount: 2000, name: '经验' }], isSpecial: false },
  { day: 24, rewards: [{ type: 'stamina', amount: 80, name: '体力' }], isSpecial: false },
  { day: 25, rewards: [{ type: 'gold', amount: 15000, name: '金币' }], isSpecial: false },
  { day: 26, rewards: [{ type: 'exp', amount: 2500, name: '经验' }], isSpecial: false },
  { day: 27, rewards: [{ type: 'diamond', amount: 150, name: '钻石' }], isSpecial: false },
  { day: 28, rewards: [{ type: 'diamond', amount: 300, name: '钻石' }, { type: 'summonTicket', amount: 5, name: '召唤券' }], isSpecial: true, specialName: '满月奖励' },
  { day: 29, rewards: [{ type: 'gold', amount: 20000, name: '金币' }], isSpecial: false },
  { day: 30, rewards: [{ type: 'exp', amount: 3000, name: '经验' }], isSpecial: false },
  { day: 31, rewards: [{ type: 'diamond', amount: 500, name: '钻石' }, { type: 'summonTicket', amount: 10, name: '召唤券' }], isSpecial: true, specialName: '月末大奖' },
];

export const MAKEUP_COST: Record<number, number> = {
  1: 50,   // 补签 1 天花 50 钻石
  2: 100,  // 补签 2 天花 100 钻石
  3: 200,  // 补签 3 天花 200 钻石
  7: 500,  // 补签 7 天花 500 钻石
};

export const MAX_MAKEUP_DAYS = 7; // 最多补签 7 天

// ==================== 工具函数 ====================

export function getNow(): number {
  return Date.now();
}

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? getNow());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getCurrentMonth(now?: number): string {
  const d = new Date(now ?? getNow());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getDayOfMonth(now?: number): number {
  const d = new Date(now ?? getNow());
  return d.getDate();
}

export function getRewardForDay(day: number): CheckinReward | undefined {
  return MONTHLY_REWARDS.find(r => r.day === day);
}

export function getMakeupCost(days: number): number {
  if (days <= 0) return 0;
  if (days <= 2) return MAKEUP_COST[days] || days * 50;
  if (days <= 3) return MAKEUP_COST[3];
  return MAKEUP_COST[7] || days * 70;
}

// ==================== 核心函数 ====================

/**
 * 创建签到系统状态
 */
export function createCheckinState(playerId: string, now?: number): CheckinState {
  return {
    playerId,
    currentMonth: getCurrentMonth(now),
    checkedInDays: 0,
    totalCheckins: 0,
    streak: 0,
    maxStreak: 0,
    records: [],
    claimedDays: [],
    makeupCount: 0,
    maxMakeupCount: MAX_MAKEUP_DAYS,
    lastCheckinTime: 0,
  };
}

/**
 * 检查是否可以签到
 */
export function canCheckin(state: CheckinState, now?: number): { can: boolean; reason?: string; todayRecord?: CheckinRecord } {
  const today = getTodayStr(now);
  const currentMonth = getCurrentMonth(now);

  // 检查月份
  if (currentMonth !== state.currentMonth) {
    return { can: true }; // 新月可以签到
  }

  // 检查今日是否已签到
  const todayRecord = state.records.find(r => r.date === today);
  if (todayRecord) {
    return { can: false, reason: '今日已签到', todayRecord };
  }

  return { can: true };
}

/**
 * 执行签到
 */
export function performCheckin(state: CheckinState, now?: number): {
  state: CheckinState;
  success: boolean;
  day: number;
  rewards: RewardItem[];
  isSpecial: boolean;
  specialName?: string;
  streak: number;
  error?: string;
} {
  const check = canCheckin(state, now);
  if (!check.can) {
    return { state, success: false, day: 0, rewards: [], isSpecial: false, streak: state.streak, error: check.reason };
  }

  const currentTime = now ?? getNow();
  const today = getTodayStr(currentTime);
  const currentMonth = getCurrentMonth(currentTime);
  const day = getDayOfMonth(currentTime);

  const reward = getRewardForDay(day);
  if (!reward) {
    return { state, success: false, day: 0, rewards: [], isSpecial: false, streak: state.streak, error: '今日无奖励配置' };
  }

  // 创建新状态
  const newState = { ...state };

  // 检查连续签到
  const yesterday = new Date(currentTime);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getTodayStr(yesterday.getTime());
  const yesterdayRecord = state.records.find(r => r.date === yesterdayStr);

  if (yesterdayRecord || state.currentMonth !== currentMonth) {
    // 昨天签到了或者是新月，连续签到 +1
    newState.streak = state.streak + 1;
  } else {
    // 昨天没签到，重置连续
    newState.streak = 1;
  }

  // 更新最大连续
  if (newState.streak > newState.maxStreak) {
    newState.maxStreak = newState.streak;
  }

  // 添加记录
  const record: CheckinRecord = {
    date: today,
    timestamp: currentTime,
    isMakeup: false,
  };

  newState.records = [record, ...state.records].slice(0, 365); // 保留一年记录
  newState.checkedInDays = state.checkedInDays + 1;
  newState.totalCheckins = state.totalCheckins + 1;
  newState.claimedDays = [...state.claimedDays, day];
  newState.lastCheckinTime = currentTime;
  newState.currentMonth = currentMonth;

  return {
    state: newState,
    success: true,
    day,
    rewards: reward.rewards,
    isSpecial: reward.isSpecial,
    specialName: reward.specialName,
    streak: newState.streak,
  };
}

/**
 * 获取可补签的日期
 */
export function getMakeupAvailableDays(state: CheckinState, now?: number): number[] {
  const currentMonth = getCurrentMonth(now);
  if (currentMonth !== state.currentMonth) {
    return []; // 只能补签当月
  }

  const today = getDayOfMonth(now);
  const available: number[] = [];

  for (let day = 1; day < today; day++) {
    // 检查该日是否已签到
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    const hasRecord = state.records.some(r => r.date === dateStr);
    if (!hasRecord && !state.claimedDays.includes(day)) {
      available.push(day);
    }
  }

  return available.slice(0, MAX_MAKEUP_DAYS);
}

/**
 * 执行补签
 */
export function performMakeup(
  state: CheckinState,
  days: number[],
  playerDiamonds: number,
  now?: number
): {
  state: CheckinState;
  success: boolean;
  totalRewards: RewardItem[];
  diamondCost: number;
  error?: string;
} {
  if (days.length === 0) {
    return { state, success: false, totalRewards: [], diamondCost: 0, error: '没有可补签的日期' };
  }

  if (days.length > MAX_MAKEUP_DAYS) {
    return { state, success: false, totalRewards: [], diamondCost: 0, error: `最多补签${MAX_MAKEUP_DAYS}天` };
  }

  const cost = getMakeupCost(days.length);
  if (playerDiamonds < cost) {
    return { state, success: false, totalRewards: [], diamondCost: cost, error: `钻石不足 (需要${cost})` };
  }

  const currentTime = now ?? getNow();
  const currentMonth = getCurrentMonth(currentTime);

  if (currentMonth !== state.currentMonth) {
    return { state, success: false, totalRewards: [], diamondCost: 0, error: '只能补签当月' };
  }

  const newState = { ...state };
  const totalRewards: RewardItem[] = [];

  for (const day of days) {
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    const reward = getRewardForDay(day);

    if (!reward) continue;

    const record: CheckinRecord = {
      date: dateStr,
      timestamp: currentTime,
      isMakeup: true,
    };

    newState.records = [record, ...newState.records];
    newState.claimedDays = [...newState.claimedDays, day];
    newState.checkedInDays++;
    newState.totalCheckins++;
    totalRewards.push(...reward.rewards);
  }

  newState.makeupCount += days.length;
  newState.lastCheckinTime = currentTime;

  return {
    state: newState,
    success: true,
    totalRewards,
    diamondCost: cost,
  };
}

/**
 * 获取签到统计
 */
export function getCheckinStats(state: CheckinState): {
  checkedInDays: number;
  totalCheckins: number;
  streak: number;
  maxStreak: number;
  remainingDays: number;
  makeupAvailable: number;
  makeupCount: number;
  specialClaimed: number;
} {
  const specialClaimed = state.claimedDays.filter(day => {
    const reward = getRewardForDay(day);
    return reward?.isSpecial;
  }).length;

  const currentMonthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const remainingDays = currentMonthDays - state.checkedInDays;
  const makeupAvailable = getMakeupAvailableDays(state).length;

  return {
    checkedInDays: state.checkedInDays,
    totalCheckins: state.totalCheckins,
    streak: state.streak,
    maxStreak: state.maxStreak,
    remainingDays,
    makeupAvailable,
    makeupCount: state.makeupCount,
    specialClaimed,
  };
}

/**
 * 月度重置
 */
export function monthlyReset(state: CheckinState, now?: number): CheckinState {
  return {
    ...state,
    currentMonth: getCurrentMonth(now),
    checkedInDays: 0,
    claimedDays: [],
    streak: 0, // 连续签到保留还是重置看设计，这里选择保留
    makeupCount: 0,
  };
}

/**
 * 导出数据
 */
export function exportCheckinData(state: CheckinState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importCheckinData(json: string): CheckinState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !data.currentMonth) return null;
    return data as CheckinState;
  } catch {
    return null;
  }
}
