// 成就徽章系统 v2 - v0.76
// Achievement Badges Extended - 动态成就/隐藏成就/成就链/成就点数

/**
 * 成就分类
 */
export type AchievementCategory = 'growth' | 'battle' | 'collection' | 'social' | 'special' | 'seasonal' | 'challenge';

/**
 * 成就难度
 */
export type AchievementDifficulty = 'easy' | 'medium' | 'hard' | 'legend';

/**
 * 成就类型
 */
export type AchievementType = 'cumulative' | 'oneTime' | 'progressive' | 'chain' | 'hidden';

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
 * 成就配置
 */
export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  type: AchievementType;
  /** 达成条件 */
  condition: { type: string; target: number; description: string };
  /** 成就点数 */
  points: number;
  /** 奖励 */
  rewards: RewardItem[];
  /** 前置成就 ID 列表 */
  prerequisites?: string[];
  /** 是否隐藏 */
  isHidden: boolean;
  /** 隐藏成就的揭示条件 */
  revealCondition?: { type: string; value: any };
  /** 图标 */
  icon: string;
  /** 稀有度 */
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 玩家成就进度
 */
export interface PlayerAchievement {
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: number;
  revealed: boolean; // 隐藏成就是否已揭示
}

/**
 * 成就系统状态
 */
export interface AchievementState {
  playerId: string;
  /** 玩家成就进度 */
  achievements: Record<string, PlayerAchievement>;
  /** 成就点数 */
  totalPoints: number;
  /** 成就等级 */
  achievementLevel: number;
  /** 已领取奖励的成就 */
  claimedRewards: string[];
  /** 成就统计 */
  stats: AchievementStats;
  /** 最后更新时间 */
  lastUpdateTime: number;
}

/**
 * 成就统计
 */
export interface AchievementStats {
  totalCompleted: number;
  byCategory: Record<AchievementCategory, number>;
  byDifficulty: Record<AchievementDifficulty, number>;
  hiddenRevealed: number;
  chainsCompleted: number;
}

// ==================== 成就配置 ====================

export const ACHIEVEMENTS: AchievementConfig[] = [
  // 成长类
  {
    id: 'growth_001',
    name: '初出茅庐',
    description: '角色达到 10 级',
    category: 'growth',
    difficulty: 'easy',
    type: 'oneTime',
    condition: { type: 'level', target: 10, description: '角色等级达到 10 级' },
    points: 10,
    rewards: [{ type: 'gold', amount: 1000, name: '金币' }],
    isHidden: false,
    icon: '🌱',
    rarity: 'common',
  },
  {
    id: 'growth_002',
    name: '渐入佳境',
    description: '角色达到 50 级',
    category: 'growth',
    difficulty: 'medium',
    type: 'oneTime',
    condition: { type: 'level', target: 50, description: '角色等级达到 50 级' },
    points: 30,
    rewards: [{ type: 'diamond', amount: 50, name: '钻石' }],
    prerequisites: ['growth_001'],
    isHidden: false,
    icon: '🌿',
    rarity: 'rare',
  },
  {
    id: 'growth_003',
    name: '登峰造极',
    description: '角色达到 100 级',
    category: 'growth',
    difficulty: 'hard',
    type: 'oneTime',
    condition: { type: 'level', target: 100, description: '角色等级达到 100 级' },
    points: 100,
    rewards: [{ type: 'diamond', amount: 200, name: '钻石' }, { type: 'title', amount: 1, name: '巅峰称号' }],
    prerequisites: ['growth_002'],
    isHidden: false,
    icon: '🏔️',
    rarity: 'legendary',
  },
  // 战斗类
  {
    id: 'battle_001',
    name: '初战告捷',
    description: '赢得 10 场战斗',
    category: 'battle',
    difficulty: 'easy',
    type: 'cumulative',
    condition: { type: 'battleWins', target: 10, description: '累计赢得 10 场战斗' },
    points: 15,
    rewards: [{ type: 'exp', amount: 500, name: '经验' }],
    isHidden: false,
    icon: '⚔️',
    rarity: 'common',
  },
  {
    id: 'battle_002',
    name: '战无不胜',
    description: '赢得 100 场战斗',
    category: 'battle',
    difficulty: 'medium',
    type: 'cumulative',
    condition: { type: 'battleWins', target: 100, description: '累计赢得 100 场战斗' },
    points: 50,
    rewards: [{ type: 'equipBox', amount: 1, name: '装备宝箱' }],
    prerequisites: ['battle_001'],
    isHidden: false,
    icon: '🏆',
    rarity: 'rare',
  },
  {
    id: 'battle_003',
    name: '百战成神',
    description: '赢得 1000 场战斗',
    category: 'battle',
    difficulty: 'hard',
    type: 'cumulative',
    condition: { type: 'battleWins', target: 1000, description: '累计赢得 1000 场战斗' },
    points: 150,
    rewards: [{ type: 'title', amount: 1, name: '战神称号' }],
    prerequisites: ['battle_002'],
    isHidden: false,
    icon: '👑',
    rarity: 'legendary',
  },
  // 收集类
  {
    id: 'collection_001',
    name: '宠物收藏家',
    description: '收集 10 只宠物',
    category: 'collection',
    difficulty: 'easy',
    type: 'oneTime',
    condition: { type: 'petCount', target: 10, description: '拥有 10 只宠物' },
    points: 20,
    rewards: [{ type: 'petFood', amount: 50, name: '宠物粮' }],
    isHidden: false,
    icon: '🐾',
    rarity: 'common',
  },
  {
    id: 'collection_002',
    name: '英雄收集者',
    description: '收集 20 个英雄',
    category: 'collection',
    difficulty: 'medium',
    type: 'oneTime',
    condition: { type: 'heroCount', target: 20, description: '拥有 20 个英雄' },
    points: 40,
    rewards: [{ type: 'summonTicket', amount: 3, name: '召唤券' }],
    isHidden: false,
    icon: '⭐',
    rarity: 'rare',
  },
  // 隐藏成就
  {
    id: 'hidden_001',
    name: '???',
    description: '？？？',
    category: 'special',
    difficulty: 'legend',
    type: 'hidden',
    condition: { type: 'secret', target: 1, description: '??? ' },
    points: 200,
    rewards: [{ type: 'diamond', amount: 500, name: '钻石' }],
    isHidden: true,
    revealCondition: { type: 'level', value: 50 },
    icon: '❓',
    rarity: 'legendary',
  },
  // 成就链
  {
    id: 'chain_001',
    name: '新手之路',
    description: '完成新手成就链',
    category: 'special',
    difficulty: 'easy',
    type: 'chain',
    condition: { type: 'chainComplete', target: 3, description: '完成 3 个前置成就' },
    points: 50,
    rewards: [{ type: 'diamond', amount: 100, name: '钻石' }],
    prerequisites: ['growth_001', 'battle_001', 'collection_001'],
    isHidden: false,
    icon: '🔗',
    rarity: 'epic',
  },
];

// ==================== 成就等级配置 ====================

export const ACHIEVEMENT_LEVELS: { level: number; pointsRequired: number; title: string }[] = [
  { level: 1, pointsRequired: 0, title: '新手' },
  { level: 2, pointsRequired: 100, title: '入门' },
  { level: 3, pointsRequired: 300, title: '熟练' },
  { level: 4, pointsRequired: 600, title: '专家' },
  { level: 5, pointsRequired: 1000, title: '大师' },
  { level: 6, pointsRequired: 1500, title: '宗师' },
  { level: 7, pointsRequired: 2200, title: '传奇' },
  { level: 8, pointsRequired: 3000, title: '神话' },
];

export const DIFFICULTY_POINTS: Record<AchievementDifficulty, number> = {
  easy: 10,
  medium: 30,
  hard: 100,
  legend: 200,
};

// ==================== 工具函数 ====================

export function getNow(): number {
  return Date.now();
}

export function getAchievementById(id: string): AchievementConfig | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getCategoryName(category: AchievementCategory): string {
  const names: Record<AchievementCategory, string> = {
    growth: '成长',
    battle: '战斗',
    collection: '收集',
    social: '社交',
    special: '特殊',
    seasonal: '季节',
    challenge: '挑战',
  };
  return names[category];
}

export function getDifficultyName(difficulty: AchievementDifficulty): string {
  const names: Record<AchievementDifficulty, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
    legend: '传说',
  };
  return names[difficulty];
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#9e9e9e',
    rare: '#2196f3',
    epic: '#9c27b0',
    legendary: '#ff9800',
  };
  return colors[rarity] || '#9e9e9e';
}

// ==================== 核心函数 ====================

/**
 * 创建成就系统状态
 */
export function createAchievementState(playerId: string, now?: number): AchievementState {
  const achievements: Record<string, PlayerAchievement> = {};
  ACHIEVEMENTS.forEach(a => {
    achievements[a.id] = {
      achievementId: a.id,
      progress: 0,
      completed: false,
      revealed: !a.isHidden,
    };
  });

  return {
    playerId,
    achievements,
    totalPoints: 0,
    achievementLevel: 1,
    claimedRewards: [],
    stats: {
      totalCompleted: 0,
      byCategory: { growth: 0, battle: 0, collection: 0, social: 0, special: 0, seasonal: 0, challenge: 0 },
      byDifficulty: { easy: 0, medium: 0, hard: 0, legend: 0 },
      hiddenRevealed: 0,
      chainsCompleted: 0,
    },
    lastUpdateTime: now ?? getNow(),
  };
}

/**
 * 更新成就进度
 */
export function updateAchievementProgress(
  state: AchievementState,
  achievementId: string,
  progress: number,
  now?: number
): { state: AchievementState; completed: string[] } {
  const config = getAchievementById(achievementId);
  if (!config) return { state, completed: [] };

  const playerAchievement = state.achievements[achievementId];
  if (!playerAchievement || playerAchievement.completed) return { state, completed: [] };

  // 检查前置成就
  if (config.prerequisites) {
    const allPrereqsCompleted = config.prerequisites.every(
      prereqId => state.achievements[prereqId]?.completed
    );
    if (!allPrereqsCompleted) return { state, completed: [] };
  }

  const newState = { ...state, achievements: { ...state.achievements } };
  const newPlayerAchievement = { ...playerAchievement };

  if (config.type === 'cumulative' || config.type === 'progressive') {
    newPlayerAchievement.progress = Math.max(playerAchievement.progress, progress);
  } else {
    newPlayerAchievement.progress = progress >= config.condition.target ? config.condition.target : 0;
  }

  // 检查是否完成
  if (newPlayerAchievement.progress >= config.condition.target) {
    newPlayerAchievement.completed = true;
    newPlayerAchievement.completedAt = now ?? getNow();

    // 更新统计
    newState.stats.totalCompleted++;
    newState.stats.byCategory[config.category]++;
    newState.stats.byDifficulty[config.difficulty]++;
    newState.totalPoints += config.points;

    // 检查成就链
    const chainAchievements = ACHIEVEMENTS.filter(a => a.type === 'chain');
    chainAchievements.forEach(chain => {
      if (chain.prerequisites?.includes(achievementId)) {
        const chainCompleted = chain.prerequisites.every(
          prereqId => newState.achievements[prereqId]?.completed
        );
        if (chainCompleted && !newState.achievements[chain.id].completed) {
          newState.achievements[chain.id] = {
            ...newState.achievements[chain.id],
            completed: true,
            completedAt: now ?? getNow(),
            progress: chain.condition.target,
          };
          newState.stats.totalCompleted++;
          newState.stats.chainsCompleted++;
          newState.totalPoints += chain.points;
        }
      }
    });

    // 揭示隐藏成就
    ACHIEVEMENTS.filter(a => a.isHidden && a.revealCondition).forEach(hidden => {
      if (!newState.achievements[hidden.id].revealed) {
        if (hidden.revealCondition?.type === 'level' && progress >= hidden.revealCondition.value) {
          newState.achievements[hidden.id].revealed = true;
          newState.stats.hiddenRevealed++;
        }
      }
    });
  }

  newState.achievements[achievementId] = newPlayerAchievement;
  newState.lastUpdateTime = now ?? getNow();

  // 计算成就等级
  const newLevel = calculateAchievementLevel(newState.totalPoints);
  newState.achievementLevel = newLevel;

  const completed = newPlayerAchievement.completed ? [achievementId] : [];

  return { state: newState, completed };
}

/**
 * 批量更新成就
 */
export function batchUpdateAchievements(
  state: AchievementState,
  updates: { achievementId: string; progress: number }[],
  now?: number
): { state: AchievementState; completed: string[] } {
  let newState = state;
  const allCompleted: string[] = [];

  for (const update of updates) {
    const result = updateAchievementProgress(newState, update.achievementId, update.progress, now);
    newState = result.state;
    allCompleted.push(...result.completed);
  }

  return { state: newState, completed: allCompleted };
}

/**
 * 领取成就奖励
 */
export function claimAchievementReward(
  state: AchievementState,
  achievementId: string
): { state: AchievementState; success: boolean; rewards?: RewardItem[]; error?: string } {
  const config = getAchievementById(achievementId);
  if (!config) return { state, success: false, error: '成就不存在' };

  const playerAchievement = state.achievements[achievementId];
  if (!playerAchievement?.completed) return { state, success: false, error: '成就未完成' };

  if (state.claimedRewards.includes(achievementId)) {
    return { state, success: false, error: '奖励已领取' };
  }

  return {
    state: {
      ...state,
      claimedRewards: [...state.claimedRewards, achievementId],
    },
    success: true,
    rewards: config.rewards,
  };
}

/**
 * 计算成就等级
 */
export function calculateAchievementLevel(points: number): number {
  for (let i = ACHIEVEMENT_LEVELS.length - 1; i >= 0; i--) {
    if (points >= ACHIEVEMENT_LEVELS[i].pointsRequired) {
      return ACHIEVEMENT_LEVELS[i].level;
    }
  }
  return 1;
}

/**
 * 获取成就等级称号
 */
export function getAchievementLevelTitle(level: number): string {
  const levelInfo = ACHIEVEMENT_LEVELS.find(l => l.level === level);
  return levelInfo?.title || '新手';
}

/**
 * 获取可领取奖励的成就
 */
export function getClaimableRewards(state: AchievementState): AchievementConfig[] {
  return ACHIEVEMENTS.filter(a => {
    const playerAchievement = state.achievements[a.id];
    return playerAchievement?.completed && !state.claimedRewards.includes(a.id);
  });
}

/**
 * 获取已完成的成就
 */
export function getCompletedAchievements(state: AchievementState): AchievementConfig[] {
  return ACHIEVEMENTS.filter(a => state.achievements[a.id]?.completed);
}

/**
 * 获取未完成的成就
 */
export function getIncompleteAchievements(state: AchievementState): AchievementConfig[] {
  return ACHIEVEMENTS.filter(a => {
    const playerAchievement = state.achievements[a.id];
    return playerAchievement && !playerAchievement.completed && playerAchievement.revealed;
  });
}

/**
 * 获取成就进度
 */
export function getAchievementProgress(state: AchievementState, achievementId: string): {
  current: number;
  target: number;
  percentage: number;
  completed: boolean;
} | null {
  const config = getAchievementById(achievementId);
  const playerAchievement = state.achievements[achievementId];
  if (!config || !playerAchievement) return null;

  return {
    current: playerAchievement.progress,
    target: config.condition.target,
    percentage: Math.min(100, Math.round((playerAchievement.progress / config.condition.target) * 100)),
    completed: playerAchievement.completed,
  };
}

/**
 * 获取分类统计
 */
export function getCategoryStats(state: AchievementState): Record<AchievementCategory, { total: number; completed: number }> {
  const stats: Record<AchievementCategory, { total: number; completed: number }> = {
    growth: { total: 0, completed: 0 },
    battle: { total: 0, completed: 0 },
    collection: { total: 0, completed: 0 },
    social: { total: 0, completed: 0 },
    special: { total: 0, completed: 0 },
    seasonal: { total: 0, completed: 0 },
    challenge: { total: 0, completed: 0 },
  };

  ACHIEVEMENTS.forEach(a => {
    stats[a.category].total++;
    if (state.achievements[a.id]?.completed) {
      stats[a.category].completed++;
    }
  });

  return stats;
}

/**
 * 获取成就系统统计
 */
export function getAchievementStats(state: AchievementState): {
  totalAchievements: number;
  completedCount: number;
  completionRate: number;
  totalPoints: number;
  level: number;
  levelTitle: string;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  claimableCount: number;
} {
  const completedCount = Object.values(state.achievements).filter(a => a.completed).length;
  const totalAchievements = ACHIEVEMENTS.length;
  const completionRate = totalAchievements > 0 ? Math.round((completedCount / totalAchievements) * 100) : 0;

  const currentLevelInfo = ACHIEVEMENT_LEVELS.find(l => l.level === state.achievementLevel);
  const nextLevelInfo = ACHIEVEMENT_LEVELS.find(l => l.level === state.achievementLevel + 1);
  const pointsToNextLevel = nextLevelInfo ? nextLevelInfo.pointsRequired - state.totalPoints : 0;

  const claimableCount = getClaimableRewards(state).length;

  return {
    totalAchievements,
    completedCount,
    completionRate,
    totalPoints: state.totalPoints,
    level: state.achievementLevel,
    levelTitle: getAchievementLevelTitle(state.achievementLevel),
    nextLevelPoints: nextLevelInfo?.pointsRequired || 0,
    pointsToNextLevel,
    claimableCount,
  };
}

/**
 * 导出数据
 */
export function exportAchievementData(state: AchievementState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importAchievementData(json: string): AchievementState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !data.achievements) return null;
    return data as AchievementState;
  } catch {
    return null;
  }
}
