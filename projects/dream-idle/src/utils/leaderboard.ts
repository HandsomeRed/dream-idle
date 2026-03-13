/**
 * 排行榜系统 - v0.9
 * 功能：战力榜、等级榜、好友榜、实时更新
 */

// 排行榜类型
export enum LeaderboardType {
  Power = 'power',      // 战力榜
  Level = 'level',      // 等级榜
  Friends = 'friends'   // 好友榜（好友度）
}

// 玩家信息
export interface PlayerEntry {
  userId: string;
  nickname: string;
  level: number;
  power: number;
  friendship?: number;  // 好友度（仅好友榜）
  rank: number;
  rankChange: number;   // 排名变化（+上升，-下降，0 不变）
}

// 排行榜数据
export interface Leaderboard {
  type: LeaderboardType;
  entries: PlayerEntry[];
  lastUpdate: number;
  totalPlayers: number;
}

// 缓存的排行榜
const leaderboardCache: Map<LeaderboardType, Leaderboard> = new Map();

/**
 * 计算玩家战力
 */
export function calculatePower(
  level: number,
  attack: number,
  defense: number,
  hp: number,
  mp: number,
  speed: number
): number {
  return Math.floor(
    level * 10 +
    attack * 2 +
    defense * 1.5 +
    hp * 0.5 +
    mp * 0.3 +
    speed * 1.2
  );
}

/**
 * 生成排行榜
 */
export function generateLeaderboard(
  type: LeaderboardType,
  players: any[],
  friendId?: string
): Leaderboard {
  let entries: PlayerEntry[] = [];
  
  switch (type) {
    case LeaderboardType.Power:
      entries = players
        .map(p => ({
          userId: p.userId,
          nickname: p.nickname,
          level: p.level,
          power: calculatePower(p.level, p.attack, p.defense, p.hp, p.mp, p.speed),
          rank: 0,
          rankChange: 0
        }))
        .sort((a, b) => b.power - a.power);
      break;
      
    case LeaderboardType.Level:
      entries = players
        .map(p => ({
          userId: p.userId,
          nickname: p.nickname,
          level: p.level,
          power: calculatePower(p.level, p.attack, p.defense, p.hp, p.mp, p.speed),
          rank: 0,
          rankChange: 0
        }))
        .sort((a, b) => b.level - a.level || b.power - a.power);
      break;
      
    case LeaderboardType.Friends:
      if (!friendId) {
        throw new Error('好友榜需要指定玩家 ID');
      }
      entries = players
        .filter(p => p.friends && p.friends.some((f: any) => f.userId === friendId))
        .map(p => ({
          userId: p.userId,
          nickname: p.nickname,
          level: p.level,
          power: calculatePower(p.level, p.attack, p.defense, p.hp, p.mp, p.speed),
          friendship: p.friends.find((f: any) => f.userId === friendId)?.friendship || 0,
          rank: 0,
          rankChange: 0
        }))
        .sort((a, b) => (b.friendship || 0) - (a.friendship || 0));
      break;
  }
  
  // 设置排名
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  const leaderboard: Leaderboard = {
    type,
    entries: entries.slice(0, 100), // 只显示前 100 名
    lastUpdate: Date.now(),
    totalPlayers: players.length
  };
  
  // 更新缓存
  leaderboardCache.set(type, leaderboard);
  
  return leaderboard;
}

/**
 * 获取排行榜
 */
export function getLeaderboard(type: LeaderboardType, friendId?: string): Leaderboard | null {
  const cached = leaderboardCache.get(type);
  
  // 缓存 5 分钟
  if (cached && (Date.now() - cached.lastUpdate) < 5 * 60 * 1000) {
    return cached;
  }
  
  // 需要重新生成（实际项目中会从数据库获取玩家数据）
  return null;
}

/**
 * 获取玩家排名
 */
export function getPlayerRank(
  type: LeaderboardType,
  players: any[],
  targetUserId: string
): number {
  const leaderboard = generateLeaderboard(type, players);
  const entry = leaderboard.entries.find(e => e.userId === targetUserId);
  return entry ? entry.rank : -1;
}

/**
 * 获取前 N 名玩家
 */
export function getTopPlayers(
  type: LeaderboardType,
  players: any[],
  limit: number = 10
): PlayerEntry[] {
  const leaderboard = generateLeaderboard(type, players);
  return leaderboard.entries.slice(0, limit);
}

/**
 * 比较排名变化
 */
export function updateRankChanges(
  oldLeaderboard: Leaderboard,
  newLeaderboard: Leaderboard
): void {
  const rankMap = new Map(oldLeaderboard.entries.map(e => [e.userId, e.rank]));
  
  newLeaderboard.entries.forEach(entry => {
    const oldRank = rankMap.get(entry.userId);
    if (oldRank !== undefined) {
      entry.rankChange = oldRank - entry.rank; // +上升，-下降
    }
  });
}

/**
 * 清空缓存
 */
export function clearLeaderboardCache(): void {
  leaderboardCache.clear();
}
