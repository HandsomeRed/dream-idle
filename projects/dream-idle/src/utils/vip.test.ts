/**
 * v0.35 VIP 系统单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  VIP_LEVELS,
  getVIPLevelName,
  getVIPLevelColor,
  initializeVIPState,
  calculateVIPLvlFromExp,
  getExpToNextLevel,
  getVIPProgress,
  addVIPExp,
  getOfflineBonusPercent,
  getGoldBonusPercent,
  getExpBonusPercent,
  getExtraDungeonEntries,
  getExtraArenaEntries,
  getUnlockedPerks,
  saveVIPState,
  loadVIPState,
  purchaseVIPExp,
  getDailyActivityExp,
  type VIPState
} from './vip';

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

describe('v0.35 VIP 系统', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('VIP 等级配置', () => {
    it('应该有 16 个等级（0-15）', () => {
      expect(VIP_LEVELS.length).toBe(16);
    });

    it('每个等级都应该有必要的字段', () => {
      VIP_LEVELS.forEach((levelInfo, index) => {
        expect(levelInfo.level).toBe(index);
        expect(levelInfo.requiredExp).toBeDefined();
        expect(levelInfo.perks).toBeDefined();
      });
    });

    it('所需经验应该递增', () => {
      for (let i = 1; i < VIP_LEVELS.length; i++) {
        expect(VIP_LEVELS[i].requiredExp).toBeGreaterThan(VIP_LEVELS[i - 1].requiredExp);
      }
    });

    it('0 级应该没有特权', () => {
      expect(VIP_LEVELS[0].perks.length).toBe(0);
    });

    it('15 级应该有最多的特权', () => {
      const level15Perks = VIP_LEVELS[15].perks.length;
      VIP_LEVELS.forEach(levelInfo => {
        expect(levelInfo.perks.length).toBeLessThanOrEqual(level15Perks);
      });
    });
  });

  describe('VIP 等级名称和颜色', () => {
    it('应该返回正确的等级名称', () => {
      expect(getVIPLevelName(0)).toBe('平民');
      expect(getVIPLevelName(1)).toBe('VIP1');
      expect(getVIPLevelName(5)).toBe('VIP5');
      expect(getVIPLevelName(10)).toBe('VIP10');
      expect(getVIPLevelName(15)).toBe('VIP15');
      expect(getVIPLevelName(20)).toBe('VIP15'); // 超过 15 级也返回 VIP15
    });

    it('应该返回正确的等级颜色', () => {
      expect(getVIPLevelColor(0)).toBe('text-gray-500');
      expect(getVIPLevelColor(1)).toBe('text-green-500');
      expect(getVIPLevelColor(3)).toBe('text-green-500');
      expect(getVIPLevelColor(4)).toBe('text-blue-500');
      expect(getVIPLevelColor(6)).toBe('text-blue-500');
      expect(getVIPLevelColor(7)).toBe('text-purple-500');
      expect(getVIPLevelColor(9)).toBe('text-purple-500');
      expect(getVIPLevelColor(10)).toBe('text-orange-500');
      expect(getVIPLevelColor(12)).toBe('text-orange-500');
      expect(getVIPLevelColor(13)).toBe('text-red-500');
      expect(getVIPLevelColor(15)).toBe('text-red-500');
    });
  });

  describe('VIP 状态初始化', () => {
    it('应该返回初始状态', () => {
      const state = initializeVIPState();
      
      expect(state.level).toBe(0);
      expect(state.exp).toBe(0);
      expect(state.totalExpEarned).toBe(0);
      expect(state.unlockedPerks).toEqual([]);
    });
  });

  describe('VIP 等级计算', () => {
    it('应该根据经验正确计算等级', () => {
      expect(calculateVIPLvlFromExp(0)).toBe(0);
      expect(calculateVIPLvlFromExp(50)).toBe(0);
      expect(calculateVIPLvlFromExp(100)).toBe(1);
      expect(calculateVIPLvlFromExp(500)).toBe(2); // 500 >= 300 (VIP2)
      expect(calculateVIPLvlFromExp(1000)).toBe(4);
      expect(calculateVIPLvlFromExp(5000)).toBe(8); // 5000 >= 4000 (VIP8)
      expect(calculateVIPLvlFromExp(17500)).toBe(15);
      expect(calculateVIPLvlFromExp(50000)).toBe(15);
    });

    it('应该正确计算到下一级所需经验', () => {
      expect(getExpToNextLevel(0)).toBe(100); // 到 VIP1
      expect(getExpToNextLevel(100)).toBe(200); // 到 VIP2 (300-100)
      expect(getExpToNextLevel(500)).toBe(100); // 到 VIP4 (1000-500 不对，应该是到 VIP3)
      expect(getExpToNextLevel(17500)).toBe(0); // 已满级
    });

    it('应该正确计算进度百分比', () => {
      expect(getVIPProgress(0)).toBe(0);
      expect(getVIPProgress(100)).toBe(0); // 刚到 VIP1，进度 0%
      expect(getVIPProgress(200)).toBe(50); // VIP1 到 VIP2 的 50%
      expect(getVIPProgress(300)).toBe(0); // 刚到 VIP2
      expect(getVIPProgress(17500)).toBe(100); // 满级
    });
  });

  describe('添加 VIP 经验', () => {
    it('应该正确增加经验', () => {
      const state = initializeVIPState();
      const result = addVIPExp(state, 100);
      
      expect(state.exp).toBe(100);
      expect(state.totalExpEarned).toBe(100);
      expect(state.level).toBe(1);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(1);
    });

    it('应该正确升级并解锁特权', () => {
      const state = initializeVIPState();
      addVIPExp(state, 1000);
      
      expect(state.level).toBe(4);
      expect(state.unlockedPerks.length).toBeGreaterThan(0);
    });

    it('多次添加应该累计', () => {
      const state = initializeVIPState();
      addVIPExp(state, 100);
      addVIPExp(state, 200);
      addVIPExp(state, 300);
      
      expect(state.exp).toBe(600);
      expect(state.totalExpEarned).toBe(600);
      expect(state.level).toBe(3);
    });

    it('不应该降级', () => {
      const state: VIPState = {
        level: 10,
        exp: 6600,
        totalExpEarned: 6600,
        unlockedPerks: []
      };
      // 经验不会减少，所以等级也不会降低
      expect(calculateVIPLvlFromExp(state.exp)).toBe(10);
    });
  });

  describe('VIP 特权加成', () => {
    it('应该正确计算离线收益加成', () => {
      const state0 = initializeVIPState();
      expect(getOfflineBonusPercent(state0)).toBe(0);
      
      const state5 = { ...initializeVIPState(), level: 5, exp: 1500, totalExpEarned: 1500, unlockedPerks: [] };
      expect(getOfflineBonusPercent(state5)).toBe(25);
      
      const state15 = { ...initializeVIPState(), level: 15, exp: 17500, totalExpEarned: 17500, unlockedPerks: [] };
      expect(getOfflineBonusPercent(state15)).toBe(75);
    });

    it('应该正确计算金币加成', () => {
      const state0 = initializeVIPState();
      expect(getGoldBonusPercent(state0)).toBe(0);
      
      const state15 = { ...initializeVIPState(), level: 15, exp: 17500, totalExpEarned: 17500, unlockedPerks: [] };
      expect(getGoldBonusPercent(state15)).toBe(30);
    });

    it('应该正确计算经验加成', () => {
      const state0 = initializeVIPState();
      expect(getExpBonusPercent(state0)).toBe(0);
      
      const state15 = { ...initializeVIPState(), level: 15, exp: 17500, totalExpEarned: 17500, unlockedPerks: [] };
      expect(getExpBonusPercent(state15)).toBe(25);
    });

    it('应该正确计算额外副本次数', () => {
      const state0 = initializeVIPState();
      expect(getExtraDungeonEntries(state0)).toBe(0);
      
      const state15 = { ...initializeVIPState(), level: 15, exp: 17500, totalExpEarned: 17500, unlockedPerks: [] };
      expect(getExtraDungeonEntries(state15)).toBe(5);
    });

    it('应该正确计算额外竞技场次数', () => {
      const state0 = initializeVIPState();
      expect(getExtraArenaEntries(state0)).toBe(0);
      
      const state15 = { ...initializeVIPState(), level: 15, exp: 17500, totalExpEarned: 17500, unlockedPerks: [] };
      expect(getExtraArenaEntries(state15)).toBe(3);
    });

    it('应该返回所有已解锁特权', () => {
      const state = { ...initializeVIPState(), level: 3, exp: 600, totalExpEarned: 600, unlockedPerks: [] };
      const perks = getUnlockedPerks(state);
      
      expect(perks.length).toBeGreaterThan(0);
      perks.forEach(perk => {
        expect(perk.unlockedAtLevel).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('VIP 状态保存和加载', () => {
    it('应该正确保存和加载状态', () => {
      const originalState: VIPState = {
        level: 10,
        exp: 7000,
        totalExpEarned: 8000,
        unlockedPerks: ['离线收益 +50%', '金币 +15%']
      };
      
      saveVIPState(originalState);
      const loadedState = loadVIPState();
      
      expect(loadedState.level).toBe(10);
      expect(loadedState.exp).toBe(7000);
      expect(loadedState.totalExpEarned).toBe(8000);
      expect(loadedState.unlockedPerks).toEqual(['离线收益 +50%', '金币 +15%']);
    });

    it('没有保存时应该返回初始状态', () => {
      mockLocalStorage.clear();
      const state = loadVIPState();
      
      expect(state.level).toBe(0);
      expect(state.exp).toBe(0);
    });
  });

  describe('VIP 经验获取', () => {
    it('应该正确计算充值获得的经验', () => {
      expect(purchaseVIPExp(100)).toBe(100);
      expect(purchaseVIPExp(1000)).toBe(1000);
      expect(purchaseVIPExp(0)).toBe(0);
    });

    it('应该正确计算日常活动经验', () => {
      expect(getDailyActivityExp('daily_login')).toBe(10);
      expect(getDailyActivityExp('complete_daily_quest')).toBe(5);
      expect(getDailyActivityExp('complete_achievement')).toBe(20);
      expect(getDailyActivityExp('tower_floor_100')).toBe(50);
      expect(getDailyActivityExp('arena_top_100')).toBe(100);
      expect(getDailyActivityExp('first_purchase')).toBe(200);
      expect(getDailyActivityExp('unknown_activity')).toBe(0);
    });
  });

  describe('VIP 特权类型覆盖', () => {
    it('应该包含所有特权类型', () => {
      const perkTypes = new Set<string>();
      VIP_LEVELS.forEach(level => {
        level.perks.forEach(perk => {
          perkTypes.add(perk.type);
        });
      });
      
      expect(perkTypes.has('offline_bonus')).toBe(true);
      expect(perkTypes.has('dungeon_entries')).toBe(true);
      expect(perkTypes.has('arena_entries')).toBe(true);
      expect(perkTypes.has('gold_bonus')).toBe(true);
      expect(perkTypes.has('exp_bonus')).toBe(true);
    });
  });

  describe('边界条件', () => {
    it('处理负数经验', () => {
      expect(calculateVIPLvlFromExp(-100)).toBe(0);
    });

    it('处理超大经验值', () => {
      expect(calculateVIPLvlFromExp(999999999)).toBe(15);
      expect(getExpToNextLevel(999999999)).toBe(0);
      expect(getVIPProgress(999999999)).toBe(100);
    });
  });
});
