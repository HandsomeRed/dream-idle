// v0.94 阵法系统类型定义

export type StatType = 
  | 'damage'      // 伤害
  | 'defense'     // 防御
  | 'speed'       // 速度
  | 'magic'       // 灵力
  | 'sealHit'     // 封印命中
  | 'sealResist'  // 抗封
  | 'crit'        // 暴击
  | 'critResist'; // 抗暴

export interface FormationBonus {
  position: number; // 1-5 (1=队长位)
  stat: StatType;
  value: number; // 百分比加成 (如 15 表示 15%)
}

export interface Formation {
  id: string;
  name: string;
  description: string;
  level: number; // 1-20
  exp: number;
  maxLevel: number;
  bonuses: FormationBonus[];
  icon?: string;
}

export interface FormationMatchup {
  formationId: string;
  strongAgainst: string[]; // 克制的阵法 ID
  weakAgainst: string[]; // 被克制的阵法 ID
}

export interface FormationConfig {
  positionMultiplier: Record<number, number>; // 位置系数
  baseExpPerLevel: number; // 每级所需基础经验
  expGrowthRate: number; // 经验成长率
  maxLevel: number; // 最高等级
}

export interface PlayerFormation {
  formationId: string;
  level: number;
  exp: number;
  unlocked: boolean;
}

export interface ActiveFormation {
  formationId: string;
  positions: Record<number, string>; // position -> playerId
  effects: FormationBonus[];
}
