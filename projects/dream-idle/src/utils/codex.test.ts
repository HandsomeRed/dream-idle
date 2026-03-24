import {
  createCodexState,
  unlockEntry,
  unlockEntries,
  viewEntry,
  getCategoryData,
  getCategoryCompletion,
  getGlobalCompletion,
  claimMilestone,
  claimCompletionBonus,
  getClaimableMilestones,
  getAllClaimableRewards,
  getEntriesByRarity,
  getUnlockedEntries,
  getLockedEntries,
  searchCodex,
  getCodexSummary,
  getGlobalBonus,
  getCategoryBonus,
  getAllActiveBonus,
  exportCodexState,
  importCodexState,
  getRarityColor,
  getRarityLabel,
  CodexState,
} from './codex'

describe('v0.62 图鉴收集系统', () => {
  let state: CodexState

  beforeEach(() => {
    state = createCodexState()
  })

  // ==================== 初始化 ====================

  describe('初始化', () => {
    test('创建初始状态', () => {
      expect(state.totalEntries).toBe(34) // 10+8+8+8
      expect(state.totalUnlocked).toBe(0)
      expect(state.categories.size).toBe(4)
    })

    test('包含4个分类', () => {
      expect(state.categories.has('hero')).toBe(true)
      expect(state.categories.has('pet')).toBe(true)
      expect(state.categories.has('equipment')).toBe(true)
      expect(state.categories.has('monster')).toBe(true)
    })

    test('英雄分类有10个条目', () => {
      const hero = state.categories.get('hero')!
      expect(hero.totalCount).toBe(10)
      expect(hero.unlockedCount).toBe(0)
      expect(hero.label).toBe('英雄图鉴')
    })

    test('宠物分类有8个条目', () => {
      const pet = state.categories.get('pet')!
      expect(pet.totalCount).toBe(8)
      expect(pet.label).toBe('宠物图鉴')
    })

    test('装备分类有8个条目', () => {
      const equip = state.categories.get('equipment')!
      expect(equip.totalCount).toBe(8)
      expect(equip.label).toBe('装备图鉴')
    })

    test('怪物分类有8个条目', () => {
      const monster = state.categories.get('monster')!
      expect(monster.totalCount).toBe(8)
      expect(monster.label).toBe('怪物图鉴')
    })

    test('初始全局加成为空', () => {
      expect(Object.keys(state.globalBonus).length).toBeGreaterThanOrEqual(0)
    })
  })

  // ==================== 解锁 ====================

  describe('解锁图鉴条目', () => {
    test('解锁英雄条目', () => {
      const result = unlockEntry(state, 'hero_warrior')
      expect(result.success).toBe(true)
      expect(result.isNew).toBe(true)
      expect(result.entry!.name).toBe('勇者战士')
      expect(result.entry!.unlocked).toBe(true)
      expect(result.entry!.unlockedAt).not.toBeNull()
    })

    test('重复解锁返回已解锁', () => {
      unlockEntry(state, 'hero_warrior')
      const result = unlockEntry(state, 'hero_warrior')
      expect(result.success).toBe(true)
      expect(result.isNew).toBe(false)
      expect(result.message).toContain('已解锁')
    })

    test('解锁不存在的条目', () => {
      const result = unlockEntry(state, 'nonexistent')
      expect(result.success).toBe(false)
      expect(result.message).toContain('不存在')
    })

    test('解锁更新分类计数', () => {
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'hero_mage')
      const hero = state.categories.get('hero')!
      expect(hero.unlockedCount).toBe(2)
    })

    test('解锁更新全局计数', () => {
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'pet_slime')
      expect(state.totalUnlocked).toBe(2)
    })

    test('重复解锁不增加计数', () => {
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'hero_warrior')
      expect(state.totalUnlocked).toBe(1)
      expect(state.categories.get('hero')!.unlockedCount).toBe(1)
    })
  })

  // ==================== 批量解锁 ====================

  describe('批量解锁', () => {
    test('批量解锁多个条目', () => {
      const result = unlockEntries(state, ['hero_warrior', 'hero_mage', 'pet_slime'])
      expect(result.unlocked).toEqual(['hero_warrior', 'hero_mage', 'pet_slime'])
      expect(result.alreadyUnlocked).toEqual([])
      expect(result.notFound).toEqual([])
    })

    test('批量解锁包含重复和不存在', () => {
      unlockEntry(state, 'hero_warrior')
      const result = unlockEntries(state, ['hero_warrior', 'hero_mage', 'nonexistent'])
      expect(result.unlocked).toEqual(['hero_mage'])
      expect(result.alreadyUnlocked).toEqual(['hero_warrior'])
      expect(result.notFound).toEqual(['nonexistent'])
    })
  })

  // ==================== 查看 ====================

  describe('查看图鉴条目', () => {
    test('查看已解锁条目', () => {
      unlockEntry(state, 'hero_warrior')
      const entry = viewEntry(state, 'hero_warrior')
      expect(entry).not.toBeNull()
      expect(entry!.name).toBe('勇者战士')
      expect(entry!.lore).not.toBe('???')
      expect(entry!.viewCount).toBe(1)
    })

    test('多次查看增加查看次数', () => {
      unlockEntry(state, 'hero_warrior')
      viewEntry(state, 'hero_warrior')
      viewEntry(state, 'hero_warrior')
      const entry = viewEntry(state, 'hero_warrior')
      expect(entry!.viewCount).toBe(3)
    })

    test('查看未解锁条目隐藏详情', () => {
      const entry = viewEntry(state, 'hero_warrior')
      expect(entry).not.toBeNull()
      expect(entry!.lore).toBe('???')
      expect(entry!.stats).toBeUndefined()
      expect(entry!.dropSource).toBe('???')
    })

    test('查看不存在的条目返回null', () => {
      const entry = viewEntry(state, 'nonexistent')
      expect(entry).toBeNull()
    })
  })

  // ==================== 分类数据 ====================

  describe('分类数据查询', () => {
    test('获取分类数据', () => {
      const data = getCategoryData(state, 'hero')
      expect(data).not.toBeNull()
      expect(data!.category).toBe('hero')
      expect(data!.totalCount).toBe(10)
    })

    test('获取不存在的分类', () => {
      const data = getCategoryData(state, 'invalid' as any)
      expect(data).toBeNull()
    })
  })

  // ==================== 完成度 ====================

  describe('完成度计算', () => {
    test('初始完成度为0', () => {
      expect(getCategoryCompletion(state, 'hero')).toBe(0)
      expect(getGlobalCompletion(state)).toBe(0)
    })

    test('分类完成度计算', () => {
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'hero_mage')
      expect(getCategoryCompletion(state, 'hero')).toBe(20) // 2/10 = 20%
    })

    test('全局完成度计算', () => {
      // 解锁 3/34 条目
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'pet_slime')
      unlockEntry(state, 'equip_iron_sword')
      const completion = getGlobalCompletion(state)
      expect(completion).toBe(Math.round(3 / 34 * 100))
    })

    test('不存在分类的完成度为0', () => {
      expect(getCategoryCompletion(state, 'invalid' as any)).toBe(0)
    })
  })

  // ==================== 里程碑奖励 ====================

  describe('里程碑奖励', () => {
    test('解锁不足时无法领取', () => {
      unlockEntry(state, 'hero_warrior')
      const result = claimMilestone(state, 'hero', 'hero_m1')
      expect(result.success).toBe(false)
      expect(result.message).toContain('需要解锁')
    })

    test('解锁足够时可以领取', () => {
      unlockEntries(state, ['hero_warrior', 'hero_mage', 'hero_archer'])
      const result = claimMilestone(state, 'hero', 'hero_m1')
      expect(result.success).toBe(true)
      expect(result.reward!.type).toBe('diamond')
      expect(result.reward!.amount).toBe(50)
    })

    test('不能重复领取', () => {
      unlockEntries(state, ['hero_warrior', 'hero_mage', 'hero_archer'])
      claimMilestone(state, 'hero', 'hero_m1')
      const result = claimMilestone(state, 'hero', 'hero_m1')
      expect(result.success).toBe(false)
      expect(result.message).toContain('已领取')
    })

    test('不存在的分类', () => {
      const result = claimMilestone(state, 'invalid' as any, 'hero_m1')
      expect(result.success).toBe(false)
    })

    test('不存在的里程碑', () => {
      const result = claimMilestone(state, 'hero', 'nonexistent')
      expect(result.success).toBe(false)
    })

    test('获取可领取的里程碑', () => {
      unlockEntries(state, ['hero_warrior', 'hero_mage', 'hero_archer'])
      const milestones = getClaimableMilestones(state, 'hero')
      expect(milestones.length).toBe(1)
      expect(milestones[0].id).toBe('hero_m1')
    })

    test('获取不存在分类的里程碑', () => {
      const milestones = getClaimableMilestones(state, 'invalid' as any)
      expect(milestones).toEqual([])
    })
  })

  // ==================== 全收集奖励 ====================

  describe('全收集奖励', () => {
    test('未全收集时无法领取', () => {
      unlockEntry(state, 'mon_slime_green')
      const result = claimCompletionBonus(state, 'monster')
      expect(result.success).toBe(false)
    })

    test('全收集后可领取', () => {
      const monsterIds = ['mon_slime_green', 'mon_goblin', 'mon_skeleton', 'mon_werewolf', 'mon_lich', 'mon_demon', 'mon_ancient_dragon', 'mon_void_lord']
      unlockEntries(state, monsterIds)
      const result = claimCompletionBonus(state, 'monster')
      expect(result.success).toBe(true)
      expect(result.bonus!.stats.expPercent).toBe(15)
    })

    test('不能重复领取', () => {
      const monsterIds = ['mon_slime_green', 'mon_goblin', 'mon_skeleton', 'mon_werewolf', 'mon_lich', 'mon_demon', 'mon_ancient_dragon', 'mon_void_lord']
      unlockEntries(state, monsterIds)
      claimCompletionBonus(state, 'monster')
      const result = claimCompletionBonus(state, 'monster')
      expect(result.success).toBe(false)
      expect(result.message).toContain('已领取')
    })

    test('不存在分类', () => {
      const result = claimCompletionBonus(state, 'invalid' as any)
      expect(result.success).toBe(false)
    })
  })

  // ==================== 可领取奖励总览 ====================

  describe('可领取奖励总览', () => {
    test('初始无可领取', () => {
      const rewards = getAllClaimableRewards(state)
      expect(rewards.length).toBe(0)
    })

    test('达成里程碑后出现', () => {
      unlockEntries(state, ['hero_warrior', 'hero_mage', 'hero_archer'])
      const rewards = getAllClaimableRewards(state)
      expect(rewards.length).toBe(1)
      expect(rewards[0].type).toBe('milestone')
    })

    test('全收集后出现全收集奖励', () => {
      const monsterIds = ['mon_slime_green', 'mon_goblin', 'mon_skeleton', 'mon_werewolf', 'mon_lich', 'mon_demon', 'mon_ancient_dragon', 'mon_void_lord']
      unlockEntries(state, monsterIds)
      const rewards = getAllClaimableRewards(state)
      const completionReward = rewards.find(r => r.type === 'completion')
      expect(completionReward).toBeDefined()
    })
  })

  // ==================== 筛选 ====================

  describe('条目筛选', () => {
    test('按稀有度筛选', () => {
      const commons = getEntriesByRarity(state, 'common')
      expect(commons.length).toBeGreaterThan(0)
      for (const e of commons) {
        expect(e.rarity).toBe('common')
      }
    })

    test('按稀有度筛选 - 神话', () => {
      const mythics = getEntriesByRarity(state, 'mythic')
      expect(mythics.length).toBeGreaterThan(0)
      for (const e of mythics) {
        expect(e.rarity).toBe('mythic')
      }
    })

    test('获取已解锁条目 - 全局', () => {
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'pet_slime')
      const unlocked = getUnlockedEntries(state)
      expect(unlocked.length).toBe(2)
    })

    test('获取已解锁条目 - 按分类', () => {
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'pet_slime')
      const unlocked = getUnlockedEntries(state, 'hero')
      expect(unlocked.length).toBe(1)
      expect(unlocked[0].id).toBe('hero_warrior')
    })

    test('获取未解锁条目 - 全局', () => {
      const locked = getLockedEntries(state)
      expect(locked.length).toBe(34)
    })

    test('获取未解锁条目 - 按分类', () => {
      unlockEntry(state, 'hero_warrior')
      const locked = getLockedEntries(state, 'hero')
      expect(locked.length).toBe(9)
    })
  })

  // ==================== 搜索 ====================

  describe('搜索', () => {
    test('按名称搜索', () => {
      const results = searchCodex(state, '战士')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(e => e.name === '勇者战士')).toBe(true)
    })

    test('按描述搜索', () => {
      const results = searchCodex(state, '铁剑')
      expect(results.length).toBeGreaterThan(0)
    })

    test('搜索不到时返回空', () => {
      const results = searchCodex(state, '完全不存在的关键词xyz')
      expect(results.length).toBe(0)
    })

    test('大小写不敏感搜索', () => {
      const results = searchCodex(state, 'HERO')
      expect(results.length).toBeGreaterThan(0)
    })
  })

  // ==================== 图鉴摘要 ====================

  describe('图鉴摘要', () => {
    test('获取初始摘要', () => {
      const summary = getCodexSummary(state)
      expect(summary.totalEntries).toBe(34)
      expect(summary.totalUnlocked).toBe(0)
      expect(summary.globalCompletion).toBe(0)
      expect(summary.categories.length).toBe(4)
    })

    test('摘要反映解锁进度', () => {
      unlockEntries(state, ['hero_warrior', 'hero_mage', 'pet_slime'])
      const summary = getCodexSummary(state)
      expect(summary.totalUnlocked).toBe(3)
      const heroCat = summary.categories.find(c => c.category === 'hero')!
      expect(heroCat.unlocked).toBe(2)
      expect(heroCat.total).toBe(10)
    })
  })

  // ==================== 全局加成 ====================

  describe('全局加成', () => {
    test('初始全局加成', () => {
      const bonus = getGlobalBonus(state)
      // 0% completion = 0 tiers
      expect(bonus.attackFlat || 0).toBe(0)
    })

    test('10%完成度触发加成', () => {
      // 34 * 10% = 3.4, 需要 4 个解锁达到 ~12%
      unlockEntries(state, ['hero_warrior', 'hero_mage', 'hero_archer', 'hero_knight'])
      const completion = getGlobalCompletion(state)
      expect(completion).toBeGreaterThanOrEqual(10)
      const bonus = getGlobalBonus(state)
      expect(bonus.attackFlat).toBeGreaterThan(0)
    })

    test('分类加成未领取时返回null', () => {
      const bonus = getCategoryBonus(state, 'hero')
      expect(bonus).toBeNull()
    })

    test('全部活跃加成计算', () => {
      // 先解锁一些以获得全局加成
      unlockEntries(state, ['hero_warrior', 'hero_mage', 'hero_archer', 'hero_knight'])
      const bonus = getAllActiveBonus(state)
      expect(bonus.attackFlat).toBeGreaterThan(0)
    })
  })

  // ==================== 导出导入 ====================

  describe('导出导入', () => {
    test('导出存档', () => {
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'pet_slime')
      const json = exportCodexState(state)
      expect(typeof json).toBe('string')
      const parsed = JSON.parse(json)
      expect(parsed.totalUnlocked).toBe(2)
    })

    test('导入存档', () => {
      unlockEntry(state, 'hero_warrior')
      unlockEntry(state, 'pet_slime')
      const json = exportCodexState(state)

      // 创建新状态并导入
      const newState = createCodexState()
      const result = importCodexState(newState, json)
      expect(result.success).toBe(true)
      expect(newState.totalUnlocked).toBe(2)
    })

    test('导入无效JSON', () => {
      const result = importCodexState(state, 'not json')
      expect(result.success).toBe(false)
      expect(result.message).toContain('JSON')
    })

    test('导入缺少categories', () => {
      const result = importCodexState(state, '{"foo": "bar"}')
      expect(result.success).toBe(false)
    })

    test('导入保留里程碑状态', () => {
      unlockEntries(state, ['hero_warrior', 'hero_mage', 'hero_archer'])
      claimMilestone(state, 'hero', 'hero_m1')
      const json = exportCodexState(state)

      const newState = createCodexState()
      importCodexState(newState, json)
      const milestones = getClaimableMilestones(newState, 'hero')
      // hero_m1 已领取，不在可领取列表
      expect(milestones.find(m => m.id === 'hero_m1')).toBeUndefined()
    })
  })

  // ==================== 稀有度工具 ====================

  describe('稀有度工具', () => {
    test('稀有度颜色', () => {
      expect(getRarityColor('common')).toBe('#9e9e9e')
      expect(getRarityColor('rare')).toBe('#2196f3')
      expect(getRarityColor('epic')).toBe('#9c27b0')
      expect(getRarityColor('legendary')).toBe('#ff9800')
      expect(getRarityColor('mythic')).toBe('#f44336')
    })

    test('稀有度中文名', () => {
      expect(getRarityLabel('common')).toBe('普通')
      expect(getRarityLabel('rare')).toBe('稀有')
      expect(getRarityLabel('epic')).toBe('史诗')
      expect(getRarityLabel('legendary')).toBe('传说')
      expect(getRarityLabel('mythic')).toBe('神话')
    })
  })

  // ==================== 边界情况 ====================

  describe('边界情况', () => {
    test('解锁所有英雄', () => {
      const heroIds = ['hero_warrior', 'hero_mage', 'hero_archer', 'hero_knight', 'hero_assassin', 'hero_healer', 'hero_necro', 'hero_dragon', 'hero_phoenix', 'hero_titan']
      unlockEntries(state, heroIds)
      expect(getCategoryCompletion(state, 'hero')).toBe(100)
    })

    test('所有分类全收集', () => {
      const allIds = [
        'hero_warrior', 'hero_mage', 'hero_archer', 'hero_knight', 'hero_assassin', 'hero_healer', 'hero_necro', 'hero_dragon', 'hero_phoenix', 'hero_titan',
        'pet_slime', 'pet_fox', 'pet_wolf', 'pet_griffin', 'pet_unicorn', 'pet_dragon_baby', 'pet_phoenix_chick', 'pet_qilin',
        'equip_iron_sword', 'equip_leather_armor', 'equip_flame_blade', 'equip_ice_shield', 'equip_shadow_cloak', 'equip_dragon_armor', 'equip_excalibur', 'equip_celestial_robe',
        'mon_slime_green', 'mon_goblin', 'mon_skeleton', 'mon_werewolf', 'mon_lich', 'mon_demon', 'mon_ancient_dragon', 'mon_void_lord',
      ]
      unlockEntries(state, allIds)
      expect(getGlobalCompletion(state)).toBe(100)
      expect(state.totalUnlocked).toBe(34)
    })

    test('空批量解锁', () => {
      const result = unlockEntries(state, [])
      expect(result.unlocked).toEqual([])
      expect(result.alreadyUnlocked).toEqual([])
      expect(result.notFound).toEqual([])
    })
  })
})
