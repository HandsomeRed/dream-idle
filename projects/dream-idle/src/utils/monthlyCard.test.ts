/**
 * v0.37 月卡系统单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  MONTHLY_CARDS,
  initializeMonthlyCardState,
  purchaseMonthlyCard,
  claimDailyReward,
  isCardActive,
  getRemainingDays,
  getClaimableCards,
  cleanupExpiredCards,
  getTotalRemainingDays,
  getTotalDailyReward,
  saveMonthlyCardState,
  loadMonthlyCardState,
  getMonthlyCardName,
  formatDate,
  getRemainingTimeText,
  type MonthlyCardState
} from './monthlyCard';

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const mockLocalStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('v0.37 月卡系统', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('月卡配置', () => {
    it('应该有 2 种月卡', () => {
      expect(MONTHLY_CARDS.length).toBe(2);
    });

    it('月卡配置应该包含必要字段', () => {
      MONTHLY_CARDS.forEach(card => {
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.price).toBeGreaterThan(0);
        expect(card.duration).toBe(30);
        expect(card.dailyReward).toBeDefined();
        expect(card.description).toBeDefined();
      });
    });

    it('高级月卡应该比普通月卡贵', () => {
      const basic = MONTHLY_CARDS.find(c => c.id === 'basic');
      const premium = MONTHLY_CARDS.find(c => c.id === 'premium');

      expect(premium!.price).toBeGreaterThan(basic!.price);
      expect(premium!.dailyReward.gold).toBeGreaterThan(basic!.dailyReward.gold);
      expect(premium!.dailyReward.diamond).toBeGreaterThan(basic!.dailyReward.diamond);
    });
  });

  describe('月卡状态初始化', () => {
    it('应该返回初始状态', () => {
      const state = initializeMonthlyCardState();

      expect(state.activeCards).toEqual([]);
      expect(state.totalClaimedDays).toBe(0);
      expect(state.totalPurchased).toBe(0);
    });
  });

  describe('购买月卡', () => {
    it('应该成功购买月卡', () => {
      const state = initializeMonthlyCardState();
      const result = purchaseMonthlyCard(state, 'basic');

      expect(result.success).toBe(true);
      expect(result.newState.activeCards.length).toBe(1);
      expect(result.newState.totalPurchased).toBe(1);
      expect(result.instantReward).toBeDefined();
    });

    it('应该拒绝无效月卡类型', () => {
      const state = initializeMonthlyCardState();
      const result = purchaseMonthlyCard(state, 'invalid');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('无效');
    });

    it('续购应该延长有效期', () => {
      const state = initializeMonthlyCardState();
      const time1 = Date.now();
      const result1 = purchaseMonthlyCard(state, 'basic', time1);

      const time2 = time1 + 1000 * 60 * 60; // 1 小时后
      const result2 = purchaseMonthlyCard(result1.newState, 'basic', time2);

      expect(result2.success).toBe(true);
      expect(result2.newState.activeCards.length).toBe(1); // 仍然是 1 张
      expect(result2.newState.totalPurchased).toBe(2); // 但购买次数 +1

      // 有效期应该延长
      const originalEnd = result1.newState.activeCards[0].endDate;
      const newEnd = result2.newState.activeCards[0].endDate;
      expect(newEnd).toBeGreaterThan(originalEnd);
    });
  });

  describe('领取每日奖励', () => {
    it('应该成功领取每日奖励', () => {
      const state = initializeMonthlyCardState();
      const purchaseResult = purchaseMonthlyCard(state, 'basic');
      const claimResult = claimDailyReward(purchaseResult.newState, 'basic');

      expect(claimResult.success).toBe(true);
      expect(claimResult.reward).toBeDefined();
      expect(claimResult.newState.totalClaimedDays).toBe(1);
    });

    it('未激活月卡无法领取', () => {
      const state = initializeMonthlyCardState();
      const result = claimDailyReward(state, 'basic');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('未激活');
    });

    it('过期月卡无法领取', () => {
      const state: MonthlyCardState = {
        activeCards: [{
          cardId: 'basic',
          startDate: Date.now() - 31 * 24 * 60 * 60 * 1000,
          endDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
          claimedDays: 0
        }],
        totalClaimedDays: 0,
        totalPurchased: 1
      };

      const result = claimDailyReward(state, 'basic');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('过期');
    });

    it('每日奖励只能领取一次', () => {
      const state = initializeMonthlyCardState();
      const purchaseResult = purchaseMonthlyCard(state, 'basic');
      const time1 = Date.now();

      const claimResult1 = claimDailyReward(purchaseResult.newState, 'basic', time1);
      expect(claimResult1.success).toBe(true);

      const claimResult2 = claimDailyReward(claimResult1.newState, 'basic', time1 + 1000);
      expect(claimResult2.success).toBe(false);
      expect(claimResult2.reason).toContain('已领取');
    });

    it('次日可以再次领取', () => {
      const state = initializeMonthlyCardState();
      const purchaseResult = purchaseMonthlyCard(state, 'basic');
      const time1 = Date.now();
      const time2 = time1 + 24 * 60 * 60 * 1000 + 1000; // 次日

      const claimResult1 = claimDailyReward(purchaseResult.newState, 'basic', time1);
      expect(claimResult1.success).toBe(true);

      const claimResult2 = claimDailyReward(claimResult1.newState, 'basic', time2);
      expect(claimResult2.success).toBe(true);
      expect(claimResult2.newState.totalClaimedDays).toBe(2);
    });
  });

  describe('月卡状态检查', () => {
    it('应该正确判断月卡是否激活', () => {
      const state = initializeMonthlyCardState();
      const purchaseResult = purchaseMonthlyCard(state, 'basic');

      expect(isCardActive(purchaseResult.newState, 'basic')).toBe(true);
      expect(isCardActive(purchaseResult.newState, 'premium')).toBe(false);
    });

    it('应该正确计算剩余天数', () => {
      const state: MonthlyCardState = {
        activeCards: [{
          cardId: 'basic',
          startDate: Date.now(),
          endDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
          claimedDays: 0
        }],
        totalClaimedDays: 0,
        totalPurchased: 1
      };

      const remaining = getRemainingDays(state, 'basic');
      expect(remaining).toBe(15);
    });

    it('过期月卡剩余天数应该为 0', () => {
      const state: MonthlyCardState = {
        activeCards: [{
          cardId: 'basic',
          startDate: Date.now() - 31 * 24 * 60 * 60 * 1000,
          endDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
          claimedDays: 30
        }],
        totalClaimedDays: 30,
        totalPurchased: 1
      };

      const remaining = getRemainingDays(state, 'basic');
      expect(remaining).toBe(0);
    });
  });

  describe('可领取月卡列表', () => {
    it('应该返回可领取的月卡', () => {
      const state = initializeMonthlyCardState();
      const purchaseResult = purchaseMonthlyCard(state, 'basic');

      const claimable = getClaimableCards(purchaseResult.newState);
      expect(claimable.length).toBe(1);
      expect(claimable[0].id).toBe('basic');
    });

    it('已领取的月卡不应该出现在列表中', () => {
      const state = initializeMonthlyCardState();
      const purchaseResult = purchaseMonthlyCard(state, 'basic');
      const claimResult = claimDailyReward(purchaseResult.newState, 'basic');

      const claimable = getClaimableCards(claimResult.newState);
      expect(claimable.length).toBe(0);
    });

    it('过期月卡不应该出现在列表中', () => {
      const state: MonthlyCardState = {
        activeCards: [{
          cardId: 'basic',
          startDate: Date.now() - 31 * 24 * 60 * 60 * 1000,
          endDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
          claimedDays: 30
        }],
        totalClaimedDays: 30,
        totalPurchased: 1
      };

      const claimable = getClaimableCards(state);
      expect(claimable.length).toBe(0);
    });
  });

  describe('清理过期月卡', () => {
    it('应该移除过期月卡', () => {
      const state: MonthlyCardState = {
        activeCards: [
          {
            cardId: 'basic',
            startDate: Date.now() - 31 * 24 * 60 * 60 * 1000,
            endDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
            claimedDays: 30
          },
          {
            cardId: 'premium',
            startDate: Date.now(),
            endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
            claimedDays: 0
          }
        ],
        totalClaimedDays: 30,
        totalPurchased: 2
      };

      const cleaned = cleanupExpiredCards(state);
      expect(cleaned.activeCards.length).toBe(1);
      expect(cleaned.activeCards[0].cardId).toBe('premium');
    });
  });

  describe('总剩余天数计算', () => {
    it('应该正确计算总剩余天数', () => {
      const state: MonthlyCardState = {
        activeCards: [
          {
            cardId: 'basic',
            startDate: Date.now(),
            endDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
            claimedDays: 0
          },
          {
            cardId: 'premium',
            startDate: Date.now(),
            endDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
            claimedDays: 0
          }
        ],
        totalClaimedDays: 0,
        totalPurchased: 2
      };

      const total = getTotalRemainingDays(state);
      expect(total).toBe(25);
    });
  });

  describe('每日总奖励计算', () => {
    it('应该正确计算每日总奖励', () => {
      const state: MonthlyCardState = {
        activeCards: [
          {
            cardId: 'basic',
            startDate: Date.now(),
            endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
            claimedDays: 0
          },
          {
            cardId: 'premium',
            startDate: Date.now(),
            endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
            claimedDays: 0
          }
        ],
        totalClaimedDays: 0,
        totalPurchased: 2
      };

      const reward = getTotalDailyReward(state);
      expect(reward.gold).toBe(15000); // 5000 + 10000
      expect(reward.diamond).toBe(150); // 50 + 100
      expect(reward.items.length).toBe(1);
    });
  });

  describe('状态保存和加载', () => {
    it('应该正确保存和加载状态', () => {
      const originalState: MonthlyCardState = {
        activeCards: [
          {
            cardId: 'basic',
            startDate: Date.now(),
            endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
            claimedDays: 5,
            lastClaimDate: Date.now()
          }
        ],
        totalClaimedDays: 5,
        totalPurchased: 2
      };

      saveMonthlyCardState(originalState);
      const loadedState = loadMonthlyCardState();

      expect(loadedState.activeCards.length).toBe(1);
      expect(loadedState.totalClaimedDays).toBe(5);
      expect(loadedState.totalPurchased).toBe(2);
    });

    it('没有保存时应该返回初始状态', () => {
      mockLocalStorage.clear();
      const state = loadMonthlyCardState();

      expect(state.activeCards).toEqual([]);
      expect(state.totalClaimedDays).toBe(0);
    });
  });

  describe('工具函数', () => {
    it('应该正确获取月卡名称', () => {
      expect(getMonthlyCardName('basic')).toBe('普通月卡');
      expect(getMonthlyCardName('premium')).toBe('高级月卡');
      expect(getMonthlyCardName('invalid')).toBe('未知月卡');
    });

    it('应该正确格式化日期', () => {
      const timestamp = new Date('2026-03-21T00:00:00+08:00').getTime();
      const formatted = formatDate(timestamp);
      expect(formatted).toBe('2026-03-21');
    });

    it('应该正确计算剩余时间文本', () => {
      expect(getRemainingTimeText(0)).toBe('已过期');
      expect(getRemainingTimeText(-1000)).toBe('已过期');
      expect(getRemainingTimeText(25 * 60 * 60 * 1000)).toContain('天');
      expect(getRemainingTimeText(5 * 60 * 60 * 1000)).toContain('小时');
    });
  });
});
