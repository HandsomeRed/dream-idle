// v0.95 宠物内丹系统类型定义

export type StatType = 
  | 'hp'         // 气血
  | 'mp'         // 魔法
  | 'magic'      // 灵力
  | 'defense'    // 防御
  | 'speed'      // 速度
  | 'damage'     // 伤害
  | 'hit';       // 命中

export type TriggerType = 
  | 'physicalHit'    // 物理命中时
  | 'magicHit'       // 法术命中时
  | 'physicalCrit'   // 物理暴击时
  | 'magicCrit'      // 法术暴击时
  | 'killTarget'     // 击杀目标时
  | 'death'          // 死亡时
  | 'firstTurn'      // 首回合
  | 'everyTurn';     // 每回合

export type SpecialEffectType =
  | 'revive'         // 复活
  | 'heal'           // 治疗
  | 'damageBoost'    // 伤害加成
  | 'defenseIgnore'  // 无视防御
  | 'multiCast';     // 多次施法

export interface InnerDanEffect {
  // 属性加成类
  stat?: StatType;
  value?: number; // 百分比加成
  
  // 触发类效果
  trigger?: TriggerType;
  triggerChance?: number; // 触发概率 (0-1)
  
  // 特殊效果
  special?: {
    type: SpecialEffectType;
    value?: number;
    description: string;
  };
}

export interface InnerDan {
  id: string;
  name: string;
  type: 'low' | 'high'; // 低级/高级
  level: number; // 1-4 (低级) / 1-5 (高级)
  exp: number;
  maxLevel: number;
  effect: InnerDanEffect;
  description: string;
  icon?: string;
}

export interface PetInnerDanSlot {
  danId: string | null;
  level: number;
  exp: number;
}

export interface InnerDanConfig {
  lowSlots: number; // 低级内丹槽位 (3)
  highSlots: number; // 高级内丹槽位 (1)
  maxLowLevel: number; // 低级内丹最高等级 (4)
  maxHighLevel: number; // 高级内丹最高层数 (5)
  baseExpPerLevel: number;
  expGrowthRate: number;
}

export interface PetWithInnerDans {
  petId: string;
  lowSlots: PetInnerDanSlot[]; // 3 个低级槽位
  highSlot: PetInnerDanSlot | null; // 1 个高级槽位
}

export interface InnerDanCombination {
  danIds: string[];
  bonus: {
    stat: StatType;
    value: number;
  };
  description: string;
}
