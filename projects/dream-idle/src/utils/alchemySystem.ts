/**
 * v0.93 炼丹系统 (Alchemy System)
 * 丹药炼制、丹方学习、丹炉升级、丹药效果、炼丹熟练度
 */

export interface Pill {
  id: string;
  name: string;
  quality: PillQuality;
  effect: string;
  duration: number; // 持续时间 (秒)
  bonus: AttributeBonus;
  sideEffect?: string; // 副作用
  value: number; // 价值
}

export interface AttributeBonus {
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  expBonus?: number;
  goldBonus?: number;
  recovery?: number; // 气血恢复
  manaRecovery?: number; // 法力恢复
}

export type PillQuality = 'low' | 'medium' | 'high' | 'perfect' | 'divine';

export interface AlchemyRecipe {
  id: string;
  name: string;
  pillId: string;
  level: number; // 所需炼丹等级
  materials: AlchemyMaterial[];
  successRate: number;
  expGain: number;
}

export interface AlchemyMaterial {
  id: string;
  name: string;
  quantity: number;
  rarity: MaterialRarity;
}

export type MaterialRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AlchemyFurnace {
  id: string;
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  capacity: number; // 同时炼制数量
  successRateBonus: number; // 成功率加成
  qualityBonus: number; // 品质加成
}

export interface AlchemySkill {
  level: number;
  exp: number;
  maxExp: number;
  totalPillsCrafted: number;
  perfectPillsCrafted: number;
  recipes: string[]; // 已学会的丹方 ID
}

export interface AlchemyConfig {
  maxSkillLevel: number;
  maxFurnaceLevel: number;
  baseSuccessRate: number;
  criticalChance: number; // 暴击率 (产出完美丹药)
}

export const ALCHEMY_CONFIG: AlchemyConfig = {
  maxSkillLevel: 100,
  maxFurnaceLevel: 20,
  baseSuccessRate: 0.8,
  criticalChance: 0.1,
};

// 丹药数据库
export const PILL_DATABASE: Pill[] = [
  { id: 'pill_1', name: '回气丹', quality: 'low', effect: '恢复少量气血', duration: 0, bonus: { recovery: 500 }, value: 100 },
  { id: 'pill_2', name: '聚气丹', quality: 'medium', effect: '恢复中量气血', duration: 0, bonus: { recovery: 1500 }, value: 300 },
  { id: 'pill_3', name: '培元丹', quality: 'high', effect: '恢复大量气血', duration: 0, bonus: { recovery: 5000 }, value: 1000 },
  { id: 'pill_4', name: '筑基丹', quality: 'perfect', effect: '永久提升修为', duration: 0, bonus: { expBonus: 20 }, value: 5000 },
  { id: 'pill_5', name: '金丹', quality: 'divine', effect: '大幅提升修为', duration: 0, bonus: { expBonus: 50 }, value: 20000 },
  { id: 'pill_6', name: '力量丹', quality: 'high', effect: '临时提升攻击力', duration: 300, bonus: { attack: 50 }, value: 2000 },
  { id: 'pill_7', name: '护体丹', quality: 'high', effect: '临时提升防御力', duration: 300, bonus: { defense: 50 }, value: 2000 },
  { id: 'pill_8', name: '速度丹', quality: 'high', effect: '临时提升速度', duration: 300, bonus: { speed: 30 }, value: 2000 },
  { id: 'pill_9', name: '幸运丹', quality: 'perfect', effect: '临时提升掉宝率', duration: 600, bonus: { goldBonus: 30 }, value: 8000 },
  { id: 'pill_10', name: '长生丹', quality: 'divine', effect: '永久提升气血上限', duration: 0, bonus: { health: 1000 }, value: 50000 },
];

// 丹方数据库
export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  { id: 'recipe_1', name: '回气丹丹方', pillId: 'pill_1', level: 1, materials: [{ id: 'mat_1', name: '灵芝', quantity: 2, rarity: 'common' }], successRate: 0.95, expGain: 10 },
  { id: 'recipe_2', name: '聚气丹丹方', pillId: 'pill_2', level: 10, materials: [{ id: 'mat_2', name: '人参', quantity: 3, rarity: 'uncommon' }], successRate: 0.90, expGain: 30 },
  { id: 'recipe_3', name: '培元丹丹方', pillId: 'pill_3', level: 30, materials: [{ id: 'mat_3', name: '何首乌', quantity: 5, rarity: 'rare' }], successRate: 0.85, expGain: 100 },
  { id: 'recipe_4', name: '筑基丹丹方', pillId: 'pill_4', level: 50, materials: [{ id: 'mat_4', name: '千年灵芝', quantity: 3, rarity: 'epic' }, { id: 'mat_5', name: '龙涎香', quantity: 1, rarity: 'legendary' }], successRate: 0.70, expGain: 500 },
  { id: 'recipe_5', name: '金丹方', pillId: 'pill_5', level: 80, materials: [{ id: 'mat_6', name: '九转还魂草', quantity: 1, rarity: 'legendary' }, { id: 'mat_7', name: '天地精华', quantity: 5, rarity: 'legendary' }], successRate: 0.50, expGain: 2000 },
  { id: 'recipe_6', name: '力量丹丹方', pillId: 'pill_6', level: 20, materials: [{ id: 'mat_8', name: '虎骨', quantity: 3, rarity: 'rare' }], successRate: 0.85, expGain: 50 },
  { id: 'recipe_7', name: '护体丹丹方', pillId: 'pill_7', level: 20, materials: [{ id: 'mat_9', name: '龟甲', quantity: 3, rarity: 'rare' }], successRate: 0.85, expGain: 50 },
  { id: 'recipe_8', name: '速度丹丹方', pillId: 'pill_8', level: 20, materials: [{ id: 'mat_10', name: '风灵草', quantity: 3, rarity: 'rare' }], successRate: 0.85, expGain: 50 },
  { id: 'recipe_9', name: '幸运丹丹方', pillId: 'pill_9', level: 60, materials: [{ id: 'mat_11', name: '幸运草', quantity: 5, rarity: 'epic' }], successRate: 0.65, expGain: 800 },
  { id: 'recipe_10', name: '长生丹丹方', pillId: 'pill_10', level: 100, materials: [{ id: 'mat_12', name: '不死药', quantity: 1, rarity: 'legendary' }, { id: 'mat_13', name: '仙露', quantity: 10, rarity: 'legendary' }], successRate: 0.40, expGain: 5000 },
];

// 丹炉数据库
export const FURNACE_DATABASE: { id: string; name: string; baseCapacity: number; baseSuccessRateBonus: number; baseQualityBonus: number }[] = [
  { id: 'furnace_1', name: '粗制丹炉', baseCapacity: 1, baseSuccessRateBonus: 0, baseQualityBonus: 0 },
  { id: 'furnace_2', name: '精铁丹炉', baseCapacity: 2, baseSuccessRateBonus: 0.05, baseQualityBonus: 0.05 },
  { id: 'furnace_3', name: '青铜丹炉', baseCapacity: 3, baseSuccessRateBonus: 0.10, baseQualityBonus: 0.10 },
  { id: 'furnace_4', name: '紫铜丹炉', baseCapacity: 4, baseSuccessRateBonus: 0.15, baseQualityBonus: 0.15 },
  { id: 'furnace_5', name: '八卦炉', baseCapacity: 5, baseSuccessRateBonus: 0.20, baseQualityBonus: 0.20 },
  { id: 'furnace_6', name: '太上老君炉', baseCapacity: 6, baseSuccessRateBonus: 0.30, baseQualityBonus: 0.30 },
];

// 创建炼丹技能
export function createAlchemySkill(): AlchemySkill {
  return {
    level: 1,
    exp: 0,
    maxExp: 100,
    totalPillsCrafted: 0,
    perfectPillsCrafted: 0,
    recipes: ['recipe_1'], // 初始学会回气丹丹方
  };
}

// 创建丹炉
export function createFurnace(furnaceId: string): AlchemyFurnace {
  const furnace = FURNACE_DATABASE.find(f => f.id === furnaceId);
  
  if (!furnace) {
    throw new Error(`Unknown furnace: ${furnaceId}`);
  }
  
  return {
    id: `furnace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: furnace.name,
    level: 1,
    exp: 0,
    maxExp: 100,
    capacity: furnace.baseCapacity,
    successRateBonus: furnace.baseSuccessRateBonus,
    qualityBonus: furnace.baseQualityBonus,
  };
}

// 学习丹方
export function learnRecipe(skill: AlchemySkill, recipeId: string): { success: boolean; message: string } {
  const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
  
  if (!recipe) {
    return { success: false, message: '丹方不存在' };
  }
  
  if (skill.recipes.includes(recipeId)) {
    return { success: false, message: '已学会该丹方' };
  }
  
  if (skill.level < recipe.level) {
    return { success: false, message: `炼丹等级不足，需要${recipe.level}级` };
  }
  
  skill.recipes.push(recipeId);
  
  return { success: true, message: `学会${recipe.name}！` };
}

// 炼制丹药
export function craftPill(skill: AlchemySkill, furnace: AlchemyFurnace, recipeId: string): {
  success: boolean;
  message: string;
  pill?: Pill;
  quality?: PillQuality;
  isCritical?: boolean;
} {
  const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
  
  if (!recipe) {
    return { success: false, message: '丹方不存在' };
  }
  
  if (!skill.recipes.includes(recipeId)) {
    return { success: false, message: '未学会该丹方' };
  }
  
  // 计算成功率
  const successRate = Math.min(0.95, recipe.successRate + furnace.successRateBonus);
  const success = Math.random() < successRate;
  
  if (!success) {
    // 失败获得少量经验
    skill.exp += Math.floor(recipe.expGain * 0.2);
    checkSkillLevelUp(skill);
    
    return { success: true, message: '炼制失败，材料损失', pill: undefined };
  }
  
  // 成功炼制
  const pill = PILL_DATABASE.find(p => p.id === recipe.pillId);
  if (!pill) {
    return { success: false, message: '丹药数据错误' };
  }
  
  // 判定品质
  let quality = pill.quality;
  const qualityRoll = Math.random();
  const qualityChance = 0.1 + furnace.qualityBonus + (skill.level * 0.005);
  
  if (qualityRoll < qualityChance * 0.2) {
    quality = 'divine';
  } else if (qualityRoll < qualityChance * 0.4) {
    quality = 'perfect';
  } else if (qualityRoll < qualityChance * 0.6) {
    quality = 'high';
  } else if (qualityRoll < qualityChance * 0.8) {
    quality = 'medium';
  }
  
  // 暴击判定 (完美丹药)
  const isCritical = Math.random() < ALCHEMY_CONFIG.criticalChance;
  if (isCritical) {
    quality = 'divine';
  }
  
  // 更新统计
  skill.totalPillsCrafted += 1;
  if (quality === 'divine' || quality === 'perfect') {
    skill.perfectPillsCrafted += 1;
  }
  
  // 获得经验
  skill.exp += recipe.expGain;
  checkSkillLevelUp(skill);
  
  // 丹炉经验
  furnace.exp += recipe.expGain;
  checkFurnaceLevelUp(furnace);
  
  const craftedPill: Pill = { ...pill, quality };
  
  return {
    success: true,
    message: `炼制${craftedPill.name}成功！品质：${getQualityName(quality)}`,
    pill: craftedPill,
    quality,
    isCritical,
  };
}

// 检查技能升级
function checkSkillLevelUp(skill: AlchemySkill) {
  while (skill.exp >= skill.maxExp && skill.level < ALCHEMY_CONFIG.maxSkillLevel) {
    skill.level += 1;
    skill.exp = 0;
    skill.maxExp = Math.floor(skill.maxExp * 1.2);
  }
}

// 检查丹炉升级
function checkFurnaceLevelUp(furnace: AlchemyFurnace) {
  while (furnace.exp >= furnace.maxExp && furnace.level < ALCHEMY_CONFIG.maxFurnaceLevel) {
    furnace.level += 1;
    furnace.exp = 0;
    furnace.maxExp = Math.floor(furnace.maxExp * 1.5);
    
    // 升级提升属性
    furnace.capacity = Math.min(6, furnace.capacity + 1);
    furnace.successRateBonus += 0.02;
    furnace.qualityBonus += 0.02;
  }
}

// 批量炼制
export function batchCraftPills(skill: AlchemySkill, furnace: AlchemyFurnace, recipeId: string, count: number): {
  successCount: number;
  failCount: number;
  criticalCount: number;
  pills: Pill[];
  totalExp: number;
} {
  const results: { success: boolean; pill?: Pill; isCritical?: boolean }[] = [];
  
  for (let i = 0; i < count; i++) {
    const result = craftPill(skill, furnace, recipeId);
    results.push({ success: result.success, pill: result.pill, isCritical: result.isCritical });
  }
  
  const successCount = results.filter(r => r.success && r.pill).length;
  const failCount = results.filter(r => !r.pill).length;
  const criticalCount = results.filter(r => r.isCritical).length;
  const pills = results.filter(r => r.pill).map(r => r.pill!) as Pill[];
  const totalExp = results.filter(r => r.success).length * 10; // 简化计算
  
  return { successCount, failCount, criticalCount, pills, totalExp };
}

// 获取炼丹统计
export function getAlchemyStats(skill: AlchemySkill, furnace: AlchemyFurnace): {
  skillLevel: number;
  furnaceLevel: number;
  totalPills: number;
  perfectPills: number;
  perfectRate: number;
  recipesLearned: number;
  furnaceCapacity: number;
  successRateBonus: number;
} {
  return {
    skillLevel: skill.level,
    furnaceLevel: furnace.level,
    totalPills: skill.totalPillsCrafted,
    perfectPills: skill.perfectPillsCrafted,
    perfectRate: skill.totalPillsCrafted > 0 ? Math.floor((skill.perfectPillsCrafted / skill.totalPillsCrafted) * 100) : 0,
    recipesLearned: skill.recipes.length,
    furnaceCapacity: furnace.capacity,
    successRateBonus: furnace.successRateBonus,
  };
}

// 获取品质名称
export function getQualityName(quality: PillQuality): string {
  const names: Record<PillQuality, string> = {
    low: '下品',
    medium: '中品',
    high: '上品',
    perfect: '极品',
    divine: '仙品',
  };
  return names[quality];
}

// 获取材料稀有度名称
export function getMaterialRarityName(rarity: MaterialRarity): string {
  const names: Record<MaterialRarity, string> = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return names[rarity];
}

// 使用丹药
export function usePill(pill: Pill): { success: boolean; message: string; bonus: AttributeBonus; duration?: number } {
  if (pill.duration > 0) {
    return {
      success: true,
      message: `使用${pill.name}，效果持续${pill.duration}秒`,
      bonus: pill.bonus,
      duration: pill.duration,
    };
  } else {
    return {
      success: true,
      message: `使用${pill.name}，获得永久属性提升`,
      bonus: pill.bonus,
    };
  }
}
