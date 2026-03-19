/**
 * v0.24 成就系统扩展 (Achievement System Extension)
 * 
 * 功能：
 * - 多维度成就追踪（推图/爬塔/竞技场/宠物/好友）
 * - 成就分类（新手/进阶/大师/传奇）
 * - 成就奖励（金币/钻石/称号）
 * - 成就进度实时追踪
 * - 成就完成度统计
 */

// ==================== 类型定义 ====================

export type AchievementCategory = 'beginner' | 'advanced' | 'master' | 'legend';
export type AchievementType = 'tower' | 'arena' | 'pet' | 'friend' | 'level' | 'general';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  requirement: {
    type: 'count' | 'reach' | 'collect' | 'win' | 'defeat';
    target: number;
    description: string;
  };
  rewards: {
    gold: number;
    diamond: number;
    title?: string;
  };
  hidden: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  completed: boolean;
  completedAt?: number;
  rewardClaimed: boolean;
}

export interface PlayerAchievements {
  playerId: string;
  progress: { [achievementId: string]: AchievementProgress };
  totalCompleted: number;
  completionRate: number;
  titles: string[];
  totalRewards: {
    gold: number;
    diamond: number;
  };
}

export interface AchievementConfig {
  achievements: Achievement[];
  categoryThresholds: { [category in AchievementCategory]: number };
}

// ==================== 成就数据 ====================

const ACHIEVEMENTS: Achievement[] = [
  // ==================== 新手成就 ====================
  {
    id: 'beginner_001',
    name: '初入江湖',
    description: '创建角色并开始游戏',
    category: 'beginner',
    type: 'general',
    requirement: { type: 'count', target: 1, description: '创建角色' },
    rewards: { gold: 100, diamond: 0 },
    hidden: false,
  },
  {
    id: 'beginner_002',
    name: '首战告捷',
    description: '赢得第一场战斗',
    category: 'beginner',
    type: 'level',
    requirement: { type: 'win', target: 1, description: '赢得 1 场战斗' },
    rewards: { gold: 200, diamond: 5 },
    hidden: false,
  },
  {
    id: 'beginner_003',
    name: '宠物收集者',
    description: '获得第一只宠物',
    category: 'beginner',
    type: 'pet',
    requirement: { type: 'collect', target: 1, description: '获得 1 只宠物' },
    rewards: { gold: 300, diamond: 10 },
    hidden: false,
  },
  {
    id: 'beginner_004',
    name: '爬塔新手',
    description: '通关爬塔第 10 层',
    category: 'beginner',
    type: 'tower',
    requirement: { type: 'reach', target: 10, description: '到达第 10 层' },
    rewards: { gold: 500, diamond: 20 },
    hidden: false,
  },
  {
    id: 'beginner_005',
    name: '初露锋芒',
    description: '竞技场积分达到 1200',
    category: 'beginner',
    type: 'arena',
    requirement: { type: 'reach', target: 1200, description: '积分达到 1200' },
    rewards: { gold: 500, diamond: 20 },
    hidden: false,
  },
  // ==================== 进阶成就 ====================
  {
    id: 'advanced_001',
    name: '宠物大师',
    description: '收集 10 只不同的宠物',
    category: 'advanced',
    type: 'pet',
    requirement: { type: 'collect', target: 10, description: '收集 10 只宠物' },
    rewards: { gold: 1000, diamond: 50 },
    hidden: false,
  },
  {
    id: 'advanced_002',
    name: '塔中勇者',
    description: '通关爬塔第 50 层',
    category: 'advanced',
    type: 'tower',
    requirement: { type: 'reach', target: 50, description: '到达第 50 层' },
    rewards: { gold: 2000, diamond: 100 },
    hidden: false,
  },
  {
    id: 'advanced_003',
    name: '竞技场精英',
    description: '竞技场积分达到 1800',
    category: 'advanced',
    type: 'arena',
    requirement: { type: 'reach', target: 1800, description: '积分达到 1800' },
    rewards: { gold: 2000, diamond: 100 },
    hidden: false,
  },
  {
    id: 'advanced_004',
    name: '社交达人',
    description: '拥有 10 个好友',
    category: 'advanced',
    type: 'friend',
    requirement: { type: 'count', target: 10, description: '拥有 10 个好友' },
    rewards: { gold: 1500, diamond: 75 },
    hidden: false,
  },
  {
    id: 'advanced_005',
    name: '连胜王者',
    description: '竞技场 10 连胜',
    category: 'advanced',
    type: 'arena',
    requirement: { type: 'win', target: 10, description: '10 连胜' },
    rewards: { gold: 3000, diamond: 150 },
    hidden: false,
  },
  // ==================== 大师成就 ====================
  {
    id: 'master_001',
    name: '宠物收藏家',
    description: '收集 20 只不同的宠物',
    category: 'master',
    type: 'pet',
    requirement: { type: 'collect', target: 20, description: '收集 20 只宠物' },
    rewards: { gold: 5000, diamond: 200, title: '宠物大师' },
    hidden: false,
  },
  {
    id: 'master_002',
    name: '登峰造极',
    description: '通关爬塔第 100 层',
    category: 'master',
    type: 'tower',
    requirement: { type: 'reach', target: 100, description: '到达第 100 层' },
    rewards: { gold: 10000, diamond: 500, title: '爬塔王者' },
    hidden: false,
  },
  {
    id: 'master_003',
    name: '竞技场传说',
    description: '竞技场积分达到 2400',
    category: 'master',
    type: 'arena',
    requirement: { type: 'reach', target: 2400, description: '积分达到 2400' },
    rewards: { gold: 10000, diamond: 500, title: '竞技场传说' },
    hidden: false,
  },
  {
    id: 'master_004',
    name: '推图达人',
    description: '通关主线第 50 关',
    category: 'master',
    type: 'level',
    requirement: { type: 'reach', target: 50, description: '通关第 50 关' },
    rewards: { gold: 8000, diamond: 400 },
    hidden: false,
  },
  {
    id: 'master_005',
    name: '人气王',
    description: '拥有 30 个好友',
    category: 'master',
    type: 'friend',
    requirement: { type: 'count', target: 30, description: '拥有 30 个好友' },
    rewards: { gold: 5000, diamond: 250 },
    hidden: false,
  },
  // ==================== 传奇成就 ====================
  {
    id: 'legend_001',
    name: '全宠物制霸',
    description: '收集所有宠物（12 只）',
    category: 'legend',
    type: 'pet',
    requirement: { type: 'collect', target: 12, description: '收集全部宠物' },
    rewards: { gold: 20000, diamond: 1000, title: '宠物之神' },
    hidden: true,
  },
  {
    id: 'legend_002',
    name: '无尽之巅',
    description: '通关爬塔第 500 层',
    category: 'legend',
    type: 'tower',
    requirement: { type: 'reach', target: 500, description: '到达第 500 层' },
    rewards: { gold: 50000, diamond: 2500, title: '无尽征服者' },
    hidden: true,
  },
  {
    id: 'legend_003',
    name: '无敌战神',
    description: '竞技场积分达到 3000',
    category: 'legend',
    type: 'arena',
    requirement: { type: 'reach', target: 3000, description: '积分达到 3000' },
    rewards: { gold: 50000, diamond: 2500, title: '无敌战神' },
    hidden: true,
  },
  {
    id: 'legend_004',
    name: '完美通关',
    description: '主线 100 关全部 3 星通关',
    category: 'legend',
    type: 'level',
    requirement: { type: 'reach', target: 100, description: '100 关 3 星' },
    rewards: { gold: 30000, diamond: 1500, title: '完美主义者' },
    hidden: true,
  },
  {
    id: 'legend_005',
    name: '百胜将军',
    description: '竞技场总胜场达到 100',
    category: 'legend',
    type: 'arena',
    requirement: { type: 'win', target: 100, description: '总胜场 100' },
    rewards: { gold: 30000, diamond: 1500, title: '百胜将军' },
    hidden: true,
  },
];

// ==================== 配置 ====================

export const ACHIEVEMENT_CONFIG: AchievementConfig = {
  achievements: ACHIEVEMENTS,
  categoryThresholds: {
    beginner: 0,
    advanced: 5,
    master: 10,
    legend: 15,
  },
};

// ==================== 工具函数 ====================

/**
 * 创建玩家成就数据
 */
export function createPlayerAchievements(playerId: string): PlayerAchievements {
  const progress: { [achievementId: string]: AchievementProgress } = {};
  
  for (const achievement of ACHIEVEMENTS) {
    progress[achievement.id] = {
      achievementId: achievement.id,
      current: 0,
      completed: false,
      rewardClaimed: false,
    };
  }

  return {
    playerId,
    progress,
    totalCompleted: 0,
    completionRate: 0,
    titles: [],
    totalRewards: {
      gold: 0,
      diamond: 0,
    },
  };
}

/**
 * 获取成就
 */
export function getAchievement(achievementId: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === achievementId);
}

/**
 * 按分类获取成就
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * 按类型获取成就
 */
export function getAchievementsByType(type: AchievementType): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.type === type);
}

/**
 * 更新成就进度
 */
export function updateAchievementProgress(
  playerAchievements: PlayerAchievements,
  achievementId: string,
  newValue: number
): { playerAchievements: PlayerAchievements; newlyCompleted: string[] } {
  const achievement = getAchievement(achievementId);
  if (!achievement) {
    return { playerAchievements, newlyCompleted: [] };
  }

  const progress = playerAchievements.progress[achievementId];
  if (!progress || progress.completed) {
    return { playerAchievements, newlyCompleted: [] };
  }

  const newlyCompleted: string[] = [];
  progress.current = Math.max(progress.current, newValue);

  // 检查是否完成
  if (progress.current >= achievement.requirement.target) {
    progress.completed = true;
    progress.completedAt = Date.now();
    newlyCompleted.push(achievementId);
    playerAchievements.totalCompleted += 1;
    playerAchievements.completionRate = Math.floor(
      (playerAchievements.totalCompleted / ACHIEVEMENTS.length) * 100
    );
  }

  return { playerAchievements, newlyCompleted };
}

/**
 * 批量更新成就进度
 */
export function batchUpdateAchievements(
  playerAchievements: PlayerAchievements,
  updates: { achievementId: string; value: number }[]
): { playerAchievements: PlayerAchievements; newlyCompleted: string[] } {
  const newlyCompleted: string[] = [];

  for (const update of updates) {
    const result = updateAchievementProgress(
      playerAchievements,
      update.achievementId,
      update.value
    );
    newlyCompleted.push(...result.newlyCompleted);
  }

  return { playerAchievements, newlyCompleted };
}

/**
 * 领取成就奖励
 */
export function claimAchievementReward(
  playerAchievements: PlayerAchievements,
  achievementId: string
): { 
  playerAchievements: PlayerAchievements; 
  success: boolean; 
  rewards?: { gold: number; diamond: number; title?: string };
  error?: string 
} {
  const achievement = getAchievement(achievementId);
  if (!achievement) {
    return { playerAchievements, success: false, error: '成就不存在' };
  }

  const progress = playerAchievements.progress[achievementId];
  if (!progress) {
    return { playerAchievements, success: false, error: '成就进度不存在' };
  }

  if (!progress.completed) {
    return { playerAchievements, success: false, error: '成就未完成' };
  }

  if (progress.rewardClaimed) {
    return { playerAchievements, success: false, error: '奖励已领取' };
  }

  // 领取奖励
  progress.rewardClaimed = true;
  playerAchievements.totalRewards.gold += achievement.rewards.gold;
  playerAchievements.totalRewards.diamond += achievement.rewards.diamond;

  if (achievement.rewards.title) {
    playerAchievements.titles.push(achievement.rewards.title);
  }

  return {
    playerAchievements,
    success: true,
    rewards: achievement.rewards,
  };
}

/**
 * 检查成就完成状态
 */
export function checkAchievementCompletion(
  playerAchievements: PlayerAchievements,
  achievementId: string
): { completed: boolean; current: number; target: number; percent: number } {
  const achievement = getAchievement(achievementId);
  const progress = playerAchievements.progress[achievementId];

  if (!achievement || !progress) {
    return { completed: false, current: 0, target: 0, percent: 0 };
  }

  return {
    completed: progress.completed,
    current: progress.current,
    target: achievement.requirement.target,
    percent: Math.floor((progress.current / achievement.requirement.target) * 100),
  };
}

/**
 * 获取可领取奖励的成就
 */
export function getClaimableAchievements(
  playerAchievements: PlayerAchievements
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    const progress = playerAchievements.progress[a.id];
    return progress && progress.completed && !progress.rewardClaimed;
  });
}

/**
 * 获取已完成的成就
 */
export function getCompletedAchievements(
  playerAchievements: PlayerAchievements
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    const progress = playerAchievements.progress[a.id];
    return progress && progress.completed;
  });
}

/**
 * 获取未完成的成就
 */
export function getIncompleteAchievements(
  playerAchievements: PlayerAchievements
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    const progress = playerAchievements.progress[a.id];
    return !progress || !progress.completed;
  });
}

/**
 * 获取隐藏成就（仅当完成时显示）
 */
export function getHiddenAchievements(
  playerAchievements: PlayerAchievements,
  showCompleted: boolean = false
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (!a.hidden) return false;
    const progress = playerAchievements.progress[a.id];
    return showCompleted ? progress?.completed : false;
  });
}

/**
 * 计算成就总分
 */
export function calculateAchievementScore(
  playerAchievements: PlayerAchievements
): number {
  const categoryScores = {
    beginner: 1,
    advanced: 3,
    master: 5,
    legend: 10,
  };

  let totalScore = 0;
  for (const progress of Object.values(playerAchievements.progress)) {
    if (progress.completed) {
      const achievement = getAchievement(progress.achievementId);
      if (achievement) {
        totalScore += categoryScores[achievement.category];
      }
    }
  }

  return totalScore;
}

/**
 * 获取玩家成就统计
 */
export function getAchievementStats(
  playerAchievements: PlayerAchievements
): {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
  totalGoldEarned: number;
  totalDiamondEarned: number;
  titlesEarned: number;
  achievementScore: number;
  byCategory: { [category in AchievementCategory]: { completed: number; total: number } };
  byType: { [type in AchievementType]: { completed: number; total: number } };
} {
  const byCategory: { [category in AchievementCategory]: { completed: number; total: number } } = {
    beginner: { completed: 0, total: 0 },
    advanced: { completed: 0, total: 0 },
    master: { completed: 0, total: 0 },
    legend: { completed: 0, total: 0 },
  };

  const byType: { [type in AchievementType]: { completed: number; total: number } } = {
    tower: { completed: 0, total: 0 },
    arena: { completed: 0, total: 0 },
    pet: { completed: 0, total: 0 },
    friend: { completed: 0, total: 0 },
    level: { completed: 0, total: 0 },
    general: { completed: 0, total: 0 },
  };

  let inProgress = 0;
  let notStarted = 0;

  for (const achievement of ACHIEVEMENTS) {
    const progress = playerAchievements.progress[achievement.id];
    const completed = progress?.completed ?? false;

    byCategory[achievement.category].total += 1;
    byType[achievement.type].total += 1;

    if (completed) {
      byCategory[achievement.category].completed += 1;
      byType[achievement.type].completed += 1;
    } else if (progress && progress.current > 0) {
      inProgress += 1;
    } else {
      notStarted += 1;
    }
  }

  return {
    total: ACHIEVEMENTS.length,
    completed: playerAchievements.totalCompleted,
    inProgress,
    notStarted,
    completionRate: playerAchievements.completionRate,
    totalGoldEarned: playerAchievements.totalRewards.gold,
    totalDiamondEarned: playerAchievements.totalRewards.diamond,
    titlesEarned: playerAchievements.titles.length,
    achievementScore: calculateAchievementScore(playerAchievements),
    byCategory,
    byType,
  };
}

// ==================== 导出 ====================

export { ACHIEVEMENTS };
