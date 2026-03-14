/**
 * v0.12 交易系统单元测试
 * Trade System Unit Tests
 */

import { TradeSystem, TradeItem, TradeConfig } from './trade';

describe('TradeSystem - 交易系统', () => {
  let tradeSystem: TradeSystem;

  beforeEach(() => {
    tradeSystem = new TradeSystem();
  });

  describe('玩家状态管理 - Player State Management', () => {
    test('应该初始化玩家交易状态', () => {
      const state = tradeSystem.initializePlayerState('player_1');
      
      expect(state.userId).toBe('player_1');
      expect(state.isTradeLocked).toBe(false);
      expect(state.tradeCount).toBe(0);
      expect(state.totalGoldTraded).toBe(0);
      expect(state.blockedUsers).toEqual([]);
    });

    test('不应该重复初始化玩家状态', () => {
      const state1 = tradeSystem.initializePlayerState('player_1');
      const state2 = tradeSystem.initializePlayerState('player_1');
      
      expect(state1).toBe(state2);
    });

    test('应该可以交易（满足条件）', () => {
      tradeSystem.initializePlayerState('player_1');
      const result = tradeSystem.canTrade('player_1', 15);
      
      expect(result.canTrade).toBe(true);
    });

    test('等级不足时不能交易', () => {
      tradeSystem.initializePlayerState('player_1');
      const result = tradeSystem.canTrade('player_1', 5);
      
      expect(result.canTrade).toBe(false);
      expect(result.reason).toContain('等级不足');
    });
  });

  describe('创建交易订单 - Create Trade Order', () => {
    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
    });

    test('应该成功创建金币交易订单', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000, // sender gold
        []    // sender items
      );
      
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      
      const order = tradeSystem.getTradeOrder(result.orderId!);
      expect(order).toBeDefined();
      expect(order!.senderOffer.gold).toBe(1000);
      expect(order!.status).toBe('pending');
    });

    test('应该成功创建物品交易订单', () => {
      const items: TradeItem[] = [
        { itemId: 'item_1', itemName: '生命药水', itemCount: 5 },
        { itemId: 'item_2', itemName: '魔法药水', itemCount: 3 },
      ];
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        0,
        items
      );
      
      expect(result.success).toBe(true);
      const order = tradeSystem.getTradeOrder(result.orderId!);
      expect(order!.senderOffer.items.length).toBe(2);
    });

    test('应该成功创建双向交易订单', () => {
      const senderItems: TradeItem[] = [
        { itemId: 'item_1', itemName: '生命药水', itemCount: 5 },
      ];
      const receiverItems: TradeItem[] = [
        { itemId: 'item_2', itemName: '魔法药水', itemCount: 3 },
      ];
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        senderItems,
        500,
        receiverItems
      );
      
      expect(result.success).toBe(true);
      const order = tradeSystem.getTradeOrder(result.orderId!);
      expect(order!.senderOffer.gold).toBe(1000);
      expect(order!.receiverOffer.gold).toBe(500);
      expect(order!.tax).toBe(Math.floor(1500 * 0.05)); // 5% 税
    });

    test('不应该创建负数金币交易', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        -100,
        []
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('金币数量不能为负数');
    });

    test('不应该超过最大交易金币限制', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        2000000, // 超过 100 万上限
        []
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('交易金币超过上限');
    });

    test('不应该超过最大交易物品数量限制', () => {
      const items: TradeItem[] = Array(15).fill(null).map((_, i) => ({
        itemId: `item_${i}`,
        itemName: `物品${i}`,
        itemCount: 1,
      }));
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        0,
        items
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('交易物品数量超过上限');
    });

    test('不应该创建空交易', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        0,
        [],
        0,
        []
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('交易不能为空');
    });

    test('被拉黑的玩家不能发起交易', () => {
      tradeSystem.blockUser('player_2', 'player_1');
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        []
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('对方已将您拉入交易黑名单');
    });

    test('玩家已有进行中的交易时不能创建新交易', () => {
      tradeSystem.createTradeOrder('player_1', '玩家 1', 'player_2', 100, []);
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_3',
        200,
        []
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('已有进行中的交易');
    });
  });

  describe('交易确认 - Trade Confirmation', () => {
    let orderId: string;

    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        [{ itemId: 'item_1', itemName: '生命药水', itemCount: 5 }]
      );
      orderId = result.orderId!;
    });

    test('发送者应该可以确认交易', () => {
      const result = tradeSystem.confirmTrade(orderId, 'player_1');
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(false); // 还需要接收者确认
      
      const order = tradeSystem.getTradeOrder(orderId);
      expect(order!.confirmedBy).toContain('player_1');
    });

    test('接收者应该可以确认交易', () => {
      const result = tradeSystem.confirmTrade(orderId, 'player_2');
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(false);
      
      const order = tradeSystem.getTradeOrder(orderId);
      expect(order!.confirmedBy).toContain('player_2');
    });

    test('双方确认后交易应该完成', () => {
      tradeSystem.confirmTrade(orderId, 'player_1');
      const result = tradeSystem.confirmTrade(orderId, 'player_2');
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(true);
      
      const order = tradeSystem.getTradeOrder(orderId);
      expect(order).toBeNull(); // 已完成的订单从活动订单中移除
    });

    test('第三方不能确认交易', () => {
      tradeSystem.initializePlayerState('player_3');
      const result = tradeSystem.confirmTrade(orderId, 'player_3');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('无权确认此交易');
    });

    test('不能重复确认交易', () => {
      tradeSystem.confirmTrade(orderId, 'player_1');
      const result = tradeSystem.confirmTrade(orderId, 'player_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('您已确认过此交易');
    });

    test('不存在的订单不能确认', () => {
      const result = tradeSystem.confirmTrade('nonexistent_order', 'player_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('交易订单不存在');
    });
  });

  describe('取消交易 - Cancel Trade', () => {
    let orderId: string;

    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        []
      );
      orderId = result.orderId!;
    });

    test('应该可以取消交易', () => {
      const result = tradeSystem.cancelTrade(orderId, 'user');
      
      expect(result).toBe(true);
      
      const order = tradeSystem.getTradeOrder(orderId);
      expect(order).toBeNull();
    });

    test('取消交易后玩家应该解锁', () => {
      tradeSystem.cancelTrade(orderId, 'user');
      
      const player1State = (tradeSystem as any).playerStates.get('player_1');
      const player2State = (tradeSystem as any).playerStates.get('player_2');
      
      expect(player1State.isTradeLocked).toBe(false);
      expect(player2State.isTradeLocked).toBe(false);
    });

    test('不能取消不存在的订单', () => {
      const result = tradeSystem.cancelTrade('nonexistent_order', 'user');
      
      expect(result).toBe(false);
    });
  });

  describe('拒绝交易 - Reject Trade', () => {
    let orderId: string;

    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        []
      );
      orderId = result.orderId!;
    });

    test('只有接收者可以拒绝交易', () => {
      const result = tradeSystem.rejectTrade(orderId, 'player_2');
      
      expect(result.success).toBe(true);
      
      const order = tradeSystem.getTradeOrder(orderId);
      expect(order).toBeNull();
    });

    test('发送者不能拒绝交易', () => {
      const result = tradeSystem.rejectTrade(orderId, 'player_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('只有接收者可以拒绝交易');
    });

    test('第三方不能拒绝交易', () => {
      tradeSystem.initializePlayerState('player_3');
      const result = tradeSystem.rejectTrade(orderId, 'player_3');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('只有接收者可以拒绝交易');
    });
  });

  describe('交易历史 - Trade History', () => {
    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
    });

    test('应该记录完成的交易到历史', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        []
      );
      
      tradeSystem.confirmTrade(result.orderId!, 'player_1');
      tradeSystem.confirmTrade(result.orderId!, 'player_2');
      
      const history = tradeSystem.getTradeHistory('player_1');
      expect(history.length).toBe(1);
      expect(history[0].status).toBe('completed');
    });

    test('应该限制历史记录数量', () => {
      // 创建 60 笔交易
      for (let i = 0; i < 60; i++) {
        const result = tradeSystem.createTradeOrder(
          'player_1',
          '玩家 1',
          'player_2',
          i,
          []
        );
        tradeSystem.confirmTrade(result.orderId!, 'player_1');
        tradeSystem.confirmTrade(result.orderId!, 'player_2');
      }
      
      const history = tradeSystem.getTradeHistory('player_1', 100);
      expect(history.length).toBe(50); // MAX_HISTORY_PER_USER = 50
    });

    test('应该可以获取交易统计', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        []
      );
      
      tradeSystem.confirmTrade(result.orderId!, 'player_1');
      tradeSystem.confirmTrade(result.orderId!, 'player_2');
      
      const stats = tradeSystem.getTradeStats('player_1');
      expect(stats).toBeDefined();
      expect(stats!.tradeCount).toBe(1);
      expect(stats!.totalGoldTraded).toBe(1000);
    });
  });

  describe('交易黑名单 - Trade Block List', () => {
    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
    });

    test('应该拉黑玩家', () => {
      const result = tradeSystem.blockUser('player_1', 'player_2');
      
      expect(result).toBe(true);
      const blocked = tradeSystem.getBlockedUsers('player_1');
      expect(blocked).toContain('player_2');
    });

    test('应该取消拉黑', () => {
      tradeSystem.blockUser('player_1', 'player_2');
      tradeSystem.unblockUser('player_1', 'player_2');
      
      const blocked = tradeSystem.getBlockedUsers('player_1');
      expect(blocked).not.toContain('player_2');
    });

    test('不应该重复拉黑', () => {
      tradeSystem.blockUser('player_1', 'player_2');
      tradeSystem.blockUser('player_1', 'player_2');
      
      const blocked = tradeSystem.getBlockedUsers('player_1');
      expect(blocked.filter(id => id === 'player_2').length).toBe(1);
    });
  });

  describe('过期交易检查 - Expired Trade Check', () => {
    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
    });

    test('应该清理过期交易', () => {
      // 创建超时时间为 1ms 的交易
      const fastTradeSystem = new TradeSystem({ tradeTimeoutMs: 1 });
      fastTradeSystem.initializePlayerState('player_1');
      fastTradeSystem.initializePlayerState('player_2');
      
      const result = fastTradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        []
      );
      
      // 等待超时
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // 等待 10ms 确保超时
      }
      
      const expiredCount = fastTradeSystem.checkExpiredTrades();
      expect(expiredCount).toBe(1);
    });
  });

  describe('配置管理 - Configuration Management', () => {
    test('应该使用默认配置', () => {
      const config = tradeSystem.getConfig();
      
      expect(config.taxRate).toBe(0.05);
      expect(config.maxTradeGold).toBe(1000000);
      expect(config.maxTradeItems).toBe(10);
      expect(config.tradeTimeoutMs).toBe(300000);
      expect(config.minLevel).toBe(10);
    });

    test('应该可以更新配置', () => {
      tradeSystem.updateConfig({
        taxRate: 0.1,
        maxTradeGold: 500000,
      });
      
      const config = tradeSystem.getConfig();
      expect(config.taxRate).toBe(0.1);
      expect(config.maxTradeGold).toBe(500000);
      expect(config.maxTradeItems).toBe(10); // 未改变
    });

    test('应该可以自定义配置初始化', () => {
      const customTradeSystem = new TradeSystem({
        taxRate: 0.08,
        maxTradeGold: 2000000,
        minLevel: 20,
      });
      
      const config = customTradeSystem.getConfig();
      expect(config.taxRate).toBe(0.08);
      expect(config.maxTradeGold).toBe(2000000);
      expect(config.minLevel).toBe(20);
    });
  });

  describe('活动交易查询 - Active Trade Queries', () => {
    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
      tradeSystem.initializePlayerState('player_3');
    });

    test('应该获取玩家的活动交易', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        []
      );
      
      const activeTrade = tradeSystem.getPlayerActiveTrade('player_1');
      expect(activeTrade).toBeDefined();
      expect(activeTrade!.id).toBe(result.orderId);
    });

    test('没有活动交易时返回 null', () => {
      const activeTrade = tradeSystem.getPlayerActiveTrade('player_3');
      expect(activeTrade).toBeNull();
    });

    test('应该获取活动交易数量', () => {
      // 创建两个独立玩家的交易
      tradeSystem.createTradeOrder('player_1', '玩家 1', 'player_2', 100, []);
      tradeSystem.initializePlayerState('player_4');
      tradeSystem.createTradeOrder('player_3', '玩家 3', 'player_4', 200, []);
      
      const count = tradeSystem.getActiveTradeCount();
      expect(count).toBe(2);
    });
  });

  describe('数据导出导入 - Data Export/Import', () => {
    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
      
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        1000,
        [{ itemId: 'item_1', itemName: '生命药水', itemCount: 5 }]
      );
      tradeSystem.confirmTrade(result.orderId!, 'player_1');
    });

    test('应该导出交易数据', () => {
      const data = tradeSystem.exportTradeData();
      
      expect(data).toBeDefined();
      expect((data as any).orders.length).toBe(1);
      expect((data as any).playerStates.length).toBeGreaterThanOrEqual(2);
      expect((data as any).config.taxRate).toBe(0.05);
    });

    test('应该导入交易数据', () => {
      const newData = {
        orders: [
          {
            id: 'imported_trade',
            senderId: 'player_a',
            senderName: '玩家 A',
            receiverId: 'player_b',
            senderOffer: { userId: 'player_a', gold: 500, items: [] },
            receiverOffer: { userId: 'player_b', gold: 0, items: [] },
            status: 'pending' as const,
            createdAt: Date.now(),
            expiresAt: Date.now() + 300000,
            tax: 25,
          },
        ],
        playerStates: [
          { userId: 'player_a', isTradeLocked: true, activeTradeId: 'imported_trade', tradeCount: 0, totalGoldTraded: 0, blockedUsers: [] },
          { userId: 'player_b', isTradeLocked: true, activeTradeId: 'imported_trade', tradeCount: 0, totalGoldTraded: 0, blockedUsers: [] },
        ],
        config: { taxRate: 0.1, maxTradeGold: 1000000, maxTradeItems: 10, tradeTimeoutMs: 300000, minLevel: 10 },
      };

      tradeSystem.importTradeData(newData);
      
      const order = tradeSystem.getTradeOrder('imported_trade');
      expect(order).toBeDefined();
      expect(order!.senderOffer.gold).toBe(500);
      
      const config = tradeSystem.getConfig();
      expect(config.taxRate).toBe(0.1);
    });
  });

  describe('交易物品验证 - Trade Item Validation', () => {
    beforeEach(() => {
      tradeSystem.initializePlayerState('player_1');
      tradeSystem.initializePlayerState('player_2');
    });

    test('物品数量不能为 0', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        0,
        [{ itemId: 'item_1', itemName: '生命药水', itemCount: 0 }]
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('数量必须大于 0');
    });

    test('物品数量不能为负数', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        0,
        [{ itemId: 'item_1', itemName: '生命药水', itemCount: -5 }]
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('数量必须大于 0');
    });

    test('应该支持物品稀有度', () => {
      const result = tradeSystem.createTradeOrder(
        'player_1',
        '玩家 1',
        'player_2',
        0,
        [
          { itemId: 'item_1', itemName: '普通武器', itemCount: 1, itemRarity: 'common' },
          { itemId: 'item_2', itemName: '稀有武器', itemCount: 1, itemRarity: 'rare' },
          { itemId: 'item_3', itemName: '史诗武器', itemCount: 1, itemRarity: 'epic' },
          { itemId: 'item_4', itemName: '传说武器', itemCount: 1, itemRarity: 'legendary' },
        ]
      );
      
      expect(result.success).toBe(true);
      const order = tradeSystem.getTradeOrder(result.orderId!);
      expect(order!.senderOffer.items.length).toBe(4);
    });
  });
});
