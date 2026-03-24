/**
 * v0.20 阵容系统 (Formation System)
 * 
 * 功能：
 * - 多阵容管理（最多 3 套阵容）
 * - 角色 + 宠物编队
 * - 阵容羁绊加成
 * - 快速切换阵容
 */

// ==================== 类型定义 ====================

export type FormationSlot = 'character' | 'pet1' | 'pet2' | 'pet3';

export interface FormationUnit {
  type: 'character' | 'pet';
  id: string;
  slot: FormationSlot;
}

export interface Formation {
  id: string;
  name: string;
  units: FormationUnit[];
  characterId?: string;
  petIds: string[];
  createdAt: number;
  updatedAt: number;
  isLocked: boolean;
}

export interface FormationBonus {
  id: string;
  name: string;
  description: string;
  requirement: (formation: Formation) => boolean;
  effect: {
    type: 'attack' | 'defense' | 'health' | 'speed' | 'exp' | 'gold';
    value: number; // 百分比加成 (0.1 = 10%)
  };
}

export interface FormationConfig {
  maxFormations: number;
  maxPetsPerFormation: number;
  bonuses: FormationBonus[];
}

// ==================== 阵容羁绊配置 ====================

export const FORMATION_CONFIG: FormationConfig = {
  maxFormations: 3,
  maxPetsPerFormation: 3,
  bonuses: [
    // 元素共鸣 - 火系
    {
      id: 'bonus_fire_2',
      name: '火焰共鸣 (2)',
      description: '队伍中有 2 只火系宠物，攻击力 +10%',
      requirement: (formation) => countElementsByType(formation, 'pet', 'fire') >= 2,
      effect: { type: 'attack', value: 0.10 },
    },
    {
      id: 'bonus_fire_3',
      name: '火焰共鸣 (3)',
      description: '队伍中有 3 只火系宠物，攻击力 +20%',
      requirement: (formation) => countElementsByType(formation, 'pet', 'fire') >= 3,
      effect: { type: 'attack', value: 0.20 },
    },
    // 元素共鸣 - 水系
    {
      id: 'bonus_water_2',
      name: '流水共鸣 (2)',
      description: '队伍中有 2 只水系宠物，生命值 +10%',
      requirement: (formation) => countElementsByType(formation, 'pet', 'water') >= 2,
      effect: { type: 'health', value: 0.10 },
    },
    {
      id: 'bonus_water_3',
      name: '流水共鸣 (3)',
      description: '队伍中有 3 只水系宠物，生命值 +20%',
      requirement: (formation) => countElementsByType(formation, 'pet', 'water') >= 3,
      effect: { type: 'health', value: 0.20 },
    },
    // 元素共鸣 - 土系
    {
      id: 'bonus_earth_2',
      name: '大地共鸣 (2)',
      description: '队伍中有 2 只土系宠物，防御力 +15%',
      requirement: (formation) => countElementsByType(formation, 'pet', 'earth') >= 2,
      effect: { type: 'defense', value: 0.15 },
    },
    {
      id: 'bonus_earth_3',
      name: '大地共鸣 (3)',
      description: '队伍中有 3 只土系宠物，防御力 +25%',
      requirement: (formation) => countElementsByType(formation, 'pet', 'earth') >= 3,
      effect: { type: 'defense', value: 0.25 },
    },
    // 品质羁绊 - 全稀有
    {
      id: 'bonus_rare_3',
      name: '精英小队',
      description: '队伍中 3 只宠物都是稀有品质，速度 +10%',
      requirement: (formation) => {
        if (formation.petIds.length < 3) return false;
        // 需要检查宠物品质，这里简化处理
        return true;
      },
      effect: { type: 'speed', value: 0.10 },
    },
    // 品质羁绊 - 全史诗
    {
      id: 'bonus_epic_3',
      name: '史诗传奇',
      description: '队伍中 3 只宠物都是史诗品质，全属性 +15%',
      requirement: (formation) => {
        if (formation.petIds.length < 3) return false;
        return true;
      },
      effect: { type: 'attack', value: 0.15 },
    },
    // 品质羁绊 - 全传说
    {
      id: 'bonus_legendary_3',
      name: '神话降临',
      description: '队伍中 3 只宠物都是传说品质，全属性 +30%',
      requirement: (formation) => {
        if (formation.petIds.length < 3) return false;
        return true;
      },
      effect: { type: 'attack', value: 0.30 },
    },
    // 经验加成
    {
      id: 'bonus_exp',
      name: '学习伙伴',
      description: '队伍中有 3 只宠物，经验获取 +20%',
      requirement: (formation) => formation.petIds.length >= 3,
      effect: { type: 'exp', value: 0.20 },
    },
    // 金币加成
    {
      id: 'bonus_gold',
      name: '招财进宝',
      description: '队伍中有 2 只不同元素宠物，金币获取 +15%',
      requirement: (formation) => {
        if (formation.petIds.length < 2) return false;
        // 需要检查元素多样性，这里简化处理
        return true;
      },
      effect: { type: 'gold', value: 0.15 },
    },
  ],
};

// ==================== 工具函数 ====================

/**
 * 生成唯一 ID
 */
let formationIdCounter = 0;
function generateFormationId(): string {
  return `formation_${Date.now()}_${++formationIdCounter}`;
}

/**
 * 创建新阵容
 */
export function createFormation(name: string): Formation {
  return {
    id: generateFormationId(),
    name: name || '新阵容',
    units: [],
    characterId: undefined,
    petIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
  };
}

/**
 * 设置阵容角色
 */
export function setFormationCharacter(formation: Formation, characterId: string | undefined): Formation {
  const newFormation = { ...formation, updatedAt: Date.now() };
  newFormation.characterId = characterId;

  // 更新 units
  if (characterId) {
    const existingIndex = newFormation.units.findIndex((u) => u.slot === 'character');
    if (existingIndex >= 0) {
      newFormation.units[existingIndex] = { type: 'character', id: characterId, slot: 'character' };
    } else {
      newFormation.units.push({ type: 'character', id: characterId, slot: 'character' });
    }
  } else {
    newFormation.units = newFormation.units.filter((u) => u.slot !== 'character');
  }

  return newFormation;
}

/**
 * 添加宠物到阵容
 */
export function addPetToFormation(formation: Formation, petId: string): Formation | null {
  if (formation.petIds.length >= FORMATION_CONFIG.maxPetsPerFormation) {
    return null; // 宠物已满
  }

  if (formation.petIds.includes(petId)) {
    return null; // 宠物已在阵容中
  }

  const newFormation = { ...formation, updatedAt: Date.now() };
  const slotIndex = formation.petIds.length;
  const slot: FormationSlot = `pet${slotIndex + 1}` as FormationSlot;

  newFormation.petIds = [...formation.petIds, petId];
  newFormation.units = [
    ...newFormation.units.filter((u) => !u.slot.startsWith('pet')),
    { type: 'pet', id: petId, slot },
  ];

  return newFormation;
}

/**
 * 从阵容移除宠物
 */
export function removePetFromFormation(formation: Formation, petId: string): Formation {
  const newFormation = { ...formation, updatedAt: Date.now() };
  newFormation.petIds = formation.petIds.filter((id) => id !== petId);
  newFormation.units = newFormation.units.filter((u) => u.id !== petId);

  // 重新排列宠物槽位
  newFormation.petIds.forEach((id, index) => {
    const slot: FormationSlot = `pet${index + 1}` as FormationSlot;
    const existingIndex = newFormation.units.findIndex((u) => u.id === id);
    if (existingIndex >= 0) {
      newFormation.units[existingIndex] = { type: 'pet', id, slot };
    }
  });

  return newFormation;
}

/**
 * 清空阵容
 */
export function clearFormation(formation: Formation): Formation {
  return {
    ...formation,
    characterId: undefined,
    petIds: [],
    units: [],
    updatedAt: Date.now(),
  };
}

/**
 * 删除阵容
 */
export function deleteFormation(formations: Formation[], formationId: string): Formation[] {
  return formations.filter((f) => {
    if (f.id === formationId && f.isLocked) {
      return true; // 锁定的阵容不能删除
    }
    return f.id !== formationId;
  });
}

/**
 * 重命名阵容
 */
export function renameFormation(formation: Formation, newName: string): Formation {
  return {
    ...formation,
    name: newName,
    updatedAt: Date.now(),
  };
}

/**
 * 锁定/解锁阵容
 */
export function toggleFormationLock(formation: Formation): Formation {
  return {
    ...formation,
    isLocked: !formation.isLocked,
    updatedAt: Date.now(),
  };
}

/**
 * 统计阵容中某元素类型的数量
 */
export function countElementsByType(
  formation: Formation,
  unitType: 'character' | 'pet',
  element?: string
): number {
  // 这个函数需要宠物数据来检查元素，这里返回简化版本
  // 实际使用时需要传入宠物数据库
  return formation.petIds.length;
}

/**
 * 计算阵容羁绊加成
 */
export function calculateFormationBonuses(formation: Formation): FormationBonus[] {
  const activeBonuses: FormationBonus[] = [];

  for (const bonus of FORMATION_CONFIG.bonuses) {
    if (bonus.requirement(formation)) {
      activeBonuses.push(bonus);
    }
  }

  return activeBonuses;
}

/**
 * 合并羁绊加成效果
 */
export function mergeFormationBonuses(bonuses: FormationBonus[]): {
  attack: number;
  defense: number;
  health: number;
  speed: number;
  exp: number;
  gold: number;
} {
  const merged = {
    attack: 0,
    defense: 0,
    health: 0,
    speed: 0,
    exp: 0,
    gold: 0,
  };

  for (const bonus of bonuses) {
    merged[bonus.effect.type] += bonus.effect.value;
  }

  return merged;
}

/**
 * 应用阵容加成到属性
 */
export function applyFormationBonuses(
  baseStats: { attack: number; defense: number; health: number; speed: number },
  bonuses: { attack: number; defense: number; health: number; speed: number }
): { attack: number; defense: number; health: number; speed: number } {
  return {
    attack: Math.floor(baseStats.attack * (1 + bonuses.attack)),
    defense: Math.floor(baseStats.defense * (1 + bonuses.defense)),
    health: Math.floor(baseStats.health * (1 + bonuses.health)),
    speed: Math.floor(baseStats.speed * (1 + bonuses.speed)),
  };
}

/**
 * 验证阵容是否有效
 */
export function validateFormation(formation: Formation): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查宠物数量
  if (formation.petIds.length > FORMATION_CONFIG.maxPetsPerFormation) {
    errors.push(`宠物数量超过上限 (${FORMATION_CONFIG.maxPetsPerFormation})`);
  }

  // 检查宠物重复
  const uniquePets = new Set(formation.petIds);
  if (uniquePets.size !== formation.petIds.length) {
    errors.push('阵容中有重复的宠物');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 获取阵容总战力
 */
export function calculateFormationPower(
  formation: Formation,
  characterPower: number,
  petPowers: { [petId: string]: number }
): number {
  let totalPower = characterPower || 0;

  for (const petId of formation.petIds) {
    totalPower += petPowers[petId] || 0;
  }

  // 应用羁绊加成
  const bonuses = calculateFormationBonuses(formation);
  const mergedBonuses = mergeFormationBonuses(bonuses);

  // 战力加成（简化计算）
  const powerBonus = (mergedBonuses.attack + mergedBonuses.defense + mergedBonuses.health) / 3;
  totalPower = Math.floor(totalPower * (1 + powerBonus));

  return totalPower;
}

/**
 * 推荐阵容（根据宠物属性自动搭配）
 */
export function recommendFormation(
  availablePets: { id: string; element: string; quality: string }[],
  strategy: 'balanced' | 'attack' | 'defense' | 'speed' = 'balanced'
): string[] {
  const recommended: string[] = [];

  // 简化推荐逻辑：按品质优先
  const qualityOrder: { [key: string]: number } = {
    legendary: 4,
    epic: 3,
    rare: 2,
    common: 1,
  };

  const sortedPets = [...availablePets].sort(
    (a, b) => qualityOrder[b.quality] - qualityOrder[a.quality]
  );

  // 选择前 3 只
  for (let i = 0; i < Math.min(3, sortedPets.length); i++) {
    recommended.push(sortedPets[i].id);
  }

  return recommended;
}

/**
 * 检查元素多样性
 */
export function getElementDiversity(formation: Formation, petElements: { [petId: string]: string }): {
  unique: number;
  elements: string[];
} {
  const elements = formation.petIds.map((id) => petElements[id]).filter(Boolean);
  const uniqueElements = [...new Set(elements)];

  return {
    unique: uniqueElements.length,
    elements: uniqueElements,
  };
}


