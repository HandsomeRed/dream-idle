/**
 * v0.42 成就系统扩展
 * 
 * 功能：
 * - 多维度成就分类
 * - 成就进度追踪
 * - 成就奖励领取
 * - 成就点数统计
 * - 成就展示
 */

export interface AchievementCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  order: number;
}

export interface Achievement {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: AchievementType;
    target: number;
  };
  reward: AchievementReward;
  points: number; // 成就点数
  hidden: boolean; // 隐藏成就
}

export type AchievementType = 
  | 'level'           // 角色等级
  | 'battle_count'    // 战斗次数
  | 'win_count'       // 胜利次数
  | 'pet_count'       // 宠物数量
  | 'pet_evolution'   // 宠物进化
  | 'pet_skill'       // 宠物技能
  | 'equipment_set'   // 装备套装
  | 'tower_floor'     // 爬塔层数
  | 'arena_rank'      // 竞技场排名
  | 'login_days'      // 登录天数
  | 'total_gold'      // 累计金币
  | 'total_diamond'   // 累计钻石
  | 'achievement_points'; // 成就点数

export interface AchievementReward {
  type: 'gold' | 'diamond' | 'item' | 'title';
  gold?: number;
  diamond?: number;
  item?: {
    id: string;
    name: string;
    quantity: number;
  };
  title?: {
    id: string;
    name: string;
  };
}

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: number;
}

export interface AchievementSystemState {
  progress: AchievementProgress[];
  totalPoints: number;
  completedCount: number;
  titles: string[]; // 已获得的称号
  equippedTitle?: string; // 当前装备的称号
}

/**
 * 成就分类配置
 */
export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  { id: 'growth', name: '成长之路', icon: '🌱', description: '角色成长相关成就', order: 1 },
  { id: 'battle', name: '战斗大师', icon: '⚔️', description: '战斗相关成就', order: 2 },
  { id: 'pet', name: '宠物训练师', icon: '🐾', description: '宠物养成相关成就', order: 3 },
  { id: 'equipment', name: '装备达人', icon: '⚒️', description: '装备相关成就', order: 4 },
  { id: 'challenge', name: '极限挑战', icon: '🏆', description: '高难度挑战成就', order: 5 },
  { id: 'collection', name: '收集控', icon: '📦', description: '收集类成就', order: 6 },
  { id: 'social', name: '社交达人', icon: '👥', description: '社交相关成就', order: 7 },
  { id: 'special', name: '特殊成就', icon: '⭐', description: '隐藏/特殊成就', order: 8 }
];

/**
 * 成就配置
 */
export const ACHIEVEMENTS: Achievement[] = [
  // 成长之路
  {
    id: 'level-10',
    categoryId: 'growth',
    name: '初出茅庐',
    description: '角色达到 10 级',
    icon: '🌟',
    requirement: { type: 'level', target: 10 },
    reward: { type: 'diamond', diamond: 50 },
    points: 10,
    hidden: false
  },
  {
    id: 'level-50',
    categoryId: 'growth',
    name: '小有所成',
    description: '角色达到 50 级',
    icon: '⭐',
    requirement: { type: 'level', target: 50 },
    reward: { type: 'diamond', diamond: 200 },
    points: 20,
    hidden: false
  },
  {
    id: 'level-100',
    categoryId: 'growth',
    name: '一代宗师',
    description: '角色达到 100 级',
    icon: '🌟',
    requirement: { type: 'level', target: 100 },
    reward: { type: 'diamond', diamond: 500, title: { id: 'master', name: '一代宗师' } },
    points: 50,
    hidden: false
  },
  // 战斗大师
  {
    id: 'battle-100',
    categoryId: 'battle',
    name: '新兵入伍',
    description: '完成 100 次战斗',
    icon: '⚔️',
    requirement: { type: 'battle_count', target: 100 },
    reward: { type: 'gold', gold: 10000 },
    points: 10,
    hidden: false
  },
  {
    id: 'battle-1000',
    categoryId: 'battle',
    name: '身经百战',
    description: '完成 1000 次战斗',
    icon: '🗡️',
    requirement: { type: 'battle_count', target: 1000 },
    reward: { type: 'gold', gold: 50000 },
    points: 30,
    hidden: false
  },
  {
    id: 'win-100',
    categoryId: 'battle',
    name: '常胜将军',
    description: '获得 100 场胜利',
    icon: '🏅',
    requirement: { type: 'win_count', target: 100 },
    reward: { type: 'diamond', diamond: 100 },
    points: 20,
    hidden: false
  },
  {
    id: 'win-1000',
    categoryId: 'battle',
    name: '战无不胜',
    description: '获得 1000 场胜利',
    icon: '👑',
    requirement: { type: 'win_count', target: 1000 },
    reward: { type: 'diamond', diamond: 500, title: { id: 'undefeated', name: '战无不胜' } },
    points: 50,
    hidden: false
  },
  // 宠物训练师
  {
    id: 'pet-5',
    categoryId: 'pet',
    name: '宠物收藏家',
    description: '拥有 5 只宠物',
    icon: '🐾',
    requirement: { type: 'pet_count', target: 5 },
    reward: { type: 'gold', gold: 5000 },
    points: 10,
    hidden: false
  },
  {
    id: 'pet-20',
    categoryId: 'pet',
    name: '宠物大师',
    description: '拥有 20 只宠物',
    icon: '🦄',
    requirement: { type: 'pet_count', target: 20 },
    reward: { type: 'diamond', diamond: 200 },
    points: 30,
    hidden: false
  },
  {
    id: 'evolution-1',
    categoryId: 'pet',
    name: '进化先驱',
    description: '完成 1 次宠物进化',
    icon: '✨',
    requirement: { type: 'pet_evolution', target: 1 },
    reward: { type: 'item', item: { id: 'evolution-stone', name: '进化石', quantity: 10 } },
    points: 20,
    hidden: false
  },
  {
    id: 'evolution-10',
    categoryId: 'pet',
    name: '进化大师',
    description: '完成 10 次宠物进化',
    icon: '💫',
    requirement: { type: 'pet_evolution', target: 10 },
    reward: { type: 'diamond', diamond: 300 },
    points: 40,
    hidden: false
  },
  {
    id: 'skill-max',
    categoryId: 'pet',
    name: '技能大师',
    description: '将任意宠物技能升到满级',
    icon: '📚',
    requirement: { type: 'pet_skill', target: 1 },
    reward: { type: 'diamond', diamond: 200 },
    points: 30,
    hidden: false
  },
  // 装备达人
  {
    id: 'set-2',
    categoryId: 'equipment',
    name: '套装新手',
    description: '激活 2 件套效果',
    icon: '🛡️',
    requirement: { type: 'equipment_set', target: 2 },
    reward: { type: 'gold', gold: 10000 },
    points: 15,
    hidden: false
  },
  {
    id: 'set-6',
    categoryId: 'equipment',
    name: '套装大师',
    description: '激活 6 件套效果',
    icon: '⚔️',
    requirement: { type: 'equipment_set', target: 6 },
    reward: { type: 'diamond', diamond: 300 },
    points: 40,
    hidden: false
  },
  // 极限挑战
  {
    id: 'tower-50',
    categoryId: 'challenge',
    name: '攀登者',
    description: '爬塔达到 50 层',
    icon: '🏔️',
    requirement: { type: 'tower_floor', target: 50 },
    reward: { type: 'diamond', diamond: 100 },
    points: 20,
    hidden: false
  },
  {
    id: 'tower-100',
    categoryId: 'challenge',
    name: '塔王',
    description: '爬塔达到 100 层',
    icon: '🗼',
    requirement: { type: 'tower_floor', target: 100 },
    reward: { type: 'diamond', diamond: 500, title: { id: 'tower-king', name: '塔王' } },
    points: 50,
    hidden: false
  },
  {
    id: 'arena-top100',
    categoryId: 'challenge',
    name: '竞技场精英',
    description: '竞技场排名进入前 100',
    icon: '🎖️',
    requirement: { type: 'arena_rank', target: 100 },
    reward: { type: 'diamond', diamond: 300 },
    points: 40,
    hidden: false
  },
  {
    id: 'arena-top10',
    categoryId: 'challenge',
    name: '竞技场传奇',
    description: '竞技场排名进入前 10',
    icon: '🏆',
    requirement: { type: 'arena_rank', target: 10 },
    reward: { type: 'diamond', diamond: 1000, title: { id: 'arena-legend', name: '竞技场传奇' } },
    points: 100,
    hidden: false
  },
  // 收集控
  {
    id: 'gold-1m',
    categoryId: 'collection',
    name: '百万富翁',
    description: '累计获得 100 万金币',
    icon: '💰',
    requirement: { type: 'total_gold', target: 1000000 },
    reward: { type: 'gold', gold: 100000 },
    points: 30,
    hidden: false
  },
  {
    id: 'diamond-1k',
    categoryId: 'collection',
    name: '钻石大亨',
    description: '累计获得 1000 钻石',
    icon: '💎',
    requirement: { type: 'total_diamond', target: 1000 },
    reward: { type: 'diamond', diamond: 200 },
    points: 30,
    hidden: false
  },
  // 特殊成就
  {
    id: 'first-blood',
    categoryId: 'special',
    name: '第一滴血',
    description: '首次击败 BOSS',
    icon: '🩸',
    requirement: { type: 'battle_count', target: 1 },
    reward: { type: 'diamond', diamond: 50 },
    points: 10,
    hidden: true
  },
  {
    id: 'lucky-draw',
    categoryId: 'special',
    name: '欧皇降临',
    description: '十连抽获得传说宠物',
    icon: '🌈',
    requirement: { type: 'pet_count', target: 1 },
    reward: { type: 'diamond', diamond: 200 },
    points: 50,
    hidden: true
  },
  {
    id: 'achievement-hunter',
    categoryId: 'special',
    name: '成就猎人',
    description: '获得 1000 成就点数',
    icon: '🎯',
    requirement: { type: 'achievement_points', target: 1000 },
    reward: { type: 'title', title: { id: 'hunter', name: '成就猎人' } },
    points: 100,
    hidden: true
  }
];

/**
 * 初始化成就系统状态
 */
export function initializeAchievementSystemState(): AchievementSystemState {
  return {
    progress: ACHIEVEMENTS.map(achievement => ({
      achievementId: achievement.id,
      progress: 0,
      completed: false,
      claimed: false
    })),
    totalPoints: 0,
    completedCount: 0,
    titles: [],
    equippedTitle: undefined
  };
}

/**
 * 更新成就进度
 */
export function updateAchievementProgress(
  state: AchievementSystemState,
  achievementType: AchievementType,
  value: number
): AchievementSystemState {
  const updatedProgress = state.progress.map(progress => {
    const achievement = ACHIEVEMENTS.find(a => a.id === progress.achievementId);
    if (!achievement || achievement.requirement.type !== achievementType) {
      return progress;
    }
    if (progress.completed) {
      return progress;
    }

    const newProgress = Math.min(achievement.requirement.target, value);
    const completed = newProgress >= achievement.requirement.target;

    return {
      ...progress,
      progress: newProgress,
      completed,
      completedAt: completed && !progress.completed ? Date.now() : progress.completedAt
    };
  });

  // 重新计算总点数和完成数
  const completedAchievements = updatedProgress.filter(p => p.completed);
  const totalPoints = completedAchievements.reduce((sum, p) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === p.achievementId);
    return sum + (achievement?.points || 0);
  }, 0);

  return {
    ...state,
    progress: updatedProgress,
    totalPoints,
    completedCount: completedAchievements.length
  };
}

/**
 * 领取成就奖励
 */
export function claimAchievementReward(
  state: AchievementSystemState,
  achievementId: string
): {
  success: boolean;
  reason?: string;
  newState: AchievementSystemState;
  reward?: AchievementReward;
} {
  const progressIndex = state.progress.findIndex(p => p.achievementId === achievementId);
  if (progressIndex === -1) {
    return { success: false, reason: '成就不存在', newState: state };
  }

  const progress = state.progress[progressIndex];
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) {
    return { success: false, reason: '成就配置错误', newState: state };
  }

  if (!progress.completed) {
    return { success: false, reason: '成就未完成', newState: state };
  }

  if (progress.claimed) {
    return { success: false, reason: '奖励已领取', newState: state };
  }

  // 标记为已领取
  const updatedProgress = [...state.progress];
  updatedProgress[progressIndex] = { ...progress, claimed: true };

  const newState: AchievementSystemState = {
    ...state,
    progress: updatedProgress
  };

  // 发放称号奖励
  if (achievement.reward.title) {
    if (!newState.titles.includes(achievement.reward.title.id)) {
      newState.titles = [...newState.titles, achievement.reward.title.id];
    }
  }

  return {
    success: true,
    newState,
    reward: achievement.reward
  };
}

/**
 * 装备称号
 */
export function equipTitle(
  state: AchievementSystemState,
  titleId: string
): {
  success: boolean;
  reason?: string;
  newState: AchievementSystemState;
} {
  if (!state.titles.includes(titleId)) {
    return { success: false, reason: '未拥有该称号', newState: state };
  }

  return {
    success: true,
    newState: {
      ...state,
      equippedTitle: titleId
    }
  };
}

/**
 * 卸下称号
 */
export function unequipTitle(state: AchievementSystemState): AchievementSystemState {
  return {
    ...state,
    equippedTitle: undefined
  };
}

/**
 * 获取成就信息
 */
export function getAchievementInfo(achievementId: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === achievementId);
}

/**
 * 获取分类下的成就
 */
export function getAchievementsByCategory(categoryId: string): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.categoryId === categoryId);
}

/**
 * 获取成就进度百分比
 */
export function getAchievementProgressPercent(achievementId: string, currentProgress: number): number {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return 0;
  return Math.min(100, Math.round((currentProgress / achievement.requirement.target) * 100));
}

/**
 * 获取分类完成度
 */
export function getCategoryCompletion(categoryId: string, state: AchievementSystemState): {
  completed: number;
  total: number;
  percent: number;
} {
  const categoryAchievements = ACHIEVEMENTS.filter(a => a.categoryId === categoryId);
  const completed = categoryAchievements.filter(a => {
    const progress = state.progress.find(p => p.achievementId === a.id);
    return progress?.completed;
  }).length;

  return {
    completed,
    total: categoryAchievements.length,
    percent: categoryAchievements.length > 0 ? Math.round((completed / categoryAchievements.length) * 100) : 0
  };
}

/**
 * 获取隐藏成就（仅当完成时显示）
 */
export function getHiddenAchievements(state: AchievementSystemState): Achievement[] {
  return ACHIEVEMENTS.filter(a => {
    if (!a.hidden) return false;
    const progress = state.progress.find(p => p.achievementId === a.id);
    return progress?.completed;
  });
}

/**
 * 保存成就系统状态到 localStorage
 */
export function saveAchievementSystemState(state: AchievementSystemState): void {
  localStorage.setItem('dream-idle-achievement-system', JSON.stringify(state));
}

/**
 * 从 localStorage 加载成就系统状态
 */
export function loadAchievementSystemState(): AchievementSystemState {
  const saved = localStorage.getItem('dream-idle-achievement-system');
  if (saved) {
    return JSON.parse(saved);
  }
  return initializeAchievementSystemState();
}

/**
 * 获取成就类型名称
 */
export function getAchievementTypeName(type: AchievementType): string {
  const names: Record<AchievementType, string> = {
    level: '等级',
    battle_count: '战斗次数',
    win_count: '胜利次数',
    pet_count: '宠物数量',
    pet_evolution: '宠物进化',
    pet_skill: '宠物技能',
    equipment_set: '装备套装',
    tower_floor: '爬塔层数',
    arena_rank: '竞技场排名',
    login_days: '登录天数',
    total_gold: '累计金币',
    total_diamond: '累计钻石',
    achievement_points: '成就点数'
  };
  return names[type] || '未知';
}
