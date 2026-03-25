// 好友助力系统 - v0.73
// Friend Assist System - 异步社交互动

/**
 * 助力类型
 */
export type AssistType = 'battle' | 'resource' | 'quest' | 'gacha' | 'boss';

/**
 * 助力请求状态
 */
export type AssistStatus = 'pending' | 'accepted' | 'completed' | 'expired' | 'declined';

/**
 * 助力请求
 */
export interface AssistRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  type: AssistType;
  description: string;
  reward: AssistReward;
  status: AssistStatus;
  createdAt: number;
  expiresAt: number;
  acceptedBy?: string;
  acceptedAt?: number;
  completedAt?: number;
}

/**
 * 助力奖励
 */
export interface AssistReward {
  requester: { gold?: number; diamond?: number; exp?: number; stamina?: number; item?: string; itemAmount?: number };
  helper: { gold?: number; diamond?: number; exp?: number; stamina?: number; item?: string; itemAmount?: number };
}

/**
 * 好友助力状态
 */
export interface FriendAssistState {
  playerId: string;
  /** 我发出的请求 */
  myRequests: AssistRequest[];
  /** 我收到的请求 */
  receivedRequests: AssistRequest[];
  /** 我已接受的请求（我去帮助别人） */
  acceptedRequests: string[]; // request IDs
  /** 历史助力记录 */
  history: AssistRecord[];
  /** 今日已助力次数 */
  todayAssists: number;
  /** 今日已接收助力次数 */
  todayReceived: number;
  /** 最后重置日期 */
  lastResetDate: string;
  /** 助力点数（用于兑换） */
  assistPoints: number;
}

/**
 * 助力记录
 */
export interface AssistRecord {
  requestId: string;
  type: AssistType;
  partnerId: string;
  partnerName: string;
  role: 'requester' | 'helper';
  reward: AssistReward;
  timestamp: number;
}

// ==================== 配置 ====================

export const ASSIST_CONFIG = {
  maxActiveRequests: 5, // 最大活跃请求数
  maxReceivedRequests: 20, // 最大接收请求数
  requestExpiryHours: 24, // 请求过期时间
  dailyAssistLimit: 10, // 每日助力次数限制
  dailyReceiveLimit: 10, // 每日接收助力次数限制
  basePoints: 10, // 每次助力获得点数
};

export const ASSIST_TEMPLATES: Record<AssistType, { description: string; reward: AssistReward }> = {
  battle: {
    description: '请求好友助战 BOSS',
    reward: {
      requester: { gold: 5000, exp: 1000 },
      helper: { gold: 3000, exp: 500, diamond: 5 },
    },
  },
  resource: {
    description: '请求好友赠送体力',
    reward: {
      requester: { stamina: 30 },
      helper: { gold: 1000 },
    },
  },
  quest: {
    description: '请求好友帮助完成任务',
    reward: {
      requester: { gold: 3000, exp: 500 },
      helper: { gold: 2000, exp: 300 },
    },
  },
  gacha: {
    description: '请求好友见证召唤（获得额外奖励）',
    reward: {
      requester: { diamond: 10 },
      helper: { diamond: 5 },
    },
  },
  boss: {
    description: '请求好友协助挑战世界 BOSS',
    reward: {
      requester: { gold: 10000, exp: 2000 },
      helper: { gold: 5000, exp: 1000, diamond: 10 },
    },
  },
};

// ==================== 工具函数 ====================

export function getTodayStr(now?: number): string {
  const d = new Date(now ?? Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function generateRequestId(): string {
  return `assist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// ==================== 核心函数 ====================

/**
 * 创建好友助力状态
 */
export function createFriendAssistState(playerId: string, now?: number): FriendAssistState {
  return {
    playerId,
    myRequests: [],
    receivedRequests: [],
    acceptedRequests: [],
    history: [],
    todayAssists: 0,
    todayReceived: 0,
    lastResetDate: getTodayStr(now),
    assistPoints: 0,
  };
}

/**
 * 检查并重置每日计数
 */
export function checkDailyReset(state: FriendAssistState, now?: number): FriendAssistState {
  const today = getTodayStr(now);
  if (today !== state.lastResetDate) {
    return {
      ...state,
      todayAssists: 0,
      todayReceived: 0,
      lastResetDate: today,
      // 清理过期请求
      myRequests: state.myRequests.filter(r => r.expiresAt > Date.now()),
      receivedRequests: state.receivedRequests.filter(r => r.expiresAt > Date.now()),
    };
  }
  return state;
}

/**
 * 创建助力请求
 */
export function createAssistRequest(
  state: FriendAssistState,
  type: AssistType,
  playerName: string,
  now?: number
): { state: FriendAssistState; request?: AssistRequest; error?: string } {
  state = checkDailyReset(state, now);
  
  const currentTime = now ?? Date.now();
  
  // 检查限制
  if (state.myRequests.filter(r => r.status === 'pending').length >= ASSIST_CONFIG.maxActiveRequests) {
    return { state, error: '已达到最大活跃请求数' };
  }
  
  const template = ASSIST_TEMPLATES[type];
  const request: AssistRequest = {
    id: generateRequestId(),
    requesterId: state.playerId,
    requesterName: playerName,
    type,
    description: template.description,
    reward: template.reward,
    status: 'pending',
    createdAt: currentTime,
    expiresAt: currentTime + ASSIST_CONFIG.requestExpiryHours * 60 * 60 * 1000,
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
 * 接受助力请求
 */
export function acceptAssistRequest(
  state: FriendAssistState,
  requestId: string,
  helperName: string,
  now?: number
): { state: FriendAssistState; success: boolean; error?: string } {
  state = checkDailyReset(state, now);
  
  // 检查助力次数限制
  if (state.todayAssists >= ASSIST_CONFIG.dailyAssistLimit) {
    return { state, success: false, error: '今日助力次数已达上限' };
  }
  
  const request = state.receivedRequests.find(r => r.id === requestId);
  if (!request) {
    return { state, success: false, error: '请求不存在' };
  }
  if (request.status !== 'pending') {
    return { state, success: false, error: '请求已被处理' };
  }
  if (state.acceptedRequests.includes(requestId)) {
    return { state, success: false, error: '已接受过该请求' };
  }
  
  const currentTime = now ?? Date.now();
  
  // 更新请求状态
  const updatedRequests = state.receivedRequests.map(r =>
    r.id === requestId
      ? { ...r, status: 'accepted' as AssistStatus, acceptedBy: helperName, acceptedAt: currentTime }
      : r
  );
  
  return {
    state: {
      ...state,
      receivedRequests: updatedRequests,
      acceptedRequests: [...state.acceptedRequests, requestId],
    },
    success: true,
  };
}

/**
 * 完成助力
 */
export function completeAssist(
  state: FriendAssistState,
  requestId: string,
  now?: number
): { state: FriendAssistState; success: boolean; reward?: AssistReward; error?: string } {
  state = checkDailyReset(state, now);
  
  const request = state.receivedRequests.find(r => r.id === requestId);
  if (!request) {
    return { state, success: false, error: '请求不存在' };
  }
  if (request.status !== 'accepted') {
    return { state, success: false, error: '请求未处于进行中状态' };
  }
  
  const currentTime = now ?? Date.now();
  
  // 更新请求状态
  const updatedRequests = state.receivedRequests.map(r =>
    r.id === requestId
      ? { ...r, status: 'completed' as AssistStatus, completedAt: currentTime }
      : r
  );
  
  // 添加历史记录
  const record: AssistRecord = {
    requestId,
    type: request.type,
    partnerId: request.requesterId,
    partnerName: request.requesterName,
    role: 'helper',
    reward: request.reward,
    timestamp: currentTime,
  };
  
  // 增加助力点数
  const newPoints = state.assistPoints + ASSIST_CONFIG.basePoints;
  
  return {
    state: {
      ...state,
      receivedRequests: updatedRequests,
      acceptedRequests: state.acceptedRequests.filter(id => id !== requestId),
      history: [record, ...state.history].slice(0, 100),
      todayAssists: state.todayAssists + 1,
      assistPoints: newPoints,
    },
    success: true,
    reward: request.reward,
  };
}

/**
 * 接收助力（请求者获得帮助）
 */
export function receiveAssist(
  state: FriendAssistState,
  requestId: string,
  now?: number
): { state: FriendAssistState; success: boolean; reward?: AssistReward; error?: string } {
  state = checkDailyReset(state, now);
  
  const request = state.myRequests.find(r => r.id === requestId);
  if (!request) {
    return { state, success: false, error: '请求不存在' };
  }
  if (request.status !== 'completed') {
    return { state, success: false, error: '助力未完成' };
  }
  
  // 检查是否已领取奖励
  const alreadyClaimed = state.history.some(h => h.requestId === requestId && h.role === 'requester');
  if (alreadyClaimed) {
    return { state, success: false, error: '奖励已领取' };
  }
  
  const currentTime = now ?? Date.now();
  
  // 更新请求状态
  const updatedRequests = state.myRequests.map(r =>
    r.id === requestId ? { ...r, status: 'expired' as AssistStatus } : r
  );
  
  // 添加历史记录
  const record: AssistRecord = {
    requestId,
    type: request.type,
    partnerId: request.acceptedBy || 'unknown',
    partnerName: request.acceptedBy || 'unknown',
    role: 'requester',
    reward: request.reward,
    timestamp: currentTime,
  };
  
  return {
    state: {
      ...state,
      myRequests: updatedRequests,
      history: [record, ...state.history].slice(0, 100),
      todayReceived: state.todayReceived + 1,
    },
    success: true,
    reward: request.reward,
  };
}

/**
 * 取消请求
 */
export function cancelRequest(state: FriendAssistState, requestId: string): { state: FriendAssistState; success: boolean; error?: string } {
  const request = state.myRequests.find(r => r.id === requestId);
  if (!request) {
    return { state, success: false, error: '请求不存在' };
  }
  if (request.status !== 'pending') {
    return { state, success: false, error: '请求已被处理，无法取消' };
  }
  
  return {
    state: {
      ...state,
      myRequests: state.myRequests.filter(r => r.id !== requestId),
    },
    success: true,
  };
}

/**
 * 拒绝请求
 */
export function declineRequest(state: FriendAssistState, requestId: string): { state: FriendAssistState; success: boolean; error?: string } {
  const request = state.receivedRequests.find(r => r.id === requestId);
  if (!request) {
    return { state, success: false, error: '请求不存在' };
  }
  if (request.status !== 'pending') {
    return { state, success: false, error: '请求已被处理' };
  }
  
  return {
    state: {
      ...state,
      receivedRequests: state.receivedRequests.map(r =>
        r.id === requestId ? { ...r, status: 'declined' as AssistStatus } : r
      ),
    },
    success: true,
  };
}

/**
 * 获取可接受的请求
 */
export function getAvailableRequests(state: FriendAssistState): AssistRequest[] {
  const now = Date.now();
  return state.receivedRequests.filter(
    r => r.status === 'pending' && r.expiresAt > now && !state.acceptedRequests.includes(r.id)
  );
}

/**
 * 获取我的活跃请求
 */
export function getMyActiveRequests(state: FriendAssistState): AssistRequest[] {
  const now = Date.now();
  return state.myRequests.filter(r => ['pending', 'accepted'].includes(r.status) && r.expiresAt > now);
}

/**
 * 获取助力统计
 */
export function getAssistStats(state: FriendAssistState): {
  totalAssists: number;
  totalReceived: number;
  todayAssists: number;
  todayReceived: number;
  assistPoints: number;
  remainingAssists: number;
  remainingReceived: number;
  activeRequests: number;
} {
  return {
    totalAssists: state.history.filter(h => h.role === 'helper').length,
    totalReceived: state.history.filter(h => h.role === 'requester').length,
    todayAssists: state.todayAssists,
    todayReceived: state.todayReceived,
    assistPoints: state.assistPoints,
    remainingAssists: ASSIST_CONFIG.dailyAssistLimit - state.todayAssists,
    remainingReceived: ASSIST_CONFIG.dailyReceiveLimit - state.todayReceived,
    activeRequests: getMyActiveRequests(state).length,
  };
}

/**
 * 使用助力点数兑换
 */
export function redeemAssistPoints(
  state: FriendAssistState,
  cost: number,
  reward: { gold?: number; diamond?: number; exp?: number; item?: string; itemAmount?: number }
): { state: FriendAssistState; success: boolean; error?: string } {
  if (state.assistPoints < cost) {
    return { state, success: false, error: '助力点数不足' };
  }
  
  return {
    state: {
      ...state,
      assistPoints: state.assistPoints - cost,
    },
    success: true,
  };
}

/**
 * 导出数据
 */
export function exportAssistData(state: FriendAssistState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importAssistData(json: string): FriendAssistState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !Array.isArray(data.myRequests)) return null;
    return data as FriendAssistState;
  } catch {
    return null;
  }
}
