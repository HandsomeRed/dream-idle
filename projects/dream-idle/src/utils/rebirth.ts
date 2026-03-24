/**
 * v0.52 转生系统
 * 
 * 功能特性：
 * - 转生（到达满级后重新开始，保留部分属性加成）
 * - 转生次数追踪
 * - 转生加成（每次转生增加基础属性百分比）
 * - 转生专属货币（转生点）
 * - 转生商店（用转生点购买永久加成）
 * - 转生里程碑奖励
 * - 转生排行榜
 */

export interface RebirthState {
  rebirthCount: number              // 转生次数
  rebirthPoints: number             // 转生点（专属货币）
  totalRebirthPoints: number        // 历史累计转生点
  currentLevel: number              // 当前等级
  maxLevel: number                  // 最大等级（默认 100）
  rebirthBonuses: RebirthBonus[]    // 已激活的转生加成
  shopPurchases: Map<string, number> // 商店购买记录
  milestones: Map<number, boolean>  // 里程碑领取记录
  lastRebirthTime: number           // 上次转生时间
  fastestRebirth: number            // 最快转生用时（毫秒）
  totalPlayTime: number             // 累计游玩时间
}

export interface RebirthBonus {
  type: 'attack' | 'defense' | 'hp' | 'speed' | 'exp' | 'gold' | 'drop_rate' | 'crit'
  value: number                     // 加成值
  isPercent: boolean
  source: string                    // 来源描述
}

export interface RebirthShopItem {
  id: string
  name: string
  description: string
  cost: number                      // 转生点消耗
  maxPurchases: number              // 最大购买次数（0=无限）
  bonus: RebirthBonus
}

export interface RebirthMilestone {
  rebirthCount: number              // 达到的转生次数
  rewards: MilestoneReward[]
}

export interface MilestoneReward {
  type: 'rebirth_points' | 'diamond' | 'title' | 'permanent_bonus'
  amount: number
  titleName?: string
  bonus?: RebirthBonus
}

// ========== 配置 ==========

/**
 * 转生点计算：基于当前等级
 */
export function calculateRebirthPoints(level: number, rebirthCount: number): number {
  const basePoints = Math.floor(level / 10) * 5
  const bonusMultiplier = 1 + rebirthCount * 0.1
  return Math.floor(basePoints * bonusMultiplier)
}

/**
 * 转生基础加成：每次转生提供的永久属性加成
 */
export function calculateRebirthBaseBonus(rebirthCount: number): RebirthBonus[] {
  if (rebirthCount === 0) return []

  return [
    { type: 'attack', value: rebirthCount * 5, isPercent: true, source: `转生 ${rebirthCount} 次` },
    { type: 'defense', value: rebirthCount * 5, isPercent: true, source: `转生 ${rebirthCount} 次` },
    { type: 'hp', value: rebirthCount * 5, isPercent: true, source: `转生 ${rebirthCount} 次` },
    { type: 'exp', value: rebirthCount * 10, isPercent: true, source: `转生 ${rebirthCount} 次` },
  ]
}

export const REBIRTH_SHOP: RebirthShopItem[] = [
  { id: 'atk_boost', name: '攻击永久加成', description: '永久增加 2% 攻击力', cost: 10, maxPurchases: 50, bonus: { type: 'attack', value: 2, isPercent: true, source: '转生商店' } },
  { id: 'def_boost', name: '防御永久加成', description: '永久增加 2% 防御力', cost: 10, maxPurchases: 50, bonus: { type: 'defense', value: 2, isPercent: true, source: '转生商店' } },
  { id: 'hp_boost', name: '生命永久加成', description: '永久增加 2% 生命值', cost: 10, maxPurchases: 50, bonus: { type: 'hp', value: 2, isPercent: true, source: '转生商店' } },
  { id: 'exp_boost', name: '经验永久加成', description: '永久增加 5% 经验获取', cost: 15, maxPurchases: 20, bonus: { type: 'exp', value: 5, isPercent: true, source: '转生商店' } },
  { id: 'gold_boost', name: '金币永久加成', description: '永久增加 5% 金币获取', cost: 15, maxPurchases: 20, bonus: { type: 'gold', value: 5, isPercent: true, source: '转生商店' } },
  { id: 'crit_boost', name: '暴击永久加成', description: '永久增加 1% 暴击率', cost: 20, maxPurchases: 30, bonus: { type: 'crit', value: 1, isPercent: true, source: '转生商店' } },
  { id: 'drop_boost', name: '掉率永久加成', description: '永久增加 3% 掉落率', cost: 25, maxPurchases: 20, bonus: { type: 'drop_rate', value: 3, isPercent: true, source: '转生商店' } },
  { id: 'speed_boost', name: '速度永久加成', description: '永久增加 1% 速度', cost: 20, maxPurchases: 30, bonus: { type: 'speed', value: 1, isPercent: true, source: '转生商店' } },
]

export const REBIRTH_MILESTONES: RebirthMilestone[] = [
  { rebirthCount: 1, rewards: [{ type: 'rebirth_points', amount: 20 }, { type: 'title', amount: 0, titleName: '重生者' }] },
  { rebirthCount: 5, rewards: [{ type: 'rebirth_points', amount: 50 }, { type: 'diamond', amount: 100 }] },
  { rebirthCount: 10, rewards: [{ type: 'rebirth_points', amount: 100 }, { type: 'title', amount: 0, titleName: '轮回之主' }] },
  { rebirthCount: 25, rewards: [{ type: 'rebirth_points', amount: 200 }, { type: 'diamond', amount: 500 }] },
  { rebirthCount: 50, rewards: [{ type: 'rebirth_points', amount: 500 }, { type: 'title', amount: 0, titleName: '永恒旅者' }] },
  { rebirthCount: 100, rewards: [{ type: 'rebirth_points', amount: 1000 }, { type: 'title', amount: 0, titleName: '超越者' }, { type: 'permanent_bonus', amount: 0, bonus: { type: 'attack', value: 50, isPercent: true, source: '100 次转生里程碑' } }] },
]

// ========== 核心函数 ==========

/**
 * 创建转生状态
 */
export function createRebirthState(): RebirthState {
  return {
    rebirthCount: 0,
    rebirthPoints: 0,
    totalRebirthPoints: 0,
    currentLevel: 1,
    maxLevel: 100,
    rebirthBonuses: [],
    shopPurchases: new Map(),
    milestones: new Map(),
    lastRebirthTime: 0,
    fastestRebirth: 0,
    totalPlayTime: 0,
  }
}

/**
 * 检查是否可以转生
 */
export function canRebirth(state: RebirthState): { canRebirth: boolean; reason?: string } {
  if (state.currentLevel < state.maxLevel) {
    return { canRebirth: false, reason: `需要达到 ${state.maxLevel} 级才能转生（当前 ${state.currentLevel} 级）` }
  }
  return { canRebirth: true }
}

/**
 * 执行转生
 */
export function rebirth(state: RebirthState, playTimeMs: number = 0): {
  success: boolean
  pointsGained: number
  newRebirthCount: number
  reason?: string
} {
  const check = canRebirth(state)
  if (!check.canRebirth) {
    return { success: false, pointsGained: 0, newRebirthCount: state.rebirthCount, reason: check.reason }
  }

  // 计算转生点
  const pointsGained = calculateRebirthPoints(state.currentLevel, state.rebirthCount)

  // 更新状态
  state.rebirthCount++
  state.rebirthPoints += pointsGained
  state.totalRebirthPoints += pointsGained
  state.currentLevel = 1
  state.totalPlayTime += playTimeMs

  // 更新最快转生记录
  if (playTimeMs > 0 && (state.fastestRebirth === 0 || playTimeMs < state.fastestRebirth)) {
    state.fastestRebirth = playTimeMs
  }

  state.lastRebirthTime = Date.now()

  // 更新基础加成
  state.rebirthBonuses = calculateRebirthBaseBonus(state.rebirthCount)

  // 加上商店购买的加成
  for (const [itemId, count] of state.shopPurchases) {
    const shopItem = REBIRTH_SHOP.find(s => s.id === itemId)
    if (shopItem) {
      state.rebirthBonuses.push({
        ...shopItem.bonus,
        value: shopItem.bonus.value * count,
      })
    }
  }

  return {
    success: true,
    pointsGained,
    newRebirthCount: state.rebirthCount,
  }
}

/**
 * 升级（模拟）
 */
export function levelUp(state: RebirthState, levels: number = 1): number {
  const newLevel = Math.min(state.currentLevel + levels, state.maxLevel)
  const gained = newLevel - state.currentLevel
  state.currentLevel = newLevel
  return gained
}

/**
 * 购买转生商店物品
 */
export function buyShopItem(
  state: RebirthState,
  itemId: string
): { success: boolean; reason?: string } {
  const item = REBIRTH_SHOP.find(s => s.id === itemId)
  if (!item) return { success: false, reason: '商品不存在' }

  if (state.rebirthPoints < item.cost) {
    return { success: false, reason: `转生点不足，需要 ${item.cost} 点` }
  }

  const currentPurchases = state.shopPurchases.get(itemId) || 0
  if (item.maxPurchases > 0 && currentPurchases >= item.maxPurchases) {
    return { success: false, reason: `已达到最大购买次数 ${item.maxPurchases}` }
  }

  state.rebirthPoints -= item.cost
  state.shopPurchases.set(itemId, currentPurchases + 1)

  // 更新加成
  rebuildBonuses(state)

  return { success: true }
}

/**
 * 领取里程碑奖励
 */
export function claimMilestone(
  state: RebirthState,
  rebirthCount: number
): { success: boolean; rewards: MilestoneReward[]; reason?: string } {
  const milestone = REBIRTH_MILESTONES.find(m => m.rebirthCount === rebirthCount)
  if (!milestone) return { success: false, rewards: [], reason: '里程碑不存在' }

  if (state.rebirthCount < rebirthCount) {
    return { success: false, rewards: [], reason: `需要 ${rebirthCount} 次转生（当前 ${state.rebirthCount} 次）` }
  }

  if (state.milestones.get(rebirthCount)) {
    return { success: false, rewards: [], reason: '里程碑奖励已领取' }
  }

  state.milestones.set(rebirthCount, true)

  // 发放转生点奖励
  for (const reward of milestone.rewards) {
    if (reward.type === 'rebirth_points') {
      state.rebirthPoints += reward.amount
      state.totalRebirthPoints += reward.amount
    }
  }

  return { success: true, rewards: milestone.rewards }
}

/**
 * 获取可领取的里程碑
 */
export function getClaimableMilestones(state: RebirthState): RebirthMilestone[] {
  return REBIRTH_MILESTONES.filter(m =>
    state.rebirthCount >= m.rebirthCount && !state.milestones.get(m.rebirthCount)
  )
}

/**
 * 获取所有转生加成
 */
export function getAllBonuses(state: RebirthState): RebirthBonus[] {
  return state.rebirthBonuses
}

/**
 * 获取转生统计
 */
export function getRebirthStats(state: RebirthState): {
  rebirthCount: number
  rebirthPoints: number
  totalRebirthPoints: number
  currentLevel: number
  maxLevel: number
  totalBonuses: number
  shopPurchases: number
  milestonesCleared: number
  totalMilestones: number
  fastestRebirth: number
  totalPlayTime: number
} {
  return {
    rebirthCount: state.rebirthCount,
    rebirthPoints: state.rebirthPoints,
    totalRebirthPoints: state.totalRebirthPoints,
    currentLevel: state.currentLevel,
    maxLevel: state.maxLevel,
    totalBonuses: state.rebirthBonuses.length,
    shopPurchases: Array.from(state.shopPurchases.values()).reduce((a, b) => a + b, 0),
    milestonesCleared: state.milestones.size,
    totalMilestones: REBIRTH_MILESTONES.length,
    fastestRebirth: state.fastestRebirth,
    totalPlayTime: state.totalPlayTime,
  }
}

/**
 * 重建加成列表
 */
function rebuildBonuses(state: RebirthState): void {
  state.rebirthBonuses = calculateRebirthBaseBonus(state.rebirthCount)

  for (const [itemId, count] of state.shopPurchases) {
    const shopItem = REBIRTH_SHOP.find(s => s.id === itemId)
    if (shopItem) {
      state.rebirthBonuses.push({
        ...shopItem.bonus,
        value: shopItem.bonus.value * count,
      })
    }
  }
}

/**
 * 导出转生状态
 */
export function exportRebirthState(state: RebirthState): any {
  return {
    ...state,
    shopPurchases: Array.from(state.shopPurchases.entries()),
    milestones: Array.from(state.milestones.entries()),
  }
}

/**
 * 导入转生状态
 */
export function importRebirthState(data: any): RebirthState {
  return {
    ...data,
    shopPurchases: new Map(data.shopPurchases),
    milestones: new Map(data.milestones),
  }
}
