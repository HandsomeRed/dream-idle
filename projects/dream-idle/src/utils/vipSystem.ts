// VIP 系统 - v0.77
// VIP System - 会员等级/特权/经验/每日奖励

/**
 * VIP 等级配置
 */
export interface VIPLevel {
  level: number;
  name: string;
  expRequired: number;
  privileges: VIPPrivilege[];
  icon: string;
  color: string;
}

/**
 * VIP 特权类型
 */
export type VIPPrivilege = 
  | 'dailyDiamond'      // 每日钻石
  | 'buyLimit'         // 购买次数 +
  | 'sweepCount'       // 扫荡次数 +
  | 'expBonus'         // 经验加成
  | 'goldBonus'        // 金币加成
  | 'skipBattle'       // 跳过战斗
  | 'autoBattle'       // 自动战斗
  | 'extraSweep'       // 额外扫荡
  | 'vipShop'          // VIP 商店
  | 'giftPack'         // 特权礼包
  | 'claimBonus'       // 一键领取
  | 'fastTrack'        // 快速通道;

/**
 * VIP 系统状态
 */
export interface VIPState {
  playerId: string;
  /** VIP 等级 */
  level: number;
  /** VIP 经验 */
  exp: number;
  /** 累计 VIP 经验 */
  totalExp: number;
  /** 今日是否已领钻石 */
  dailyDiamondClaimed: boolean;
  /** 今日是否已领礼包 */
  dailyGiftClaimed: boolean;
  /** 特权礼包领取状态 */
  giftPackClaimed: Record<number, boolean>;
  /** 累计充值 */
  totalRecharge: number;
  /** VIP 经验来源记录 */
  expHistory: VIPExpRecord[];
  /** 最后更新时间 */
  lastUpdateTime: number;
}

/**
 * VIP 经验记录
 */
export interface VIPExpRecord {
  amount: number;
  source: 'recharge' | 'task' | 'achievement' | 'gift';
  timestamp: number;
  description: string;
}

// ==================== VIP 等级配置 ====================

export const VIP_LEVELS: VIPLevel[] = [
  { level: 0, name: '平民', expRequired: 0, privileges: [], icon: '⭐', color: '#9e9e9e' },
  { level: 1, name: 'VIP1', expRequired: 100, privileges: ['dailyDiamond'], icon: '🥉', color: '#cd7f32' },
  { level: 2, name: 'VIP2', expRequired: 500, privileges: ['dailyDiamond', 'buyLimit'], icon: '🥈', color: '#c0c0c0' },
  { level: 3, name: 'VIP3', expRequired: 1000, privileges: ['dailyDiamond', 'buyLimit', 'expBonus'], icon: '🥇', color: '#ffd700' },
  { level: 4, name: 'VIP4', expRequired: 2000, privileges: ['dailyDiamond', 'buyLimit', 'expBonus', 'goldBonus'], icon: '💎', color: '#2196f3' },
  { level: 5, name: 'VIP5', expRequired: 5000, privileges: ['dailyDiamond', 'buyLimit', 'expBonus', 'goldBonus', 'sweepCount'], icon: '💎', color: '#9c27b0' },
  { level: 6, name: 'VIP6', expRequired: 10000, privileges: ['dailyDiamond', 'buyLimit', 'expBonus', 'goldBonus', 'sweepCount', 'skipBattle'], icon: '👑', color: '#ff5722' },
  { level: 7, name: 'VIP7', expRequired: 20000, privileges: ['dailyDiamond', 'buyLimit', 'expBonus', 'goldBonus', 'sweepCount', 'skipBattle', 'autoBattle'], icon: '👑', color: '#e91e63' },
  { level: 8, name: 'VIP8', expRequired: 50000, privileges: ['dailyDiamond', 'buyLimit', 'expBonus', 'goldBonus', 'sweepCount', 'skipBattle', 'autoBattle', 'vipShop'], icon: '🌟', color: '#ff9800' },
  { level: 9, name: 'VIP9', expRequired: 100000, privileges: ['dailyDiamond', 'buyLimit', 'expBonus', 'goldBonus', 'sweepCount', 'skipBattle', 'autoBattle', 'vipShop', 'giftPack'], icon: '🌟', color: '#795548' },
  { level: 10, name: 'VIP10', expRequired: 200000, privileges: ['dailyDiamond', 'buyLimit', 'expBonus', 'goldBonus', 'sweepCount', 'skipBattle', 'autoBattle', 'vipShop', 'giftPack', 'claimBonus'], icon: '✨', color: '#3f51b5' },
];

// ==================== 特权配置 ====================

export const PRIVILEGE_CONFIG: Record<VIPPrivilege, { name: string; description: string; value?: any }> = {
  dailyDiamond: { name: '每日钻石', description: '每日可领取钻石奖励', value: { amount: 50 } },
  buyLimit: { name: '购买次数 +', description: '商店购买次数 +1' },
  sweepCount: { name: '扫荡次数 +', description: '每日扫荡次数 +2' },
  expBonus: { name: '经验加成', description: '战斗经验 +10%', value: 0.1 },
  goldBonus: { name: '金币加成', description: '金币收益 +10%', value: 0.1 },
  skipBattle: { name: '跳过战斗', description: '可跳过战斗动画' },
  autoBattle: { name: '自动战斗', description: '开启自动战斗功能' },
  extraSweep: { name: '额外扫荡', description: '扫荡收益 +20%', value: 0.2 },
  vipShop: { name: 'VIP 商店', description: '解锁 VIP 专属商店' },
  giftPack: { name: '特权礼包', description: '每日可领取特权礼包' },
  claimBonus: { name: '一键领取', description: '一键领取所有奖励' },
  fastTrack: { name: '快速通道', description: '副本进入无冷却' },
};

export const DAILY_DIAMOND_REWARDS: Record<number, number> = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60, 6: 80, 7: 100, 8: 120, 9: 150, 10: 200,
};

export const EXP_BONUS: Record<number, number> = {
  0: 0, 1: 0, 2: 0, 3: 0.1, 4: 0.15, 5: 0.2, 6: 0.25, 7: 0.3, 8: 0.35, 9: 0.4, 10: 0.5,
};

export const GOLD_BONUS: Record<number, number> = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0.1, 5: 0.15, 6: 0.2, 7: 0.25, 8: 0.3, 9: 0.35, 10: 0.4,
};

// ==================== 工具函数 ====================

export function getNow(): number {
  return Date.now();
}

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? getNow());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getVIPLevel(level: number): VIPLevel | undefined {
  return VIP_LEVELS.find(v => v.level === level);
}

export function getPrivilegeName(privilege: VIPPrivilege): string {
  return PRIVILEGE_CONFIG[privilege]?.name || privilege;
}

export function getPrivilegeDescription(privilege: VIPPrivilege): string {
  return PRIVILEGE_CONFIG[privilege]?.description || '';
}

// ==================== 核心函数 ====================

/**
 * 创建 VIP 系统状态
 */
export function createVIPState(playerId: string, now?: number): VIPState {
  const giftPackClaimed: Record<number, boolean> = {};
  VIP_LEVELS.forEach(v => {
    if (v.privileges.includes('giftPack')) {
      giftPackClaimed[v.level] = false;
    }
  });

  return {
    playerId,
    level: 0,
    exp: 0,
    totalExp: 0,
    dailyDiamondClaimed: false,
    dailyGiftClaimed: false,
    giftPackClaimed,
    totalRecharge: 0,
    expHistory: [],
    lastUpdateTime: now ?? getNow(),
  };
}

/**
 * 添加 VIP 经验
 */
export function addVIPExp(
  state: VIPState,
  amount: number,
  source: 'recharge' | 'task' | 'achievement' | 'gift',
  description: string,
  now?: number
): { state: VIPState; leveledUp: boolean; newLevel: number } {
  const currentTime = now ?? getNow();
  const newState = { ...state };
  
  newState.exp += amount;
  newState.totalExp += amount;
  
  if (source === 'recharge') {
    newState.totalRecharge += amount; // 假设 1:1 转换
  }

  // 记录历史
  newState.expHistory = [
    { amount, source, timestamp: currentTime, description },
    ...newState.expHistory.slice(0, 99),
  ];

  // 检查升级
  let leveledUp = false;
  let newLevel = newState.level;

  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (newState.totalExp >= VIP_LEVELS[i].expRequired) {
      if (i > newState.level) {
        leveledUp = true;
        newLevel = i;
      }
      break;
    }
  }

  newState.level = newLevel;
  newState.lastUpdateTime = currentTime;

  return { state: newState, leveledUp, newLevel };
}

/**
 * 领取每日钻石
 */
export function claimDailyDiamond(state: VIPState, now?: number): { state: VIPState; success: boolean; amount: number; error?: string } {
  if (state.level < 1) {
    return { state, success: false, amount: 0, error: 'VIP1 解锁此功能' };
  }

  if (state.dailyDiamondClaimed) {
    return { state, success: false, amount: 0, error: '今日已领取' };
  }

  const amount = DAILY_DIAMOND_REWARDS[state.level] || 0;

  return {
    state: { ...state, dailyDiamondClaimed: true },
    success: true,
    amount,
  };
}

/**
 * 领取特权礼包
 */
export function claimGiftPack(state: VIPState, level: number, now?: number): { state: VIPState; success: boolean; rewards?: any; error?: string } {
  const vipLevel = getVIPLevel(level);
  if (!vipLevel) {
    return { state, success: false, error: 'VIP 等级不存在' };
  }

  if (!vipLevel.privileges.includes('giftPack')) {
    return { state, success: false, error: '该等级无特权礼包' };
  }

  if (state.level < level) {
    return { state, success: false, error: 'VIP 等级不足' };
  }

  if (state.giftPackClaimed[level]) {
    return { state, success: false, error: '今日已领取' };
  }

  const rewards = {
    diamond: 50 * level,
    gold: 1000 * level,
    exp: 500 * level,
  };

  const newGiftPackClaimed = { ...state.giftPackClaimed, [level]: true };

  return {
    state: { ...state, giftPackClaimed: newGiftPackClaimed, dailyGiftClaimed: true },
    success: true,
    rewards,
  };
}

/**
 * 检查是否有特权
 */
export function hasPrivilege(state: VIPState, privilege: VIPPrivilege): boolean {
  const vipLevel = getVIPLevel(state.level);
  if (!vipLevel) return false;
  return vipLevel.privileges.includes(privilege);
}

/**
 * 获取所有特权
 */
export function getAllPrivileges(state: VIPState): VIPPrivilege[] {
  const vipLevel = getVIPLevel(state.level);
  if (!vipLevel) return [];
  return vipLevel.privileges;
}

/**
 * 获取经验加成
 */
export function getExpBonus(state: VIPState): number {
  return EXP_BONUS[state.level] || 0;
}

/**
 * 获取金币加成
 */
export function getGoldBonus(state: VIPState): number {
  return GOLD_BONUS[state.level] || 0;
}

/**
 * 获取升级进度
 */
export function getLevelProgress(state: VIPState): { current: number; next: number; percentage: number; nextLevel?: number } {
  const currentLevel = getVIPLevel(state.level);
  const nextLevel = getVIPLevel(state.level + 1);

  if (!nextLevel) {
    return { current: state.totalExp, next: state.totalExp, percentage: 100 };
  }

  const prevExp = currentLevel?.expRequired || 0;
  const nextExp = nextLevel.expRequired;
  const progress = state.totalExp - prevExp;
  const required = nextExp - prevExp;

  return {
    current: state.totalExp,
    next: nextExp,
    percentage: Math.min(100, Math.round((progress / required) * 100)),
    nextLevel: nextLevel.level,
  };
}

/**
 * 获取 VIP 统计
 */
export function getVIPStats(state: VIPState): {
  level: number;
  levelName: string;
  exp: number;
  totalExp: number;
  totalRecharge: number;
  privilegesCount: number;
  todayDiamondClaimed: boolean;
  todayGiftClaimed: boolean;
} {
  const vipLevel = getVIPLevel(state.level);
  return {
    level: state.level,
    levelName: vipLevel?.name || '平民',
    exp: state.exp,
    totalExp: state.totalExp,
    totalRecharge: state.totalRecharge,
    privilegesCount: vipLevel?.privileges.length || 0,
    todayDiamondClaimed: state.dailyDiamondClaimed,
    todayGiftClaimed: state.dailyGiftClaimed,
  };
}

/**
 * 每日重置
 */
export function dailyReset(state: VIPState, now?: number): VIPState {
  return {
    ...state,
    dailyDiamondClaimed: false,
    dailyGiftClaimed: false,
    giftPackClaimed: {},
    lastUpdateTime: now ?? getNow(),
  };
}

/**
 * 导出数据
 */
export function exportVIPData(state: VIPState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importVIPData(json: string): VIPState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || typeof data.level !== 'number') return null;
    return data as VIPState;
  } catch {
    return null;
  }
}
