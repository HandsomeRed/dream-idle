/**
 * v0.36 宠物进化系统
 * 
 * 功能：
 * - 宠物进化（品质提升）
 * - 进化材料消耗
 * - 进化成功率
 * - 进化后属性成长
 * - 进化外观变化
 */

import { Pet, PetQuality } from './pets';

export interface PetEvolutionInfo {
  petId: string;
  currentQuality: PetQuality;
  nextQuality: PetQuality;
  requiredLevel: number;
  requiredMaterials: EvolutionMaterial[];
  successRate: number; // 成功率百分比
  statGrowth: number; // 属性成长加成
}

export interface EvolutionMaterial {
  id: string;
  name: string;
  quantity: number;
  type: 'essence' | 'stone' | 'fragment' | 'other';
}

export interface PetEvolutionState {
  evolutionCount: number; // 总进化次数
  successCount: number; // 成功次数
  failedCount: number; // 失败次数
  maxEvolutionStage: number; // 最高进化阶段
}

/**
 * 宠物品质等级
 */
export const PET_QUALITY_ORDER: PetQuality[] = [
  'common',      // 普通
  'rare',        // 稀有
  'epic',        // 史诗
  'legendary'    // 传说
];

/**
 * 获取品质索引
 */
export function getQualityIndex(quality: PetQuality): number {
  return PET_QUALITY_ORDER.indexOf(quality);
}

/**
 * 获取下一个品质
 */
export function getNextQuality(quality: PetQuality): PetQuality | null {
  const index = getQualityIndex(quality);
  if (index >= PET_QUALITY_ORDER.length - 1) {
    return null; // 已经是最高品质
  }
  return PET_QUALITY_ORDER[index + 1];
}

/**
 * 获取进化配置
 */
export function getEvolutionInfo(pet: Pet): PetEvolutionInfo | null {
  const nextQuality = getNextQuality(pet.quality);
  if (!nextQuality) {
    return null; // 无法进化
  }

  const currentIndex = getQualityIndex(pet.quality);
  const nextIndex = getQualityIndex(nextQuality);

  // 进化配置
  const evolutionConfig = [
    {
      from: 'common' as PetQuality,
      to: 'rare' as PetQuality,
      requiredLevel: 20,
      materials: [
        { id: 'essence-common', name: '普通精华', quantity: 10, type: 'essence' as const },
        { id: 'stone-evolution', name: '进化石', quantity: 5, type: 'stone' as const }
      ],
      successRate: 100,
      statGrowth: 1.2
    },
    {
      from: 'rare' as PetQuality,
      to: 'epic' as PetQuality,
      requiredLevel: 40,
      materials: [
        { id: 'essence-rare', name: '稀有精华', quantity: 15, type: 'essence' as const },
        { id: 'stone-evolution', name: '进化石', quantity: 10, type: 'stone' as const },
        { id: 'fragment-epic', name: '史诗碎片', quantity: 5, type: 'fragment' as const }
      ],
      successRate: 80,
      statGrowth: 1.3
    },
    {
      from: 'epic' as PetQuality,
      to: 'legendary' as PetQuality,
      requiredLevel: 60,
      materials: [
        { id: 'essence-epic', name: '史诗精华', quantity: 20, type: 'essence' as const },
        { id: 'stone-evolution', name: '进化石', quantity: 20, type: 'stone' as const },
        { id: 'fragment-legendary', name: '传说碎片', quantity: 10, type: 'fragment' as const }
      ],
      successRate: 60,
      statGrowth: 1.5
    }
  ];

  const config = evolutionConfig.find(c => c.from === pet.quality);
  if (!config) {
    return null;
  }

  return {
    petId: pet.id,
    currentQuality: pet.quality,
    nextQuality,
    requiredLevel: config.requiredLevel,
    requiredMaterials: config.materials,
    successRate: config.successRate,
    statGrowth: config.statGrowth
  };
}

/**
 * 检查是否可以进化
 */
export function canEvolve(pet: Pet, materials: Record<string, number>): {
  canEvolve: boolean;
  reason?: string;
  evolutionInfo?: PetEvolutionInfo;
} {
  const evolutionInfo = getEvolutionInfo(pet);
  
  if (!evolutionInfo) {
    return {
      canEvolve: false,
      reason: '该宠物已达到最高品质，无法进化'
    };
  }

  // 检查等级
  if (pet.level < evolutionInfo.requiredLevel) {
    return {
      canEvolve: false,
      reason: `宠物等级不足，需要 ${evolutionInfo.requiredLevel} 级（当前 ${pet.level} 级）`,
      evolutionInfo
    };
  }

  // 检查材料
  for (const material of evolutionInfo.requiredMaterials) {
    const owned = materials[material.id] || 0;
    if (owned < material.quantity) {
      return {
        canEvolve: false,
        reason: `材料不足：${material.name} 需要 ${material.quantity} 个（拥有 ${owned} 个）`,
        evolutionInfo
      };
    }
  }

  return {
    canEvolve: true,
    evolutionInfo
  };
}

/**
 * 执行进化
 */
export function evolvePet(
  pet: Pet,
  materials: Record<string, number>
): {
  success: boolean;
  evolvedPet?: Pet;
  consumedMaterials?: Record<string, number>;
  reason?: string;
} {
  const check = canEvolve(pet, materials);
  
  if (!check.canEvolve || !check.evolutionInfo) {
    return {
      success: false,
      reason: check.reason
    };
  }

  const evolutionInfo = check.evolutionInfo;

  // 消耗材料
  const consumedMaterials: Record<string, number> = {};
  for (const material of evolutionInfo.requiredMaterials) {
    consumedMaterials[material.id] = material.quantity;
  }

  // 判定是否成功
  const isSuccessful = Math.random() * 100 < evolutionInfo.successRate;

  if (!isSuccessful) {
    // 进化失败，返还 50% 材料
    const refundedMaterials: Record<string, number> = {};
    for (const material of evolutionInfo.requiredMaterials) {
      refundedMaterials[material.id] = Math.floor(material.quantity * 0.5);
    }

    return {
      success: false,
      reason: `进化失败！返还 50% 材料`,
      consumedMaterials: refundedMaterials
    };
  }

  // 进化成功
  const evolvedPet: Pet = {
    ...pet,
    quality: evolutionInfo.nextQuality,
    // 属性成长
    baseAttack: Math.floor(pet.baseAttack * evolutionInfo.statGrowth),
    baseDefense: Math.floor(pet.baseDefense * evolutionInfo.statGrowth),
    baseHealth: Math.floor(pet.baseHealth * evolutionInfo.statGrowth),
    // 重置等级（可选设计，这里选择不重置）
    // level: 1,
    exp: 0,
    currentAttack: Math.floor(pet.currentAttack * evolutionInfo.statGrowth),
    currentDefense: Math.floor(pet.currentDefense * evolutionInfo.statGrowth),
    currentHealth: Math.floor(pet.currentHealth * evolutionInfo.statGrowth)
  };

  return {
    success: true,
    evolvedPet,
    consumedMaterials
  };
}

/**
 * 计算进化后属性
 */
export function calculateEvolvedStats(
  baseStats: { attack: number; defense: number; hp: number },
  growthMultiplier: number,
  level: number
): { attack: number; defense: number; hp: number } {
  return {
    attack: Math.floor(baseStats.attack * growthMultiplier * (1 + level * 0.01)),
    defense: Math.floor(baseStats.defense * growthMultiplier * (1 + level * 0.01)),
    hp: Math.floor(baseStats.hp * growthMultiplier * (1 + level * 0.01))
  };
}

/**
 * 获取进化成功率文本
 */
export function getSuccessRateText(successRate: number): string {
  if (successRate >= 90) return `极高 (${successRate}%)`;
  if (successRate >= 70) return `高 (${successRate}%)`;
  if (successRate >= 50) return `中等 (${successRate}%)`;
  if (successRate >= 30) return `低 (${successRate}%)`;
  return `极低 (${successRate}%)`;
}

/**
 * 获取品质名称
 */
export function getQualityName(quality: PetQuality): string {
  const names: Record<PetQuality, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  };
  return names[quality] || '未知';
}

/**
 * 获取品质颜色
 */
export function getQualityColor(quality: PetQuality): string {
  const colors: Record<PetQuality, string> = {
    common: 'text-gray-500',
    rare: 'text-green-500',
    epic: 'text-purple-500',
    legendary: 'text-orange-500'
  };
  return colors[quality] || 'text-gray-500';
}

/**
 * 获取品质背景色
 */
export function getQualityBgColor(quality: PetQuality): string {
  const colors: Record<PetQuality, string> = {
    common: 'bg-gray-100',
    rare: 'bg-green-100',
    epic: 'bg-purple-100',
    legendary: 'bg-orange-100'
  };
  return colors[quality] || 'bg-gray-100';
}

/**
 * 初始化宠物进化状态
 */
export function initializePetEvolutionState(): PetEvolutionState {
  return {
    evolutionCount: 0,
    successCount: 0,
    failedCount: 0,
    maxEvolutionStage: 0
  };
}

/**
 * 更新进化状态
 */
export function updateEvolutionState(
  state: PetEvolutionState,
  success: boolean,
  newStage: number
): PetEvolutionState {
  return {
    evolutionCount: state.evolutionCount + 1,
    successCount: state.successCount + (success ? 1 : 0),
    failedCount: state.failedCount + (success ? 0 : 1),
    maxEvolutionStage: Math.max(state.maxEvolutionStage, newStage)
  };
}

/**
 * 获取进化成功率统计
 */
export function getEvolutionSuccessRate(state: PetEvolutionState): number {
  if (state.evolutionCount === 0) return 0;
  return Math.round((state.successCount / state.evolutionCount) * 100);
}

/**
 * 保存进化状态到 localStorage
 */
export function savePetEvolutionState(state: PetEvolutionState): void {
  localStorage.setItem('dream-idle-pet-evolution', JSON.stringify(state));
}

/**
 * 从 localStorage 加载进化状态
 */
export function loadPetEvolutionState(): PetEvolutionState {
  const saved = localStorage.getItem('dream-idle-pet-evolution');
  if (saved) {
    return JSON.parse(saved);
  }
  return initializePetEvolutionState();
}
