// v0.45 英雄技能系统

import { HERO_CONFIGS, type HeroConfig } from './heroes';

/**
 * 技能类型
 */
export type SkillType = 'active' | 'passive' | 'ultimate';

/**
 * 技能目标
 */
export type SkillTarget = 'self' | 'single_enemy' | 'all_enemies' | 'all_allies';

/**
 * 技能效果
 */
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'shield';
  value: number; // 数值或百分比
  duration?: number; // 持续回合数
  stat?: 'attack' | 'defense' | 'speed' | 'mag' | 'res';
}

/**
 * 技能配置
 */
export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  target: SkillTarget;
  effects: SkillEffect[];
  cooldown: number; // 冷却回合
  manaCost?: number; // 魔法消耗
  unlockLevel: number; // 解锁等级
  maxLevel: number;
}

/**
 * 玩家技能
 */
export interface OwnedSkill {
  skillId: string;
  level: number;
  isUnlocked: boolean;
  isEquipped: boolean;
  exp: number;
  lastUsedTurn?: number;
}

/**
 * 技能升级消耗
 */
export interface SkillUpgradeCost {
  gold: number;
  skillBooks: number;
  heroShards?: number;
}

/**
 * 所有技能配置
 */
export const SKILL_CONFIGS: Record<string, SkillConfig> = {
  // ===== 主动技能 =====
  'skill_001': {
    id: 'skill_001',
    name: '基础打击',
    description: '对单个敌人造成 100% 攻击力的物理伤害',
    type: 'active',
    target: 'single_enemy',
    effects: [{ type: 'damage', value: 1.0 }],
    cooldown: 1,
    manaCost: 10,
    unlockLevel: 1,
    maxLevel: 10,
  },
  'skill_002': {
    id: 'skill_002',
    name: '火焰球',
    description: '对单个敌人造成 150% 魔法攻击力的火系伤害',
    type: 'active',
    target: 'single_enemy',
    effects: [{ type: 'damage', value: 1.5 }],
    cooldown: 2,
    manaCost: 20,
    unlockLevel: 5,
    maxLevel: 10,
  },
  'skill_003': {
    id: 'skill_003',
    name: '治疗术',
    description: '恢复单个友军 80% 魔法攻击力的生命值',
    type: 'active',
    target: 'single_enemy',
    effects: [{ type: 'heal', value: 0.8 }],
    cooldown: 3,
    manaCost: 25,
    unlockLevel: 10,
    maxLevel: 10,
  },
  'skill_004': {
    id: 'skill_004',
    name: '旋风斩',
    description: '对所有敌人造成 80% 攻击力的物理伤害',
    type: 'active',
    target: 'all_enemies',
    effects: [{ type: 'damage', value: 0.8 }],
    cooldown: 4,
    manaCost: 35,
    unlockLevel: 15,
    maxLevel: 10,
  },
  'skill_005': {
    id: 'skill_005',
    name: '神圣护盾',
    description: '为单个友军提供 100% 魔法攻击力的护盾，持续 2 回合',
    type: 'active',
    target: 'single_enemy',
    effects: [{ type: 'shield', value: 1.0, duration: 2 }],
    cooldown: 5,
    manaCost: 30,
    unlockLevel: 20,
    maxLevel: 10,
  },

  // ===== 被动技能 =====
  'skill_010': {
    id: 'skill_010',
    name: '攻击强化',
    description: '永久提升 10% 攻击力',
    type: 'passive',
    target: 'self',
    effects: [{ type: 'buff', value: 0.1, stat: 'attack' }],
    cooldown: 0,
    unlockLevel: 8,
    maxLevel: 10,
  },
  'skill_011': {
    id: 'skill_011',
    name: '防御强化',
    description: '永久提升 10% 防御力',
    type: 'passive',
    target: 'self',
    effects: [{ type: 'buff', value: 0.1, stat: 'defense' }],
    cooldown: 0,
    unlockLevel: 12,
    maxLevel: 10,
  },
  'skill_012': {
    id: 'skill_012',
    name: '速度强化',
    description: '永久提升 10% 速度',
    type: 'passive',
    target: 'self',
    effects: [{ type: 'buff', value: 0.1, stat: 'speed' }],
    cooldown: 0,
    unlockLevel: 16,
    maxLevel: 10,
  },
  'skill_013': {
    id: 'skill_013',
    name: '生命强化',
    description: '永久提升 15% 最大生命值',
    type: 'passive',
    target: 'self',
    effects: [{ type: 'buff', value: 0.15 }],
    cooldown: 0,
    unlockLevel: 20,
    maxLevel: 10,
  },
  'skill_014': {
    id: 'skill_014',
    name: '暴击强化',
    description: '永久提升 5% 暴击率',
    type: 'passive',
    target: 'self',
    effects: [{ type: 'buff', value: 0.05 }],
    cooldown: 0,
    unlockLevel: 25,
    maxLevel: 10,
  },

  // ===== 终极技能 =====
  'skill_020': {
    id: 'skill_020',
    name: '天崩地裂',
    description: '对所有敌人造成 250% 攻击力的物理伤害',
    type: 'ultimate',
    target: 'all_enemies',
    effects: [{ type: 'damage', value: 2.5 }],
    cooldown: 6,
    manaCost: 80,
    unlockLevel: 30,
    maxLevel: 15,
  },
  'skill_021': {
    id: 'skill_021',
    name: '神圣审判',
    description: '对所有敌人造成 300% 魔法攻击力的光系伤害',
    type: 'ultimate',
    target: 'all_enemies',
    effects: [{ type: 'damage', value: 3.0 }],
    cooldown: 6,
    manaCost: 100,
    unlockLevel: 40,
    maxLevel: 15,
  },
  'skill_022': {
    id: 'skill_022',
    name: '起死回生',
    description: '复活一个倒下的友军并恢复 50% 生命值',
    type: 'ultimate',
    target: 'single_enemy',
    effects: [{ type: 'heal', value: 0.5 }],
    cooldown: 8,
    manaCost: 120,
    unlockLevel: 50,
    maxLevel: 15,
  },
  'skill_023': {
    id: 'skill_023',
    name: '无敌护罩',
    description: '使单个友军免疫所有伤害，持续 1 回合',
    type: 'ultimate',
    target: 'single_enemy',
    effects: [{ type: 'shield', value: 9999, duration: 1 }],
    cooldown: 10,
    manaCost: 150,
    unlockLevel: 60,
    maxLevel: 15,
  },
  'skill_024': {
    id: 'skill_024',
    name: '狂暴',
    description: '提升自身 50% 攻击力但降低 50% 防御力，持续 3 回合',
    type: 'ultimate',
    target: 'self',
    effects: [
      { type: 'buff', value: 0.5, stat: 'attack', duration: 3 },
      { type: 'debuff', value: 0.5, stat: 'defense', duration: 3 },
    ],
    cooldown: 8,
    manaCost: 80,
    unlockLevel: 45,
    maxLevel: 15,
  },
};

/**
 * 技能升级消耗配置
 */
export function getSkillUpgradeCost(skillId: string, currentLevel: number): SkillUpgradeCost {
  const skill = SKILL_CONFIGS[skillId];
  if (!skill) {
    return { gold: 0, skillBooks: 0 };
  }

  const baseGold = 100;
  const baseBooks = 1;
  const multiplier = Math.pow(1.5, currentLevel);

  return {
    gold: Math.floor(baseGold * multiplier),
    skillBooks: Math.ceil(baseBooks * (currentLevel / 3 + 1)),
    heroShards: currentLevel >= 5 ? Math.floor(currentLevel / 5) * 10 : 0,
  };
}

/**
 * 技能升级所需经验
 */
export function getSkillExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.3, level - 1));
}

/**
 * 技能系统主类
 */
export class HeroSkillSystem {
  private ownedSkills: Map<string, OwnedSkill>;
  private heroSkillSlots: Map<string, number[]>; // heroId -> [skillSlot1, skillSlot2, ...]

  constructor() {
    this.ownedSkills = new Map();
    this.heroSkillSlots = new Map();
  }

  /**
   * 解锁技能
   */
  unlockSkill(heroId: string, skillId: string, heroLevel: number): { success: boolean; message: string } {
    const skill = SKILL_CONFIGS[skillId];
    if (!skill) {
      return { success: false, message: '技能不存在' };
    }

    if (heroLevel < skill.unlockLevel) {
      return { success: false, message: `英雄等级不足，需要${skill.unlockLevel}级` };
    }

    const ownedSkill = this.ownedSkills.get(skillId);
    if (ownedSkill && ownedSkill.isUnlocked) {
      return { success: false, message: '技能已解锁' };
    }

    // 解锁技能
    if (!ownedSkill) {
      this.ownedSkills.set(skillId, {
        skillId,
        level: 1,
        isUnlocked: true,
        isEquipped: false,
        exp: 0,
      });
    } else {
      ownedSkill.isUnlocked = true;
    }

    return { success: true, message: '技能解锁成功' };
  }

  /**
   * 升级技能
   */
  upgradeSkill(skillId: string, gold: number, skillBooks: number, heroShards: number = 0): {
    success: boolean;
    newLevel: number;
    message: string;
  } {
    const ownedSkill = this.ownedSkills.get(skillId);
    if (!ownedSkill) {
      return { success: false, newLevel: 0, message: '技能未拥有' };
    }

    const skill = SKILL_CONFIGS[skillId];
    if (!skill) {
      return { success: false, newLevel: 0, message: '技能配置不存在' };
    }

    if (ownedSkill.level >= skill.maxLevel) {
      return { success: false, newLevel: ownedSkill.level, message: '技能已达最大等级' };
    }

    const cost = getSkillUpgradeCost(skillId, ownedSkill.level);
    if (gold < cost.gold) {
      return { success: false, newLevel: ownedSkill.level, message: `金币不足，需要${cost.gold}` };
    }
    if (skillBooks < cost.skillBooks) {
      return { success: false, newLevel: ownedSkill.level, message: `技能书不足，需要${cost.skillBooks}` };
    }
    if (cost.heroShards && heroShards < cost.heroShards) {
      return { success: false, newLevel: ownedSkill.level, message: `英雄碎片不足，需要${cost.heroShards}` };
    }

    // 升级技能
    ownedSkill.level++;
    ownedSkill.exp = 0;

    return { success: true, newLevel: ownedSkill.level, message: '技能升级成功' };
  }

  /**
   * 技能获得经验
   */
  addSkillExp(skillId: string, exp: number): { success: boolean; leveledUp: boolean; newLevel: number } {
    const ownedSkill = this.ownedSkills.get(skillId);
    if (!ownedSkill || !ownedSkill.isUnlocked) {
      return { success: false, leveledUp: false, newLevel: 0 };
    }

    const skill = SKILL_CONFIGS[skillId];
    if (!skill) {
      return { success: false, leveledUp: false, newLevel: 0 };
    }

    if (ownedSkill.level >= skill.maxLevel) {
      return { success: false, leveledUp: false, newLevel: ownedSkill.level };
    }

    ownedSkill.exp += exp;
    let leveledUp = false;

    // 检查是否可以升级
    const expNeeded = getSkillExpForLevel(ownedSkill.level + 1);
    if (ownedSkill.exp >= expNeeded) {
      ownedSkill.exp -= expNeeded;
      ownedSkill.level++;
      leveledUp = true;
    }

    return { success: true, leveledUp, newLevel: ownedSkill.level };
  }

  /**
   * 装备/卸下技能
   */
  toggleEquipSkill(heroId: string, skillId: string, slotIndex: number): { success: boolean; message: string } {
    const ownedSkill = this.ownedSkills.get(skillId);
    if (!ownedSkill || !ownedSkill.isUnlocked) {
      return { success: false, message: '技能未解锁' };
    }

    const slots = this.heroSkillSlots.get(heroId) || [];
    const maxSlots = 4; // 最多 4 个技能槽

    // 初始化技能槽
    if (slots.length < maxSlots) {
      for (let i = slots.length; i < maxSlots; i++) {
        slots.push(0);
      }
    }

    // 检查是否已装备
    const existingIndex = slots.indexOf(parseInt(skillId.split('_')[1]));
    if (existingIndex !== -1) {
      // 卸下技能
      slots[existingIndex] = 0;
      ownedSkill.isEquipped = false;
    } else {
      // 装备技能
      if (slotIndex < 0 || slotIndex >= maxSlots) {
        return { success: false, message: '无效的技能槽位' };
      }
      slots[slotIndex] = parseInt(skillId.split('_')[1]);
      ownedSkill.isEquipped = true;
    }

    this.heroSkillSlots.set(heroId, slots);
    return { success: true, message: ownedSkill.isEquipped ? '技能装备成功' : '技能卸下成功' };
  }

  /**
   * 获取英雄已装备的技能
   */
  getEquippedSkills(heroId: string): SkillConfig[] {
    const slots = this.heroSkillSlots.get(heroId) || [];
    const equipped: SkillConfig[] = [];

    for (const slotId of slots) {
      if (slotId > 0) {
        const skillId = `skill_${slotId.toString().padStart(3, '0')}`;
        const skill = SKILL_CONFIGS[skillId];
        if (skill) {
          equipped.push(skill);
        }
      }
    }

    return equipped;
  }

  /**
   * 获取所有拥有的技能
   */
  getOwnedSkills(): OwnedSkill[] {
    return Array.from(this.ownedSkills.values());
  }

  /**
   * 获取技能详情
   */
  getSkillDetail(skillId: string): { config: SkillConfig; owned?: OwnedSkill } | null {
    const config = SKILL_CONFIGS[skillId];
    if (!config) return null;

    const owned = this.ownedSkills.get(skillId);
    return { config, owned };
  }

  /**
   * 计算技能实际效果（考虑等级加成）
   */
  calculateSkillEffect(skillId: string, effectIndex: number = 0): SkillEffect | null {
    const skill = SKILL_CONFIGS[skillId];
    const owned = this.ownedSkills.get(skillId);

    if (!skill || !owned || effectIndex >= skill.effects.length) {
      return null;
    }

    const baseEffect = skill.effects[effectIndex];
    const levelMultiplier = 1 + (owned.level - 1) * 0.1; // 每级 +10% 效果

    return {
      ...baseEffect,
      value: baseEffect.value * levelMultiplier,
    };
  }

  /**
   * 检查技能是否在冷却中
   */
  isSkillOnCooldown(skillId: string, currentTurn: number): boolean {
    const owned = this.ownedSkills.get(skillId);
    const skill = SKILL_CONFIGS[skillId];

    if (!owned || !skill) {
      return false;
    }

    if (owned.lastUsedTurn === undefined) {
      return false;
    }

    return currentTurn - owned.lastUsedTurn < skill.cooldown;
  }

  /**
   * 使用技能
   */
  useSkill(skillId: string, currentTurn: number): { success: boolean; message: string } {
    const owned = this.ownedSkills.get(skillId);
    const skill = SKILL_CONFIGS[skillId];

    if (!owned || !skill) {
      return { success: false, message: '技能不存在' };
    }

    if (!owned.isUnlocked) {
      return { success: false, message: '技能未解锁' };
    }

    if (this.isSkillOnCooldown(skillId, currentTurn)) {
      const remainingTurns = skill.cooldown - (currentTurn - (owned.lastUsedTurn || 0));
      return { success: false, message: `技能冷却中，剩余${remainingTurns}回合` };
    }

    // 使用技能
    owned.lastUsedTurn = currentTurn;
    return { success: true, message: '技能使用成功' };
  }

  /**
   * 导出存档数据
   */
  exportData(): any {
    return {
      ownedSkills: Array.from(this.ownedSkills.entries()),
      heroSkillSlots: Array.from(this.heroSkillSlots.entries()),
    };
  }

  /**
   * 导入存档数据
   */
  importData(data: any): void {
    this.ownedSkills = new Map(data.ownedSkills || []);
    this.heroSkillSlots = new Map(data.heroSkillSlots || []);
  }
}

/**
 * 创建英雄技能系统实例
 */
export function createHeroSkillSystem(): HeroSkillSystem {
  return new HeroSkillSystem();
}
