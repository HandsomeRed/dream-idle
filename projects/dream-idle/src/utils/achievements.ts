/**
 * v0.15 成就系统扩展 - Achievement System Extension
 * 梦幻放置游戏成就功能扩展
 * 
 * Features:
 * - 成就分类（战斗/社交/收集/其他）
 * - 成就进度跟踪
 * - 成就奖励领取
 * - 成就点数系统
 * - 成就称号系统
 * - 全服成就广播
 * - 隐藏成就
 */

export type AchievementCategory = 'combat' | 'social' | 'collection' | 'growth' | 'special';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  condition: AchievementCondition;
  rewards: AchievementReward[];
  title?: string; // 解锁后获得的称号
  isHidden: boolean; // 是否隐藏成就
  isRepeatable: boolean; // 是否可重复完成
}

export interface AchievementCondition {
  type: ConditionType;
  target: number;
  description: string;
}

export type ConditionType = 
  | 'level_reach'         // 达到等级
  | 'kill_count'          // 击杀数量
  | 'gold_earn'           // 获得金币
  | 'gold_spend'          // 消费金币
  | 'item_collect'        // 收集物品
  | 'friend_count'        // 好友数量
  | 'battle_win'          // 战斗胜利
  | 'login_days'          // 登录天数
  | 'achievement_points'  // 成就点数
  | 'custom';             // 自定义条件

export interface AchievementReward {
  type: 'gold' | 'item' | 'title' | 'points';
  amount?: number; // For gold/points
  itemId?: string;
  itemName?: string;
  itemCount?: number; // For items
}

export interface PlayerAchievement {
  achievementId: string;
  progress: number;
  isCompleted: boolean;
  completedAt?: number;
  isClaimed: boolean; // 奖励是否已领取
  completedCount: number; // 完成次数（可重复成就）
}

export interface PlayerAchievementState {
  userId: string;
  achievements: Map<string, PlayerAchievement>;
  totalPoints: number;
  unlockedTitles: string[];
  equippedTitle?: string;
}

export interface AchievementConfig {
  enableGlobalBroadcast: boolean; // 是否全服广播
  broadcastTiers: AchievementTier[]; // 广播哪些等级的成就
  maxEquippedTitles: number; // 最大装备称号数
}

export class AchievementSystem {
  private achievements: Map<string, Achievement>;
  private playerStates: Map<string, PlayerAchievementState>;
  private config: AchievementConfig;
  private globalBroadcasts: Array<{ playerId: string; achievementId: string; timestamp: number }>;

  constructor(config?: Partial<AchievementConfig>) {
    this.achievements = new Map();
    this.playerStates = new Map();
    this.globalBroadcasts = [];
    this.config = {
      enableGlobalBroadcast: true,
      broadcastTiers: ['gold', 'platinum', 'diamond'],
      maxEquippedTitles: 1,
      ...config,
    };
    
    this.initializeDefaultAchievements();
  }

  /**
   * 初始化默认成就
   */
  private initializeDefaultAchievements(): void {
    // 战斗类成就
    this.addAchievement({
      id: 'combat_001',
      name: '初出茅庐',
      description: '赢得 10 场战斗胜利',
      category: 'combat',
      tier: 'bronze',
      points: 10,
      condition: {
        type: 'battle_win',
        target: 10,
        description: '赢得 10 场战斗',
      },
      rewards: [{ type: 'gold', amount: 1000 }],
      isHidden: false,
      isRepeatable: false,
    });

    this.addAchievement({
      id: 'combat_002',
      name: '战场精英',
      description: '赢得 100 场战斗胜利',
      category: 'combat',
      tier: 'silver',
      points: 50,
      condition: {
        type: 'battle_win',
        target: 100,
        description: '赢得 100 场战斗',
      },
      rewards: [
        { type: 'gold', amount: 5000 },
        { type: 'item', itemId: 'item_001', itemName: '勇者勋章', itemCount: 1 },
      ],
      title: '战场精英',
      isHidden: false,
      isRepeatable: false,
    });

    this.addAchievement({
      id: 'combat_003',
      name: '战神降临',
      description: '赢得 1000 场战斗胜利',
      category: 'combat',
      tier: 'gold',
      points: 200,
      condition: {
        type: 'battle_win',
        target: 1000,
        description: '赢得 1000 场战斗',
      },
      rewards: [
        { type: 'gold', amount: 20000 },
        { type: 'item', itemId: 'item_002', itemName: '战神之证', itemCount: 1 },
      ],
      title: '战神',
      isHidden: false,
      isRepeatable: false,
    });

    // 成长类成就
    this.addAchievement({
      id: 'growth_001',
      name: '新手上路',
      description: '角色达到 10 级',
      category: 'growth',
      tier: 'bronze',
      points: 10,
      condition: {
        type: 'level_reach',
        target: 10,
        description: '达到 10 级',
      },
      rewards: [{ type: 'gold', amount: 500 }],
      isHidden: false,
      isRepeatable: false,
    });

    this.addAchievement({
      id: 'growth_002',
      name: '中流砥柱',
      description: '角色达到 50 级',
      category: 'growth',
      tier: 'silver',
      points: 50,
      condition: {
        type: 'level_reach',
        target: 50,
        description: '达到 50 级',
      },
      rewards: [
        { type: 'gold', amount: 5000 },
        { type: 'points', amount: 50 },
      ],
      title: '中流砥柱',
      isHidden: false,
      isRepeatable: false,
    });

    this.addAchievement({
      id: 'growth_003',
      name: '一代宗师',
      description: '角色达到 100 级',
      category: 'growth',
      tier: 'gold',
      points: 200,
      condition: {
        type: 'level_reach',
        target: 100,
        description: '达到 100 级',
      },
      rewards: [
        { type: 'gold', amount: 20000 },
        { type: 'item', itemId: 'item_003', itemName: '宗师徽章', itemCount: 1 },
      ],
      title: '一代宗师',
      isHidden: false,
      isRepeatable: false,
    });

    // 社交类成就
    this.addAchievement({
      id: 'social_001',
      name: '广交朋友',
      description: '拥有 10 个好友',
      category: 'social',
      tier: 'bronze',
      points: 20,
      condition: {
        type: 'friend_count',
        target: 10,
        description: '拥有 10 个好友',
      },
      rewards: [{ type: 'gold', amount: 1000 }],
      isHidden: false,
      isRepeatable: false,
    });

    this.addAchievement({
      id: 'social_002',
      name: '人气王',
      description: '拥有 50 个好友',
      category: 'social',
      tier: 'silver',
      points: 100,
      condition: {
        type: 'friend_count',
        target: 50,
        description: '拥有 50 个好友',
      },
      rewards: [
        { type: 'gold', amount: 10000 },
        { type: 'points', amount: 50 },
      ],
      title: '人气王',
      isHidden: false,
      isRepeatable: false,
    });

    // 收集类成就
    this.addAchievement({
      id: 'collection_001',
      name: '小试牛刀',
      description: '累计获得 10000 金币',
      category: 'collection',
      tier: 'bronze',
      points: 20,
      condition: {
        type: 'gold_earn',
        target: 10000,
        description: '累计获得 10000 金币',
      },
      rewards: [{ type: 'gold', amount: 500 }],
      isHidden: false,
      isRepeatable: false,
    });

    this.addAchievement({
      id: 'collection_002',
      name: '富甲一方',
      description: '累计获得 100 万金币',
      category: 'collection',
      tier: 'gold',
      points: 200,
      condition: {
        type: 'gold_earn',
        target: 1000000,
        description: '累计获得 100 万金币',
      },
      rewards: [
        { type: 'gold', amount: 50000 },
        { type: 'item', itemId: 'item_004', itemName: '金元宝', itemCount: 1 },
      ],
      title: '富甲一方',
      isHidden: false,
      isRepeatable: false,
    });

    // 隐藏成就
    this.addAchievement({
      id: 'special_001',
      name: '？？？',
      description: '???',
      category: 'special',
      tier: 'diamond',
      points: 500,
      condition: {
        type: 'achievement_points',
        target: 1000,
        description: '累计获得 1000 成就点数',
      },
      rewards: [
        { type: 'gold', amount: 100000 },
        { type: 'item', itemId: 'item_005', itemName: '神秘宝藏', itemCount: 1 },
      ],
      title: '成就大师',
      isHidden: true,
      isRepeatable: false,
    });
  }

  /**
   * 添加成就
   */
  addAchievement(achievement: Achievement): boolean {
    if (this.achievements.has(achievement.id)) {
      return false;
    }
    this.achievements.set(achievement.id, achievement);
    return true;
  }

  /**
   * 初始化玩家成就状态
   */
  initializePlayerState(userId: string): PlayerAchievementState {
    if (!this.playerStates.has(userId)) {
      const state: PlayerAchievementState = {
        userId,
        achievements: new Map(),
        totalPoints: 0,
        unlockedTitles: [],
      };
      this.playerStates.set(userId, state);
      
      // 为玩家初始化所有成就进度
      this.achievements.forEach((achievement, id) => {
        state.achievements.set(id, {
          achievementId: id,
          progress: 0,
          isCompleted: false,
          isClaimed: false,
          completedCount: 0,
        });
      });
    }
    return this.playerStates.get(userId)!;
  }

  /**
   * 更新成就进度
   */
  updateProgress(userId: string, conditionType: ConditionType, value: number): {
    completed: string[]; // 新完成的成就 ID 列表
  } {
    const state = this.initializePlayerState(userId);
    const completed: string[] = [];

    state.achievements.forEach((playerAchievement, achievementId) => {
      const achievement = this.achievements.get(achievementId);
      if (!achievement || playerAchievement.isCompleted) {
        return;
      }

      // 检查条件类型是否匹配
      if (achievement.condition.type !== conditionType) {
        return;
      }

      // 更新进度
      playerAchievement.progress = Math.min(value, achievement.condition.target);

      // 检查是否完成
      if (playerAchievement.progress >= achievement.condition.target) {
        playerAchievement.isCompleted = true;
        playerAchievement.completedAt = Date.now();
        playerAchievement.completedCount++;
        
        // 增加成就点数
        state.totalPoints += achievement.points;
        
        // 解锁称号
        if (achievement.title && !state.unlockedTitles.includes(achievement.title)) {
          state.unlockedTitles.push(achievement.title);
        }

        completed.push(achievementId);

        // 全服广播
        this.broadcastAchievement(userId, achievementId, achievement);
      }
    });

    return { completed };
  }

  /**
   * 领取成就奖励
   */
  claimReward(userId: string, achievementId: string): {
    success: boolean;
    rewards?: AchievementReward[];
    error?: string;
  } {
    const state = this.initializePlayerState(userId);
    const playerAchievement = state.achievements.get(achievementId);
    
    if (!playerAchievement) {
      return { success: false, error: '成就不存在' };
    }

    if (!playerAchievement.isCompleted) {
      return { success: false, error: '成就未完成' };
    }

    if (playerAchievement.isClaimed && !this.achievements.get(achievementId)?.isRepeatable) {
      return { success: false, error: '奖励已领取' };
    }

    const achievement = this.achievements.get(achievementId)!;
    playerAchievement.isClaimed = true;

    // 对于可重复成就，重置状态以便下次完成
    if (achievement.isRepeatable) {
      playerAchievement.isCompleted = false;
      playerAchievement.progress = 0;
      playerAchievement.completedAt = undefined;
    }

    return { success: true, rewards: achievement.rewards };
  }

  /**
   * 一键领取所有可领取奖励
   */
  claimAllRewards(userId: string): {
    success: boolean;
    claimedCount: number;
    rewards: AchievementReward[];
  } {
    const state = this.initializePlayerState(userId);
    const rewards: AchievementReward[] = [];
    let claimedCount = 0;

    state.achievements.forEach((playerAchievement, achievementId) => {
      const result = this.claimReward(userId, achievementId);
      if (result.success && result.rewards) {
        rewards.push(...result.rewards);
        claimedCount++;
      }
    });

    return { success: true, claimedCount, rewards };
  }

  /**
   * 获取玩家成就列表
   */
  getPlayerAchievements(
    userId: string,
    options: {
      category?: AchievementCategory;
      status?: 'completed' | 'incomplete' | 'claimed';
      hideHidden?: boolean;
    } = {}
  ): Array<{ achievement: Achievement; playerData: PlayerAchievement }> {
    const state = this.initializePlayerState(userId);
    const results: Array<{ achievement: Achievement; playerData: PlayerAchievement }> = [];

    state.achievements.forEach((playerAchievement, achievementId) => {
      const achievement = this.achievements.get(achievementId);
      if (!achievement) return;

      // 隐藏成就处理
      if (options.hideHidden !== false && achievement.isHidden && !playerAchievement.isCompleted) {
        return;
      }

      // 分类筛选
      if (options.category && achievement.category !== options.category) {
        return;
      }

      // 状态筛选
      if (options.status) {
        if (options.status === 'completed' && !playerAchievement.isCompleted) return;
        if (options.status === 'incomplete' && playerAchievement.isCompleted) return;
        if (options.status === 'claimed' && !playerAchievement.isClaimed) return;
      }

      results.push({ achievement, playerData: playerAchievement });
    });

    // 按点数排序
    results.sort((a, b) => b.achievement.points - a.achievement.points);

    return results;
  }

  /**
   * 获取成就详情
   */
  getAchievement(achievementId: string, userId?: string): {
    achievement: Achievement;
    playerData?: PlayerAchievement;
  } | null {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return null;

    let playerData: PlayerAchievement | undefined;
    if (userId) {
      const state = this.initializePlayerState(userId);
      playerData = state.achievements.get(achievementId);
    }

    return { achievement, playerData };
  }

  /**
   * 装备称号
   */
  equipTitle(userId: string, title: string): boolean {
    const state = this.initializePlayerState(userId);
    
    if (!state.unlockedTitles.includes(title)) {
      return false;
    }

    state.equippedTitle = title;
    return true;
  }

  /**
   * 卸下称号
   */
  unequipTitle(userId: string): boolean {
    const state = this.initializePlayerState(userId);
    state.equippedTitle = undefined;
    return true;
  }

  /**
   * 获取玩家成就统计
   */
  getPlayerStats(userId: string): {
    totalPoints: number;
    completedCount: number;
    claimedCount: number;
    totalAchievements: number;
    completionRate: number;
    unlockedTitles: number;
    equippedTitle?: string;
  } | null {
    const state = this.playerStates.get(userId);
    if (!state) return null;

    let completedCount = 0;
    let claimedCount = 0;

    state.achievements.forEach(pa => {
      if (pa.isCompleted) completedCount++;
      if (pa.isClaimed) claimedCount++;
    });

    return {
      totalPoints: state.totalPoints,
      completedCount,
      claimedCount,
      totalAchievements: this.achievements.size,
      completionRate: Math.round((completedCount / this.achievements.size) * 100),
      unlockedTitles: state.unlockedTitles.length,
      equippedTitle: state.equippedTitle,
    };
  }

  /**
   * 全服成就广播
   */
  private broadcastAchievement(playerId: string, achievementId: string, achievement: Achievement): void {
    if (!this.config.enableGlobalBroadcast) return;
    if (!this.config.broadcastTiers.includes(achievement.tier)) return;

    this.globalBroadcasts.push({
      playerId,
      achievementId,
      timestamp: Date.now(),
    });

    // 保留最近 100 条广播
    if (this.globalBroadcasts.length > 100) {
      this.globalBroadcasts.shift();
    }
  }

  /**
   * 获取全服成就广播
   */
  getGlobalBroadcasts(limit: number = 10): Array<{
    playerId: string;
    achievementName: string;
    tier: AchievementTier;
    timestamp: number;
  }> {
    return this.globalBroadcasts.slice(-limit).map(broadcast => {
      const achievement = this.achievements.get(broadcast.achievementId);
      return {
        playerId: broadcast.playerId,
        achievementName: achievement?.name || '未知成就',
        tier: achievement?.tier || 'bronze',
        timestamp: broadcast.timestamp,
      };
    });
  }

  /**
   * 获取成就分类统计
   */
  getCategoryStats(userId: string): Record<AchievementCategory, { total: number; completed: number }> {
    const state = this.initializePlayerState(userId);
    const stats: Record<AchievementCategory, { total: number; completed: number }> = {
      combat: { total: 0, completed: 0 },
      social: { total: 0, completed: 0 },
      collection: { total: 0, completed: 0 },
      growth: { total: 0, completed: 0 },
      special: { total: 0, completed: 0 },
    };

    this.achievements.forEach(achievement => {
      stats[achievement.category].total++;
      
      const playerAchievement = state.achievements.get(achievement.id);
      if (playerAchievement?.isCompleted) {
        stats[achievement.category].completed++;
      }
    });

    return stats;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AchievementConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取配置
   */
  getConfig(): AchievementConfig {
    return { ...this.config };
  }

  /**
   * 导出成就数据
   */
  exportData(): object {
    return {
      achievements: Array.from(this.achievements.entries()),
      playerStates: Array.from(this.playerStates.entries()).map(([userId, state]) => [
        userId,
        {
          ...state,
          achievements: Array.from(state.achievements.entries()),
        },
      ]),
      config: this.config,
    };
  }

  /**
   * 导入成就数据
   */
  importData(data: {
    achievements: [string, Achievement][];
    playerStates: [string, any][];
    config?: AchievementConfig;
  }): void {
    this.achievements.clear();
    this.playerStates.clear();

    data.achievements.forEach(([id, achievement]) => {
      this.achievements.set(id, achievement);
    });

    data.playerStates.forEach(([userId, state]) => {
      this.playerStates.set(userId, {
        ...state,
        achievements: new Map(state.achievements),
      });
    });

    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
  }
}

// 导出单例实例
export const achievementSystem = new AchievementSystem();
