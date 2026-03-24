/**
 * v0.52 转生系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createRebirthState,
  canRebirth,
  rebirth,
  levelUp,
  calculateRebirthPoints,
  calculateRebirthBaseBonus,
  buyShopItem,
  claimMilestone,
  getClaimableMilestones,
  getAllBonuses,
  getRebirthStats,
  exportRebirthState,
  importRebirthState,
  REBIRTH_SHOP,
  REBIRTH_MILESTONES,
  RebirthState,
} from './rebirth'

describe('v0.52 转生系统', () => {
  describe('初始化', () => {
    it('应该创建初始转生状态', () => {
      const state = createRebirthState()

      expect(state.rebirthCount).toBe(0)
      expect(state.rebirthPoints).toBe(0)
      expect(state.currentLevel).toBe(1)
      expect(state.maxLevel).toBe(100)
      expect(state.rebirthBonuses.length).toBe(0)
    })
  })

  describe('转生点计算', () => {
    it('应该根据等级计算转生点', () => {
      expect(calculateRebirthPoints(100, 0)).toBe(50)  // floor(100/10)*5 = 50
      expect(calculateRebirthPoints(50, 0)).toBe(25)   // floor(50/10)*5 = 25
      expect(calculateRebirthPoints(10, 0)).toBe(5)    // floor(10/10)*5 = 5
    })

    it('转生次数应该增加转生点倍率', () => {
      const points0 = calculateRebirthPoints(100, 0) // 50 * 1.0 = 50
      const points5 = calculateRebirthPoints(100, 5) // 50 * 1.5 = 75

      expect(points5).toBeGreaterThan(points0)
    })
  })

  describe('转生基础加成', () => {
    it('0 次转生无加成', () => {
      const bonuses = calculateRebirthBaseBonus(0)
      expect(bonuses.length).toBe(0)
    })

    it('转生后应该有属性加成', () => {
      const bonuses = calculateRebirthBaseBonus(3)

      expect(bonuses.length).toBe(4) // attack, defense, hp, exp
      expect(bonuses[0].value).toBe(15) // 3 * 5
      expect(bonuses[3].value).toBe(30) // 3 * 10 (exp)
    })
  })

  describe('转生条件', () => {
    let state: RebirthState

    beforeEach(() => {
      state = createRebirthState()
    })

    it('等级不足时不能转生', () => {
      state.currentLevel = 50
      const result = canRebirth(state)

      expect(result.canRebirth).toBe(false)
      expect(result.reason).toContain('需要达到')
    })

    it('满级时可以转生', () => {
      state.currentLevel = 100
      const result = canRebirth(state)

      expect(result.canRebirth).toBe(true)
    })
  })

  describe('执行转生', () => {
    let state: RebirthState

    beforeEach(() => {
      state = createRebirthState()
      state.currentLevel = 100
    })

    it('应该成功转生', () => {
      const result = rebirth(state, 3600000) // 1 小时

      expect(result.success).toBe(true)
      expect(result.pointsGained).toBeGreaterThan(0)
      expect(result.newRebirthCount).toBe(1)
    })

    it('转生后等级重置为 1', () => {
      rebirth(state)
      expect(state.currentLevel).toBe(1)
    })

    it('转生后获得转生点', () => {
      rebirth(state)
      expect(state.rebirthPoints).toBeGreaterThan(0)
      expect(state.totalRebirthPoints).toBeGreaterThan(0)
    })

    it('转生后获得基础加成', () => {
      rebirth(state)
      expect(state.rebirthBonuses.length).toBeGreaterThan(0)
    })

    it('多次转生应该累积', () => {
      rebirth(state)
      state.currentLevel = 100
      rebirth(state)
      state.currentLevel = 100
      rebirth(state)

      expect(state.rebirthCount).toBe(3)
      expect(state.totalRebirthPoints).toBeGreaterThan(0)
    })

    it('应该记录最快转生时间', () => {
      rebirth(state, 7200000) // 2 小时
      expect(state.fastestRebirth).toBe(7200000)

      state.currentLevel = 100
      rebirth(state, 3600000) // 1 小时（更快）
      expect(state.fastestRebirth).toBe(3600000)

      state.currentLevel = 100
      rebirth(state, 5000000) // 更慢，不应更新
      expect(state.fastestRebirth).toBe(3600000)
    })

    it('等级不足时不能转生', () => {
      state.currentLevel = 50
      const result = rebirth(state)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('需要达到')
    })
  })

  describe('升级', () => {
    it('应该正常升级', () => {
      const state = createRebirthState()
      const gained = levelUp(state, 10)

      expect(gained).toBe(10)
      expect(state.currentLevel).toBe(11)
    })

    it('不能超过最大等级', () => {
      const state = createRebirthState()
      state.currentLevel = 95
      const gained = levelUp(state, 10)

      expect(gained).toBe(5)
      expect(state.currentLevel).toBe(100)
    })
  })

  describe('转生商店', () => {
    let state: RebirthState

    beforeEach(() => {
      state = createRebirthState()
      state.rebirthPoints = 100
    })

    it('应该购买商店物品', () => {
      const result = buyShopItem(state, 'atk_boost')

      expect(result.success).toBe(true)
      expect(state.rebirthPoints).toBe(90) // 100 - 10
      expect(state.shopPurchases.get('atk_boost')).toBe(1)
    })

    it('转生点不足时不能购买', () => {
      state.rebirthPoints = 5
      const result = buyShopItem(state, 'atk_boost')

      expect(result.success).toBe(false)
      expect(result.reason).toContain('转生点不足')
    })

    it('达到最大购买次数时不能购买', () => {
      state.rebirthPoints = 100000
      const item = REBIRTH_SHOP.find(s => s.id === 'atk_boost')!

      for (let i = 0; i < item.maxPurchases; i++) {
        buyShopItem(state, 'atk_boost')
      }

      const result = buyShopItem(state, 'atk_boost')
      expect(result.success).toBe(false)
      expect(result.reason).toContain('最大购买次数')
    })

    it('不存在的商品返回错误', () => {
      const result = buyShopItem(state, 'nonexistent')
      expect(result.success).toBe(false)
      expect(result.reason).toContain('不存在')
    })

    it('购买后应该更新加成', () => {
      state.rebirthCount = 1
      state.rebirthBonuses = calculateRebirthBaseBonus(1)

      buyShopItem(state, 'atk_boost')

      const bonuses = getAllBonuses(state)
      const atkBonuses = bonuses.filter(b => b.type === 'attack')
      expect(atkBonuses.length).toBeGreaterThanOrEqual(2) // 基础 + 商店
    })
  })

  describe('里程碑', () => {
    let state: RebirthState

    beforeEach(() => {
      state = createRebirthState()
      state.rebirthCount = 10
    })

    it('应该领取里程碑奖励', () => {
      const result = claimMilestone(state, 1)

      expect(result.success).toBe(true)
      expect(result.rewards.length).toBeGreaterThan(0)
    })

    it('不能重复领取里程碑', () => {
      claimMilestone(state, 1)
      const result = claimMilestone(state, 1)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('已领取')
    })

    it('转生次数不足时不能领取', () => {
      state.rebirthCount = 3
      const result = claimMilestone(state, 10)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('需要')
    })

    it('应该获取可领取的里程碑', () => {
      const claimable = getClaimableMilestones(state)

      // 转生 10 次，应该有 1, 5, 10 可领取
      expect(claimable.length).toBe(3)
    })

    it('领取后可领取列表应该减少', () => {
      claimMilestone(state, 1)
      claimMilestone(state, 5)

      const claimable = getClaimableMilestones(state)
      expect(claimable.length).toBe(1) // 只剩 10
    })

    it('里程碑转生点奖励应该到账', () => {
      const pointsBefore = state.rebirthPoints
      claimMilestone(state, 1) // 奖励 20 点

      expect(state.rebirthPoints).toBe(pointsBefore + 20)
    })
  })

  describe('统计信息', () => {
    it('应该获取转生统计', () => {
      const state = createRebirthState()
      state.currentLevel = 100
      rebirth(state, 3600000)
      buyShopItem(state, 'atk_boost')

      const stats = getRebirthStats(state)

      expect(stats.rebirthCount).toBe(1)
      expect(stats.currentLevel).toBe(1)
      expect(stats.totalBonuses).toBeGreaterThan(0)
      expect(stats.shopPurchases).toBe(1)
      expect(stats.totalMilestones).toBe(REBIRTH_MILESTONES.length)
    })
  })

  describe('配置', () => {
    it('应该有 8 个商店物品', () => {
      expect(REBIRTH_SHOP.length).toBe(8)
    })

    it('应该有 6 个里程碑', () => {
      expect(REBIRTH_MILESTONES.length).toBe(6)
    })

    it('里程碑转生次数应该递增', () => {
      for (let i = 1; i < REBIRTH_MILESTONES.length; i++) {
        expect(REBIRTH_MILESTONES[i].rebirthCount).toBeGreaterThan(REBIRTH_MILESTONES[i - 1].rebirthCount)
      }
    })

    it('每个商店物品都应该有有效的消耗', () => {
      for (const item of REBIRTH_SHOP) {
        expect(item.cost).toBeGreaterThan(0)
      }
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入转生状态', () => {
      const state = createRebirthState()
      state.currentLevel = 100
      rebirth(state)
      buyShopItem(state, 'atk_boost')
      claimMilestone(state, 1)

      const exported = exportRebirthState(state)

      expect(exported.rebirthCount).toBe(1)
      expect(exported.shopPurchases.length).toBeGreaterThan(0)

      const imported = importRebirthState(exported)

      expect(imported.rebirthCount).toBe(1)
      expect(imported.shopPurchases.get('atk_boost')).toBe(1)
      expect(imported.milestones.get(1)).toBe(true)
    })
  })
})
