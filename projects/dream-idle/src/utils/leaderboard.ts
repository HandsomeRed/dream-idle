/**
 * v0.58 排行榜系统
 * 
 * 功能特性：
 * - 多维度排行榜（战力/等级/爬塔/竞技场/转生/收集）
 * - 排行榜刷新（定时/手动）
 * - 排名奖励（每日/每周）
 * - 排行榜历史（记录排名变化）
 * - 模拟玩家排行（单机游戏用 NPC 填充）
 */

export type LeaderboardType = '战力' | '等级' | '爬塔' | '竞技场' | '转生' | '收集'

export interface LeaderboardEntry {
  playerId: string
  playerName: string
  value: number                   // 排行值
  rank: number
  isPlayer: boolean               // 是否是真实玩家
  previousRank: number            // 上次排名
  rankChange: number              // 排名变化（正=上升，负=下降）
}

export interface LeaderboardConfig {
  type: LeaderboardType
  name: string
  description: string
  maxEntries: number              // 最大显示条目
  refreshIntervalMs: number       // 刷新间隔
  dailyRewards: RankReward[]      // 每日排名奖励
}

export interface RankReward {
  minRank: number
  maxRank: number
  gold: number
  diamonds: number
}

export interface Leaderboard {
  type: LeaderboardType
  entries: LeaderboardEntry[]
  lastRefresh: number
  playerRank: number              // 玩家自己的排名
}

export interface LeaderboardState {
  boards: Map<LeaderboardType, Leaderboard>
  rewardsClaimed: Map<string, number>  // `${type}_${date}` -> timestamp
  lastGlobalRefresh: number
}

// ========== 配置 ==========

export const LEADERBOARD_CONFIGS: LeaderboardConfig[] = [
  { type: '战力', name: '战力排行', description: '按角色总战力排名', maxEntries: 100, refreshIntervalMs: 300000,
    dailyRewards: [
      { minRank: 1, maxRank: 1, gold: 50000, diamonds: 500 },
      { minRank: 2, maxRank: 3, gold: 30000, diamonds: 300 },
      { minRank: 4, maxRank: 10, gold: 20000, diamonds: 200 },
      { minRank: 11, maxRank: 50, gold: 10000, diamonds: 100 },
      { minRank: 51, maxRank: 100, gold: 5000, diamonds: 50 },
    ]},
  { type: '等级', name: '等级排行', description: '按角色等级排名', maxEntries: 100, refreshIntervalMs: 300000,
    dailyRewards: [
      { minRank: 1, maxRank: 3, gold: 20000, diamonds: 200 },
      { minRank: 4, maxRank: 10, gold: 10000, diamonds: 100 },
      { minRank: 11, maxRank: 100, gold: 5000, diamonds: 50 },
    ]},
  { type: '爬塔', name: '爬塔排行', description: '按爬塔最高层数排名', maxEntries: 100, refreshIntervalMs: 300000,
    dailyRewards: [
      { minRank: 1, maxRank: 3, gold: 30000, diamonds: 300 },
      { minRank: 4, maxRank: 10, gold: 15000, diamonds: 150 },
      { minRank: 11, maxRank: 100, gold: 5000, diamonds: 50 },
    ]},
  { type: '竞技场', name: '竞技场排行', description: '按竞技场积分排名', maxEntries: 100, refreshIntervalMs: 300000,
    dailyRewards: [
      { minRank: 1, maxRank: 3, gold: 25000, diamonds: 250 },
      { minRank: 4, maxRank: 10, gold: 12000, diamonds: 120 },
      { minRank: 11, maxRank: 100, gold: 5000, diamonds: 50 },
    ]},
  { type: '转生', name: '转生排行', description: '按转生次数排名', maxEntries: 50, refreshIntervalMs: 600000,
    dailyRewards: [
      { minRank: 1, maxRank: 5, gold: 20000, diamonds: 200 },
      { minRank: 6, maxRank: 50, gold: 5000, diamonds: 50 },
    ]},
  { type: '收集', name: '收集排行', description: '按英雄+宠物收集数排名', maxEntries: 50, refreshIntervalMs: 600000,
    dailyRewards: [
      { minRank: 1, maxRank: 5, gold: 15000, diamonds: 150 },
      { minRank: 6, maxRank: 50, gold: 5000, diamonds: 50 },
    ]},
]

// NPC 名字池
const NPC_NAMES = [
  '剑圣无双', '天下第一', '独孤求败', '梦幻大师', '逍遥游侠',
  '风云再起', '绝世高手', '一刀流', '暗影刺客', '圣光骑士',
  '龙之传人', '凤舞九天', '星辰大海', '月下独酌', '烈焰战神',
  '冰雪女王', '雷霆万钧', '破晓之光', '暮色黄昏', '永恒之翼',
]

// ========== 核心函数 ==========

/**
 * 创建排行榜状态
 */
export function createLeaderboardState(): LeaderboardState {
  const boards = new Map<LeaderboardType, Leaderboard>()

  for (const config of LEADERBOARD_CONFIGS) {
    boards.set(config.type, {
      type: config.type,
      entries: [],
      lastRefresh: 0,
      playerRank: 0,
    })
  }

  return {
    boards,
    rewardsClaimed: new Map(),
    lastGlobalRefresh: 0,
  }
}

/**
 * 生成模拟 NPC 排行数据
 */
export function generateNpcEntries(
  count: number,
  minValue: number,
  maxValue: number
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = []

  for (let i = 0; i < count; i++) {
    const value = maxValue - Math.floor((maxValue - minValue) * (i / count) * (0.8 + Math.random() * 0.4))

    entries.push({
      playerId: `npc_${i}`,
      playerName: NPC_NAMES[i % NPC_NAMES.length] + (i >= NPC_NAMES.length ? `${Math.floor(i / NPC_NAMES.length) + 1}` : ''),
      value: Math.max(minValue, value),
      rank: i + 1,
      isPlayer: false,
      previousRank: i + 1,
      rankChange: 0,
    })
  }

  return entries.sort((a, b) => b.value - a.value).map((e, i) => ({ ...e, rank: i + 1 }))
}

/**
 * 更新排行榜（插入玩家数据）
 */
export function updateLeaderboard(
  state: LeaderboardState,
  type: LeaderboardType,
  playerValue: number,
  playerName: string = '玩家'
): Leaderboard {
  const config = LEADERBOARD_CONFIGS.find(c => c.type === type)
  const board = state.boards.get(type)

  if (!config || !board) {
    return { type, entries: [], lastRefresh: 0, playerRank: 0 }
  }

  // 生成 NPC 数据（如果为空）
  if (board.entries.length === 0 || board.entries.every(e => !e.isPlayer)) {
    const npcCount = config.maxEntries - 1
    const maxVal = Math.floor(playerValue * (1.5 + Math.random()))
    const minVal = Math.floor(playerValue * 0.3)
    board.entries = generateNpcEntries(npcCount, minVal, maxVal)
  }

  // 移除旧的玩家数据
  board.entries = board.entries.filter(e => !e.isPlayer)

  // 插入玩家
  const playerEntry: LeaderboardEntry = {
    playerId: 'player',
    playerName,
    value: playerValue,
    rank: 0,
    isPlayer: true,
    previousRank: board.playerRank,
    rankChange: 0,
  }
  board.entries.push(playerEntry)

  // 排序并计算排名
  board.entries.sort((a, b) => b.value - a.value)
  board.entries.forEach((e, i) => {
    e.rank = i + 1
    if (e.isPlayer) {
      e.rankChange = e.previousRank > 0 ? e.previousRank - e.rank : 0
    }
  })

  // 截取到最大条目
  board.entries = board.entries.slice(0, config.maxEntries)

  // 更新玩家排名
  const playerInBoard = board.entries.find(e => e.isPlayer)
  board.playerRank = playerInBoard?.rank || config.maxEntries + 1
  board.lastRefresh = Date.now()

  return board
}

/**
 * 获取排行榜
 */
export function getLeaderboard(
  state: LeaderboardState,
  type: LeaderboardType
): Leaderboard | null {
  return state.boards.get(type) || null
}

/**
 * 获取玩家排名
 */
export function getPlayerRank(state: LeaderboardState, type: LeaderboardType): number {
  const board = state.boards.get(type)
  return board?.playerRank || 0
}

/**
 * 领取排名奖励
 */
export function claimRankReward(
  state: LeaderboardState,
  type: LeaderboardType
): { success: boolean; gold: number; diamonds: number; reason?: string } {
  const board = state.boards.get(type)
  if (!board) return { success: false, gold: 0, diamonds: 0, reason: '排行榜不存在' }

  if (board.playerRank === 0) {
    return { success: false, gold: 0, diamonds: 0, reason: '未上榜' }
  }

  const today = new Date().toDateString()
  const claimKey = `${type}_${today}`

  if (state.rewardsClaimed.has(claimKey)) {
    return { success: false, gold: 0, diamonds: 0, reason: '今日已领取' }
  }

  const config = LEADERBOARD_CONFIGS.find(c => c.type === type)
  if (!config) return { success: false, gold: 0, diamonds: 0, reason: '配置不存在' }

  // 查找对应排名的奖励
  const reward = config.dailyRewards.find(r =>
    board.playerRank >= r.minRank && board.playerRank <= r.maxRank
  )

  if (!reward) {
    return { success: false, gold: 0, diamonds: 0, reason: '排名不在奖励范围内' }
  }

  state.rewardsClaimed.set(claimKey, Date.now())

  return { success: true, gold: reward.gold, diamonds: reward.diamonds }
}

/**
 * 检查是否需要刷新
 */
export function needsRefresh(state: LeaderboardState, type: LeaderboardType, now?: number): boolean {
  const board = state.boards.get(type)
  const config = LEADERBOARD_CONFIGS.find(c => c.type === type)

  if (!board || !config) return false

  const currentTime = now || Date.now()
  return (currentTime - board.lastRefresh) >= config.refreshIntervalMs
}

/**
 * 获取排行榜统计
 */
export function getLeaderboardStats(state: LeaderboardState): {
  totalBoards: number
  playerRanks: Record<LeaderboardType, number>
  lastRefresh: number
} {
  const playerRanks: Record<string, number> = {}

  for (const [type, board] of state.boards) {
    playerRanks[type] = board.playerRank
  }

  return {
    totalBoards: state.boards.size,
    playerRanks: playerRanks as Record<LeaderboardType, number>,
    lastRefresh: state.lastGlobalRefresh,
  }
}

/**
 * 导出排行榜状态
 */
export function exportLeaderboardState(state: LeaderboardState): any {
  return {
    boards: Array.from(state.boards.entries()).map(([k, v]) => [k, { ...v }]),
    rewardsClaimed: Array.from(state.rewardsClaimed.entries()),
    lastGlobalRefresh: state.lastGlobalRefresh,
  }
}

/**
 * 导入排行榜状态
 */
export function importLeaderboardState(data: any): LeaderboardState {
  return {
    boards: new Map(data.boards.map(([k, v]: [LeaderboardType, Leaderboard]) => [k, v])),
    rewardsClaimed: new Map(data.rewardsClaimed),
    lastGlobalRefresh: data.lastGlobalRefresh,
  }
}
