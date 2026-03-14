/**
 * v0.13 拍卖行系统单元测试
 * Auction House System Unit Tests
 */

import { AuctionHouseSystem, AuctionItem, AuctionCategory } from './auction';

describe('AuctionHouseSystem - 拍卖行系统', () => {
  let auctionHouse: AuctionHouseSystem;

  beforeEach(() => {
    auctionHouse = new AuctionHouseSystem();
  });

  describe('玩家状态管理 - Player State Management', () => {
    test('应该初始化玩家拍卖状态', () => {
      const state = auctionHouse.initializePlayerState('player_1');
      
      expect(state.userId).toBe('player_1');
      expect(state.activeAuctions).toEqual([]);
      expect(state.biddingOn).toEqual([]);
      expect(state.wonAuctions).toEqual([]);
      expect(state.totalSold).toBe(0);
      expect(state.totalBought).toBe(0);
    });

    test('不应该重复初始化玩家状态', () => {
      const state1 = auctionHouse.initializePlayerState('player_1');
      const state2 = auctionHouse.initializePlayerState('player_1');
      
      expect(state1).toBe(state2);
    });

    test('应该可以创建拍卖（满足条件）', () => {
      auctionHouse.initializePlayerState('player_1');
      const result = auctionHouse.canCreateAuction('player_1');
      
      expect(result.canCreate).toBe(true);
    });

    test('达到最大拍卖数量时不能创建', () => {
      auctionHouse.initializePlayerState('player_1');
      
      // 创建 10 个拍卖（达到上限）
      for (let i = 0; i < 10; i++) {
        auctionHouse.createAuction(
          'player_1',
          '玩家 1',
          { itemId: `item_${i}`, itemName: `物品${i}`, itemCount: 1 },
          1000,
          undefined,
          24
        );
      }
      
      const result = auctionHouse.canCreateAuction('player_1');
      expect(result.canCreate).toBe(false);
      expect(result.reason).toContain('最大拍卖数量限制');
    });
  });

  describe('创建拍卖 - Create Auction', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      auctionHouse.initializePlayerState('player_2');
    });

    test('应该成功创建拍卖订单', () => {
      const item: AuctionItem = {
        itemId: 'sword_001',
        itemName: '勇者之剑',
        itemCount: 1,
        itemRarity: 'epic',
        itemLevel: 50,
      };
      
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        item,
        10000, // 起拍价
        15000, // 一口价
        24     // 24 小时
      );
      
      expect(result.success).toBe(true);
      expect(result.auctionId).toBeDefined();
      
      const auction = auctionHouse.getAuction(result.auctionId!);
      expect(auction).toBeDefined();
      expect(auction!.startingPrice).toBe(10000);
      expect(auction!.buyoutPrice).toBe(15000);
      expect(auction!.status).toBe('active');
    });

    test('应该成功创建不带一口价的拍卖', () => {
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        5000
      );
      
      expect(result.success).toBe(true);
      const auction = auctionHouse.getAuction(result.auctionId!);
      expect(auction!.buyoutPrice).toBeUndefined();
    });

    test('应该支持所有拍卖分类', () => {
      const categories: AuctionCategory[] = [
        'weapon', 'armor', 'accessory', 'consumable', 'material', 'pet', 'other'
      ];
      
      categories.forEach(category => {
        const result = auctionHouse.createAuction(
          'player_1',
          '玩家 1',
          { itemId: 'item_1', itemName: '物品', itemCount: 1 },
          1000,
          undefined,
          24,
          category
        );
        
        expect(result.success).toBe(true);
        const auction = auctionHouse.getAuction(result.auctionId!);
        expect(auction!.category).toBe(category);
      });
    });

    test('起拍价不能低于最低限制', () => {
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        50 // 低于 100 最低限制
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('起拍价不能低于');
    });

    test('一口价必须高于起拍价', () => {
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000,
        500 // 低于起拍价
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('一口价必须高于起拍价');
    });

    test('物品数量必须大于 0', () => {
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 0 },
        1000
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('物品数量必须大于 0');
    });

    test('拍卖时长必须在限制范围内', () => {
      const result1 = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000,
        undefined,
        0.5 // 0.5 小时，低于 1 小时限制
      );
      
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('拍卖时长必须在');
      
      const result2 = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000,
        undefined,
        48 // 48 小时，超过 24 小时限制
      );
      
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('拍卖时长必须在');
    });
  });

  describe('竞价系统 - Bidding System', () => {
    let auctionId: string;

    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      auctionHouse.initializePlayerState('player_2');
      auctionHouse.initializePlayerState('player_3');
      
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '传说武器', itemCount: 1, itemRarity: 'legendary' },
        10000,
        20000,
        24
      );
      auctionId = result.auctionId!;
    });

    test('应该成功竞价', () => {
      const result = auctionHouse.placeBid(
        auctionId,
        'player_2',
        '玩家 2',
        12000
      );
      
      expect(result.success).toBe(true);
      expect(result.newBid).toBeDefined();
      expect(result.newBid!.amount).toBe(12000);
      
      const auction = auctionHouse.getAuction(auctionId);
      expect(auction!.currentBid).toBe(12000);
      expect(auction!.currentBidder).toBe('player_2');
    });

    test('出价必须满足最小加价比例', () => {
      // 第一次竞价 10000 -> 11000 (10% 加价)
      auctionHouse.placeBid(auctionId, 'player_2', '玩家 2', 11000);
      
      // 第二次竞价必须至少 11000 * 1.05 = 11550
      const result = auctionHouse.placeBid(
        auctionId,
        'player_3',
        '玩家 3',
        11200 // 低于最小加价
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('出价不能低于');
    });

    test('不能竞拍自己的物品', () => {
      const result = auctionHouse.placeBid(
        auctionId,
        'player_1', // 卖家自己
        '玩家 1',
        12000
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('不能竞拍自己的物品');
    });

    test('不存在的拍卖不能竞价', () => {
      const result = auctionHouse.placeBid(
        'nonexistent_auction',
        'player_2',
        '玩家 2',
        12000
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('拍卖不存在');
    });

    test('已结束的拍卖不能竞价', () => {
      // 完成拍卖
      auctionHouse.placeBid(auctionId, 'player_2', '玩家 2', 15000);
      
      // 模拟另一个玩家出价更高完成拍卖
      const result = auctionHouse.placeBid(
        auctionId,
        'player_3',
        '玩家 3',
        20000 // 一口价
      );
      
      // 现在拍卖已结束
      const result2 = auctionHouse.placeBid(
        auctionId,
        'player_3',
        '玩家 3',
        25000
      );
      
      expect(result2.success).toBe(false);
    });

    test('一口价应该立即购买', () => {
      const result = auctionHouse.placeBid(
        auctionId,
        'player_2',
        '玩家 2',
        20000 // 一口价
      );
      
      expect(result.success).toBe(true);
      
      const auction = auctionHouse.getAuction(auctionId);
      expect(auction).toBeNull(); // 已完成的拍卖被移除
    });

    test('最后 2 分钟出价应该延长拍卖时间', () => {
      // 手动设置拍卖即将结束
      const auction = auctionHouse.getAuction(auctionId);
      if (auction) {
        auction.expiresAt = Date.now() + 60000; // 1 分钟后结束
      }
      
      const originalExpiresAt = auction!.expiresAt;
      
      // 出价
      auctionHouse.placeBid(auctionId, 'player_2', '玩家 2', 12000);
      
      const updatedAuction = auctionHouse.getAuction(auctionId);
      expect(updatedAuction!.expiresAt).toBeGreaterThan(originalExpiresAt);
    });
  });

  describe('取消拍卖 - Cancel Auction', () => {
    let auctionId: string;

    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      auctionHouse.initializePlayerState('player_2');
      
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000
      );
      auctionId = result.auctionId!;
    });

    test('卖家应该可以取消无竞价的拍卖', () => {
      const result = auctionHouse.cancelAuction(auctionId, 'player_1');
      
      expect(result.success).toBe(true);
      
      const auction = auctionHouse.getAuction(auctionId);
      expect(auction).toBeNull();
    });

    test('不能取消已有竞价的拍卖', () => {
      auctionHouse.placeBid(auctionId, 'player_2', '玩家 2', 1200);
      
      const result = auctionHouse.cancelAuction(auctionId, 'player_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('已有竞价的拍卖不能取消');
    });

    test('买家不能取消拍卖', () => {
      const result = auctionHouse.cancelAuction(auctionId, 'player_2');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('只有卖家可以取消拍卖');
    });
  });

  describe('搜索拍卖 - Search Auctions', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      
      // 创建多个拍卖用于搜索测试
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'sword_1', itemName: '铁剑', itemCount: 1 }, 1000, undefined, 24, 'weapon');
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'sword_2', itemName: '钢剑', itemCount: 1 }, 2000, undefined, 24, 'weapon');
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'armor_1', itemName: '皮甲', itemCount: 1 }, 1500, undefined, 24, 'armor');
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'potion_1', itemName: '生命药水', itemCount: 10 }, 500, undefined, 24, 'consumable');
    });

    test('应该按分类搜索', () => {
      const results = auctionHouse.searchAuctions({ category: 'weapon' });
      
      expect(results.length).toBe(2);
      expect(results.every(a => a.category === 'weapon')).toBe(true);
    });

    test('应该按价格范围搜索', () => {
      const results = auctionHouse.searchAuctions({ 
        minPrice: 1000, 
        maxPrice: 2000 
      });
      
      expect(results.length).toBe(3);
      expect(results.every(a => a.currentBid >= 1000 && a.currentBid <= 2000)).toBe(true);
    });

    test('应该按物品名称搜索', () => {
      const results = auctionHouse.searchAuctions({ itemName: '剑' });
      
      expect(results.length).toBe(2);
      expect(results.every(a => a.item.itemName.includes('剑'))).toBe(true);
    });

    test('应该支持排序', () => {
      const results = auctionHouse.searchAuctions({ 
        sortBy: 'price', 
        sortOrder: 'desc' 
      });
      
      expect(results[0].currentBid).toBeGreaterThanOrEqual(results[1].currentBid);
    });

    test('应该支持分页', () => {
      const page1 = auctionHouse.searchAuctions({ pageSize: 2, page: 1 });
      const page2 = auctionHouse.searchAuctions({ pageSize: 2, page: 2 });
      
      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('玩家拍卖查询 - Player Auction Queries', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      auctionHouse.initializePlayerState('player_2');
      
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'item_1', itemName: '物品 1', itemCount: 1 }, 1000);
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'item_2', itemName: '物品 2', itemCount: 1 }, 2000);
    });

    test('应该获取玩家的活跃拍卖', () => {
      const auctions = auctionHouse.getPlayerActiveAuctions('player_1');
      
      expect(auctions.length).toBe(2);
      expect(auctions.every(a => a.sellerId === 'player_1')).toBe(true);
    });

    test('应该获取玩家正在竞价的拍卖', () => {
      const result = auctionHouse.searchAuctions({});
      const auctionId = result[0].id;
      
      auctionHouse.placeBid(auctionId, 'player_2', '玩家 2', 1200);
      
      const bidding = auctionHouse.getPlayerBiddingAuctions('player_2');
      expect(bidding.length).toBe(1);
      expect(bidding[0].id).toBe(auctionId);
    });
  });

  describe('拍卖历史 - Auction History', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      auctionHouse.initializePlayerState('player_2');
    });

    test('应该记录售出的拍卖到历史', () => {
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000
      );
      
      auctionHouse.placeBid(result.auctionId!, 'player_2', '玩家 2', 1200);
      
      // 手动设置过期时间为过去（在竞价后）
      const auction = auctionHouse.getAuction(result.auctionId!);
      if (auction) {
        auction.expiresAt = Date.now() - 1000; // 1 秒前过期
      }
      
      // 检查过期拍卖，触发完成
      auctionHouse.checkExpiredAuctions();
      
      const history = auctionHouse.getAuctionHistory({ userId: 'player_1' });
      expect(history.length).toBe(1);
      expect(history[0].status).toBe('sold');
    });

    test('应该限制历史记录数量', () => {
      // Create a new auction house with higher limit
      const largeAuctionHouse = new AuctionHouseSystem({ maxAuctionItems: 50 });
      largeAuctionHouse.initializePlayerState('player_1');
      largeAuctionHouse.initializePlayerState('player_2');
      
      const auctionIds: string[] = [];
      for (let i = 0; i < 30; i++) {
        const result = largeAuctionHouse.createAuction(
          'player_1',
          '玩家 1',
          { itemId: `item_${i}`, itemName: `物品${i}`, itemCount: 1 },
          1000
        );
        expect(result.success).toBe(true);
        auctionIds.push(result.auctionId!);
        const bidResult = largeAuctionHouse.placeBid(result.auctionId!, 'player_2', '玩家 2', 1200);
        expect(bidResult.success).toBe(true);
      }
      
      // 手动设置所有拍卖过期
      auctionIds.forEach(id => {
        const auction = largeAuctionHouse.getAuction(id);
        if (auction) {
          auction.expiresAt = Date.now() - 1000;
        }
      });
      
      const expiredCount = largeAuctionHouse.checkExpiredAuctions();
      expect(expiredCount).toBe(30);
      
      // limit parameter should limit results
      const history20 = largeAuctionHouse.getAuctionHistory({ limit: 20 });
      expect(history20.length).toBe(20);
      
      const history30 = largeAuctionHouse.getAuctionHistory({ limit: 30 });
      expect(history30.length).toBe(30);
    });
  });

  describe('过期拍卖检查 - Expired Auction Check', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      auctionHouse.initializePlayerState('player_2');
    });

    test('应该处理有过价的过期拍卖为售出', () => {
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000
      );
      
      auctionHouse.placeBid(result.auctionId!, 'player_2', '玩家 2', 1200);
      
      // 手动设置过期时间为过去
      const auction = auctionHouse.getAuction(result.auctionId!);
      if (auction) {
        auction.expiresAt = Date.now() - 1000;
      }
      
      const expiredCount = auctionHouse.checkExpiredAuctions();
      expect(expiredCount).toBe(1);
      
      const history = auctionHouse.getAuctionHistory({ userId: 'player_1' });
      expect(history[0].status).toBe('sold');
    });

    test('应该处理无竞价的过期拍卖为过期', () => {
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000
      );
      
      // 手动设置过期时间为过去
      const auction = auctionHouse.getAuction(result.auctionId!);
      if (auction) {
        auction.expiresAt = Date.now() - 1000;
      }
      
      const expiredCount = auctionHouse.checkExpiredAuctions();
      expect(expiredCount).toBe(1);
      
      const history = auctionHouse.getAuctionHistory({ userId: 'player_1' });
      expect(history[0].status).toBe('expired');
    });
  });

  describe('玩家统计 - Player Stats', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      auctionHouse.initializePlayerState('player_2');
    });

    test('应该获取玩家拍卖统计', () => {
      const result = auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000
      );
      
      auctionHouse.placeBid(result.auctionId!, 'player_2', '玩家 2', 1200);
      
      // 手动设置过期时间为过去（在竞价后）
      const auction = auctionHouse.getAuction(result.auctionId!);
      if (auction) {
        auction.expiresAt = Date.now() - 1000;
      }
      
      auctionHouse.checkExpiredAuctions();
      
      const sellerStats = auctionHouse.getPlayerStats('player_1');
      expect(sellerStats).toBeDefined();
      expect(sellerStats!.totalSold).toBe(1);
      expect(sellerStats!.totalGoldEarned).toBeGreaterThanOrEqual(1000); // 扣除税后至少 1000
      
      const buyerStats = auctionHouse.getPlayerStats('player_2');
      expect(buyerStats).toBeDefined();
      expect(buyerStats!.totalBought).toBe(1);
      expect(buyerStats!.totalGoldSpent).toBe(1200);
    });
  });

  describe('配置管理 - Configuration Management', () => {
    test('应该使用默认配置', () => {
      const config = auctionHouse.getConfig();
      
      expect(config.taxRate).toBe(0.1);
      expect(config.minAuctionDurationMs).toBe(3600000);
      expect(config.maxAuctionDurationMs).toBe(86400000);
      expect(config.minStartingPrice).toBe(100);
      expect(config.maxAuctionItems).toBe(10);
      expect(config.bidIncrementRate).toBe(0.05);
    });

    test('应该可以更新配置', () => {
      auctionHouse.updateConfig({
        taxRate: 0.15,
        minStartingPrice: 500,
      });
      
      const config = auctionHouse.getConfig();
      expect(config.taxRate).toBe(0.15);
      expect(config.minStartingPrice).toBe(500);
      expect(config.maxAuctionItems).toBe(10); // 未改变
    });
  });

  describe('分类统计 - Category Stats', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'sword_1', itemName: '铁剑', itemCount: 1 }, 1000, undefined, 24, 'weapon');
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'sword_2', itemName: '钢剑', itemCount: 1 }, 2000, undefined, 24, 'weapon');
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'armor_1', itemName: '皮甲', itemCount: 1 }, 1500, undefined, 24, 'armor');
    });

    test('应该获取分类统计', () => {
      const stats = auctionHouse.getCategoryStats();
      
      expect(stats.weapon).toBe(2);
      expect(stats.armor).toBe(1);
      expect(stats.consumable).toBe(0);
    });
  });

  describe('数据导出导入 - Data Export/Import', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
      auctionHouse.initializePlayerState('player_2');
      
      auctionHouse.createAuction(
        'player_1',
        '玩家 1',
        { itemId: 'item_1', itemName: '物品', itemCount: 1 },
        1000
      );
    });

    test('应该导出拍卖数据', () => {
      const data = auctionHouse.exportData();
      
      expect(data).toBeDefined();
      expect((data as any).auctions.length).toBe(1);
      expect((data as any).playerStates.length).toBeGreaterThanOrEqual(2);
      expect((data as any).config.taxRate).toBe(0.1);
    });

    test('应该导入拍卖数据', () => {
      const newData = {
        auctions: [
          {
            id: 'imported_auction',
            sellerId: 'player_a',
            sellerName: '玩家 A',
            item: { itemId: 'item_1', itemName: '导入物品', itemCount: 1 },
            startingPrice: 5000,
            currentBid: 5000,
            bids: [],
            status: 'active' as const,
            createdAt: Date.now(),
            startsAt: Date.now(),
            expiresAt: Date.now() + 86400000,
            tax: 500,
            category: 'weapon' as AuctionCategory,
            views: 0,
          },
        ],
        playerStates: [
          { userId: 'player_a', activeAuctions: ['imported_auction'], biddingOn: [], wonAuctions: [], totalSold: 0, totalBought: 0, totalGoldEarned: 0, totalGoldSpent: 0 },
        ],
        config: { taxRate: 0.12, minAuctionDurationMs: 3600000, maxAuctionDurationMs: 86400000, minStartingPrice: 100, maxAuctionItems: 10, bidIncrementRate: 0.05, autoBidEnabled: true },
      };

      auctionHouse.importData(newData);
      
      const auction = auctionHouse.getAuction('imported_auction');
      expect(auction).toBeDefined();
      expect(auction!.startingPrice).toBe(5000);
      
      const config = auctionHouse.getConfig();
      expect(config.taxRate).toBe(0.12);
    });
  });

  describe('活跃拍卖数量 - Active Auction Count', () => {
    beforeEach(() => {
      auctionHouse.initializePlayerState('player_1');
    });

    test('应该获取活跃拍卖数量', () => {
      expect(auctionHouse.getActiveAuctionCount()).toBe(0);
      
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'item_1', itemName: '物品 1', itemCount: 1 }, 1000);
      auctionHouse.createAuction('player_1', '玩家 1', 
        { itemId: 'item_2', itemName: '物品 2', itemCount: 1 }, 2000);
      
      expect(auctionHouse.getActiveAuctionCount()).toBe(2);
    });
  });
});
