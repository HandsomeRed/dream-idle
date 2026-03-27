/**
 * v0.88 经脉系统 (Meridian System)
 * 打通经脉获得属性加成，修炼内功心法，提升战斗力
 */

export interface Meridian {
  id: string;
  name: string; // 经脉名称
  type: MeridianType;
  points: MeridianPoint[]; // 穴位
  unlocked: boolean; // 是否解锁
  activated: boolean; // 是否激活
  level: number; // 经脉等级
  exp: number;
  maxExp: number;
}

export interface MeridianPoint {
  id: string;
  name: string; // 穴位名称
  unlocked: boolean;
  activated: boolean;
  cost: number; // 打通消耗
  bonus: AttributeBonus;
}

export interface AttributeBonus {
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  crit?: number;
  dodge?: number;
}

export type MeridianType = 'ren' | 'du' | 'hand' | 'foot' | 'body'; // 任脉/督脉/手三阴/足三阳/带脉

export interface CultivationMethod {
  id: string;
  name: string; // 心法名称
  type: CultivationType;
  level: number;
  exp: number;
  maxExp: number;
  bonus: AttributeBonus;
  specialEffect?: string;
}

export type CultivationType = 'internal' | 'external' | 'lightness' | 'sword'; // 内功/外功/轻功/剑法

export interface CultivationConfig {
  baseCost: number; // 基础修炼消耗
  dailyLimit: number; // 每日修炼次数限制
  breakthroughChance: number; // 突破概率
}

export const CULTIVATION_CONFIG: CultivationConfig = {
  baseCost: 50,
  dailyLimit: 10,
  breakthroughChance: 0.3,
};

// 经脉数据库
export const MERIDIANS: Meridian[] = [
  // 任脉
  {
    id: 'ren_1',
    name: '任脉',
    type: 'ren',
    unlocked: false,
    activated: false,
    level: 0,
    exp: 0,
    maxExp: 1000,
    points: [
      { id: 'ren_p1', name: '会阴穴', unlocked: false, activated: false, cost: 100, bonus: { health: 50 } },
      { id: 'ren_p2', name: '关元穴', unlocked: false, activated: false, cost: 200, bonus: { health: 100, defense: 20 } },
      { id: 'ren_p3', name: '气海穴', unlocked: false, activated: false, cost: 300, bonus: { health: 150, attack: 30 } },
      { id: 'ren_p4', name: '膻中穴', unlocked: false, activated: false, cost: 500, bonus: { health: 200, attack: 50, defense: 30 } },
    ],
  },
  // 督脉
  {
    id: 'du_1',
    name: '督脉',
    type: 'du',
    unlocked: false,
    activated: false,
    level: 0,
    exp: 0,
    maxExp: 1000,
    points: [
      { id: 'du_p1', name: '长强穴', unlocked: false, activated: false, cost: 100, bonus: { attack: 30 } },
      { id: 'du_p2', name: '命门穴', unlocked: false, activated: false, cost: 200, bonus: { attack: 60, health: 50 } },
      { id: 'du_p3', name: '脊中穴', unlocked: false, activated: false, cost: 300, bonus: { attack: 90, defense: 30 } },
      { id: 'du_p4', name: '百会穴', unlocked: false, activated: false, cost: 500, bonus: { attack: 120, crit: 5, speed: 10 } },
    ],
  },
  // 手三阴
  {
    id: 'hand_1',
    name: '手三阴',
    type: 'hand',
    unlocked: false,
    activated: false,
    level: 0,
    exp: 0,
    maxExp: 800,
    points: [
      { id: 'hand_p1', name: '少商穴', unlocked: false, activated: false, cost: 80, bonus: { attack: 20 } },
      { id: 'hand_p2', name: '鱼际穴', unlocked: false, activated: false, cost: 150, bonus: { attack: 40, speed: 5 } },
      { id: 'hand_p3', name: '太渊穴', unlocked: false, activated: false, cost: 250, bonus: { attack: 60, crit: 3 } },
    ],
  },
  // 足三阳
  {
    id: 'foot_1',
    name: '足三阳',
    type: 'foot',
    unlocked: false,
    activated: false,
    level: 0,
    exp: 0,
    maxExp: 800,
    points: [
      { id: 'foot_p1', name: '涌泉穴', unlocked: false, activated: false, cost: 80, bonus: { defense: 20, health: 30 } },
      { id: 'foot_p2', name: '太溪穴', unlocked: false, activated: false, cost: 150, bonus: { defense: 40, health: 60 } },
      { id: 'foot_p3', name: '昆仑穴', unlocked: false, activated: false, cost: 250, bonus: { defense: 60, dodge: 3 } },
    ],
  },
  // 带脉
  {
    id: 'body_1',
    name: '带脉',
    type: 'body',
    unlocked: false,
    activated: false,
    level: 0,
    exp: 0,
    maxExp: 1200,
    points: [
      { id: 'body_p1', name: '带脉穴', unlocked: false, activated: false, cost: 150, bonus: { defense: 30, health: 50 } },
      { id: 'body_p2', name: '五枢穴', unlocked: false, activated: false, cost: 300, bonus: { defense: 60, health: 100 } },
      { id: 'body_p3', name: '维道穴', unlocked: false, activated: false, cost: 500, bonus: { defense: 90, dodge: 5 } },
      { id: 'body_p4', name: '章门穴', unlocked: false, activated: false, cost: 800, bonus: { defense: 120, health: 150, dodge: 8 } },
    ],
  },
];

// 内功心法数据库
export const CULTIVATION_METHODS: CultivationMethod[] = [
  { id: 'cm_1', name: '九阳神功', type: 'internal', level: 0, exp: 0, maxExp: 5000, bonus: { health: 200, defense: 50 }, specialEffect: '阳刚内力，抗暴击 +10%' },
  { id: 'cm_2', name: '九阴真经', type: 'internal', level: 0, exp: 0, maxExp: 5000, bonus: { attack: 100, crit: 8 }, specialEffect: '阴柔内力，暴击伤害 +20%' },
  { id: 'cm_3', name: '易筋经', type: 'external', level: 0, exp: 0, maxExp: 6000, bonus: { defense: 150, health: 300 }, specialEffect: '洗髓易筋，全属性 +5%' },
  { id: 'cm_4', name: '北冥神功', type: 'internal', level: 0, exp: 0, maxExp: 7000, bonus: { attack: 150, health: 200 }, specialEffect: '吸星大法，击杀回复 5% 气血' },
  { id: 'cm_5', name: '凌波微步', type: 'lightness', level: 0, exp: 0, maxExp: 4000, bonus: { speed: 50, dodge: 15 }, specialEffect: '踏波而行，闪避 +15%' },
  { id: 'cm_6', name: '独孤九剑', type: 'sword', level: 0, exp: 0, maxExp: 8000, bonus: { attack: 200, crit: 12 }, specialEffect: '破尽天下武功，无视 20% 防御' },
];

// 创建玩家经脉系统
export function createMeridianSystem(): Meridian[] {
  return MERIDIANS.map(m => ({ ...m, points: m.points.map(p => ({ ...p })) }));
}

// 创建玩家心法列表
export function createCultivationMethods(): CultivationMethod[] {
  return CULTIVATION_METHODS.map(cm => ({ ...cm }));
}

// 解锁经脉
export function unlockMeridian(meridians: Meridian[], meridianId: string, cost: number): { success: boolean; message: string } {
  const meridian = meridians.find(m => m.id === meridianId);
  
  if (!meridian) {
    return { success: false, message: '经脉不存在' };
  }
  
  if (meridian.unlocked) {
    return { success: false, message: '经脉已解锁' };
  }
  
  meridian.unlocked = true;
  return { success: true, message: `解锁${meridian.name}！` };
}

// 打通穴位
export function activatePoint(meridians: Meridian[], meridianId: string, pointId: string): { success: boolean; message: string; bonus?: AttributeBonus } {
  const meridian = meridians.find(m => m.id === meridianId);
  
  if (!meridian || !meridian.unlocked) {
    return { success: false, message: '经脉未解锁' };
  }
  
  const point = meridian.points.find(p => p.id === pointId);
  
  if (!point) {
    return { success: false, message: '穴位不存在' };
  }
  
  if (point.activated) {
    return { success: false, message: '穴位已打通' };
  }
  
  point.activated = true;
  meridian.exp += point.cost;
  
  if (meridian.exp >= meridian.maxExp) {
    meridian.level += 1;
    meridian.exp = 0;
    meridian.maxExp = Math.floor(meridian.maxExp * 1.5);
  }
  
  return { success: true, message: `打通${point.name}！`, bonus: point.bonus };
}

// 修炼心法
export function cultivateMethod(methods: CultivationMethod[], methodId: string, expGain: number): { success: boolean; message: string; leveledUp?: boolean } {
  const method = methods.find(m => m.id === methodId);
  
  if (!method) {
    return { success: false, message: '心法不存在' };
  }
  
  method.exp += expGain;
  
  if (method.exp >= method.maxExp) {
    method.level += 1;
    method.exp = 0;
    method.maxExp = Math.floor(method.maxExp * 1.5);
    
    // 升级时增强属性
    Object.keys(method.bonus).forEach(key => {
      const k = key as keyof AttributeBonus;
      if (method.bonus[k]) {
        method.bonus[k]! = Math.floor(method.bonus[k]! * 1.2);
      }
    });
    
    return { success: true, message: `${method.name}升级到${method.level}层！`, leveledUp: true };
  }
  
  return { success: true, message: `修炼${method.name}，获得${expGain}经验` };
}

// 获取经脉总加成
export function getMeridianBonuses(meridians: Meridian[]): AttributeBonus {
  const total: AttributeBonus = {};
  
  meridians.forEach(meridian => {
    meridian.points.forEach(point => {
      if (point.activated) {
        Object.keys(point.bonus).forEach(key => {
          const k = key as keyof AttributeBonus;
          total[k] = (total[k] || 0) + point.bonus[k]!;
        });
      }
    });
  });
  
  return total;
}

// 获取心法总加成
export function getCultivationBonuses(methods: CultivationMethod[]): AttributeBonus {
  const total: AttributeBonus = {};
  
  methods.forEach(method => {
    if (method.level > 0) {
      Object.keys(method.bonus).forEach(key => {
        const k = key as keyof AttributeBonus;
        total[k] = (total[k] || 0) + method.bonus[k]!;
      });
    }
  });
  
  return total;
}

// 获取总属性加成
export function getTotalBonuses(meridians: Meridian[], methods: CultivationMethod[]): {
  meridian: AttributeBonus;
  cultivation: AttributeBonus;
  total: AttributeBonus;
} {
  const meridianBonus = getMeridianBonuses(meridians);
  const cultivationBonus = getCultivationBonuses(methods);
  
  const total: AttributeBonus = {};
  
  [...Object.keys(meridianBonus), ...Object.keys(cultivationBonus)].forEach(key => {
    const k = key as keyof AttributeBonus;
    total[k] = (meridianBonus[k] || 0) + (cultivationBonus[k] || 0);
  });
  
  return { meridian: meridianBonus, cultivation: cultivationBonus, total };
}

// 尝试突破
export function attemptBreakthrough(method: CultivationMethod): { success: boolean; message: string; breakthrough?: boolean } {
  if (method.exp < method.maxExp * 0.9) {
    return { success: false, message: '经验不足，无法尝试突破' };
  }
  
  const breakthrough = Math.random() < CULTIVATION_CONFIG.breakthroughChance;
  
  if (breakthrough) {
    method.level += 1;
    method.exp = 0;
    method.maxExp = Math.floor(method.maxExp * 1.5);
    
    // 突破时大幅增强属性
    Object.keys(method.bonus).forEach(key => {
      const k = key as keyof AttributeBonus;
      if (method.bonus[k]) {
        method.bonus[k]! = Math.floor(method.bonus[k]! * 1.5);
      }
    });
    
    return { success: true, message: `突破成功！${method.name}达到${method.level}层！`, breakthrough: true };
  }
  
  return { success: true, message: '突破失败，但有所感悟', breakthrough: false };
}

// 获取经脉进度
export function getMeridianProgress(meridians: Meridian[]): {
  total: number;
  unlocked: number;
  activated: number;
  percentage: number;
} {
  const totalPoints = meridians.reduce((sum, m) => sum + m.points.length, 0);
  const activatedPoints = meridians.reduce((sum, m) => sum + m.points.filter(p => p.activated).length, 0);
  const unlockedMeridians = meridians.filter(m => m.unlocked).length;
  
  return {
    total: totalPoints,
    unlocked: unlockedMeridians,
    activated: activatedPoints,
    percentage: Math.floor((activatedPoints / totalPoints) * 100),
  };
}

// 获取心法进度
export function getCultivationProgress(methods: CultivationMethod[]): {
  total: number;
  learned: number;
  maxLevel: number;
  averageLevel: number;
} {
  const learned = methods.filter(m => m.level > 0).length;
  const totalLevels = methods.reduce((sum, m) => sum + m.level, 0);
  const maxLevel = Math.max(...methods.map(m => m.level), 0);
  
  return {
    total: methods.length,
    learned,
    maxLevel,
    averageLevel: learned > 0 ? Math.floor(totalLevels / learned) : 0,
  };
}

// 获取经脉名称
export function getMeridianTypeName(type: MeridianType): string {
  const names: Record<MeridianType, string> = {
    ren: '任脉',
    du: '督脉',
    hand: '手三阴',
    foot: '足三阳',
    body: '带脉',
  };
  return names[type];
}

// 获取心法类型名称
export function getCultivationTypeName(type: CultivationType): string {
  const names: Record<CultivationType, string> = {
    internal: '内功',
    external: '外功',
    lightness: '轻功',
    sword: '剑法',
  };
  return names[type];
}
