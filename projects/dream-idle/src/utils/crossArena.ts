/**
 * v0.48 跨服竞技场系统
 * 
 * 功能特性：
 * - 跨服匹配系统（按战力/段位）
 * - 跨服排行榜（全服排名）
 * - 异步 PVP 对战（进攻/防守阵容）
 * - 跨服赛季系统（30 天）
 * - 跨服奖励（排名奖励/参与奖励）
 * - 跨服聊天（可选）
 * - 战斗回放
 */

export type CrossArenaTier = '青铜' | '白银' | '黄金' | '铂金' | '钻石' | '大师' | '传说'

export interface CrossArenaPlayer {
  playerId: string
  serverId: number           // 服务器 ID
  playerName: string
  tier: CrossArenaTier
  points: number             // 积分
  rank: number               // 排名
  wins: number
  losses: number
  consecutiveWins: number    // 连胜次数
  defenseFormation: number[] // 防守阵容 ID 列表
  lastBattleTime: number     // 最后战斗时间戳
  seasonRewardClaimed: boolean
}

export interface CrossArenaSeason {
  seasonId: number
  startTime: number          // 赛季开始时间戳
  endTime: number            // 赛季结束时间戳
  status: 'preparation' | 'active' | 'settlement' | 'ended'
  topPlayers: CrossArenaPlayer[]  // 前 100 名玩家
}

export interface CrossArenaMatch {
  matchId: string
  attacker: CrossArenaPlayer
  defender: CrossArenaPlayer
  battleResult: CrossArenaBattleResult | null
  timestamp: number
  rewardClaimed: boolean
}

export interface CrossArenaBattleResult {
  winner: 'attacker' | 'defender'
  attackerDamage: number
  defenderDamage: number
  rounds: number
  replay: BattleReplay[]
}

export interface BattleReplay {
  round: number
  attackerAction: BattleAction
  defenderAction: BattleAction
  attackerHP: number
  defenderHP: number
}

export interface BattleAction {
  type: 'attack' | 'skill' | 'buff'
  skillId?: number
  target: 'attacker' | 'defender'
  damage?: number
  heal?: number
}

export interface CrossArenaConfig {
  seasonDurationDays: number
  matchMakingRange: number   // 匹配积分范围 ±
  dailyChallenges: number    // 每日挑战次数
  tierPoints: Record<CrossArenaTier, [number, number]>  // 每个段位积分范围
  rewardConfig: RewardConfig
}

export interface RewardConfig {
  daily: Record<CrossArenaTier, number[]>  // 每日奖励 [金币，钻石]
  season: Record<CrossArenaTier, number[][]> // 赛季奖励 [排名范围，金币，钻石，道具 ID]
  participation: number[]  // 参与奖励 [金币，钻石]
}

export interface CrossArenaState {
  currentSeason: CrossArenaSeason
  playerData: Map<string, CrossArenaPlayer>  // playerId -> player data
  matchHistory: Map<string, CrossArenaMatch[]>  // playerId -> matches
  leaderboard: CrossArenaPlayer[]  // 按积分排序
  config: CrossArenaConfig
}

/**
 * 默认跨服竞技场配置
 */
export const DEFAULT_CROSS_ARENA_CONFIG: CrossArenaConfig = {
  seasonDurationDays: 30,
  matchMakingRange: 200,
  dailyChallenges: 10,
  tierPoints: {
    '青铜': [0, 999],
    '白银': [1000, 1999],
    '黄金': [2000, 2999],
    '铂金': [3000, 3999],
    '钻石': [4000, 4999],
    '大师': [5000, 5999],
    '传说': [6000, Infinity]
  },
  rewardConfig: {
    daily: {
      '青铜': [1000, 10],
      '白银': [2000, 20],
      '黄金': [3000, 30],
      '铂金': [5000, 50],
      '钻石': [8000, 80],
      '大师': [12000, 120],
      '传说': [20000, 200]
    },
    season: {
      '青铜': [[1, 100, 50000, 101], [101, 1000, 20000, 102]],
      '白银': [[1, 100, 100000, 201], [101, 1000, 50000, 202]],
      '黄金': [[1, 100, 200000, 301], [101, 1000, 100000, 302]],
      '铂金': [[1, 100, 500000, 401], [101, 1000, 200000, 402]],
      '钻石': [[1, 100, 1000000, 501], [101, 1000, 500000, 502]],
      '大师': [[1, 100, 2000000, 601], [101, 1000, 1000000, 602]],
      '传说': [[1, 10, 10000000, 701], [11, 100, 5000000, 702], [101, 1000, 2000000, 703]]
    },
    participation: [5000, 50]
  }
}

/**
 * 创建跨服竞技场状态
 */
export function createCrossArenaState(): CrossArenaState {
  const now = Date.now()
  const seasonEnd = now + (DEFAULT_CROSS_ARENA_CONFIG.seasonDurationDays * 24 * 60 * 60 * 1000)
  
  return {
    currentSeason: {
      seasonId: 1,
      startTime: now,
      endTime: seasonEnd,
      status: 'active',
      topPlayers: [],
    },
    playerData: new Map(),
    matchHistory: new Map(),
    leaderboard: [],
    config: DEFAULT_CROSS_ARENA_CONFIG
  }
}

/**
 * 根据积分计算段位
 */
export function calculateTier(points: number): CrossArenaTier {
  const config = DEFAULT_CROSS_ARENA_CONFIG
  for (const [tier, [min, max]] of Object.entries(config.tierPoints)) {
    if (points >= min && points <= max) {
      return tier as CrossArenaTier
    }
  }
  return '青铜'
}

/**
 * 更新玩家段位
 */
export function updatePlayerTier(player: CrossArenaPlayer): CrossArenaTier {
  const newTier = calculateTier(player.points)
  if (player.tier !== newTier) {
    player.tier = newTier
  }
  return newTier
}

/**
 * 注册玩家到跨服竞技场
 */
export function registerPlayer(
  state: CrossArenaState,
  playerId: string,
  serverId: number,
  playerName: string,
  initialPoints: number = 1000
): CrossArenaPlayer {
  if (state.playerData.has(playerId)) {
    return state.playerData.get(playerId)!
  }

  const player: CrossArenaPlayer = {
    playerId,
    serverId,
    playerName,
    tier: calculateTier(initialPoints),
    points: initialPoints,
    rank: 0,
    wins: 0,
    losses: 0,
    consecutiveWins: 0,
    defenseFormation: [],
    lastBattleTime: 0,
    seasonRewardClaimed: false
  }

  state.playerData.set(playerId, player)
  state.matchHistory.set(playerId, [])
  updateLeaderboard(state)
  
  return player
}

/**
 * 更新排行榜
 */
export function updateLeaderboard(state: CrossArenaState): void {
  const sorted = Array.from(state.playerData.values())
    .sort((a, b) => b.points - a.points)
  
  // 更新每个玩家的排名
  sorted.forEach((player, index) => {
    player.rank = index + 1
  })
  
  state.leaderboard = sorted
  
  // 更新前 100 名
  state.currentSeason.topPlayers = state.leaderboard.slice(0, 100)
}

/**
 * 匹配对手
 */
export function matchOpponent(
  state: CrossArenaState,
  playerId: string
): CrossArenaPlayer | null {
  const player = state.playerData.get(playerId)
  if (!player) return null

  const range = state.config.matchMakingRange
  const minPoints = player.points - range
  const maxPoints = player.points + range

  // 筛选符合条件的玩家
  const candidates = Array.from(state.playerData.values())
    .filter(p => 
      p.playerId !== playerId &&
      p.points >= minPoints &&
      p.points <= maxPoints
    )

  if (candidates.length === 0) return null

  // 随机选择一个对手
  const randomIndex = Math.floor(Math.random() * candidates.length)
  return candidates[randomIndex]
}

/**
 * 计算战斗结果（简化版）
 */
export function calculateBattleResult(
  attacker: CrossArenaPlayer,
  defender: CrossArenaPlayer
): CrossArenaBattleResult {
  // 基于积分的简单胜负计算（实际应该使用完整的战斗系统）
  const attackerPower = attacker.points + Math.random() * 100
  const defenderPower = defender.points + Math.random() * 100
  
  const winner = attackerPower > defenderPower ? 'attacker' : 'defender'
  const maxRounds = 10 + Math.floor(Math.random() * 5)
  
  // 生成简化的战斗回放
  const replay: BattleReplay[] = []
  let attackerHP = 100
  let defenderHP = 100
  
  for (let round = 1; round <= maxRounds && attackerHP > 0 && defenderHP > 0; round++) {
    const attackerDamage = Math.floor(Math.random() * 15) + 5
    const defenderDamage = Math.floor(Math.random() * 15) + 5
    
    defenderHP -= attackerDamage
    attackerHP -= defenderDamage
    
    replay.push({
      round,
      attackerAction: {
        type: 'attack',
        target: 'defender',
        damage: attackerDamage
      },
      defenderAction: {
        type: 'attack',
        target: 'attacker',
        damage: defenderDamage
      },
      attackerHP: Math.max(0, attackerHP),
      defenderHP: Math.max(0, defenderHP)
    })
  }

  return {
    winner,
    attackerDamage: 100 - attackerHP,
    defenderDamage: 100 - defenderHP,
    rounds: replay.length,
    replay
  }
}

/**
 * 进行跨服竞技场战斗
 */
export function battle(
  state: CrossArenaState,
  attackerId: string,
  defenderId: string
): CrossArenaMatch | null {
  const attacker = state.playerData.get(attackerId)
  const defender = state.playerData.get(defenderId)
  
  if (!attacker || !defender) return null

  // 计算战斗结果
  const battleResult = calculateBattleResult(attacker, defender)
  
  // 更新玩家数据
  const pointsChange = battleResult.winner === 'attacker' ? 20 : -10
  
  attacker.points = Math.max(0, attacker.points + pointsChange)
  attacker.lastBattleTime = Date.now()
  
  if (battleResult.winner === 'attacker') {
    attacker.wins++
    attacker.consecutiveWins++
    defender.losses++
    defender.consecutiveWins = 0
  } else {
    attacker.losses++
    attacker.consecutiveWins = 0
    defender.wins++
    defender.consecutiveWins++
  }
  
  // 更新段位
  updatePlayerTier(attacker)
  updatePlayerTier(defender)
  
  // 创建比赛记录
  const match: CrossArenaMatch = {
    matchId: `match_${Date.now()}_${attackerId}`,
    attacker,
    defender,
    battleResult,
    timestamp: Date.now(),
    rewardClaimed: false
  }
  
  // 保存比赛历史
  const history = state.matchHistory.get(attackerId) || []
  history.push(match)
  state.matchHistory.set(attackerId, history)
  
  // 更新排行榜
  updateLeaderboard(state)
  
  return match
}

/**
 * 获取每日奖励
 */
export function claimDailyReward(
  state: CrossArenaState,
  playerId: string
): number[] | null {
  const player = state.playerData.get(playerId)
  if (!player) return null

  const rewards = state.config.rewardConfig.daily[player.tier]
  if (!rewards) return null

  // 这里应该检查是否已经领取过今日奖励
  // 简化处理，直接返回奖励
  return rewards
}

/**
 * 获取赛季奖励
 */
export function claimSeasonReward(
  state: CrossArenaState,
  playerId: string
): number[] | null {
  const player = state.playerData.get(playerId)
  if (!player || player.seasonRewardClaimed) return null

  const tier = player.tier
  const rank = player.rank
  const seasonRewards = state.config.rewardConfig.season[tier]
  
  if (!seasonRewards) return null

  // 根据排名找到对应奖励
  for (const [minRank, maxRank, gold, diamond] of seasonRewards) {
    if (rank >= minRank && rank <= maxRank) {
      player.seasonRewardClaimed = true
      return [gold, diamond]
    }
  }

  return null
}

/**
 * 结束当前赛季并开始新赛季
 */
export function endSeason(state: CrossArenaState): CrossArenaSeason {
  const oldSeason = state.currentSeason
  
  // 结算奖励（这里只是标记状态，实际发放由其他系统处理）
  oldSeason.status = 'settlement'
  
  // 创建新赛季
  const now = Date.now()
  const newSeason: CrossArenaSeason = {
    seasonId: oldSeason.seasonId + 1,
    startTime: now,
    endTime: now + (state.config.seasonDurationDays * 24 * 60 * 60 * 1000),
    status: 'active',
    topPlayers: []
  }
  
  state.currentSeason = newSeason
  
  // 重置玩家赛季数据（保留部分数据）
  state.playerData.forEach(player => {
    player.seasonRewardClaimed = false
    // 段位继承（下降一个段位）
    const tierIndex = ['青铜', '白银', '黄金', '铂金', '钻石', '大师', '传说'].indexOf(player.tier)
    if (tierIndex > 0) {
      player.tier = ['青铜', '白银', '黄金', '铂金', '钻石', '大师', '传说'][tierIndex - 1] as CrossArenaTier
    }
    player.points = calculateTierPoints(player.tier)
    player.wins = 0
    player.losses = 0
    player.consecutiveWins = 0
  })
  
  updateLeaderboard(state)
  
  return oldSeason
}

/**
 * 计算段位对应的初始积分
 */
function calculateTierPoints(tier: CrossArenaTier): number {
  const points = DEFAULT_CROSS_ARENA_CONFIG.tierPoints[tier]
  return points[0]
}

/**
 * 获取玩家比赛历史
 */
export function getPlayerMatchHistory(
  state: CrossArenaState,
  playerId: string,
  limit: number = 20
): CrossArenaMatch[] {
  const history = state.matchHistory.get(playerId) || []
  return history.slice(-limit).reverse()
}

/**
 * 获取玩家排名
 */
export function getPlayerRank(
  state: CrossArenaState,
  playerId: string
): number {
  const player = state.playerData.get(playerId)
  return player?.rank || 0
}

/**
 * 检查是否可以挑战
 */
export function canChallenge(
  state: CrossArenaState,
  playerId: string
): { canChallenge: boolean; remainingChallenges: number; reason?: string } {
  const player = state.playerData.get(playerId)
  if (!player) {
    return { canChallenge: false, remainingChallenges: 0, reason: '玩家未注册' }
  }

  // 检查每日挑战次数（简化实现）
  const today = new Date().toDateString()
  const lastBattle = new Date(player.lastBattleTime).toDateString()
  
  if (today !== lastBattle) {
    return { canChallenge: true, remainingChallenges: state.config.dailyChallenges }
  }

  // 计算今日已挑战次数
  const history = state.matchHistory.get(playerId) || []
  const todayMatches = history.filter(m => 
    new Date(m.timestamp).toDateString() === today
  ).length

  const remaining = state.config.dailyChallenges - todayMatches
  
  return {
    canChallenge: remaining > 0,
    remainingChallenges: remaining,
    reason: remaining <= 0 ? '今日挑战次数已用完' : undefined
  }
}

/**
 * 导出跨服竞技场状态（用于序列化）
 */
export function exportCrossArenaState(state: CrossArenaState): any {
  return {
    currentSeason: state.currentSeason,
    playerData: Array.from(state.playerData.entries()),
    matchHistory: Array.from(state.matchHistory.entries()).map(([id, matches]) => [
      id,
      matches.map(m => ({
        ...m,
        attacker: { ...m.attacker },
        defender: { ...m.defender },
        battleResult: m.battleResult ? { ...m.battleResult } : null
      }))
    ]),
    leaderboard: state.leaderboard,
    config: state.config
  }
}

/**
 * 导入跨服竞技场状态（用于反序列化）
 */
export function importCrossArenaState(data: any): CrossArenaState {
  return {
    currentSeason: data.currentSeason,
    playerData: new Map(data.playerData),
    matchHistory: new Map(data.matchHistory),
    leaderboard: data.leaderboard,
    config: data.config
  }
}
