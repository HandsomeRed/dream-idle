/**
 * v0.50 合成系统
 * 
 * 功能特性：
 * - 装备合成（低品质→高品质）
 * - 材料合成（碎片→完整材料）
 * - 宝石合成（低级→高级）
 * - 药水合成（回复/增益药水）
 * - 配方系统（解锁/学习配方）
 * - 批量合成
 * - 合成历史
 */

export type CraftingCategory = '装备' | '材料' | '宝石' | '药水' | '特殊'
export type ItemQuality = '普通' | '稀有' | '史诗' | '传说' | '神话'

export interface CraftingMaterial {
  itemId: string
  name: string
  quantity: number
}

export interface CraftingRecipe {
  id: string
  name: string
  category: CraftingCategory
  description: string
  materials: CraftingMaterial[]       // 所需材料
  goldCost: number                    // 金币消耗
  result: CraftingResult              // 合成结果
  unlockLevel: number                 // 解锁等级
  successRate: number                 // 成功率 (0-100)
  craftTimeMs: number                 // 合成时间（毫秒）
  quality: ItemQuality                // 产出品质
}

export interface CraftingResult {
  itemId: string
  name: string
  quantity: number
  quality: ItemQuality
}

export interface CraftingHistory {
  recipeId: string
  recipeName: string
  timestamp: number
  success: boolean
  result?: CraftingResult
  materialsUsed: CraftingMaterial[]
  goldSpent: number
}

export interface PlayerInventory {
  items: Map<string, number>          // itemId -> quantity
  gold: number
  diamonds: number
}

export interface CraftingState {
  unlockedRecipes: Set<string>        // 已解锁配方 ID
  history: CraftingHistory[]          // 合成历史（最近 100 条）
  totalCrafted: number                // 总合成次数
  totalSuccess: number                // 总成功次数
  totalGoldSpent: number              // 总金币消耗
  craftingQueue: CraftingQueueItem[]  // 合成队列
}

export interface CraftingQueueItem {
  recipeId: string
  startTime: number
  endTime: number
  count: number
}

// ========== 配方库 ==========

export const RECIPES: CraftingRecipe[] = [
  // 装备合成
  {
    id: 'iron_sword',
    name: '铁剑',
    category: '装备',
    description: '基础铁剑，新手必备。',
    materials: [
      { itemId: 'iron_ore', name: '铁矿石', quantity: 5 },
      { itemId: 'wood', name: '木材', quantity: 3 },
    ],
    goldCost: 500,
    result: { itemId: 'iron_sword', name: '铁剑', quantity: 1, quality: '普通' },
    unlockLevel: 1,
    successRate: 100,
    craftTimeMs: 5000,
    quality: '普通',
  },
  {
    id: 'steel_sword',
    name: '钢剑',
    category: '装备',
    description: '精炼钢铁打造的利剑。',
    materials: [
      { itemId: 'steel_ingot', name: '钢锭', quantity: 3 },
      { itemId: 'leather', name: '皮革', quantity: 2 },
      { itemId: 'iron_sword', name: '铁剑', quantity: 1 },
    ],
    goldCost: 2000,
    result: { itemId: 'steel_sword', name: '钢剑', quantity: 1, quality: '稀有' },
    unlockLevel: 15,
    successRate: 90,
    craftTimeMs: 15000,
    quality: '稀有',
  },
  {
    id: 'mythril_sword',
    name: '秘银剑',
    category: '装备',
    description: '传说中的秘银打造，锋利无比。',
    materials: [
      { itemId: 'mythril_ore', name: '秘银矿', quantity: 5 },
      { itemId: 'magic_crystal', name: '魔法水晶', quantity: 3 },
      { itemId: 'steel_sword', name: '钢剑', quantity: 1 },
    ],
    goldCost: 10000,
    result: { itemId: 'mythril_sword', name: '秘银剑', quantity: 1, quality: '史诗' },
    unlockLevel: 40,
    successRate: 70,
    craftTimeMs: 30000,
    quality: '史诗',
  },
  // 材料合成
  {
    id: 'steel_ingot',
    name: '钢锭',
    category: '材料',
    description: '将铁矿石精炼为钢锭。',
    materials: [
      { itemId: 'iron_ore', name: '铁矿石', quantity: 3 },
      { itemId: 'coal', name: '煤炭', quantity: 2 },
    ],
    goldCost: 200,
    result: { itemId: 'steel_ingot', name: '钢锭', quantity: 1, quality: '普通' },
    unlockLevel: 5,
    successRate: 100,
    craftTimeMs: 3000,
    quality: '普通',
  },
  {
    id: 'magic_crystal',
    name: '魔法水晶',
    category: '材料',
    description: '将魔法碎片合成为完整水晶。',
    materials: [
      { itemId: 'magic_shard', name: '魔法碎片', quantity: 10 },
    ],
    goldCost: 500,
    result: { itemId: 'magic_crystal', name: '魔法水晶', quantity: 1, quality: '稀有' },
    unlockLevel: 20,
    successRate: 95,
    craftTimeMs: 5000,
    quality: '稀有',
  },
  // 宝石合成
  {
    id: 'gem_lv2',
    name: '二级宝石',
    category: '宝石',
    description: '将 3 颗一级宝石合成为二级宝石。',
    materials: [
      { itemId: 'gem_lv1', name: '一级宝石', quantity: 3 },
    ],
    goldCost: 1000,
    result: { itemId: 'gem_lv2', name: '二级宝石', quantity: 1, quality: '稀有' },
    unlockLevel: 10,
    successRate: 100,
    craftTimeMs: 2000,
    quality: '稀有',
  },
  {
    id: 'gem_lv3',
    name: '三级宝石',
    category: '宝石',
    description: '将 3 颗二级宝石合成为三级宝石。',
    materials: [
      { itemId: 'gem_lv2', name: '二级宝石', quantity: 3 },
    ],
    goldCost: 5000,
    result: { itemId: 'gem_lv3', name: '三级宝石', quantity: 1, quality: '史诗' },
    unlockLevel: 25,
    successRate: 80,
    craftTimeMs: 5000,
    quality: '史诗',
  },
  {
    id: 'gem_lv4',
    name: '四级宝石',
    category: '宝石',
    description: '将 3 颗三级宝石合成为四级宝石。',
    materials: [
      { itemId: 'gem_lv3', name: '三级宝石', quantity: 3 },
    ],
    goldCost: 20000,
    result: { itemId: 'gem_lv4', name: '四级宝石', quantity: 1, quality: '传说' },
    unlockLevel: 50,
    successRate: 60,
    craftTimeMs: 10000,
    quality: '传说',
  },
  // 药水合成
  {
    id: 'hp_potion',
    name: '生命药水',
    category: '药水',
    description: '恢复生命值的基础药水。',
    materials: [
      { itemId: 'herb', name: '草药', quantity: 3 },
      { itemId: 'water', name: '清水', quantity: 1 },
    ],
    goldCost: 100,
    result: { itemId: 'hp_potion', name: '生命药水', quantity: 3, quality: '普通' },
    unlockLevel: 1,
    successRate: 100,
    craftTimeMs: 2000,
    quality: '普通',
  },
  {
    id: 'atk_potion',
    name: '攻击药水',
    category: '药水',
    description: '临时提升攻击力的增益药水。',
    materials: [
      { itemId: 'fire_herb', name: '火焰草', quantity: 5 },
      { itemId: 'magic_shard', name: '魔法碎片', quantity: 2 },
    ],
    goldCost: 300,
    result: { itemId: 'atk_potion', name: '攻击药水', quantity: 2, quality: '稀有' },
    unlockLevel: 15,
    successRate: 90,
    craftTimeMs: 5000,
    quality: '稀有',
  },
  // 特殊合成
  {
    id: 'hero_summon_ticket',
    name: '英雄召唤券',
    category: '特殊',
    description: '用碎片合成英雄召唤券。',
    materials: [
      { itemId: 'hero_shard', name: '英雄碎片', quantity: 50 },
      { itemId: 'magic_crystal', name: '魔法水晶', quantity: 1 },
    ],
    goldCost: 5000,
    result: { itemId: 'hero_summon_ticket', name: '英雄召唤券', quantity: 1, quality: '史诗' },
    unlockLevel: 30,
    successRate: 85,
    craftTimeMs: 10000,
    quality: '史诗',
  },
  {
    id: 'pet_summon_ticket',
    name: '宠物召唤券',
    category: '特殊',
    description: '用碎片合成宠物召唤券。',
    materials: [
      { itemId: 'pet_shard', name: '宠物碎片', quantity: 50 },
      { itemId: 'magic_crystal', name: '魔法水晶', quantity: 1 },
    ],
    goldCost: 5000,
    result: { itemId: 'pet_summon_ticket', name: '宠物召唤券', quantity: 1, quality: '史诗' },
    unlockLevel: 30,
    successRate: 85,
    craftTimeMs: 10000,
    quality: '史诗',
  },
]

// ========== 核心函数 ==========

/**
 * 创建合成系统状态
 */
export function createCraftingState(): CraftingState {
  // 初始解锁等级 1 的配方
  const unlockedRecipes = new Set<string>()
  for (const recipe of RECIPES) {
    if (recipe.unlockLevel <= 1) {
      unlockedRecipes.add(recipe.id)
    }
  }

  return {
    unlockedRecipes,
    history: [],
    totalCrafted: 0,
    totalSuccess: 0,
    totalGoldSpent: 0,
    craftingQueue: [],
  }
}

/**
 * 创建玩家背包
 */
export function createInventory(gold: number = 10000): PlayerInventory {
  return {
    items: new Map(),
    gold,
    diamonds: 0,
  }
}

/**
 * 添加物品到背包
 */
export function addItem(inventory: PlayerInventory, itemId: string, quantity: number): void {
  const current = inventory.items.get(itemId) || 0
  inventory.items.set(itemId, current + quantity)
}

/**
 * 检查是否有足够材料
 */
export function hasEnoughMaterials(
  inventory: PlayerInventory,
  materials: CraftingMaterial[],
  count: number = 1
): boolean {
  for (const mat of materials) {
    const have = inventory.items.get(mat.itemId) || 0
    if (have < mat.quantity * count) return false
  }
  return true
}

/**
 * 解锁配方
 */
export function unlockRecipe(
  state: CraftingState,
  recipeId: string,
  playerLevel: number
): { success: boolean; reason?: string } {
  const recipe = RECIPES.find(r => r.id === recipeId)
  if (!recipe) return { success: false, reason: '配方不存在' }

  if (state.unlockedRecipes.has(recipeId)) {
    return { success: false, reason: '配方已解锁' }
  }

  if (playerLevel < recipe.unlockLevel) {
    return { success: false, reason: `等级不足，需要 ${recipe.unlockLevel} 级` }
  }

  state.unlockedRecipes.add(recipeId)
  return { success: true }
}

/**
 * 解锁所有可用配方
 */
export function unlockAvailableRecipes(state: CraftingState, playerLevel: number): string[] {
  const newlyUnlocked: string[] = []

  for (const recipe of RECIPES) {
    if (!state.unlockedRecipes.has(recipe.id) && playerLevel >= recipe.unlockLevel) {
      state.unlockedRecipes.add(recipe.id)
      newlyUnlocked.push(recipe.id)
    }
  }

  return newlyUnlocked
}

/**
 * 检查是否可以合成
 */
export function canCraft(
  state: CraftingState,
  inventory: PlayerInventory,
  recipeId: string,
  count: number = 1
): { canCraft: boolean; reason?: string } {
  const recipe = RECIPES.find(r => r.id === recipeId)
  if (!recipe) return { canCraft: false, reason: '配方不存在' }

  if (!state.unlockedRecipes.has(recipeId)) {
    return { canCraft: false, reason: '配方未解锁' }
  }

  if (!hasEnoughMaterials(inventory, recipe.materials, count)) {
    return { canCraft: false, reason: '材料不足' }
  }

  if (inventory.gold < recipe.goldCost * count) {
    return { canCraft: false, reason: '金币不足' }
  }

  return { canCraft: true }
}

/**
 * 执行合成
 */
export function craft(
  state: CraftingState,
  inventory: PlayerInventory,
  recipeId: string,
  count: number = 1
): { success: boolean; results: CraftingResult[]; failures: number; reason?: string } {
  const check = canCraft(state, inventory, recipeId, count)
  if (!check.canCraft) {
    return { success: false, results: [], failures: 0, reason: check.reason }
  }

  const recipe = RECIPES.find(r => r.id === recipeId)!
  const results: CraftingResult[] = []
  let failures = 0

  // 扣除材料和金币
  for (const mat of recipe.materials) {
    const current = inventory.items.get(mat.itemId) || 0
    inventory.items.set(mat.itemId, current - mat.quantity * count)
  }
  inventory.gold -= recipe.goldCost * count

  // 执行合成（根据成功率）
  for (let i = 0; i < count; i++) {
    const roll = Math.random() * 100
    const success = roll < recipe.successRate

    if (success) {
      results.push({ ...recipe.result })
      // 添加产出到背包
      addItem(inventory, recipe.result.itemId, recipe.result.quantity)
      state.totalSuccess++
    } else {
      failures++
    }

    // 记录历史
    const historyEntry: CraftingHistory = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      timestamp: Date.now(),
      success,
      result: success ? { ...recipe.result } : undefined,
      materialsUsed: recipe.materials.map(m => ({ ...m, quantity: m.quantity })),
      goldSpent: recipe.goldCost,
    }

    state.history.unshift(historyEntry)
    if (state.history.length > 100) {
      state.history = state.history.slice(0, 100)
    }

    state.totalCrafted++
    state.totalGoldSpent += recipe.goldCost
  }

  return {
    success: results.length > 0,
    results,
    failures,
  }
}

/**
 * 获取配方列表（按分类）
 */
export function getRecipesByCategory(
  state: CraftingState,
  category?: CraftingCategory
): CraftingRecipe[] {
  let recipes = RECIPES.filter(r => state.unlockedRecipes.has(r.id))

  if (category) {
    recipes = recipes.filter(r => r.category === category)
  }

  return recipes
}

/**
 * 获取合成统计
 */
export function getCraftingStats(state: CraftingState): {
  totalCrafted: number
  totalSuccess: number
  successRate: number
  totalGoldSpent: number
  unlockedRecipes: number
  totalRecipes: number
} {
  return {
    totalCrafted: state.totalCrafted,
    totalSuccess: state.totalSuccess,
    successRate: state.totalCrafted > 0
      ? Math.round((state.totalSuccess / state.totalCrafted) * 100)
      : 0,
    totalGoldSpent: state.totalGoldSpent,
    unlockedRecipes: state.unlockedRecipes.size,
    totalRecipes: RECIPES.length,
  }
}

/**
 * 获取合成历史
 */
export function getCraftingHistory(state: CraftingState, limit: number = 20): CraftingHistory[] {
  return state.history.slice(0, limit)
}

/**
 * 导出合成状态
 */
export function exportCraftingState(state: CraftingState): any {
  return {
    unlockedRecipes: Array.from(state.unlockedRecipes),
    history: state.history,
    totalCrafted: state.totalCrafted,
    totalSuccess: state.totalSuccess,
    totalGoldSpent: state.totalGoldSpent,
    craftingQueue: state.craftingQueue,
  }
}

/**
 * 导入合成状态
 */
export function importCraftingState(data: any): CraftingState {
  return {
    unlockedRecipes: new Set(data.unlockedRecipes),
    history: data.history,
    totalCrafted: data.totalCrafted,
    totalSuccess: data.totalSuccess,
    totalGoldSpent: data.totalGoldSpent,
    craftingQueue: data.craftingQueue || [],
  }
}
