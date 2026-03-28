// v0.94 阵法系统数据定义
import { Formation, FormationMatchup, FormationConfig } from '../types/formation';

// 阵法配置
export const FORMATION_CONFIG: FormationConfig = {
  positionMultiplier: {
    1: 1.0,  // 队长位 100%
    2: 0.8,  // 2 号位 80%
    3: 0.6,  // 3 号位 60%
    4: 0.6,  // 4 号位 60%
    5: 0.6,  // 5 号位 60%
  },
  baseExpPerLevel: 100,
  expGrowthRate: 1.2,
  maxLevel: 20,
};

// 九大阵法数据
export const FORMATIONS: Formation[] = [
  {
    id: 'tian_fu',
    name: '天覆阵',
    description: '天阵主速，如天覆盖，全员速度大幅提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'speed', value: 15 },
      { position: 2, stat: 'speed', value: 15 },
      { position: 3, stat: 'speed', value: 15 },
      { position: 4, stat: 'speed', value: 15 },
      { position: 5, stat: 'speed', value: 15 },
      { position: 1, stat: 'damage', value: -5 },
      { position: 2, stat: 'damage', value: -5 },
      { position: 3, stat: 'damage', value: -5 },
      { position: 4, stat: 'damage', value: -5 },
      { position: 5, stat: 'damage', value: -5 },
    ],
  },
  {
    id: 'di_zai',
    name: '地载阵',
    description: '地阵主防，如地承载，全员防御大幅提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'defense', value: 20 },
      { position: 2, stat: 'defense', value: 20 },
      { position: 3, stat: 'defense', value: 20 },
      { position: 4, stat: 'defense', value: 20 },
      { position: 5, stat: 'defense', value: 20 },
      { position: 1, stat: 'speed', value: -10 },
      { position: 2, stat: 'speed', value: -10 },
      { position: 3, stat: 'speed', value: -10 },
      { position: 4, stat: 'speed', value: -10 },
      { position: 5, stat: 'speed', value: -10 },
    ],
  },
  {
    id: 'feng_yang',
    name: '风扬阵',
    description: '风阵主攻，如风飞扬，全员伤害大幅提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'damage', value: 15 },
      { position: 2, stat: 'damage', value: 15 },
      { position: 3, stat: 'damage', value: 15 },
      { position: 4, stat: 'damage', value: 15 },
      { position: 5, stat: 'damage', value: 15 },
      { position: 1, stat: 'defense', value: -10 },
      { position: 2, stat: 'defense', value: -10 },
      { position: 3, stat: 'defense', value: -10 },
      { position: 4, stat: 'defense', value: -10 },
      { position: 5, stat: 'defense', value: -10 },
    ],
  },
  {
    id: 'yun_chui',
    name: '云垂阵',
    description: '云阵主法，如云垂天，全员灵力大幅提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'magic', value: 20 },
      { position: 2, stat: 'magic', value: 20 },
      { position: 3, stat: 'magic', value: 20 },
      { position: 4, stat: 'magic', value: 20 },
      { position: 5, stat: 'magic', value: 20 },
      { position: 1, stat: 'speed', value: -5 },
      { position: 2, stat: 'speed', value: -5 },
      { position: 3, stat: 'speed', value: -5 },
      { position: 4, stat: 'speed', value: -5 },
      { position: 5, stat: 'speed', value: -5 },
    ],
  },
  {
    id: 'niao_xiang',
    name: '鸟翔阵',
    description: '鸟阵主速，如鸟飞翔，全员速度极大提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'speed', value: 25 },
      { position: 2, stat: 'speed', value: 25 },
      { position: 3, stat: 'speed', value: 25 },
      { position: 4, stat: 'speed', value: 25 },
      { position: 5, stat: 'speed', value: 25 },
      { position: 1, stat: 'defense', value: -15 },
      { position: 2, stat: 'defense', value: -15 },
      { position: 3, stat: 'defense', value: -15 },
      { position: 4, stat: 'defense', value: -15 },
      { position: 5, stat: 'defense', value: -15 },
    ],
  },
  {
    id: 'she_pan',
    name: '蛇蟠阵',
    description: '蛇阵主封，如蛇盘绕，全员封印命中提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'sealHit', value: 20 },
      { position: 2, stat: 'sealHit', value: 20 },
      { position: 3, stat: 'sealHit', value: 20 },
      { position: 4, stat: 'sealHit', value: 20 },
      { position: 5, stat: 'sealHit', value: 20 },
      { position: 1, stat: 'sealResist', value: -10 },
      { position: 2, stat: 'sealResist', value: -10 },
      { position: 3, stat: 'sealResist', value: -10 },
      { position: 4, stat: 'sealResist', value: -10 },
      { position: 5, stat: 'sealResist', value: -10 },
    ],
  },
  {
    id: 'hu_yi',
    name: '虎翼阵',
    description: '虎阵主攻，如虎添翼，全员伤害极大提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'damage', value: 20 },
      { position: 2, stat: 'damage', value: 20 },
      { position: 3, stat: 'damage', value: 20 },
      { position: 4, stat: 'damage', value: 20 },
      { position: 5, stat: 'damage', value: 20 },
      { position: 1, stat: 'speed', value: -10 },
      { position: 2, stat: 'speed', value: -10 },
      { position: 3, stat: 'speed', value: -10 },
      { position: 4, stat: 'speed', value: -10 },
      { position: 5, stat: 'speed', value: -10 },
    ],
  },
  {
    id: 'long_fei',
    name: '龙飞阵',
    description: '龙阵主法，如龙飞天，全员灵力极大提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'magic', value: 25 },
      { position: 2, stat: 'magic', value: 25 },
      { position: 3, stat: 'magic', value: 25 },
      { position: 4, stat: 'magic', value: 25 },
      { position: 5, stat: 'magic', value: 25 },
      { position: 1, stat: 'defense', value: -10 },
      { position: 2, stat: 'defense', value: -10 },
      { position: 3, stat: 'defense', value: -10 },
      { position: 4, stat: 'defense', value: -10 },
      { position: 5, stat: 'defense', value: -10 },
    ],
  },
  {
    id: 'lei_jue',
    name: '雷绝阵',
    description: '雷阵主暴，如雷绝天，全员暴击率提升',
    level: 1,
    exp: 0,
    maxLevel: 20,
    bonuses: [
      { position: 1, stat: 'crit', value: 15 },
      { position: 2, stat: 'crit', value: 15 },
      { position: 3, stat: 'crit', value: 15 },
      { position: 4, stat: 'crit', value: 15 },
      { position: 5, stat: 'crit', value: 15 },
      { position: 1, stat: 'critResist', value: -10 },
      { position: 2, stat: 'critResist', value: -10 },
      { position: 3, stat: 'critResist', value: -10 },
      { position: 4, stat: 'critResist', value: -10 },
      { position: 5, stat: 'critResist', value: -10 },
    ],
  },
];

// 阵法克制关系 (经典梦幻西游克制)
// 天>地>风>云>鸟>蛇>虎>龙>雷>天 (循环克制)
export const FORMATION_MATCHUPS: FormationMatchup[] = [
  { 
    formationId: 'tian_fu', 
    strongAgainst: ['di_zai'], 
    weakAgainst: ['lei_jue'] 
  },
  { 
    formationId: 'di_zai', 
    strongAgainst: ['feng_yang'], 
    weakAgainst: ['tian_fu'] 
  },
  { 
    formationId: 'feng_yang', 
    strongAgainst: ['yun_chui'], 
    weakAgainst: ['di_zai'] 
  },
  { 
    formationId: 'yun_chui', 
    strongAgainst: ['niao_xiang'], 
    weakAgainst: ['feng_yang'] 
  },
  { 
    formationId: 'niao_xiang', 
    strongAgainst: ['she_pan'], 
    weakAgainst: ['yun_chui'] 
  },
  { 
    formationId: 'she_pan', 
    strongAgainst: ['hu_yi'], 
    weakAgainst: ['niao_xiang'] 
  },
  { 
    formationId: 'hu_yi', 
    strongAgainst: ['long_fei'], 
    weakAgainst: ['she_pan'] 
  },
  { 
    formationId: 'long_fei', 
    strongAgainst: ['lei_jue'], 
    weakAgainst: ['hu_yi'] 
  },
  { 
    formationId: 'lei_jue', 
    strongAgainst: ['tian_fu'], 
    weakAgainst: ['long_fei'] 
  },
];

// 阵法相克伤害系数
export const FORMATION_COUNTER_MULTIPLIER = 0.25; // 25% 伤害加成/减成
