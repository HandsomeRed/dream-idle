// v0.44 阵容系统扩展 - 英雄 + 宠物混合编队

import { HERO_CONFIGS, type HeroConfig, type HeroRarity, type HeroClass, type HeroElement } from './heroes';
import { PET_CONFIG, type PetConfig, type PetQuality, type PetElement } from './pets';

/**
 * 阵容单位类型
 */
export type UnitType = 'character' | 'hero' | 'pet';

/**
 * 阵容槽位
 */
export type FormationSlot = 
  | 'character'      // 主角
  | 'hero1' | 'hero2' | 'hero3' | 'hero4' | 'hero5'  // 5 个英雄位
  | 'pet1' | 'pet2' | 'pet3';  // 3 个宠物位

/**
 * 阵容单位
 */
export interface FormationUnit {
  type: UnitType;
  id: string;
  slot: FormationSlot;
  level: number;
  star: number;
}

/**
 * 阵容
 */
export interface Formation {
  id: string;
  name: string;
  units: FormationUnit[];
  characterId?: string;
  heroIds: string[];
  petIds: string[];
  createdAt: number;
  updatedAt: number;
  isLocked: boolean;
}

/**
 * 阵容羁绊加成
 */
export interface FormationBonus {
  id: string;
  name: string;
  description: string;
  requirement: (formation: Formation) => boolean;
  effect: {
    type: 'attack' | 'defense' | 'health' | 'speed' | 'mag' | 'res' | 'exp' | 'gold';
    value: number; // 百分比加成 (0.1 = 10%)
  };
}

/**
 * 阵容战力
 */
export interface FormationPower {
  total: number;
  breakdown: {
    character: number;
    heroes: number;
    pets: number;
    bonuses: number;
  };
  bonuses: FormationBonus[];
}

/**
 * 阵容配置
 */
export interface FormationConfig {
  maxFormations: number;
  maxHeroes: number;
  maxPets: number;
  bonuses: FormationBonus[];
}

// ==================== 阵容羁绊配置 ====================

export const FORMATION_CONFIG_V2: FormationConfig = {
  maxFormations: 5,  // v0.44: 增加到 5 套阵容
  maxHeroes: 5,
  maxPets: 3,
  bonuses: [
    // ===== 元素共鸣 =====
    {
      id: 'bonus_fire_3',
      name: '火焰共鸣 (3)',
      description: '队伍中有 3 个火系单位，攻击力 +15%',
      requirement: (f) => countElementsByType(f, 'fire') >= 3,
      effect: { type: 'attack', value: 0.15 },
    },
    {
      id: 'bonus_fire_5',
      name: '火焰共鸣 (5)',
      description: '队伍中有 5 个火系单位，攻击力 +30%',
      requirement: (f) => countElementsByType(f, 'fire') >= 5,
      effect: { type: 'attack', value: 0.30 },
    },
    {
      id: 'bonus_water_3',
      name: '流水共鸣 (3)',
      description: '队伍中有 3 个水系单位，生命值 +15%',
      requirement: (f) => countElementsByType(f, 'water') >= 3,
      effect: { type: 'health', value: 0.15 },
    },
    {
      id: 'bonus_water_5',
      name: '流水共鸣 (5)',
      description: '队伍中有 5 个水系单位，生命值 +30%',
      requirement: (f) => countElementsByType(f, 'water') >= 5,
      effect: { type: 'health', value: 0.30 },
    },
    {
      id: 'bonus_earth_3',
      name: '大地共鸣 (3)',
      description: '队伍中有 3 个土系单位，防御力 +15%',
      requirement: (f) => countElementsByType(f, 'earth') >= 3,
      effect: { type: 'defense', value: 0.15 },
    },
    {
      id: 'bonus_wind_3',
      name: '疾风共鸣 (3)',
      description: '队伍中有 3 个风系单位，速度 +15%',
      requirement: (f) => countElementsByType(f, 'wind') >= 3,
      effect: { type: 'speed', value: 0.15 },
    },
    {
      id: 'bonus_light_3',
      name: '圣光共鸣 (3)',
      description: '队伍中有 3 个光系单位，法伤 +15%',
      requirement: (f) => countElementsByType(f, 'light') >= 3,
      effect: { type: 'mag', value: 0.15 },
    },
    {
      id: 'bonus_dark_3',
      name: '暗影共鸣 (3)',
      description: '队伍中有 3 个暗系单位，法防 +15%',
      requirement: (f) => countElementsByType(f, 'dark') >= 3,
      effect: { type: 'res', value: 0.15 },
    },

    // ===== 职业搭配 =====
    {
      id: 'bonus_warrior_2',
      name: '战士同盟 (2)',
      description: '队伍中有 2 个战士，攻击力 +8%',
      requirement: (f) => countClassByType(f, 'warrior') >= 2,
      effect: { type: 'attack', value: 0.08 },
    },
    {
      id: 'bonus_mage_2',
      name: '法师同盟 (2)',
      description: '队伍中有 2 个法师，法伤 +10%',
      requirement: (f) => countClassByType(f, 'mage') >= 2,
      effect: { type: 'mag', value: 0.10 },
    },
    {
      id: 'bonus_tank_2',
      name: '坦克同盟 (2)',
      description: '队伍中有 2 个坦克，防御力 +12%',
      requirement: (f) => countClassByType(f, 'tank') >= 2,
      effect: { type: 'defense', value: 0.12 },
    },
    {
      id: 'bonus_assassin_2',
      name: '刺客同盟 (2)',
      description: '队伍中有 2 个刺客，速度 +10%',
      requirement: (f) => countClassByType(f, 'assassin') >= 2,
      effect: { type: 'speed', value: 0.10 },
    },
    {
      id: 'bonus_support_2',
      name: '辅助同盟 (2)',
      description: '队伍中有 2 个辅助，经验获取 +10%',
      requirement: (f) => countClassByType(f, 'support') >= 2,
      effect: { type: 'exp', value: 0.10 },
    },

    // ===== 品质羁绊 =====
    {
      id: 'bonus_legendary_1',
      name: '神话降临',
      description: '队伍中有 1 个神话英雄，全属性 +5%',
      requirement: (f) => countRarityByType(f, 'legendary') >= 1,
      effect: { type: 'attack', value: 0.05 },
    },
    {
      id: 'bonus_legendary_2',
      name: '双神降世',
      description: '队伍中有 2 个神话英雄，全属性 +15%',
      requirement: (f) => countRarityByType(f, 'legendary') >= 2,
      effect: { type: 'attack', value: 0.15 },
    },

    // ===== 特殊羁绊 =====
    {
      id: 'bonus_four_guardians',
      name: '四象守护',
      description: '同时拥有青龙、白虎、朱雀、玄武，全属性 +20%',
      requirement: (f) => {
        const heroes = f.heroIds;
        return heroes.includes('hero_030') && heroes.includes('hero_031') && 
               heroes.includes('hero_032') && heroes.includes('hero_033');
      },
      effect: { type: 'attack', value: 0.20 },
    },
    {
      id: 'bonus_creator',
      name: '创世之力',
      description: '同时拥有女娲和伏羲，全属性 +25%',
      requirement: (f) => {
        const heroes = f.heroIds;
        return heroes.includes('hero_034');
      },
      effect: { type: 'health', value: 0.25 },
    },
  ],
};

// ==================== 辅助函数 ====================

/**
 * 获取单位的元素类型
 */
function getElement(type: UnitType, id: string): HeroElement | PetElement | null {
  if (type === 'hero') {
    const config = HERO_CONFIGS[id];
    return config ? config.element : null;
  } else if (type === 'pet') {
    const config = PET_CONFIG[id as any];
    return config ? config.element : null;
  }
  return null;
}

/**
 * 获取单位的职业类型
 */
function getClass(type: UnitType, id: string): HeroClass | null {
  if (type === 'hero') {
    const config = HERO_CONFIGS[id];
    return config ? config.classType : null;
  }
  return null;
}

/**
 * 获取单位的稀有度
 */
function getRarity(type: UnitType, id: string): HeroRarity | PetQuality | null {
  if (type === 'hero') {
    const config = HERO_CONFIGS[id];
    return config ? config.rarity : null;
  } else if (type === 'pet') {
    const config = PET_CONFIG[id as any];
    return config ? config.rarity : null;
  }
  return null;
}

/**
 * 统计元素数量
 */
function countElementsByType(formation: Formation, element: string): number {
  let count = 0;
  
  for (const unit of formation.units) {
    if (unit.type === 'character') continue;
    
    const unitElement = getElement(unit.type, unit.id);
    if (unitElement === element) {
      count++;
    }
  }
  
  return count;
}

/**
 * 统计职业数量
 */
function countClassByType(formation: Formation, className: string): number {
  let count = 0;
  
  for (const unit of formation.units) {
    if (unit.type !== 'hero') continue;
    
    const unitClass = getClass(unit.type, unit.id);
    if (unitClass === className) {
      count++;
    }
  }
  
  return count;
}

/**
 * 统计稀有度数量
 */
function countRarityByType(formation: Formation, rarity: string): number {
  let count = 0;
  
  for (const unit of formation.units) {
    if (unit.type !== 'hero') continue;
    
    const unitRarity = getRarity(unit.type, unit.id);
    if (unitRarity === rarity) {
      count++;
    }
  }
  
  return count;
}

// ==================== 阵容管理类 ====================

export class FormationSystemV2 {
  private formations: Map<string, Formation>;
  private currentFormationId: string | null;
  private formationCounter: number;

  constructor() {
    this.formations = new Map();
    this.currentFormationId = null;
    this.formationCounter = 0;
  }

  /**
   * 创建新阵容
   */
  createFormation(name: string, characterId?: string): Formation {
    this.formationCounter++;
    const id = `formation_${Date.now()}_${this.formationCounter}`;
    const formation: Formation = {
      id,
      name,
      units: [],
      characterId,
      heroIds: [],
      petIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
    };

    // 添加主角
    if (characterId) {
      formation.units.push({
        type: 'character',
        id: characterId,
        slot: 'character',
        level: 1,
        star: 1,
      });
    }

    this.formations.set(id, formation);
    return formation;
  }

  /**
   * 添加英雄到阵容
   */
  addHero(formationId: string, heroId: string, level: number = 1, star: number = 1): { success: boolean; message: string } {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return { success: false, message: '阵容不存在' };
    }

    if (formation.heroIds.length >= FORMATION_CONFIG_V2.maxHeroes) {
      return { success: false, message: '英雄数量已达上限' };
    }

    if (formation.heroIds.includes(heroId)) {
      return { success: false, message: '英雄已在阵容中' };
    }

    const slotIndex = formation.heroIds.length;
    const slot: FormationSlot = `hero${slotIndex + 1}` as any;

    formation.heroIds.push(heroId);
    formation.units.push({
      type: 'hero',
      id: heroId,
      slot,
      level,
      star,
    });
    formation.updatedAt = Date.now();

    return { success: true, message: '英雄添加成功' };
  }

  /**
   * 添加宠物到阵容
   */
  addPet(formationId: string, petId: string, level: number = 1, star: number = 1): { success: boolean; message: string } {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return { success: false, message: '阵容不存在' };
    }

    if (formation.petIds.length >= FORMATION_CONFIG_V2.maxPets) {
      return { success: false, message: '宠物数量已达上限' };
    }

    if (formation.petIds.includes(petId)) {
      return { success: false, message: '宠物已在阵容中' };
    }

    const slotIndex = formation.petIds.length;
    const slot: FormationSlot = `pet${slotIndex + 1}` as any;

    formation.petIds.push(petId);
    formation.units.push({
      type: 'pet',
      id: petId,
      slot,
      level,
      star,
    });
    formation.updatedAt = Date.now();

    return { success: true, message: '宠物添加成功' };
  }

  /**
   * 移除英雄
   */
  removeHero(formationId: string, heroId: string): { success: boolean; message: string } {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return { success: false, message: '阵容不存在' };
    }

    const index = formation.heroIds.indexOf(heroId);
    if (index === -1) {
      return { success: false, message: '英雄不在阵容中' };
    }

    formation.heroIds.splice(index, 1);
    formation.units = formation.units.filter(u => u.id !== heroId);
    
    // 重新排列槽位
    this.reorderSlots(formation);
    formation.updatedAt = Date.now();

    return { success: true, message: '英雄移除成功' };
  }

  /**
   * 移除宠物
   */
  removePet(formationId: string, petId: string): { success: boolean; message: string } {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return { success: false, message: '阵容不存在' };
    }

    const index = formation.petIds.indexOf(petId);
    if (index === -1) {
      return { success: false, message: '宠物不在阵容中' };
    }

    formation.petIds.splice(index, 1);
    formation.units = formation.units.filter(u => u.id !== petId);
    
    this.reorderSlots(formation);
    formation.updatedAt = Date.now();

    return { success: true, message: '宠物移除成功' };
  }

  /**
   * 重新排列槽位
   */
  private reorderSlots(formation: Formation) {
    // 重新排列英雄槽位
    formation.heroIds.forEach((heroId, index) => {
      const unit = formation.units.find(u => u.id === heroId);
      if (unit) {
        unit.slot = `hero${index + 1}` as any;
      }
    });

    // 重新排列宠物槽位
    formation.petIds.forEach((petId, index) => {
      const unit = formation.units.find(u => u.id === petId);
      if (unit) {
        unit.slot = `pet${index + 1}` as any;
      }
    });
  }

  /**
   * 获取阵容
   */
  getFormation(formationId: string): Formation | null {
    return this.formations.get(formationId) || null;
  }

  /**
   * 获取所有阵容
   */
  getAllFormations(): Formation[] {
    return Array.from(this.formations.values());
  }

  /**
   * 删除阵容
   */
  deleteFormation(formationId: string): { success: boolean; message: string } {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return { success: false, message: '阵容不存在' };
    }

    if (formation.isLocked) {
      return { success: false, message: '已锁定的阵容无法删除' };
    }

    this.formations.delete(formationId);
    if (this.currentFormationId === formationId) {
      this.currentFormationId = null;
    }

    return { success: true, message: '阵容删除成功' };
  }

  /**
   * 锁定/解锁阵容
   */
  toggleLock(formationId: string): { success: boolean; message: string } {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return { success: false, message: '阵容不存在' };
    }

    formation.isLocked = !formation.isLocked;
    formation.updatedAt = Date.now();

    return { success: true, message: formation.isLocked ? '阵容已锁定' : '阵容已解锁' };
  }

  /**
   * 设置当前阵容
   */
  setCurrentFormation(formationId: string): { success: boolean; message: string } {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return { success: false, message: '阵容不存在' };
    }

    this.currentFormationId = formationId;
    return { success: true, message: '阵容已设置' };
  }

  /**
   * 获取当前阵容
   */
  getCurrentFormation(): Formation | null {
    if (!this.currentFormationId) return null;
    return this.formations.get(this.currentFormationId) || null;
  }

  /**
   * 计算阵容战力
   */
  calculatePower(formation: Formation): FormationPower {
    let characterPower = 0;
    let heroPower = 0;
    let petPower = 0;

    // 计算主角战力
    if (formation.characterId) {
      characterPower = 1000; // 简化计算
    }

    // 计算英雄战力
    for (const heroId of formation.heroIds) {
      const config = HERO_CONFIGS[heroId];
      if (config) {
        const unit = formation.units.find(u => u.id === heroId);
        const level = unit?.level || 1;
        const star = unit?.star || 1;
        
        // 战力 = 基础属性 × 成长系数 × 星级系数 × 等级系数
        const baseStats = config.baseStats;
        const basePower = baseStats.hp + baseStats.attack * 2 + baseStats.defense * 1.5 + 
                         baseStats.speed + baseStats.mag * 2 + baseStats.res * 1.5;
        
        const starMultiplier = 1 + (star - 1) * 0.2;
        const levelMultiplier = 1 + (level - 1) * 0.05;
        
        heroPower += basePower * config.growthMultiplier * starMultiplier * levelMultiplier;
      }
    }

    // 计算宠物战力
    for (const petId of formation.petIds) {
      const config = PET_CONFIG[petId as any];
      if (config) {
        const unit = formation.units.find(u => u.id === petId);
        const level = unit?.level || 1;
        const star = unit?.star || 1;
        
        const baseStats = config.baseStats;
        const basePower = baseStats.hp + baseStats.attack * 2 + baseStats.defense * 1.5;
        
        const starMultiplier = 1 + (star - 1) * 0.2;
        const levelMultiplier = 1 + (level - 1) * 0.05;
        
        petPower += basePower * config.growthMultiplier * starMultiplier * levelMultiplier;
      }
    }

    // 计算羁绊加成
    const activeBonuses = this.getActiveBonuses(formation);
    let bonusMultiplier = 0;
    for (const bonus of activeBonuses) {
      bonusMultiplier += bonus.effect.value;
    }

    const totalBase = characterPower + heroPower + petPower;
    const bonusPower = totalBase * bonusMultiplier;
    const total = totalBase + bonusPower;

    return {
      total: Math.floor(total),
      breakdown: {
        character: Math.floor(characterPower),
        heroes: Math.floor(heroPower),
        pets: Math.floor(petPower),
        bonuses: Math.floor(bonusPower),
      },
      bonuses: activeBonuses,
    };
  }

  /**
   * 获取激活的羁绊
   */
  getActiveBonuses(formation: Formation): FormationBonus[] {
    const activeBonuses: FormationBonus[] = [];

    for (const bonus of FORMATION_CONFIG_V2.bonuses) {
      if (bonus.requirement(formation)) {
        activeBonuses.push(bonus);
      }
    }

    return activeBonuses;
  }

  /**
   * 获取阵容推荐
   */
  getRecommendation(ownedHeroes: string[], ownedPets: string[]): { 
    formation: Formation; 
    power: FormationPower;
    suggestions: string[];
  } {
    // 创建临时阵容
    const tempFormation: Formation = {
      id: 'temp',
      name: '推荐阵容',
      units: [],
      characterId: 'player',
      heroIds: [],
      petIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
    };

    const suggestions: string[] = [];

    // 按稀有度和等级排序英雄
    const sortedHeroes = [...ownedHeroes].sort((a, b) => {
      const configA = HERO_CONFIGS[a];
      const configB = HERO_CONFIGS[b];
      if (!configA || !configB) return 0;
      
      const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
      return rarityOrder[configB.rarity] - rarityOrder[configA.rarity];
    });

    // 添加前 5 个英雄
    for (let i = 0; i < Math.min(5, sortedHeroes.length); i++) {
      this.addHero('temp', sortedHeroes[i]);
      tempFormation.heroIds.push(sortedHeroes[i]);
    }

    // 添加前 3 个宠物
    for (let i = 0; i < Math.min(3, ownedPets.length); i++) {
      this.addPet('temp', ownedPets[i]);
      tempFormation.petIds.push(ownedPets[i]);
    }

    // 构建 units 数组
    tempFormation.units = [
      { type: 'character' as const, id: 'player', slot: 'character' as const, level: 1, star: 1 },
      ...tempFormation.heroIds.map((id, i) => ({
        type: 'hero' as const,
        id,
        slot: `hero${i + 1}` as FormationSlot,
        level: 1,
        star: 1,
      })),
      ...tempFormation.petIds.map((id, i) => ({
        type: 'pet' as const,
        id,
        slot: `pet${i + 1}` as FormationSlot,
        level: 1,
        star: 1,
      })),
    ];

    const power = this.calculatePower(tempFormation);

    // 生成建议
    const activeBonuses = this.getActiveBonuses(tempFormation);
    if (activeBonuses.length === 0) {
      suggestions.push('尝试搭配相同元素或职业的单位激活羁绊');
    }

    const fireCount = countElementsByType(tempFormation, 'fire');
    if (fireCount === 2) {
      suggestions.push('再添加 1 个火系单位可激活火焰共鸣');
    }

    return {
      formation: tempFormation,
      power,
      suggestions,
    };
  }

  /**
   * 导出阵容数据
   */
  exportData(): any {
    return {
      formations: Array.from(this.formations.entries()),
      currentFormationId: this.currentFormationId,
    };
  }

  /**
   * 导入阵容数据
   */
  importData(data: any): void {
    this.formations = new Map(data.formations || []);
    this.currentFormationId = data.currentFormationId || null;
  }
}

/**
 * 创建阵容系统实例
 */
export function createFormationSystemV2(): FormationSystemV2 {
  return new FormationSystemV2();
}
