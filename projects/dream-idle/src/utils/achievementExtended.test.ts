/**
 * v0.42 成就系统扩展单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENTS,
  initializeAchievementSystemState,
  updateAchievementProgress,
  claimAchievementReward,
  equipTitle,
  unequipTitle,
  getAchievementInfo,
  getAchievementsByCategory,
  getAchievementProgressPercent,
  getCategoryCompletion,
  getHiddenAchievements,
  saveAchievementSystemState,
  loadAchievementSystemState,
  getAchievementTypeName,
  type AchievementSystemState
} from './achievementExtended';

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

describe('v0.42 成就系统扩展', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('成就配置', () => {
    it('应该有至少 5 个成就分类', () => {
      expect(ACHIEVEMENT_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    });

    it('每个分类都应该有必要的字段', () => {
      ACHIEVEMENT_CATEGORIES.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.order).toBeGreaterThan(0);
      });
    });

    it('应该有至少 15 个成就', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
    });

    it('每个成就都应该有必要的字段', () => {
      ACHIEVEMENTS.forEach(achievement => {
        expect(achievement.id).toBeDefined();
        expect(achievement.categoryId).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.icon).toBeDefined();
        expect(achievement.requirement).toBeDefined();
        expect(achievement.reward).toBeDefined();
        expect(achievement.points).toBeGreaterThan(0);
      });
    });

    it('成就分类应该覆盖所有成就', () => {
      const categoryIds = ACHIEVEMENT_CATEGORIES.map(c => c.id);
      ACHIEVEMENTS.forEach(achievement => {
        expect(categoryIds).toContain(achievement.categoryId);
      });
    });
  });

  describe('状态初始化', () => {
    it('应该返回初始状态', () => {
      const state = initializeAchievementSystemState();

      expect(state.progress.length).toBe(ACHIEVEMENTS.length);
      expect(state.totalPoints).toBe(0);
      expect(state.completedCount).toBe(0);
      expect(state.titles).toEqual([]);
      expect(state.equippedTitle).toBeUndefined();
    });

    it('应该初始化所有成就进度', () => {
      const state = initializeAchievementSystemState();

      ACHIEVEMENTS.forEach(achievement => {
        const progress = state.progress.find(p => p.achievementId === achievement.id);
        expect(progress).toBeDefined();
        expect(progress?.progress).toBe(0);
        expect(progress?.completed).toBe(false);
        expect(progress?.claimed).toBe(false);
      });
    });
  });

  describe('更新成就进度', () => {
    it('应该正确更新成就进度', () => {
      const state = initializeAchievementSystemState();
      const newState = updateAchievementProgress(state, 'level', 10);

      const level10Progress = newState.progress.find(p => p.achievementId === 'level-10');
      expect(level10Progress?.progress).toBe(10);
      expect(level10Progress?.completed).toBe(true);
    });

    it('进度不应该超过目标值', () => {
      const state = initializeAchievementSystemState();
      const newState = updateAchievementProgress(state, 'level', 1000);

      const level10Progress = newState.progress.find(p => p.achievementId === 'level-10');
      expect(level10Progress?.progress).toBe(10);
    });

    it('应该正确计算总成就点数', () => {
      const state = initializeAchievementSystemState();
      let newState = updateAchievementProgress(state, 'level', 10);
      newState = updateAchievementProgress(newState, 'battle_count', 100);

      const level10 = ACHIEVEMENTS.find(a => a.id === 'level-10');
      const battle100 = ACHIEVEMENTS.find(a => a.id === 'battle-100');
      const expectedPoints = (level10?.points || 0) + (battle100?.points || 0);

      expect(newState.totalPoints).toBeGreaterThanOrEqual(20);
      expect(newState.completedCount).toBeGreaterThanOrEqual(2);
    });

    it('已完成的成就不应该重复更新', () => {
      const state = initializeAchievementSystemState();
      let newState = updateAchievementProgress(state, 'level', 10);
      const firstCompletedAt = newState.progress.find(p => p.achievementId === 'level-10')?.completedAt;

      newState = updateAchievementProgress(newState, 'level', 50);
      const secondCompletedAt = newState.progress.find(p => p.achievementId === 'level-10')?.completedAt;

      expect(firstCompletedAt).toBeDefined();
      expect(firstCompletedAt).toBe(secondCompletedAt);
    });
  });

  describe('领取成就奖励', () => {
    it('应该成功领取奖励', () => {
      const state = initializeAchievementSystemState();
      const state1 = updateAchievementProgress(state, 'level', 10);
      const result = claimAchievementReward(state1, 'level-10');

      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(result.newState.progress.find(p => p.achievementId === 'level-10')?.claimed).toBe(true);
    });

    it('未完成不能领取奖励', () => {
      const state = initializeAchievementSystemState();
      const result = claimAchievementReward(state, 'level-10');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('未完成');
    });

    it('奖励不能重复领取', () => {
      const state = initializeAchievementSystemState();
      const state1 = updateAchievementProgress(state, 'level', 10);
      const result1 = claimAchievementReward(state1, 'level-10');
      const result2 = claimAchievementReward(result1.newState, 'level-10');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.reason).toContain('已领取');
    });

    it('称号奖励应该添加到称号列表', () => {
      const state = initializeAchievementSystemState();
      const state1 = updateAchievementProgress(state, 'level', 100);
      const result = claimAchievementReward(state1, 'level-100');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newState.titles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('装备/卸下称号', () => {
    it('应该成功装备称号', () => {
      const state: AchievementSystemState = {
        ...initializeAchievementSystemState(),
        titles: ['master']
      };

      const result = equipTitle(state, 'master');
      expect(result.success).toBe(true);
      expect(result.newState.equippedTitle).toBe('master');
    });

    it('不能装备未拥有的称号', () => {
      const state = initializeAchievementSystemState();
      const result = equipTitle(state, 'master');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('未拥有');
    });

    it('应该成功卸下称号', () => {
      const state: AchievementSystemState = {
        ...initializeAchievementSystemState(),
        titles: ['master'],
        equippedTitle: 'master'
      };

      const newState = unequipTitle(state);
      expect(newState.equippedTitle).toBeUndefined();
    });
  });

  describe('成就信息查询', () => {
    it('应该正确获取成就信息', () => {
      const achievement = getAchievementInfo('level-10');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('初出茅庐');
      expect(achievement?.points).toBe(10);
    });

    it('无效 ID 应该返回 undefined', () => {
      const achievement = getAchievementInfo('invalid');
      expect(achievement).toBeUndefined();
    });

    it('应该正确获取分类下的成就', () => {
      const growthAchievements = getAchievementsByCategory('growth');
      expect(growthAchievements.length).toBeGreaterThan(0);
      growthAchievements.forEach(a => {
        expect(a.categoryId).toBe('growth');
      });
    });
  });

  describe('进度百分比计算', () => {
    it('应该正确计算进度百分比', () => {
      expect(getAchievementProgressPercent('level-10', 0)).toBe(0);
      expect(getAchievementProgressPercent('level-10', 5)).toBe(50);
      expect(getAchievementProgressPercent('level-10', 10)).toBe(100);
      expect(getAchievementProgressPercent('level-10', 100)).toBe(100);
    });

    it('应该正确计算分类完成度', () => {
      const state = initializeAchievementSystemState();
      const state1 = updateAchievementProgress(state, 'level', 10);

      const completion = getCategoryCompletion('growth', state1);
      expect(completion.completed).toBeGreaterThanOrEqual(1);
      expect(completion.total).toBeGreaterThan(0);
      expect(completion.percent).toBeGreaterThan(0);
    });
  });

  describe('隐藏成就', () => {
    it('应该只返回已完成的隐藏成就', () => {
      const state = initializeAchievementSystemState();
      const hidden = getHiddenAchievements(state);
      expect(hidden.length).toBe(0);

      // 完成一个隐藏成就
      const state1 = updateAchievementProgress(state, 'battle_count', 1);
      const hidden1 = getHiddenAchievements(state1);
      expect(hidden1.some(a => a.id === 'first-blood')).toBe(true);
    });
  });

  describe('成就类型名称', () => {
    it('应该正确获取类型名称', () => {
      expect(getAchievementTypeName('level')).toBe('等级');
      expect(getAchievementTypeName('battle_count')).toBe('战斗次数');
      expect(getAchievementTypeName('win_count')).toBe('胜利次数');
      expect(getAchievementTypeName('pet_count')).toBe('宠物数量');
      expect(getAchievementTypeName('tower_floor')).toBe('爬塔层数');
      expect(getAchievementTypeName('arena_rank')).toBe('竞技场排名');
    });
  });

  describe('状态保存和加载', () => {
    it('应该正确保存和加载状态', () => {
      const originalState: AchievementSystemState = {
        progress: [
          { achievementId: 'level-10', progress: 10, completed: true, claimed: true, completedAt: Date.now() },
          { achievementId: 'battle-100', progress: 50, completed: false, claimed: false }
        ],
        totalPoints: 10,
        completedCount: 1,
        titles: ['master'],
        equippedTitle: 'master'
      };

      saveAchievementSystemState(originalState);
      const loadedState = loadAchievementSystemState();

      expect(loadedState.totalPoints).toBe(10);
      expect(loadedState.completedCount).toBe(1);
      expect(loadedState.titles).toContain('master');
      expect(loadedState.equippedTitle).toBe('master');
    });

    it('没有保存时应该返回初始状态', () => {
      mockLocalStorage.clear();
      const state = loadAchievementSystemState();

      expect(state.totalPoints).toBe(0);
      expect(state.completedCount).toBe(0);
    });
  });
});
