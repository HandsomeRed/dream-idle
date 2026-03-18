/**
 * v0.22 竞技场系统 (Arena PVP System)
 * 
 * 功能：
 * - 异步 PVP 对战（攻击其他玩家阵容）
 * - 排名系统（积分排行榜）
 * - 每日挑战次数
 * - 赛季重置
 * - 防守阵容设置
 * - 战斗回放
 */

// ==================== 类型定义 ====================

export type ArenaTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'legend';

export interface ArenaPlayer {
  playerId: string;
  playerName: string;
  level: number;
  power: number;
  tier: ArenaTier;
  points: number;
  rank: number;
  defenseFormation: string[]; // 宠物 ID 列表
  wins: number;
  losses: number;
  seasonWins: number;
  seasonLosses: number;
}

export interface ArenaChallenge {
  challengerId: string;
  defenderId: string;
  challengerPower: number;
  defenderPower: number;
  isVictory: boolean;
  rounds: number;
  timestamp: number;
  pointsGained: number;
  pointsLost: number;
}

export interface ArenaSeason {
  seasonId: number;
  startTime: number;
  endTime: number;
  isActive: boolean;
  topPlayers: ArenaPlayer[];
}

export interface ArenaProgress {
  playerId: string;
  points: number;
  rank: number;
  tier: ArenaTier;
  wins: number;
  losses: number;
  dailyChallenges: number;
  maxDailyChallenges: number;
  defenseFormation: string[];
  battleHistory: ArenaChallenge[];
  seasonId: number;
  seasonWins: number;
  seasonLosses: number;
  lastChallengeTime: number;
}

export interface ArenaReward {
  tier: ArenaTier;
  minPoints: number;
  rewards: {
    gold: number;
    diamond: number;
    arenaToken: number;
  };
}

export interface ArenaConfig {
  seasonDurationDays: number;
  maxDailyChallenges: number;
  challengeRefreshTime: string; // HH:MM format
  basePoints: number;
  pointsPerWin: number;
  pointsPerLoss: number;
  tierThresholds: { [tier in ArenaTier]: number };
  rewards: ArenaReward[];
}

// ==================== 配置 ====================

export const ARENA_CONFIG: ArenaConfig = {
  seasonDurationDays: 30,
  maxDailyChallenges: 10,
  challengeRefreshTime: '05:00',
  basePoints: 1000,
  pointsPerWin: 20,
  pointsPerLoss: -10,
  tierThresholds: {
    bronze: 0,
    silver: 1200,
    gold: 1500,
    platinum: 1800,
    diamond: 2100,
    master: 2400,
    legend: 2700,
  },
  rewards: [
    { tier: 'bronze', minPoints: 0, rewards: { gold: 100, diamond: 0, arenaToken: 5 } },
    { tier: 'silver', minPoints: 1200, rewards: { gold: 200, diamond: 5, arenaToken: 10 } },
    { tier: 'gold', minPoints: 1500, rewards: { gold: 500, diamond: 10, arenaToken: 20 } },
    { tier: 'platinum', minPoints: 1800, rewards: { gold: 1000, diamond: 20, arenaToken: 30 } },
    { tier: 'diamond', minPoints: 2100, rewards: { gold: 2000, diamond: 50, arenaToken: 50 } },
    { tier: 'master', minPoints: 2400, rewards: { gold: 5000, diamond: 100, arenaToken: 100 } },
    { tier: 'legend', minPoints: 2700, rewards: { gold: 10000, diamond: 200, arenaToken: 200 } },
  ],
};

// ==================== 工具函数 ====================

/**
 * 创建竞技场进度
 */
export function createArenaProgress(playerId: string, playerName: string): ArenaProgress {
  return {
    playerId,
    points: ARENA_CONFIG.basePoints,
    rank: 0,
    tier: 'bronze',
    wins: 0,
    losses: 0,
    dailyChallenges: 0,
    maxDailyChallenges: ARENA_CONFIG.maxDailyChallenges,
    defenseFormation: [],
    battleHistory: [],
    seasonId: 1,
    seasonWins: 0,
    seasonLosses: 0,
    lastChallengeTime: 0,
  };
}

/**
 * 获取段位
 */
export function getTier(points: number): ArenaTier {
  const tiers: ArenaTier[] = ['legend', 'master', 'diamond', 'platinum', 'gold', 'silver', 'bronze'];
  
  for (const tier of tiers) {
    if (points >= ARENA_CONFIG.tierThresholds[tier]) {
      return tier;
    }
  }
  
  return 'bronze';
}

/**
 * 计算积分变化
 */
export function calculatePointsChange(
  challengerPoints: number,
  defenderPoints: number,
  isVictory: boolean
): { challengerChange: number; defenderChange: number } {
  const pointDiff = defenderPoints - challengerPoints;
  
  // 基础变化
  let baseChange = isVictory ? ARENA_CONFIG.pointsPerWin : ARENA_CONFIG.pointsPerLoss;
  
  // 根据分差调整（打赢高分获得更多，打输低分扣除更多）
  const diffMultiplier = Math.min(2, Math.max(0.5, 1 + pointDiff / 500));
  
  const change = Math.floor(baseChange * diffMultiplier);
  
  if (isVictory) {
    return {
      challengerChange: Math.max(5, change), // 至少获得 5 分
      defenderChange: Math.max(-20, -change), // 最多损失 20 分
    };
  } else {
    return {
      challengerChange: Math.min(-5, change), // 至少损失 5 分
      defenderChange: Math.min(20, -change), // 最多获得 20 分
    };
  }
}

/**
 * 发起挑战
 */
export function challengeArena(
  progress: ArenaProgress,
  defender: ArenaPlayer,
  challengerPower: number,
  isVictory: boolean,
  rounds: number
): { progress: ArenaProgress; challenge: ArenaChallenge } {
  if (progress.dailyChallenges >= progress.maxDailyChallenges) {
    throw new Error('今日挑战次数已用尽');
  }

  const pointsChange = calculatePointsChange(progress.points, defender.points, isVictory);
  
  const newProgress: ArenaProgress = {
    ...progress,
    points: Math.max(0, progress.points + pointsChange.challengerChange),
    wins: isVictory ? progress.wins + 1 : progress.wins,
    losses: isVictory ? progress.losses : progress.losses + 1,
    seasonWins: isVictory ? progress.seasonWins + 1 : progress.seasonWins,
    seasonLosses: isVictory ? progress.seasonLosses : progress.seasonLosses + 1,
    dailyChallenges: progress.dailyChallenges + 1,
    lastChallengeTime: Date.now(),
  };
  
  // 更新段位
  newProgress.tier = getTier(newProgress.points);

  const challenge: ArenaChallenge = {
    challengerId: progress.playerId,
    defenderId: defender.playerId,
    challengerPower,
    defenderPower: defender.power,
    isVictory,
    rounds,
    timestamp: Date.now(),
    pointsGained: isVictory ? pointsChange.challengerChange : 0,
    pointsLost: isVictory ? 0 : Math.abs(pointsChange.challengerChange),
  };

  newProgress.battleHistory = [challenge, ...progress.battleHistory].slice(0, 50); // 保留最近 50 场

  return { progress: newProgress, challenge };
}

/**
 * 设置防守阵容
 */
export function setDefenseFormation(progress: ArenaProgress, petIds: string[]): ArenaProgress {
  if (petIds.length > 3) {
    throw new Error('防守阵容最多 3 只宠物');
  }

  return {
    ...progress,
    defenseFormation: petIds,
  };
}

/**
 * 刷新每日挑战次数
 */
export function refreshDailyChallenges(progress: ArenaProgress): ArenaProgress {
  if (progress.lastChallengeTime === 0) {
    return progress;
  }
  
  const now = new Date();
  const [refreshHour] = ARENA_CONFIG.challengeRefreshTime.split(':').map(Number);
  
  const lastChallenge = new Date(progress.lastChallengeTime);
  
  // 检查是否是不同的一天（考虑刷新时间）
  const lastChallengeDay = new Date(lastChallenge.getFullYear(), lastChallenge.getMonth(), lastChallenge.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 如果现在是刷新时间之后，且上次挑战是昨天或更早
  const isAfterRefresh = now.getHours() >= refreshHour;
  const isDifferentDay = lastChallengeDay.getTime() < nowDay.getTime();
  
  if (isDifferentDay && isAfterRefresh) {
    return {
      ...progress,
      dailyChallenges: 0,
    };
  }
  
  return progress;
}

/**
 * 获取排名奖励
 */
export function getRankReward(rank: number): { gold: number; diamond: number; arenaToken: number } {
  if (rank === 1) return { gold: 5000, diamond: 200, arenaToken: 500 };
  if (rank <= 3) return { gold: 3000, diamond: 100, arenaToken: 300 };
  if (rank <= 10) return { gold: 2000, diamond: 50, arenaToken: 200 };
  if (rank <= 50) return { gold: 1000, diamond: 20, arenaToken: 100 };
  if (rank <= 100) return { gold: 500, diamond: 10, arenaToken: 50 };
  return { gold: 100, diamond: 0, arenaToken: 10 };
}

/**
 * 获取段位奖励
 */
export function getTierReward(tier: ArenaTier): ArenaReward | undefined {
  return ARENA_CONFIG.rewards.find((r) => r.tier === tier);
}

/**
 * 计算赛季结束时间
 */
export function getSeasonEndTime(startTime: number): number {
  return startTime + ARENA_CONFIG.seasonDurationDays * 24 * 60 * 60 * 1000;
}

/**
 * 创建新赛季
 */
export function createNewSeason(previousTopPlayers: ArenaPlayer[], seasonId: number): ArenaSeason {
  const now = Date.now();
  
  return {
    seasonId,
    startTime: now,
    endTime: getSeasonEndTime(now),
    isActive: true,
    topPlayers: previousTopPlayers.slice(0, 100), // 保留前 100 名
  };
}

/**
 * 重置赛季进度
 */
export function resetSeasonProgress(progress: ArenaProgress, newSeasonId: number): ArenaProgress {
  // 根据上赛季排名给予奖励和继承积分
  const rankReward = getRankReward(progress.rank);
  const tierReward = getTierReward(progress.tier);
  
  // 新赛季继承部分积分（根据上赛季段位）
  const inheritPoints = Math.floor(progress.points * 0.5);
  
  return {
    ...progress,
    points: ARENA_CONFIG.basePoints + inheritPoints,
    rank: 0,
    tier: getTier(ARENA_CONFIG.basePoints + inheritPoints),
    wins: 0,
    losses: 0,
    seasonWins: 0,
    seasonLosses: 0,
    seasonId: newSeasonId,
    battleHistory: [],
    lastChallengeTime: Date.now(),
  };
}

/**
 * 匹配对手
 */
export function matchOpponents(
  progress: ArenaProgress,
  allPlayers: ArenaPlayer[],
  count: number = 3
): ArenaPlayer[] {
  // 筛选相近积分的玩家
  const minPoints = Math.max(0, progress.points - 200);
  const maxPoints = progress.points + 200;
  
  const candidates = allPlayers.filter(
    (p) =>
      p.playerId !== progress.playerId &&
      p.points >= minPoints &&
      p.points <= maxPoints
  );
  
  // 随机选择
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 获取竞技场统计
 */
export function getArenaStats(progress: ArenaProgress): {
  winRate: number;
  totalBattles: number;
  seasonWinRate: number;
  seasonTotalBattles: number;
  averageRounds: number;
} {
  const totalBattles = progress.wins + progress.losses;
  const seasonTotalBattles = progress.seasonWins + progress.seasonLosses;
  
  const winRate = totalBattles > 0 ? (progress.wins / totalBattles) * 100 : 0;
  const seasonWinRate = seasonTotalBattles > 0 ? (progress.seasonWins / seasonTotalBattles) * 100 : 0;
  
  const avgRounds =
    progress.battleHistory.length > 0
      ? progress.battleHistory.reduce((sum, b) => sum + b.rounds, 0) / progress.battleHistory.length
      : 0;

  return {
    winRate: Math.floor(winRate * 100) / 100,
    totalBattles,
    seasonWinRate: Math.floor(seasonWinRate * 100) / 100,
    seasonTotalBattles,
    averageRounds: Math.floor(avgRounds * 100) / 100,
  };
}

/**
 * 检查是否可以挑战
 */
export function canChallenge(progress: ArenaProgress): boolean {
  const refreshed = refreshDailyChallenges(progress);
  return refreshed.dailyChallenges < refreshed.maxDailyChallenges;
}

/**
 * 获取剩余挑战次数
 */
export function getRemainingChallenges(progress: ArenaProgress): number {
  const refreshed = refreshDailyChallenges(progress);
  return refreshed.maxDailyChallenges - refreshed.dailyChallenges;
}


