// 宠物探险系统 - v0.66
// Pet Expedition System - 派遣宠物探索获取奖励

/**
 * 探险区域
 */
export type ExpeditionZone = 'forest' | 'cave' | 'ruins' | 'volcano' | 'abyss';

/**
 * 探险难度
 */
export type ExpeditionDifficulty = 'easy' | 'normal' | 'hard' | 'hell';

/**
 * 探险状态
 */
export type ExpeditionStatus = 'idle' | 'exploring' | 'completed' | 'failed';

/**
 * 探险区域配置
 */
export interface ZoneConfig {
  id: ExpeditionZone;
  name: string;
  description: string;
  minLevel: number;
  /** 推荐战力 */
  recommendedPower: number;
  /** 探险时长（毫秒） */
  durationMs: number;
  /** 优势元素 */
  bonusElement: string;
  /** 基础奖励 */
  baseRewards: ExpeditionReward;
  /** 稀有掉落概率 (0-1) */
  rareDropRate: number;
  /** 稀有掉落 */
  rareDrop: ExpeditionReward;
}

/**
 * 探险奖励
 */
export interface ExpeditionReward {
  gold?: number;
  exp?: number;
  diamond?: number;
  petShard?: number;
  equipBox?: number;
  material?: number;
}

/**
 * 探险槽位
 */
export interface ExpeditionSlot {
  slotId: number;
  status: ExpeditionStatus;
  /** 派遣的宠物ID列表 */
  petIds: string[];
  /** 选择的区域 */
  zoneId: ExpeditionZone | null;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 探险结果 */
  rewards: ExpeditionReward | null;
  /** 是否获得稀有掉落 */
  gotRareDrop: boolean;
  /** 队伍总战力 */
  teamPower: number;
}

/**
 * 探险系统状态
 */
export interface ExpeditionState {
  playerId: string;
  /** 探险槽位 */
  slots: ExpeditionSlot[];
  /** 已解锁的槽位数 */
  unlockedSlots: number;
  /** 今日已完成次数 */
  dailyCompleted: number;
  /** 每日上限 */
  dailyLimit: number;
  /** 累计完成次数 */
  totalCompleted: number;
  /** 累计获得奖励 */
  totalRewards: ExpeditionReward;
  /** 最后重置日期 */
  lastResetDate: string;
  /** 探险日志（最近20条） */
  log: ExpeditionLogEntry[];
}

/**
 * 探险日志
 */
export interface ExpeditionLogEntry {
  timestamp: number;
  zoneId: ExpeditionZone;
  zoneName: string;
  petCount: number;
  success: boolean;
  rewards: ExpeditionReward;
  gotRareDrop: boolean;
}

// ==================== 区域配置 ====================

export const ZONE_CONFIGS: Record<ExpeditionZone, ZoneConfig> = {
  forest: {
    id: 'forest',
    name: '迷雾森林',
    description: '温和的入门探险区域，适合新手宠物。',
    minLevel: 1,
    recommendedPower: 100,
    durationMs: 30 * 60 * 1000, // 30分钟
    bonusElement: 'earth',
    baseRewards: { gold: 500, exp: 200 },
    rareDropRate: 0.1,
    rareDrop: { petShard: 5 },
  },
  cave: {
    id: 'cave',
    name: '水晶洞窟',
    description: '蕴含矿物的洞穴，可能发现稀有材料。',
    minLevel: 10,
    recommendedPower: 500,
    durationMs: 60 * 60 * 1000, // 1小时
    bonusElement: 'water',
    baseRewards: { gold: 1200, exp: 500, material: 3 },
    rareDropRate: 0.15,
    rareDrop: { diamond: 20, material: 10 },
  },
  ruins: {
    id: 'ruins',
    name: '远古遗迹',
    description: '神秘的古代遗迹，隐藏着宝贵的装备。',
    minLevel: 20,
    recommendedPower: 1500,
    durationMs: 2 * 60 * 60 * 1000, // 2小时
    bonusElement: 'light',
    baseRewards: { gold: 3000, exp: 1200 },
    rareDropRate: 0.12,
    rareDrop: { equipBox: 1, diamond: 30 },
  },
  volcano: {
    id: 'volcano',
    name: '炎狱火山',
    description: '危险的火山地带，高风险高回报。',
    minLevel: 35,
    recommendedPower: 4000,
    durationMs: 4 * 60 * 60 * 1000, // 4小时
    bonusElement: 'fire',
    baseRewards: { gold: 8000, exp: 3000, diamond: 10 },
    rareDropRate: 0.08,
    rareDrop: { petShard: 20, diamond: 50 },
  },
  abyss: {
    id: 'abyss',
    name: '无尽深渊',
    description: '最危险的区域，只有最强的队伍才能生还。',
    minLevel: 50,
    recommendedPower: 10000,
    durationMs: 8 * 60 * 60 * 1000, // 8小时
    bonusElement: 'dark',
    baseRewards: { gold: 20000, exp: 8000, diamond: 30 },
    rareDropRate: 0.05,
    rareDrop: { petShard: 50, equipBox: 2, diamond: 100 },
  },
};

export const MAX_PETS_PER_SLOT = 3;
export const BASE_SLOTS = 2;
export const MAX_SLOTS = 5;
export const BASE_DAILY_LIMIT = 10;

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 创建探险系统状态
 */
export function createExpeditionState(playerId: string, now?: number): ExpeditionState {
  const slots: ExpeditionSlot[] = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    slots.push({
      slotId: i,
      status: 'idle',
      petIds: [],
      zoneId: null,
      startTime: 0,
      endTime: 0,
      rewards: null,
      gotRareDrop: false,
      teamPower: 0,
    });
  }

  return {
    playerId,
    slots,
    unlockedSlots: BASE_SLOTS,
    dailyCompleted: 0,
    dailyLimit: BASE_DAILY_LIMIT,
    totalCompleted: 0,
    totalRewards: { gold: 0, exp: 0, diamond: 0, petShard: 0, equipBox: 0, material: 0 },
    lastResetDate: getTodayStr(now),
    log: [],
  };
}

/**
 * 检查是否需要每日重置
 */
export function needsDailyReset(state: ExpeditionState, now?: number): boolean {
  return getTodayStr(now) !== state.lastResetDate;
}

/**
 * 每日重置
 */
export function resetDaily(state: ExpeditionState, now?: number): ExpeditionState {
  return {
    ...state,
    dailyCompleted: 0,
    lastResetDate: getTodayStr(now),
  };
}

/**
 * 获取可用槽位
 */
export function getAvailableSlots(state: ExpeditionState): ExpeditionSlot[] {
  return state.slots.filter((s, i) => i < state.unlockedSlots && s.status === 'idle');
}

/**
 * 获取进行中的探险
 */
export function getActiveExpeditions(state: ExpeditionState): ExpeditionSlot[] {
  return state.slots.filter(s => s.status === 'exploring');
}

/**
 * 获取已完成的探险
 */
export function getCompletedExpeditions(state: ExpeditionState, now?: number): ExpeditionSlot[] {
  const currentTime = now ?? Date.now();
  return state.slots.filter(s => s.status === 'exploring' && currentTime >= s.endTime);
}

/**
 * 解锁额外槽位
 */
export function unlockSlot(state: ExpeditionState): { state: ExpeditionState; success: boolean; error?: string } {
  if (state.unlockedSlots >= MAX_SLOTS) {
    return { state, success: false, error: '已解锁所有槽位' };
  }
  return {
    state: { ...state, unlockedSlots: state.unlockedSlots + 1 },
    success: true,
  };
}

/**
 * 检查是否可以派遣
 */
export function canDispatch(
  state: ExpeditionState,
  slotId: number,
  zoneId: ExpeditionZone,
  petIds: string[],
  playerLevel: number
): { canDispatch: boolean; reason?: string } {
  if (slotId < 0 || slotId >= state.unlockedSlots) {
    return { canDispatch: false, reason: '槽位未解锁' };
  }
  if (state.slots[slotId].status !== 'idle') {
    return { canDispatch: false, reason: '槽位正在使用中' };
  }
  if (state.dailyCompleted >= state.dailyLimit) {
    return { canDispatch: false, reason: '今日探险次数已用完' };
  }

  const zone = ZONE_CONFIGS[zoneId];
  if (!zone) {
    return { canDispatch: false, reason: '区域不存在' };
  }
  if (playerLevel < zone.minLevel) {
    return { canDispatch: false, reason: `需要达到${zone.minLevel}级` };
  }
  if (petIds.length === 0) {
    return { canDispatch: false, reason: '至少需要1只宠物' };
  }
  if (petIds.length > MAX_PETS_PER_SLOT) {
    return { canDispatch: false, reason: `最多${MAX_PETS_PER_SLOT}只宠物` };
  }

  // 检查宠物是否已在其他探险中
  for (const slot of state.slots) {
    if (slot.status === 'exploring') {
      for (const petId of petIds) {
        if (slot.petIds.includes(petId)) {
          return { canDispatch: false, reason: `宠物${petId}正在其他探险中` };
        }
      }
    }
  }

  return { canDispatch: true };
}

/**
 * 派遣探险
 */
export function dispatch(
  state: ExpeditionState,
  slotId: number,
  zoneId: ExpeditionZone,
  petIds: string[],
  teamPower: number,
  playerLevel: number,
  now?: number
): { state: ExpeditionState; success: boolean; error?: string } {
  const check = canDispatch(state, slotId, zoneId, petIds, playerLevel);
  if (!check.canDispatch) {
    return { state, success: false, error: check.reason };
  }

  const zone = ZONE_CONFIGS[zoneId];
  const currentTime = now ?? Date.now();

  const newSlots = state.slots.map((slot, i) => {
    if (i !== slotId) return slot;
    return {
      ...slot,
      status: 'exploring' as ExpeditionStatus,
      petIds: [...petIds],
      zoneId,
      startTime: currentTime,
      endTime: currentTime + zone.durationMs,
      rewards: null,
      gotRareDrop: false,
      teamPower,
    };
  });

  return {
    state: { ...state, slots: newSlots },
    success: true,
  };
}

/**
 * 计算探险结果
 */
export function calculateResult(
  zone: ZoneConfig,
  teamPower: number,
  rng?: () => number
): { success: boolean; rewards: ExpeditionReward; gotRareDrop: boolean; powerRatio: number } {
  const rand = rng ?? Math.random;
  const powerRatio = teamPower / zone.recommendedPower;

  // 成功率基于战力比
  const successRate = Math.min(0.95, Math.max(0.1, powerRatio * 0.6));
  const success = rand() < successRate;

  if (!success) {
    // 失败只给 30% 基础奖励
    const rewards: ExpeditionReward = {};
    if (zone.baseRewards.gold) rewards.gold = Math.floor(zone.baseRewards.gold * 0.3);
    if (zone.baseRewards.exp) rewards.exp = Math.floor(zone.baseRewards.exp * 0.3);
    return { success: false, rewards, gotRareDrop: false, powerRatio };
  }

  // 成功：基础奖励 × 战力加成
  const powerBonus = Math.min(2, Math.max(1, powerRatio));
  const rewards: ExpeditionReward = {};
  for (const [key, val] of Object.entries(zone.baseRewards)) {
    if (val) {
      (rewards as any)[key] = Math.floor(val * powerBonus);
    }
  }

  // 稀有掉落
  const gotRareDrop = rand() < zone.rareDropRate;
  if (gotRareDrop) {
    for (const [key, val] of Object.entries(zone.rareDrop)) {
      if (val) {
        (rewards as any)[key] = ((rewards as any)[key] || 0) + val;
      }
    }
  }

  return { success, rewards, gotRareDrop, powerRatio };
}

/**
 * 收取探险结果
 */
export function collectExpedition(
  state: ExpeditionState,
  slotId: number,
  rng?: () => number,
  now?: number
): { state: ExpeditionState; success: boolean; rewards?: ExpeditionReward; gotRareDrop?: boolean; expeditionSuccess?: boolean; error?: string } {
  const currentTime = now ?? Date.now();

  if (slotId < 0 || slotId >= state.unlockedSlots) {
    return { state, success: false, error: '无效的槽位' };
  }

  const slot = state.slots[slotId];
  if (slot.status !== 'exploring') {
    return { state, success: false, error: '该槽位没有进行中的探险' };
  }
  if (currentTime < slot.endTime) {
    return { state, success: false, error: '探险尚未完成' };
  }

  const zone = ZONE_CONFIGS[slot.zoneId!];
  const result = calculateResult(zone, slot.teamPower, rng);

  const newSlots = state.slots.map((s, i) => {
    if (i !== slotId) return s;
    return {
      ...s,
      status: 'idle' as ExpeditionStatus,
      petIds: [],
      zoneId: null,
      startTime: 0,
      endTime: 0,
      rewards: result.rewards,
      gotRareDrop: result.gotRareDrop,
      teamPower: 0,
    };
  });

  // 更新累计奖励
  const newTotalRewards = { ...state.totalRewards };
  for (const [key, val] of Object.entries(result.rewards)) {
    if (val) {
      (newTotalRewards as any)[key] = ((newTotalRewards as any)[key] || 0) + val;
    }
  }

  // 添加日志
  const logEntry: ExpeditionLogEntry = {
    timestamp: currentTime,
    zoneId: slot.zoneId!,
    zoneName: zone.name,
    petCount: slot.petIds.length,
    success: result.success,
    rewards: result.rewards,
    gotRareDrop: result.gotRareDrop,
  };

  return {
    state: {
      ...state,
      slots: newSlots,
      dailyCompleted: state.dailyCompleted + 1,
      totalCompleted: state.totalCompleted + 1,
      totalRewards: newTotalRewards,
      log: [logEntry, ...state.log].slice(0, 20),
    },
    success: true,
    rewards: result.rewards,
    gotRareDrop: result.gotRareDrop,
    expeditionSuccess: result.success,
  };
}

/**
 * 立即完成探险（消耗钻石）
 */
export function rushExpedition(
  state: ExpeditionState,
  slotId: number,
  now?: number
): { state: ExpeditionState; success: boolean; diamondCost: number; error?: string } {
  if (slotId < 0 || slotId >= state.unlockedSlots) {
    return { state, success: false, diamondCost: 0, error: '无效的槽位' };
  }

  const slot = state.slots[slotId];
  if (slot.status !== 'exploring') {
    return { state, success: false, diamondCost: 0, error: '该槽位没有进行中的探险' };
  }

  const currentTime = now ?? Date.now();
  const remainingMs = Math.max(0, slot.endTime - currentTime);
  const diamondCost = Math.max(1, Math.ceil(remainingMs / (60 * 1000))); // 1钻石/分钟

  // 直接将endTime设为当前时间
  const newSlots = state.slots.map((s, i) => {
    if (i !== slotId) return s;
    return { ...s, endTime: currentTime };
  });

  return {
    state: { ...state, slots: newSlots },
    success: true,
    diamondCost,
  };
}

/**
 * 获取探险统计
 */
export function getExpeditionStats(state: ExpeditionState): {
  totalCompleted: number;
  dailyCompleted: number;
  dailyRemaining: number;
  unlockedSlots: number;
  activeCount: number;
  idleCount: number;
  totalRewards: ExpeditionReward;
  successRate: number;
} {
  const activeCount = state.slots.filter(s => s.status === 'exploring').length;
  const idleCount = state.slots.filter((s, i) => i < state.unlockedSlots && s.status === 'idle').length;

  const successCount = state.log.filter(l => l.success).length;
  const successRate = state.log.length > 0 ? Math.round((successCount / state.log.length) * 100) : 0;

  return {
    totalCompleted: state.totalCompleted,
    dailyCompleted: state.dailyCompleted,
    dailyRemaining: Math.max(0, state.dailyLimit - state.dailyCompleted),
    unlockedSlots: state.unlockedSlots,
    activeCount,
    idleCount,
    totalRewards: state.totalRewards,
    successRate,
  };
}

/**
 * 获取区域信息
 */
export function getZoneInfo(zoneId: ExpeditionZone): ZoneConfig | null {
  return ZONE_CONFIGS[zoneId] ?? null;
}

/**
 * 获取所有区域列表
 */
export function getAllZones(): ZoneConfig[] {
  return Object.values(ZONE_CONFIGS);
}

/**
 * 获取可用区域（按玩家等级）
 */
export function getAvailableZones(playerLevel: number): ZoneConfig[] {
  return Object.values(ZONE_CONFIGS).filter(z => playerLevel >= z.minLevel);
}

/**
 * 获取探险剩余时间
 */
export function getRemainingTime(slot: ExpeditionSlot, now?: number): number {
  if (slot.status !== 'exploring') return 0;
  const currentTime = now ?? Date.now();
  return Math.max(0, slot.endTime - currentTime);
}

/**
 * 格式化时间
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '已完成';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
}

/**
 * 导出数据
 */
export function exportExpeditionData(state: ExpeditionState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importExpeditionData(json: string): ExpeditionState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !Array.isArray(data.slots)) return null;
    return data as ExpeditionState;
  } catch {
    return null;
  }
}
