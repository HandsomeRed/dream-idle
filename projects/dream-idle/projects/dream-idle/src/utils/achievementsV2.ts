/**
 * Achievement System - v0.30
 * 成就系统：成就追踪、奖励领取、进度显示
 */

// ==================== 枚举和类型定义 ====================

/**
 * 成就分类
 */
export enum AchievementCategory {
  Beginner = 'beginner',     // 新手
  Advanced = 'advanced',     // 进阶
  Master = 'master',         // 大师
  Legend = 'legend',         // 传奇
}

/**
 * 成就类型
 */
export enum AchievementType {
  Level = 'level',           // 等级相关
  Dungeon = 'dungeon',       // 副本相关
  Enhancement = 'enhancement', // 强化相关
  Pet = 'pet',               // 宠物相关
  Tower = 'tower',           // 爬塔相关
  Arena = 'arena',           // 竞技场相关
  Collection = 'collection', // 收集相关
}

/**
 * 成就奖励类型
 */
export enum RewardType {
  Gold = 'gold',
  Diamond = 'diamond',
  Title = 'title',
  Item = 'item',
}

/**
 * 成就奖励
 */
export interface AchievementReward {
  type: RewardType;
  amount?: number;  // 数量（gold/diamond/item 需要）
  itemId?: string;  // 物品 ID（当 type 为 item 时）
  titleId?: string; // 称号 ID（当 type 为 title 时）
}

/**
 * 成就定义
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  condition: AchievementCondition;
  rewards: AchievementReward[];
  hidden?: boolean;  // 是否为隐藏成就
}

/**
 * 成就条件
 */
export interface AchievementCondition {
  type: string;
  target: number;
  description?: string;
}

/**
 * 玩家成就进度
 */
export interface AchievementProgress {
  achievementId: string;
  current: number;
  completed: boolean;
  rewardClaimed: boolean;
  completedAt?: number;
}

/**
 * 玩家成就状态
 */
export interface AchievementState {
  progresses: AchievementProgress[];
  titles: string[];  // 已获得的称号
  equippedTitle?: string;  // 当前装备的称号
}

/**
 * 成就完成结果
 */
export interface AchievementCompleteResult {
  completed: boolean;
  newlyCompleted: Achievement[];
  rewards: AchievementReward[];
}

// ==================== 常量配置 ====================

/**
 * 成就列表
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ==================== 新手成就 ====================
  {
    id: 'beginner_level_10',
    name: '初出茅庐',
    description: '角色达到 10 级',
    category: AchievementCategory.Beginner,
    type: AchievementType.Level,
    condition: { type: 'level', target: 10, description: '达到 10 级' },
    rewards: [{ type: RewardType.Gold, amount: 1000 }],
  },
  {
    id: 'beginner_level_20',
    name: '小有所成',
    description: '角色达到 20 级',
    category: AchievementCategory.Beginner,
    type: AchievementType.Level,
    condition: { type: 'level', target: 20, description: '达到 20 级' },
    rewards: [{ type: RewardType.Gold, amount: 2000 }, { type: RewardType.Diamond, amount: 50 }],
  },
  {
    id: 'beginner_level_50',
    name: '登堂入室',
    description: '角色达到 50 级',
    category: AchievementCategory.Beginner,
    type: AchievementType.Level,
    condition: { type: 'level', target: 50, description: '达到 50 级' },
    rewards: [{ type: RewardType.Gold, amount: 5000 }, { type: RewardType.Diamond, amount: 100 }],
  },
  {
    id: 'beginner_dungeon_1',
    name: '副本初体验',
    description: '首次通关副本',
    category: AchievementCategory.Beginner,
    type: AchievementType.Dungeon,
    condition: { type: 'dungeon_clear', target: 1, description: '通关 1 次副本' },
    rewards: [{ type: RewardType.Gold, amount: 500 }],
  },
  {
    id: 'beginner_pet_1',
    name: '宠物大师',
    description: '获得第一只宠物',
    category: AchievementCategory.Beginner,
    type: AchievementType.Pet,
    condition: { type: 'pet_obtain', target: 1, description: '获得 1 只宠物' },
    rewards: [{ type: RewardType.Gold, amount: 500 }],
  },
  
  // ==================== 进阶成就 ====================
  {
    id: 'advanced_level_80',
    name: '一代宗师',
    description: '角色达到 80 级',
    category: AchievementCategory.Advanced,
    type: AchievementType.Level,
    condition: { type: 'level', target: 80, description: '达到 80 级' },
    rewards: [{ type: RewardType.Gold, amount: 10000 }, { type: RewardType.Diamond, amount: 200 }],
  },
  {
    id: 'advanced_level_100',
    name: '登峰造极',
    description: '角色达到 100 级',
    category: AchievementCategory.Advanced,
    type: AchievementType.Level,
    condition: { type: 'level', target: 100, description: '达到 100 级' },
    rewards: [{ type: RewardType.Gold, amount: 20000 }, { type: RewardType.Diamond, amount: 500 }, { type: RewardType.Title, titleId: 'level_100' }],
  },
  {
    id: 'advanced_dungeon_10',
    name: '副本常客',
    description: '通关 10 次副本',
    category: AchievementCategory.Advanced,
    type: AchievementType.Dungeon,
    condition: { type: 'dungeon_clear', target: 10, description: '通关 10 次副本' },
    rewards: [{ type: RewardType.Gold, amount: 5000 }, { type: RewardType.Diamond, amount: 100 }],
  },
  {
    id: 'advanced_dungeon_3star',
    name: '完美通关',
    description: '3 星通关 5 个不同副本',
    category: AchievementCategory.Advanced,
    type: AchievementType.Dungeon,
    condition: { type: 'dungeon_3star', target: 5, description: '3 星通关 5 个副本' },
    rewards: [{ type: RewardType.Diamond, amount: 200 }],
  },
  {
    id: 'advanced_enhance_10',
    name: '强化大师',
    description: '装备强化到 +10',
    category: AchievementCategory.Advanced,
    type: AchievementType.Enhancement,
    condition: { type: 'enhance_level', target: 10, description: '强化到 +10' },
    rewards: [{ type: RewardType.Gold, amount: 5000 }, { type: RewardType.Diamond, amount: 100 }],
  },
  {
    id: 'advanced_pet_10',
    name: '宠物收藏家',
    description: '收集 10 只宠物',
    category: AchievementCategory.Advanced,
    type: AchievementType.Pet,
    condition: { type: 'pet_obtain', target: 10, description: '收集 10 只宠物' },
    rewards: [{ type: RewardType.Gold, amount: 5000 }, { type: RewardType.Diamond, amount: 100 }],
  },
  
  // ==================== 大师成就 ====================
  {
    id: 'master_dungeon_100',
    name: '副本王者',
    description: '通关 100 次副本',
    category: AchievementCategory.Master,
    type: AchievementType.Dungeon,
    condition: { type: 'dungeon_clear', target: 100, description: '通关 100 次副本' },
    rewards: [{ type: RewardType.Gold, amount: 20000 }, { type: RewardType.Diamond, amount: 500 }, { type: RewardType.Title, titleId: 'dungeon_king' }],
  },
  {
    id: 'master_enhance_15',
    name: '强化之神',
    description: '装备强化到 +15',
    category: AchievementCategory.Master,
    type: AchievementType.Enhancement,
    condition: { type: 'enhance_level', target: 15, description: '强化到 +15' },
    rewards: [{ type: RewardType.Gold, amount: 50000 }, { type: RewardType.Diamond, amount: 1000 }, { type: RewardType.Title, titleId: 'enhance_god' }],
  },
  {
    id: 'master_pet_legendary',
    name: '传说驯兽师',
    description: '获得传说品质宠物',
    category: AchievementCategory.Master,
    type: AchievementType.Pet,
    condition: { type: 'pet_legendary', target: 1, description: '获得 1 只传说宠物' },
    rewards: [{ type: RewardType.Diamond, amount: 500 }, { type: RewardType.Title, titleId: 'legendary_tamer' }],
  },
  
  // ==================== 传奇成就 ====================
  {
    id: 'legend_all_dungeons',
    name: '全副本制霸',
    description: '3 星通关所有副本',
    category: AchievementCategory.Legend,
    type: AchievementType.Dungeon,
    condition: { type: 'all_dungeons_3star', target: 15, description: '3 星通关 15 个副本' },
    rewards: [{ type: RewardType.Diamond, amount: 2000 }, { type: RewardType.Title, titleId: 'dungeon_master' }],
  },
  {
    id: 'legend_all_pets',
    name: '宠物大师',
    description: '收集所有宠物',
    category: AchievementCategory.Legend,
    type: AchievementType.Pet,
    condition: { type: 'pet_all', target: 12, description: '收集 12 只宠物' },
    rewards: [{ type: RewardType.Diamond, amount: 3000 }, { type: RewardType.Title, titleId: 'pet_master' }],
  },
];

/**
 * 成就分类权重（用于排序）
 */
export const CATEGORY_WEIGHTS: Record<AchievementCategory, number> = {
  [AchievementCategory.Beginner]: 1,
  [AchievementCategory.Advanced]: 2,
  [AchievementCategory.Master]: 3,
  [AchievementCategory.Legend]: 4,
};

// ==================== 成就进度管理 ====================

/**
 * 初始化成就状态
 */
export function initializeAchievementState(): AchievementState {
  return {
    progresses: ACHIEVEMENTS.map(achievement => ({
      achievementId: achievement.id,
      current: 0,
      completed: false,
      rewardClaimed: false,
    })),
    titles: [],
    equippedTitle: undefined,
  };
}

/**
 * 获取成就进度
 */
export function getAchievementProgress(
  state: AchievementState,
  achievementId: string
): AchievementProgress | undefined {
  return state.progresses.find(p => p.achievementId === achievementId);
}

/**
 * 更新成就进度
 */
export function updateAchievementProgress(
  state: AchievementState,
  type: string,
  value: number
): AchievementCompleteResult {
  const newlyCompleted: Achievement[] = [];
  const rewards: AchievementReward[] = [];
  
  state.progresses.forEach(progress => {
    if (progress.completed) return;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === progress.achievementId);
    if (!achievement) return;
    
    // 检查成就类型是否匹配
    if (achievement.condition.type !== type) return;
    
    // 更新进度
    progress.current = Math.max(progress.current, value);
    
    // 检查是否完成
    if (progress.current >= achievement.condition.target) {
      progress.completed = true;
      progress.completedAt = Date.now();
      newlyCompleted.push(achievement);
      rewards.push(...achievement.rewards);
    }
  });
  
  return {
    completed: newlyCompleted.length > 0,
    newlyCompleted,
    rewards,
  };
}

/**
 * 递增成就进度
 */
export function incrementAchievementProgress(
  state: AchievementState,
  type: string,
  amount: number = 1
): AchievementCompleteResult {
  const newlyCompleted: Achievement[] = [];
  const rewards: AchievementReward[] = [];
  
  state.progresses.forEach(progress => {
    if (progress.completed) return;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === progress.achievementId);
    if (!achievement) return;
    
    // 检查成就类型是否匹配
    if (achievement.condition.type !== type) return;
    
    // 递增进度
    progress.current += amount;
    
    // 检查是否完成
    if (progress.current >= achievement.condition.target) {
      progress.completed = true;
      progress.completedAt = Date.now();
      newlyCompleted.push(achievement);
      rewards.push(...achievement.rewards);
    }
  });
  
  return {
    completed: newlyCompleted.length > 0,
    newlyCompleted,
    rewards,
  };
}

/**
 * 领取成就奖励
 */
export function claimAchievementReward(
  state: AchievementState,
  achievementId: string
): { success: boolean; rewards?: AchievementReward[]; message: string } {
  const progress = state.progresses.find(p => p.achievementId === achievementId);
  
  if (!progress) {
    return {
      success: false,
      message: '成就未找到',
    };
  }
  
  if (!progress.completed) {
    return {
      success: false,
      message: '成就未完成',
    };
  }
  
  if (progress.rewardClaimed) {
    return {
      success: false,
      message: '奖励已领取',
    };
  }
  
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) {
    return {
      success: false,
      message: '成就数据错误',
    };
  }
  
  progress.rewardClaimed = true;
  
  // 处理称号奖励
  achievement.rewards.forEach(reward => {
    if (reward.type === RewardType.Title && reward.titleId) {
      if (!state.titles.includes(reward.titleId)) {
        state.titles.push(reward.titleId);
      }
    }
  });
  
  return {
    success: true,
    rewards: achievement.rewards,
    message: '🎉 奖励已领取',
  };
}

/**
 * 装备称号
 */
export function equipTitle(
  state: AchievementState,
  titleId: string
): { success: boolean; message: string } {
  if (!state.titles.includes(titleId)) {
    return {
      success: false,
      message: '未获得该称号',
    };
  }
  
  state.equippedTitle = titleId;
  
  return {
    success: true,
    message: '称号已装备',
  };
}

/**
 * 卸下称号
 */
export function unequipTitle(state: AchievementState): void {
  state.equippedTitle = undefined;
}

// ==================== 统计查询 ====================

/**
 * 获取已完成的成就数量
 */
export function countCompletedAchievements(state: AchievementState): number {
  return state.progresses.filter(p => p.completed).length;
}

/**
 * 获取已领取奖励的成就数量
 */
export function countClaimedAchievements(state: AchievementState): number {
  return state.progresses.filter(p => p.rewardClaimed).length;
}

/**
 * 按分类获取成就
 */
export function getAchievementsByCategory(
  category: AchievementCategory
): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

/**
 * 获取未完成的成就
 */
export function getIncompleteAchievements(state: AchievementState): Achievement[] {
  const completedIds = new Set(
    state.progresses.filter(p => p.completed).map(p => p.achievementId)
  );
  return ACHIEVEMENTS.filter(a => !completedIds.has(a.id));
}

/**
 * 获取可领取奖励的成就
 */
export function getClaimableAchievements(state: AchievementState): Achievement[] {
  const claimableIds = new Set(
    state.progresses
      .filter(p => p.completed && !p.rewardClaimed)
      .map(p => p.achievementId)
  );
  return ACHIEVEMENTS.filter(a => claimableIds.has(a.id));
}

/**
 * 获取成就完成度百分比
 */
export function getAchievementCompletionRate(state: AchievementState): number {
  const total = ACHIEVEMENTS.length;
  const completed = countCompletedAchievements(state);
  return Math.floor((completed / total) * 100);
}

/**
 * 按类型查询成就进度
 */
export function getProgressByType(
  state: AchievementState,
  type: string
): { achievementId: string; current: number; target: number; completed: boolean }[] {
  return state.progresses
    .filter(p => {
      const achievement = ACHIEVEMENTS.find(a => a.id === p.achievementId);
      return achievement?.condition.type === type;
    })
    .map(p => {
      const achievement = ACHIEVEMENTS.find(a => a.id === p.achievementId)!;
      return {
        achievementId: p.achievementId,
        current: p.current,
        target: achievement.condition.target,
        completed: p.completed,
      };
    });
}

// ==================== 称号系统 ====================

/**
 * 称号定义
 */
export interface Title {
  id: string;
  name: string;
  description: string;
  effect?: string;  // 称号效果描述
}

/**
 * 称号列表
 */
export const TITLES: Title[] = [
  { id: 'level_100', name: '百年好合', description: '角色达到 100 级', effect: '经验 +10%' },
  { id: 'dungeon_king', name: '副本王者', description: '通关 100 次副本', effect: '副本奖励 +20%' },
  { id: 'enhance_god', name: '强化之神', description: '装备强化到 +15', effect: '强化成功率 +5%' },
  { id: 'legendary_tamer', name: '传说驯兽师', description: '获得传说品质宠物', effect: '宠物经验 +15%' },
  { id: 'dungeon_master', name: '副本大师', description: '3 星通关所有副本', effect: '体力恢复 +50%' },
  { id: 'pet_master', name: '宠物大师', description: '收集所有宠物', effect: '宠物属性 +10%' },
];

/**
 * 获取称号信息
 */
export function getTitleInfo(titleId: string): Title | undefined {
  return TITLES.find(t => t.id === titleId);
}

/**
 * 获取当前装备称号的效果
 */
export function getEquippedTitleEffect(state: AchievementState): string | undefined {
  if (!state.equippedTitle) return undefined;
  const title = getTitleInfo(state.equippedTitle);
  return title?.effect;
}
