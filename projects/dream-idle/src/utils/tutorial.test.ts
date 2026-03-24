/**
 * v0.57 引导教程系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createTutorialState,
  canTriggerTutorial,
  getTriggeredTutorials,
  startTutorial,
  advanceStep,
  skipTutorial,
  replayTutorial,
  getCurrentStep,
  getTutorialCompletionRate,
  getTutorialsByCategory,
  getTutorialStats,
  exportTutorialState,
  importTutorialState,
  TUTORIALS,
  TutorialState,
} from './tutorial'

describe('v0.57 引导教程系统', () => {
  let state: TutorialState

  beforeEach(() => {
    state = createTutorialState()
  })

  describe('初始化', () => {
    it('应该创建空教程状态', () => {
      expect(state.progress.size).toBe(0)
      expect(state.activeTutorial).toBeNull()
      expect(state.totalCompleted).toBe(0)
    })
  })

  describe('教程触发', () => {
    it('first_login 教程应该可以触发', () => {
      expect(canTriggerTutorial(state, 'tut_welcome', 1)).toBe(true)
    })

    it('等级不足时不触发', () => {
      // tut_battle 需要 2 级且需要 tut_welcome 完成
      expect(canTriggerTutorial(state, 'tut_battle', 1)).toBe(false)
    })

    it('前置教程未完成时不触发', () => {
      expect(canTriggerTutorial(state, 'tut_battle', 10)).toBe(false)
    })

    it('前置完成且等级足够时可以触发', () => {
      // 完成 welcome
      startTutorial(state, 'tut_welcome')
      advanceStep(state)
      advanceStep(state)
      advanceStep(state)

      expect(canTriggerTutorial(state, 'tut_battle', 5)).toBe(true)
    })

    it('已完成的教程不再触发', () => {
      startTutorial(state, 'tut_welcome')
      advanceStep(state)
      advanceStep(state)
      advanceStep(state)

      expect(canTriggerTutorial(state, 'tut_welcome', 1)).toBe(false)
    })

    it('禁用教程时不触发', () => {
      state.tutorialsDisabled = true
      expect(canTriggerTutorial(state, 'tut_welcome', 1)).toBe(false)
    })

    it('获取可触发教程列表', () => {
      const triggered = getTriggeredTutorials(state, 1)
      expect(triggered.length).toBe(1)
      expect(triggered[0].id).toBe('tut_welcome')
    })
  })

  describe('教程流程', () => {
    it('应该开始教程', () => {
      const result = startTutorial(state, 'tut_welcome')

      expect(result.success).toBe(true)
      expect(state.activeTutorial).toBe('tut_welcome')
    })

    it('不能同时进行两个教程', () => {
      startTutorial(state, 'tut_welcome')
      const result = startTutorial(state, 'tut_battle')

      expect(result.success).toBe(false)
      expect(result.reason).toContain('进行中')
    })

    it('不存在的教程返回错误', () => {
      const result = startTutorial(state, 'nonexistent')
      expect(result.success).toBe(false)
    })

    it('应该获取当前步骤', () => {
      startTutorial(state, 'tut_welcome')
      const step = getCurrentStep(state)

      expect(step).not.toBeNull()
      expect(step!.id).toBe('welcome_1')
    })

    it('应该前进到下一步', () => {
      startTutorial(state, 'tut_welcome')

      const result1 = advanceStep(state)
      expect(result1.success).toBe(true)
      expect(result1.tutorialComplete).toBe(false)

      const step = getCurrentStep(state)
      expect(step!.id).toBe('welcome_2')
    })

    it('完成所有步骤后教程完成', () => {
      startTutorial(state, 'tut_welcome')

      advanceStep(state)
      advanceStep(state)
      const result = advanceStep(state)

      expect(result.tutorialComplete).toBe(true)
      expect(state.activeTutorial).toBeNull()
      expect(state.totalCompleted).toBe(1)
    })

    it('步骤奖励应该返回', () => {
      startTutorial(state, 'tut_welcome')

      advanceStep(state) // step 1 无奖励
      advanceStep(state) // step 2 无奖励
      const result = advanceStep(state) // step 3 有奖励

      expect(result.stepReward).toBeDefined()
      expect(result.stepReward!.type).toBe('gold')
    })

    it('没有进行中教程时不能前进', () => {
      const result = advanceStep(state)
      expect(result.success).toBe(false)
    })
  })

  describe('跳过教程', () => {
    it('应该跳过教程', () => {
      startTutorial(state, 'tut_welcome')
      const result = skipTutorial(state)

      expect(result).toBe(true)
      expect(state.activeTutorial).toBeNull()
      expect(state.totalSkipped).toBe(1)
    })

    it('没有进行中教程时不能跳过', () => {
      expect(skipTutorial(state)).toBe(false)
    })

    it('跳过的教程不再触发', () => {
      startTutorial(state, 'tut_welcome')
      skipTutorial(state)

      // 跳过后不再触发（skipped = true）
      expect(canTriggerTutorial(state, 'tut_welcome', 1)).toBe(false)
    })
  })

  describe('重播教程', () => {
    it('应该重播已完成的教程', () => {
      startTutorial(state, 'tut_welcome')
      advanceStep(state)
      advanceStep(state)
      advanceStep(state)

      const result = replayTutorial(state, 'tut_welcome')
      expect(result.success).toBe(true)
      expect(state.activeTutorial).toBe('tut_welcome')
    })

    it('有教程进行中时不能重播', () => {
      startTutorial(state, 'tut_welcome')
      const result = replayTutorial(state, 'tut_welcome')

      expect(result.success).toBe(false)
    })
  })

  describe('分类查询', () => {
    it('应该按分类获取教程', () => {
      const beginner = getTutorialsByCategory('新手')
      expect(beginner.length).toBeGreaterThan(0)
      expect(beginner.every(t => t.category === '新手')).toBe(true)

      const advanced = getTutorialsByCategory('高级')
      expect(advanced.length).toBeGreaterThan(0)
    })
  })

  describe('统计信息', () => {
    it('应该获取教程统计', () => {
      startTutorial(state, 'tut_welcome')
      advanceStep(state)
      advanceStep(state)
      advanceStep(state)

      const stats = getTutorialStats(state)

      expect(stats.total).toBe(TUTORIALS.length)
      expect(stats.completed).toBe(1)
      expect(stats.completionRate).toBeGreaterThan(0)
      expect(stats.byCategory['新手'].completed).toBe(1)
    })

    it('完成率应该正确计算', () => {
      expect(getTutorialCompletionRate(state)).toBe(0)
    })
  })

  describe('配置', () => {
    it('应该有 7 个教程', () => {
      expect(TUTORIALS.length).toBe(7)
    })

    it('每个教程都有步骤', () => {
      for (const tut of TUTORIALS) {
        expect(tut.steps.length).toBeGreaterThan(0)
      }
    })

    it('每个教程都有完成奖励', () => {
      for (const tut of TUTORIALS) {
        expect(tut.completionReward.length).toBeGreaterThan(0)
      }
    })

    it('教程应该覆盖三个分类', () => {
      const categories = new Set(TUTORIALS.map(t => t.category))
      expect(categories.has('新手')).toBe(true)
      expect(categories.has('进阶')).toBe(true)
      expect(categories.has('高级')).toBe(true)
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入教程状态', () => {
      startTutorial(state, 'tut_welcome')
      advanceStep(state)
      advanceStep(state)
      advanceStep(state)

      const exported = exportTutorialState(state)
      const imported = importTutorialState(exported)

      expect(imported.totalCompleted).toBe(1)
      expect(imported.progress.get('tut_welcome')?.completed).toBe(true)
    })
  })
})
