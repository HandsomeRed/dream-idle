/**
 * v0.12 交易系统 - Trade System
 * 梦幻放置游戏玩家间交易功能
 * 
 * Features:
 * - 创建交易订单
 * - 物品/金币交易
 * - 交易确认机制
 * - 交易历史记录
 * - 交易取消功能
 * - 交易税系统
 */

export interface TradeItem {
  itemId: string;
  itemName: string;
  itemCount: number;
  itemRarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface TradeOffer {
  userId: string;
  gold: number;
  items: TradeItem[];
}

export interface TradeOrder {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName?: string;
  senderOffer: TradeOffer;
  receiverOffer: TradeOffer;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  createdAt: number;
  expiresAt: number;
  confirmedBy?: string[]; // userIds who confirmed
  tax: number; // 交易税
}

export interface TradeConfig {
  taxRate: number; // 交易税率 (默认 5%)
  maxTradeGold: number; // 最大交易金币
  maxTradeItems: number; // 最大交易物品数
  tradeTimeoutMs: number; // 交易超时时间
  minLevel: number; // 最小交易等级
}

export interface PlayerTradeState {
  userId: string;
  isTradeLocked: boolean; // 是否被锁定（防止同时多笔交易）
  activeTradeId?: string;
  tradeCount: number; // 总交易次数
  totalGoldTraded: number; // 累计交易金币
  blockedUsers: string[]; // 交易黑名单
}

export class TradeSystem {
  private orders: Map<string, TradeOrder>;
  private playerStates: Map<string, PlayerTradeState>;
  private tradeHistory: Map<string, TradeOrder[]>; // userId -> history
  private config: TradeConfig;
  private readonly MAX_HISTORY_PER_USER = 50;

  constructor(config?: Partial<TradeConfig>) {
    this.orders = new Map();
    this.playerStates = new Map();
    this.tradeHistory = new Map();
    this.config = {
      taxRate: 0.05, // 5% 交易税
      maxTradeGold: 1000000,
      maxTradeItems: 10,
      tradeTimeoutMs: 300000, // 5 分钟超时
      minLevel: 10,
      ...config,
    };
  }

  /**
   * 初始化玩家交易状态
   */
  initializePlayerState(userId: string): PlayerTradeState {
    if (!this.playerStates.has(userId)) {
      const state: PlayerTradeState = {
        userId,
        isTradeLocked: false,
        tradeCount: 0,
        totalGoldTraded: 0,
        blockedUsers: [],
      };
      this.playerStates.set(userId, state);
      this.tradeHistory.set(userId, []);
    }
    return this.playerStates.get(userId)!;
  }

  /**
   * 检查玩家是否可以交易
   */
  canTrade(userId: string, playerLevel: number): { canTrade: boolean; reason?: string } {
    const state = this.playerStates.get(userId);
    
    if (!state) {
      return { canTrade: false, reason: '玩家状态未初始化' };
    }

    if (playerLevel < this.config.minLevel) {
      return { canTrade: false, reason: `等级不足，需要${this.config.minLevel}级` };
    }

    if (state.isTradeLocked) {
      return { canTrade: false, reason: '已有进行中的交易' };
    }

    if (state.activeTradeId && this.orders.has(state.activeTradeId)) {
      return { canTrade: false, reason: '已有进行中的交易' };
    }

    return { canTrade: true };
  }

  /**
   * 创建交易订单
   */
  createTradeOrder(
    senderId: string,
    senderName: string,
    receiverId: string,
    senderGold: number,
    senderItems: TradeItem[],
    receiverGold: number = 0,
    receiverItems: TradeItem[] = []
  ): { success: boolean; orderId?: string; error?: string } {
    // 检查发送者
    const senderCheck = this.canTrade(senderId, 999); // 等级检查在外部进行
    if (!senderCheck.canTrade) {
      return { success: false, error: senderCheck.reason };
    }

    // 检查接收者
    const receiverState = this.initializePlayerState(receiverId);
    if (receiverState.blockedUsers.includes(senderId)) {
      return { success: false, error: '对方已将您拉入交易黑名单' };
    }

    // 验证交易内容
    const validation = this.validateTradeOffer(senderGold, senderItems, receiverGold, receiverItems);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    // 创建订单
    const orderId = this.generateOrderId();
    const now = Date.now();
    
    const order: TradeOrder = {
      id: orderId,
      senderId,
      senderName,
      receiverId,
      senderOffer: {
        userId: senderId,
        gold: senderGold,
        items: senderItems,
      },
      receiverOffer: {
        userId: receiverId,
        gold: receiverGold,
        items: receiverItems,
      },
      status: 'pending',
      createdAt: now,
      expiresAt: now + this.config.tradeTimeoutMs,
      confirmedBy: [],
      tax: Math.floor((senderGold + receiverGold) * this.config.taxRate),
    };

    this.orders.set(orderId, order);

    // 锁定双方交易状态
    this.lockTrade(senderId, orderId);
    this.lockTrade(receiverId, orderId);

    return { success: true, orderId };
  }

  /**
   * 验证交易报价
   */
  private validateTradeOffer(
    senderGold: number,
    senderItems: TradeItem[],
    receiverGold: number,
    receiverItems: TradeItem[]
  ): { valid: boolean; reason?: string } {
    // 检查金币限制
    if (senderGold < 0 || receiverGold < 0) {
      return { valid: false, reason: '金币数量不能为负数' };
    }

    if (senderGold > this.config.maxTradeGold || receiverGold > this.config.maxTradeGold) {
      return { valid: false, reason: `交易金币超过上限 (${this.config.maxTradeGold})` };
    }

    // 检查物品数量
    if (senderItems.length > this.config.maxTradeItems || receiverItems.length > this.config.maxTradeItems) {
      return { valid: false, reason: `交易物品数量超过上限 (${this.config.maxTradeItems})` };
    }

    // 检查物品数量有效性
    for (const item of [...senderItems, ...receiverItems]) {
      if (item.itemCount <= 0) {
        return { valid: false, reason: `物品 "${item.itemName}" 数量必须大于 0` };
      }
    }

    // 检查不能为空交易
    if (senderGold === 0 && senderItems.length === 0 && receiverGold === 0 && receiverItems.length === 0) {
      return { valid: false, reason: '交易不能为空' };
    }

    return { valid: true };
  }

  /**
   * 锁定玩家交易状态
   */
  private lockTrade(userId: string, orderId: string): void {
    const state = this.initializePlayerState(userId);
    state.isTradeLocked = true;
    state.activeTradeId = orderId;
  }

  /**
   * 解锁玩家交易状态
   */
  private unlockTrade(userId: string): void {
    const state = this.playerStates.get(userId);
    if (state) {
      state.isTradeLocked = false;
      state.activeTradeId = undefined;
    }
  }

  /**
   * 确认交易（双方都需要确认）
   */
  confirmTrade(orderId: string, userId: string): { success: boolean; error?: string; completed?: boolean } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: '交易订单不存在' };
    }

    if (order.status !== 'pending') {
      return { success: false, error: `交易状态为 ${order.status}，无法确认` };
    }

    if (Date.now() > order.expiresAt) {
      this.cancelTrade(orderId, 'timeout');
      return { success: false, error: '交易已超时' };
    }

    // 检查是否是交易双方
    if (userId !== order.senderId && userId !== order.receiverId) {
      return { success: false, error: '无权确认此交易' };
    }

    // 检查是否已经确认过
    if (order.confirmedBy?.includes(userId)) {
      return { success: false, error: '您已确认过此交易' };
    }

    // 添加确认
    if (!order.confirmedBy) {
      order.confirmedBy = [];
    }
    order.confirmedBy.push(userId);

    // 检查是否双方都已确认
    if (order.confirmedBy.length === 2) {
      this.completeTrade(order);
      return { success: true, completed: true };
    }

    return { success: true, completed: false };
  }

  /**
   * 完成交易
   */
  private completeTrade(order: TradeOrder): void {
    order.status = 'completed';

    // 更新玩家交易统计
    const senderState = this.playerStates.get(order.senderId);
    const receiverState = this.playerStates.get(order.receiverId);

    if (senderState) {
      senderState.tradeCount++;
      senderState.totalGoldTraded += order.senderOffer.gold;
    }

    if (receiverState) {
      receiverState.tradeCount++;
      receiverState.totalGoldTraded += order.receiverOffer.gold;
    }

    // 添加到历史记录
    this.addToHistory(order.senderId, order);
    this.addToHistory(order.receiverId, order);

    // 解锁双方
    this.unlockTrade(order.senderId);
    this.unlockTrade(order.receiverId);

    // 从活动订单中移除
    this.orders.delete(order.id);
  }

  /**
   * 取消交易
   */
  cancelTrade(orderId: string, reason: 'user' | 'timeout' = 'user'): boolean {
    const order = this.orders.get(orderId);
    if (!order) {
      return false;
    }

    order.status = 'cancelled';

    // 解锁双方
    this.unlockTrade(order.senderId);
    this.unlockTrade(order.receiverId);

    // 从活动订单中移除
    this.orders.delete(orderId);

    return true;
  }

  /**
   * 拒绝交易（仅接收者可以）
   */
  rejectTrade(orderId: string, userId: string): { success: boolean; error?: string } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: '交易订单不存在' };
    }

    if (userId !== order.receiverId) {
      return { success: false, error: '只有接收者可以拒绝交易' };
    }

    order.status = 'rejected';

    // 解锁双方
    this.unlockTrade(order.senderId);
    this.unlockTrade(order.receiverId);

    // 从活动订单中移除
    this.orders.delete(orderId);

    return { success: true };
  }

  /**
   * 获取交易订单详情
   */
  getTradeOrder(orderId: string): TradeOrder | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * 获取玩家的活动交易
   */
  getPlayerActiveTrade(userId: string): TradeOrder | null {
    const state = this.playerStates.get(userId);
    if (!state?.activeTradeId) {
      return null;
    }

    const order = this.orders.get(state.activeTradeId);
    if (!order) {
      // 清理无效的活动交易 ID
      state.activeTradeId = undefined;
      return null;
    }

    return order;
  }

  /**
   * 获取玩家的交易历史
   */
  getTradeHistory(userId: string, limit: number = 20): TradeOrder[] {
    const history = this.tradeHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(userId: string, order: TradeOrder): void {
    const history = this.tradeHistory.get(userId) || [];
    history.push(order);
    
    // 限制历史记录数量
    if (history.length > this.MAX_HISTORY_PER_USER) {
      history.shift();
    }
    
    this.tradeHistory.set(userId, history);
  }

  /**
   * 拉黑玩家（阻止交易）
   */
  blockUser(userId: string, targetUserId: string): boolean {
    const state = this.initializePlayerState(userId);
    
    if (!state.blockedUsers.includes(targetUserId)) {
      state.blockedUsers.push(targetUserId);
    }
    
    return true;
  }

  /**
   * 取消拉黑
   */
  unblockUser(userId: string, targetUserId: string): boolean {
    const state = this.playerStates.get(userId);
    if (!state) return false;
    
    state.blockedUsers = state.blockedUsers.filter(id => id !== targetUserId);
    return true;
  }

  /**
   * 获取交易黑名单
   */
  getBlockedUsers(userId: string): string[] {
    const state = this.playerStates.get(userId);
    return state?.blockedUsers || [];
  }

  /**
   * 获取玩家交易统计
   */
  getTradeStats(userId: string): { tradeCount: number; totalGoldTraded: number } | null {
    const state = this.playerStates.get(userId);
    if (!state) return null;
    
    return {
      tradeCount: state.tradeCount,
      totalGoldTraded: state.totalGoldTraded,
    };
  }

  /**
   * 检查并清理过期交易
   */
  checkExpiredTrades(): number {
    const now = Date.now();
    let expiredCount = 0;

    this.orders.forEach((order, orderId) => {
      if (now > order.expiresAt && order.status === 'pending') {
        this.cancelTrade(orderId, 'timeout');
        expiredCount++;
      }
    });

    return expiredCount;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<TradeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): TradeConfig {
    return { ...this.config };
  }

  /**
   * 生成订单 ID
   */
  private generateOrderId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取活动交易数量
   */
  getActiveTradeCount(): number {
    return this.orders.size;
  }

  /**
   * 导出交易数据（用于持久化）
   */
  exportTradeData(): object {
    return {
      orders: Array.from(this.orders.values()),
      playerStates: Array.from(this.playerStates.values()),
      config: this.config,
    };
  }

  /**
   * 导入交易数据（用于恢复）
   */
  importTradeData(data: { orders: TradeOrder[]; playerStates: PlayerTradeState[]; config?: TradeConfig }): void {
    this.orders.clear();
    this.playerStates.clear();
    this.tradeHistory.clear();

    data.orders.forEach(order => {
      this.orders.set(order.id, order);
    });

    data.playerStates.forEach(state => {
      this.playerStates.set(state.userId, state);
    });

    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
  }
}

// 导出单例实例
export const tradeSystem = new TradeSystem();
