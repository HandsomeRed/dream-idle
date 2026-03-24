/**
 * v0.50 合成系统测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  createCraftingState,
  createInventory,
  addItem,
  hasEnoughMaterials,
  unlockRecipe,
  unlockAvailableRecipes,
  canCraft,
  craft,
  getRecipesByCategory,
  getCraftingStats,
  getCraftingHistory,
  exportCraftingState,
  importCraftingState,
  RECIPES,
  CraftingState,
  PlayerInventory,
} from './crafting'

describe('v0.50 合成系统', () => {
  describe('初始化', () => {
    it('应该创建初始合成状态', () => {
      const state = createCraftingState()

      expect(state.unlockedRecipes.size).toBeGreaterThan(0)
      expect(state.history.length).toBe(0)
      expect(state.totalCrafted).toBe(0)
      expect(state.totalSuccess).toBe(0)
      expect(state.totalGoldSpent).toBe(0)
    })

    it('应该自动解锁等级 1 的配方', () => {
      const state = createCraftingState()

      const lv1Recipes = RECIPES.filter(r => r.unlockLevel <= 1)
      for (const recipe of lv1Recipes) {
        expect(state.unlockedRecipes.has(recipe.id)).toBe(true)
      }
    })

    it('应该创建玩家背包', () => {
      const inventory = createInventory(5000)

      expect(inventory.gold).toBe(5000)
      expect(inventory.items.size).toBe(0)
    })
  })

  describe('背包管理', () => {
    let inventory: PlayerInventory

    beforeEach(() => {
      inventory = createInventory(10000)
    })

    it('应该添加物品到背包', () => {
      addItem(inventory, 'iron_ore', 10)

      expect(inventory.items.get('iron_ore')).toBe(10)
    })

    it('应该累加物品数量', () => {
      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'iron_ore', 3)

      expect(inventory.items.get('iron_ore')).toBe(8)
    })

    it('应该检查材料是否足够', () => {
      addItem(inventory, 'iron_ore', 10)
      addItem(inventory, 'wood', 5)

      const materials = [
        { itemId: 'iron_ore', name: '铁矿石', quantity: 5 },
        { itemId: 'wood', name: '木材', quantity: 3 },
      ]

      expect(hasEnoughMaterials(inventory, materials)).toBe(true)
    })

    it('材料不足时返回 false', () => {
      addItem(inventory, 'iron_ore', 2)

      const materials = [
        { itemId: 'iron_ore', name: '铁矿石', quantity: 5 },
      ]

      expect(hasEnoughMaterials(inventory, materials)).toBe(false)
    })

    it('批量合成时应该检查倍数材料', () => {
      addItem(inventory, 'iron_ore', 10)
      addItem(inventory, 'wood', 6)

      const materials = [
        { itemId: 'iron_ore', name: '铁矿石', quantity: 5 },
        { itemId: 'wood', name: '木材', quantity: 3 },
      ]

      expect(hasEnoughMaterials(inventory, materials, 2)).toBe(true)
      expect(hasEnoughMaterials(inventory, materials, 3)).toBe(false)
    })
  })

  describe('配方解锁', () => {
    let state: CraftingState

    beforeEach(() => {
      state = createCraftingState()
    })

    it('应该解锁配方', () => {
      const result = unlockRecipe(state, 'steel_ingot', 10)

      expect(result.success).toBe(true)
      expect(state.unlockedRecipes.has('steel_ingot')).toBe(true)
    })

    it('等级不足不能解锁配方', () => {
      const result = unlockRecipe(state, 'mythril_sword', 10)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('等级不足')
    })

    it('不能重复解锁配方', () => {
      unlockRecipe(state, 'steel_ingot', 10)
      const result = unlockRecipe(state, 'steel_ingot', 10)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('已解锁')
    })

    it('不存在的配方返回错误', () => {
      const result = unlockRecipe(state, 'nonexistent', 100)

      expect(result.success).toBe(false)
      expect(result.reason).toContain('不存在')
    })

    it('应该批量解锁可用配方', () => {
      const unlocked = unlockAvailableRecipes(state, 20)

      expect(unlocked.length).toBeGreaterThan(0)

      // 所有等级 <= 20 的配方应该已解锁
      const shouldBeUnlocked = RECIPES.filter(r => r.unlockLevel <= 20)
      for (const recipe of shouldBeUnlocked) {
        expect(state.unlockedRecipes.has(recipe.id)).toBe(true)
      }
    })
  })

  describe('合成检查', () => {
    let state: CraftingState
    let inventory: PlayerInventory

    beforeEach(() => {
      state = createCraftingState()
      inventory = createInventory(10000)
    })

    it('有足够材料和金币时可以合成', () => {
      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'wood', 3)

      const result = canCraft(state, inventory, 'iron_sword')

      expect(result.canCraft).toBe(true)
    })

    it('材料不足时不能合成', () => {
      addItem(inventory, 'iron_ore', 2)

      const result = canCraft(state, inventory, 'iron_sword')

      expect(result.canCraft).toBe(false)
      expect(result.reason).toContain('材料不足')
    })

    it('金币不足时不能合成', () => {
      inventory.gold = 100
      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'wood', 3)

      const result = canCraft(state, inventory, 'iron_sword')

      expect(result.canCraft).toBe(false)
      expect(result.reason).toContain('金币不足')
    })

    it('未解锁配方不能合成', () => {
      const result = canCraft(state, inventory, 'mythril_sword')

      expect(result.canCraft).toBe(false)
      expect(result.reason).toContain('未解锁')
    })
  })

  describe('执行合成', () => {
    let state: CraftingState
    let inventory: PlayerInventory

    beforeEach(() => {
      state = createCraftingState()
      inventory = createInventory(10000)
    })

    it('应该成功合成铁剑（100% 成功率）', () => {
      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'wood', 3)

      const result = craft(state, inventory, 'iron_sword')

      expect(result.success).toBe(true)
      expect(result.results.length).toBe(1)
      expect(result.results[0].itemId).toBe('iron_sword')
      expect(result.failures).toBe(0)
    })

    it('合成后应该扣除材料和金币', () => {
      addItem(inventory, 'iron_ore', 10)
      addItem(inventory, 'wood', 6)

      craft(state, inventory, 'iron_sword')

      expect(inventory.items.get('iron_ore')).toBe(5) // 10 - 5
      expect(inventory.items.get('wood')).toBe(3) // 6 - 3
      expect(inventory.gold).toBe(9500) // 10000 - 500
    })

    it('合成后应该添加产出到背包', () => {
      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'wood', 3)

      craft(state, inventory, 'iron_sword')

      expect(inventory.items.get('iron_sword')).toBe(1)
    })

    it('批量合成应该正确处理', () => {
      addItem(inventory, 'iron_ore', 15)
      addItem(inventory, 'wood', 9)

      const result = craft(state, inventory, 'iron_sword', 3)

      expect(result.success).toBe(true)
      expect(result.results.length).toBe(3)
      expect(inventory.items.get('iron_ore')).toBe(0) // 15 - 15
      expect(inventory.items.get('wood')).toBe(0) // 9 - 9
      expect(inventory.gold).toBe(8500) // 10000 - 1500
    })

    it('合成应该记录历史', () => {
      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'wood', 3)

      craft(state, inventory, 'iron_sword')

      expect(state.history.length).toBe(1)
      expect(state.history[0].recipeId).toBe('iron_sword')
      expect(state.history[0].success).toBe(true)
    })

    it('合成应该更新统计', () => {
      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'wood', 3)

      craft(state, inventory, 'iron_sword')

      expect(state.totalCrafted).toBe(1)
      expect(state.totalSuccess).toBe(1)
      expect(state.totalGoldSpent).toBe(500)
    })

    it('药水合成应该产出多个', () => {
      addItem(inventory, 'herb', 3)
      addItem(inventory, 'water', 1)

      const result = craft(state, inventory, 'hp_potion')

      expect(result.success).toBe(true)
      expect(result.results[0].quantity).toBe(3) // 一次产出 3 瓶
      expect(inventory.items.get('hp_potion')).toBe(3)
    })

    it('历史记录最多保留 100 条', () => {
      addItem(inventory, 'iron_ore', 600)
      addItem(inventory, 'wood', 400)
      inventory.gold = 1000000

      for (let i = 0; i < 110; i++) {
        craft(state, inventory, 'iron_sword')
      }

      expect(state.history.length).toBe(100)
      expect(state.totalCrafted).toBe(110)
    })
  })

  describe('配方查询', () => {
    let state: CraftingState

    beforeEach(() => {
      state = createCraftingState()
      unlockAvailableRecipes(state, 100) // 解锁所有配方
    })

    it('应该获取所有已解锁配方', () => {
      const recipes = getRecipesByCategory(state)

      expect(recipes.length).toBe(RECIPES.length)
    })

    it('应该按分类筛选配方', () => {
      const weapons = getRecipesByCategory(state, '装备')
      expect(weapons.length).toBeGreaterThan(0)
      expect(weapons.every(r => r.category === '装备')).toBe(true)

      const gems = getRecipesByCategory(state, '宝石')
      expect(gems.length).toBeGreaterThan(0)
      expect(gems.every(r => r.category === '宝石')).toBe(true)
    })

    it('只返回已解锁的配方', () => {
      const newState = createCraftingState()
      const recipes = getRecipesByCategory(newState)

      // 只有等级 1 的配方被解锁
      expect(recipes.every(r => r.unlockLevel <= 1)).toBe(true)
    })
  })

  describe('统计信息', () => {
    it('应该获取合成统计', () => {
      const state = createCraftingState()
      const inventory = createInventory(100000)

      addItem(inventory, 'iron_ore', 50)
      addItem(inventory, 'wood', 30)

      craft(state, inventory, 'iron_sword', 5)

      const stats = getCraftingStats(state)

      expect(stats.totalCrafted).toBe(5)
      expect(stats.totalSuccess).toBe(5) // 铁剑 100% 成功率
      expect(stats.successRate).toBe(100)
      expect(stats.totalGoldSpent).toBe(2500)
      expect(stats.unlockedRecipes).toBeGreaterThan(0)
      expect(stats.totalRecipes).toBe(RECIPES.length)
    })

    it('应该获取合成历史', () => {
      const state = createCraftingState()
      const inventory = createInventory(100000)

      addItem(inventory, 'iron_ore', 15)
      addItem(inventory, 'wood', 9)

      craft(state, inventory, 'iron_sword', 3)

      const history = getCraftingHistory(state, 2)

      expect(history.length).toBe(2) // limit=2
      expect(history[0].recipeId).toBe('iron_sword')
    })
  })

  describe('配方库', () => {
    it('应该有 12 个配方', () => {
      expect(RECIPES.length).toBe(12)
    })

    it('应该包含所有分类', () => {
      const categories = new Set(RECIPES.map(r => r.category))

      expect(categories.has('装备')).toBe(true)
      expect(categories.has('材料')).toBe(true)
      expect(categories.has('宝石')).toBe(true)
      expect(categories.has('药水')).toBe(true)
      expect(categories.has('特殊')).toBe(true)
    })

    it('每个配方都有有效的成功率', () => {
      for (const recipe of RECIPES) {
        expect(recipe.successRate).toBeGreaterThan(0)
        expect(recipe.successRate).toBeLessThanOrEqual(100)
      }
    })

    it('每个配方都有材料需求', () => {
      for (const recipe of RECIPES) {
        expect(recipe.materials.length).toBeGreaterThan(0)
      }
    })
  })

  describe('数据导出导入', () => {
    it('应该导出和导入合成状态', () => {
      const state = createCraftingState()
      const inventory = createInventory(10000)

      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'wood', 3)
      craft(state, inventory, 'iron_sword')
      unlockRecipe(state, 'steel_ingot', 10)

      const exported = exportCraftingState(state)

      expect(exported.unlockedRecipes.length).toBeGreaterThan(0)
      expect(exported.totalCrafted).toBe(1)
      expect(exported.history.length).toBe(1)

      const imported = importCraftingState(exported)

      expect(imported.unlockedRecipes.size).toBe(state.unlockedRecipes.size)
      expect(imported.totalCrafted).toBe(1)
      expect(imported.history.length).toBe(1)
    })
  })

  describe('边界情况', () => {
    it('应该处理合成数量为 0', () => {
      const state = createCraftingState()
      const inventory = createInventory(10000)

      addItem(inventory, 'iron_ore', 5)
      addItem(inventory, 'wood', 3)

      const result = craft(state, inventory, 'iron_sword', 0)

      // 0 次合成不消耗材料
      expect(inventory.items.get('iron_ore')).toBe(5)
    })

    it('应该处理空背包', () => {
      const state = createCraftingState()
      const inventory = createInventory(0)

      const result = canCraft(state, inventory, 'iron_sword')

      expect(result.canCraft).toBe(false)
    })
  })
})
