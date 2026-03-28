// v0.95 宠物内丹系统数据定义
import { InnerDan, InnerDanConfig } from '../types/innerDan';

// 内丹配置
export const INNER_DAN_CONFIG: InnerDanConfig = {
  lowSlots: 3,
  highSlots: 1,
  maxLowLevel: 4,
  maxHighLevel: 5,
  baseExpPerLevel: 50,
  expGrowthRate: 1.5,
};

// 低级内丹 (1-4 级)
export const LOW_INNER_DANS: InnerDan[] = [
  {
    id: 'jiao_jian',
    name: '矫健',
    type: 'low',
    level: 1,
    exp: 0,
    maxLevel: 4,
    effect: {
      stat: 'hp',
      value: 10, // 每级 +10%
    },
    description: '气血提升，每级增加 10% 最大气血',
  },
  {
    id: 'jing_yue',
    name: '静岳',
    type: 'low',
    level: 1,
    exp: 0,
    maxLevel: 4,
    effect: {
      stat: 'mp',
      value: 10,
    },
    description: '魔法提升，每级增加 10% 最大魔法',
  },
  {
    id: 'ling_dong',
    name: '灵动',
    type: 'low',
    level: 1,
    exp: 0,
    maxLevel: 4,
    effect: {
      stat: 'magic',
      value: 10,
    },
    description: '灵力提升，每级增加 10% 灵力',
  },
  {
    id: 'jian_jia',
    name: '坚甲',
    type: 'low',
    level: 1,
    exp: 0,
    maxLevel: 4,
    effect: {
      stat: 'defense',
      value: 10,
    },
    description: '防御提升，每级增加 10% 防御',
  },
  {
    id: 'xun_min',
    name: '迅敏',
    type: 'low',
    level: 1,
    exp: 0,
    maxLevel: 4,
    effect: {
      stat: 'speed',
      value: 10,
    },
    description: '速度提升，每级增加 10% 速度',
  },
  {
    id: 'bao_li',
    name: '暴戾',
    type: 'low',
    level: 1,
    exp: 0,
    maxLevel: 4,
    effect: {
      stat: 'damage',
      value: 10,
    },
    description: '伤害提升，每级增加 10% 伤害',
  },
  {
    id: 'zhen_feng',
    name: '针锋',
    type: 'low',
    level: 1,
    exp: 0,
    maxLevel: 4,
    effect: {
      stat: 'hit',
      value: 10,
    },
    description: '命中提升，每级增加 10% 命中',
  },
  {
    id: 'yu_kong',
    name: '御空',
    type: 'low',
    level: 1,
    exp: 0,
    maxLevel: 4,
    effect: {
      stat: 'speed',
      value: 15, // 飞行单位专属，加成更高
    },
    description: '飞行单位专属，速度提升 15%/30%/45%/60%',
  },
];

// 高级内丹 (1-5 层)
export const HIGH_INNER_DANS: InnerDan[] = [
  {
    id: 'she_shen_ji',
    name: '舍身击',
    type: 'high',
    level: 1,
    exp: 0,
    maxLevel: 5,
    effect: {
      trigger: 'physicalHit',
      triggerChance: 1.0,
      special: {
        type: 'damageBoost',
        value: 20, // 每层 +20% 额外伤害
        description: '物理攻击时牺牲气血造成额外伤害',
      },
    },
    description: '物理攻击时牺牲 20% 气血，造成额外 20% 伤害',
  },
  {
    id: 'yin_shang',
    name: '阴伤',
    type: 'high',
    level: 1,
    exp: 0,
    maxLevel: 5,
    effect: {
      trigger: 'magicHit',
      triggerChance: 0.2, // 20% 概率
      special: {
        type: 'damageBoost',
        value: 15,
        description: '法术连击时增加伤害',
      },
    },
    description: '法术连击时 20% 概率增加 15% 伤害',
  },
  {
    id: 'lian_huan',
    name: '连环',
    type: 'high',
    level: 1,
    exp: 0,
    maxLevel: 5,
    effect: {
      trigger: 'physicalHit',
      triggerChance: 0.2,
      special: {
        type: 'damageBoost',
        value: 15,
        description: '物理连击时增加伤害',
      },
    },
    description: '物理连击时 20% 概率增加 15% 伤害',
  },
  {
    id: 'shen_you',
    name: '神佑复生',
    type: 'high',
    level: 1,
    exp: 0,
    maxLevel: 5,
    effect: {
      trigger: 'death',
      triggerChance: 0.1, // 10% 概率
      special: {
        type: 'revive',
        value: 30, // 复活后 30% 气血
        description: '死亡时概率复活',
      },
    },
    description: '死亡时 10% 概率复活，恢复 30% 气血',
  },
  {
    id: 'nu_ji',
    name: '怒击',
    type: 'high',
    level: 1,
    exp: 0,
    maxLevel: 5,
    effect: {
      trigger: 'firstTurn',
      triggerChance: 1.0,
      special: {
        type: 'damageBoost',
        value: 25,
        description: '首回合额外伤害',
      },
    },
    description: '首回合物理攻击增加 25% 伤害',
  },
  {
    id: 'dong_cha',
    name: '洞察',
    type: 'high',
    level: 1,
    exp: 0,
    maxLevel: 5,
    effect: {
      trigger: 'physicalHit',
      triggerChance: 1.0,
      special: {
        type: 'defenseIgnore',
        value: 15, // 无视 15% 防御
        description: '无视部分防御',
      },
    },
    description: '物理攻击无视目标 15% 防御',
  },
  {
    id: 'xi_xue',
    name: '吸血',
    type: 'high',
    level: 1,
    exp: 0,
    maxLevel: 5,
    effect: {
      trigger: 'physicalHit',
      triggerChance: 1.0,
      special: {
        type: 'heal',
        value: 20, // 吸血 20%
        description: '物理攻击吸血',
      },
    },
    description: '物理攻击时将 20% 伤害转化为气血',
  },
  {
    id: 'fa_shu_lian_ji',
    name: '法术连击',
    type: 'high',
    level: 1,
    exp: 0,
    maxLevel: 5,
    effect: {
      trigger: 'magicHit',
      triggerChance: 0.3, // 30% 概率
      special: {
        type: 'multiCast',
        value: 50, // 第二次伤害 50%
        description: '概率触发法术连击',
      },
    },
    description: '法术攻击时 30% 概率触发连击，第二次伤害 50%',
  },
];

// 内丹组合效果 (套装效果)
export const INNER_DAN_COMBINATIONS = [
  {
    danIds: ['jiao_jian', 'jian_jia', 'xun_min'],
    bonus: {
      stat: 'hp' as const,
      value: 5, // 额外 5% 气血
    },
    description: '矫健 + 坚甲 + 迅敏：额外 +5% 气血',
  },
  {
    danIds: ['ling_dong', 'jing_yue', 'bao_li'],
    bonus: {
      stat: 'magic' as const,
      value: 5,
    },
    description: '灵动 + 静岳 + 暴戾：额外 +5% 灵力',
  },
];

// 内丹经验计算公式
export function getInnerDanExpForLevel(level: number, isHigh: boolean = false): number {
  if (level <= 1) return 0;
  const maxLevel = isHigh ? INNER_DAN_CONFIG.maxHighLevel : INNER_DAN_CONFIG.maxLowLevel;
  if (level > maxLevel) return Infinity;
  
  return Math.floor(
    INNER_DAN_CONFIG.baseExpPerLevel * 
    Math.pow(INNER_DAN_CONFIG.expGrowthRate, level - 1)
  );
}

// 获取内丹效果值 (考虑等级)
export function getInnerDanEffectValue(dan: InnerDan): number {
  const baseValue = dan.effect.value || 0;
  const multiplier = dan.effect.stat ? dan.level : 1; // 属性类内丹每级提升
  return baseValue * multiplier;
}
