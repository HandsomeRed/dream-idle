// 兑换码系统 - v0.64
// Redeem Code System

/**
 * 兑换码类型
 */
export type CodeType = 'universal' | 'oneTime' | 'limited';

/**
 * 奖励类型
 */
export interface RedeemReward {
  gold?: number;
  diamond?: number;
  exp?: number;
  stamina?: number;
  summonTicket?: number;
  vipExp?: number;
  equipBox?: number;
  petShard?: number;
  heroShard?: number;
}

/**
 * 兑换码配置
 */
export interface RedeemCodeConfig {
  code: string;
  type: CodeType;
  rewards: RedeemReward;
  description: string;
  /** 最大使用次数（limited 类型）*/
  maxUses?: number;
  /** 过期时间戳 */
  expiresAt?: number;
  /** 最低等级要求 */
  minLevel?: number;
  /** 是否启用 */
  active: boolean;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 兑换记录
 */
export interface RedeemRecord {
  code: string;
  playerId: string;
  redeemedAt: number;
  rewards: RedeemReward;
}

/**
 * 兑换码系统状态
 */
export interface RedeemState {
  /** 所有兑换码配置 */
  codes: Record<string, RedeemCodeConfig>;
  /** 每个码的使用次数 */
  usageCounts: Record<string, number>;
  /** 玩家已兑换的码 */
  playerRedeemed: Record<string, string[]>; // playerId -> code[]
  /** 兑换历史 */
  history: RedeemRecord[];
}

// ==================== 预设兑换码 ====================

export const PRESET_CODES: RedeemCodeConfig[] = [
  {
    code: 'WELCOME2026',
    type: 'universal',
    rewards: { gold: 10000, diamond: 100, exp: 5000 },
    description: '新手欢迎礼包',
    active: true,
    createdAt: Date.now(),
  },
  {
    code: 'DREAMIDLE',
    type: 'universal',
    rewards: { diamond: 50, summonTicket: 3 },
    description: '梦幻放置专属码',
    active: true,
    createdAt: Date.now(),
  },
  {
    code: 'VIP888',
    type: 'limited',
    rewards: { diamond: 500, vipExp: 200, gold: 50000 },
    description: 'VIP专属限量码',
    maxUses: 100,
    active: true,
    createdAt: Date.now(),
  },
  {
    code: 'HERO100',
    type: 'oneTime',
    rewards: { heroShard: 50, summonTicket: 10 },
    description: '英雄招募大礼包',
    active: true,
    minLevel: 10,
    createdAt: Date.now(),
  },
  {
    code: 'EXPIRED001',
    type: 'universal',
    rewards: { gold: 1000 },
    description: '已过期测试码',
    expiresAt: 1000, // 已过期
    active: true,
    createdAt: 500,
  },
  {
    code: 'DISABLED001',
    type: 'universal',
    rewards: { gold: 1000 },
    description: '已禁用测试码',
    active: false,
    createdAt: Date.now(),
  },
];

// ==================== 核心函数 ====================

/**
 * 创建兑换码系统状态
 */
export function createRedeemState(presetCodes?: RedeemCodeConfig[]): RedeemState {
  const codes: Record<string, RedeemCodeConfig> = {};
  const pool = presetCodes ?? PRESET_CODES;
  for (const config of pool) {
    codes[config.code.toUpperCase()] = { ...config, code: config.code.toUpperCase() };
  }
  return {
    codes,
    usageCounts: {},
    playerRedeemed: {},
    history: [],
  };
}

/**
 * 标准化兑换码（去空格、转大写）
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * 验证兑换码
 */
export function validateCode(
  state: RedeemState,
  code: string,
  playerId: string,
  playerLevel: number = 1,
  now?: number
): { valid: boolean; reason?: string } {
  const normalized = normalizeCode(code);
  const config = state.codes[normalized];

  if (!config) {
    return { valid: false, reason: '兑换码不存在' };
  }

  if (!config.active) {
    return { valid: false, reason: '兑换码已禁用' };
  }

  // 过期检查
  const currentTime = now ?? Date.now();
  if (config.expiresAt && currentTime > config.expiresAt) {
    return { valid: false, reason: '兑换码已过期' };
  }

  // 等级检查
  if (config.minLevel && playerLevel < config.minLevel) {
    return { valid: false, reason: `需要达到${config.minLevel}级才能使用` };
  }

  // 已兑换检查（每个玩家每个码只能用一次）
  const playerCodes = state.playerRedeemed[playerId] || [];
  if (playerCodes.includes(normalized)) {
    return { valid: false, reason: '已经兑换过该码' };
  }

  // 限量码使用次数检查
  if (config.type === 'limited' && config.maxUses) {
    const used = state.usageCounts[normalized] || 0;
    if (used >= config.maxUses) {
      return { valid: false, reason: '兑换码已被领完' };
    }
  }

  // 一次性码检查
  if (config.type === 'oneTime') {
    const used = state.usageCounts[normalized] || 0;
    if (used >= 1) {
      return { valid: false, reason: '兑换码已被使用' };
    }
  }

  return { valid: true };
}

/**
 * 兑换码兑换
 */
export function redeemCode(
  state: RedeemState,
  code: string,
  playerId: string,
  playerLevel: number = 1,
  now?: number
): { state: RedeemState; success: boolean; rewards?: RedeemReward; error?: string } {
  const validation = validateCode(state, code, playerId, playerLevel, now);
  if (!validation.valid) {
    return { state, success: false, error: validation.reason };
  }

  const normalized = normalizeCode(code);
  const config = state.codes[normalized];
  const currentTime = now ?? Date.now();

  const newState: RedeemState = {
    codes: { ...state.codes },
    usageCounts: { ...state.usageCounts },
    playerRedeemed: { ...state.playerRedeemed },
    history: [...state.history],
  };

  // 更新使用次数
  newState.usageCounts[normalized] = (newState.usageCounts[normalized] || 0) + 1;

  // 记录玩家已兑换
  if (!newState.playerRedeemed[playerId]) {
    newState.playerRedeemed[playerId] = [];
  }
  newState.playerRedeemed[playerId] = [...newState.playerRedeemed[playerId], normalized];

  // 添加兑换记录（保留最近100条）
  const record: RedeemRecord = {
    code: normalized,
    playerId,
    redeemedAt: currentTime,
    rewards: config.rewards,
  };
  newState.history = [record, ...newState.history].slice(0, 100);

  return { state: newState, success: true, rewards: config.rewards };
}

/**
 * 添加新兑换码
 */
export function addCode(state: RedeemState, config: RedeemCodeConfig): RedeemState {
  const normalized = normalizeCode(config.code);
  return {
    ...state,
    codes: {
      ...state.codes,
      [normalized]: { ...config, code: normalized },
    },
  };
}

/**
 * 禁用兑换码
 */
export function disableCode(state: RedeemState, code: string): RedeemState {
  const normalized = normalizeCode(code);
  if (!state.codes[normalized]) return state;
  return {
    ...state,
    codes: {
      ...state.codes,
      [normalized]: { ...state.codes[normalized], active: false },
    },
  };
}

/**
 * 启用兑换码
 */
export function enableCode(state: RedeemState, code: string): RedeemState {
  const normalized = normalizeCode(code);
  if (!state.codes[normalized]) return state;
  return {
    ...state,
    codes: {
      ...state.codes,
      [normalized]: { ...state.codes[normalized], active: true },
    },
  };
}

/**
 * 删除兑换码
 */
export function removeCode(state: RedeemState, code: string): RedeemState {
  const normalized = normalizeCode(code);
  const newCodes = { ...state.codes };
  delete newCodes[normalized];
  return { ...state, codes: newCodes };
}

/**
 * 获取玩家已兑换的码
 */
export function getPlayerRedeemedCodes(state: RedeemState, playerId: string): string[] {
  return state.playerRedeemed[playerId] || [];
}

/**
 * 获取兑换码使用次数
 */
export function getCodeUsageCount(state: RedeemState, code: string): number {
  return state.usageCounts[normalizeCode(code)] || 0;
}

/**
 * 获取兑换码信息（不含敏感数据）
 */
export function getCodeInfo(state: RedeemState, code: string): {
  exists: boolean;
  description?: string;
  type?: CodeType;
  active?: boolean;
  expired?: boolean;
  usageCount?: number;
  maxUses?: number;
  remainingUses?: number;
} | null {
  const normalized = normalizeCode(code);
  const config = state.codes[normalized];
  if (!config) return { exists: false };

  const usageCount = state.usageCounts[normalized] || 0;
  const expired = config.expiresAt ? Date.now() > config.expiresAt : false;

  let remainingUses: number | undefined;
  if (config.type === 'limited' && config.maxUses) {
    remainingUses = Math.max(0, config.maxUses - usageCount);
  } else if (config.type === 'oneTime') {
    remainingUses = usageCount >= 1 ? 0 : 1;
  }

  return {
    exists: true,
    description: config.description,
    type: config.type,
    active: config.active,
    expired,
    usageCount,
    maxUses: config.maxUses,
    remainingUses,
  };
}

/**
 * 获取所有活跃的兑换码（管理用）
 */
export function getActiveCodes(state: RedeemState): RedeemCodeConfig[] {
  return Object.values(state.codes).filter(c => c.active);
}

/**
 * 获取兑换历史
 */
export function getRedeemHistory(state: RedeemState, limit: number = 20): RedeemRecord[] {
  return state.history.slice(0, limit);
}

/**
 * 获取兑换统计
 */
export function getRedeemStats(state: RedeemState): {
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  uniquePlayers: number;
  topCodes: { code: string; count: number }[];
} {
  const activeCodes = Object.values(state.codes).filter(c => c.active).length;
  const totalRedemptions = Object.values(state.usageCounts).reduce((sum, n) => sum + n, 0);
  const uniquePlayers = Object.keys(state.playerRedeemed).length;

  const topCodes = Object.entries(state.usageCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalCodes: Object.keys(state.codes).length,
    activeCodes,
    totalRedemptions,
    uniquePlayers,
    topCodes,
  };
}

/**
 * 计算奖励总价值（用于展示）
 */
export function calculateRewardValue(rewards: RedeemReward): number {
  let value = 0;
  if (rewards.gold) value += rewards.gold * 0.01;
  if (rewards.diamond) value += rewards.diamond * 1;
  if (rewards.exp) value += rewards.exp * 0.005;
  if (rewards.stamina) value += rewards.stamina * 2;
  if (rewards.summonTicket) value += rewards.summonTicket * 50;
  if (rewards.vipExp) value += rewards.vipExp * 0.5;
  if (rewards.equipBox) value += rewards.equipBox * 100;
  if (rewards.petShard) value += rewards.petShard * 5;
  if (rewards.heroShard) value += rewards.heroShard * 10;
  return Math.round(value);
}

/**
 * 格式化奖励为文字描述
 */
export function formatRewards(rewards: RedeemReward): string[] {
  const parts: string[] = [];
  if (rewards.gold) parts.push(`金币×${rewards.gold}`);
  if (rewards.diamond) parts.push(`钻石×${rewards.diamond}`);
  if (rewards.exp) parts.push(`经验×${rewards.exp}`);
  if (rewards.stamina) parts.push(`体力×${rewards.stamina}`);
  if (rewards.summonTicket) parts.push(`召唤券×${rewards.summonTicket}`);
  if (rewards.vipExp) parts.push(`VIP经验×${rewards.vipExp}`);
  if (rewards.equipBox) parts.push(`装备宝箱×${rewards.equipBox}`);
  if (rewards.petShard) parts.push(`宠物碎片×${rewards.petShard}`);
  if (rewards.heroShard) parts.push(`英雄碎片×${rewards.heroShard}`);
  return parts;
}

/**
 * 生成随机兑换码
 */
export function generateRandomCode(prefix: string = '', length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符 I/O/0/1
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 批量生成兑换码
 */
export function generateBatchCodes(
  state: RedeemState,
  count: number,
  rewards: RedeemReward,
  description: string,
  options?: { prefix?: string; type?: CodeType; maxUses?: number; expiresAt?: number }
): { state: RedeemState; codes: string[] } {
  let newState = { ...state, codes: { ...state.codes } };
  const generatedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    let code: string;
    do {
      code = generateRandomCode(options?.prefix || '', 8);
    } while (newState.codes[code]); // 避免重复

    const config: RedeemCodeConfig = {
      code,
      type: options?.type || 'oneTime',
      rewards,
      description,
      maxUses: options?.maxUses,
      expiresAt: options?.expiresAt,
      active: true,
      createdAt: Date.now(),
    };

    newState.codes[code] = config;
    generatedCodes.push(code);
  }

  return { state: newState, codes: generatedCodes };
}

/**
 * 导出数据
 */
export function exportRedeemData(state: RedeemState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importRedeemData(json: string): RedeemState | null {
  try {
    const data = JSON.parse(json);
    if (!data.codes || !data.usageCounts || !data.playerRedeemed) return null;
    return data as RedeemState;
  } catch {
    return null;
  }
}
