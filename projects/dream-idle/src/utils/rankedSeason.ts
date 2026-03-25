// 排行榜赛季系统 - v0.69
// Ranked Season with ELO rating, tiers, and seasonal rewards

/**
 * 段位等级
 */
export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'legend';

/**
 * 段位子级
 */
export type RankDivision = 1 | 2 | 3;

/**
 * 排位玩家数据
 */
export interface RankedPlayer {
  playerId: string;
  name: string;
  rating: number;
  tier: RankTier;
  division: RankDivision;
  wins: number;
  losses: number;
  streak: number; // 正数=连胜, 负数=连败
  bestRating: number;
  bestTier: RankTier;
  matchHistory: MatchRecord[];
  seasonRewardClaimed: boolean;
  lastMatchTime: number;
}

/**
 * 对局记录
 */
export interface MatchRecord {
  opponentId: string;
  opponentName: string;
  opponentRating: number;
  won: boolean;
  ratingChange: number;
  timestamp: number;
}

/**
 * 赛季配置
 */
export interface RankedSeasonConfig {
  seasonId: string;
  name: string;
  startTime: number;
  endTime: number;
  initialRating: number;
  tierThresholds: Record<RankTier, number>;
  divisionRange: number; // 每个子级的分数范围
  kFactor: number; // ELO K值
  streakBonus: number; // 连胜额外分
  placementMatches: number; // 定位赛次数
}

/**
 * 赛季奖励
 */
export interface SeasonReward {
  tier: RankTier;
  gold: number;
  diamond: number;
  title?: string;
  avatar?: string;
}

// ==================== 配置 ====================

export const TIER_ORDER: Record<RankTier, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4, master: 5, legend: 6,
};

export const TIER_NAMES: Record<RankTier, string> = {
  bronze: '青铜', silver: '白银', gold: '黄金', platinum: '铂金',
  diamond: '钻石', master: '大师', legend: '传说',
};

export const TIER_COLORS: Record<RankTier, string> = {
  bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#00ced1',
  diamond: '#b9f2ff', master: '#9370db', legend: '#ff4500',
};

export const DEFAULT_SEASON: RankedSeasonConfig = {
  seasonId: 'ranked_s1',
  name: '排位赛第一季',
  startTime: new Date('2026-03-01').getTime(),
  endTime: new Date('2026-04-01').getTime(),
  initialRating: 1000,
  tierThresholds: {
    bronze: 0,
    silver: 1100,
    gold: 1300,
    platinum: 1500,
    diamond: 1700,
    master: 1900,
    legend: 2100,
  },
  divisionRange: 33, // 每个tier分成3级, 每级~33分
  kFactor: 32,
  streakBonus: 5,
  placementMatches: 10,
};

export const SEASON_REWARDS: SeasonReward[] = [
  { tier: 'bronze', gold: 1000, diamond: 10 },
  { tier: 'silver', gold: 3000, diamond: 30 },
  { tier: 'gold', gold: 5000, diamond: 50, title: '黄金斗士' },
  { tier: 'platinum', gold: 8000, diamond: 80, title: '铂金勇者' },
  { tier: 'diamond', gold: 12000, diamond: 120, title: '钻石之星', avatar: 'diamond_frame' },
  { tier: 'master', gold: 20000, diamond: 200, title: '大师之证', avatar: 'master_frame' },
  { tier: 'legend', gold: 50000, diamond: 500, title: '传说战神', avatar: 'legend_frame' },
];

// ==================== 核心函数 ====================

/**
 * 创建排位玩家
 */
export function createRankedPlayer(playerId: string, name: string, config?: RankedSeasonConfig): RankedPlayer {
  const c = config ?? DEFAULT_SEASON;
  return {
    playerId,
    name,
    rating: c.initialRating,
    tier: 'bronze',
    division: 3,
    wins: 0,
    losses: 0,
    streak: 0,
    bestRating: c.initialRating,
    bestTier: 'bronze',
    matchHistory: [],
    seasonRewardClaimed: false,
    lastMatchTime: 0,
  };
}

/**
 * 根据分数计算段位
 */
export function calculateTier(rating: number, config?: RankedSeasonConfig): { tier: RankTier; division: RankDivision } {
  const c = config ?? DEFAULT_SEASON;
  const tiers: RankTier[] = ['legend', 'master', 'diamond', 'platinum', 'gold', 'silver', 'bronze'];

  let currentTier: RankTier = 'bronze';
  for (const tier of tiers) {
    if (rating >= c.tierThresholds[tier]) {
      currentTier = tier;
      break;
    }
  }

  // 计算子级 (1=最高, 3=最低)
  const tierBase = c.tierThresholds[currentTier];
  const tierIndex = TIER_ORDER[currentTier];
  const nextTierKey = tiers.find(t => TIER_ORDER[t] === tierIndex + 1);
  const nextThreshold = nextTierKey ? c.tierThresholds[nextTierKey] : tierBase + c.divisionRange * 3;
  const tierRange = nextThreshold - tierBase;
  const progress = rating - tierBase;
  const divisionSize = tierRange / 3;

  let division: RankDivision = 3;
  if (progress >= divisionSize * 2) division = 1;
  else if (progress >= divisionSize) division = 2;

  return { tier: currentTier, division };
}

/**
 * ELO 积分变化计算
 */
export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  won: boolean,
  streak: number,
  config?: RankedSeasonConfig
): number {
  const c = config ?? DEFAULT_SEASON;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actual = won ? 1 : 0;
  let change = Math.round(c.kFactor * (actual - expected));

  // 连胜/连败加成
  if (won && streak >= 3) {
    change += c.streakBonus;
  }

  // 最低变化±5
  if (won && change < 5) change = 5;
  if (!won && change > -5) change = -5;

  return change;
}

/**
 * 记录对局结果
 */
export function recordMatch(
  player: RankedPlayer,
  opponentId: string,
  opponentName: string,
  opponentRating: number,
  won: boolean,
  config?: RankedSeasonConfig,
  now?: number
): RankedPlayer {
  const c = config ?? DEFAULT_SEASON;
  const currentStreak = won
    ? (player.streak > 0 ? player.streak + 1 : 1)
    : (player.streak < 0 ? player.streak - 1 : -1);

  const ratingChange = calculateEloChange(player.rating, opponentRating, won, currentStreak, c);
  const newRating = Math.max(0, player.rating + ratingChange);
  const { tier, division } = calculateTier(newRating, c);

  const record: MatchRecord = {
    opponentId,
    opponentName,
    opponentRating,
    won,
    ratingChange,
    timestamp: now ?? Date.now(),
  };

  const newPlayer: RankedPlayer = {
    ...player,
    rating: newRating,
    tier,
    division,
    wins: player.wins + (won ? 1 : 0),
    losses: player.losses + (won ? 0 : 1),
    streak: currentStreak,
    bestRating: Math.max(player.bestRating, newRating),
    bestTier: TIER_ORDER[tier] > TIER_ORDER[player.bestTier] ? tier : player.bestTier,
    matchHistory: [record, ...player.matchHistory].slice(0, 50),
    lastMatchTime: now ?? Date.now(),
  };

  return newPlayer;
}

/**
 * 匹配对手 (按分数范围)
 */
export function findMatch(
  player: RankedPlayer,
  pool: RankedPlayer[],
  maxRatingDiff: number = 200
): RankedPlayer | null {
  const candidates = pool.filter(
    p => p.playerId !== player.playerId &&
         Math.abs(p.rating - player.rating) <= maxRatingDiff
  );

  if (candidates.length === 0) return null;

  // 选最接近的
  candidates.sort((a, b) => Math.abs(a.rating - player.rating) - Math.abs(b.rating - player.rating));
  return candidates[0];
}

/**
 * 获取胜率
 */
export function getWinRate(player: RankedPlayer): number {
  const total = player.wins + player.losses;
  return total > 0 ? Math.round((player.wins / total) * 100) : 0;
}

/**
 * 是否在定位赛中
 */
export function isInPlacements(player: RankedPlayer, config?: RankedSeasonConfig): boolean {
  const c = config ?? DEFAULT_SEASON;
  return (player.wins + player.losses) < c.placementMatches;
}

/**
 * 获取定位赛进度
 */
export function getPlacementProgress(player: RankedPlayer, config?: RankedSeasonConfig): { completed: number; total: number; remaining: number } {
  const c = config ?? DEFAULT_SEASON;
  const completed = player.wins + player.losses;
  return {
    completed: Math.min(completed, c.placementMatches),
    total: c.placementMatches,
    remaining: Math.max(0, c.placementMatches - completed),
  };
}

/**
 * 获取赛季奖励 (基于最高段位)
 */
export function getSeasonReward(player: RankedPlayer): SeasonReward | null {
  // 从高到低找到匹配的奖励
  const sorted = [...SEASON_REWARDS].sort((a, b) => TIER_ORDER[b.tier] - TIER_ORDER[a.tier]);
  return sorted.find(r => TIER_ORDER[player.bestTier] >= TIER_ORDER[r.tier]) ?? null;
}

/**
 * 领取赛季奖励
 */
export function claimSeasonReward(player: RankedPlayer): { player: RankedPlayer; reward: SeasonReward | null; error?: string } {
  if (player.seasonRewardClaimed) return { player, reward: null, error: '已领取' };
  const reward = getSeasonReward(player);
  if (!reward) return { player, reward: null, error: '无可用奖励' };

  return {
    player: { ...player, seasonRewardClaimed: true },
    reward,
  };
}

/**
 * 赛季重置
 */
export function resetSeason(player: RankedPlayer, config?: RankedSeasonConfig): RankedPlayer {
  const c = config ?? DEFAULT_SEASON;
  // 软重置: 新分 = (旧分 + 初始分) / 2
  const newRating = Math.round((player.rating + c.initialRating) / 2);
  const { tier, division } = calculateTier(newRating, c);

  return {
    ...player,
    rating: newRating,
    tier,
    division,
    wins: 0,
    losses: 0,
    streak: 0,
    matchHistory: [],
    seasonRewardClaimed: false,
  };
}

/**
 * 排行榜排序
 */
export function sortLeaderboard(players: RankedPlayer[]): RankedPlayer[] {
  return [...players].sort((a, b) => b.rating - a.rating);
}

/**
 * 获取玩家排名
 */
export function getPlayerRank(player: RankedPlayer, allPlayers: RankedPlayer[]): number {
  const sorted = sortLeaderboard(allPlayers);
  return sorted.findIndex(p => p.playerId === player.playerId) + 1;
}

/**
 * 获取排位统计
 */
export function getRankedStats(player: RankedPlayer): {
  rating: number;
  tier: string;
  division: RankDivision;
  tierColor: string;
  winRate: number;
  wins: number;
  losses: number;
  streak: number;
  bestRating: number;
  bestTier: string;
  totalMatches: number;
  isPlacement: boolean;
} {
  return {
    rating: player.rating,
    tier: TIER_NAMES[player.tier],
    division: player.division,
    tierColor: TIER_COLORS[player.tier],
    winRate: getWinRate(player),
    wins: player.wins,
    losses: player.losses,
    streak: player.streak,
    bestRating: player.bestRating,
    bestTier: TIER_NAMES[player.bestTier],
    totalMatches: player.wins + player.losses,
    isPlacement: isInPlacements(player),
  };
}

/**
 * 获取段位名称（含子级）
 */
export function getTierDisplayName(tier: RankTier, division: RankDivision): string {
  if (tier === 'master' || tier === 'legend') return TIER_NAMES[tier];
  return `${TIER_NAMES[tier]} ${['I', 'II', 'III'][division - 1]}`;
}

/**
 * 导出数据
 */
export function exportRankedData(player: RankedPlayer): string {
  return JSON.stringify(player);
}

/**
 * 导入数据
 */
export function importRankedData(json: string): RankedPlayer | null {
  try {
    const data = JSON.parse(json);
    if (!data.playerId || typeof data.rating !== 'number') return null;
    return data as RankedPlayer;
  } catch {
    return null;
  }
}
