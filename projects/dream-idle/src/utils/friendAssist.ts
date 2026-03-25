// 好友助力系统 - v0.74
// Friend Assist System - 好友间互相帮助加速进度

/**
 * 助力类型
 */
export type AssistType = 'expedition' | 'battle' | 'construction' | 'research' | 'summon';

/**
 * 助力请求状态
 */
export type AssistRequestStatus = 'pending' | 'accepted' | 'completed' | 'expired' | 'cancelled';

/**
 * 奖励物品
 */
export interface RewardItem {
  type: 'gold' | 'diamond' | 'exp' | 'stamina' | 'petFood' | 'petShard' | 'equipBox' | 'material' | 'artifact';
  amount: number;
  name: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 助力请求
 */
export interface AssistRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  type: AssistType;
  description: string;
  reward: RewardItem[];
  assistReward: RewardItem[]; // 助力者奖励
  createdAt: number;
  expiresAt: number;
  status: AssistRequestStatus;
  maxAssists: number;
  currentAssists: number;
  assisters: string[]; // 已助力者 ID 列表
}

/**
 * 助力记录
 */
export interface AssistRecord {
  id: string;
  requestId: string;
  requesterId: string;
  assisterId: string;
  type: AssistType;
  timestamp: number;
  reward: RewardItem[];
  assistReward: RewardItem[];
}

/**
 * 好友助力系统状态
 */
export interface AssistState {
  playerId: string;
  /** 我发出的请求 */
  myRequests: AssistRequest[];
  /** 我可帮助的请求 */
  availableRequests: AssistRequest[];
  /** 我已完成的助力记录 */
  assistHistory: AssistRecord[];
  /** 我收到的助力记录 */
  receivedHistory: AssistRecord[];
  /** 今日已助力次数 */
  todayAssists: number;
  /** 今日已收助力次数 */
  todayReceived: number;
  /** 最大每日助力次数 */
  maxDailyAssists: number;
  /** 最后重置日期 */
  lastResetDate: string;
  /** 累计助力统计 */
  totalStats: {
    given: number;
    received: number;
    totalRewards: Record<string, number>;
  };
}

// ==================== 助力配置 ====================

export const ASSIST_CONFIGS: Record<AssistType, { name: string; baseReward: RewardItem[]; assistReward: RewardItem[]; duration: number }> = {
  expedition: {
    name: '探险加速',
    baseReward: [{ type: 'gold', amount: 500, name: '金币' }, { type: 'stamina', amount: 10, name: '体力' }],
    assistReward: [{ type: 'gold', amount: 100, name: '助力金币' }, { type: 'exp', amount: 50, name: '助力经验' }],
    duration: 30 * 60 * 1000, // 30 分钟
  },
  battle: {
    name: '战斗支援',
    baseReward: [{ type: 'exp', amount: 200, name: '经验' }, { type: 'gold', amount: 300, name: '金币' }],
    assistReward: [{ type: 'exp', amount: 30, name: '战斗经验' }],
    duration: 15 * 60 * 1000,
  },
  construction: {
    name: '建造协助',
    baseReward: [{ type: 'gold', amount: 1000, name: '金币' }, { type: 'material', amount: 5, name: '建材' }],
    assistReward: [{ type: 'gold', amount: 200, name: '协助金币' }],
    duration: 60 * 60 * 1000,
  },
  research: {
    name: '研究帮助',
    baseReward: [{ type: 'exp', amount: 500, name: '研究经验' }],
    assistReward: [{ type: 'exp', amount: 100, name: '学术经验' }],
    duration: 45 * 60 * 1000,
  },
  summon: {
    name: '召唤祝福',
    baseReward: [{ type: 'diamond', amount: 20, name: '钻石' }],
    assistReward: [{ type: 'diamond', amount: 5, name: '祝福钻石' }],
    duration: 10 * 60 * 1000,
  },
};

export const ASSIST_TYPE_NAMES: Record<AssistType, string> = {
  expedition: '探险加速',
  battle: '战斗支援',
  construction: '建造协助',
  research: '研究帮助',
  summon: '召唤祝福',
};

export const MAX_DAILY_ASSISTS = 10;
export const REQUEST_EXPIRY_HOURS = 24;

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getNow(): number {
  return Date.now();
}

export function getAssistTypeName(type: AssistType): string {
  return ASSIST_TYPE_NAMES[type];
}

// ==================== 核心函数 ====================

/**
 * 创建助力系统状态
 */
export function createAssistState(playerId: string, now?: number): AssistState {
  return {
    playerId,
    myRequests: [],
    availableRequests: [],
    assistHistory: [],
    receivedHistory: [],
    todayAssists: 0,
    todayReceived: 0,
    maxDailyAssists: MAX_DAILY_ASSISTS,
    lastResetDate: getTodayStr(now),
    totalStats: {
      given: 0,
      received: 0,
      totalRewards: {},
    },
  };
}

/**
 * 检查并重置每日计数
 */
export function checkDailyReset(state: AssistState, now?: number): AssistState {
  const today = getTodayStr(now);
  if (today !== state.lastResetDate) {
    return {
      ...state,
      todayAssists: 0,
      todayReceived: 0,
      lastResetDate: today,
    };
  }
  return state;
}

/**
 * 检查是否可以发出请求
 */
export function canCreateRequest(state: AssistState, type: AssistType): { can: boolean; reason?: string } {
  // 检查是否有同类型未完成请求
  const existing = state.myRequests.find(r => r.type === type && r.status === 'pending');
  if (existing) {
    return { can: false, reason: `已有未完成的${getAssistTypeName(type)}请求` };
  }

  // 检查请求数量限制
  const pendingCount = state.myRequests.filter(r => r.status === 'pending').length;
  if (pendingCount >= 5) {
    return { can: false, reason: '最多同时存在 5 个未完成的请求' };
  }

  return { can: true };
}

/**
 * 创建助力请求
 */
export function createAssistRequest(
  state: AssistState,
  type: AssistType,
  description: string,
  maxAssists: number = 3,
  now?: number
): { state: AssistState; request?: AssistRequest; error?: string } {
  const check = canCreateRequest(state, type);
  if (!check.can) {
    return { state, error: check.reason };
  }

  const config = ASSIST_CONFIGS[type];
  const currentTime = now ?? getNow();
  const expiresAt = currentTime + REQUEST_EXPIRY_HOURS * 60 * 60 * 1000;

  const request: AssistRequest = {
    id: `assist_${Date.now()}_${type}`,
    requesterId: state.playerId,
    requesterName: '玩家', // 实际应从玩家信息获取
    type,
    description,
    reward: config.baseReward,
    assistReward: config.assistReward,
    createdAt: currentTime,
    expiresAt,
    status: 'pending',
    maxAssists,
    currentAssists: 0,
    assisters: [],
  };

  return {
    state: {
      ...state,
      myRequests: [...state.myRequests, request],
    },
    request,
  };
}

/**
 * 检查是否可以助力
 */
export function canAssist(state: AssistState, request: AssistRequest): { can: boolean; reason?: string } {
  // 检查是否是自己的请求
  if (request.requesterId === state.playerId) {
    return { can: false, reason: '不能帮助自己' };
  }

  // 检查是否已助力过
  if (request.assisters.includes(state.playerId)) {
    return { can: false, reason: '已助力过该请求' };
  }

  // 检查请求状态
  if (request.status !== 'pending') {
    return { can: false, reason: '请求已完成或过期' };
  }

  // 检查是否已满
  if (request.currentAssists >= request.maxAssists) {
    return { can: false, reason: '助力人数已满' };
  }

  // 检查每日限制
  if (state.todayAssists >= state.maxDailyAssists) {
    return { can: false, reason: '今日助力次数已用完' };
  }

  // 检查是否过期
  if (getNow() > request.expiresAt) {
    return { can: false, reason: '请求已过期' };
  }

  return { can: true };
}

/**
 * 执行助力
 */
export function performAssist(
  state: AssistState,
  requestId: string,
  now?: number
): { state: AssistState; success: boolean; reward?: RewardItem[]; error?: string } {
  const requestIndex = state.availableRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) {
    return { state, success: false, error: '请求不存在' };
  }

  const request = state.availableRequests[requestIndex];
  const check = canAssist(state, request);
  if (!check.can) {
    return { state, success: false, error: check.reason };
  }

  const currentTime = now ?? getNow();

  // 创建助力记录
  const record: AssistRecord = {
    id: `record_${Date.now()}`,
    requestId: request.id,
    requesterId: request.requesterId,
    assisterId: state.playerId,
    type: request.type,
    timestamp: currentTime,
    reward: request.assistReward,
    assistReward: request.assistReward,
  };

  // 更新请求状态
  const updatedRequest: AssistRequest = {
    ...request,
    currentAssists: request.currentAssists + 1,
    assisters: [...request.assisters, state.playerId],
    status: request.currentAssists + 1 >= request.maxAssists ? 'completed' : 'pending',
  };

  // 更新助力者统计
  const newTotalRewards = { ...state.totalStats.totalRewards };
  request.assistReward.forEach(r => {
    const key = `${r.type}_${r.name}`;
    newTotalRewards[key] = (newTotalRewards[key] || 0) + r.amount;
  });

  return {
    state: {
      ...state,
      availableRequests: [
        ...state.availableRequests.slice(0, requestIndex),
        updatedRequest,
        ...state.availableRequests.slice(requestIndex + 1),
      ],
      assistHistory: [record, ...state.assistHistory].slice(0, 100),
      todayAssists: state.todayAssists + 1,
      totalStats: {
        ...state.totalStats,
        given: state.totalStats.given + 1,
        totalRewards: newTotalRewards,
      },
    },
    success: true,
    reward: request.assistReward,
  };
}

/**
 * 领取助力奖励（请求者）
 */
export function claimAssistRewards(
  state: AssistState,
  requestId: string,
  now?: number
): { state: AssistState; success: boolean; rewards?: RewardItem[]; error?: string } {
  const requestIndex = state.myRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) {
    return { state, success: false, error: '请求不存在' };
  }

  const request = state.myRequests[requestIndex];

  // 检查是否有足够的助力
  if (request.currentAssists < request.maxAssists) {
    return { state, success: false, error: '助力人数不足' };
  }

  // 检查是否已领取
  if (request.status === 'completed' && request.currentAssists >= request.maxAssists) {
    // 计算总奖励（基础奖励 + 助力加成）
    const totalRewards = [...request.reward];

    // 每个助力者提供额外 10% 奖励
    const bonusMultiplier = 1 + (request.currentAssists * 0.1);
    totalRewards.forEach(r => {
      r.amount = Math.round(r.amount * bonusMultiplier);
    });

    // 更新请求状态为已完成领取
    const updatedRequest: AssistRequest = {
      ...request,
      status: 'completed',
    };

    // 更新收到记录
    const record: AssistRecord = {
      id: `received_${Date.now()}`,
      requestId: request.id,
      requesterId: state.playerId,
      assisterId: 'system',
      type: request.type,
      timestamp: now ?? getNow(),
      reward: totalRewards,
      assistReward: [],
    };

    // 更新统计
    const newTotalRewards = { ...state.totalStats.totalRewards };
    totalRewards.forEach(r => {
      const key = `${r.type}_${r.name}`;
      newTotalRewards[key] = (newTotalRewards[key] || 0) + r.amount;
    });

    return {
      state: {
        ...state,
        myRequests: [
          ...state.myRequests.slice(0, requestIndex),
          updatedRequest,
          ...state.myRequests.slice(requestIndex + 1),
        ],
        receivedHistory: [record, ...state.receivedHistory].slice(0, 100),
        todayReceived: state.todayReceived + 1,
        totalStats: {
          ...state.totalStats,
          received: state.totalStats.received + 1,
          totalRewards: newTotalRewards,
        },
      },
      success: true,
      rewards: totalRewards,
    };
  }

  return { state, success: false, error: '请求尚未完成' };
}

/**
 * 取消请求
 */
export function cancelRequest(state: AssistState, requestId: string): { state: AssistState; success: boolean; error?: string } {
  const requestIndex = state.myRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) {
    return { state, success: false, error: '请求不存在' };
  }

  const request = state.myRequests[requestIndex];

  // 已有助力的请求不能取消
  if (request.currentAssists > 0) {
    return { state, success: false, error: '已有好友助力，无法取消' };
  }

  return {
    state: {
      ...state,
      myRequests: [
        ...state.myRequests.slice(0, requestIndex),
        { ...request, status: 'cancelled' },
        ...state.myRequests.slice(requestIndex + 1),
      ],
    },
    success: true,
  };
}

/**
 * 获取可助力的请求列表
 */
export function getAvailableRequests(state: AssistState, now?: number): AssistRequest[] {
  const currentTime = now ?? getNow();
  return state.availableRequests.filter(r =>
    r.status === 'pending' &&
    r.currentAssists < r.maxAssists &&
    r.expiresAt > currentTime &&
    r.requesterId !== state.playerId
  );
}

/**
 * 获取可领取的请求
 */
export function getClaimableRequests(state: AssistState): AssistRequest[] {
  return state.myRequests.filter(r =>
    r.status === 'pending' &&
    r.currentAssists >= r.maxAssists
  );
}

/**
 * 获取助力统计
 */
export function getAssistStats(state: AssistState): {
  pendingRequests: number;
  availableToAssist: number;
  todayAssists: number;
  todayReceived: number;
  maxDaily: number;
  totalGiven: number;
  totalReceived: number;
  assistRate: number;
} {
  const pendingRequests = state.myRequests.filter(r => r.status === 'pending').length;
  const availableToAssist = getAvailableRequests(state).length;
  const assistRate = state.totalStats.given + state.totalStats.received > 0
    ? Math.round((state.totalStats.given / (state.totalStats.given + state.totalStats.received)) * 100)
    : 0;

  return {
    pendingRequests,
    availableToAssist,
    todayAssists: state.todayAssists,
    todayReceived: state.todayReceived,
    maxDaily: state.maxDailyAssists,
    totalGiven: state.totalStats.given,
    totalReceived: state.totalStats.received,
    assistRate,
  };
}

/**
 * 设置最大每日助力次数
 */
export function setMaxDailyAssists(state: AssistState, max: number): AssistState {
  return { ...state, maxDailyAssists: Math.max(1, Math.min(50, max)) };
}

/**
 * 导出数据
 */
export function exportAssistData(state: AssistState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importAssistData(json: string): AssistState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || typeof data.todayAssists !== 'number') return null;
    return data as AssistState;
  } catch {
    return null;
  }
}
