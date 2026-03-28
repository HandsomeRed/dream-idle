// v0.95 宠物内丹系统核心逻辑
import {
  InnerDan,
  PetInnerDanSlot,
  PetWithInnerDans,
  InnerDanCombination,
  StatType,
} from '../types/innerDan';
import {
  LOW_INNER_DANS,
  HIGH_INNER_DANS,
  INNER_DAN_CONFIG,
  INNER_DAN_COMBINATIONS,
  getInnerDanExpForLevel,
  getInnerDanEffectValue,
} from '../data/innerDans';

/**
 * 获取低级内丹
 */
export function getLowInnerDan(danId: string): InnerDan | undefined {
  return LOW_INNER_DANS.find(d => d.id === danId);
}

/**
 * 获取高级内丹
 */
export function getHighInnerDan(danId: string): InnerDan | undefined {
  return HIGH_INNER_DANS.find(d => d.id === danId);
}

/**
 * 获取任意内丹
 */
export function getInnerDan(danId: string, type?: 'low' | 'high'): InnerDan | undefined {
  if (type === 'low') return getLowInnerDan(danId);
  if (type === 'high') return getHighInnerDan(danId);
  return getLowInnerDan(danId) || getHighInnerDan(danId);
}

/**
 * 获取所有低级内丹
 */
export function getAllLowInnerDans(): InnerDan[] {
  return LOW_INNER_DANS;
}

/**
 * 获取所有高级内丹
 */
export function getAllHighInnerDans(): InnerDan[] {
  return HIGH_INNER_DANS;
}

/**
 * 创建空的内丹槽位
 */
export function createEmptySlot(): PetInnerDanSlot {
  return {
    danId: null,
    level: 0,
    exp: 0,
  };
}

/**
 * 创建宠物内丹配置
 */
export function createPetInnerDanConfig(): PetWithInnerDans {
  return {
    petId: '',
    lowSlots: Array(INNER_DAN_CONFIG.lowSlots).fill(null).map(() => createEmptySlot()),
    highSlot: null,
  };
}

/**
 * 装备低级内丹
 */
export function equipLowInnerDan(
  pet: PetWithInnerDans,
  slotIndex: number,
  danId: string
): { success: boolean; error?: string } {
  if (slotIndex < 0 || slotIndex >= INNER_DAN_CONFIG.lowSlots) {
    return { success: false, error: '无效的低级内丹槽位' };
  }
  
  const dan = getLowInnerDan(danId);
  if (!dan) {
    return { success: false, error: '内丹不存在' };
  }
  
  pet.lowSlots[slotIndex] = {
    danId,
    level: dan.level,
    exp: dan.exp,
  };
  
  return { success: true };
}

/**
 * 装备高级内丹
 */
export function equipHighInnerDan(
  pet: PetWithInnerDans,
  danId: string
): { success: boolean; error?: string } {
  const dan = getHighInnerDan(danId);
  if (!dan) {
    return { success: false, error: '内丹不存在' };
  }
  
  pet.highSlot = {
    danId,
    level: dan.level,
    exp: dan.exp,
  };
  
  return { success: true };
}

/**
 * 卸下内丹
 */
export function unequipInnerDan(
  pet: PetWithInnerDans,
  slotIndex: number,
  isHigh: boolean = false
): { success: boolean; danId?: string | null } {
  if (isHigh) {
    const danId = pet.highSlot?.danId || null;
    pet.highSlot = null;
    return { success: true, danId };
  }
  
  if (slotIndex < 0 || slotIndex >= INNER_DAN_CONFIG.lowSlots) {
    return { success: false, danId: null };
  }
  
  const danId = pet.lowSlots[slotIndex].danId;
  pet.lowSlots[slotIndex] = createEmptySlot();
  return { success: true, danId };
}

/**
 * 内丹添加经验
 */
export function addInnerDanExp(
  slot: PetInnerDanSlot,
  exp: number
): { leveledUp: boolean; newLevel: number } {
  if (!slot.danId) {
    return { leveledUp: false, newLevel: 0 };
  }
  
  const dan = getInnerDan(slot.danId);
  if (!dan) {
    return { leveledUp: false, newLevel: slot.level };
  }
  
  let newExp = slot.exp + exp;
  let newLevel = slot.level;
  let leveledUp = false;
  
  const maxLevel = dan.type === 'high' 
    ? INNER_DAN_CONFIG.maxHighLevel 
    : INNER_DAN_CONFIG.maxLowLevel;
  
  while (newLevel < maxLevel) {
    const expNeeded = getInnerDanExpForLevel(newLevel + 1, dan.type === 'high');
    if (newExp >= expNeeded) {
      newExp -= expNeeded;
      newLevel++;
      leveledUp = true;
    } else {
      break;
    }
  }
  
  slot.exp = newExp;
  slot.level = newLevel;
  
  return { leveledUp, newLevel };
}

/**
 * 计算宠物属性加成
 */
export function calculatePetBonuses(pet: PetWithInnerDans): Record<StatType, number> {
  const bonuses: Record<StatType, number> = {
    hp: 0,
    mp: 0,
    magic: 0,
    defense: 0,
    speed: 0,
    damage: 0,
    hit: 0,
  };
  
  // 计算低级内丹加成
  for (const slot of pet.lowSlots) {
    if (slot.danId) {
      const dan = getLowInnerDan(slot.danId);
      if (dan && dan.effect.stat) {
        const value = getInnerDanEffectValue({ ...dan, level: slot.level });
        bonuses[dan.effect.stat] += value;
      }
    }
  }
  
  // 计算高级内丹加成 (高级内丹主要是触发效果，属性加成较少)
  if (pet.highSlot?.danId) {
    const dan = getHighInnerDan(pet.highSlot.danId);
    if (dan && dan.effect.stat) {
      const value = getInnerDanEffectValue({ ...dan, level: pet.highSlot.level });
      bonuses[dan.effect.stat] += value;
    }
  }
  
  return bonuses;
}

/**
 * 检查内丹组合效果
 */
export function checkInnerDanCombinations(pet: PetWithInnerDans): InnerDanCombination[] {
  const activeCombinations: InnerDanCombination[] = [];
  
  // 收集所有已装备的内丹 ID
  const equippedDanIds = new Set<string>();
  for (const slot of pet.lowSlots) {
    if (slot.danId) equippedDanIds.add(slot.danId);
  }
  if (pet.highSlot?.danId) {
    equippedDanIds.add(pet.highSlot.danId);
  }
  
  // 检查组合
  for (const combo of INNER_DAN_COMBINATIONS) {
    const hasAllDans = combo.danIds.every(id => equippedDanIds.has(id));
    if (hasAllDans) {
      activeCombinations.push(combo);
    }
  }
  
  return activeCombinations;
}

/**
 * 获取内丹总加成 (包括组合效果)
 */
export function getTotalBonuses(pet: PetWithInnerDans): Record<StatType, number> {
  const bonuses = calculatePetBonuses(pet);
  const combinations = checkInnerDanCombinations(pet);
  
  // 添加组合加成
  for (const combo of combinations) {
    bonuses[combo.bonus.stat] += combo.bonus.value;
  }
  
  return bonuses;
}

/**
 * 检查高级内丹触发
 */
export function checkHighDanTrigger(
  pet: PetWithInnerDans,
  triggerType: string
): { triggered: boolean; danId?: string; effect?: any } {
  if (!pet.highSlot?.danId) {
    return { triggered: false };
  }
  
  const dan = getHighInnerDan(pet.highSlot.danId);
  if (!dan || !dan.effect.trigger) {
    return { triggered: false };
  }
  
  // 检查触发条件
  if (dan.effect.trigger !== triggerType) {
    return { triggered: false };
  }
  
  // 概率判定
  const chance = dan.effect.triggerChance || 0;
  const triggered = Math.random() < chance;
  
  if (triggered) {
    return {
      triggered: true,
      danId: dan.id,
      effect: dan.effect.special,
    };
  }
  
  return { triggered: false };
}

/**
 * 验证内丹槽位是否有效
 */
export function validatePetInnerDans(pet: PetWithInnerDans): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 检查低级内丹槽位
  for (let i = 0; i < pet.lowSlots.length; i++) {
    const slot = pet.lowSlots[i];
    if (slot.danId) {
      const dan = getLowInnerDan(slot.danId);
      if (!dan) {
        errors.push(`槽位${i + 1}: 无效的内丹 ID`);
      }
    }
  }
  
  // 检查高级内丹槽位
  if (pet.highSlot?.danId) {
    const dan = getHighInnerDan(pet.highSlot.danId);
    if (!dan) {
      errors.push('高级槽位：无效的内丹 ID');
    }
  }
  
  // 检查是否装备超过 1 个高级内丹
  if (pet.highSlot && pet.highSlot.danId) {
    // 高级内丹只能有 1 个，这个由数据结构保证
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 获取内丹升级所需经验
 */
export function getExpToNextLevel(danId: string, currentLevel: number): number {
  const dan = getInnerDan(danId);
  if (!dan) return 0;
  
  const isHigh = dan.type === 'high';
  return getInnerDanExpForLevel(currentLevel + 1, isHigh);
}

/**
 * 内丹是否可以升级
 */
export function canLevelUp(danId: string, currentLevel: number): boolean {
  const dan = getInnerDan(danId);
  if (!dan) return false;
  
  const maxLevel = dan.type === 'high' 
    ? INNER_DAN_CONFIG.maxHighLevel 
    : INNER_DAN_CONFIG.maxLowLevel;
  
  return currentLevel < maxLevel;
}
