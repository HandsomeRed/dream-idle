// 排行榜系统 v2 - v0.80
// Leaderboard System Extended - 多榜单/赛季重置/排名奖励/历史纪录

/**
 * 奖励物品
 */
export interface RewardItem {
  type: 'gold' | 'diamond' | 'exp' | 'stamina' | 'petFood' | 'petShard' | 'equipBox' | 'material' | 'artifact' | 'title' | 'summonTicket';
  amount: number;
  name: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 榜单类型
 */
export type LeaderboardType = 'power' | 'level' | 'tower' | 'arena' | 'guild' | 'pet' | 'wealth' | 'achievement';

/**
 * 排名奖励配置
 */
export interface RankReward {
  minRank: number;
  maxRank: number;
  rewards: RewardItem[];
  title?: string;
  frame?: string;
}

/**
 * 榜单配置
 */
export interface LeaderboardConfig {
  type: LeaderboardType;
  name: string;
  resetType: 'daily' | 'weekly' | 'monthly' | 'season' | 'never';
  rewardConfig: RankReward[];
  maxDisplayRanks: number;
  showPercentage: boolean;
}

/**
 * 排行榜条目
 */
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
  previousRank: number;
  updatedAt: number;
  isPlayer: boolean; // 是否是自己
}

/**
 * 玩家排名数据
 */
export interface PlayerRankData {
  playerId: string;
  scores: Record<LeaderboardType, number>;
  ranks: Record<LeaderboardType, number>;
  bestRanks: Record<LeaderboardType, number>;
  totalPoints: number;
  globalRank: number;
}

/**
 * 排行榜系统状态
 */
export interface LeaderboardState {
  playerId: string;
  /** 各榜单数据 */
  entries: Record<LeaderboardType, LeaderboardEntry[]>;
  /** 玩家排名 */
  playerRanks: PlayerRankData;
  /** 已领取奖励 */
  claimedRewards: Record<string, string[]>; // seasonId -> rewardId[]
  /** 当前赛季 */
  currentSeason: string;
  /** 赛季开始时间 */
  seasonStartTime: number;
  /** 赛季结束时间 */
  seasonEndTime: number;
  /** 最后更新时间 */
  lastUpdateTime: number;
}

// ==================== 榜单配置 ====================

export const LEADERBOARD_CONFIGS: Record<LeaderboardType, Omit<LeaderboardConfig, 'type'>> = {
  power: {
    name: '战力榜',
    resetType: 'season',
    rewardConfig: [
      { minRank: 1, maxRank: 1, rewards: [{ type: 'diamond', amount: 1000, name: '钻石' }, { type: 'title', amount: 1, name: '全服第一称号' }], title: '全服第一', frame: 'legendary' },
      { minRank: 2, maxRank: 3, rewards: [{ type: 'diamond', amount: 500, name: '钻石' }], title: '全服前三', frame: 'epic' },
      { minRank: 4, maxRank: 10, rewards: [{ type: 'diamond', amount: 200, name: '钻石' }], title: '全服前十', frame: 'rare' },
      { minRank: 11, maxRank: 50, rewards: [{ type: 'diamond', amount: 50, name: '钻石' }] },
      { minRank: 51, maxRank: 100, rewards: [{ type: 'diamond', amount: 20, name: '钻石' }] },
    ],
    maxDisplayRanks: 100,
    showPercentage: false,
  },
  level: {
    name: '等级榜',
    resetType: 'season',
    rewardConfig: [
      { minRank: 1, maxRank: 1, rewards: [{ type: 'diamond', amount: 500, name: '钻石' }] },
      { minRank: 2, maxRank: 10, rewards: [{ type: 'diamond', amount: 100, name: '钻石' }] },
    ],
    maxDisplayRanks: 50,
    showPercentage: false,
  },
  tower: {
    name: '爬塔榜',
    resetType: 'weekly',
    rewardConfig: [
      { minRank: 1, maxRank: 1, rewards: [{ type: 'diamond', amount: 300, name: '钻石' }] },
      { minRank: 2, maxRank: 5, rewards: [{ type: 'diamond', amount: 100, name: '钻石' }] },
    ],
    maxDisplayRanks: 20,
    showPercentage: false,
  },
  arena: {
    name: '竞技场榜',
    resetType: 'season',
    rewardConfig: [
      { minRank: 1, maxRank: 1, rewards: [{ type: 'diamond', amount: 800, name: '钻石' }] },
      { minRank: 2, maxRank: 10, rewards: [{ type: 'diamond', amount: 200, name: '钻石' }] },
    ],
    maxDisplayRanks: 100,
    showPercentage: false,
  },
  guild: {
    name: '公会榜',
    resetType: 'season',
    rewardConfig: [],
    maxDisplayRanks: 20,
    showPercentage: false,
  },
  pet: {
    name: '宠物榜',
    resetType: 'season',
    rewardConfig: [
      { minRank: 1, maxRank: 1, rewards: [{ type: 'petShard', amount: 100, name: '宠物碎片' }] },
    ],
    maxDisplayRanks: 50,
    showPercentage: false,
  },
  wealth: {
    name: '富豪榜',
    resetType: 'season',
    rewardConfig: [
      { minRank: 1, maxRank: 1, rewards: [{ type: 'diamond', amount: 500, name: '钻石' }] },
    ],
    maxDisplayRanks: 50,
    showPercentage: false,
  },
  achievement: {
    name: '成就榜',
    resetType: 'never',
    rewardConfig: [],
    maxDisplayRanks: 100,
    showPercentage: false,
  },
};

export const SEASON_DURATION_DAYS = 30;
export const MAX_DISPLAY_RANKS = 100;

// ==================== 工具函数 ====================

export function getNow(): number {
  return Date.now();
}

export function getLeaderboardName(type: LeaderboardType): string {
  return LEADERBOARD_CONFIGS[type].name;
}

export function getResetTypeName(resetType: string): string {
  const names: Record<string, string> = {
    daily: '每日',
    weekly: '每周',
    monthly: '每月',
    season: '每赛季',
    never: '永久',
  };
  return names[resetType] || resetType;
}

// ==================== 核心函数 ====================

/**
 * 创建排行榜系统状态
 */
export function createLeaderboardState(playerId: string, now?: number): LeaderboardState {
  const currentTime = now ?? getNow();
  const seasonEndTime = currentTime + SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000;

  const entries: Record<LeaderboardType, LeaderboardEntry[]> = {
    power: [], level: [], tower: [], arena: [], guild: [], pet: [], wealth: [], achievement: [],
  };

  const playerRanks: PlayerRankData = {
    playerId,
    scores: { power: 0, level: 0, tower: 0, arena: 0, guild: 0, pet: 0, wealth: 0, achievement: 0 },
    ranks: { power: 0, level: 0, tower: 0, arena: 0, guild: 0, pet: 0, wealth: 0, achievement: 0 },
    bestRanks: { power: 0, level: 0, tower: 0, arena: 0, guild: 0, pet: 0, wealth: 0, achievement: 0 },
    totalPoints: 0,
    globalRank: 0,
  };

  return {
    playerId,
    entries,
    playerRanks,
    claimedRewards: {},
    currentSeason: `season_${Math.floor(currentTime / (SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000))}`,
    seasonStartTime: currentTime,
    seasonEndTime,
    lastUpdateTime: currentTime,
  };
}

/**
 * 更新玩家排名
 */
export function updatePlayerRank(
  state: LeaderboardState,
  type: LeaderboardType,
  value: number,
  playerName?: string,
  now?: number
): { state: LeaderboardState; newRank: number; previousRank: number; rankChanged: boolean } {
  const currentTime = now ?? getNow();
  const entries = [...state.entries[type]];
  const previousRank = state.playerRanks.ranks[type];

  // 移除旧记录
  const oldIndex = entries.findIndex(e => e.playerId === state.playerId);
  let previousValue = 0;
  if (oldIndex !== -1) {
    previousValue = entries[oldIndex].value;
    entries.splice(oldIndex, 1);
  }

  // 添加新记录
  const newEntry: LeaderboardEntry = {
    rank: 0,
    playerId: state.playerId,
    playerName: playerName || '玩家',
    value,
    previousRank: previousRank > 0 ? previousRank : entries.length + 1,
    updatedAt: currentTime,
    isPlayer: true,
  };

  entries.push(newEntry);

  // 排序（值高的在前）
  entries.sort((a, b) => b.value - a.value);

  // 更新排名
  const newRank = entries.findIndex(e => e.playerId === state.playerId) + 1;
  entries[newRank - 1].rank = newRank;

  // 更新其他条目的排名
  entries.forEach((e, i) => {
    e.rank = i + 1;
    if (e.playerId !== state.playerId) {
      e.isPlayer = false;
    }
  });

  // 截取显示
  const config = LEADERBOARD_CONFIGS[type];
  const newEntries = entries.slice(0, config.maxDisplayRanks);

  // 更新玩家数据
  const newState = { ...state, entries: { ...state.entries, [type]: newEntries } };
  newState.playerRanks.scores[type] = value;
  newState.playerRanks.ranks[type] = newRank;

  // 更新最佳排名
  if (previousRank === 0 || newRank < newState.playerRanks.bestRanks[type]) {
    newState.playerRanks.bestRanks[type] = newRank;
  }

  // 计算总分和全局排名
  newState.playerRanks.totalPoints = Object.values(newState.playerRanks.scores).reduce((a, b) => a + b, 0);
  newState.playerRanks.globalRank = calculateGlobalRank(newState);

  newState.lastUpdateTime = currentTime;

  return {
    state: newState,
    newRank,
    previousRank,
    rankChanged: newRank !== previousRank,
  };
}

/**
 * 计算全局排名（简化版）
 */
function calculateGlobalRank(state: LeaderboardState): number {
  const totalScore = state.playerRanks.totalPoints;
  // 简化计算：根据总分估算
  if (totalScore >= 10000) return 1;
  if (totalScore >= 5000) return 10;
  if (totalScore >= 1000) return 50;
  if (totalScore >= 500) return 100;
  if (totalScore >= 100) return 500;
  return 1000;
}

/**
 * 获取榜单前 N 名
 */
export function getTopRanks(state: LeaderboardState, type: LeaderboardType, limit: number = 10): LeaderboardEntry[] {
  return state.entries[type].slice(0, limit);
}

/**
 * 获取玩家附近排名
 */
export function getNearbyRanks(state: LeaderboardState, type: LeaderboardType, range: number = 5): LeaderboardEntry[] {
  const entries = state.entries[type];
  const playerRank = state.playerRanks.ranks[type];

  if (playerRank === 0) return entries.slice(0, range * 2);

  const start = Math.max(0, playerRank - range - 1);
  const end = Math.min(entries.length, playerRank + range);

  return entries.slice(start, end);
}

/**
 * 检查是否可以领取奖励
 */
export function canClaimReward(state: LeaderboardState, type: LeaderboardType, rank: number): { can: boolean; reason?: string } {
  const config = LEADERBOARD_CONFIGS[type];
  if (!config.rewardConfig || config.rewardConfig.length === 0) {
    return { can: false, reason: '该榜单无排名奖励' };
  }

  const rewardTier = config.rewardConfig.find(r => rank >= r.minRank && rank <= r.maxRank);
  if (!rewardTier) {
    return { can: false, reason: '该排名无奖励' };
  }

  const rewardId = `${type}_${rank}`;
  if (state.claimedRewards[state.currentSeason]?.includes(rewardId)) {
    return { can: false, reason: '奖励已领取' };
  }

  return { can: true };
}

/**
 * 领取排名奖励
 */
export function claimRankReward(
  state: LeaderboardState,
  type: LeaderboardType,
  rank: number
): { state: LeaderboardState; success: boolean; rewards?: RewardItem[]; title?: string; frame?: string; error?: string } {
  const check = canClaimReward(state, type, rank);
  if (!check.can) {
    return { state, success: false, error: check.reason };
  }

  const config = LEADERBOARD_CONFIGS[type];
  const rewardTier = config.rewardConfig.find(r => rank >= r.minRank && rank <= r.maxRank);
  if (!rewardTier) {
    return { state, success: false, error: '无对应奖励' };
  }

  const rewardId = `${type}_${rank}`;
  const newClaimedRewards = {
    ...state.claimedRewards,
    [state.currentSeason]: [...(state.claimedRewards[state.currentSeason] || []), rewardId],
  };

  return {
    state: { ...state, claimedRewards: newClaimedRewards },
    success: true,
    rewards: rewardTier.rewards,
    title: rewardTier.title,
    frame: rewardTier.frame,
  };
}

/**
 * 赛季重置
 */
export function seasonReset(state: LeaderboardState, now?: number): LeaderboardState {
  const currentTime = now ?? getNow();
  const newSeason = `season_${Math.floor(currentTime / (SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000))}`;

  return {
    ...state,
    entries: {
      power: [], level: [], tower: [], arena: [], guild: [], pet: [], wealth: [], achievement: [],
    },
    playerRanks: {
      ...state.playerRanks,
      ranks: { power: 0, level: 0, tower: 0, arena: 0, guild: 0, pet: 0, wealth: 0, achievement: 0 },
    },
    claimedRewards: {},
    currentSeason: newSeason,
    seasonStartTime: currentTime,
    seasonEndTime: currentTime + SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000,
    lastUpdateTime: currentTime,
  };
}

/**
 * 获取排行榜统计
 */
export function getLeaderboardStats(state: LeaderboardState): {
  currentSeason: string;
  seasonDaysLeft: number;
  bestRank: number;
  bestRankType: LeaderboardType | null;
  totalPoints: number;
  globalRank: number;
  claimableRewards: number;
} {
  const daysLeft = Math.max(0, Math.ceil((state.seasonEndTime - getNow()) / (24 * 60 * 60 * 1000)));

  // 找最佳排名
  let bestRank = 9999;
  let bestRankType: LeaderboardType | null = null;
  Object.entries(state.playerRanks.ranks).forEach(([type, rank]) => {
    if (rank > 0 && rank < bestRank) {
      bestRank = rank;
      bestRankType = type as LeaderboardType;
    }
  });

  // 计算可领取奖励数
  let claimableRewards = 0;
  Object.keys(LEADERBOARD_CONFIGS).forEach(key => {
    const type = key as LeaderboardType;
    const rank = state.playerRanks.ranks[type];
    if (rank > 0) {
      const check = canClaimReward(state, type, rank);
      if (check.can) claimableRewards++;
    }
  });

  return {
    currentSeason: state.currentSeason,
    seasonDaysLeft: daysLeft,
    bestRank: bestRank === 9999 ? 0 : bestRank,
    bestRankType,
    totalPoints: state.playerRanks.totalPoints,
    globalRank: state.playerRanks.globalRank,
    claimableRewards,
  };
}

/**
 * 导出数据
 */
export function exportLeaderboardData(state: LeaderboardState): string {
  return JSON.stringify(state);
}

/**
 * 导入数据
 */
export function importLeaderboardData(json: string): LeaderboardState | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || !data.playerRanks) return null;
    return data as LeaderboardState;
  } catch {
    return null;
  }
}
