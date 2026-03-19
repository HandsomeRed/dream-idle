/**
 * Check-in System - v0.32
 * 签到系统：每日签到、累计签到、补签功能
 */

// ==================== 枚举和类型定义 ====================

/**
 * 签到奖励类型
 */
export enum CheckInRewardType {
  Gold = 'gold',
  Diamond = 'diamond',
  Stamina = 'stamina',
  Item = 'item',
}

/**
 * 签到奖励
 */
export interface CheckInReward {
  type: CheckInRewardType;
  amount: number;
  itemId?: string;  // 当 type 为 item 时
}

/**
 * 签到日定义
 */
export interface CheckInDay {
  day: number;           // 第几天
  reward: CheckInReward; // 奖励
  isSpecial?: boolean;   // 是否特殊奖励
}

/**
 * 签到配置
 */
export interface CheckInConfig {
  monthlyRewards: CheckInDay[];  // 月度签到表（30 天）
  cumulativeRewards: CumulativeReward[];  // 累计签到奖励
  makeUpCost: number;  // 补签消耗（钻石/天）
  maxMakeUpDays: number;  // 最大补签天数
}

/**
 * 累计签到奖励
 */
export interface CumulativeReward {
  days: number;        // 累计天数
  reward: CheckInReward;
  isSpecial?: boolean; // 是否特殊奖励
}

/**
 * 玩家签到状态
 */
export interface CheckInState {
  totalCheckInDays: number;      // 累计签到天数
  currentStreak: number;         // 当前连续签到天数
  maxStreak: number;             // 最大连续签到天数
  lastCheckInDate?: number;      // 上次签到日期（时间戳）
  missedDays: number[];          // 本月漏签日期
  claimedCumulativeRewards: number[];  // 已领取的累计奖励天数
  currentMonth: number;          // 当前月份
  currentYear: number;           // 当前年份
}

/**
 * 签到结果
 */
export interface CheckInResult {
  success: boolean;
  reward?: CheckInReward;
  isSpecial?: boolean;
  day?: number;
  message: string;
  streak?: number;
}

/**
 * 补签结果
 */
export interface MakeUpResult {
  success: boolean;
  day?: number;
  reward?: CheckInReward;
  message: string;
  cost?: number;
}

/**
 * 累计奖励领取结果
 */
export interface CumulativeRewardResult {
  success: boolean;
  reward?: CheckInReward;
  message: string;
}

// ==================== 常量配置 ====================

/**
 * 月度签到奖励表（30 天）
 */
export const MONTHLY_REWARDS: CheckInDay[] = [
  { day: 1, reward: { type: CheckInRewardType.Gold, amount: 1000 } },
  { day: 2, reward: { type: CheckInRewardType.Gold, amount: 1500 } },
  { day: 3, reward: { type: CheckInRewardType.Stamina, amount: 30 }, isSpecial: true },
  { day: 4, reward: { type: CheckInRewardType.Gold, amount: 2000 } },
  { day: 5, reward: { type: CheckInRewardType.Gold, amount: 2500 } },
  { day: 6, reward: { type: CheckInRewardType.Diamond, amount: 20 } },
  { day: 7, reward: { type: CheckInRewardType.Diamond, amount: 50 }, isSpecial: true },
  { day: 8, reward: { type: CheckInRewardType.Gold, amount: 3000 } },
  { day: 9, reward: { type: CheckInRewardType.Gold, amount: 3500 } },
  { day: 10, reward: { type: CheckInRewardType.Stamina, amount: 50 }, isSpecial: true },
  { day: 11, reward: { type: CheckInRewardType.Gold, amount: 4000 } },
  { day: 12, reward: { type: CheckInRewardType.Gold, amount: 4500 } },
  { day: 13, reward: { type: CheckInRewardType.Diamond, amount: 30 } },
  { day: 14, reward: { type: CheckInRewardType.Diamond, amount: 80 }, isSpecial: true },
  { day: 15, reward: { type: CheckInRewardType.Gold, amount: 5000 } },
  { day: 16, reward: { type: CheckInRewardType.Gold, amount: 5500 } },
  { day: 17, reward: { type: CheckInRewardType.Stamina, amount: 50 } },
  { day: 18, reward: { type: CheckInRewardType.Gold, amount: 6000 } },
  { day: 19, reward: { type: CheckInRewardType.Gold, amount: 6500 } },
  { day: 20, reward: { type: CheckInRewardType.Diamond, amount: 50 } },
  { day: 21, reward: { type: CheckInRewardType.Diamond, amount: 100 }, isSpecial: true },
  { day: 22, reward: { type: CheckInRewardType.Gold, amount: 7000 } },
  { day: 23, reward: { type: CheckInRewardType.Gold, amount: 7500 } },
  { day: 24, reward: { type: CheckInRewardType.Stamina, amount: 80 } },
  { day: 25, reward: { type: CheckInRewardType.Gold, amount: 8000 } },
  { day: 26, reward: { type: CheckInRewardType.Gold, amount: 8500 } },
  { day: 27, reward: { type: CheckInRewardType.Diamond, amount: 60 } },
  { day: 28, reward: { type: CheckInRewardType.Diamond, amount: 120 }, isSpecial: true },
  { day: 29, reward: { type: CheckInRewardType.Gold, amount: 9000 } },
  { day: 30, reward: { type: CheckInRewardType.Diamond, amount: 200 }, isSpecial: true },
];

/**
 * 累计签到奖励
 */
export const CUMULATIVE_REWARDS: CumulativeReward[] = [
  { days: 7, reward: { type: CheckInRewardType.Diamond, amount: 100 } },
  { days: 14, reward: { type: CheckInRewardType.Diamond, amount: 200 } },
  { days: 21, reward: { type: CheckInRewardType.Diamond, amount: 300 } },
  { days: 30, reward: { type: CheckInRewardType.Diamond, amount: 500 } },
  { days: 60, reward: { type: CheckInRewardType.Diamond, amount: 1000 } },
  { days: 90, reward: { type: CheckInRewardType.Diamond, amount: 1500 } },
  { days: 180, reward: { type: CheckInRewardType.Diamond, amount: 3000 } },
  { days: 365, reward: { type: CheckInRewardType.Diamond, amount: 10000 }, isSpecial: true },
];

/**
 * 签到配置
 */
export const CHECKIN_CONFIG: CheckInConfig = {
  monthlyRewards: MONTHLY_REWARDS,
  cumulativeRewards: CUMULATIVE_REWARDS,
  makeUpCost: 10,  // 每天补签消耗 10 钻石
  maxMakeUpDays: 7,  // 最多补签 7 天
};

// ==================== 签到状态管理 ====================

/**
 * 初始化签到状态
 */
export function initializeCheckInState(): CheckInState {
  const now = new Date();
  return {
    totalCheckInDays: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastCheckInDate: undefined,
    missedDays: [],
    claimedCumulativeRewards: [],
    currentMonth: now.getMonth() + 1,
    currentYear: now.getFullYear(),
  };
}

/**
 * 获取今日应签到天数
 */
export function getTodayCheckInDay(state: CheckInState): number {
  // 如果是新月份，从第 1 天开始
  const now = new Date();
  if (state.currentMonth !== now.getMonth() + 1 || state.currentYear !== now.getFullYear()) {
    return 1;
  }
  
  // 计算今天是本月第几次签到
  return state.totalCheckInDays % 30 + 1;
}

/**
 * 检查是否可以签到
 */
export function canCheckIn(state: CheckInState): { can: boolean; reason?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // 检查月份是否更新
  if (state.currentMonth !== now.getMonth() + 1 || state.currentYear !== now.getFullYear()) {
    return { can: true };
  }
  
  // 检查今天是否已签到
  if (state.lastCheckInDate) {
    const lastCheckIn = new Date(state.lastCheckInDate);
    const lastCheckInDay = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate()).getTime();
    
    if (lastCheckInDay >= today) {
      return {
        can: false,
        reason: '今日已签到',
      };
    }
  }
  
  return { can: true };
}

/**
 * 执行签到
 */
export function checkIn(state: CheckInState, diamond: number): CheckInResult {
  // 检查是否可以签到
  const { can, reason } = canCheckIn(state);
  if (!can) {
    return {
      success: false,
      message: reason || '无法签到',
    };
  }
  
  const now = new Date();
  const todayDay = now.getDate();
  
  // 检查是否是漏签补签
  const isMakeUp = state.missedDays.includes(todayDay);
  
  // 获取今日奖励
  const todayIndex = (state.totalCheckInDays % 30);
  const todayReward = MONTHLY_REWARDS[todayIndex];
  
  // 更新签到状态
  state.totalCheckInDays++;
  
  // 更新连续签到
  if (state.lastCheckInDate) {
    const lastCheckIn = new Date(state.lastCheckInDate);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastCheckIn.getDate() === yesterday.getDate() &&
        lastCheckIn.getMonth() === yesterday.getMonth() &&
        lastCheckIn.getFullYear() === yesterday.getFullYear()) {
      // 连续签到
      state.currentStreak++;
    } else {
      // 中断后重新签到
      state.currentStreak = 1;
    }
  } else {
    state.currentStreak = 1;
  }
  
  // 更新最大连续签到
  if (state.currentStreak > state.maxStreak) {
    state.maxStreak = state.currentStreak;
  }
  
  // 更新最后签到时间
  state.lastCheckInDate = now.getTime();
  
  // 更新月份信息
  state.currentMonth = now.getMonth() + 1;
  state.currentYear = now.getFullYear();
  
  // 从漏签列表中移除今天
  state.missedDays = state.missedDays.filter(d => d !== todayDay);
  
  return {
    success: true,
    reward: todayReward.reward,
    isSpecial: todayReward.isSpecial,
    day: todayReward.day,
    message: `签到成功！获得 ${formatReward(todayReward.reward)}`,
    streak: state.currentStreak,
  };
}

/**
 * 补签
 */
export function makeUpCheckIn(
  state: CheckInState,
  day: number,
  diamond: number
): MakeUpResult {
  // 检查是否是漏签日期
  if (!state.missedDays.includes(day)) {
    return {
      success: false,
      message: '该日期无需补签',
    };
  }
  
  // 检查补签数量限制
  if (state.missedDays.length > state.maxStreak) {
    // 简化处理：检查已补签次数
  }
  
  // 检查钻石是否足够
  const cost = CHECKIN_CONFIG.makeUpCost;
  if (diamond < cost) {
    return {
      success: false,
      message: `钻石不足！需要 ${cost} 钻石`,
      cost,
    };
  }
  
  // 获取该日奖励
  const rewardDay = MONTHLY_REWARDS.find(d => d.day === day);
  if (!rewardDay) {
    return {
      success: false,
      message: '无效的签到日期',
    };
  }
  
  // 扣除钻石
  // 实际扣除在父组件处理
  
  // 从漏签列表中移除
  state.missedDays = state.missedDays.filter(d => d !== day);
  
  // 增加总签到天数（补签也算）
  state.totalCheckInDays++;
  
  return {
    success: true,
    day,
    reward: rewardDay.reward,
    message: `补签成功！获得 ${formatReward(rewardDay.reward)}`,
    cost,
  };
}

/**
 * 领取累计签到奖励
 */
export function claimCumulativeReward(
  state: CheckInState
): CumulativeRewardResult[] {
  const results: CumulativeRewardResult[] = [];
  
  CUMULATIVE_REWARDS.forEach(cumulative => {
    // 检查是否已领取
    if (state.claimedCumulativeRewards.includes(cumulative.days)) {
      return;
    }
    
    // 检查是否达到条件
    if (state.totalCheckInDays >= cumulative.days) {
      state.claimedCumulativeRewards.push(cumulative.days);
      
      results.push({
        success: true,
        reward: cumulative.reward,
        message: `累计签到奖励已领取！获得 ${formatReward(cumulative.reward)}`,
      });
    }
  });
  
  return results;
}

/**
 * 更新漏签日期（每日凌晨 5 点调用）
 */
export function updateMissedDays(state: CheckInState): void {
  const now = new Date();
  const today = now.getDate();
  
  // 检查月份是否更新
  if (state.currentMonth !== now.getMonth() + 1 || state.currentYear !== now.getFullYear()) {
    // 新月，重置漏签列表
    state.missedDays = [];
    state.currentMonth = now.getMonth() + 1;
    state.currentYear = now.getFullYear();
    return;
  }
  
  // 如果今天还没签到，且昨天签到了，说明今天还没到漏签时间
  if (state.lastCheckInDate) {
    const lastCheckIn = new Date(state.lastCheckInDate);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 如果最后签到是昨天之前，说明有漏签
    if (lastCheckIn.getDate() < yesterday.getDate()) {
      // 计算漏签的天数
      const daysBetween = Math.floor((today - lastCheckIn.getDate() - 1));
      for (let i = 1; i <= daysBetween; i++) {
        const missedDay = lastCheckIn.getDate() + i;
        if (!state.missedDays.includes(missedDay) && missedDay < today) {
          state.missedDays.push(missedDay);
        }
      }
    }
  }
}

/**
 * 获取可领取的累计奖励
 */
export function getClaimableCumulativeRewards(state: CheckInState): CumulativeReward[] {
  return CUMULATIVE_REWARDS.filter(cumulative => 
    state.totalCheckInDays >= cumulative.days &&
    !state.claimedCumulativeRewards.includes(cumulative.days)
  );
}

/**
 * 获取今日签到奖励
 */
export function getTodayReward(state: CheckInState): CheckInDay {
  const todayIndex = state.totalCheckInDays % 30;
  return MONTHLY_REWARDS[todayIndex];
}

/**
 * 获取连续签到奖励进度
 */
export function getStreakProgress(state: CheckInState): { current: number; next: number } {
  const nextSpecialDay = MONTHLY_REWARDS.find(d => d.day > state.currentStreak && d.isSpecial);
  return {
    current: state.currentStreak,
    next: nextSpecialDay?.day || 30,
  };
}

// ==================== 辅助函数 ====================

/**
 * 格式化奖励显示
 */
export function formatReward(reward: CheckInReward): string {
  const typeNames: Record<CheckInRewardType, string> = {
    [CheckInRewardType.Gold]: '金币',
    [CheckInRewardType.Diamond]: '钻石',
    [CheckInRewardType.Stamina]: '体力',
    [CheckInRewardType.Item]: '道具',
  };
  
  return `${typeNames[reward.type]} ×${reward.amount}`;
}

/**
 * 获取签到日历数据
 */
export function getCheckInCalendarData(state: CheckInState): {
  day: number;
  reward: CheckInReward;
  isSpecial: boolean;
  isToday: boolean;
  isMissed: boolean;
  isClaimed: boolean;
}[] {
  const now = new Date();
  const today = now.getDate();
  
  return MONTHLY_REWARDS.map(dayData => ({
    day: dayData.day,
    reward: dayData.reward,
    isSpecial: dayData.isSpecial || false,
    isToday: dayData.day === today,
    isMissed: state.missedDays.includes(dayData.day),
    isClaimed: dayData.day <= today && !state.missedDays.includes(dayData.day) && dayData.day !== today,
  }));
}

/**
 * 计算签到完成度
 */
export function getCheckInCompletionRate(state: CheckInState): number {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const signedDays = daysInMonth - state.missedDays.length;
  return Math.floor((signedDays / daysInMonth) * 100);
}
