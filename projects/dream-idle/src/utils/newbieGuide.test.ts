/**
 * v0.34 新手引导系统单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  GUIDE_STEPS,
  getGuideProgress,
  saveGuideProgress,
  shouldTriggerGuide,
  completeGuideStep,
  skipGuideStep,
  toggleGuide,
  resetGuideProgress,
  getGuideCompletionRate,
  getGuideStepsSummary,
  type GuideProgress
} from './newbieGuide';

// Mock localStorage with proper persistence
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

describe('v0.34 新手引导系统', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('引导配置', () => {
    it('应该有 10 个引导步骤', () => {
      expect(GUIDE_STEPS.length).toBe(10);
    });

    it('每个步骤都应该有必要的字段', () => {
      GUIDE_STEPS.forEach((step, index) => {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.triggerCondition).toBeDefined();
        expect(step.completeCondition).toBeDefined();
        
        // 验证 ID 格式
        expect(step.id).toMatch(/^step-\d+-/);
      });
    });

    it('步骤应该按逻辑顺序排列', () => {
      const expectedOrder = [
        'create-character',
        'first-battle',
        'level-1-clear',
        'pet-gacha',
        'pet-level-up',
        'formation',
        'tower',
        'arena',
        'daily-quest',
        'checkin'
      ];

      GUIDE_STEPS.forEach((step, index) => {
        expect(step.id).toContain(expectedOrder[index]);
      });
    });
  });

  describe('引导进度管理', () => {
    it('首次获取进度应该返回默认值', () => {
      const progress = getGuideProgress();
      
      expect(progress.currentStepId).toBe('step-1-create-character');
      expect(progress.completedSteps).toEqual([]);
      expect(progress.skippedSteps).toEqual([]);
      expect(progress.totalSteps).toBe(10);
      expect(progress.completedCount).toBe(0);
      expect(progress.isGuideEnabled).toBe(true);
    });

    it('保存和读取进度应该一致', () => {
      const testProgress: GuideProgress = {
        currentStepId: 'step-3-level-1-clear',
        completedSteps: ['step-1-create-character', 'step-2-first-battle'],
        skippedSteps: [],
        totalSteps: 10,
        completedCount: 2,
        isGuideEnabled: true
      };

      saveGuideProgress(testProgress);
      const retrieved = getGuideProgress();

      expect(retrieved).toEqual(testProgress);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('重置进度应该恢复到初始状态', () => {
      // 先设置一些进度
      const progress: GuideProgress = {
        currentStepId: 'step-5-pet-level-up',
        completedSteps: ['step-1', 'step-2', 'step-3', 'step-4'],
        skippedSteps: ['step-6'],
        totalSteps: 10,
        completedCount: 4,
        isGuideEnabled: false
      };
      saveGuideProgress(progress);

      // 重置
      resetGuideProgress();
      const reset = getGuideProgress();

      expect(reset.currentStepId).toBe('step-1-create-character');
      expect(reset.completedSteps).toEqual([]);
      expect(reset.skippedSteps).toEqual([]);
      expect(reset.completedCount).toBe(0);
      expect(reset.isGuideEnabled).toBe(true);
    });
  });

  describe('引导触发逻辑', () => {
    it('引导禁用时不应该触发', () => {
      const progress: GuideProgress = {
        currentStepId: 'step-1-create-character',
        completedSteps: [],
        skippedSteps: [],
        totalSteps: 10,
        completedCount: 0,
        isGuideEnabled: false
      };
      saveGuideProgress(progress);

      const result = shouldTriggerGuide();
      expect(result).toBeNull();
    });

    it('第一步应该始终可以触发', () => {
      // 不设置任何数据，模拟新玩家
      mockLocalStorage.clear();
      
      const progress = getGuideProgress();
      expect(progress.currentStepId).toBe('step-1-create-character');
      
      // 第一步的触发条件始终为 true
      const step = GUIDE_STEPS[0];
      expect(step.triggerCondition()).toBe(true);
    });

    it('已完成的步骤不应该再次触发', () => {
      const progress: GuideProgress = {
        currentStepId: 'step-2-first-battle',
        completedSteps: ['step-1-create-character'],
        skippedSteps: [],
        totalSteps: 10,
        completedCount: 1,
        isGuideEnabled: true
      };
      saveGuideProgress(progress);

      const result = shouldTriggerGuide();
      expect(result?.id).toBe('step-2-first-battle');
    });

    it('跳过的步骤不应该触发', () => {
      const progress: GuideProgress = {
        currentStepId: 'step-3-level-1-clear',
        completedSteps: ['step-1-create-character'],
        skippedSteps: ['step-2-first-battle'],
        totalSteps: 10,
        completedCount: 1,
        isGuideEnabled: true
      };
      saveGuideProgress(progress);

      const result = shouldTriggerGuide();
      expect(result?.id).toBe('step-3-level-1-clear');
    });
  });

  describe('完成引导步骤', () => {
    it('完成条件不满足时应该失败', () => {
      // 不设置任何完成数据
      const result = completeGuideStep('step-1-create-character');
      expect(result.success).toBe(false);
    });

    it('完成条件满足时应该成功并给予奖励', () => {
      // 模拟角色已创建
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'dream-idle-player') {
          return JSON.stringify({ name: 'TestPlayer', level: 1 });
        }
        return null;
      });

      const result = completeGuideStep('step-1-create-character');
      expect(result.success).toBe(true);
      expect(result.reward).toEqual({ gold: 1000, diamond: 100 });

      // 验证进度已更新
      const progress = getGuideProgress();
      expect(progress.completedSteps).toContain('step-1-create-character');
      expect(progress.completedCount).toBe(1);
      expect(progress.currentStepId).toBe('step-2-first-battle');
    });

    it('重复完成应该失败', () => {
      // 先完成一次
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'dream-idle-player') {
          return JSON.stringify({ name: 'TestPlayer', level: 1 });
        }
        return null;
      });

      completeGuideStep('step-1-create-character');
      
      // 尝试再次完成
      const result = completeGuideStep('step-1-create-character');
      expect(result.success).toBe(false);
    });

    it('完成最后一步后 currentStepId 应该为 null', () => {
      // 设置前 9 步已完成
      const progress: GuideProgress = {
        currentStepId: 'step-10-checkin',
        completedSteps: GUIDE_STEPS.slice(0, 9).map(s => s.id),
        skippedSteps: [],
        totalSteps: 10,
        completedCount: 9,
        isGuideEnabled: true
      };
      saveGuideProgress(progress);

      // 模拟签到完成
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'dream-idle-checkin') {
          return JSON.stringify({ totalDays: 1 });
        }
        return null;
      });

      const result = completeGuideStep('step-10-checkin');
      expect(result.success).toBe(true);

      const finalProgress = getGuideProgress();
      expect(finalProgress.currentStepId).toBeNull();
      expect(finalProgress.completedCount).toBe(10);
    });
  });

  describe('跳过引导步骤', () => {
    it('跳过步骤应该添加到 skippedSteps', () => {
      skipGuideStep('step-2-first-battle');
      
      const progress = getGuideProgress();
      expect(progress.skippedSteps).toContain('step-2-first-battle');
      expect(progress.currentStepId).toBe('step-3-level-1-clear');
    });

    it('重复跳过应该只记录一次', () => {
      skipGuideStep('step-2-first-battle');
      skipGuideStep('step-2-first-battle');
      skipGuideStep('step-2-first-battle');
      
      const progress = getGuideProgress();
      expect(progress.skippedSteps.filter(id => id === 'step-2-first-battle').length).toBe(1);
    });

    it('跳过最后一步后 currentStepId 应该为 null', () => {
      // 设置前 9 步已完成或跳过
      const progress: GuideProgress = {
        currentStepId: 'step-10-checkin',
        completedSteps: GUIDE_STEPS.slice(0, 9).map(s => s.id),
        skippedSteps: [],
        totalSteps: 10,
        completedCount: 9,
        isGuideEnabled: true
      };
      saveGuideProgress(progress);

      skipGuideStep('step-10-checkin');
      
      const finalProgress = getGuideProgress();
      expect(finalProgress.currentStepId).toBeNull();
    });
  });

  describe('引导开关', () => {
    it('禁用引导', () => {
      toggleGuide(false);
      
      const progress = getGuideProgress();
      expect(progress.isGuideEnabled).toBe(false);
    });

    it('启用引导', () => {
      toggleGuide(false);
      toggleGuide(true);
      
      const progress = getGuideProgress();
      expect(progress.isGuideEnabled).toBe(true);
    });

    it('禁用后不应该触发引导', () => {
      toggleGuide(false);
      
      const result = shouldTriggerGuide();
      expect(result).toBeNull();
    });
  });

  describe('完成度计算', () => {
    it('初始完成度应该是 0%', () => {
      const rate = getGuideCompletionRate();
      expect(rate).toBe(0);
    });

    it('完成 5 步应该是 50%', () => {
      const progress: GuideProgress = {
        currentStepId: 'step-6-formation',
        completedSteps: GUIDE_STEPS.slice(0, 5).map(s => s.id),
        skippedSteps: [],
        totalSteps: 10,
        completedCount: 5,
        isGuideEnabled: true
      };
      saveGuideProgress(progress);

      const rate = getGuideCompletionRate();
      expect(rate).toBe(50);
    });

    it('全部完成应该是 100%', () => {
      const progress: GuideProgress = {
        currentStepId: null,
        completedSteps: GUIDE_STEPS.map(s => s.id),
        skippedSteps: [],
        totalSteps: 10,
        completedCount: 10,
        isGuideEnabled: true
      };
      saveGuideProgress(progress);

      const rate = getGuideCompletionRate();
      expect(rate).toBe(100);
    });
  });

  describe('步骤概要信息', () => {
    it('应该返回所有步骤的概要', () => {
      const progress: GuideProgress = {
        currentStepId: 'step-3-level-1-clear',
        completedSteps: ['step-1-create-character', 'step-2-first-battle'],
        skippedSteps: ['step-4-pet-gacha'],
        totalSteps: 10,
        completedCount: 2,
        isGuideEnabled: true
      };
      saveGuideProgress(progress);

      const summary = getGuideStepsSummary();
      
      expect(summary.length).toBe(10);
      expect(summary[0].completed).toBe(true);
      expect(summary[1].completed).toBe(true);
      expect(summary[2].completed).toBe(false);
      expect(summary[3].skipped).toBe(true);
      expect(summary[0].reward).toBeDefined();
    });

    it('每个步骤概要都应该包含必要字段', () => {
      const summary = getGuideStepsSummary();
      
      summary.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('completed');
        expect(item).toHaveProperty('skipped');
        expect(item).toHaveProperty('reward');
      });
    });
  });

  describe('引导奖励验证', () => {
    it('所有步骤都应该有奖励', () => {
      GUIDE_STEPS.forEach(step => {
        expect(step.reward).toBeDefined();
        // 至少有一种奖励
        expect(
          step.reward?.gold || step.reward?.diamond || step.reward?.item
        ).toBeDefined();
      });
    });

    it('奖励应该是合理的数值', () => {
      GUIDE_STEPS.forEach(step => {
        if (step.reward?.gold) {
          expect(step.reward.gold).toBeGreaterThan(0);
          expect(step.reward.gold).toBeLessThan(100000);
        }
        if (step.reward?.diamond) {
          expect(step.reward.diamond).toBeGreaterThan(0);
          expect(step.reward.diamond).toBeLessThan(10000);
        }
      });
    });
  });
});
