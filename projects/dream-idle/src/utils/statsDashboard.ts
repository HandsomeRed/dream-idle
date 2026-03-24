/**
 * v0.61 数据统计仪表盘
 * 
 * 功能特性：
 * - 玩家数据聚合统计
 * - 多维度数据追踪（战斗/经济/成长/收集）
 * - 数据快照（每日记录）
 * - 趋势分析（对比历史数据）
 * - 游戏总览仪表盘
 */

export type StatCategory = '战斗' | '经济' | '成长' | '收集' | '时间'

export interface StatEntry {
  id: string
  name: string
  category: StatCategory
  value: number
  unit: string                   // 显示单位
  description: string
}

export interface DailySnapshot {
  date: string                   // YYYY-MM-DD
  timestamp: number
  stats: Record<string, number>  // statId -> value
}

export interface StatsDashboardState {
  currentStats: Map<string, number>  // statId -> value
  snapshots: DailySnapshot[]         // 每日快照（最近 30 天）
  trackedSince: number               // 开始追踪时间
  lastSnapshotDate: string           // 上次快照日期
}

// ========== 统计项定义 ==========

export const STAT_DEFINITIONS: Omit<StatEntry, 'value'>[] = [
  // 战斗
  { id: 'total_battles', name: '总战斗次数', category: '战斗', unit: '次', description: '累计进行的战斗次数' },
  { id: 'total_wins', name: '总胜利次数', category: '战斗', unit: '次', description: '累计战斗胜利次数' },
  { id: 'total_losses', name: '总失败次数', category: '战斗', unit: '次', description: '累计战斗失败次数' },
  { id: 'win_rate', name: '胜率', category: '战斗', unit: '%', description: '战斗胜率' },
  { id: 'max_damage', name: '最高伤害', category: '战斗', unit: '', description: '单次最高伤害' },
  { id: 'boss_kills', name: 'BOSS击杀', category: '战斗', unit: '次', description: '累计BOSS击杀数' },
  { id: 'tower_floor', name: '爬塔最高层', category: '战斗', unit: '层', description: '爬塔最高记录' },
  { id: 'arena_rank', name: '竞技场排名', category: '战斗', unit: '名', description: '当前竞技场排名' },

  // 经济
  { id: 'total_gold_earned', name: '累计获得金币', category: '经济', unit: '', description: '历史累计获得的金币总量' },
  { id: 'total_gold_spent', name: '累计消费金币', category: '经济', unit: '', description: '历史累计消费的金币总量' },
  { id: 'total_diamonds_earned', name: '累计获得钻石', category: '经济', unit: '', description: '历史累计获得的钻石总量' },
  { id: 'total_diamonds_spent', name: '累计消费钻石', category: '经济', unit: '', description: '历史累计消费的钻石总量' },
  { id: 'current_gold', name: '当前金币', category: '经济', unit: '', description: '当前持有金币' },
  { id: 'current_diamonds', name: '当前钻石', category: '经济', unit: '', description: '当前持有钻石' },

  // 成长
  { id: 'current_level', name: '当前等级', category: '成长', unit: '级', description: '角色当前等级' },
  { id: 'rebirth_count', name: '转生次数', category: '成长', unit: '次', description: '累计转生次数' },
  { id: 'total_exp', name: '累计经验', category: '成长', unit: '', description: '历史累计获得经验' },
  { id: 'talent_points_used', name: '已用天赋点', category: '成长', unit: '点', description: '已分配的天赋点' },
  { id: 'crafting_count', name: '合成次数', category: '成长', unit: '次', description: '累计合成次数' },

  // 收集
  { id: 'heroes_owned', name: '英雄数量', category: '收集', unit: '个', description: '已拥有英雄数' },
  { id: 'pets_owned', name: '宠物数量', category: '收集', unit: '个', description: '已拥有宠物数' },
  { id: 'badges_unlocked', name: '徽章解锁', category: '收集', unit: '个', description: '已解锁徽章数' },
  { id: 'regions_explored', name: '探索区域', category: '收集', unit: '个', description: '已解锁地图区域数' },
  { id: 'achievements_completed', name: '成就完成', category: '收集', unit: '个', description: '已完成成就数' },

  // 时间
  { id: 'total_play_time', name: '总游玩时长', category: '时间', unit: '分钟', description: '累计在线时长' },
  { id: 'total_offline_time', name: '总离线时长', category: '时间', unit: '分钟', description: '累计离线挂机时长' },
  { id: 'login_days', name: '登录天数', category: '时间', unit: '天', description: '累计登录天数' },
  { id: 'login_streak', name: '连续登录', category: '时间', unit: '天', description: '当前连续登录天数' },
]

// ========== 核心函数 ==========

/**
 * 创建统计仪表盘状态
 */
export function createDashboardState(): StatsDashboardState {
  const stats = new Map<string, number>()
  for (const def of STAT_DEFINITIONS) {
    stats.set(def.id, 0)
  }

  return {
    currentStats: stats,
    snapshots: [],
    trackedSince: Date.now(),
    lastSnapshotDate: '',
  }
}

/**
 * 更新统计值
 */
export function updateStat(state: StatsDashboardState, statId: string, value: number): boolean {
  const def = STAT_DEFINITIONS.find(d => d.id === statId)
  if (!def) return false

  state.currentStats.set(statId, value)
  return true
}

/**
 * 增加统计值
 */
export function incrementStat(state: StatsDashboardState, statId: string, amount: number = 1): boolean {
  const current = state.currentStats.get(statId)
  if (current === undefined) return false

  state.currentStats.set(statId, current + amount)
  return true
}

/**
 * 获取统计值
 */
export function getStat(state: StatsDashboardState, statId: string): number {
  return state.currentStats.get(statId) ?? 0
}

/**
 * 批量更新统计
 */
export function updateStats(state: StatsDashboardState, updates: Record<string, number>): number {
  let count = 0
  for (const [id, value] of Object.entries(updates)) {
    if (updateStat(state, id, value)) count++
  }
  return count
}

/**
 * 获取分类统计
 */
export function getStatsByCategory(state: StatsDashboardState, category: StatCategory): StatEntry[] {
  return STAT_DEFINITIONS
    .filter(d => d.category === category)
    .map(d => ({ ...d, value: state.currentStats.get(d.id) ?? 0 }))
}

/**
 * 获取所有统计
 */
export function getAllStats(state: StatsDashboardState): StatEntry[] {
  return STAT_DEFINITIONS.map(d => ({ ...d, value: state.currentStats.get(d.id) ?? 0 }))
}

/**
 * 创建每日快照
 */
export function takeSnapshot(state: StatsDashboardState, date?: string): boolean {
  const snapshotDate = date || new Date().toISOString().split('T')[0]

  // 同一天不重复快照
  if (snapshotDate === state.lastSnapshotDate) return false

  const statsRecord: Record<string, number> = {}
  for (const [id, value] of state.currentStats) {
    statsRecord[id] = value
  }

  state.snapshots.unshift({
    date: snapshotDate,
    timestamp: Date.now(),
    stats: statsRecord,
  })

  // 保留最近 30 天
  if (state.snapshots.length > 30) {
    state.snapshots = state.snapshots.slice(0, 30)
  }

  state.lastSnapshotDate = snapshotDate
  return true
}

/**
 * 获取趋势数据（对比两天）
 */
export function getTrend(
  state: StatsDashboardState,
  statId: string,
  daysAgo: number = 1
): { current: number; previous: number; change: number; changePercent: number } | null {
  const current = state.currentStats.get(statId)
  if (current === undefined) return null

  const targetSnapshot = state.snapshots[daysAgo - 1]
  const previous = targetSnapshot?.stats[statId] ?? 0

  const change = current - previous
  const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0

  return { current, previous, change, changePercent }
}

/**
 * 获取仪表盘摘要
 */
export function getDashboardSummary(state: StatsDashboardState): {
  level: number
  rebirthCount: number
  totalBattles: number
  winRate: number
  heroes: number
  pets: number
  gold: number
  diamonds: number
  playTime: number
  loginDays: number
} {
  return {
    level: getStat(state, 'current_level'),
    rebirthCount: getStat(state, 'rebirth_count'),
    totalBattles: getStat(state, 'total_battles'),
    winRate: getStat(state, 'win_rate'),
    heroes: getStat(state, 'heroes_owned'),
    pets: getStat(state, 'pets_owned'),
    gold: getStat(state, 'current_gold'),
    diamonds: getStat(state, 'current_diamonds'),
    playTime: getStat(state, 'total_play_time'),
    loginDays: getStat(state, 'login_days'),
  }
}

/**
 * 导出仪表盘状态
 */
export function exportDashboardState(state: StatsDashboardState): any {
  return {
    currentStats: Array.from(state.currentStats.entries()),
    snapshots: state.snapshots,
    trackedSince: state.trackedSince,
    lastSnapshotDate: state.lastSnapshotDate,
  }
}

/**
 * 导入仪表盘状态
 */
export function importDashboardState(data: any): StatsDashboardState {
  return {
    currentStats: new Map(data.currentStats),
    snapshots: data.snapshots,
    trackedSince: data.trackedSince,
    lastSnapshotDate: data.lastSnapshotDate,
  }
}
