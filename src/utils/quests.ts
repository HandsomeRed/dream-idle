/**
 * v0.25 每日任务系统 (Daily Quest System)
 * 
 * 功能：
 * - 每日任务（自动刷新）
 * - 每周任务（周一刷新）
 * - 任务类型（推图/爬塔/竞技场/宠物/好友）
 * - 任务奖励（金币/钻石/经验）
 * - 活跃度系统（任务积分兑换奖励）
 */

// ==================== 类型定义 ====================

export type QuestType = 'level' | 'tower' | 'arena' | 'pet' | 'friend' | 'general';
export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestRefreshType = 'daily' | 'weekly';

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  requirement: {
    type: 'count' | 'reach' | 'win' | 'collect';
    target: number;
    description: string;
  };
  rewards: {
    gold: number;
    exp: number;
    diamond?: number;
    activityPoints: number; // 活跃度积分
  };
  refreshType: QuestRefreshType;
}

export interface QuestProgress {
  questId: string;
  current: number;
  completed: boolean;
  rewardClaimed: boolean;
  startedAt: number;
  completedAt?: number;
}

export interface DailyQuests {
  playerId: string;
  date: string; // YYYY-MM-DD
  dailyQuests: QuestProgress[];
  weeklyQuests: QuestProgress[];
  activityPoints: number;
  activityRewardsClaimed: number[]; // 已领取的活跃度奖励索引
  lastDailyRefresh: number;
  lastWeeklyRefresh: number;
}

export interface ActivityReward {
  points: number;
  rewards: {
    gold: number;
    diamond: number;
    exp: number;
  };
}

export interface QuestConfig {
  dailyQuestCount: number;
  weeklyQuestCount: number;
  questPool: Quest[];
  activityRewards: ActivityReward[];
  refreshHour: number;
}

// ==================== 任务池配置 ====================

const QUEST_POOL: Quest[] = [
  // ==================== 推图任务 ====================
  {
    id: 'daily_level_001',
    name: '推图新手',
    description: '通关主线关卡 3 次',
    type: 'level',
    difficulty: 'easy',
    requirement: { type: 'count', target: 3, description: '通关 3 次' },
    rewards: { gold: 200, exp: 100, activityPoints: 10 },
    refreshType: 'daily',
  },
  {
    id: 'daily_level_002',
    name: '推图达人',
    description: '通关主线关卡 10 次',
    type: 'level',
    difficulty: 'medium',
    requirement: { type: 'count', target: 10, description: '通关 10 次' },
    rewards: { gold: 500, exp: 250, diamond: 5, activityPoints: 20 },
    refreshType: 'daily',
  },
  {
    id: 'weekly_level_001',
    name: '推图大师',
    description: '本周通关主线关卡 50 次',
    type: 'level',
    difficulty: 'hard',
    requirement: { type: 'count', target: 50, description: '通关 50 次' },
    rewards: { gold: 2000, exp: 1000, diamond: 20, activityPoints: 50 },
    refreshType: 'weekly',
  },
  // ==================== 爬塔任务 ====================
  {
    id: 'daily_tower_001',
    name: '爬塔挑战',
    description: '爬塔前进 5 层',
    type: 'tower',
    difficulty: 'easy',
    requirement: { type: 'reach', target: 5, description: '前进 5 层' },
    rewards: { gold: 300, exp: 150, activityPoints: 15 },
    refreshType: 'daily',
  },
  {
    id: 'daily_tower_002',
    name: '勇攀高峰',
    description: '爬塔前进 15 层',
    type: 'tower',
    difficulty: 'medium',
    requirement: { type: 'reach', target: 15, description: '前进 15 层' },
    rewards: { gold: 800, exp: 400, diamond: 10, activityPoints: 30 },
    refreshType: 'daily',
  },
  {
    id: 'weekly_tower_001',
    name: '塔中王者',
    description: '本周爬塔前进 100 层',
    type: 'tower',
    difficulty: 'hard',
    requirement: { type: 'reach', target: 100, description: '前进 100 层' },
    rewards: { gold: 3000, exp: 1500, diamond: 50, activityPoints: 80 },
    refreshType: 'weekly',
  },
  // ==================== 竞技场任务 ====================
  {
    id: 'daily_arena_001',
    name: '初露锋芒',
    description: '进行 3 场竞技场挑战',
    type: 'arena',
    difficulty: 'easy',
    requirement: { type: 'count', target: 3, description: '挑战 3 次' },
    rewards: { gold: 200, exp: 100, activityPoints: 10 },
    refreshType: 'daily',
  },
  {
    id: 'daily_arena_002',
    name: '连胜之路',
    description: '竞技场获胜 5 场',
    type: 'arena',
    difficulty: 'medium',
    requirement: { type: 'win', target: 5, description: '获胜 5 场' },
    rewards: { gold: 600, exp: 300, diamond: 10, activityPoints: 25 },
    refreshType: 'daily',
  },
  {
    id: 'weekly_arena_001',
    name: '竞技场传奇',
    description: '本周竞技场获胜 30 场',
    type: 'arena',
    difficulty: 'hard',
    requirement: { type: 'win', target: 30, description: '获胜 30 场' },
    rewards: { gold: 2500, exp: 1200, diamond: 40, activityPoints: 70 },
    refreshType: 'weekly',
  },
  // ==================== 宠物任务 ====================
  {
    id: 'daily_pet_001',
    name: '宠物互动',
    description: '使用宠物协助战斗 3 次',
    type: 'pet',
    difficulty: 'easy',
    requirement: { type: 'count', target: 3, description: '协助 3 次' },
    rewards: { gold: 200, exp: 100, activityPoints: 10 },
    refreshType: 'daily',
  },
  {
    id: 'daily_pet_002',
    name: '宠物培养',
    description: '宠物升级 5 次',
    type: 'pet',
    difficulty: 'medium',
    requirement: { type: 'count', target: 5, description: '升级 5 次' },
    rewards: { gold: 500, exp: 250, diamond: 5, activityPoints: 20 },
    refreshType: 'daily',
  },
  {
    id: 'weekly_pet_001',
    name: '宠物大师',
    description: '本周宠物升级 30 次',
    type: 'pet',
    difficulty: 'hard',
    requirement: { type: 'count', target: 30, description: '升级 30 次' },
    rewards: { gold: 2000, exp: 1000, diamond: 30, activityPoints: 60 },
    refreshType: 'weekly',
  },
  // ==================== 好友任务 ====================
  {
    id: 'daily_friend_001',
    name: '社交达人',
    description: '借用好友助战宠物 2 次',
    type: 'friend',
    difficulty: 'easy',
    requirement: { type: 'count', target: 2, description: '借用 2 次' },
    rewards: { gold: 150, exp: 75, activityPoints: 8 },
    refreshType: 'daily',
  },
  {
    id: 'daily_friend_002',
    name: '友情互助',
    description: '被好友借用宠物 3 次',
    type: 'friend',
    difficulty: 'medium',
    requirement: { type: 'count', target: 3, description: '被借用 3 次' },
    rewards: { gold: 400, exp: 200, diamond: 5, activityPoints: 18 },
    refreshType: 'daily',
  },
  {
    id: 'weekly_friend_001',
    name: '人气王',
    description: '本周被好友借用宠物 20 次',
    type: 'friend',
    difficulty: 'hard',
    requirement: { type: 'count', target: 20, description: '被借用 20 次' },
    rewards: { gold: 1500, exp: 750, diamond: 25, activityPoints: 50 },
    refreshType: 'weekly',
  },
  // ==================== 通用任务 ====================
  {
    id: 'daily_general_001',
    name: '每日登录',
    description: '登录游戏',
    type: 'general',
    difficulty: 'easy',
    requirement: { type: 'count', target: 1, description: '登录 1 次' },
    rewards: { gold: 100, exp: 50, diamond: 5, activityPoints: 5 },
    refreshType: 'daily',
  },
  {
    id: 'daily_general_002',
    name: '战斗狂人',
    description: '进行任意战斗 20 次',
    type: 'general',
    difficulty: 'medium',
    requirement: { type: 'count', target: 20, description: '战斗 20 次' },
    rewards: { gold: 600, exp: 300, diamond: 10, activityPoints: 25 },
    refreshType: 'daily',
  },
  {
    id: 'weekly_general_001',
    name: '勤劳勇者',
    description: '本周登录 5 天',
    type: 'general',
    difficulty: 'hard',
    requirement: { type: 'count', target: 5, description: '登录 5 天' },
    rewards: { gold: 2000, exp: 1000, diamond: 50, activityPoints: 100 },
    refreshType: 'weekly',
  },
];

// ==================== 活跃度奖励配置 ====================

const ACTIVITY_REWARDS: ActivityReward[] = [
  { points: 20, rewards: { gold: 100, diamond: 5, exp: 50 } },
  { points: 40, rewards: { gold: 200, diamond: 10, exp: 100 } },
  { points: 60, rewards: { gold: 300, diamond: 15, exp: 150 } },
  { points: 80, rewards: { gold: 500, diamond: 25, exp: 250 } },
  { points: 100, rewards: { gold: 800, diamond: 50, exp: 400 } },
  { points: 120, rewards: { gold: 1000, diamond: 80, exp: 500 } },
  { points: 150, rewards: { gold: 1500, diamond: 100, exp: 750 } },
];

// ==================== 配置 ====================

export const QUEST_CONFIG: QuestConfig = {
  dailyQuestCount: 5,
  weeklyQuestCount: 3,
  questPool: QUEST_POOL,
  activityRewards: ACTIVITY_REWARDS,
  refreshHour: 5, // 凌晨 5 点刷新
};

// ==================== 工具函数 ====================

/**
 * 获取日期字符串
 */
export function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * 获取周数
 */
export function getWeekKey(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil(diff / oneWeek);
}

/**
 * 创建每日任务数据
 */
export function createDailyQuests(playerId: string): DailyQuests {
  const now = Date.now();
  const dateKey = getDateKey();

  // 随机选择每日任务
  const dailyQuestsPool = QUEST_POOL.filter((q) => q.refreshType === 'daily');
  const selectedDaily = dailyQuestsPool
    .sort(() => Math.random() - 0.5)
    .slice(0, QUEST_CONFIG.dailyQuestCount)
    .map((q) => ({
      questId: q.id,
      current: 0,
      completed: false,
      rewardClaimed: false,
      startedAt: now,
    }));

  // 随机选择每周任务
  const weeklyQuestsPool = QUEST_POOL.filter((q) => q.refreshType === 'weekly');
  const selectedWeekly = weeklyQuestsPool
    .sort(() => Math.random() - 0.5)
    .slice(0, QUEST_CONFIG.weeklyQuestCount)
    .map((q) => ({
      questId: q.id,
      current: 0,
      completed: false,
      rewardClaimed: false,
      startedAt: now,
    }));

  return {
    playerId,
    date: dateKey,
    dailyQuests: selectedDaily,
    weeklyQuests: selectedWeekly,
    activityPoints: 0,
    activityRewardsClaimed: [],
    lastDailyRefresh: now,
    lastWeeklyRefresh: now,
  };
}

/**
 * 获取任务
 */
export function getQuest(questId: string): Quest | undefined {
  return QUEST_POOL.find((q) => q.id === questId);
}

/**
 * 检查是否需要刷新每日任务
 */
export function needsDailyRefresh(quests: DailyQuests): boolean {
  const now = new Date();
  const lastRefresh = new Date(quests.lastDailyRefresh);
  const todayKey = getDateKey(now);

  // 日期不同且已过刷新时间
  if (quests.date !== todayKey && now.getHours() >= QUEST_CONFIG.refreshHour) {
    return true;
  }

  return false;
}

/**
 * 检查是否需要刷新每周任务
 */
export function needsWeeklyRefresh(quests: DailyQuests): boolean {
  const now = new Date();
  const lastRefresh = new Date(quests.lastWeeklyRefresh);
  const currentWeek = getWeekKey(now);
  const lastWeek = getWeekKey(lastRefresh);

  // 新的一周且已过刷新时间
  if (currentWeek > lastWeek && now.getHours() >= QUEST_CONFIG.refreshHour) {
    return true;
  }

  // 周一且已过刷新时间
  if (now.getDay() === 1 && now.getHours() >= QUEST_CONFIG.refreshHour) {
    const lastRefreshDay = new Date(quests.lastWeeklyRefresh);
    if (lastRefreshDay.getDay() !== 1 || lastRefreshDay.getDate() !== now.getDate()) {
      return true;
    }
  }

  return false;
}

/**
 * 刷新每日任务
 */
export function refreshDailyQuests(quests: DailyQuests): DailyQuests {
  const now = Date.now();
  const dateKey = getDateKey();

  // 随机选择新的每日任务
  const dailyQuestsPool = QUEST_POOL.filter((q) => q.refreshType === 'daily');
  const selectedDaily = dailyQuestsPool
    .sort(() => Math.random() - 0.5)
    .slice(0, QUEST_CONFIG.dailyQuestCount)
    .map((q) => ({
      questId: q.id,
      current: 0,
      completed: false,
      rewardClaimed: false,
      startedAt: now,
    }));

  return {
    ...quests,
    date: dateKey,
    dailyQuests: selectedDaily,
    activityPoints: 0,
    activityRewardsClaimed: [],
    lastDailyRefresh: now,
  };
}

/**
 * 刷新每周任务
 */
export function refreshWeeklyQuests(quests: DailyQuests): DailyQuests {
  const now = Date.now();

  // 随机选择新的每周任务
  const weeklyQuestsPool = QUEST_POOL.filter((q) => q.refreshType === 'weekly');
  const selectedWeekly = weeklyQuestsPool
    .sort(() => Math.random() - 0.5)
    .slice(0, QUEST_CONFIG.weeklyQuestCount)
    .map((q) => ({
      questId: q.id,
      current: 0,
      completed: false,
      rewardClaimed: false,
      startedAt: now,
    }));

  return {
    ...quests,
    weeklyQuests: selectedWeekly,
    lastWeeklyRefresh: now,
  };
}

/**
 * 更新任务进度
 */
export function updateQuestProgress(
  quests: DailyQuests,
  questId: string,
  increment: number = 1
): { quests: DailyQuests; newlyCompleted: string[] } {
  const newlyCompleted: string[] = [];
  const newQuests = { ...quests };

  // 更新每日任务
  const dailyIndex = newQuests.dailyQuests.findIndex((q) => q.questId === questId);
  if (dailyIndex >= 0) {
    const quest = newQuests.dailyQuests[dailyIndex];
    if (!quest.completed) {
      quest.current += increment;
      const questDef = getQuest(questId);
      if (questDef && quest.current >= questDef.requirement.target) {
        quest.completed = true;
        quest.completedAt = Date.now();
        newlyCompleted.push(questId);
        newQuests.activityPoints += questDef.rewards.activityPoints;
      }
      newQuests.dailyQuests[dailyIndex] = quest;
    }
  }

  // 更新每周任务
  const weeklyIndex = newQuests.weeklyQuests.findIndex((q) => q.questId === questId);
  if (weeklyIndex >= 0) {
    const quest = newQuests.weeklyQuests[weeklyIndex];
    if (!quest.completed) {
      quest.current += increment;
      const questDef = getQuest(questId);
      if (questDef && quest.current >= questDef.requirement.target) {
        quest.completed = true;
        quest.completedAt = Date.now();
        newlyCompleted.push(questId);
        newQuests.activityPoints += questDef.rewards.activityPoints;
      }
      newQuests.weeklyQuests[weeklyIndex] = quest;
    }
  }

  return { quests: newQuests, newlyCompleted };
}

/**
 * 领取任务奖励
 */
export function claimQuestReward(
  quests: DailyQuests,
  questId: string,
  isWeekly: boolean = false
): {
  quests: DailyQuests;
  success: boolean;
  rewards?: { gold: number; exp: number; diamond?: number };
  error?: string;
} {
  const questList = isWeekly ? quests.weeklyQuests : quests.dailyQuests;
  const questProgress = questList.find((q) => q.questId === questId);

  if (!questProgress) {
    return { quests, success: false, error: '任务不存在' };
  }

  if (!questProgress.completed) {
    return { quests, success: false, error: '任务未完成' };
  }

  if (questProgress.rewardClaimed) {
    return { quests, success: false, error: '奖励已领取' };
  }

  const questDef = getQuest(questId);
  if (!questDef) {
    return { quests, success: false, error: '任务定义不存在' };
  }

  // 领取奖励
  questProgress.rewardClaimed = true;

  return {
    quests,
    success: true,
    rewards: questDef.rewards,
  };
}

/**
 * 领取活跃度奖励
 */
export function claimActivityReward(
  quests: DailyQuests,
  rewardIndex: number
): {
  quests: DailyQuests;
  success: boolean;
  rewards?: { gold: number; diamond: number; exp: number };
  error?: string;
} {
  if (rewardIndex >= QUEST_CONFIG.activityRewards.length) {
    return { quests, success: false, error: '奖励索引无效' };
  }

  if (quests.activityRewardsClaimed.includes(rewardIndex)) {
    return { quests, success: false, error: '奖励已领取' };
  }

  const requiredPoints = QUEST_CONFIG.activityRewards[rewardIndex].points;
  if (quests.activityPoints < requiredPoints) {
    return { quests, success: false, error: '活跃度不足' };
  }

  quests.activityRewardsClaimed.push(rewardIndex);

  return {
    quests,
    success: true,
    rewards: QUEST_CONFIG.activityRewards[rewardIndex].rewards,
  };
}

/**
 * 获取可领取奖励的任务
 */
export function getClaimableQuests(quests: DailyQuests): { quest: Quest; isWeekly: boolean }[] {
  const claimable: { quest: Quest; isWeekly: boolean }[] = [];

  for (const progress of quests.dailyQuests) {
    if (progress.completed && !progress.rewardClaimed) {
      const quest = getQuest(progress.questId);
      if (quest) {
        claimable.push({ quest, isWeekly: false });
      }
    }
  }

  for (const progress of quests.weeklyQuests) {
    if (progress.completed && !progress.rewardClaimed) {
      const quest = getQuest(progress.questId);
      if (quest) {
        claimable.push({ quest, isWeekly: true });
      }
    }
  }

  return claimable;
}

/**
 * 获取可领取的活跃度奖励
 */
export function getClaimableActivityRewards(quests: DailyQuests): ActivityReward[] {
  return QUEST_CONFIG.activityRewards.filter(
    (reward, index) =>
      quests.activityPoints >= reward.points && !quests.activityRewardsClaimed.includes(index)
  );
}

/**
 * 获取任务统计
 */
export function getQuestStats(quests: DailyQuests): {
  dailyCompleted: number;
  dailyTotal: number;
  weeklyCompleted: number;
  weeklyTotal: number;
  activityPoints: number;
  activityProgress: number;
  nextActivityReward?: number;
} {
  const dailyCompleted = quests.dailyQuests.filter((q) => q.completed).length;
  const weeklyCompleted = quests.weeklyQuests.filter((q) => q.completed).length;

  // 计算下一个活跃度奖励
  let nextActivityReward: number | undefined;
  for (const reward of QUEST_CONFIG.activityRewards) {
    if (quests.activityPoints < reward.points) {
      nextActivityReward = reward.points;
      break;
    }
  }

  return {
    dailyCompleted,
    dailyTotal: quests.dailyQuests.length,
    weeklyCompleted,
    weeklyTotal: quests.weeklyQuests.length,
    activityPoints: quests.activityPoints,
    activityProgress: quests.activityPoints,
    nextActivityReward,
  };
}

// ==================== 导出 ====================

export { QUEST_POOL, ACTIVITY_REWARDS };
