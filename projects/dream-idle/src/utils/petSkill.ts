/**
 * v0.41 宠物技能系统
 * 
 * 功能：
 * - 宠物技能学习
 * - 技能升级
 * - 技能替换
 * - 技能书使用
 * - 技能锁定/解锁
 */

export interface PetSkill {
  id: string;
  name: string;
  description: string;
  type: 'physical' | 'magical' | 'buff' | 'debuff' | 'passive';
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark' | 'neutral';
  basePower: number;
  accuracy: number; // 命中率 0-100
  cooldown: number; // 冷却回合
  maxLevel: number;
  effect: SkillEffect;
}

export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special';
  powerMultiplier: number; // 威力倍率
  targetCount?: number; // 目标数量（群体技能）
  buffType?: 'attack' | 'defense' | 'speed' | 'crit';
  buffValue?: number;
  buffDuration?: number; // 持续回合
  specialEffect?: string;
}

export interface LearnedSkill {
  skillId: string;
  level: number;
  exp: number;
  maxExp: number;
  locked: boolean;
}

export interface SkillBook {
  id: string;
  skillId: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price?: number; // 商店价格
}

export interface PetSkillState {
  learnedSkills: LearnedSkill[];
  skillPoints: number; // 技能点（用于学习新技能）
  maxSkillSlots: number; // 最大技能槽位
}

/**
 * 技能配置
 */
export const PET_SKILLS: PetSkill[] = [
  // 物理技能
  {
    id: 'scratch',
    name: '抓击',
    description: '用利爪抓击敌人',
    type: 'physical',
    element: 'neutral',
    basePower: 40,
    accuracy: 100,
    cooldown: 0,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.0 }
  },
  {
    id: 'bite',
    name: '咬住',
    description: '用力咬住敌人，可能降低防御',
    type: 'physical',
    element: 'neutral',
    basePower: 60,
    accuracy: 100,
    cooldown: 1,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.2, buffType: 'defense', buffValue: -10, buffDuration: 2 }
  },
  {
    id: 'flame-claw',
    name: '火焰爪',
    description: '附着火焰的爪击',
    type: 'physical',
    element: 'fire',
    basePower: 75,
    accuracy: 95,
    cooldown: 2,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.5 }
  },
  {
    id: 'water-slash',
    name: '水之斩',
    description: '如水般的快速斩击',
    type: 'physical',
    element: 'water',
    basePower: 70,
    accuracy: 100,
    cooldown: 1,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.4 }
  },
  // 魔法技能
  {
    id: 'fireball',
    name: '火球术',
    description: '发射一枚火球',
    type: 'magical',
    element: 'fire',
    basePower: 80,
    accuracy: 90,
    cooldown: 2,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.6 }
  },
  {
    id: 'water-bubble',
    name: '水泡术',
    description: '发射水泡攻击',
    type: 'magical',
    element: 'water',
    basePower: 75,
    accuracy: 95,
    cooldown: 1,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.5 }
  },
  {
    id: 'earth-shock',
    name: '地震波',
    description: '引发地震波攻击全体敌人',
    type: 'magical',
    element: 'earth',
    basePower: 90,
    accuracy: 85,
    cooldown: 3,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.8, targetCount: 3 }
  },
  {
    id: 'wind-blade',
    name: '风刃',
    description: '发射锋利风刃',
    type: 'magical',
    element: 'wind',
    basePower: 70,
    accuracy: 100,
    cooldown: 1,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.4 }
  },
  {
    id: 'light-beam',
    name: '圣光波',
    description: '神圣的光束攻击',
    type: 'magical',
    element: 'light',
    basePower: 85,
    accuracy: 95,
    cooldown: 2,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.7 }
  },
  {
    id: 'dark-pulse',
    name: '黑暗脉冲',
    description: '释放黑暗能量',
    type: 'magical',
    element: 'dark',
    basePower: 85,
    accuracy: 90,
    cooldown: 2,
    maxLevel: 10,
    effect: { type: 'damage', powerMultiplier: 1.7, buffType: 'attack', buffValue: -5, buffDuration: 2 }
  },
  // 增益技能
  {
    id: 'growl',
    name: '咆哮',
    description: '咆哮提升攻击力',
    type: 'buff',
    element: 'neutral',
    basePower: 0,
    accuracy: 100,
    cooldown: 4,
    maxLevel: 10,
    effect: { type: 'buff', powerMultiplier: 0, buffType: 'attack', buffValue: 20, buffDuration: 3 }
  },
  {
    id: 'harden',
    name: '硬化',
    description: '硬化身体提升防御',
    type: 'buff',
    element: 'neutral',
    basePower: 0,
    accuracy: 100,
    cooldown: 4,
    maxLevel: 10,
    effect: { type: 'buff', powerMultiplier: 0, buffType: 'defense', buffValue: 25, buffDuration: 3 }
  },
  {
    id: 'agility',
    name: '敏捷',
    description: '提升速度',
    type: 'buff',
    element: 'wind',
    basePower: 0,
    accuracy: 100,
    cooldown: 4,
    maxLevel: 10,
    effect: { type: 'buff', powerMultiplier: 0, buffType: 'speed', buffValue: 30, buffDuration: 3 }
  },
  // 治疗技能
  {
    id: 'heal',
    name: '治愈',
    description: '恢复生命值',
    type: 'buff',
    element: 'light',
    basePower: 0,
    accuracy: 100,
    cooldown: 3,
    maxLevel: 10,
    effect: { type: 'heal', powerMultiplier: 0.3 }
  },
  {
    id: 'big-heal',
    name: '大治愈',
    description: '大量恢复生命值',
    type: 'buff',
    element: 'light',
    basePower: 0,
    accuracy: 100,
    cooldown: 5,
    maxLevel: 10,
    effect: { type: 'heal', powerMultiplier: 0.6 }
  },
  // 被动技能
  {
    id: 'strength',
    name: '力量强化',
    description: '被动提升攻击力',
    type: 'passive',
    element: 'neutral',
    basePower: 0,
    accuracy: 0,
    cooldown: 0,
    maxLevel: 10,
    effect: { type: 'special', powerMultiplier: 0, specialEffect: 'attack +10%' }
  },
  {
    id: 'vitality',
    name: '活力强化',
    description: '被动提升生命值',
    type: 'passive',
    element: 'neutral',
    basePower: 0,
    accuracy: 0,
    cooldown: 0,
    maxLevel: 10,
    effect: { type: 'special', powerMultiplier: 0, specialEffect: 'hp +15%' }
  },
  {
    id: 'critical-eye',
    name: '暴击之眼',
    description: '被动提升暴击率',
    type: 'passive',
    element: 'neutral',
    basePower: 0,
    accuracy: 0,
    cooldown: 0,
    maxLevel: 10,
    effect: { type: 'special', powerMultiplier: 0, specialEffect: 'crit +5%' }
  }
];

/**
 * 技能书配置
 */
export const SKILL_BOOKS: SkillBook[] = PET_SKILLS.map(skill => ({
  id: `book-${skill.id}`,
  skillId: skill.id,
  name: `${skill.name}技能书`,
  description: `使用后可让宠物学习技能：${skill.name}`,
  rarity: getSkillRarity(skill.basePower)
}));

function getSkillRarity(power: number): SkillBook['rarity'] {
  if (power >= 85) return 'legendary';
  if (power >= 70) return 'epic';
  if (power >= 50) return 'rare';
  return 'common';
}

/**
 * 初始化宠物技能状态
 */
export function initializePetSkillState(): PetSkillState {
  return {
    learnedSkills: [],
    skillPoints: 0,
    maxSkillSlots: 4
  };
}

/**
 * 学习技能
 */
export function learnSkill(
  state: PetSkillState,
  skillId: string
): {
  success: boolean;
  reason?: string;
  newState: PetSkillState;
} {
  const skill = PET_SKILLS.find(s => s.id === skillId);
  if (!skill) {
    return { success: false, reason: '技能不存在', newState: state };
  }

  // 检查是否已学习
  if (state.learnedSkills.some(s => s.skillId === skillId)) {
    return { success: false, reason: '已学习该技能', newState: state };
  }

  // 检查技能槽位
  if (state.learnedSkills.length >= state.maxSkillSlots) {
    return { success: false, reason: '技能槽位已满', newState: state };
  }

  const newSkill: LearnedSkill = {
    skillId,
    level: 1,
    exp: 0,
    maxExp: 100,
    locked: false
  };

  return {
    success: true,
    newState: {
      ...state,
      learnedSkills: [...state.learnedSkills, newSkill]
    }
  };
}

/**
 * 升级技能
 */
export function upgradeSkill(
  state: PetSkillState,
  skillId: string,
  exp: number
): {
  success: boolean;
  reason?: string;
  newState: PetSkillState;
  leveledUp: boolean;
  newLevel: number;
} {
  const skillIndex = state.learnedSkills.findIndex(s => s.skillId === skillId);
  if (skillIndex === -1) {
    return { success: false, reason: '未学习该技能', newState: state, leveledUp: false, newLevel: 0 };
  }

  const learnedSkill = state.learnedSkills[skillIndex];
  const skill = PET_SKILLS.find(s => s.id === skillId);
  if (!skill) {
    return { success: false, reason: '技能配置不存在', newState: state, leveledUp: false, newLevel: 0 };
  }

  // 检查是否已满级
  if (learnedSkill.level >= skill.maxLevel) {
    return { success: false, reason: '技能已满级', newState: state, leveledUp: false, newLevel: learnedSkill.level };
  }

  const newExp = learnedSkill.exp + exp;
  let newLevel = learnedSkill.level;
  let newMaxExp = learnedSkill.maxExp;
  let leveledUp = false;

  // 升级逻辑
  if (newExp >= newMaxExp) {
    newLevel++;
    newMaxExp = Math.floor(newMaxExp * 1.5);
    leveledUp = true;
  }

  const updatedSkills = [...state.learnedSkills];
  updatedSkills[skillIndex] = {
    ...learnedSkill,
    level: newLevel,
    exp: newExp >= newMaxExp ? newExp - newMaxExp : newExp,
    maxExp: newMaxExp
  };

  return {
    success: true,
    newState: {
      ...state,
      learnedSkills: updatedSkills
    },
    leveledUp,
    newLevel
  };
}

/**
 * 替换技能
 */
export function replaceSkill(
  state: PetSkillState,
  oldSkillId: string,
  newSkillId: string
): {
  success: boolean;
  reason?: string;
  newState: PetSkillState;
} {
  const oldSkillIndex = state.learnedSkills.findIndex(s => s.skillId === oldSkillId);
  if (oldSkillIndex === -1) {
    return { success: false, reason: '未学习该技能', newState: state };
  }

  const oldSkill = state.learnedSkills[oldSkillIndex];
  if (oldSkill.locked) {
    return { success: false, reason: '技能已锁定', newState: state };
  }

  const newSkill = PET_SKILLS.find(s => s.id === newSkillId);
  if (!newSkill) {
    return { success: false, reason: '新技能不存在', newState: state };
  }

  // 检查是否已学习新技能
  if (state.learnedSkills.some(s => s.skillId === newSkillId)) {
    return { success: false, reason: '已学习该技能', newState: state };
  }

  const updatedSkills = [...state.learnedSkills];
  updatedSkills[oldSkillIndex] = {
    skillId: newSkillId,
    level: 1,
    exp: 0,
    maxExp: 100,
    locked: false
  };

  return {
    success: true,
    newState: {
      ...state,
      learnedSkills: updatedSkills
    }
  };
}

/**
 * 锁定/解锁技能
 */
export function toggleSkillLock(
  state: PetSkillState,
  skillId: string
): {
  success: boolean;
  reason?: string;
  newState: PetSkillState;
  locked: boolean;
} {
  const skillIndex = state.learnedSkills.findIndex(s => s.skillId === skillId);
  if (skillIndex === -1) {
    return { success: false, reason: '未学习该技能', newState: state, locked: false };
  }

  const updatedSkills = [...state.learnedSkills];
  updatedSkills[skillIndex] = {
    ...updatedSkills[skillIndex],
    locked: !updatedSkills[skillIndex].locked
  };

  return {
    success: true,
    newState: {
      ...state,
      learnedSkills: updatedSkills
    },
    locked: updatedSkills[skillIndex].locked
  };
}

/**
 * 获取技能信息
 */
export function getSkillInfo(skillId: string): PetSkill | undefined {
  return PET_SKILLS.find(s => s.id === skillId);
}

/**
 * 获取技能等级加成
 */
export function getSkillLevelBonus(skillId: string, level: number): {
  power: number;
  accuracy: number;
} {
  const skill = PET_SKILLS.find(s => s.id === skillId);
  if (!skill) return { power: 0, accuracy: 0 };

  // 每级提升 5% 威力和 1% 命中
  const powerBonus = skill.basePower * (1 + (level - 1) * 0.05);
  const accuracyBonus = Math.min(100, skill.accuracy + (level - 1) * 1);

  return {
    power: Math.floor(powerBonus),
    accuracy: accuracyBonus
  };
}

/**
 * 计算技能伤害
 */
export function calculateSkillDamage(
  skillId: string,
  skillLevel: number,
  attackerAttack: number,
  defenderDefense: number,
  elementAdvantage: number = 1.0
): number {
  const skill = PET_SKILLS.find(s => s.id === skillId);
  if (!skill || skill.effect.type !== 'damage') return 0;

  const { power } = getSkillLevelBonus(skillId, skillLevel);
  
  // 基础伤害公式
  const baseDamage = power * (attackerAttack / defenderDefense);
  const multiplier = skill.effect.powerMultiplier * elementAdvantage;
  
  return Math.floor(baseDamage * multiplier);
}

/**
 * 保存宠物技能状态到 localStorage
 */
export function savePetSkillState(state: PetSkillState): void {
  localStorage.setItem('dream-idle-pet-skill', JSON.stringify(state));
}

/**
 * 从 localStorage 加载宠物技能状态
 */
export function loadPetSkillState(): PetSkillState {
  const saved = localStorage.getItem('dream-idle-pet-skill');
  if (saved) {
    return JSON.parse(saved);
  }
  return initializePetSkillState();
}

/**
 * 获取技能类型名称
 */
export function getSkillTypeName(type: PetSkill['type']): string {
  const names: Record<PetSkill['type'], string> = {
    physical: '物理',
    magical: '魔法',
    buff: '增益',
    debuff: '减益',
    passive: '被动'
  };
  return names[type] || '未知';
}

/**
 * 获取技能类型颜色
 */
export function getSkillTypeColor(type: PetSkill['type']): string {
  const colors: Record<PetSkill['type'], string> = {
    physical: 'text-red-500',
    magical: 'text-blue-500',
    buff: 'text-green-500',
    debuff: 'text-purple-500',
    passive: 'text-yellow-500'
  };
  return colors[type] || 'text-gray-500';
}
