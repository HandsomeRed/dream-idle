/**
 * v0.53 离线挂机增强系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createIdleState,
  setIdleLocation,
  calculateOfflineDuration,
  calculateIdleRewards,
  claimIdleRewards,
  addAccelerators,
  setVipLevel,
  addIdleBonus,
  clearBonuses,
  getIdleStats,
  getAvailableLocations,
  exportIdleState,
  importIdleState,
  IDLE_LOCATIONS,
  MATERIAL_POOL,
  IdleState,
} from './idleEnhanced'

describe('v0.53 离线挂机增强系统', () => {
  describe('初始化', () => {
    it('应该创建初始离线状态', () => {
      const state = createIdleState()

      expect(state.currentLocation).toBe('推图')
      expect(state.maxOfflineMinutes).toBe(480)
      expect(state.accelerators).toBe(0)
      expect(state.vipLevel).toBe(0)
      expect(state.reports.length).toBe(0)
    })
  })

  describe('地点设置', () => {
    let state: IdleState

    beforeEach(() => {
      state = createIdleState()
    })

    it('应该设置挂机地点', () => {
      const result = setIdleLocation(state, '采集', 15)

      expect(result.success).toBe(true)
      expect(state.currentLocation).toBe('采集')
    })

    it('等级不足时不能设置', () => {
      const result = setIdleLocation(state, '竞技场', 10)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('需要')
    })

    it('不存在的地点返回错误', () => {
      const result = setIdleLocation(state, '不存在' as any, 100)

      expect(result.success).toBe(false)
    })
  })

  describe('离线时长计算', () => {
    it('应该计算离线时长', () => {
      const state = createIdleState()
      const now = state.lastOnlineTime + 120 * 60000 // 2 小时后

      const duration = calculateOfflineDuration(state, now)
      expect(duration).toBe(120)
    })

    it('不应超过最大离线时长', () => {
      const state = createIdleState()
      const now = state.lastOnlineTime + 600 * 60000 // 10 小时后

      const duration = calculateOfflineDuration(state, now)
      expect(duration).toBe(480) // 最大 8 小时
    })

    it('VIP 应该增加最大离线时长', () => {
      const state = createIdleState()
      setVipLevel(state, 10)

      const now = state.lastOnlineTime + 1500 * 60000 // 25 小时后

      const duration = calculateOfflineDuration(state, now)
      expect(duration).toBe(1440) // 最大 24 小时
    })
  })

  describe('收益计算', () => {
    let state: IdleState

    beforeEach(() => {
      state = createIdleState()
    })

    it('应该计算基础离线收益', () => {
      const rewards = calculateIdleRewards(state, 60, 1) // 60 分钟，1 级

      expect(rewards.exp).toBeGreaterThan(0)
      expect(rewards.gold).toBeGreaterThan(0)
      expect(rewards.petExp).toBeGreaterThan(0)
      expect(rewards.heroExp).toBeGreaterThan(0)
      expect(rewards.duration).toBe(60)
    })

    it('高等级应该获得更多收益', () => {
      const rewards1 = calculateIdleRewards(state, 60, 1)
      const rewards50 = calculateIdleRewards(state, 60, 50)

      expect(rewards50.exp).toBeGreaterThan(rewards1.exp)
      expect(rewards50.gold).toBeGreaterThan(rewards1.gold)
    })

    it('加速券应该翻倍收益', () => {
      const normal = calculateIdleRewards(state, 60, 1, 0)
      const accelerated = calculateIdleRewards(state, 60, 1, 1)

      expect(accelerated.exp).toBe(normal.exp * 2)
      expect(accelerated.gold).toBe(normal.gold * 2)
      expect(accelerated.accelerated).toBe(true)
    })

    it('不同地点应该有不同收益', () => {
      state.currentLocation = '推图'
      const pushRewards = calculateIdleRewards(state, 60, 20)

      state.currentLocation = '副本'
      const dungeonRewards = calculateIdleRewards(state, 60, 20)

      // 副本金币多，推图经验多
      expect(dungeonRewards.gold).toBeGreaterThan(pushRewards.gold)
      expect(pushRewards.exp).toBeGreaterThan(dungeonRewards.exp)
    })

    it('VIP 应该增加收益', () => {
      const normalRewards = calculateIdleRewards(state, 60, 20)

      setVipLevel(state, 5)
      const vipRewards = calculateIdleRewards(state, 60, 20)

      expect(vipRewards.exp).toBeGreaterThan(normalRewards.exp)
      expect(vipRewards.gold).toBeGreaterThan(normalRewards.gold)
    })

    it('自定义加成应该生效', () => {
      const normalRewards = calculateIdleRewards(state, 60, 20)

      addIdleBonus(state, {
        expMultiplier: 2,
        goldMultiplier: 1.5,
        dropMultiplier: 1,
        source: '测试加成',
      })

      const bonusRewards = calculateIdleRewards(state, 60, 20)

      expect(bonusRewards.exp).toBeGreaterThan(normalRewards.exp)
      expect(bonusRewards.gold).toBeGreaterThan(normalRewards.gold)

      clearBonuses(state)
    })
  })

  describe('领取收益', () => {
    let state: IdleState

    beforeEach(() => {
      state = createIdleState()
      state.lastOnlineTime = Date.now() - 120 * 60000 // 2 小时前
    })

    it('应该成功领取离线收益', () => {
      const result = claimIdleRewards(state, 20)

      expect(result.success).toBe(true)
      expect(result.rewards.exp).toBeGreaterThan(0)
      expect(result.rewards.gold).toBeGreaterThan(0)
      expect(result.report).not.toBeNull()
    })

    it('领取后应该更新统计', () => {
      claimIdleRewards(state, 20)

      expect(state.totalExpGained).toBeGreaterThan(0)
      expect(state.totalGoldGained).toBeGreaterThan(0)
      expect(state.totalOfflineMinutes).toBeGreaterThan(0)
    })

    it('领取后应该生成报告', () => {
      claimIdleRewards(state, 20)

      expect(state.reports.length).toBe(1)
      expect(state.reports[0].location).toBe('推图')
      expect(state.reports[0].durationMinutes).toBeGreaterThan(0)
    })

    it('没有离线时间时不能领取', () => {
      state.lastOnlineTime = Date.now()
      const result = claimIdleRewards(state, 20, 0, Date.now())

      expect(result.success).toBe(false)
      expect(result.reason).toContain('没有离线收益')
    })

    it('使用加速券应该消耗', () => {
      addAccelerators(state, 5)
      claimIdleRewards(state, 20, 3)

      expect(state.accelerators).toBe(2)
    })

    it('报告最多保留 30 条', () => {
      for (let i = 0; i < 35; i++) {
        state.lastOnlineTime = Date.now() - 60 * 60000
        claimIdleRewards(state, 20)
      }

      expect(state.reports.length).toBe(30)
    })
  })

  describe('加速券', () => {
    it('应该添加加速券', () => {
      const state = createIdleState()
      addAccelerators(state, 10)

      expect(state.accelerators).toBe(10)
    })

    it('应该累加加速券', () => {
      const state = createIdleState()
      addAccelerators(state, 5)
      addAccelerators(state, 3)

      expect(state.accelerators).toBe(8)
    })
  })

  describe('VIP 系统', () => {
    it('VIP 5 最大离线 12 小时', () => {
      const state = createIdleState()
      setVipLevel(state, 5)

      expect(state.maxOfflineMinutes).toBe(720)
    })

    it('VIP 10 最大离线 24 小时', () => {
      const state = createIdleState()
      setVipLevel(state, 10)

      expect(state.maxOfflineMinutes).toBe(1440)
    })

    it('普通玩家最大离线 8 小时', () => {
      const state = createIdleState()
      setVipLevel(state, 3)

      expect(state.maxOfflineMinutes).toBe(480)
    })
  })

  describe('地点查询', () => {
    it('1 级应该只有推图可用', () => {
      const locations = getAvailableLocations(1)
      expect(locations.length).toBe(1)
      expect(locations[0].location).toBe('推图')
    })

    it('高等级应该有更多地点', () => {
      const locations = getAvailableLocations(50)
      expect(locations.length).toBe(5) // 全部解锁
    })
  })

  describe('统计信息', () => {
    it('应该获取离线统计', () => {
      const state = createIdleState()
      state.lastOnlineTime = Date.now() - 120 * 60000
      claimIdleRewards(state, 20)

      const stats = getIdleStats(state)

      expect(stats.currentLocation).toBe('推图')
      expect(stats.totalExpGained).toBeGreaterThan(0)
      expect(stats.totalGoldGained).toBeGreaterThan(0)
      expect(stats.reportsCount).toBe(1)
    })
  })

  describe('配置', () => {
    it('应该有 5 个挂机地点', () => {
      expect(IDLE_LOCATIONS.length).toBe(5)
    })

    it('应该有 6 种材料', () => {
      expect(MATERIAL_POOL.length).toBe(6)
    })

    it('材料权重总和应该为 100', () => {
      const total = MATERIAL_POOL.reduce((sum, m) => sum + m.weight, 0)
      expect(total).toBe(100)
    })

    it('地点解锁等级应该递增', () => {
      const sorted = [...IDLE_LOCATIONS].sort((a, b) => a.unlockLevel - b.unlockLevel)
      expect(sorted[0].unlockLevel).toBe(1)
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入离线状态', () => {
      const state = createIdleState()
      addAccelerators(state, 10)
      setVipLevel(state, 5)

      const exported = exportIdleState(state)
      const imported = importIdleState(exported)

      expect(imported.accelerators).toBe(10)
      expect(imported.vipLevel).toBe(5)
      expect(imported.currentLocation).toBe('推图')
    })
  })
})
