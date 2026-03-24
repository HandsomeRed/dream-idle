/**
 * v0.61 数据统计仪表盘测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createDashboardState, updateStat, incrementStat, getStat, updateStats,
  getStatsByCategory, getAllStats, takeSnapshot, getTrend,
  getDashboardSummary, exportDashboardState, importDashboardState,
  STAT_DEFINITIONS, StatsDashboardState,
} from './statsDashboard'

describe('v0.61 数据统计仪表盘', () => {
  let state: StatsDashboardState

  beforeEach(() => { state = createDashboardState() })

  describe('初始化', () => {
    it('应该创建所有统计项', () => {
      expect(state.currentStats.size).toBe(STAT_DEFINITIONS.length)
    })

    it('所有统计初始为 0', () => {
      for (const value of state.currentStats.values()) {
        expect(value).toBe(0)
      }
    })
  })

  describe('更新统计', () => {
    it('应该更新统计值', () => {
      expect(updateStat(state, 'current_level', 50)).toBe(true)
      expect(getStat(state, 'current_level')).toBe(50)
    })

    it('应该增加统计值', () => {
      incrementStat(state, 'total_battles', 10)
      incrementStat(state, 'total_battles', 5)
      expect(getStat(state, 'total_battles')).toBe(15)
    })

    it('不存在的统计返回 false', () => {
      expect(updateStat(state, 'nonexistent', 10)).toBe(false)
      expect(incrementStat(state, 'nonexistent')).toBe(false)
    })

    it('不存在的统计 getStat 返回 0', () => {
      expect(getStat(state, 'nonexistent')).toBe(0)
    })

    it('批量更新统计', () => {
      const count = updateStats(state, {
        current_level: 30,
        total_battles: 100,
        current_gold: 50000,
      })
      expect(count).toBe(3)
      expect(getStat(state, 'current_level')).toBe(30)
      expect(getStat(state, 'total_battles')).toBe(100)
    })
  })

  describe('分类查询', () => {
    it('应该按分类获取统计', () => {
      updateStat(state, 'total_battles', 100)
      updateStat(state, 'total_wins', 80)

      const battleStats = getStatsByCategory(state, '战斗')
      expect(battleStats.length).toBeGreaterThan(0)
      expect(battleStats.every(s => s.category === '战斗')).toBe(true)

      const battles = battleStats.find(s => s.id === 'total_battles')
      expect(battles?.value).toBe(100)
    })

    it('应该获取所有统计', () => {
      const all = getAllStats(state)
      expect(all.length).toBe(STAT_DEFINITIONS.length)
    })
  })

  describe('每日快照', () => {
    it('应该创建快照', () => {
      updateStat(state, 'current_level', 30)
      expect(takeSnapshot(state, '2026-03-25')).toBe(true)
      expect(state.snapshots.length).toBe(1)
      expect(state.snapshots[0].stats['current_level']).toBe(30)
    })

    it('同一天不重复快照', () => {
      takeSnapshot(state, '2026-03-25')
      expect(takeSnapshot(state, '2026-03-25')).toBe(false)
      expect(state.snapshots.length).toBe(1)
    })

    it('快照最多保留 30 天', () => {
      for (let i = 1; i <= 35; i++) {
        takeSnapshot(state, `2026-03-${String(i).padStart(2, '0')}`)
      }
      expect(state.snapshots.length).toBe(30)
    })
  })

  describe('趋势分析', () => {
    it('应该计算趋势', () => {
      updateStat(state, 'current_level', 20)
      takeSnapshot(state, '2026-03-24')

      updateStat(state, 'current_level', 30)

      const trend = getTrend(state, 'current_level', 1)
      expect(trend).not.toBeNull()
      expect(trend!.current).toBe(30)
      expect(trend!.previous).toBe(20)
      expect(trend!.change).toBe(10)
      expect(trend!.changePercent).toBe(50)
    })

    it('无快照时 previous 为 0', () => {
      updateStat(state, 'current_level', 30)
      const trend = getTrend(state, 'current_level', 1)

      expect(trend!.previous).toBe(0)
    })

    it('不存在的统计返回 null', () => {
      expect(getTrend(state, 'nonexistent')).toBeNull()
    })
  })

  describe('仪表盘摘要', () => {
    it('应该获取摘要', () => {
      updateStats(state, {
        current_level: 50,
        rebirth_count: 3,
        total_battles: 500,
        win_rate: 85,
        heroes_owned: 15,
        pets_owned: 8,
        current_gold: 100000,
        current_diamonds: 500,
        total_play_time: 2400,
        login_days: 14,
      })

      const summary = getDashboardSummary(state)

      expect(summary.level).toBe(50)
      expect(summary.rebirthCount).toBe(3)
      expect(summary.totalBattles).toBe(500)
      expect(summary.heroes).toBe(15)
      expect(summary.loginDays).toBe(14)
    })
  })

  describe('配置', () => {
    it('应该有 28 个统计项', () => {
      expect(STAT_DEFINITIONS.length).toBe(28)
    })

    it('应该覆盖 5 个分类', () => {
      const cats = new Set(STAT_DEFINITIONS.map(d => d.category))
      expect(cats.size).toBe(5)
    })

    it('每个统计项都有单位', () => {
      for (const def of STAT_DEFINITIONS) {
        expect(def.unit).toBeDefined()
      }
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入', () => {
      updateStat(state, 'current_level', 50)
      takeSnapshot(state, '2026-03-25')

      const exported = exportDashboardState(state)
      const imported = importDashboardState(exported)

      expect(getStat(imported, 'current_level')).toBe(50)
      expect(imported.snapshots.length).toBe(1)
    })
  })
})
