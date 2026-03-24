/**
 * v0.51 天赋树系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createTalentTreeState,
  addTalentPoints,
  canUpgradeTalent,
  upgradeTalent,
  resetTalentTree,
  calculateTalentEffects,
  getTalentsByBranch,
  getBranchPoints,
  saveTalentPreset,
  loadTalentPreset,
  deleteTalentPreset,
  getTalentStats,
  exportTalentTreeState,
  importTalentTreeState,
  TALENT_CONFIGS,
  TalentTreeState,
} from './talentTree'

describe('v0.51 天赋树系统', () => {
  describe('初始化', () => {
    it('应该创建天赋树状态', () => {
      const state = createTalentTreeState(50)

      expect(state.talents.size).toBe(TALENT_CONFIGS.length)
      expect(state.totalPoints).toBe(50)
      expect(state.availablePoints).toBe(50)
      expect(state.usedPoints).toBe(0)
    })

    it('所有天赋初始等级为 0', () => {
      const state = createTalentTreeState()

      for (const talent of state.talents.values()) {
        expect(talent.currentLevel).toBe(0)
      }
    })

    it('应该有 3 个天赋分支', () => {
      const branches = new Set(TALENT_CONFIGS.map(t => t.branch))

      expect(branches.size).toBe(3)
      expect(branches.has('战斗')).toBe(true)
      expect(branches.has('防御')).toBe(true)
      expect(branches.has('辅助')).toBe(true)
    })
  })

  describe('天赋点管理', () => {
    it('应该添加天赋点', () => {
      const state = createTalentTreeState(10)
      addTalentPoints(state, 20)

      expect(state.totalPoints).toBe(30)
      expect(state.availablePoints).toBe(30)
    })
  })

  describe('天赋升级', () => {
    let state: TalentTreeState

    beforeEach(() => {
      state = createTalentTreeState(100) // 足够多的天赋点
    })

    it('应该升级 T1 天赋', () => {
      const result = upgradeTalent(state, 'atk_1')

      expect(result.success).toBe(true)

      const talent = state.talents.get('atk_1')!
      expect(talent.currentLevel).toBe(1)
      expect(state.usedPoints).toBe(1)
      expect(state.availablePoints).toBe(99)
    })

    it('应该连续升级到满级', () => {
      for (let i = 0; i < 5; i++) {
        upgradeTalent(state, 'atk_1')
      }

      const talent = state.talents.get('atk_1')!
      expect(talent.currentLevel).toBe(5)
      expect(state.usedPoints).toBe(5)
    })

    it('不能超过最大等级', () => {
      for (let i = 0; i < 5; i++) {
        upgradeTalent(state, 'atk_1')
      }

      const result = canUpgradeTalent(state, 'atk_1')
      expect(result.canUpgrade).toBe(false)
      expect(result.reason).toContain('已满级')
    })

    it('天赋点不足时不能升级', () => {
      const state2 = createTalentTreeState(0)

      const result = canUpgradeTalent(state2, 'atk_1')
      expect(result.canUpgrade).toBe(false)
      expect(result.reason).toContain('天赋点不足')
    })

    it('前置天赋未满级时不能升级 T2', () => {
      // atk_2 需要 atk_1 满级
      const result = canUpgradeTalent(state, 'atk_2')

      expect(result.canUpgrade).toBe(false)
      expect(result.reason).toContain('前置天赋')
    })

    it('前置天赋满级后可以升级 T2', () => {
      // 先满级 atk_1
      for (let i = 0; i < 5; i++) {
        upgradeTalent(state, 'atk_1')
      }

      const result = canUpgradeTalent(state, 'atk_2')
      expect(result.canUpgrade).toBe(true)
    })

    it('T4 天赋需要多个前置', () => {
      // atk_3 需要 lifesteal_1 和 crit_dmg_1

      // 先满级前置链
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_1')
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'crit_1')
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_2')
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'crit_dmg_1')
      for (let i = 0; i < 3; i++) upgradeTalent(state, 'lifesteal_1')

      const result = canUpgradeTalent(state, 'atk_3')
      expect(result.canUpgrade).toBe(true)
    })

    it('不存在的天赋返回错误', () => {
      const result = canUpgradeTalent(state, 'nonexistent')
      expect(result.canUpgrade).toBe(false)
      expect(result.reason).toContain('不存在')
    })
  })

  describe('天赋重置', () => {
    let state: TalentTreeState

    beforeEach(() => {
      state = createTalentTreeState(50)
      // 升级一些天赋
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_1')
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'def_1')
    })

    it('应该重置所有天赋', () => {
      const result = resetTalentTree(state, 100)

      expect(result.success).toBe(true)
      expect(state.usedPoints).toBe(0)
      expect(state.availablePoints).toBe(50)

      const atk1 = state.talents.get('atk_1')!
      expect(atk1.currentLevel).toBe(0)
    })

    it('钻石不足时不能重置', () => {
      const result = resetTalentTree(state, 10)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('钻石不足')
    })

    it('没有已分配天赋点时不能重置', () => {
      const emptyState = createTalentTreeState(50)
      const result = resetTalentTree(emptyState, 1000)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('没有已分配')
    })

    it('重置费用应该递增', () => {
      const result1 = resetTalentTree(state, 1000)
      expect(result1.cost).toBe(50) // 第一次 50

      // 重新分配一些点
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_1')

      const result2 = resetTalentTree(state, 1000)
      expect(result2.cost).toBe(100) // 第二次 100
    })
  })

  describe('天赋效果计算', () => {
    let state: TalentTreeState

    beforeEach(() => {
      state = createTalentTreeState(100)
    })

    it('应该计算天赋效果', () => {
      // 升级 atk_1 到 3 级
      for (let i = 0; i < 3; i++) upgradeTalent(state, 'atk_1')

      const effects = calculateTalentEffects(state)

      const attackEffect = effects.get('attack')
      expect(attackEffect).toBeDefined()
      expect(attackEffect!.flat).toBe(30) // 10 * 3
      expect(attackEffect!.percent).toBe(0)
    })

    it('应该计算百分比效果', () => {
      for (let i = 0; i < 3; i++) upgradeTalent(state, 'crit_1')

      const effects = calculateTalentEffects(state)

      const critEffect = effects.get('crit')
      expect(critEffect).toBeDefined()
      expect(critEffect!.percent).toBe(6) // 2% * 3
      expect(critEffect!.flat).toBe(0)
    })

    it('应该合并多个天赋的同类效果', () => {
      // atk_1 (flat) + atk_2 (percent) 都影响 attack
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_1')
      for (let i = 0; i < 3; i++) upgradeTalent(state, 'atk_2')

      const effects = calculateTalentEffects(state)

      const attackEffect = effects.get('attack')
      expect(attackEffect).toBeDefined()
      expect(attackEffect!.flat).toBe(50) // 10 * 5
      expect(attackEffect!.percent).toBe(15) // 5% * 3
    })

    it('无天赋时效果为空', () => {
      const effects = calculateTalentEffects(state)
      expect(effects.size).toBe(0)
    })
  })

  describe('天赋分支查询', () => {
    let state: TalentTreeState

    beforeEach(() => {
      state = createTalentTreeState()
    })

    it('应该获取战斗分支天赋', () => {
      const talents = getTalentsByBranch(state, '战斗')

      expect(talents.length).toBeGreaterThan(0)
      expect(talents.every(t => t.branch === '战斗')).toBe(true)
    })

    it('分支天赋应该按层级排序', () => {
      const talents = getTalentsByBranch(state, '战斗')

      for (let i = 1; i < talents.length; i++) {
        expect(talents[i].tier).toBeGreaterThanOrEqual(talents[i - 1].tier)
      }
    })

    it('应该计算分支已用天赋点', () => {
      state = createTalentTreeState(50)
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_1')

      expect(getBranchPoints(state, '战斗')).toBe(5) // 5 * 1 点
      expect(getBranchPoints(state, '防御')).toBe(0)
      expect(getBranchPoints(state, '辅助')).toBe(0)
    })
  })

  describe('天赋预设', () => {
    let state: TalentTreeState

    beforeEach(() => {
      state = createTalentTreeState(50)
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_1')
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'crit_1')
    })

    it('应该保存天赋预设', () => {
      const result = saveTalentPreset(state, '战斗方案')

      expect(result.success).toBe(true)
      expect(state.presets.length).toBe(1)
      expect(state.presets[0].name).toBe('战斗方案')
    })

    it('最多保存 5 套预设', () => {
      for (let i = 0; i < 5; i++) {
        saveTalentPreset(state, `方案${i}`)
      }

      const result = saveTalentPreset(state, '第 6 套')
      expect(result.success).toBe(false)
      expect(result.reason).toContain('已满')
    })

    it('应该加载天赋预设', () => {
      saveTalentPreset(state, '战斗方案')
      const presetId = state.presets[0].id

      // 重置天赋
      resetTalentTree(state, 1000)
      expect(state.usedPoints).toBe(0)

      // 加载预设
      const result = loadTalentPreset(state, presetId)
      expect(result.success).toBe(true)

      const atk1 = state.talents.get('atk_1')!
      expect(atk1.currentLevel).toBe(5)
    })

    it('应该删除天赋预设', () => {
      saveTalentPreset(state, '方案 1')
      const presetId = state.presets[0].id

      const success = deleteTalentPreset(state, presetId)
      expect(success).toBe(true)
      expect(state.presets.length).toBe(0)
    })

    it('删除不存在的预设返回 false', () => {
      const success = deleteTalentPreset(state, 'nonexistent')
      expect(success).toBe(false)
    })
  })

  describe('统计信息', () => {
    it('应该获取天赋统计', () => {
      const state = createTalentTreeState(50)
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_1')
      for (let i = 0; i < 3; i++) upgradeTalent(state, 'def_1')

      const stats = getTalentStats(state)

      expect(stats.totalPoints).toBe(50)
      expect(stats.usedPoints).toBe(8) // 5 + 3
      expect(stats.availablePoints).toBe(42)
      expect(stats.branchPoints['战斗']).toBe(5)
      expect(stats.branchPoints['防御']).toBe(3)
      expect(stats.branchPoints['辅助']).toBe(0)
      expect(stats.maxedTalents).toBe(1) // atk_1 满级
      expect(stats.totalTalents).toBe(TALENT_CONFIGS.length)
    })
  })

  describe('天赋配置', () => {
    it('应该有 18 个天赋节点', () => {
      expect(TALENT_CONFIGS.length).toBe(18)
    })

    it('每个分支应该有 6 个天赋', () => {
      const branches = ['战斗', '防御', '辅助'] as const
      for (const branch of branches) {
        const count = TALENT_CONFIGS.filter(t => t.branch === branch).length
        expect(count).toBe(6)
      }
    })

    it('每个天赋应该有效果', () => {
      for (const talent of TALENT_CONFIGS) {
        expect(talent.effects.length).toBeGreaterThan(0)
      }
    })

    it('T1 天赋不应该有前置', () => {
      const t1 = TALENT_CONFIGS.filter(t => t.tier === 1)
      for (const talent of t1) {
        expect(talent.prerequisiteIds.length).toBe(0)
      }
    })

    it('T2+ 天赋应该有前置', () => {
      const t2plus = TALENT_CONFIGS.filter(t => t.tier >= 2)
      for (const talent of t2plus) {
        expect(talent.prerequisiteIds.length).toBeGreaterThan(0)
      }
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入天赋树状态', () => {
      const state = createTalentTreeState(50)
      for (let i = 0; i < 5; i++) upgradeTalent(state, 'atk_1')
      saveTalentPreset(state, '方案 1')

      const exported = exportTalentTreeState(state)

      expect(exported.totalPoints).toBe(50)
      expect(exported.usedPoints).toBe(5)
      expect(exported.presets.length).toBe(1)

      const imported = importTalentTreeState(exported)

      expect(imported.totalPoints).toBe(50)
      expect(imported.usedPoints).toBe(5)
      expect(imported.talents.get('atk_1')!.currentLevel).toBe(5)
      expect(imported.presets.length).toBe(1)
    })
  })
})
