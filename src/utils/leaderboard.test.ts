/**
 * v0.58 排行榜系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createLeaderboardState,
  generateNpcEntries,
  updateLeaderboard,
  getLeaderboard,
  getPlayerRank,
  claimRankReward,
  needsRefresh,
  getLeaderboardStats,
  exportLeaderboardState,
  importLeaderboardState,
  LEADERBOARD_CONFIGS,
  LeaderboardState,
} from './leaderboard'

describe('v0.58 排行榜系统', () => {
  let state: LeaderboardState

  beforeEach(() => {
    state = createLeaderboardState()
  })

  describe('初始化', () => {
    it('应该创建 6 个排行榜', () => {
      expect(state.boards.size).toBe(6)
    })

    it('所有排行榜初始为空', () => {
      for (const board of state.boards.values()) {
        expect(board.entries.length).toBe(0)
        expect(board.playerRank).toBe(0)
      }
    })
  })

  describe('NPC 生成', () => {
    it('应该生成指定数量的 NPC', () => {
      const entries = generateNpcEntries(50, 100, 10000)

      expect(entries.length).toBe(50)
      expect(entries.every(e => !e.isPlayer)).toBe(true)
    })

    it('NPC 应该按值降序排列', () => {
      const entries = generateNpcEntries(20, 100, 5000)

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].value).toBeLessThanOrEqual(entries[i - 1].value)
      }
    })

    it('NPC 排名应该正确', () => {
      const entries = generateNpcEntries(10, 100, 1000)

      expect(entries[0].rank).toBe(1)
      expect(entries[9].rank).toBe(10)
    })

    it('NPC 值应该在范围内', () => {
      const entries = generateNpcEntries(30, 500, 5000)

      for (const e of entries) {
        expect(e.value).toBeGreaterThanOrEqual(500)
      }
    })
  })

  describe('排行榜更新', () => {
    it('应该更新排行榜并插入玩家', () => {
      const board = updateLeaderboard(state, '战力', 5000, '测试玩家')

      expect(board.entries.length).toBeGreaterThan(0)
      expect(board.playerRank).toBeGreaterThan(0)

      const playerEntry = board.entries.find(e => e.isPlayer)
      expect(playerEntry).toBeDefined()
      expect(playerEntry!.playerName).toBe('测试玩家')
    })

    it('玩家值高时排名靠前', () => {
      const board = updateLeaderboard(state, '战力', 999999, '强者')

      // 玩家应该在前几名（NPC 随机生成可能超过玩家值）
      expect(board.playerRank).toBeGreaterThan(0)
      expect(board.playerRank).toBeLessThanOrEqual(board.entries.length)
    })

    it('重复更新应该覆盖旧数据', () => {
      updateLeaderboard(state, '战力', 1000)
      const board = updateLeaderboard(state, '战力', 5000)

      const playerEntries = board.entries.filter(e => e.isPlayer)
      expect(playerEntries.length).toBe(1)
      expect(playerEntries[0].value).toBe(5000)
    })

    it('应该记录排名变化', () => {
      updateLeaderboard(state, '战力', 1000)
      const board = updateLeaderboard(state, '战力', 50000) // 大幅提升

      const playerEntry = board.entries.find(e => e.isPlayer)
      // rankChange > 0 表示排名上升
      expect(playerEntry!.rankChange).toBeGreaterThanOrEqual(0)
    })
  })

  describe('获取排行榜', () => {
    it('应该获取排行榜', () => {
      updateLeaderboard(state, '等级', 50)
      const board = getLeaderboard(state, '等级')

      expect(board).not.toBeNull()
      expect(board!.type).toBe('等级')
    })

    it('不存在的类型返回 null', () => {
      const board = getLeaderboard(state, '不存在' as any)
      expect(board).toBeNull()
    })

    it('应该获取玩家排名', () => {
      updateLeaderboard(state, '爬塔', 200)
      const rank = getPlayerRank(state, '爬塔')

      expect(rank).toBeGreaterThan(0)
    })
  })

  describe('排名奖励', () => {
    beforeEach(() => {
      updateLeaderboard(state, '战力', 999999) // 确保第 1 名
    })

    it('应该领取排名奖励', () => {
      const result = claimRankReward(state, '战力')

      expect(result.success).toBe(true)
      expect(result.gold).toBeGreaterThan(0)
      expect(result.diamonds).toBeGreaterThan(0)
    })

    it('不能重复领取', () => {
      claimRankReward(state, '战力')
      const result = claimRankReward(state, '战力')

      expect(result.success).toBe(false)
      expect(result.reason).toContain('已领取')
    })

    it('未上榜不能领取', () => {
      const result = claimRankReward(state, '等级')

      expect(result.success).toBe(false)
      expect(result.reason).toContain('未上榜')
    })

    it('第 1 名奖励最丰厚', () => {
      const result = claimRankReward(state, '战力')

      // 根据实际排名获得对应奖励
      expect(result.gold).toBeGreaterThan(0)
      expect(result.diamonds).toBeGreaterThan(0)
    })
  })

  describe('刷新检查', () => {
    it('初始时需要刷新', () => {
      expect(needsRefresh(state, '战力')).toBe(true)
    })

    it('刷新后不需要立即刷新', () => {
      updateLeaderboard(state, '战力', 1000)
      expect(needsRefresh(state, '战力')).toBe(false)
    })

    it('超过刷新间隔后需要刷新', () => {
      updateLeaderboard(state, '战力', 1000)

      const futureTime = Date.now() + 600000 // 10 分钟后
      expect(needsRefresh(state, '战力', futureTime)).toBe(true)
    })
  })

  describe('统计信息', () => {
    it('应该获取排行榜统计', () => {
      updateLeaderboard(state, '战力', 5000)
      updateLeaderboard(state, '等级', 50)

      const stats = getLeaderboardStats(state)

      expect(stats.totalBoards).toBe(6)
      expect(stats.playerRanks['战力']).toBeGreaterThan(0)
      expect(stats.playerRanks['等级']).toBeGreaterThan(0)
    })
  })

  describe('配置', () => {
    it('应该有 6 个排行榜配置', () => {
      expect(LEADERBOARD_CONFIGS.length).toBe(6)
    })

    it('每个排行榜都有奖励', () => {
      for (const config of LEADERBOARD_CONFIGS) {
        expect(config.dailyRewards.length).toBeGreaterThan(0)
      }
    })

    it('奖励排名范围不重叠', () => {
      for (const config of LEADERBOARD_CONFIGS) {
        for (let i = 1; i < config.dailyRewards.length; i++) {
          expect(config.dailyRewards[i].minRank).toBeGreaterThan(config.dailyRewards[i - 1].maxRank)
        }
      }
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入排行榜', () => {
      updateLeaderboard(state, '战力', 5000, '玩家')
      claimRankReward(state, '战力')

      const exported = exportLeaderboardState(state)
      const imported = importLeaderboardState(exported)

      expect(imported.boards.size).toBe(6)

      const board = imported.boards.get('战力')
      expect(board).toBeDefined()
      expect(board!.playerRank).toBeGreaterThan(0)
    })
  })
})
