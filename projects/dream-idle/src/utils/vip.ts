/**
 * v0.35 VIP 系统
 * 
 * 功能：
 * - VIP 等级系统（1-15 级）
 * - VIP 经验获取
 * - VIP 特权（离线收益加成、副本次数、等功能）
 * - 永久生效
 */

export interface VIPPerk {
  name: string;
  description: string;
  unlockedAtLevel: number;
  type: 'offline_bonus' | 'dungeon_entries' | 'arena_entries' | 'gold_bonus' | 'exp_bonus' | 'feature';
  value: number; // 加成百分比或数量
}

export interface VIPLevelInfo {
  level: number;
  requiredExp: number; // 累计所需 VIP 经验
  perks: VIPPerk[];
}

export interface VIPState {
  level: number;
  exp: number;
  totalExpEarned: number;
  unlockedPerks: string[];
}

/**
 * VIP 等级配置
 */
export const VIP_LEVELS: VIPLevelInfo[] = [
  {
    level: 0,
    requiredExp: 0,
    perks: []
  },
  {
    level: 1,
    requiredExp: 100,
    perks: [
      { name: '离线收益 +5%', description: '离线收益增加 5%', unlockedAtLevel: 1, type: 'offline_bonus', value: 5 }
    ]
  },
  {
    level: 2,
    requiredExp: 300,
    perks: [
      { name: '离线收益 +10%', description: '离线收益增加 10%', unlockedAtLevel: 2, type: 'offline_bonus', value: 10 },
      { name: '副本 +1 次', description: '每日副本次数 +1', unlockedAtLevel: 2, type: 'dungeon_entries', value: 1 }
    ]
  },
  {
    level: 3,
    requiredExp: 600,
    perks: [
      { name: '离线收益 +15%', description: '离线收益增加 15%', unlockedAtLevel: 3, type: 'offline_bonus', value: 15 },
      { name: '金币 +5%', description: '战斗金币收益 +5%', unlockedAtLevel: 3, type: 'gold_bonus', value: 5 }
    ]
  },
  {
    level: 4,
    requiredExp: 1000,
    perks: [
      { name: '离线收益 +20%', description: '离线收益增加 20%', unlockedAtLevel: 4, type: 'offline_bonus', value: 20 },
      { name: '经验 +5%', description: '角色经验获取 +5%', unlockedAtLevel: 4, type: 'exp_bonus', value: 5 }
    ]
  },
  {
    level: 5,
    requiredExp: 1500,
    perks: [
      { name: '离线收益 +25%', description: '离线收益增加 25%', unlockedAtLevel: 5, type: 'offline_bonus', value: 25 },
      { name: '副本 +2 次', description: '每日副本次数 +2', unlockedAtLevel: 5, type: 'dungeon_entries', value: 2 },
      { name: '竞技场 +1 次', description: '每日竞技场次数 +1', unlockedAtLevel: 5, type: 'arena_entries', value: 1 }
    ]
  },
  {
    level: 6,
    requiredExp: 2200,
    perks: [
      { name: '离线收益 +30%', description: '离线收益增加 30%', unlockedAtLevel: 6, type: 'offline_bonus', value: 30 },
      { name: '金币 +10%', description: '战斗金币收益 +10%', unlockedAtLevel: 6, type: 'gold_bonus', value: 10 }
    ]
  },
  {
    level: 7,
    requiredExp: 3000,
    perks: [
      { name: '离线收益 +35%', description: '离线收益增加 35%', unlockedAtLevel: 7, type: 'offline_bonus', value: 35 },
      { name: '经验 +10%', description: '角色经验获取 +10%', unlockedAtLevel: 7, type: 'exp_bonus', value: 10 }
    ]
  },
  {
    level: 8,
    requiredExp: 4000,
    perks: [
      { name: '离线收益 +40%', description: '离线收益增加 40%', unlockedAtLevel: 8, type: 'offline_bonus', value: 40 },
      { name: '副本 +3 次', description: '每日副本次数 +3', unlockedAtLevel: 8, type: 'dungeon_entries', value: 3 }
    ]
  },
  {
    level: 9,
    requiredExp: 5200,
    perks: [
      { name: '离线收益 +45%', description: '离线收益增加 45%', unlockedAtLevel: 9, type: 'offline_bonus', value: 45 },
      { name: '金币 +15%', description: '战斗金币收益 +15%', unlockedAtLevel: 9, type: 'gold_bonus', value: 15 }
    ]
  },
  {
    level: 10,
    requiredExp: 6600,
    perks: [
      { name: '离线收益 +50%', description: '离线收益增加 50%', unlockedAtLevel: 10, type: 'offline_bonus', value: 50 },
      { name: '经验 +15%', description: '角色经验获取 +15%', unlockedAtLevel: 10, type: 'exp_bonus', value: 15 },
      { name: '竞技场 +2 次', description: '每日竞技场次数 +2', unlockedAtLevel: 10, type: 'arena_entries', value: 2 }
    ]
  },
  {
    level: 11,
    requiredExp: 8200,
    perks: [
      { name: '离线收益 +55%', description: '离线收益增加 55%', unlockedAtLevel: 11, type: 'offline_bonus', value: 55 },
      { name: '金币 +20%', description: '战斗金币收益 +20%', unlockedAtLevel: 11, type: 'gold_bonus', value: 20 }
    ]
  },
  {
    level: 12,
    requiredExp: 10000,
    perks: [
      { name: '离线收益 +60%', description: '离线收益增加 60%', unlockedAtLevel: 12, type: 'offline_bonus', value: 60 },
      { name: '副本 +4 次', description: '每日副本次数 +4', unlockedAtLevel: 12, type: 'dungeon_entries', value: 4 }
    ]
  },
  {
    level: 13,
    requiredExp: 12000,
    perks: [
      { name: '离线收益 +65%', description: '离线收益增加 65%', unlockedAtLevel: 13, type: 'offline_bonus', value: 65 },
      { name: '经验 +20%', description: '角色经验获取 +20%', unlockedAtLevel: 13, type: 'exp_bonus', value: 20 }
    ]
  },
  {
    level: 14,
    requiredExp: 14500,
    perks: [
      { name: '离线收益 +70%', description: '离线收益增加 70%', unlockedAtLevel: 14, type: 'offline_bonus', value: 70 },
      { name: '金币 +25%', description: '战斗金币收益 +25%', unlockedAtLevel: 14, type: 'gold_bonus', value: 25 }
    ]
  },
  {
    level: 15,
    requiredExp: 17500,
    perks: [
      { name: '离线收益 +75%', description: '离线收益增加 75%', unlockedAtLevel: 15, type: 'offline_bonus', value: 75 },
      { name: '经验 +25%', description: '角色经验获取 +25%', unlockedAtLevel: 15, type: 'exp_bonus', value: 25 },
      { name: '金币 +30%', description: '战斗金币收益 +30%', unlockedAtLevel: 15, type: 'gold_bonus', value: 30 },
      { name: '副本 +5 次', description: '每日副本次数 +5', unlockedAtLevel: 15, type: 'dungeon_entries', value: 5 },
      { name: '竞技场 +3 次', description: '每日竞技场次数 +3', unlockedAtLevel: 15, type: 'arena_entries', value: 3 }
    ]
  }
];

/**
 * 获取 VIP 等级名称
 */
export function getVIPLevelName(level: number): string {
  const names = [
    '平民', 'VIP1', 'VIP2', 'VIP3', 'VIP4', 'VIP5',
    'VIP6', 'VIP7', 'VIP8', 'VIP9', 'VIP10',
    'VIP11', 'VIP12', 'VIP13', 'VIP14', 'VIP15'
  ];
  return names[Math.min(level, 15)] || '平民';
}

/**
 * 获取 VIP 等级颜色
 */
export function getVIPLevelColor(level: number): string {
  if (level === 0) return 'text-gray-500';
  if (level <= 3) return 'text-green-500';
  if (level <= 6) return 'text-blue-500';
  if (level <= 9) return 'text-purple-500';
  if (level <= 12) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * 初始化 VIP 状态
 */
export function initializeVIPState(): VIPState {
  return {
    level: 0,
    exp: 0,
    totalExpEarned: 0,
    unlockedPerks: []
  };
}

/**
 * 根据经验计算 VIP 等级
 */
export function calculateVIPLvlFromExp(exp: number): number {
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (exp >= VIP_LEVELS[i].requiredExp) {
      return i;
    }
  }
  return 0;
}

/**
 * 获取下一级所需经验
 */
export function getExpToNextLevel(currentExp: number): number {
  const currentLevel = calculateVIPLvlFromExp(currentExp);
  if (currentLevel >= 15) {
    return 0; // 已满级
  }
  const nextLevel = VIP_LEVELS[currentLevel + 1];
  return nextLevel.requiredExp - currentExp;
}

/**
 * 获取当前等级的进度百分比
 */
export function getVIPProgress(currentExp: number): number {
  const currentLevel = calculateVIPLvlFromExp(currentExp);
  if (currentLevel >= 15) {
    return 100;
  }
  
  const prevLevelExp = VIP_LEVELS[currentLevel].requiredExp;
  const nextLevelExp = VIP_LEVELS[currentLevel + 1].requiredExp;
  const progress = ((currentExp - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * 添加 VIP 经验
 */
export function addVIPExp(state: VIPState, exp: number): { leveledUp: boolean; newLevel: number } {
  const oldLevel = state.level;
  state.totalExpEarned += exp;
  state.exp += exp;
  state.level = calculateVIPLvlFromExp(state.exp);
  
  // 更新解锁的特权
  state.unlockedPerks = [];
  for (let i = 1; i <= state.level; i++) {
    VIP_LEVELS[i].perks.forEach(perk => {
      if (!state.unlockedPerks.includes(perk.name)) {
        state.unlockedPerks.push(perk.name);
      }
    });
  }
  
  return {
    leveledUp: state.level > oldLevel,
    newLevel: state.level
  };
}

/**
 * 获取离线收益加成百分比
 */
export function getOfflineBonusPercent(state: VIPState): number {
  let bonus = 0;
  for (let i = 1; i <= state.level; i++) {
    VIP_LEVELS[i].perks.forEach(perk => {
      if (perk.type === 'offline_bonus') {
        bonus = Math.max(bonus, perk.value);
      }
    });
  }
  return bonus;
}

/**
 * 获取金币加成百分比
 */
export function getGoldBonusPercent(state: VIPState): number {
  let bonus = 0;
  for (let i = 1; i <= state.level; i++) {
    VIP_LEVELS[i].perks.forEach(perk => {
      if (perk.type === 'gold_bonus') {
        bonus = Math.max(bonus, perk.value);
      }
    });
  }
  return bonus;
}

/**
 * 获取经验加成百分比
 */
export function getExpBonusPercent(state: VIPState): number {
  let bonus = 0;
  for (let i = 1; i <= state.level; i++) {
    VIP_LEVELS[i].perks.forEach(perk => {
      if (perk.type === 'exp_bonus') {
        bonus = Math.max(bonus, perk.value);
      }
    });
  }
  return bonus;
}

/**
 * 获取额外副本次数
 */
export function getExtraDungeonEntries(state: VIPState): number {
  let extra = 0;
  for (let i = 1; i <= state.level; i++) {
    VIP_LEVELS[i].perks.forEach(perk => {
      if (perk.type === 'dungeon_entries') {
        extra = Math.max(extra, perk.value);
      }
    });
  }
  return extra;
}

/**
 * 获取额外竞技场次数
 */
export function getExtraArenaEntries(state: VIPState): number {
  let extra = 0;
  for (let i = 1; i <= state.level; i++) {
    VIP_LEVELS[i].perks.forEach(perk => {
      if (perk.type === 'arena_entries') {
        extra = Math.max(extra, perk.value);
      }
    });
  }
  return extra;
}

/**
 * 获取所有已解锁特权
 */
export function getUnlockedPerks(state: VIPState): VIPPerk[] {
  const perks: VIPPerk[] = [];
  for (let i = 1; i <= state.level; i++) {
    perks.push(...VIP_LEVELS[i].perks);
  }
  return perks;
}

/**
 * 保存 VIP 状态到 localStorage
 */
export function saveVIPState(state: VIPState): void {
  localStorage.setItem('dream-idle-vip', JSON.stringify(state));
}

/**
 * 从 localStorage 加载 VIP 状态
 */
export function loadVIPState(): VIPState {
  const saved = localStorage.getItem('dream-idle-vip');
  if (saved) {
    return JSON.parse(saved);
  }
  return initializeVIPState();
}

/**
 * 通过充值获得 VIP 经验（模拟）
 * 实际游戏中可以通过钻石购买、月卡等方式获得
 */
export function purchaseVIPExp(amount: number): number {
  // 1 钻石 = 1 VIP 经验（可调整）
  return amount;
}

/**
 * 通过日常活动获得 VIP 经验
 */
export function getDailyActivityExp(activityType: string): number {
  const expMap: Record<string, number> = {
    'daily_login': 10,
    'complete_daily_quest': 5,
    'complete_achievement': 20,
    'tower_floor_100': 50,
    'arena_top_100': 100,
    'first_purchase': 200
  };
  return expMap[activityType] || 0;
}
