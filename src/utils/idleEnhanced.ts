/**
 * v0.53 离线挂机增强系统
 * 
 * 功能特性：
 * - 离线收益计算（经验/金币/材料/宠物经验）
 * - 离线时间上限（免费 8h / VIP 24h）
 * - 离线挂机地点选择（不同地点不同收益）
 * - 离线战斗模拟（自动推图/爬塔/副本）
 * - 加速券（倍速消耗离线时间）
 * - 离线报告（详细收益明细）
 */

export type IdleLocation = '推图' | '爬塔' | '副本' | '采集' | '竞技场'

export interface IdleConfig {
  location: IdleLocation
  baseExpPerMin: number
  baseGoldPerMin: number
  materialDropRate: number     // 每分钟掉落概率
  petExpPerMin: number
  heroExpPerMin: number
  unlockLevel: number
}

export interface IdleBonus {
  expMultiplier: number        // 经验倍率
  goldMultiplier: number       // 金币倍率
  dropMultiplier: number       // 掉落倍率
  source: string
}

export interface IdleReward {
  exp: number
  gold: number
  materials: IdleMaterialDrop[]
  petExp: number
  heroExp: number
  duration: number             // 实际计算时长（分钟）
  accelerated: boolean         // 是否使用了加速
}

export interface IdleMaterialDrop {
  itemId: string
  name: string
  quantity: number
}

export interface IdleReport {
  startTime: number
  endTime: number
  claimTime: number
  location: IdleLocation
  durationMinutes: number
  rewards: IdleReward
  bonuses: IdleBonus[]
  acceleratorUsed: number      // 使用的加速券数量
}

export interface IdleState {
  lastOnlineTime: number       // 上次在线时间
  currentLocation: IdleLocation
  maxOfflineMinutes: number    // 最大离线时长（分钟）
  accelerators: number         // 加速券数量
  vipLevel: number             // VIP 等级
  reports: IdleReport[]        // 离线报告（最近 30 天）
  totalOfflineMinutes: number  // 累计离线时长
  totalExpGained: number       // 累计经验
  totalGoldGained: number      // 累计金币
  bonuses: IdleBonus[]         // 当前加成列表
}

// ========== 配置 ==========

export const IDLE_LOCATIONS: IdleConfig[] = [
  { location: '推图', baseExpPerMin: 100, baseGoldPerMin: 50, materialDropRate: 0.1, petExpPerMin: 20, heroExpPerMin: 30, unlockLevel: 1 },
  { location: '爬塔', baseExpPerMin: 150, baseGoldPerMin: 30, materialDropRate: 0.15, petExpPerMin: 30, heroExpPerMin: 50, unlockLevel: 20 },
  { location: '副本', baseExpPerMin: 80, baseGoldPerMin: 100, materialDropRate: 0.25, petExpPerMin: 15, heroExpPerMin: 20, unlockLevel: 15 },
  { location: '采集', baseExpPerMin: 30, baseGoldPerMin: 80, materialDropRate: 0.4, petExpPerMin: 10, heroExpPerMin: 10, unlockLevel: 10 },
  { location: '竞技场', baseExpPerMin: 120, baseGoldPerMin: 40, materialDropRate: 0.05, petExpPerMin: 25, heroExpPerMin: 40, unlockLevel: 30 },
]

export const MATERIAL_POOL: { itemId: string; name: string; weight: number }[] = [
  { itemId: 'iron_ore', name: '铁矿石', weight: 30 },
  { itemId: 'wood', name: '木材', weight: 25 },
  { itemId: 'herb', name: '草药', weight: 20 },
  { itemId: 'magic_shard', name: '魔法碎片', weight: 15 },
  { itemId: 'gem_lv1', name: '一级宝石', weight: 8 },
  { itemId: 'rare_material', name: '稀有材料', weight: 2 },
]

// ========== 核心函数 ==========

/**
 * 创建离线挂机状态
 */
export function createIdleState(): IdleState {
  return {
    lastOnlineTime: Date.now(),
    currentLocation: '推图',
    maxOfflineMinutes: 480,    // 默认 8 小时
    accelerators: 0,
    vipLevel: 0,
    reports: [],
    totalOfflineMinutes: 0,
    totalExpGained: 0,
    totalGoldGained: 0,
    bonuses: [],
  }
}

/**
 * 设置离线挂机地点
 */
export function setIdleLocation(
  state: IdleState,
  location: IdleLocation,
  playerLevel: number
): { success: boolean; reason?: string } {
  const config = IDLE_LOCATIONS.find(l => l.location === location)
  if (!config) return { success: false, reason: '地点不存在' }

  if (playerLevel < config.unlockLevel) {
    return { success: false, reason: `需要 ${config.unlockLevel} 级解锁` }
  }

  state.currentLocation = location
  return { success: true }
}

/**
 * 计算离线时长（分钟）
 */
export function calculateOfflineDuration(state: IdleState, now?: number): number {
  const currentTime = now || Date.now()
  const elapsedMs = currentTime - state.lastOnlineTime
  const elapsedMinutes = Math.floor(elapsedMs / 60000)
  return Math.min(elapsedMinutes, state.maxOfflineMinutes)
}

/**
 * 计算离线收益
 */
export function calculateIdleRewards(
  state: IdleState,
  durationMinutes: number,
  playerLevel: number,
  acceleratorCount: number = 0
): IdleReward {
  const config = IDLE_LOCATIONS.find(l => l.location === state.currentLocation)
  if (!config) {
    return { exp: 0, gold: 0, materials: [], petExp: 0, heroExp: 0, duration: 0, accelerated: false }
  }

  // 计算加速倍率
  const acceleratorMultiplier = acceleratorCount > 0 ? 2 : 1
  const effectiveMinutes = durationMinutes * acceleratorMultiplier

  // 等级加成
  const levelMultiplier = 1 + (playerLevel - 1) * 0.02

  // 计算总加成倍率
  let expMultiplier = levelMultiplier
  let goldMultiplier = levelMultiplier
  let dropMultiplier = 1

  for (const bonus of state.bonuses) {
    expMultiplier *= bonus.expMultiplier
    goldMultiplier *= bonus.goldMultiplier
    dropMultiplier *= bonus.dropMultiplier
  }

  // VIP 加成
  const vipBonus = 1 + state.vipLevel * 0.1
  expMultiplier *= vipBonus
  goldMultiplier *= vipBonus

  // 计算收益
  const exp = Math.floor(config.baseExpPerMin * effectiveMinutes * expMultiplier)
  const gold = Math.floor(config.baseGoldPerMin * effectiveMinutes * goldMultiplier)
  const petExp = Math.floor(config.petExpPerMin * effectiveMinutes * levelMultiplier)
  const heroExp = Math.floor(config.heroExpPerMin * effectiveMinutes * levelMultiplier)

  // 计算材料掉落
  const materials = calculateMaterialDrops(
    config.materialDropRate * dropMultiplier,
    effectiveMinutes
  )

  return {
    exp,
    gold,
    materials,
    petExp,
    heroExp,
    duration: durationMinutes,
    accelerated: acceleratorCount > 0,
  }
}

/**
 * 计算材料掉落
 */
function calculateMaterialDrops(dropRate: number, minutes: number): IdleMaterialDrop[] {
  const drops: Map<string, IdleMaterialDrop> = new Map()
  const totalWeight = MATERIAL_POOL.reduce((sum, m) => sum + m.weight, 0)

  // 简化计算：根据概率和时长计算期望掉落
  const expectedDrops = Math.floor(dropRate * minutes)

  for (let i = 0; i < expectedDrops; i++) {
    // 加权随机选择材料
    let roll = Math.random() * totalWeight
    for (const material of MATERIAL_POOL) {
      roll -= material.weight
      if (roll <= 0) {
        const existing = drops.get(material.itemId)
        if (existing) {
          existing.quantity++
        } else {
          drops.set(material.itemId, {
            itemId: material.itemId,
            name: material.name,
            quantity: 1,
          })
        }
        break
      }
    }
  }

  return Array.from(drops.values())
}

/**
 * 领取离线收益
 */
export function claimIdleRewards(
  state: IdleState,
  playerLevel: number,
  acceleratorCount: number = 0,
  now?: number
): { success: boolean; rewards: IdleReward; report: IdleReport | null; reason?: string } {
  const currentTime = now || Date.now()
  const duration = calculateOfflineDuration(state, currentTime)

  if (duration <= 0) {
    return { success: false, rewards: emptyReward(), report: null, reason: '没有离线收益可领取' }
  }

  // 检查加速券
  const actualAccelerators = Math.min(acceleratorCount, state.accelerators)

  // 计算收益
  const rewards = calculateIdleRewards(state, duration, playerLevel, actualAccelerators)

  // 扣除加速券
  if (actualAccelerators > 0) {
    state.accelerators -= actualAccelerators
  }

  // 更新状态
  state.lastOnlineTime = currentTime
  state.totalOfflineMinutes += duration
  state.totalExpGained += rewards.exp
  state.totalGoldGained += rewards.gold

  // 生成报告
  const report: IdleReport = {
    startTime: currentTime - duration * 60000,
    endTime: currentTime,
    claimTime: currentTime,
    location: state.currentLocation,
    durationMinutes: duration,
    rewards,
    bonuses: [...state.bonuses],
    acceleratorUsed: actualAccelerators,
  }

  state.reports.unshift(report)
  if (state.reports.length > 30) {
    state.reports = state.reports.slice(0, 30)
  }

  return { success: true, rewards, report }
}

/**
 * 添加加速券
 */
export function addAccelerators(state: IdleState, count: number): void {
  state.accelerators += count
}

/**
 * 设置 VIP 等级（影响离线时长和收益）
 */
export function setVipLevel(state: IdleState, level: number): void {
  state.vipLevel = level
  // VIP 等级影响最大离线时长
  if (level >= 10) {
    state.maxOfflineMinutes = 1440 // 24 小时
  } else if (level >= 5) {
    state.maxOfflineMinutes = 720  // 12 小时
  } else {
    state.maxOfflineMinutes = 480  // 8 小时
  }
}

/**
 * 添加离线收益加成
 */
export function addIdleBonus(state: IdleState, bonus: IdleBonus): void {
  state.bonuses.push(bonus)
}

/**
 * 清除所有加成
 */
export function clearBonuses(state: IdleState): void {
  state.bonuses = []
}

/**
 * 获取离线统计
 */
export function getIdleStats(state: IdleState): {
  totalOfflineHours: number
  totalExpGained: number
  totalGoldGained: number
  currentLocation: IdleLocation
  maxOfflineHours: number
  accelerators: number
  reportsCount: number
  vipLevel: number
} {
  return {
    totalOfflineHours: Math.round(state.totalOfflineMinutes / 60 * 10) / 10,
    totalExpGained: state.totalExpGained,
    totalGoldGained: state.totalGoldGained,
    currentLocation: state.currentLocation,
    maxOfflineHours: state.maxOfflineMinutes / 60,
    accelerators: state.accelerators,
    reportsCount: state.reports.length,
    vipLevel: state.vipLevel,
  }
}

/**
 * 获取可用地点列表
 */
export function getAvailableLocations(playerLevel: number): IdleConfig[] {
  return IDLE_LOCATIONS.filter(l => playerLevel >= l.unlockLevel)
}

function emptyReward(): IdleReward {
  return { exp: 0, gold: 0, materials: [], petExp: 0, heroExp: 0, duration: 0, accelerated: false }
}

/**
 * 导出离线状态
 */
export function exportIdleState(state: IdleState): any {
  return { ...state }
}

/**
 * 导入离线状态
 */
export function importIdleState(data: any): IdleState {
  return { ...data }
}
