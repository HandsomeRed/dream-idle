/**
 * v0.38 通行证系统单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  BATTLE_PASS_TIERS,
  BATTLE_PASS_SEASONS,
  DAILY_MISSIONS,
  WEEKLY_MISSIONS,
  initializeBattlePassState,
  getExpToNextLevel,
  addBattlePassExp,
  claimReward,
  purchasePremium,
  checkDailyReset,
  getBattlePassProgress,
  saveBattlePassState,
  loadBattlePassState,
  getCurrentSeason,
  getSeasonRemainingDays,
  type BattlePassState
} from './battlePass';

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

describe('v0.38 通行证系统', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('通行证配置', () => {
    it('应该有 50 个等级', () => {
      expect(BATTLE_PASS_TIERS.length).toBe(50);
    });

    it('每个等级都应该有免费奖励', () => {
      BATTLE_PASS_TIERS.forEach(tier => {
        expect(tier.level).toBeGreaterThan(0);
        expect(tier.freeReward).toBeDefined();
      });
    });

    it('高级奖励应该更丰厚', () => {
      BATTLE_PASS_TIERS.forEach(tier => {
        if (tier.premiumReward) {
          // 高级奖励至少有一项
          expect(
            tier.premiumReward.gold ||
            tier.premiumReward.diamond ||
            tier.premiumReward.item ||
            tier.premiumReward.petFragment
          ).toBeDefined();
        }
      });
    });

    it('50 级应该有最终大奖', () => {
      const tier50 = BATTLE_PASS_TIERS.find(t => t.level === 50);
      expect(tier50).toBeDefined();
      expect(tier50?.premiumReward?.diamond).toBe(1000);
    });
  });

  describe('赛季配置', () => {
    it('应该有至少 1 个赛季', () => {
      expect(BATTLE_PASS_SEASONS.length).toBeGreaterThanOrEqual(1);
    });

    it('赛季应该有必要的字段', () => {
      BATTLE_PASS_SEASONS.forEach(season => {
        expect(season.seasonId).toBeGreaterThan(0);
        expect(season.name).toBeDefined();
        expect(season.startDate).toBeGreaterThan(0);
        expect(season.endDate).toBeGreaterThan(season.startDate);
        expect(season.theme).toBeDefined();
      });
    });
  });

  describe('任务配置', () => {
    it('应该有每日任务', () => {
      expect(DAILY_MISSIONS.length).toBeGreaterThan(0);
    });

    it('应该有每周任务', () => {
      expect(WEEKLY_MISSIONS.length).toBeGreaterThan(0);
    });

    it('任务应该有必要的字段', () => {
      [...DAILY_MISSIONS, ...WEEKLY_MISSIONS].forEach(mission => {
        expect(mission.id).toBeDefined();
        expect(mission.name).toBeDefined();
        expect(mission.description).toBeDefined();
        expect(mission.expReward).toBeGreaterThan(0);
        expect(mission.requirement).toBeDefined();
      });
    });
  });

  describe('通行证状态初始化', () => {
    it('应该返回初始状态', () => {
      const state = initializeBattlePassState();

      expect(state.currentSeason).toBe(1);
      expect(state.level).toBe(1);
      expect(state.exp).toBe(0);
      expect(state.isPremium).toBe(false);
      expect(state.claimedRewards).toEqual([]);
      expect(state.completedMissions).toEqual([]);
    });
  });

  describe('升级经验计算', () => {
    it('每级应该需要 100 经验', () => {
      expect(getExpToNextLevel(1)).toBe(100);
      expect(getExpToNextLevel(10)).toBe(100);
      expect(getExpToNextLevel(49)).toBe(100);
    });

    it('50 级满级后不需要经验', () => {
      expect(getExpToNextLevel(50)).toBe(0);
      expect(getExpToNextLevel(51)).toBe(0);
    });
  });

  describe('添加通行证经验', () => {
    it('应该正确增加经验', () => {
      const state = initializeBattlePassState();
      const result = addBattlePassExp(state, 50);

      expect(result.leveledUp).toBe(false);
      expect(result.newLevel).toBe(1);
      expect(result.rewards.length).toBe(0);
    });

    it('应该正确升级', () => {
      const state = initializeBattlePassState();
      const result = addBattlePassExp(state, 100);

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('应该返回可领取的奖励', () => {
      const state = initializeBattlePassState();
      const result = addBattlePassExp(state, 100);

      expect(result.rewards.length).toBe(1);
      expect(result.rewards[0].level).toBe(2);
    });

    it('多次升级应该返回所有奖励', () => {
      const state = initializeBattlePassState();
      const result = addBattlePassExp(state, 500);

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(6);
      expect(result.rewards.length).toBe(5); // 2, 3, 4, 5, 6 级
    });

    it('50 级后不应该继续升级', () => {
      const state: BattlePassState = {
        currentSeason: 1,
        level: 50,
        exp: 0,
        isPremium: false,
        claimedRewards: [],
        completedMissions: [],
        dailyMissionsReset: Date.now()
      };

      const result = addBattlePassExp(state, 1000);
      expect(result.newLevel).toBe(50);
      expect(result.leveledUp).toBe(false);
    });
  });

  describe('领取奖励', () => {
    it('应该成功领取免费奖励', () => {
      const state = initializeBattlePassState();
      const expResult = addBattlePassExp(state, 100);
      const updatedState: BattlePassState = { ...state, level: expResult.newLevel, exp: 0 };
      const claimResult = claimReward(updatedState, 2);

      expect(claimResult.success).toBe(true);
      expect(claimResult.reward).toBeDefined();
    });

    it('等级不足无法领取', () => {
      const state = initializeBattlePassState();
      const result = claimReward(state, 10);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('等级不足');
    });

    it('奖励不能重复领取', () => {
      const state = initializeBattlePassState();
      const expResult = addBattlePassExp(state, 100);
      const updatedState: BattlePassState = { ...state, level: expResult.newLevel, exp: 0 };
      const claimResult1 = claimReward(updatedState, 2);
      const claimResult2 = claimReward(claimResult1.newState, 2);

      expect(claimResult1.success).toBe(true);
      expect(claimResult2.success).toBe(false);
      expect(claimResult2.reason).toContain('已领取');
    });

    it('无效等级无法领取', () => {
      const state = initializeBattlePassState();
      const result = claimReward(state, 100);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('无效');
    });
  });

  describe('购买高级通行证', () => {
    it('应该成功购买高级通行证', () => {
      const state = initializeBattlePassState();
      const result = purchasePremium(state);

      expect(result.success).toBe(true);
      expect(result.newState.isPremium).toBe(true);
    });

    it('不能重复购买', () => {
      const state = initializeBattlePassState();
      const result1 = purchasePremium(state);
      const result2 = purchasePremium(result1.newState);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.reason).toContain('已购买');
    });

    it('应该补发之前的 premium 奖励', () => {
      const state = initializeBattlePassState();
      // 先升到 10 级
      const expResult = addBattlePassExp(state, 900);
      const updatedState: BattlePassState = { ...state, level: expResult.newLevel, exp: 0 };
      // 再购买高级通行证
      const purchaseResult = purchasePremium(updatedState);

      expect(purchaseResult.success).toBe(true);
      expect(purchaseResult.retroactiveRewards).toBeDefined();
      expect(purchaseResult.retroactiveRewards!.length).toBeGreaterThan(0);
    });
  });

  describe('每日任务刷新', () => {
    it('未超过 24 小时不应该刷新', () => {
      const state = initializeBattlePassState();
      const currentTime = state.dailyMissionsReset + 12 * 60 * 60 * 1000; // 12 小时后

      const newState = checkDailyReset(state, currentTime);
      expect(newState.dailyMissionsReset).toBe(state.dailyMissionsReset);
    });

    it('超过 24 小时应该刷新', () => {
      const state = initializeBattlePassState();
      const currentTime = state.dailyMissionsReset + 25 * 60 * 60 * 1000; // 25 小时后

      const newState = checkDailyReset(state, currentTime);
      expect(newState.dailyMissionsReset).toBe(currentTime);
    });
  });

  describe('进度计算', () => {
    it('应该正确计算进度百分比', () => {
      const state = initializeBattlePassState();
      expect(getBattlePassProgress(state)).toBe(0);

      const state2 = { ...state, exp: 50 };
      expect(getBattlePassProgress(state2)).toBe(50);

      const state3 = { ...state, exp: 50, level: 2 }; // 升级后 exp 从 0 开始
      expect(getBattlePassProgress(state3)).toBe(50);
    });

    it('50 级应该显示 100%', () => {
      const state: BattlePassState = {
        currentSeason: 1,
        level: 50,
        exp: 0,
        isPremium: false,
        claimedRewards: [],
        completedMissions: [],
        dailyMissionsReset: Date.now()
      };

      expect(getBattlePassProgress(state)).toBe(100);
    });
  });

  describe('状态保存和加载', () => {
    it('应该正确保存和加载状态', () => {
      const originalState: BattlePassState = {
        currentSeason: 1,
        level: 25,
        exp: 50,
        isPremium: true,
        claimedRewards: [1, 2, 3, 4, 5],
        completedMissions: ['daily-battle-5'],
        dailyMissionsReset: Date.now()
      };

      saveBattlePassState(originalState);
      const loadedState = loadBattlePassState();

      expect(loadedState.level).toBe(25);
      expect(loadedState.exp).toBe(50);
      expect(loadedState.isPremium).toBe(true);
      expect(loadedState.claimedRewards).toEqual([1, 2, 3, 4, 5]);
    });

    it('没有保存时应该返回初始状态', () => {
      mockLocalStorage.clear();
      const state = loadBattlePassState();

      expect(state.level).toBe(1);
      expect(state.exp).toBe(0);
    });
  });

  describe('赛季查询', () => {
    it('应该正确获取当前赛季', () => {
      const season1 = BATTLE_PASS_SEASONS[0];
      const currentTime = season1.startDate + 1000;

      const current = getCurrentSeason(currentTime);
      expect(current).toBeDefined();
      expect(current?.seasonId).toBe(season1.seasonId);
    });

    it('赛季外应该返回 null', () => {
      const currentTime = new Date('2025-01-01').getTime();
      const current = getCurrentSeason(currentTime);
      expect(current).toBeNull();
    });

    it('应该正确计算赛季剩余天数', () => {
      const season = BATTLE_PASS_SEASONS[0];
      const currentTime = season.startDate;
      const remaining = getSeasonRemainingDays(season, currentTime);

      expect(remaining).toBe(30); // 30 天赛季
    });

    it('过期赛季剩余天数应该为 0', () => {
      const season = BATTLE_PASS_SEASONS[0];
      const currentTime = season.endDate + 1000;
      const remaining = getSeasonRemainingDays(season, currentTime);

      expect(remaining).toBe(0);
    });
  });
});
