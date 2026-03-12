// 技能系统配置和类型定义

/**
 * 技能类型
 */
export type SkillType = 'physical' | 'magical' | 'buff' | 'heal'

/**
 * 技能目标类型
 */
export type SkillTarget = 'self' | 'enemy' | 'ally'

/**
 * 技能配置
 */
export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  target: SkillTarget;
  mpCost: number;
  cooldown: number;        // 回合数
  damageMultiplier?: number;  // 伤害倍率
  healMultiplier?: number;    // 治疗倍率
  buffEffects?: BuffEffect[]; // 增益效果
  icon: string;
}

/**
 * 增益效果
 */
export interface BuffEffect {
  type: 'attack' | 'defense' | 'speed' | 'mag' | 'res';
  value: number;           // 增加的值或百分比
  duration: number;        // 持续回合数
  isPercent: boolean;      // 是否为百分比加成
}

/**
 * 技能实例（战斗中使用的技能）
 */
export interface SkillInstance extends SkillConfig {
  currentCooldown: number;  // 当前冷却
  available: boolean;       // 是否可用
}

/**
 * 门派技能配置
 */
export const JOB_SKILLS: Record<string, SkillConfig[]> = {
  '剑侠客': [
    {
      id: 'sword_strike',
      name: '横扫天下',
      description: '连续攻击敌人 3 次，每次造成 60% 物理伤害',
      type: 'physical',
      target: 'enemy',
      mpCost: 30,
      cooldown: 3,
      damageMultiplier: 0.6,
      icon: '⚔️'
    },
    {
      id: 'cleave',
      name: '破血狂攻',
      description: '强力一击，造成 150% 物理伤害',
      type: 'physical',
      target: 'enemy',
      mpCost: 40,
      cooldown: 4,
      damageMultiplier: 1.5,
      icon: '💥'
    },
    {
      id: 'battle_god',
      name: '战神护体',
      description: '提升 30% 攻击力，持续 3 回合',
      type: 'buff',
      target: 'self',
      mpCost: 25,
      cooldown: 5,
      buffEffects: [
        { type: 'attack', value: 0.3, duration: 3, isPercent: true }
      ],
      icon: '🛡️'
    }
  ],
  '骨精灵': [
    {
      id: 'soul_strike',
      name: '摄魂夺魄',
      description: '法术攻击敌人，造成 120% 法术伤害并回复等量气血',
      type: 'magical',
      target: 'enemy',
      mpCost: 35,
      cooldown: 3,
      damageMultiplier: 1.2,
      icon: '👻'
    },
    {
      id: 'ghost_fire',
      name: '鬼火术',
      description: '群体法术攻击，对 3 个敌人造成 70% 法术伤害',
      type: 'magical',
      target: 'enemy',
      mpCost: 50,
      cooldown: 4,
      damageMultiplier: 0.7,
      icon: '🔥'
    },
    {
      id: 'spirit_form',
      name: '灵能护体',
      description: '提升 40% 法术伤害，持续 3 回合',
      type: 'buff',
      target: 'self',
      mpCost: 30,
      cooldown: 5,
      buffEffects: [
        { type: 'mag', value: 0.4, duration: 3, isPercent: true }
      ],
      icon: '✨'
    }
  ],
  '龙太子': [
    {
      id: 'dragon_breath',
      name: '龙息术',
      description: '龙族秘术，造成 130% 法术伤害',
      type: 'magical',
      target: 'enemy',
      mpCost: 40,
      cooldown: 3,
      damageMultiplier: 1.3,
      icon: '🐉'
    },
    {
      id: 'water_barrier',
      name: '水遁术',
      description: '提升 50% 防御力，持续 3 回合',
      type: 'buff',
      target: 'self',
      mpCost: 25,
      cooldown: 4,
      buffEffects: [
        { type: 'defense', value: 0.5, duration: 3, isPercent: true }
      ],
      icon: '💧'
    },
    {
      id: 'thunder',
      name: '雷霆万钧',
      description: '强力雷击，造成 180% 法术伤害',
      type: 'magical',
      target: 'enemy',
      mpCost: 60,
      cooldown: 5,
      damageMultiplier: 1.8,
      icon: '⚡'
    }
  ],
  '狐美人': [
    {
      id: 'charm',
      name: '魅惑术',
      description: '降低敌人 30% 攻击力，持续 3 回合',
      type: 'buff',
      target: 'enemy',
      mpCost: 30,
      cooldown: 4,
      buffEffects: [
        { type: 'attack', value: -0.3, duration: 3, isPercent: true }
      ],
      icon: '💕'
    },
    {
      id: 'fox_fire',
      name: '狐火',
      description: '妖狐之火，造成 125% 法术伤害',
      type: 'magical',
      target: 'enemy',
      mpCost: 35,
      cooldown: 3,
      damageMultiplier: 1.25,
      icon: '🦊'
    },
    {
      id: 'seduction',
      name: '倾国倾城',
      description: '提升自身 35% 法术伤害和速度，持续 3 回合',
      type: 'buff',
      target: 'self',
      mpCost: 45,
      cooldown: 5,
      buffEffects: [
        { type: 'mag', value: 0.35, duration: 3, isPercent: true },
        { type: 'speed', value: 0.35, duration: 3, isPercent: true }
      ],
      icon: '🌸'
    }
  ]
}

/**
 * 获取门派的技能列表
 */
export function getJobSkills(jobName: string): SkillConfig[] {
  return JOB_SKILLS[jobName] || []
}

/**
 * 初始化技能实例（战斗开始时）
 */
export function initializeSkills(jobName: string): SkillInstance[] {
  const skills = getJobSkills(jobName)
  return skills.map(skill => ({
    ...skill,
    currentCooldown: 0,
    available: true
  }))
}

/**
 * 检查技能是否可用
 */
export function canUseSkill(skill: SkillInstance, currentMp: number): boolean {
  return skill.available && skill.currentCooldown === 0 && currentMp >= skill.mpCost
}

/**
 * 使用技能（返回冷却后的技能状态）
 */
export function useSkill(skill: SkillInstance): SkillInstance {
  return {
    ...skill,
    currentCooldown: skill.cooldown,
    available: false
  }
}

/**
 * 减少技能冷却
 */
export function reduceSkillCooldown(skill: SkillInstance): SkillInstance {
  if (skill.currentCooldown > 0) {
    const newCooldown = skill.currentCooldown - 1
    return {
      ...skill,
      currentCooldown: newCooldown,
      available: newCooldown === 0
    }
  }
  return skill
}

/**
 * 计算技能伤害
 */
export function calculateSkillDamage(
  skill: SkillConfig,
  attackerMag: number,
  defenderRes: number,
  skillLevel: number
): number {
  if (skill.type === 'physical') {
    // 物理技能使用攻击力
    const baseDamage = attackerMag * 0.8 // 假设攻击力的 80% 作为基础
    const damage = baseDamage * (skill.damageMultiplier || 1)
    return Math.max(1, Math.floor(damage))
  } else if (skill.type === 'magical') {
    // 法术技能
    const skillTerm = Math.pow(skillLevel, 2) / 120 + skillLevel * 1.5 + 30
    const baseDamage = (skillTerm + attackerMag - defenderRes) * (skill.damageMultiplier || 1)
    return Math.max(1, Math.floor(baseDamage))
  }
  return 0
}

/**
 * 计算技能治疗量
 */
export function calculateSkillHeal(
  skill: SkillConfig,
  casterMag: number,
  casterLevel: number
): number {
  const baseHeal = casterMag * 2 + casterLevel * 5
  const heal = baseHeal * (skill.healMultiplier || 1)
  return Math.max(1, Math.floor(heal))
}
