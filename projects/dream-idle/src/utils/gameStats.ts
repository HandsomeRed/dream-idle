// 游戏数值配置和计算公式

/**
 * 门派基础属性配置
 */
export interface JobBaseStats {
  hp: number;      // 气血
  mp: number;      // 魔法
  attack: number;  // 攻击
  defense: number; // 防御
  speed: number;   // 速度
  mag: number;     // 法伤
  res: number;     // 法防
}

/**
 * 角色属性
 */
export interface CharacterStats {
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  mag: number;
  res: number;
  job: string;
}

/**
 * 门派配置
 */
export const JOB_CONFIGS: Record<string, { base: JobBaseStats; growth: JobBaseStats }> = {
  '剑侠客': {
    base: { hp: 100, mp: 50, attack: 15, defense: 10, speed: 8, mag: 8, res: 10 },
    growth: { hp: 10, mp: 6, attack: 3, defense: 2, speed: 0.5, mag: 2, res: 1.5 }
  },
  '骨精灵': {
    base: { hp: 80, mp: 80, attack: 12, defense: 8, speed: 12, mag: 15, res: 12 },
    growth: { hp: 8, mp: 8, attack: 2, defense: 1.5, speed: 1, mag: 3, res: 2 }
  },
  '龙太子': {
    base: { hp: 90, mp: 70, attack: 14, defense: 9, speed: 10, mag: 12, res: 11 },
    growth: { hp: 9, mp: 7, attack: 2.5, defense: 1.8, speed: 0.8, mag: 2.5, res: 1.8 }
  },
  '狐美人': {
    base: { hp: 85, mp: 75, attack: 13, defense: 8, speed: 11, mag: 14, res: 12 },
    growth: { hp: 8.5, mp: 7.5, attack: 2.2, defense: 1.6, speed: 0.9, mag: 2.8, res: 1.9 }
  }
};

/**
 * 计算升级所需经验
 * 公式：EXP = 100 × level^2.5
 */
export function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 2.3)); // 调整指数让成长更平滑
}

/**
 * 计算属性值
 * 公式：属性 = 基础值 + 等级 × 成长 + 点数 × 系数
 */
export function calcStat(
  base: number,
  growth: number,
  level: number,
  points: number = 0,
  pointsFactor: number = 1
): number {
  return base + level * growth + points * pointsFactor; // 不取整，保留小数
}

/**
 * 计算角色属性（给定等级）
 */
export function calculateStatsAtLevel(job: string, level: number): CharacterStats {
  const config = JOB_CONFIGS[job];
  if (!config) {
    throw new Error(`Unknown job: ${job}`);
  }

  const { base, growth } = config;

  return {
    level,
    exp: 0,
    maxHp: calcStat(base.hp, growth.hp, level),
    hp: calcStat(base.hp, growth.hp, level),
    maxMp: calcStat(base.mp, growth.mp, level),
    mp: calcStat(base.mp, growth.mp, level),
    attack: calcStat(base.attack, growth.attack, level),
    defense: calcStat(base.defense, growth.defense, level),
    speed: calcStat(base.speed, growth.speed, level),
    mag: calcStat(base.mag, growth.mag, level),
    res: calcStat(base.res, growth.res, level),
    job
  };
}

/**
 * 计算物理伤害
 * 公式：伤害 = (攻击 - 防御) × 暴击系数
 */
export function calcPhysicalDamage(atk: number, def: number, isCrit: boolean = false): number {
  let base = atk - def;
  if (isCrit) {
    base *= 2;
  }
  return Math.max(1, Math.floor(base));
}

/**
 * 计算法术伤害
 * 公式：伤害 = (师门技能项 + 法伤 - 法防) × 分灵系数
 * 师门技能项 = 技能等级² / 120 + 技能等级 × 1.5 + 30
 */
export function calcMagicalDamage(
  skillLevel: number,
  mag: number,
  res: number,
  targetCount: number = 1
): number {
  // 师门技能项（使用神木林公式）
  const skillTerm = Math.pow(skillLevel, 2) / 120 + skillLevel * 1.5 + 30;
  
  // 分灵系数（群体法术衰减）
  const splitFactor = Math.max(0.5, 1 - targetCount * 0.1);
  
  const base = (skillTerm + mag - res) * splitFactor;
  return Math.max(1, Math.floor(base));
}

/**
 * 计算暴击率
 * 公式：暴击率 = 基础 5% + 等级 × 0.1%
 */
export function calcCritRate(level: number): number {
  return 0.05 + level * 0.001;
}

/**
 * 检查是否暴击
 */
export function isCritHit(level: number): boolean {
  return Math.random() < calcCritRate(level);
}

/**
 * 获取出手顺序（速度高的先手）
 */
export function getTurnOrder<T extends { speed: number }>(combatants: T[]): T[] {
  return [...combatants].sort((a, b) => b.speed - a.speed);
}
