/**
 * v0.16 社交系统扩展 - Social System Extension
 * 梦幻放置游戏社交功能扩展
 * 
 * Features:
 * - 玩家拜访
 * - 礼物赠送
 * - 社交互动（点赞/评论）
 * - 社交点数/声望
 * - 好友推荐
 * - 社交成就
 * - 黑名单管理
 */

export type SocialActionType = 'visit' | 'gift' | 'like' | 'comment' | 'share';

export interface SocialInteraction {
  id: string;
  actorId: string;
  actorName: string;
  targetId: string;
  targetType: 'player' | 'post' | 'achievement';
  actionType: SocialActionType;
  content?: string; // 评论内容
  giftId?: string;  // 礼物 ID
  giftCount?: number;
  timestamp: number;
  isRead: boolean;
}

export interface PlayerSocialState {
  userId: string;
  socialPoints: number;
  reputation: number; // 声望值
  visitedBy: Map<string, number>; // playerId -> lastVisitTime
  visitedToday: number;
  receivedGifts: Map<string, number>; // giftId -> count
  receivedLikes: number;
  receivedComments: number;
  blockedUsers: string[];
  friendSuggestions: string[];
}

export interface SocialConfig {
  maxDailyVisits: number; // 每日最大拜访次数
  visitCooldownMs: number; // 拜访冷却时间
  maxFriends: number; // 最大好友数
  enableGiftSystem: boolean; // 是否启用礼物系统
  enableReputation: boolean; // 是否启用声望系统
  socialPointRates: {
    visit: number;
    gift: number;
    like: number;
    comment: number;
  };
}

export interface SocialReward {
  type: 'gold' | 'item' | 'points' | 'reputation';
  amount: number;
  itemId?: string;
  itemName?: string;
  itemCount?: number;
}

export class SocialSystem {
  private interactions: Map<string, SocialInteraction>;
  private playerStates: Map<string, PlayerSocialState>;
  private config: SocialConfig;
  private dailyResetTime: number; // 每日重置时间戳

  constructor(config?: Partial<SocialConfig>) {
    this.interactions = new Map();
    this.playerStates = new Map();
    this.dailyResetTime = this.getNextDailyReset();
    this.config = {
      maxDailyVisits: 20,
      visitCooldownMs: 300000, // 5 分钟
      maxFriends: 100,
      enableGiftSystem: true,
      enableReputation: true,
      socialPointRates: {
        visit: 1,
        gift: 5,
        like: 1,
        comment: 2,
      },
      ...config,
    };
  }

  /**
   * 获取下一个每日重置时间
   */
  private getNextDailyReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * 检查并重置每日计数
   */
  private checkDailyReset(): void {
    const now = Date.now();
    if (now >= this.dailyResetTime) {
      this.playerStates.forEach(state => {
        state.visitedToday = 0;
      });
      this.dailyResetTime = this.getNextDailyReset();
    }
  }

  /**
   * 初始化玩家社交状态
   */
  initializePlayerState(userId: string): PlayerSocialState {
    if (!this.playerStates.has(userId)) {
      const state: PlayerSocialState = {
        userId,
        socialPoints: 0,
        reputation: 0,
        visitedBy: new Map(),
        visitedToday: 0,
        receivedGifts: new Map(),
        receivedLikes: 0,
        receivedComments: 0,
        blockedUsers: [],
        friendSuggestions: [],
      };
      this.playerStates.set(userId, state);
    }
    return this.playerStates.get(userId)!;
  }

  /**
   * 拜访玩家
   */
  visitPlayer(visitorId: string, visitorName: string, targetId: string): {
    success: boolean;
    error?: string;
    reward?: SocialReward;
  } {
    this.checkDailyReset();

    const visitorState = this.initializePlayerState(visitorId);
    const targetState = this.initializePlayerState(targetId);

    // 检查是否被拉黑
    if (targetState.blockedUsers.includes(visitorId)) {
      return { success: false, error: '对方已将您拉入黑名单' };
    }

    // 检查每日拜访次数
    if (visitorState.visitedToday >= this.config.maxDailyVisits) {
      return { 
        success: false, 
        error: `今日拜访次数已达上限（${this.config.maxDailyVisits}）` 
      };
    }

    // 检查拜访冷却
    const lastVisit = visitorState.visitedBy.get(targetId);
    if (lastVisit && Date.now() - lastVisit < this.config.visitCooldownMs) {
      const remaining = Math.ceil((this.config.visitCooldownMs - (Date.now() - lastVisit)) / 60000);
      return { success: false, error: `拜访冷却中，请等待${remaining}分钟` };
    }

    // 创建互动记录
    const interaction: SocialInteraction = {
      id: this.generateId(),
      actorId: visitorId,
      actorName: visitorName,
      targetId,
      targetType: 'player',
      actionType: 'visit',
      timestamp: Date.now(),
      isRead: false,
    };
    this.interactions.set(interaction.id, interaction);

    // 更新状态
    visitorState.visitedToday++;
    visitorState.visitedBy.set(targetId, Date.now());
    targetState.visitedBy.set(visitorId, Date.now());

    // 增加社交点数
    const points = this.config.socialPointRates.visit;
    visitorState.socialPoints += points;

    // 增加声望（如果启用）
    if (this.config.enableReputation) {
      targetState.reputation += 1;
    }

    return {
      success: true,
      reward: { type: 'points', amount: points },
    };
  }

  /**
   * 赠送礼物
   */
  sendGift(
    senderId: string,
    senderName: string,
    receiverId: string,
    giftId: string,
    giftName: string,
    count: number = 1
  ): {
    success: boolean;
    error?: string;
    reward?: SocialReward;
  } {
    if (!this.config.enableGiftSystem) {
      return { success: false, error: '礼物系统已禁用' };
    }

    const senderState = this.initializePlayerState(senderId);
    const receiverState = this.initializePlayerState(receiverId);

    // 检查是否被拉黑
    if (receiverState.blockedUsers.includes(senderId)) {
      return { success: false, error: '对方已将您拉入黑名单' };
    }

    // 创建互动记录
    const interaction: SocialInteraction = {
      id: this.generateId(),
      actorId: senderId,
      actorName: senderName,
      targetId: receiverId,
      targetType: 'player',
      actionType: 'gift',
      giftId,
      giftCount: count,
      timestamp: Date.now(),
      isRead: false,
    };
    this.interactions.set(interaction.id, interaction);

    // 更新接收者状态
    const currentCount = receiverState.receivedGifts.get(giftId) || 0;
    receiverState.receivedGifts.set(giftId, currentCount + count);

    // 增加社交点数
    const points = this.config.socialPointRates.gift * count;
    senderState.socialPoints += points;

    // 增加声望
    if (this.config.enableReputation) {
      receiverState.reputation += count;
    }

    return {
      success: true,
      reward: { type: 'points', amount: points },
    };
  }

  /**
   * 点赞
   */
  like(
    userId: string,
    userName: string,
    targetId: string,
    targetType: 'player' | 'post' | 'achievement'
  ): {
    success: boolean;
    error?: string;
  } {
    const userState = this.initializePlayerState(userId);

    // 创建互动记录
    const interaction: SocialInteraction = {
      id: this.generateId(),
      actorId: userId,
      actorName: userName,
      targetId,
      targetType,
      actionType: 'like',
      timestamp: Date.now(),
      isRead: false,
    };
    this.interactions.set(interaction.id, interaction);

    // 增加社交点数
    userState.socialPoints += this.config.socialPointRates.like;

    // 如果是点赞玩家，增加对方声望
    if (targetType === 'player' && this.config.enableReputation) {
      const targetState = this.initializePlayerState(targetId);
      targetState.receivedLikes++;
      targetState.reputation += 1;
    }

    return { success: true };
  }

  /**
   * 评论
   */
  comment(
    userId: string,
    userName: string,
    targetId: string,
    targetType: 'player' | 'post' | 'achievement',
    content: string
  ): {
    success: boolean;
    error?: string;
  } {
    if (content.length === 0 || content.length > 500) {
      return { success: false, error: '评论内容长度必须在 1-500 字符之间' };
    }

    const userState = this.initializePlayerState(userId);

    // 创建互动记录
    const interaction: SocialInteraction = {
      id: this.generateId(),
      actorId: userId,
      actorName: userName,
      targetId,
      targetType,
      actionType: 'comment',
      content,
      timestamp: Date.now(),
      isRead: false,
    };
    this.interactions.set(interaction.id, interaction);

    // 增加社交点数
    userState.socialPoints += this.config.socialPointRates.comment;

    // 增加对方评论计数
    if (targetType === 'player') {
      const targetState = this.initializePlayerState(targetId);
      targetState.receivedComments++;
    }

    return { success: true };
  }

  /**
   * 拉黑用户
   */
  blockUser(userId: string, targetId: string): boolean {
    const state = this.initializePlayerState(userId);
    
    if (!state.blockedUsers.includes(targetId)) {
      state.blockedUsers.push(targetId);
    }
    
    return true;
  }

  /**
   * 取消拉黑
   */
  unblockUser(userId: string, targetId: string): boolean {
    const state = this.initializePlayerState(userId);
    state.blockedUsers = state.blockedUsers.filter(id => id !== targetId);
    return true;
  }

  /**
   * 获取互动记录
   */
  getInteractions(
    userId: string,
    options: {
      actionType?: SocialActionType;
      isRead?: boolean;
      limit?: number;
    } = {}
  ): SocialInteraction[] {
    const interactions = Array.from(this.interactions.values())
      .filter(i => i.targetId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (options.actionType) {
      return interactions.filter(i => i.actionType === options.actionType);
    }

    if (options.isRead !== undefined) {
      return interactions.filter(i => i.isRead === options.isRead);
    }

    return interactions.slice(0, options.limit || 50);
  }

  /**
   * 标记互动为已读
   */
  markInteractionsAsRead(userId: string, interactionIds?: string[]): number {
    let count = 0;
    
    if (interactionIds) {
      interactionIds.forEach(id => {
        const interaction = this.interactions.get(id);
        if (interaction && interaction.targetId === userId) {
          interaction.isRead = true;
          count++;
        }
      });
    } else {
      // 标记所有为已读
      this.interactions.forEach(interaction => {
        if (interaction.targetId === userId && !interaction.isRead) {
          interaction.isRead = true;
          count++;
        }
      });
    }

    return count;
  }

  /**
   * 获取未读互动数
   */
  getUnreadInteractionCount(userId: string): number {
    return Array.from(this.interactions.values())
      .filter(i => i.targetId === userId && !i.isRead)
      .length;
  }

  /**
   * 获取玩家社交统计
   */
  getSocialStats(userId: string): {
    socialPoints: number;
    reputation: number;
    visitedToday: number;
    maxDailyVisits: number;
    totalReceivedGifts: number;
    totalReceivedLikes: number;
    totalReceivedComments: number;
    blockedCount: number;
  } | null {
    const state = this.playerStates.get(userId);
    if (!state) return null;

    let totalGifts = 0;
    state.receivedGifts.forEach(count => {
      totalGifts += count;
    });

    return {
      socialPoints: state.socialPoints,
      reputation: state.reputation,
      visitedToday: state.visitedToday,
      maxDailyVisits: this.config.maxDailyVisits,
      totalReceivedGifts: totalGifts,
      totalReceivedLikes: state.receivedLikes,
      totalReceivedComments: state.receivedComments,
      blockedCount: state.blockedUsers.length,
    };
  }

  /**
   * 获取拉黑列表
   */
  getBlockedUsers(userId: string): string[] {
    const state = this.initializePlayerState(userId);
    return state.blockedUsers;
  }

  /**
   * 更新好友推荐
   */
  updateFriendSuggestions(userId: string, suggestions: string[]): void {
    const state = this.initializePlayerState(userId);
    state.friendSuggestions = suggestions.slice(0, 20); // 最多 20 个推荐
  }

  /**
   * 获取好友推荐
   */
  getFriendSuggestions(userId: string): string[] {
    const state = this.playerStates.get(userId);
    return state?.friendSuggestions || [];
  }

  /**
   * 使用社交点数兑换奖励
   */
  redeemPoints(
    userId: string,
    points: number,
    rewardType: 'gold' | 'item'
  ): {
    success: boolean;
    reward?: SocialReward;
    error?: string;
  } {
    const state = this.initializePlayerState(userId);

    if (state.socialPoints < points) {
      return { 
        success: false, 
        error: `社交点数不足（当前：${state.socialPoints}，需要：${points}）` 
      };
    }

    state.socialPoints -= points;

    let reward: SocialReward;
    if (rewardType === 'gold') {
      reward = { type: 'gold', amount: points * 100 }; // 1 点 = 100 金币
    } else {
      reward = { 
        type: 'item', 
        amount: 1,
        itemId: 'social_gift_box',
        itemName: '社交礼盒',
        itemCount: Math.floor(points / 10),
      };
    }

    return { success: true, reward };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SocialConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取配置
   */
  getConfig(): SocialConfig {
    return { ...this.config };
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return `social_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出社交数据
   */
  exportData(): object {
    return {
      interactions: Array.from(this.interactions.entries()),
      playerStates: Array.from(this.playerStates.entries()).map(([userId, state]) => [
        userId,
        {
          ...state,
          visitedBy: Array.from(state.visitedBy.entries()),
          receivedGifts: Array.from(state.receivedGifts.entries()),
        },
      ]),
      config: this.config,
      dailyResetTime: this.dailyResetTime,
    };
  }

  /**
   * 导入社交数据
   */
  importData(data: {
    interactions: [string, SocialInteraction][];
    playerStates: [string, any][];
    config?: SocialConfig;
    dailyResetTime?: number;
  }): void {
    this.interactions.clear();
    this.playerStates.clear();

    data.interactions.forEach(([id, interaction]) => {
      this.interactions.set(id, interaction);
    });

    data.playerStates.forEach(([userId, state]) => {
      this.playerStates.set(userId, {
        ...state,
        visitedBy: new Map(state.visitedBy),
        receivedGifts: new Map(state.receivedGifts),
      });
    });

    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }

    if (data.dailyResetTime) {
      this.dailyResetTime = data.dailyResetTime;
    }
  }
}

// 导出单例实例
export const socialSystem = new SocialSystem();
