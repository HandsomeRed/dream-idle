/**
 * v0.19 宠物系统 (Pet System)
 * 
 * 功能：
 * - 宠物收集（抽卡系统）
 * - 宠物战斗辅助
 * - 宠物技能
 * - 宠物进化/升级
 */

// ==================== 类型定义 ====================

export type PetQuality = 'common' | 'rare' | 'epic' | 'legendary';

export type PetElement = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';

export interface PetSkill {
  id: string;
  name: string;
  description: string;
  damageMultiplier: number;
  cooldown: number; // 回合数
  effectType: 'damage' | 'buff' | 'debuff' | 'heal';
}

export interface Pet {
  id: string;
  name: string;
  quality: PetQuality;
  element: PetElement;
  level: number;
  exp: number;
  maxExp: number;
  stars: number; // 1-5 星
  skills: PetSkill[];
  // 基础属性
  baseAttack: number;
  baseDefense: number;
  baseHealth: number;
  // 当前属性（含等级加成）
  currentAttack: number;
  currentDefense: number;
  currentHealth: number;
  // 战斗辅助效果
  assistRate: number; // 协助攻击触发率 (%)
  assistDamage: number; // 协助伤害加成 (%)
  // 获取时间
  obtainedAt: number;
  isLocked: boolean;
}

export interface PetGachaResult {
  pet: Pet;
  isNew: boolean;
  gachaType: 'normal' | 'premium';
}

export interface PetConfig {
  gachaRates: {
    normal: {
      common: number;
      rare: number;
      epic: number;
      legendary: number;
    };
    premium: {
      common: number;
      rare: number;
      epic: number;
      legendary: number;
    };
  };
  levelUpExpCurve: (level: number) => number;
  starUpCost: (stars: number) => number;
}

// ==================== 宠物数据 ====================

const PET_DATABASE: Omit<Pet, 'level' | 'exp' | 'maxExp' | 'stars' | 'currentAttack' | 'currentDefense' | 'currentHealth' | 'obtainedAt' | 'isLocked'>[] = [
  // 普通宠物 (Common)
  {
    id: 'pet_001',
    name: '小海龟',
    quality: 'common',
    element: 'water',
    baseAttack: 50,
    baseDefense: 80,
    baseHealth: 200,
    assistRate: 10,
    assistDamage: 20,
    skills: [
      {
        id: 'skill_001',
        name: '水溅跃',
        description: '对敌人造成少量水属性伤害',
        damageMultiplier: 1.2,
        cooldown: 0,
        effectType: 'damage',
      },
    ],
  },
  {
    id: 'pet_002',
    name: '小火苗',
    quality: 'common',
    element: 'fire',
    baseAttack: 70,
    baseDefense: 50,
    baseHealth: 180,
    assistRate: 12,
    assistDamage: 22,
    skills: [
      {
        id: 'skill_002',
        name: '火花',
        description: '对敌人造成火属性伤害',
        damageMultiplier: 1.3,
        cooldown: 0,
        effectType: 'damage',
      },
    ],
  },
  {
    id: 'pet_003',
    name: '小树苗',
    quality: 'common',
    element: 'earth',
    baseAttack: 55,
    baseDefense: 75,
    baseHealth: 220,
    assistRate: 10,
    assistDamage: 20,
    skills: [
      {
        id: 'skill_003',
        name: '藤鞭',
        description: '对敌人造成木属性伤害',
        damageMultiplier: 1.2,
        cooldown: 0,
        effectType: 'damage',
      },
    ],
  },
  // 稀有宠物 (Rare)
  {
    id: 'pet_010',
    name: '蓝海龟',
    quality: 'rare',
    element: 'water',
    baseAttack: 80,
    baseDefense: 120,
    baseHealth: 350,
    assistRate: 15,
    assistDamage: 30,
    skills: [
      {
        id: 'skill_010',
        name: '水炮',
        description: '对敌人造成中量水属性伤害',
        damageMultiplier: 1.5,
        cooldown: 2,
        effectType: 'damage',
      },
      {
        id: 'skill_011',
        name: '防御姿态',
        description: '提升自身防御 30%',
        damageMultiplier: 0,
        cooldown: 3,
        effectType: 'buff',
      },
    ],
  },
  {
    id: 'pet_011',
    name: '烈焰鸟',
    quality: 'rare',
    element: 'fire',
    baseAttack: 110,
    baseDefense: 70,
    baseHealth: 280,
    assistRate: 18,
    assistDamage: 35,
    skills: [
      {
        id: 'skill_012',
        name: '火焰冲击',
        description: '对敌人造成大量火属性伤害',
        damageMultiplier: 1.6,
        cooldown: 2,
        effectType: 'damage',
      },
    ],
  },
  {
    id: 'pet_012',
    name: '大地熊',
    quality: 'rare',
    element: 'earth',
    baseAttack: 95,
    baseDefense: 110,
    baseHealth: 400,
    assistRate: 14,
    assistDamage: 32,
    skills: [
      {
        id: 'skill_013',
        name: '地震',
        description: '对全体敌人造成土属性伤害',
        damageMultiplier: 1.4,
        cooldown: 3,
        effectType: 'damage',
      },
    ],
  },
  // 史诗宠物 (Epic)
  {
    id: 'pet_020',
    name: '深海龙王',
    quality: 'epic',
    element: 'water',
    baseAttack: 150,
    baseDefense: 180,
    baseHealth: 600,
    assistRate: 25,
    assistDamage: 50,
    skills: [
      {
        id: 'skill_020',
        name: '海啸',
        description: '对全体敌人造成大量水属性伤害',
        damageMultiplier: 2.0,
        cooldown: 4,
        effectType: 'damage',
      },
      {
        id: 'skill_021',
        name: '水之护盾',
        description: '为队友提供护盾',
        damageMultiplier: 0,
        cooldown: 3,
        effectType: 'buff',
      },
    ],
  },
  {
    id: 'pet_021',
    name: '凤凰',
    quality: 'epic',
    element: 'fire',
    baseAttack: 200,
    baseDefense: 120,
    baseHealth: 500,
    assistRate: 30,
    assistDamage: 55,
    skills: [
      {
        id: 'skill_022',
        name: '涅槃',
        description: '死亡时复活并恢复 50% 生命',
        damageMultiplier: 0,
        cooldown: 10,
        effectType: 'heal',
      },
      {
        id: 'skill_023',
        name: '天火',
        description: '对全体敌人造成毁灭性火属性伤害',
        damageMultiplier: 2.5,
        cooldown: 5,
        effectType: 'damage',
      },
    ],
  },
  {
    id: 'pet_022',
    name: '麒麟',
    quality: 'epic',
    element: 'earth',
    baseAttack: 170,
    baseDefense: 160,
    baseHealth: 650,
    assistRate: 28,
    assistDamage: 52,
    skills: [
      {
        id: 'skill_024',
        name: '祥瑞',
        description: '提升全队攻击力 20%',
        damageMultiplier: 0,
        cooldown: 4,
        effectType: 'buff',
      },
      {
        id: 'skill_025',
        name: '大地之怒',
        description: '对全体敌人造成大量土属性伤害',
        damageMultiplier: 2.2,
        cooldown: 4,
        effectType: 'damage',
      },
    ],
  },
  // 传说宠物 (Legendary)
  {
    id: 'pet_030',
    name: '应龙',
    quality: 'legendary',
    element: 'water',
    baseAttack: 250,
    baseDefense: 220,
    baseHealth: 900,
    assistRate: 40,
    assistDamage: 80,
    skills: [
      {
        id: 'skill_030',
        name: '龙腾四海',
        description: '对全体敌人造成毁灭性水属性伤害，并降低敌人防御',
        damageMultiplier: 3.0,
        cooldown: 6,
        effectType: 'damage',
      },
      {
        id: 'skill_031',
        name: '龙威',
        description: '降低全体敌人攻击力 30%',
        damageMultiplier: 0,
        cooldown: 5,
        effectType: 'debuff',
      },
    ],
  },
  {
    id: 'pet_031',
    name: '金乌',
    quality: 'legendary',
    element: 'fire',
    baseAttack: 300,
    baseDefense: 180,
    baseHealth: 750,
    assistRate: 45,
    assistDamage: 90,
    skills: [
      {
        id: 'skill_032',
        name: '十日当空',
        description: '对全体敌人造成毁灭性火属性伤害',
        damageMultiplier: 3.5,
        cooldown: 7,
        effectType: 'damage',
      },
      {
        id: 'skill_033',
        name: '太阳真火',
        description: '持续灼烧敌人 3 回合',
        damageMultiplier: 1.5,
        cooldown: 3,
        effectType: 'damage',
      },
    ],
  },
  {
    id: 'pet_032',
    name: '玄武',
    quality: 'legendary',
    element: 'earth',
    baseAttack: 220,
    baseDefense: 300,
    baseHealth: 1200,
    assistRate: 35,
    assistDamage: 75,
    skills: [
      {
        id: 'skill_034',
        name: '不动如山',
        description: '进入无敌状态 1 回合',
        damageMultiplier: 0,
        cooldown: 8,
        effectType: 'buff',
      },
      {
        id: 'skill_035',
        name: '玄水阵',
        description: '为全队提供护盾并反弹伤害',
        damageMultiplier: 0,
        cooldown: 5,
        effectType: 'buff',
      },
    ],
  },
];

// ==================== 配置 ====================

export const PET_CONFIG: PetConfig = {
  gachaRates: {
    normal: {
      common: 0.60,
      rare: 0.30,
      epic: 0.09,
      legendary: 0.01,
    },
    premium: {
      common: 0.30,
      rare: 0.45,
      epic: 0.20,
      legendary: 0.05,
    },
  },
  levelUpExpCurve: (level: number) => {
    // 指数增长曲线
    return Math.floor(100 * Math.pow(1.5, level - 1));
  },
  starUpCost: (stars: number) => {
    // 升星需要的宠物碎片数量
    const costs: { [key: number]: number } = {
      1: 10,
      2: 30,
      3: 60,
      4: 100,
      5: 0, // max
    };
    return costs[stars] || 0;
  },
};

// ==================== 工具函数 ====================

/**
 * 创建新宠物实例
 */
export function createPet(petId: string): Pet | null {
  const basePet = PET_DATABASE.find((p) => p.id === petId);
  if (!basePet) return null;

  return {
    ...basePet,
    level: 1,
    exp: 0,
    maxExp: PET_CONFIG.levelUpExpCurve(1),
    stars: 1,
    currentAttack: basePet.baseAttack,
    currentDefense: basePet.baseDefense,
    currentHealth: basePet.baseHealth,
    obtainedAt: Date.now(),
    isLocked: false,
  };
}

/**
 * 计算属性（根据等级和星级）
 */
export function calculatePetStats(pet: Pet): Pet {
  const levelMultiplier = 1 + (pet.level - 1) * 0.1; // 每级 +10%
  const starMultiplier = 1 + (pet.stars - 1) * 0.2; // 每星 +20%

  return {
    ...pet,
    currentAttack: Math.floor(pet.baseAttack * levelMultiplier * starMultiplier),
    currentDefense: Math.floor(pet.baseDefense * levelMultiplier * starMultiplier),
    currentHealth: Math.floor(pet.baseHealth * levelMultiplier * starMultiplier),
  };
}

/**
 * 宠物升级
 */
export function levelUpPet(pet: Pet, expAmount: number): Pet {
  let newPet = { ...pet, exp: pet.exp + expAmount };

  while (newPet.exp >= newPet.maxExp && newPet.level < 100) {
    newPet.exp -= newPet.maxExp;
    newPet.level += 1;
    newPet.maxExp = PET_CONFIG.levelUpExpCurve(newPet.level);
  }

  return calculatePetStats(newPet);
}

/**
 * 宠物升星
 */
export function starUpPet(pet: Pet, fragments: number): Pet | null {
  if (pet.stars >= 5) return null; // 已满星

  const requiredFragments = PET_CONFIG.starUpCost(pet.stars);
  if (fragments < requiredFragments) return null;

  const newPet = {
    ...pet,
    stars: pet.stars + 1,
  };

  return calculatePetStats(newPet);
}

/**
 * 抽卡（单抽）
 */
export function pullGacha(gachaType: 'normal' | 'premium' = 'normal'): PetGachaResult {
  const rates = PET_CONFIG.gachaRates[gachaType];
  const rand = Math.random();

  let quality: PetQuality;
  if (rand < rates.legendary) {
    quality = 'legendary';
  } else if (rand < rates.legendary + rates.epic) {
    quality = 'epic';
  } else if (rand < rates.legendary + rates.epic + rates.rare) {
    quality = 'rare';
  } else {
    quality = 'common';
  }

  // 从对应品质中随机选择
  const availablePets = PET_DATABASE.filter((p) => p.quality === quality);
  const selectedPet = availablePets[Math.floor(Math.random() * availablePets.length)];

  return {
    pet: createPet(selectedPet.id)!,
    isNew: true, // 实际应该检查用户是否已有
    gachaType,
  };
}

/**
 * 十连抽
 */
export function pullGacha10(gachaType: 'normal' | 'premium' = 'normal'): PetGachaResult[] {
  const results: PetGachaResult[] = [];
  for (let i = 0; i < 10; i++) {
    results.push(pullGacha(gachaType));
  }
  return results;
}

/**
 * 元素克制关系
 */
export function getElementMultiplier(attackElement: PetElement, defenseElement: PetElement): number {
  const relations: { [key in PetElement]?: { [key in PetElement]?: number } } = {
    // 经典三角克制：火 > 土 > 水 > 火
    fire: { water: 0.8, earth: 1.2 },
    water: { fire: 1.2, earth: 0.8 },
    earth: { fire: 0.8, water: 1.2 },
    // 风无克制关系
    wind: {},
    // 光暗互克
    light: { dark: 1.5 },
    dark: { light: 1.5 },
  };

  return relations[attackElement]?.[defenseElement] || 1.0;
}

/**
 * 宠物协助攻击
 */
export function petAssistAttack(pet: Pet, enemyElement?: PetElement): { damage: number; triggered: boolean } {
  const triggerChance = pet.assistRate / 100;
  const triggered = Math.random() < triggerChance;

  if (!triggered) {
    return { damage: 0, triggered: false };
  }

  let damage = pet.currentAttack * (pet.assistDamage / 100);

  // 元素克制
  if (enemyElement) {
    damage *= getElementMultiplier(pet.element, enemyElement);
  }

  return { damage: Math.floor(damage), triggered: true };
}

/**
 * 获取宠物技能（根据冷却）
 */
export function getAvailablePetSkills(pet: Pet, cooldowns: { [skillId: string]: number }): PetSkill[] {
  return pet.skills.filter((skill) => (cooldowns[skill.id] || 0) <= 0);
}

/**
 * 使用宠物技能
 */
export function usePetSkill(
  pet: Pet,
  skill: PetSkill,
  cooldowns: { [skillId: string]: number }
): { damage: number; effect: string; newCooldowns: { [skillId: string]: number } } {
  const newCooldowns = { ...cooldowns };

  // 设置冷却
  newCooldowns[skill.id] = skill.cooldown;

  // 减少其他技能冷却
  Object.keys(newCooldowns).forEach((id) => {
    if (id !== skill.id && newCooldowns[id] > 0) {
      newCooldowns[id] -= 1;
    }
  });

  return {
    damage: skill.damageMultiplier > 0 ? Math.floor(pet.currentAttack * skill.damageMultiplier) : 0,
    effect: skill.description,
    newCooldowns,
  };
}

/**
 * 减少技能冷却
 */
export function reduceSkillCooldowns(cooldowns: { [skillId: string]: number }): { [skillId: string]: number } {
  const newCooldowns = { ...cooldowns };
  Object.keys(newCooldowns).forEach((id) => {
    if (newCooldowns[id] > 0) {
      newCooldowns[id] -= 1;
    }
  });
  return newCooldowns;
}

// ==================== 导出宠物数据库（用于 UI 展示） ====================

export function getAllPets(): typeof PET_DATABASE {
  return PET_DATABASE;
}

export function getPetById(id: string): typeof PET_DATABASE[0] | undefined {
  return PET_DATABASE.find((p) => p.id === id);
}

export function getPetsByQuality(quality: PetQuality): typeof PET_DATABASE {
  return PET_DATABASE.filter((p) => p.quality === quality);
}

export function getPetsByElement(element: PetElement): typeof PET_DATABASE {
  return PET_DATABASE.filter((p) => p.element === element);
}
