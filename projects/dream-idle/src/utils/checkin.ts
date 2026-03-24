/**
 * v0.26 签到系统 (Daily Check-in System)
 * 
 * 功能：
 * - 每日签到
 * - 累计签到奖励
 * - 月度签到表（30 天）
 * - 补签功能
 * - VIP 双倍奖励
 */

// ==================== 类型定义 ====================

export interface CheckinDay {
  day: number;
  rewards: {
    gold: number;
    diamond: number;
    exp: number;
    item?: string;
  };
  isClaimed: boolean;
}

export interface MonthlyCheckin {
  month: string; // YYYY-MM
  checkinDays: CheckinDay[];
  totalCheckins: number;
  consecutiveCheckins: number;
  lastCheckinDate?: string;
  missDays: number[]; // 缺勤日期
}

export interface CumulativeReward {
  days: number;
  rewards: {
    gold: number;
    diamond: number;
    exp: number;
    item?: string;
  };
  claimed: boolean;
}

export interface PlayerCheckin {
  playerId: string;
  currentMonth: MonthlyCheckin;
  cumulativeRewards: CumulativeReward[];
  totalCheckins: number; // 历史总签到次数
  vipDouble: boolean; // VIP 双倍奖励
}

export interface CheckinConfig {
  monthlyRewards: CheckinDay[];
  cumulativeRewards: CumulativeReward[];
  makeUpCost: number; // 补签消耗钻石
  vipDoubleEnabled: boolean;
}

// ==================== 月度签到配置（30 天） ====================

const MONTHLY_REWARDS: CheckinDay[] = [
  { day: 1, rewards: { gold: 100, diamond: 5, exp: 50 }, isClaimed: false },
  { day: 2, rewards: { gold: 150, diamond: 0, exp: 75 }, isClaimed: false },
  { day: 3, rewards: { gold: 200, diamond: 10, exp: 100 }, isClaimed: false },
  { day: 4, rewards: { gold: 250, diamond: 0, exp: 125 }, isClaimed: false },
  { day: 5, rewards: { gold: 300, diamond: 5, exp: 150 }, isClaimed: false },
  { day: 6, rewards: { gold: 350, diamond: 0, exp: 175 }, isClaimed: false },
  { day: 7, rewards: { gold: 500, diamond: 20, exp: 250, item: '体力药水' }, isClaimed: false }, // 周奖励
  { day: 8, rewards: { gold: 150, diamond: 0, exp: 75 }, isClaimed: false },
  { day: 9, rewards: { gold: 200, diamond: 5, exp: 100 }, isClaimed: false },
  { day: 10, rewards: { gold: 400, diamond: 15, exp: 200 }, isClaimed: false },
  { day: 11, rewards: { gold: 250, diamond: 0, exp: 125 }, isClaimed: false },
  { day: 12, rewards: { gold: 300, diamond: 5, exp: 150 }, isClaimed: false },
  { day: 13, rewards: { gold: 350, diamond: 0, exp: 175 }, isClaimed: false },
  { day: 14, rewards: { gold: 600, diamond: 25, exp: 300, item: '强化石' }, isClaimed: false }, // 周奖励
  { day: 15, rewards: { gold: 500, diamond: 30, exp: 250 }, isClaimed: false }, // 半月奖励
  { day: 16, rewards: { gold: 200, diamond: 0, exp: 100 }, isClaimed: false },
  { day: 17, rewards: { gold: 250, diamond: 5, exp: 125 }, isClaimed: false },
  { day: 18, rewards: { gold: 300, diamond: 0, exp: 150 }, isClaimed: false },
  { day: 19, rewards: { gold: 350, diamond: 10, exp: 175 }, isClaimed: false },
  { day: 20, rewards: { gold: 400, diamond: 0, exp: 200 }, isClaimed: false },
  { day: 21, rewards: { gold: 700, diamond: 30, exp: 350, item: '宠物粮' }, isClaimed: false }, // 周奖励
  { day: 22, rewards: { gold: 250, diamond: 0, exp: 125 }, isClaimed: false },
  { day: 23, rewards: { gold: 300, diamond: 5, exp: 150 }, isClaimed: false },
  { day: 24, rewards: { gold: 350, diamond: 0, exp: 175 }, isClaimed: false },
  { day: 25, rewards: { gold: 400, diamond: 10, exp: 200 }, isClaimed: false },
  { day: 26, rewards: { gold: 450, diamond: 0, exp: 225 }, isClaimed: false },
  { day: 27, rewards: { gold: 500, diamond: 15, exp: 250 }, isClaimed: false },
  { day: 28, rewards: { gold: 800, diamond: 40, exp: 400, item: '稀有碎片' }, isClaimed: false }, // 周奖励
  { day: 29, rewards: { gold: 600, diamond: 20, exp: 300 }, isClaimed: false },
  { day: 30, rewards: { gold: 1000, diamond: 50, exp: 500, item: '传说宝箱' }, isClaimed: false }, // 满月奖励
];

// ==================== 累计签到奖励配置 ====================

const CUMULATIVE_REWARDS: CumulativeReward[] = [
  { days: 7, rewards: { gold: 500, diamond: 20, exp: 250 }, claimed: false },
  { days: 14, rewards: { gold: 1000, diamond: 50, exp: 500 }, claimed: false },
  { days: 21, rewards: { gold: 1500, diamond: 80, exp: 750 }, claimed: false },
  { days: 30, rewards: { gold: 2000, diamond: 100, exp: 1000, item: '限定称号' }, claimed: false },
  { days: 60, rewards: { gold: 3000, diamond: 150, exp: 1500 }, claimed: false },
  { days: 90, rewards: { gold: 5000, diamond: 200, exp: 2500, item: '稀有宠物' }, claimed: false },
  { days: 180, rewards: { gold: 10000, diamond: 500, exp: 5000, item: '绝版外观' }, claimed: false },
  { days: 365, rewards: { gold: 20000, diamond: 1000, exp: 10000, item: '周年限定' }, claimed: false },
];

// ==================== 配置 ====================

export const CHECKIN_CONFIG: CheckinConfig = {
  monthlyRewards: MONTHLY_REWARDS,
  cumulativeRewards: CUMULATIVE_REWARDS,
  makeUpCost: 10, // 补签消耗 10 钻石/天
  vipDoubleEnabled: true,
};

// ==================== 工具函数 ====================

/**
 * 获取日期字符串
 */
export function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * 获取月份字符串
 */
export function getMonthKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7); // YYYY-MM
}

/**
 * 获取月份天数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 创建玩家签到数据
 */
export function createPlayerCheckin(playerId: string): PlayerCheckin {
  const now = new Date();
  const monthKey = getMonthKey(now);
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());

  // 初始化本月签到
  const checkinDays: CheckinDay[] = MONTHLY_REWARDS.slice(0, daysInMonth).map((day) => ({
    ...day,
    isClaimed: false,
  }));

  return {
    playerId,
    currentMonth: {
      month: monthKey,
      checkinDays,
      totalCheckins: 0,
      consecutiveCheckins: 0,
      missDays: [],
    },
    cumulativeRewards: JSON.parse(JSON.stringify(CUMULATIVE_REWARDS)),
    totalCheckins: 0,
    vipDouble: false,
  };
}

/**
 * 检查是否可以签到
 */
export function canCheckin(checkin: PlayerCheckin): { can: boolean; reason?: string } {
  const today = getDateKey();
  const lastCheckin = checkin.currentMonth.lastCheckinDate;

  // 今天已经签到过
  if (lastCheckin === today) {
    return { can: false, reason: '今日已签到' };
  }

  // 检查月份是否更新
  const currentMonth = getMonthKey();
  if (checkin.currentMonth.month !== currentMonth) {
    return { can: true }; // 新月可以签到
  }

  return { can: true };
}

/**
 * 执行签到
 */
export function doCheckin(checkin: PlayerCheckin, date?: string): {
  checkin: PlayerCheckin;
  rewards: { gold: number; diamond: number; exp: number; item?: string };
  day: number;
  consecutive: number;
} {
  const today = date || getDateKey();
  const todayDay = new Date(today).getDate();
  const currentMonth = getMonthKey(new Date(today));

  // 检查月份
  if (checkin.currentMonth.month !== currentMonth) {
    // 新月重置
    const daysInMonth = getDaysInMonth(new Date(today).getFullYear(), new Date(today).getMonth());
    checkin.currentMonth = {
      month: currentMonth,
      checkinDays: MONTHLY_REWARDS.slice(0, daysInMonth).map((day) => ({
        ...day,
        isClaimed: false,
      })),
      totalCheckins: 0,
      consecutiveCheckins: 0,
      missDays: [],
      lastCheckinDate: undefined,
    };
  }

  // 获取今日签到奖励
  const dayIndex = todayDay - 1;
  const dayData = checkin.currentMonth.checkinDays[dayIndex];

  if (!dayData) {
    throw new Error('无效的签到日期');
  }

  if (dayData.isClaimed) {
    throw new Error('今日已签到');
  }

  // 标记为已签到
  dayData.isClaimed = true;
  checkin.currentMonth.totalCheckins += 1;
  checkin.currentMonth.consecutiveCheckins += 1;
  checkin.currentMonth.lastCheckinDate = today;
  checkin.totalCheckins += 1;

  // 计算奖励（考虑 VIP 双倍）
  let rewards = { ...dayData.rewards };
  if (checkin.vipDouble && CHECKIN_CONFIG.vipDoubleEnabled) {
    rewards.gold *= 2;
    rewards.diamond *= 2;
    rewards.exp *= 2;
  }

  return {
    checkin,
    rewards,
    day: todayDay,
    consecutive: checkin.currentMonth.consecutiveCheckins,
  };
}

/**
 * 补签
 */
export function makeUpCheckin(
  checkin: PlayerCheckin,
  day: number,
  hasDiamond: boolean
): {
  checkin: PlayerCheckin;
  success: boolean;
  rewards?: { gold: number; diamond: number; exp: number; item?: string };
  error?: string;
} {
  if (day < 1 || day > checkin.currentMonth.checkinDays.length) {
    return { checkin, success: false, error: '无效的日期' };
  }

  const dayData = checkin.currentMonth.checkinDays[day - 1];

  if (dayData.isClaimed) {
    return { checkin, success: false, error: '该日已签到' };
  }

  // 检查钻石 (hasDiamond 表示玩家是否有足够钻石)
  if (!hasDiamond) {
    return { checkin, success: false, error: '钻石不足' };
  }

  // 执行补签
  dayData.isClaimed = true;
  checkin.currentMonth.totalCheckins += 1;
  checkin.currentMonth.missDays = checkin.currentMonth.missDays.filter((d) => d !== day);

  // 计算奖励
  let rewards = { ...dayData.rewards };
  if (checkin.vipDouble && CHECKIN_CONFIG.vipDoubleEnabled) {
    rewards.gold *= 2;
    rewards.diamond *= 2;
    rewards.exp *= 2;
  }

  return {
    checkin,
    success: true,
    rewards,
  };
}

/**
 * 领取累计签到奖励
 */
export function claimCumulativeReward(
  checkin: PlayerCheckin,
  rewardIndex: number
): {
  checkin: PlayerCheckin;
  success: boolean;
  rewards?: { gold: number; diamond: number; exp: number; item?: string };
  error?: string;
} {
  if (rewardIndex >= checkin.cumulativeRewards.length) {
    return { checkin, success: false, error: '无效的奖励索引' };
  }

  const reward = checkin.cumulativeRewards[rewardIndex];

  if (reward.claimed) {
    return { checkin, success: false, error: '奖励已领取' };
  }

  if (checkin.totalCheckins < reward.days) {
    return { checkin, success: false, error: '签到天数不足' };
  }

  reward.claimed = true;

  let rewards = { ...reward.rewards };
  if (checkin.vipDouble && CHECKIN_CONFIG.vipDoubleEnabled) {
    rewards.gold *= 2;
    rewards.diamond *= 2;
    rewards.exp *= 2;
  }

  return {
    checkin,
    success: true,
    rewards,
  };
}

/**
 * 获取可领取的累计奖励
 */
export function getClaimableCumulativeRewards(checkin: PlayerCheckin): CumulativeReward[] {
  return checkin.cumulativeRewards.filter(
    (reward) => !reward.claimed && checkin.totalCheckins >= reward.days
  );
}

/**
 * 获取签到统计
 */
export function getCheckinStats(checkin: PlayerCheckin): {
  todayChecked: boolean;
  consecutiveDays: number;
  totalDays: number;
  monthlyProgress: number;
  monthlyTotal: number;
  nextCumulativeDays?: number;
  vipDouble: boolean;
} {
  const today = getDateKey();
  const todayChecked = checkin.currentMonth.lastCheckinDate === today;

  // 计算下一个累计奖励
  let nextCumulativeDays: number | undefined;
  for (const reward of checkin.cumulativeRewards) {
    if (!reward.claimed) {
      nextCumulativeDays = reward.days;
      break;
    }
  }

  return {
    todayChecked,
    consecutiveDays: checkin.currentMonth.consecutiveCheckins,
    totalDays: checkin.totalCheckins,
    monthlyProgress: checkin.currentMonth.totalCheckins,
    monthlyTotal: checkin.currentMonth.checkinDays.length,
    nextCumulativeDays,
    vipDouble: checkin.vipDouble,
  };
}

/**
 * 检查连续签到中断
 */
export function checkConsecutiveBreak(checkin: PlayerCheckin): PlayerCheckin {
  if (!checkin.currentMonth.lastCheckinDate) {
    return checkin;
  }

  const lastDate = new Date(checkin.currentMonth.lastCheckinDate);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  // 超过 1 天未签到，连续签到中断
  if (diffDays > 1) {
    checkin.currentMonth.consecutiveCheckins = 0;
  }

  return checkin;
}

/**
 * 获取本月签到日历
 */
export function getMonthlyCalendar(checkin: PlayerCheckin): {
  month: string;
  days: { day: number; checked: boolean; claimed: boolean }[];
} {
  return {
    month: checkin.currentMonth.month,
    days: checkin.currentMonth.checkinDays.map((d) => ({
      day: d.day,
      checked: d.isClaimed,
      claimed: d.isClaimed,
    })),
  };
}

/**
 * 设置 VIP 双倍
 */
export function setVipDouble(checkin: PlayerCheckin, enabled: boolean): PlayerCheckin {
  return {
    ...checkin,
    vipDouble: enabled,
  };
}

// ==================== 导出 ====================

export { MONTHLY_REWARDS, CUMULATIVE_REWARDS };
