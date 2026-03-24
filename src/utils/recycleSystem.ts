// 资源回收系统 - v0.68 (renamed to avoid conflict with previous teamRaid)
// Resource Recycling / 装备分解与合成

/**
 * 可回收物品类型
 */
export type RecyclableType = 'equipment' | 'pet' | 'hero' | 'material' | 'consumable';

/**
 * 回收材料
 */
export interface RecycleMaterial {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
}

/**
 * 可回收物品
 */
export interface RecyclableItem {
  id: string;
  name: string;
  type: RecyclableType;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  locked: boolean;
}

/**
 * 回收结果
 */
export interface RecycleResult {
  gold: number;
  materials: { materialId: string; amount: number }[];
  specialCurrency: number; // 回收币
}

/**
 * 合成配方
 */
export interface Recipe {
  id: string;
  name: string;
  description: string;
  materials: { materialId: string; amount: number }[];
  goldCost: number;
  resultType: RecyclableType;
  resultRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  resultName: string;
  successRate: number; // 0-1
}

/**
 * 回收系统状态
 */
export interface RecycleState {
  playerId: string;
  /** 拥有的材料 */
  materials: Record<string, number>;
  /** 回收币 */
  recycleCurrency: number;
  /** 累计回收次数 */
  totalRecycled: number;
  /** 累计合成次数 */
  totalCrafted: number;
  /** 合成成功次数 */
  craftSuccess: number;
  /** 合成失败次数 */
  craftFail: number;
  /** 累计获得金币 */
  totalGoldEarned: number;
  /** 自动回收规则 */
  autoRecycleRules: AutoRecycleRule[];
}

/**
 * 自动回收规则
 */
export interface AutoRecycleRule {
  type: RecyclableType;
  maxRarity: 'common' | 'uncommon' | 'rare'; // 自动回收的最高品质
  enabled: boolean;
}

// ==================== 回收材料定义 ====================

export const MATERIALS: Record<string, RecycleMaterial> = {
  iron_scrap: { id: 'iron_scrap', name: '铁屑', rarity: 'common', icon: '🔩' },
  magic_dust: { id: 'magic_dust', name: '魔力粉尘', rarity: 'common', icon: '✨' },
  crystal_shard: { id: 'crystal_shard', name: '水晶碎片', rarity: 'uncommon', icon: '💎' },
  soul_essence: { id: 'soul_essence', name: '灵魂精华', rarity: 'rare', icon: '👻' },
  dragon_scale: { id: 'dragon_scale', name: '龙鳞', rarity: 'epic', icon: '🐉' },
  celestial_core: { id: 'celestial_core', name: '天界核心', rarity: 'legendary', icon: '🌟' },
  pet_fragment: { id: 'pet_fragment', name: '宠物碎片', rarity: 'uncommon', icon: '🐾' },
  hero_essence: { id: 'hero_essence', name: '英雄精华', rarity: 'rare', icon: '⚔️' },
};

// ==================== 品质权重 ====================

export const RARITY_ORDER: Record<string, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4,
};

export const RARITY_GOLD: Record<string, number> = {
  common: 50, uncommon: 150, rare: 500, epic: 2000, legendary: 10000,
};

export const RARITY_CURRENCY: Record<string, number> = {
  common: 1, uncommon: 3, rare: 10, epic: 30, legendary: 100,
};

export const RARITY_MATERIALS: Record<string, { materialId: string; amount: number }[]> = {
  common: [{ materialId: 'iron_scrap', amount: 2 }],
  uncommon: [{ materialId: 'iron_scrap', amount: 3 }, { materialId: 'magic_dust', amount: 1 }],
  rare: [{ materialId: 'crystal_shard', amount: 2 }, { materialId: 'magic_dust', amount: 3 }],
  epic: [{ materialId: 'soul_essence', amount: 2 }, { materialId: 'crystal_shard', amount: 3 }],
  legendary: [{ materialId: 'dragon_scale', amount: 1 }, { materialId: 'soul_essence', amount: 3 }, { materialId: 'celestial_core', amount: 1 }],
};

// ==================== 合成配方 ====================

export const RECIPES: Recipe[] = [
  {
    id: 'craft_rare_equip', name: '稀有装备合成', description: '合成一件稀有装备',
    materials: [{ materialId: 'crystal_shard', amount: 5 }, { materialId: 'iron_scrap', amount: 10 }],
    goldCost: 1000, resultType: 'equipment', resultRarity: 'rare', resultName: '稀有装备', successRate: 0.9,
  },
  {
    id: 'craft_epic_equip', name: '史诗装备合成', description: '合成一件史诗装备',
    materials: [{ materialId: 'soul_essence', amount: 5 }, { materialId: 'crystal_shard', amount: 10 }],
    goldCost: 5000, resultType: 'equipment', resultRarity: 'epic', resultName: '史诗装备', successRate: 0.6,
  },
  {
    id: 'craft_legend_equip', name: '传说装备合成', description: '合成一件传说装备',
    materials: [{ materialId: 'dragon_scale', amount: 3 }, { materialId: 'celestial_core', amount: 2 }, { materialId: 'soul_essence', amount: 10 }],
    goldCost: 20000, resultType: 'equipment', resultRarity: 'legendary', resultName: '传说装备', successRate: 0.3,
  },
  {
    id: 'craft_pet_shard', name: '宠物碎片合成', description: '合成宠物碎片',
    materials: [{ materialId: 'pet_fragment', amount: 10 }, { materialId: 'magic_dust', amount: 5 }],
    goldCost: 500, resultType: 'pet', resultRarity: 'rare', resultName: '宠物碎片', successRate: 1.0,
  },
  {
    id: 'craft_hero_summon', name: '英雄召唤石', description: '合成一个英雄召唤石',
    materials: [{ materialId: 'hero_essence', amount: 10 }, { materialId: 'celestial_core', amount: 1 }],
    goldCost: 3000, resultType: 'hero', resultRarity: 'epic', resultName: '英雄召唤石', successRate: 0.8,
  },
];

// ==================== 核心函数 ====================

/**
 * 创建初始状态
 */
export function createRecycleState(playerId: string): RecycleState {
  return {
    playerId,
    materials: {},
    recycleCurrency: 0,
    totalRecycled: 0,
    totalCrafted: 0,
    craftSuccess: 0,
    craftFail: 0,
    totalGoldEarned: 0,
    autoRecycleRules: [
      { type: 'equipment', maxRarity: 'common', enabled: false },
      { type: 'pet', maxRarity: 'common', enabled: false },
      { type: 'material', maxRarity: 'common', enabled: false },
    ],
  };
}

/**
 * 计算回收结果
 */
export function calculateRecycleResult(item: RecyclableItem): RecycleResult {
  const gold = (RARITY_GOLD[item.rarity] || 50) * (1 + item.level * 0.1);
  const materials = RARITY_MATERIALS[item.rarity] || [];
  const specialCurrency = RARITY_CURRENCY[item.rarity] || 1;

  // 宠物和英雄额外返还专属材料
  const extraMaterials = [...materials];
  if (item.type === 'pet') {
    extraMaterials.push({ materialId: 'pet_fragment', amount: Math.ceil(item.level / 10) });
  } else if (item.type === 'hero') {
    extraMaterials.push({ materialId: 'hero_essence', amount: Math.ceil(item.level / 5) });
  }

  return {
    gold: Math.round(gold),
    materials: extraMaterials,
    specialCurrency,
  };
}

/**
 * 回收物品
 */
export function recycleItem(
  state: RecycleState,
  item: RecyclableItem
): { state: RecycleState; success: boolean; result?: RecycleResult; error?: string } {
  if (item.locked) return { state, success: false, error: '物品已锁定' };

  const result = calculateRecycleResult(item);
  const newState: RecycleState = {
    ...state,
    materials: { ...state.materials },
    totalRecycled: state.totalRecycled + 1,
    recycleCurrency: state.recycleCurrency + result.specialCurrency,
    totalGoldEarned: state.totalGoldEarned + result.gold,
  };

  // 添加材料
  for (const mat of result.materials) {
    newState.materials[mat.materialId] = (newState.materials[mat.materialId] || 0) + mat.amount;
  }

  return { state: newState, success: true, result };
}

/**
 * 批量回收
 */
export function recycleBatch(
  state: RecycleState,
  items: RecyclableItem[]
): { state: RecycleState; recycled: number; skipped: number; totalGold: number; totalCurrency: number } {
  let currentState = state;
  let recycled = 0;
  let skipped = 0;
  let totalGold = 0;
  let totalCurrency = 0;

  for (const item of items) {
    const result = recycleItem(currentState, item);
    if (result.success) {
      currentState = result.state;
      recycled++;
      totalGold += result.result!.gold;
      totalCurrency += result.result!.specialCurrency;
    } else {
      skipped++;
    }
  }

  return { state: currentState, recycled, skipped, totalGold, totalCurrency };
}

/**
 * 自动回收筛选
 */
export function getAutoRecyclable(items: RecyclableItem[], rules: AutoRecycleRule[]): RecyclableItem[] {
  return items.filter(item => {
    if (item.locked) return false;
    const rule = rules.find(r => r.type === item.type && r.enabled);
    if (!rule) return false;
    return RARITY_ORDER[item.rarity] <= RARITY_ORDER[rule.maxRarity];
  });
}

/**
 * 更新自动回收规则
 */
export function updateAutoRecycleRule(
  state: RecycleState,
  type: RecyclableType,
  updates: Partial<AutoRecycleRule>
): RecycleState {
  const rules = state.autoRecycleRules.map(r =>
    r.type === type ? { ...r, ...updates } : r
  );
  return { ...state, autoRecycleRules: rules };
}

/**
 * 检查是否有足够材料合成
 */
export function canCraft(state: RecycleState, recipeId: string, playerGold: number): { canCraft: boolean; reason?: string } {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) return { canCraft: false, reason: '配方不存在' };

  if (playerGold < recipe.goldCost) {
    return { canCraft: false, reason: `金币不足（需要${recipe.goldCost}）` };
  }

  for (const mat of recipe.materials) {
    const owned = state.materials[mat.materialId] || 0;
    if (owned < mat.amount) {
      const matName = MATERIALS[mat.materialId]?.name || mat.materialId;
      return { canCraft: false, reason: `${matName}不足（需要${mat.amount}，拥有${owned}）` };
    }
  }

  return { canCraft: true };
}

/**
 * 合成物品
 */
export function craftItem(
  state: RecycleState,
  recipeId: string,
  playerGold: number,
  rng?: () => number
): { state: RecycleState; success: boolean; crafted: boolean; goldCost: number; error?: string } {
  const check = canCraft(state, recipeId, playerGold);
  if (!check.canCraft) return { state, success: false, crafted: false, goldCost: 0, error: check.reason };

  const recipe = RECIPES.find(r => r.id === recipeId)!;
  const rand = rng ?? Math.random;

  const newState: RecycleState = {
    ...state,
    materials: { ...state.materials },
    totalCrafted: state.totalCrafted + 1,
  };

  // 扣除材料
  for (const mat of recipe.materials) {
    newState.materials[mat.materialId] -= mat.amount;
  }

  // 判定成功
  const crafted = rand() < recipe.successRate;
  if (crafted) {
    newState.craftSuccess++;
  } else {
    newState.craftFail++;
  }

  return { state: newState, success: true, crafted, goldCost: recipe.goldCost };
}

/**
 * 获取材料数量
 */
export function getMaterialCount(state: RecycleState, materialId: string): number {
  return state.materials[materialId] || 0;
}

/**
 * 获取所有拥有的材料
 */
export function getOwnedMaterials(state: RecycleState): { material: RecycleMaterial; amount: number }[] {
  return Object.entries(state.materials)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({ material: MATERIALS[id], amount }))
    .filter(m => m.material);
}

/**
 * 获取可合成的配方
 */
export function getCraftableRecipes(state: RecycleState, playerGold: number): Recipe[] {
  return RECIPES.filter(r => canCraft(state, r.id, playerGold).canCraft);
}

/**
 * 获取回收统计
 */
export function getRecycleStats(state: RecycleState): {
  totalRecycled: number;
  totalCrafted: number;
  craftSuccessRate: number;
  recycleCurrency: number;
  totalGoldEarned: number;
  uniqueMaterials: number;
} {
  return {
    totalRecycled: state.totalRecycled,
    totalCrafted: state.totalCrafted,
    craftSuccessRate: state.totalCrafted > 0 ? Math.round((state.craftSuccess / state.totalCrafted) * 100) : 0,
    recycleCurrency: state.recycleCurrency,
    totalGoldEarned: state.totalGoldEarned,
    uniqueMaterials: Object.values(state.materials).filter(v => v > 0).length,
  };
}

/**
 * 回收币商店 - 可购买物品
 */
export const RECYCLE_SHOP = [
  { id: 'shop_summon_ticket', name: '召唤券', cost: 50, type: 'summonTicket' as const },
  { id: 'shop_stamina_50', name: '体力×50', cost: 20, type: 'stamina' as const },
  { id: 'shop_soul_essence', name: '灵魂精华×5', cost: 30, type: 'material' as const },
  { id: 'shop_dragon_scale', name: '龙鳞×1', cost: 80, type: 'material' as const },
  { id: 'shop_celestial_core', name: '天界核心×1', cost: 200, type: 'material' as const },
];

/**
 * 回收币购买
 */
export function buyWithRecycleCurrency(
  state: RecycleState,
  shopItemId: string
): { state: RecycleState; success: boolean; error?: string } {
  const item = RECYCLE_SHOP.find(i => i.id === shopItemId);
  if (!item) return { state, success: false, error: '商品不存在' };
  if (state.recycleCurrency < item.cost) return { state, success: false, error: '回收币不足' };

  return {
    state: { ...state, recycleCurrency: state.recycleCurrency - item.cost },
    success: true,
  };
}

/**
 * 导出数据
 */
export function exportRecycleData(state: RecycleState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importRecycleData(json: string): RecycleState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || typeof data.totalRecycled !== 'number') return null;
    return data as RecycleState;
  } catch {
    return null;
  }
}
