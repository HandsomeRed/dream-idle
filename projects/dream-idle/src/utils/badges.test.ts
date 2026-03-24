/**
 * v0.59 成就徽章系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createBadgeState, unlockBadge, setDisplayBadges, toggleFavorite,
  getUnlockedBadges, getBadgesByCategory, getBadgesByRarity,
  calculateBadgeBonuses, getBadgeStats,
  exportBadgeState, importBadgeState,
  BADGES, BadgeState,
} from './badges'

describe('v0.59 成就徽章系统', () => {
  let state: BadgeState

  beforeEach(() => { state = createBadgeState() })

  describe('初始化', () => {
    it('应该创建空徽章状态', () => {
      expect(state.unlockedBadges.size).toBe(0)
      expect(state.displayBadges.length).toBe(0)
    })
  })

  describe('解锁徽章', () => {
    it('应该解锁徽章', () => {
      expect(unlockBadge(state, 'b_lv10')).toBe(true)
      expect(state.unlockedBadges.has('b_lv10')).toBe(true)
    })

    it('不能重复解锁', () => {
      unlockBadge(state, 'b_lv10')
      expect(unlockBadge(state, 'b_lv10')).toBe(false)
    })

    it('不存在的徽章返回 false', () => {
      expect(unlockBadge(state, 'nonexistent')).toBe(false)
    })

    it('应该记录解锁时间', () => {
      unlockBadge(state, 'b_lv10')
      expect(state.unlockTimestamps.get('b_lv10')).toBeGreaterThan(0)
    })
  })

  describe('徽章展示', () => {
    beforeEach(() => {
      unlockBadge(state, 'b_lv10')
      unlockBadge(state, 'b_lv30')
      unlockBadge(state, 'b_win100')
      unlockBadge(state, 'b_map2')
    })

    it('应该设置展示徽章', () => {
      const result = setDisplayBadges(state, ['b_lv10', 'b_lv30'])
      expect(result.success).toBe(true)
      expect(state.displayBadges.length).toBe(2)
    })

    it('最多展示 3 个', () => {
      const result = setDisplayBadges(state, ['b_lv10', 'b_lv30', 'b_win100', 'b_map2'])
      expect(result.success).toBe(false)
    })

    it('不能展示未解锁的徽章', () => {
      const result = setDisplayBadges(state, ['b_lv100'])
      expect(result.success).toBe(false)
    })
  })

  describe('收藏', () => {
    it('应该收藏已解锁徽章', () => {
      unlockBadge(state, 'b_lv10')
      expect(toggleFavorite(state, 'b_lv10')).toBe(true)
      expect(state.favorited.has('b_lv10')).toBe(true)
    })

    it('再次点击取消收藏', () => {
      unlockBadge(state, 'b_lv10')
      toggleFavorite(state, 'b_lv10')
      toggleFavorite(state, 'b_lv10')
      expect(state.favorited.has('b_lv10')).toBe(false)
    })

    it('不能收藏未解锁的徽章', () => {
      expect(toggleFavorite(state, 'b_lv10')).toBe(false)
    })
  })

  describe('查询', () => {
    beforeEach(() => {
      unlockBadge(state, 'b_lv10')
      unlockBadge(state, 'b_lv30')
      unlockBadge(state, 'b_win100')
    })

    it('应该获取已解锁徽章', () => {
      const badges = getUnlockedBadges(state)
      expect(badges.length).toBe(3)
    })

    it('应该按分类获取徽章', () => {
      const growth = getBadgesByCategory(state, '成长')
      expect(growth.length).toBeGreaterThan(0)
      expect(growth.every(b => b.category === '成长')).toBe(true)
    })

    it('应该按稀有度获取已解锁徽章', () => {
      const silver = getBadgesByRarity(state, '银')
      expect(silver.length).toBeGreaterThanOrEqual(1) // b_lv30 和 b_win100 是银色
    })
  })

  describe('属性加成', () => {
    it('应该计算徽章加成', () => {
      unlockBadge(state, 'b_lv10')  // exp +5%
      unlockBadge(state, 'b_lv30')  // exp +10%

      const bonuses = calculateBadgeBonuses(state)
      const expBonus = bonuses.get('exp')

      expect(expBonus).toBeDefined()
      expect(expBonus!.percent).toBe(15) // 5 + 10
    })

    it('无徽章时加成为空', () => {
      const bonuses = calculateBadgeBonuses(state)
      expect(bonuses.size).toBe(0)
    })

    it('没有 bonus 的徽章不参与计算', () => {
      unlockBadge(state, 'b_login7') // 无 bonus
      const bonuses = calculateBadgeBonuses(state)
      expect(bonuses.size).toBe(0)
    })
  })

  describe('统计', () => {
    it('应该获取徽章统计', () => {
      unlockBadge(state, 'b_lv10')
      unlockBadge(state, 'b_win100')

      const stats = getBadgeStats(state)
      expect(stats.total).toBe(BADGES.length)
      expect(stats.unlocked).toBe(2)
      expect(stats.completionRate).toBeGreaterThan(0)
      expect(stats.byCategory['成长'].unlocked).toBe(1)
      expect(stats.byCategory['战斗'].unlocked).toBe(1)
    })
  })

  describe('配置', () => {
    it('应该有 24 个徽章', () => {
      expect(BADGES.length).toBe(24)
    })

    it('应该覆盖所有分类', () => {
      const cats = new Set(BADGES.map(b => b.category))
      expect(cats.size).toBe(6)
    })

    it('应该覆盖所有稀有度', () => {
      const rarities = new Set(BADGES.map(b => b.rarity))
      expect(rarities.has('铜')).toBe(true)
      expect(rarities.has('传说')).toBe(true)
    })

    it('每个徽章都有图标', () => {
      for (const b of BADGES) {
        expect(b.icon.length).toBeGreaterThan(0)
      }
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入', () => {
      unlockBadge(state, 'b_lv10')
      unlockBadge(state, 'b_win100')
      setDisplayBadges(state, ['b_lv10'])
      toggleFavorite(state, 'b_lv10')

      const exported = exportBadgeState(state)
      const imported = importBadgeState(exported)

      expect(imported.unlockedBadges.size).toBe(2)
      expect(imported.displayBadges.length).toBe(1)
      expect(imported.favorited.has('b_lv10')).toBe(true)
    })
  })
})
