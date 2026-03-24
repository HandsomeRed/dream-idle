import {
  calculateOfflineReward,
  formatOfflineReward,
  getRarityColor,
  getRarityIcon,
  canClaimOfflineReward,
  getMaxOfflineTime,
  DEFAULT_OFFLINE_CONFIG,
  ITEM_DROP_RATES,
  ITEM_POOLS
} from './offlineRewards'

describe('离线收益系统', () => {
  describe('calculateOfflineReward', () => {
    it('应该计算基础离线收益', () => {
      const reward = calculateOfflineReward(1, 60, false) // 1 级，离线 1 小时
      
      expect(reward.gold).toBe(100) // baseGoldPerHour
      expect(reward.exp).toBe(50)   // baseExpPerHour
      expect(reward.offlineHours).toBe(1)
      expect(reward.bonusMultiplier).toBe(1)
    })

    it('应该应用等级加成', () => {
      const reward = calculateOfflineReward(10, 60, false) // 10 级，离线 1 小时
      
      // 等级加成 = 1 + (10-1) * 0.05 = 1.45
      expect(reward.bonusMultiplier).toBe(1.45)
      expect(reward.gold).toBe(145) // 100 * 1.45
      expect(reward.exp).toBe(72)   // 50 * 1.45 = 72.5 -> 72
    })

    it('应该应用 VIP 加成', () => {
      const reward = calculateOfflineReward(1, 60, true) // 1 级，VIP，离线 1 小时
      
      // VIP 加成 = 1.2
      expect(reward.bonusMultiplier).toBe(1.2)
      expect(reward.gold).toBe(120) // 100 * 1.2
      expect(reward.exp).toBe(60)   // 50 * 1.2
    })

    it('应该同时应用等级和 VIP 加成', () => {
      const reward = calculateOfflineReward(10, 60, true) // 10 级，VIP，离线 1 小时
      
      // 总加成 = 1.45 * 1.2 = 1.74
      expect(reward.bonusMultiplier).toBe(1.74)
      expect(reward.gold).toBe(174) // 100 * 1.74
      expect(reward.exp).toBe(87)   // 50 * 1.74 = 87
    })

    it('应该限制最大离线时长', () => {
      const reward = calculateOfflineReward(1, 60 * 24, false) // 离线 24 小时
      
      expect(reward.offlineHours).toBe(12) // maxOfflineHours
      expect(reward.gold).toBe(1200) // 100 * 12
      expect(reward.exp).toBe(600)   // 50 * 12
    })

    it('应该正确计算非整数小时', () => {
      const reward = calculateOfflineReward(1, 90, false) // 离线 1.5 小时
      
      expect(reward.offlineHours).toBe(1.5)
      expect(reward.gold).toBe(150) // 100 * 1.5
      expect(reward.exp).toBe(75)   // 50 * 1.5
    })

    it('可能掉落物品', () => {
      // 多次测试确保物品掉落逻辑工作
      let hasItemDrop = false
      for (let i = 0; i < 50; i++) {
        const reward = calculateOfflineReward(1, 60 * 10, false) // 10 小时，更多掉落机会
        if (reward.items && reward.items.length > 0) {
          hasItemDrop = true
          break
        }
      }
      
      // 由于是随机掉落，10 小时应该有较高几率获得物品
      expect(hasItemDrop).toBe(true)
    })

    it('物品应该有正确的稀有度', () => {
      for (let i = 0; i < 100; i++) {
        const reward = calculateOfflineReward(50, 60 * 10, false)
        if (reward.items) {
          reward.items.forEach(item => {
            expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(item.rarity)
            expect(item.quantity).toBeGreaterThanOrEqual(1)
            expect(item.quantity).toBeLessThanOrEqual(3)
          })
        }
      }
    })
  })

  describe('formatOfflineReward', () => {
    it('应该正确格式化收益信息', () => {
      const reward: any = {
        gold: 1000,
        exp: 500,
        offlineHours: 5,
        bonusMultiplier: 1.5
      }
      
      const text = formatOfflineReward(reward)
      
      expect(text).toContain('离线 5.0 小时')
      expect(text).toContain('💰 金币：1,000')
      expect(text).toContain('⭐ 经验：500')
      expect(text).toContain('✨ 加成：x1.50')
    })

    it('应该格式化带物品的收益', () => {
      const reward: any = {
        gold: 1000,
        exp: 500,
        offlineHours: 5,
        bonusMultiplier: 1.5,
        items: [
          { itemName: '小还丹', quantity: 2 },
          { itemName: '力量秘籍', quantity: 1 }
        ]
      }
      
      const text = formatOfflineReward(reward)
      
      expect(text).toContain('🎁 物品：小还丹 x2, 力量秘籍 x1')
    })

    it('应该正确格式化千位分隔符', () => {
      const reward: any = {
        gold: 1000000,
        exp: 500000,
        offlineHours: 10,
        bonusMultiplier: 2
      }
      
      const text = formatOfflineReward(reward)
      
      expect(text).toContain('💰 金币：1,000,000')
      expect(text).toContain('⭐ 经验：500,000')
    })
  })

  describe('getRarityColor', () => {
    it('应该返回正确的稀有度颜色', () => {
      expect(getRarityColor('common')).toBe('#9d9d9d')
      expect(getRarityColor('uncommon')).toBe('#5cdb5c')
      expect(getRarityColor('rare')).toBe('#5c9cdb')
      expect(getRarityColor('epic')).toBe('#db5cdb')
      expect(getRarityColor('legendary')).toBe('#db9c5c')
    })
  })

  describe('getRarityIcon', () => {
    it('应该返回正确的稀有度图标', () => {
      expect(getRarityIcon('common')).toBe('⚪')
      expect(getRarityIcon('uncommon')).toBe('🟢')
      expect(getRarityIcon('rare')).toBe('🔵')
      expect(getRarityIcon('epic')).toBe('🟣')
      expect(getRarityIcon('legendary')).toBe('🟠')
    })
  })

  describe('canClaimOfflineReward', () => {
    it('离线时间足够时应该可以领取', () => {
      const lastLogin = Date.now() - 10 * 60 * 1000 // 10 分钟前
      
      expect(canClaimOfflineReward(lastLogin)).toBe(true)
    })

    it('离线时间不足时应该不能领取', () => {
      const lastLogin = Date.now() - 2 * 60 * 1000 // 2 分钟前
      
      expect(canClaimOfflineReward(lastLogin)).toBe(false)
    })

    it('应该支持自定义最小离线时间', () => {
      const lastLogin = Date.now() - 30 * 60 * 1000 // 30 分钟前
      
      expect(canClaimOfflineReward(lastLogin, 5)).toBe(true)
      expect(canClaimOfflineReward(lastLogin, 60)).toBe(false)
    })
  })

  describe('getMaxOfflineTime', () => {
    it('应该返回正确的离线分钟数', () => {
      const lastLogin = Date.now() - 120 * 60 * 1000 // 2 小时前
      
      const minutes = getMaxOfflineTime(lastLogin)
      
      expect(minutes).toBeGreaterThanOrEqual(119)
      expect(minutes).toBeLessThanOrEqual(121)
    })

    it('应该返回整数分钟', () => {
      const lastLogin = Date.now() - 90 * 1000 // 1.5 分钟前
      
      const minutes = getMaxOfflineTime(lastLogin)
      
      expect(Number.isInteger(minutes)).toBe(true)
    })
  })

  describe('默认配置', () => {
    it('应该有合理的默认值', () => {
      expect(DEFAULT_OFFLINE_CONFIG.baseGoldPerHour).toBe(100)
      expect(DEFAULT_OFFLINE_CONFIG.baseExpPerHour).toBe(50)
      expect(DEFAULT_OFFLINE_CONFIG.maxOfflineHours).toBe(12)
      expect(DEFAULT_OFFLINE_CONFIG.bonusRatePerLevel).toBe(0.05)
      expect(DEFAULT_OFFLINE_CONFIG.vipBonusRate).toBe(0.2)
    })
  })

  describe('物品掉落率配置', () => {
    it('应该有正确的掉落率', () => {
      expect(ITEM_DROP_RATES.common).toBe(0.5)
      expect(ITEM_DROP_RATES.uncommon).toBe(0.3)
      expect(ITEM_DROP_RATES.rare).toBe(0.15)
      expect(ITEM_DROP_RATES.epic).toBe(0.04)
      expect(ITEM_DROP_RATES.legendary).toBe(0.01)
    })

    it('掉落率总和应该合理', () => {
      const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
      const total = rarities.reduce((sum, r) => sum + ITEM_DROP_RATES[r], 0)
      expect(total).toBe(1.0)
    })
  })

  describe('物品池配置', () => {
    it('每个稀有度都应该有物品', () => {
      const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
      
      rarities.forEach(rarity => {
        expect(ITEM_POOLS[rarity]).toBeDefined()
        expect(ITEM_POOLS[rarity].length).toBeGreaterThan(0)
      })
    })

    it('物品应该有正确的字段', () => {
      const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
      rarities.forEach(rarity => {
        ITEM_POOLS[rarity].forEach(item => {
          expect(item).toHaveProperty('itemId')
          expect(item).toHaveProperty('itemName')
          expect(typeof item.itemId).toBe('string')
          expect(typeof item.itemName).toBe('string')
        })
      })
    })
  })
})
