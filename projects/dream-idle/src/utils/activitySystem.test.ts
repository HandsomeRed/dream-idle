/**
 * v0.40 限时活动系统单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ACTIVITIES,
  initializeActivitySystemState,
  isActivityActive,
  getActiveActivities,
  getActivityRemainingTime,
  getActivityRemainingText,
  joinActivity,
  updateActivityTaskProgress,
  claimActivityReward,
  purchaseActivityItem,
  getActivityTaskProgress,
  getActivityCurrency,
  saveActivitySystemState,
  loadActivitySystemState,
  type ActivitySystemState
} from './activitySystem';

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

describe('v0.40 限时活动系统', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('活动配置', () => {
    it('应该有至少 1 个活动', () => {
      expect(ACTIVITIES.length).toBeGreaterThanOrEqual(1);
    });

    it('每个活动都应该有必要的字段', () => {
      ACTIVITIES.forEach(activity => {
        expect(activity.id).toBeDefined();
        expect(activity.name).toBeDefined();
        expect(activity.description).toBeDefined();
        expect(activity.icon).toBeDefined();
        expect(activity.startTime).toBeGreaterThan(0);
        expect(activity.endTime).toBeGreaterThan(activity.startTime);
        expect(activity.type).toBeDefined();
        expect(activity.tasks).toBeDefined();
      });
    });

    it('活动类型应该正确', () => {
      const types = ACTIVITIES.map(a => a.type);
      expect(types).toContainEqual(expect.stringMatching(/^(login|cumulative|challenge|exchange|ranking)$/));
    });
  });

  describe('状态初始化', () => {
    it('应该返回初始状态', () => {
      const state = initializeActivitySystemState();

      expect(state.activeActivities).toEqual([]);
      expect(state.progress).toEqual([]);
      expect(state.totalEventsParticipated).toBe(0);
    });
  });

  describe('活动状态检查', () => {
    it('应该正确判断活动是否在进行中', () => {
      const activity = ACTIVITIES[0];
      
      // 活动开始前
      expect(isActivityActive(activity, activity.startTime - 1000)).toBe(false);
      
      // 活动进行中
      expect(isActivityActive(activity, activity.startTime + 1000)).toBe(true);
      
      // 活动结束后
      expect(isActivityActive(activity, activity.endTime + 1000)).toBe(false);
    });

    it('应该获取正在进行的活动', () => {
      const activity = ACTIVITIES[0];
      const currentTime = activity.startTime + 1000;
      
      const active = getActiveActivities(currentTime);
      expect(active.some(a => a.id === activity.id)).toBe(true);
    });

    it('应该正确计算剩余时间', () => {
      const activity = ACTIVITIES[0];
      const currentTime = activity.startTime;
      
      const remaining = getActivityRemainingTime(activity, currentTime);
      expect(remaining).toBeGreaterThan(0);
    });

    it('应该正确生成剩余时间文本', () => {
      const activity = ACTIVITIES[0];
      
      // 活动未开始
      expect(getActivityRemainingText(activity, activity.startTime - 1000)).not.toBe('已结束');
      
      // 活动已结束
      expect(getActivityRemainingText(activity, activity.endTime + 1000)).toBe('已结束');
    });
  });

  describe('参与活动', () => {
    it('应该成功参与活动', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      
      const newState = joinActivity(state, activity.id);
      expect(newState.activeActivities).toContain(activity.id);
      expect(newState.progress.length).toBe(1);
      expect(newState.totalEventsParticipated).toBe(1);
    });

    it('不能重复参与同一活动', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      
      const state1 = joinActivity(state, activity.id);
      const state2 = joinActivity(state1, activity.id);
      
      expect(state2.activeActivities.filter(id => id === activity.id).length).toBe(1);
    });

    it('参与活动应该初始化任务进度', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      
      const newState = joinActivity(state, activity.id);
      const progress = newState.progress[0];
      
      expect(progress.tasks.length).toBe(activity.tasks.length);
      progress.tasks.forEach(task => {
        expect(task.progress).toBe(0);
        expect(task.completed).toBe(false);
        expect(task.claimed).toBe(false);
      });
    });

    it('参与活动应该初始化活动货币', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES.find(a => a.currency);
      
      if (activity) {
        const newState = joinActivity(state, activity.id);
        const progress = newState.progress[0];
        
        expect(progress.currency[activity.currency.name]).toBe(0);
      }
    });
  });

  describe('更新任务进度', () => {
    it('应该正确更新任务进度', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      const battleTask = activity.tasks.find(t => t.type === 'battle');
      
      if (battleTask) {
        const state1 = joinActivity(state, activity.id);
        const state2 = updateActivityTaskProgress(state1, activity.id, 'battle', 10);
        
        const taskProgress = getActivityTaskProgress(state2, activity.id, battleTask.id);
        expect(taskProgress?.progress).toBe(10);
      }
    });

    it('进度不应该超过目标值', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      const battleTask = activity.tasks.find(t => t.type === 'battle');
      
      if (battleTask) {
        const state1 = joinActivity(state, activity.id);
        const state2 = updateActivityTaskProgress(state1, activity.id, 'battle', 1000);
        
        const taskProgress = getActivityTaskProgress(state2, activity.id, battleTask.id);
        expect(taskProgress?.progress).toBe(battleTask.target);
      }
    });

    it('进度达到目标应该标记为完成', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      const battleTask = activity.tasks.find(t => t.type === 'battle');
      
      if (battleTask) {
        const state1 = joinActivity(state, activity.id);
        const state2 = updateActivityTaskProgress(state1, activity.id, 'battle', battleTask.target);
        
        const taskProgress = getActivityTaskProgress(state2, activity.id, battleTask.id);
        expect(taskProgress?.completed).toBe(true);
      }
    });
  });

  describe('领取奖励', () => {
    it('应该成功领取奖励', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      const battleTask = activity.tasks.find(t => t.type === 'battle');
      
      if (battleTask) {
        const state1 = joinActivity(state, activity.id);
        const state2 = updateActivityTaskProgress(state1, activity.id, 'battle', battleTask.target);
        const claimResult = claimActivityReward(state2, activity.id, battleTask.id);
        
        expect(claimResult.success).toBe(true);
        expect(claimResult.reward).toBeDefined();
      }
    });

    it('未完成任务不能领取奖励', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      const battleTask = activity.tasks.find(t => t.type === 'battle');
      
      if (battleTask) {
        const state1 = joinActivity(state, activity.id);
        const claimResult = claimActivityReward(state1, activity.id, battleTask.id);
        
        expect(claimResult.success).toBe(false);
        expect(claimResult.reason).toContain('未完成');
      }
    });

    it('奖励不能重复领取', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      const battleTask = activity.tasks.find(t => t.type === 'battle');
      
      if (battleTask) {
        const state1 = joinActivity(state, activity.id);
        const state2 = updateActivityTaskProgress(state1, activity.id, 'battle', battleTask.target);
        const claimResult1 = claimActivityReward(state2, activity.id, battleTask.id);
        const claimResult2 = claimActivityReward(claimResult1.newState, activity.id, battleTask.id);
        
        expect(claimResult1.success).toBe(true);
        expect(claimResult2.success).toBe(false);
        expect(claimResult2.reason).toContain('已领取');
      }
    });

    it('货币奖励应该添加到活动货币', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES.find(a => a.currency && a.tasks.some(t => t.reward.type === 'currency'));
      const currencyTask = activity?.tasks.find(t => t.reward.type === 'currency');
      
      if (activity && currencyTask && activity.currency) {
        const state1 = joinActivity(state, activity.id);
        const state2 = updateActivityTaskProgress(state1, activity.id, currencyTask.type, currencyTask.target);
        const claimResult = claimActivityReward(state2, activity.id, currencyTask.id);
        
        if (claimResult.success) {
          const currency = getActivityCurrency(claimResult.newState, activity.id, activity.currency.name);
          expect(currency).toBe(currencyTask.reward.currency || 0);
        }
      }
    });
  });

  describe('商店购买', () => {
    it('应该成功购买物品', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES.find(a => a.shop && a.shop.length > 0);
      
      if (activity && activity.shop[0]) {
        const shopItem = activity.shop[0];
        const state1 = joinActivity(state, activity.id);
        
        // 手动添加货币（模拟完成任务获得）
        state1.progress[0].currency[shopItem.currency] = shopItem.price * 2;
        
        const purchaseResult = purchaseActivityItem(state1, activity.id, shopItem.id);
        expect(purchaseResult.success).toBe(true);
        expect(purchaseResult.item).toBeDefined();
      }
    });

    it('货币不足不能购买', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES.find(a => a.shop && a.shop.length > 0);
      
      if (activity && activity.shop[0]) {
        const shopItem = activity.shop[0];
        const state1 = joinActivity(state, activity.id);
        
        const purchaseResult = purchaseActivityItem(state1, activity.id, shopItem.id);
        expect(purchaseResult.success).toBe(false);
        expect(purchaseResult.reason).toContain('不足');
      }
    });

    it('限购物品不能超额购买', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES.find(a => a.shop && a.shop.some(item => item.limit));
      const shopItem = activity?.shop.find(item => item.limit);
      
      if (activity && shopItem && shopItem.limit) {
        const state1 = joinActivity(state, activity.id);
        state1.progress[0].currency[shopItem.currency] = shopItem.price * (shopItem.limit + 1);
        
        // 购买到上限
        let currentState = state1;
        for (let i = 0; i < shopItem.limit; i++) {
          const result = purchaseActivityItem(currentState, activity.id, shopItem.id);
          if (result.success) currentState = result.newState;
        }
        
        // 尝试超额购买
        const purchaseResult = purchaseActivityItem(currentState, activity.id, shopItem.id);
        expect(purchaseResult.success).toBe(false);
        expect(purchaseResult.reason).toContain('上限');
      }
    });
  });

  describe('进度查询', () => {
    it('应该正确获取任务进度', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES[0];
      const battleTask = activity.tasks.find(t => t.type === 'battle');
      
      if (battleTask) {
        const state1 = joinActivity(state, activity.id);
        const state2 = updateActivityTaskProgress(state1, activity.id, 'battle', 5);
        
        const progress = getActivityTaskProgress(state2, activity.id, battleTask.id);
        expect(progress?.progress).toBe(5);
        expect(progress?.target).toBe(battleTask.target);
      }
    });

    it('未参与活动应该返回 null', () => {
      const state = initializeActivitySystemState();
      const progress = getActivityTaskProgress(state, 'invalid', 'invalid');
      expect(progress).toBeNull();
    });

    it('应该正确获取活动货币数量', () => {
      const state = initializeActivitySystemState();
      const activity = ACTIVITIES.find(a => a.currency);
      
      if (activity) {
        const state1 = joinActivity(state, activity.id);
        state1.progress[0].currency[activity.currency.name] = 100;
        
        const currency = getActivityCurrency(state1, activity.id, activity.currency.name);
        expect(currency).toBe(100);
      }
    });
  });

  describe('状态保存和加载', () => {
    it('应该正确保存和加载状态', () => {
      const activity = ACTIVITIES[0];
      const originalState: ActivitySystemState = {
        activeActivities: [activity.id],
        progress: [{
          activityId: activity.id,
          tasks: activity.tasks.map(t => ({
            taskId: t.id,
            progress: 50,
            completed: false,
            claimed: false
          })),
          currency: { '庆典币': 100 },
          shopPurchases: { 'shop-1': 2 }
        }],
        totalEventsParticipated: 1
      };

      saveActivitySystemState(originalState);
      const loadedState = loadActivitySystemState();

      expect(loadedState.activeActivities).toContain(activity.id);
      expect(loadedState.progress.length).toBe(1);
      expect(loadedState.totalEventsParticipated).toBe(1);
    });

    it('没有保存时应该返回初始状态', () => {
      mockLocalStorage.clear();
      const state = loadActivitySystemState();

      expect(state.activeActivities).toEqual([]);
      expect(state.progress).toEqual([]);
    });
  });
});
