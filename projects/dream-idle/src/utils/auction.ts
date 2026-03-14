/**
 * v0.13 拍卖行系统 - Auction House System
 * 梦幻放置游戏全服拍卖功能
 * 
 * Features:
 * - 创建拍卖订单
 * - 竞价系统
 * - 自动出价（代理竞价）
 * - 拍卖到期处理
 * - 拍卖历史记录
 * - 分类搜索功能
 * - 拍卖税系统
 */

export interface AuctionItem {
  itemId: string;
  itemName: string;
  itemCount: number;
  itemRarity?: 'common' | 'rare' | 'epic' | 'legendary';
  itemLevel?: number;
  itemStats?: Record<string, number>;
}

export interface Bid {
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
  isAutoBid?: boolean;
}

export interface AuctionOrder {
  id: string;
  sellerId: string;
  sellerName: string;
  item: AuctionItem;
  startingPrice: number;
  buyoutPrice?: number; // 一口价
  currentBid: number;
  currentBidder?: string;
  currentBidderName?: string;
  bids: Bid[];
  status: 'active' | 'sold' | 'expired' | 'cancelled' | 'buyout';
  createdAt: number;
  startsAt: number;
  expiresAt: number;
  tax: number;
  category: AuctionCategory;
  views: number;
}

export type AuctionCategory = 
  | 'weapon'      // 武器
  | 'armor'       // 防具
  | 'accessory'   // 饰品
  | 'consumable'  // 消耗品
  | 'material'    // 材料
  | 'pet'         // 宠物
  | 'other';      // 其他

export interface AuctionConfig {
  taxRate: number; // 拍卖税率 (默认 10%)
  minAuctionDurationMs: number; // 最短拍卖时长
  maxAuctionDurationMs: number; // 最长拍卖时长
  minStartingPrice: number; // 最低起拍价
  maxAuctionItems: number; // 单用户最大拍卖数量
  bidIncrementRate: number; // 最小加价比例 (默认 5%)
  autoBidEnabled: boolean; // 是否启用自动出价
}

export interface PlayerAuctionState {
  userId: string;
  activeAuctions: string[]; // 拍卖 ID 列表
  biddingOn: string[]; // 正在竞价的拍卖 ID
  wonAuctions: string[]; // 赢得的拍卖
  totalSold: number; // 总成交次数
  totalBought: number; // 总购买次数
  totalGoldEarned: number; // 总收益
  totalGoldSpent: number; // 总花费
}

export class AuctionHouseSystem {
  private auctions: Map<string, AuctionOrder>;
  private playerStates: Map<string, PlayerAuctionState>;
  private auctionHistory: AuctionOrder[];
  private config: AuctionConfig;
  private readonly MAX_HISTORY = 1000;
  private readonly BID_EXTENSION_MS = 120000; // 最后 2 分钟出价延长 2 分钟

  constructor(config?: Partial<AuctionConfig>) {
    this.auctions = new Map();
    this.playerStates = new Map();
    this.auctionHistory = [];
    this.config = {
      taxRate: 0.1, // 10% 拍卖税
      minAuctionDurationMs: 3600000, // 1 小时
      maxAuctionDurationMs: 86400000, // 24 小时
      minStartingPrice: 100,
      maxAuctionItems: 10,
      bidIncrementRate: 0.05, // 5% 最小加价
      autoBidEnabled: true,
      ...config,
    };
  }

  /**
   * 初始化玩家拍卖状态
   */
  initializePlayerState(userId: string): PlayerAuctionState {
    if (!this.playerStates.has(userId)) {
      const state: PlayerAuctionState = {
        userId,
        activeAuctions: [],
        biddingOn: [],
        wonAuctions: [],
        totalSold: 0,
        totalBought: 0,
        totalGoldEarned: 0,
        totalGoldSpent: 0,
      };
      this.playerStates.set(userId, state);
    }
    return this.playerStates.get(userId)!;
  }

  /**
   * 检查玩家是否可以创建拍卖
   */
  canCreateAuction(userId: string): { canCreate: boolean; reason?: string } {
    const state = this.initializePlayerState(userId);
    
    if (state.activeAuctions.length >= this.config.maxAuctionItems) {
      return { 
        canCreate: false, 
        reason: `已达到最大拍卖数量限制 (${this.config.maxAuctionItems})` 
      };
    }

    return { canCreate: true };
  }

  /**
   * 创建拍卖订单
   */
  createAuction(
    sellerId: string,
    sellerName: string,
    item: AuctionItem,
    startingPrice: number,
    buyoutPrice?: number,
    durationHours: number = 24,
    category: AuctionCategory = 'other'
  ): { success: boolean; auctionId?: string; error?: string } {
    // 检查创建资格
    const canCreate = this.canCreateAuction(sellerId);
    if (!canCreate.canCreate) {
      return { success: false, error: canCreate.reason };
    }

    // 验证价格
    if (startingPrice < this.config.minStartingPrice) {
      return { 
        success: false, 
        error: `起拍价不能低于 ${this.config.minStartingPrice} 金币` 
      };
    }

    if (buyoutPrice && buyoutPrice <= startingPrice) {
      return { success: false, error: '一口价必须高于起拍价' };
    }

    // 验证物品
    if (item.itemCount <= 0) {
      return { success: false, error: '物品数量必须大于 0' };
    }

    // 验证时长
    const durationMs = durationHours * 3600000;
    if (durationMs < this.config.minAuctionDurationMs || 
        durationMs > this.config.maxAuctionDurationMs) {
      return { 
        success: false, 
        error: `拍卖时长必须在 ${this.config.minAuctionDurationMs/3600000}-${this.config.maxAuctionDurationMs/3600000} 小时之间` 
      };
    }

    // 创建拍卖订单
    const auctionId = this.generateAuctionId();
    const now = Date.now();
    
    const auction: AuctionOrder = {
      id: auctionId,
      sellerId,
      sellerName,
      item,
      startingPrice,
      buyoutPrice,
      currentBid: startingPrice,
      bids: [],
      status: 'active',
      createdAt: now,
      startsAt: now,
      expiresAt: now + durationMs,
      tax: Math.floor(startingPrice * this.config.taxRate),
      category,
      views: 0,
    };

    this.auctions.set(auctionId, auction);

    // 更新玩家状态
    const state = this.initializePlayerState(sellerId);
    state.activeAuctions.push(auctionId);

    return { success: true, auctionId };
  }

  /**
   * 竞价（支持代理竞价）
   */
  placeBid(
    auctionId: string,
    bidderId: string,
    bidderName: string,
    amount: number,
    isAutoBid: boolean = false
  ): { success: boolean; error?: string; newBid?: Bid } {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      return { success: false, error: '拍卖不存在' };
    }

    if (auction.status !== 'active') {
      return { success: false, error: `拍卖状态为 ${auction.status}，无法竞价` };
    }

    if (Date.now() < auction.startsAt) {
      return { success: false, error: '拍卖尚未开始' };
    }

    if (Date.now() > auction.expiresAt) {
      this.expireAuction(auctionId);
      return { success: false, error: '拍卖已结束' };
    }

    if (bidderId === auction.sellerId) {
      return { success: false, error: '不能竞拍自己的物品' };
    }

    // 计算最小加价
    const minBid = this.calculateMinBid(auction);
    if (amount < minBid) {
      return { 
        success: false, 
        error: `出价不能低于 ${minBid} 金币（当前最高价 +${Math.ceil(this.config.bidIncrementRate * 100)}%）` 
      };
    }

    // 检查一口价
    if (auction.buyoutPrice && amount >= auction.buyoutPrice) {
      return this.buyoutAuction(auctionId, bidderId, bidderName);
    }

    // 创建竞价记录
    const bid: Bid = {
      bidderId,
      bidderName,
      amount,
      timestamp: Date.now(),
      isAutoBid,
    };

    // 更新当前竞价
    auction.currentBid = amount;
    auction.currentBidder = bidderId;
    auction.currentBidderName = bidderName;
    auction.bids.push(bid);

    // 最后 2 分钟出价，延长拍卖时间
    const timeRemaining = auction.expiresAt - Date.now();
    if (timeRemaining < this.BID_EXTENSION_MS) {
      auction.expiresAt += this.BID_EXTENSION_MS;
    }

    // 更新玩家状态
    const bidderState = this.initializePlayerState(bidderId);
    if (!bidderState.biddingOn.includes(auctionId)) {
      bidderState.biddingOn.push(auctionId);
    }

    return { success: true, newBid: bid };
  }

  /**
   * 计算最小竞价
   */
  private calculateMinBid(auction: AuctionOrder): number {
    const increment = Math.ceil(auction.currentBid * this.config.bidIncrementRate);
    return auction.currentBid + increment;
  }

  /**
   * 一口价购买
   */
  private buyoutAuction(
    auctionId: string,
    buyerId: string,
    buyerName: string
  ): { success: boolean; error?: string } {
    const auction = this.auctions.get(auctionId);
    if (!auction || !auction.buyoutPrice) {
      return { success: false, error: '无法执行一口价购买' };
    }

    // 创建最终竞价记录
    const finalBid: Bid = {
      bidderId: buyerId,
      bidderName: buyerName,
      amount: auction.buyoutPrice,
      timestamp: Date.now(),
      isAutoBid: false,
    };

    auction.bids.push(finalBid);
    auction.currentBid = auction.buyoutPrice;
    auction.currentBidder = buyerId;
    auction.currentBidderName = buyerName;

    // 完成拍卖
    this.completeAuction(auction, 'buyout');

    return { success: true };
  }

  /**
   * 完成拍卖
   */
  private completeAuction(auction: AuctionOrder, reason: 'sold' | 'expired' | 'buyout' | 'cancelled'): void {
    auction.status = reason;

    // 更新卖家状态
    const sellerState = this.initializePlayerState(auction.sellerId);
    sellerState.activeAuctions = sellerState.activeAuctions.filter(id => id !== auction.id);
    
    if (reason === 'sold' || reason === 'buyout') {
      sellerState.totalSold++;
      sellerState.totalGoldEarned += auction.currentBid - auction.tax;
    }

    // 更新买家状态
    if (auction.currentBidder && (reason === 'sold' || reason === 'buyout')) {
      const buyerState = this.initializePlayerState(auction.currentBidder);
      buyerState.totalBought++;
      buyerState.totalGoldSpent += auction.currentBid;
      buyerState.wonAuctions.push(auction.id);
      buyerState.biddingOn = buyerState.biddingOn.filter(id => id !== auction.id);
    }

    // 添加到历史记录
    this.auctionHistory.unshift(auction);
    if (this.auctionHistory.length > this.MAX_HISTORY) {
      this.auctionHistory.pop();
    }

    // 从活动拍卖中移除
    this.auctions.delete(auction.id);
  }

  /**
   * 过期拍卖
   */
  private expireAuction(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    this.completeAuction(auction, 'expired');
    return true;
  }

  /**
   * 取消拍卖（仅卖家可以）
   */
  cancelAuction(auctionId: string, userId: string): { success: boolean; error?: string } {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      return { success: false, error: '拍卖不存在' };
    }

    if (userId !== auction.sellerId) {
      return { success: false, error: '只有卖家可以取消拍卖' };
    }

    if (auction.bids.length > 0) {
      return { success: false, error: '已有竞价的拍卖不能取消' };
    }

    this.completeAuction(auction, 'cancelled');
    return { success: true };
  }

  /**
   * 获取拍卖详情
   */
  getAuction(auctionId: string): AuctionOrder | null {
    const auction = this.auctions.get(auctionId);
    if (auction) {
      // 增加浏览量
      auction.views++;
    }
    return auction || null;
  }

  /**
   * 搜索拍卖
   */
  searchAuctions(options: {
    category?: AuctionCategory;
    minPrice?: number;
    maxPrice?: number;
    itemName?: string;
    sortBy?: 'price' | 'endTime' | 'views';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): AuctionOrder[] {
    let results = Array.from(this.auctions.values());

    // 筛选
    if (options.category) {
      results = results.filter(a => a.category === options.category);
    }

    if (options.minPrice !== undefined) {
      results = results.filter(a => a.currentBid >= options.minPrice!);
    }

    if (options.maxPrice !== undefined) {
      results = results.filter(a => a.currentBid <= options.maxPrice!);
    }

    if (options.itemName) {
      const search = options.itemName.toLowerCase();
      results = results.filter(a => a.item.itemName.toLowerCase().includes(search));
    }

    // 排序
    if (options.sortBy) {
      results.sort((a, b) => {
        let comparison = 0;
        switch (options.sortBy) {
          case 'price':
            comparison = a.currentBid - b.currentBid;
            break;
          case 'endTime':
            comparison = a.expiresAt - b.expiresAt;
            break;
          case 'views':
            comparison = a.views - b.views;
            break;
        }
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // 分页
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return results.slice(start, end);
  }

  /**
   * 获取玩家的活跃拍卖
   */
  getPlayerActiveAuctions(userId: string): AuctionOrder[] {
    const state = this.initializePlayerState(userId);
    return state.activeAuctions
      .map(id => this.auctions.get(id))
      .filter((a): a is AuctionOrder => a !== undefined);
  }

  /**
   * 获取玩家正在竞价的拍卖
   */
  getPlayerBiddingAuctions(userId: string): AuctionOrder[] {
    const state = this.initializePlayerState(userId);
    return state.biddingOn
      .map(id => this.auctions.get(id))
      .filter((a): a is AuctionOrder => a !== undefined);
  }

  /**
   * 获取拍卖历史
   */
  getAuctionHistory(options: {
    userId?: string;
    category?: AuctionCategory;
    limit?: number;
  }): AuctionOrder[] {
    let results = [...this.auctionHistory];

    if (options.userId) {
      results = results.filter(a => 
        a.sellerId === options.userId || 
        a.currentBidder === options.userId
      );
    }

    if (options.category) {
      results = results.filter(a => a.category === options.category);
    }

    const limit = options.limit || 50;
    return results.slice(0, limit);
  }

  /**
   * 检查并处理过期拍卖
   */
  checkExpiredAuctions(): number {
    const now = Date.now();
    let expiredCount = 0;

    // Convert to array to avoid modification during iteration
    const expiredAuctions = Array.from(this.auctions.entries()).filter(
      ([, auction]) => now > auction.expiresAt && auction.status === 'active'
    );

    expiredAuctions.forEach(([auctionId, auction]) => {
      if (auction.currentBidder) {
        this.completeAuction(auction, 'sold');
      } else {
        this.completeAuction(auction, 'expired');
      }
      expiredCount++;
    });

    return expiredCount;
  }

  /**
   * 获取玩家拍卖统计
   */
  getPlayerStats(userId: string): Omit<PlayerAuctionState, 'activeAuctions' | 'biddingOn' | 'wonAuctions'> | null {
    const state = this.playerStates.get(userId);
    if (!state) return null;

    return {
      userId: state.userId,
      totalSold: state.totalSold,
      totalBought: state.totalBought,
      totalGoldEarned: state.totalGoldEarned,
      totalGoldSpent: state.totalGoldSpent,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AuctionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取配置
   */
  getConfig(): AuctionConfig {
    return { ...this.config };
  }

  /**
   * 获取活跃拍卖数量
   */
  getActiveAuctionCount(): number {
    return this.auctions.size;
  }

  /**
   * 获取分类统计
   */
  getCategoryStats(): Record<AuctionCategory, number> {
    const stats: Record<AuctionCategory, number> = {
      weapon: 0,
      armor: 0,
      accessory: 0,
      consumable: 0,
      material: 0,
      pet: 0,
      other: 0,
    };

    this.auctions.forEach(auction => {
      stats[auction.category]++;
    });

    return stats;
  }

  /**
   * 生成拍卖 ID
   */
  private generateAuctionId(): string {
    return `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出拍卖数据
   */
  exportData(): object {
    return {
      auctions: Array.from(this.auctions.values()),
      playerStates: Array.from(this.playerStates.values()),
      history: this.auctionHistory.slice(0, 100), // 只导出最近 100 条
      config: this.config,
    };
  }

  /**
   * 导入拍卖数据
   */
  importData(data: { 
    auctions: AuctionOrder[]; 
    playerStates: PlayerAuctionState[]; 
    history?: AuctionOrder[];
    config?: AuctionConfig;
  }): void {
    this.auctions.clear();
    this.playerStates.clear();
    this.auctionHistory = [];

    data.auctions.forEach(auction => {
      this.auctions.set(auction.id, auction);
    });

    data.playerStates.forEach(state => {
      this.playerStates.set(state.userId, state);
    });

    if (data.history) {
      this.auctionHistory = data.history;
    }

    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
  }
}

// 导出单例实例
export const auctionHouse = new AuctionHouseSystem();
