/**
 * v0.51 天赋树系统
 * 
 * 功能特性：
 * - 3 大天赋分支（战斗/防御/辅助）
 * - 天赋节点解锁（天赋点 + 前置天赋）
 * - 天赋效果（属性加成/特殊效果）
 * - 天赋重置（消耗钻石）
 * - 天赋预设（保存/加载方案）
 */

export type TalentBranch = '战斗' | '防御' | '辅助'
export type TalentTier = 1 | 2 | 3 | 4 | 5

export interface TalentNode {
  id: string
  name: string
  branch: TalentBranch
  tier: TalentTier
  description: string
  maxLevel: number
  currentLevel: number
  costPerLevel: number           // 每级消耗天赋点
  prerequisiteIds: string[]      // 前置天赋 ID
  effects: TalentEffect[]        // 每级效果
}

export interface TalentEffect {
  type: 'attack' | 'defense' | 'hp' | 'speed' | 'crit' | 'crit_dmg' | 'heal' | 'exp_bonus' | 'gold_bonus' | 'dodge' | 'lifesteal'
  valuePerLevel: number          // 每级增加值
  isPercent: boolean             // 是否百分比
}

export interface TalentPreset {
  id: string
  name: string
  allocations: Map<string, number>  // talentId -> level
  createdAt: number
}

export interface TalentTreeState {
  talents: Map<string, TalentNode>
  totalPoints: number              // 总天赋点
  usedPoints: number               // 已使用天赋点
  availablePoints: number          // 可用天赋点
  presets: TalentPreset[]          // 天赋预设（最多 5 套）
  resetCount: number               // 重置次数
  lastResetTime: number            // 上次重置时间
}

// ========== 天赋配置 ==========

export const TALENT_CONFIGS: Omit<TalentNode, 'currentLevel'>[] = [
  // 战斗分支 - T1
  { id: 'atk_1', name: '力量强化', branch: '战斗', tier: 1, description: '提升基础攻击力', maxLevel: 5, costPerLevel: 1, prerequisiteIds: [], effects: [{ type: 'attack', valuePerLevel: 10, isPercent: false }] },
  { id: 'crit_1', name: '精准打击', branch: '战斗', tier: 1, description: '提升暴击率', maxLevel: 5, costPerLevel: 1, prerequisiteIds: [], effects: [{ type: 'crit', valuePerLevel: 2, isPercent: true }] },
  // 战斗分支 - T2
  { id: 'atk_2', name: '狂暴之力', branch: '战斗', tier: 2, description: '大幅提升攻击力', maxLevel: 5, costPerLevel: 2, prerequisiteIds: ['atk_1'], effects: [{ type: 'attack', valuePerLevel: 5, isPercent: true }] },
  { id: 'crit_dmg_1', name: '致命一击', branch: '战斗', tier: 2, description: '提升暴击伤害', maxLevel: 5, costPerLevel: 2, prerequisiteIds: ['crit_1'], effects: [{ type: 'crit_dmg', valuePerLevel: 10, isPercent: true }] },
  // 战斗分支 - T3
  { id: 'lifesteal_1', name: '嗜血本能', branch: '战斗', tier: 3, description: '攻击回复生命', maxLevel: 3, costPerLevel: 3, prerequisiteIds: ['atk_2'], effects: [{ type: 'lifesteal', valuePerLevel: 3, isPercent: true }] },
  // 战斗分支 - T4
  { id: 'atk_3', name: '战神之力', branch: '战斗', tier: 4, description: '终极攻击强化', maxLevel: 3, costPerLevel: 4, prerequisiteIds: ['lifesteal_1', 'crit_dmg_1'], effects: [{ type: 'attack', valuePerLevel: 10, isPercent: true }, { type: 'crit', valuePerLevel: 5, isPercent: true }] },

  // 防御分支 - T1
  { id: 'def_1', name: '铁壁防御', branch: '防御', tier: 1, description: '提升基础防御力', maxLevel: 5, costPerLevel: 1, prerequisiteIds: [], effects: [{ type: 'defense', valuePerLevel: 10, isPercent: false }] },
  { id: 'hp_1', name: '生命强化', branch: '防御', tier: 1, description: '提升最大生命值', maxLevel: 5, costPerLevel: 1, prerequisiteIds: [], effects: [{ type: 'hp', valuePerLevel: 50, isPercent: false }] },
  // 防御分支 - T2
  { id: 'def_2', name: '钢铁之躯', branch: '防御', tier: 2, description: '大幅提升防御', maxLevel: 5, costPerLevel: 2, prerequisiteIds: ['def_1'], effects: [{ type: 'defense', valuePerLevel: 5, isPercent: true }] },
  { id: 'dodge_1', name: '闪避本能', branch: '防御', tier: 2, description: '获得闪避几率', maxLevel: 5, costPerLevel: 2, prerequisiteIds: ['hp_1'], effects: [{ type: 'dodge', valuePerLevel: 3, isPercent: true }] },
  // 防御分支 - T3
  { id: 'hp_2', name: '不屈意志', branch: '防御', tier: 3, description: '大幅提升生命值', maxLevel: 3, costPerLevel: 3, prerequisiteIds: ['def_2'], effects: [{ type: 'hp', valuePerLevel: 8, isPercent: true }] },
  // 防御分支 - T4
  { id: 'def_3', name: '守护圣盾', branch: '防御', tier: 4, description: '终��防御强化', maxLevel: 3, costPerLevel: 4, prerequisiteIds: ['hp_2', 'dodge_1'], effects: [{ type: 'defense', valuePerLevel: 10, isPercent: true }, { type: 'hp', valuePerLevel: 5, isPercent: true }] },

  // 辅助分支 - T1
  { id: 'speed_1', name: '疾风步', branch: '辅助', tier: 1, description: '提升速度', maxLevel: 5, costPerLevel: 1, prerequisiteIds: [], effects: [{ type: 'speed', valuePerLevel: 5, isPercent: false }] },
  { id: 'exp_1', name: '学习天赋', branch: '辅助', tier: 1, description: '提升经验获取', maxLevel: 5, costPerLevel: 1, prerequisiteIds: [], effects: [{ type: 'exp_bonus', valuePerLevel: 5, isPercent: true }] },
  // 辅助分支 - T2
  { id: 'gold_1', name: '点石成金', branch: '辅助', tier: 2, description: '提升金币获取', maxLevel: 5, costPerLevel: 2, prerequisiteIds: ['exp_1'], effects: [{ type: 'gold_bonus', valuePerLevel: 5, isPercent: true }] },
  { id: 'heal_1', name: '恢复之力', branch: '辅助', tier: 2, description: '提升治疗效果', maxLevel: 5, costPerLevel: 2, prerequisiteIds: ['speed_1'], effects: [{ type: 'heal', valuePerLevel: 5, isPercent: true }] },
  // 辅助分支 - T3
  { id: 'exp_2', name: '博学多才', branch: '辅助', tier: 3, description: '大幅提升经验', maxLevel: 3, costPerLevel: 3, prerequisiteIds: ['gold_1'], effects: [{ type: 'exp_bonus', valuePerLevel: 10, isPercent: true }] },
  // 辅助分支 - T4
  { id: 'support_3', name: '天命之子', branch: '辅助', tier: 4, description: '终极辅助强化', maxLevel: 3, costPerLevel: 4, prerequisiteIds: ['exp_2', 'heal_1'], effects: [{ type: 'exp_bonus', valuePerLevel: 15, isPercent: true }, { type: 'gold_bonus', valuePerLevel: 10, isPercent: true }] },
]

// ========== 核心函数 ==========

/**
 * 创建天赋树状态
 */
export function createTalentTreeState(totalPoints: number = 0): TalentTreeState {
  const talents = new Map<string, TalentNode>()

  for (const config of TALENT_CONFIGS) {
    talents.set(config.id, { ...config, currentLevel: 0 })
  }

  return {
    talents,
    totalPoints,
    usedPoints: 0,
    availablePoints: totalPoints,
    presets: [],
    resetCount: 0,
    lastResetTime: 0,
  }
}

/**
 * 添加天赋点
 */
export function addTalentPoints(state: TalentTreeState, points: number): void {
  state.totalPoints += points
  state.availablePoints += points
}

/**
 * 检查是否可以升级天赋
 */
export function canUpgradeTalent(
  state: TalentTreeState,
  talentId: string
): { canUpgrade: boolean; reason?: string } {
  const talent = state.talents.get(talentId)
  if (!talent) return { canUpgrade: false, reason: '天赋不存在' }

  if (talent.currentLevel >= talent.maxLevel) {
    return { canUpgrade: false, reason: '天赋已满级' }
  }

  if (state.availablePoints < talent.costPerLevel) {
    return { canUpgrade: false, reason: `天赋点不足，需要 ${talent.costPerLevel} 点` }
  }

  // 检查前置天赋
  for (const prereqId of talent.prerequisiteIds) {
    const prereq = state.talents.get(prereqId)
    if (!prereq || prereq.currentLevel < prereq.maxLevel) {
      return { canUpgrade: false, reason: `需要先满级前置天赋「${prereq?.name || prereqId}」` }
    }
  }

  return { canUpgrade: true }
}

/**
 * 升级天赋
 */
export function upgradeTalent(
  state: TalentTreeState,
  talentId: string
): { success: boolean; reason?: string } {
  const check = canUpgradeTalent(state, talentId)
  if (!check.canUpgrade) return { success: false, reason: check.reason }

  const talent = state.talents.get(talentId)!
  talent.currentLevel++
  state.usedPoints += talent.costPerLevel
  state.availablePoints -= talent.costPerLevel

  return { success: true }
}

/**
 * 重置天赋树
 */
export function resetTalentTree(
  state: TalentTreeState,
  diamonds: number
): { success: boolean; cost: number; reason?: string } {
  const resetCost = 50 + state.resetCount * 50 // 每次重置费用递增

  if (diamonds < resetCost) {
    return { success: false, cost: resetCost, reason: `钻石不足，需要 ${resetCost} 钻石` }
  }

  if (state.usedPoints === 0) {
    return { success: false, cost: 0, reason: '没有已分配的天赋点' }
  }

  // 重置所有天赋
  for (const talent of state.talents.values()) {
    talent.currentLevel = 0
  }

  state.availablePoints = state.totalPoints
  state.usedPoints = 0
  state.resetCount++
  state.lastResetTime = Date.now()

  return { success: true, cost: resetCost }
}

/**
 * 计算天赋效果总和
 */
export function calculateTalentEffects(state: TalentTreeState): Map<string, { flat: number; percent: number }> {
  const effects = new Map<string, { flat: number; percent: number }>()

  for (const talent of state.talents.values()) {
    if (talent.currentLevel === 0) continue

    for (const effect of talent.effects) {
      const current = effects.get(effect.type) || { flat: 0, percent: 0 }

      if (effect.isPercent) {
        current.percent += effect.valuePerLevel * talent.currentLevel
      } else {
        current.flat += effect.valuePerLevel * talent.currentLevel
      }

      effects.set(effect.type, current)
    }
  }

  return effects
}

/**
 * 获取分支天赋
 */
export function getTalentsByBranch(state: TalentTreeState, branch: TalentBranch): TalentNode[] {
  return Array.from(state.talents.values())
    .filter(t => t.branch === branch)
    .sort((a, b) => a.tier - b.tier)
}

/**
 * 获取分支已用天赋点
 */
export function getBranchPoints(state: TalentTreeState, branch: TalentBranch): number {
  let points = 0
  for (const talent of state.talents.values()) {
    if (talent.branch === branch) {
      points += talent.currentLevel * talent.costPerLevel
    }
  }
  return points
}

/**
 * 保存天赋预设
 */
export function saveTalentPreset(
  state: TalentTreeState,
  presetName: string
): { success: boolean; reason?: string } {
  if (state.presets.length >= 5) {
    return { success: false, reason: '预设数量已满（最多 5 套）' }
  }

  const allocations = new Map<string, number>()
  for (const [id, talent] of state.talents) {
    if (talent.currentLevel > 0) {
      allocations.set(id, talent.currentLevel)
    }
  }

  state.presets.push({
    id: `preset_${Date.now()}`,
    name: presetName,
    allocations,
    createdAt: Date.now(),
  })

  return { success: true }
}

/**
 * 加载天赋预设
 */
export function loadTalentPreset(
  state: TalentTreeState,
  presetId: string
): { success: boolean; reason?: string } {
  const preset = state.presets.find(p => p.id === presetId)
  if (!preset) return { success: false, reason: '预设不存在' }

  // 计算预设需要的总天赋点
  let requiredPoints = 0
  for (const [talentId, level] of preset.allocations) {
    const talent = state.talents.get(talentId)
    if (talent) {
      requiredPoints += talent.costPerLevel * level
    }
  }

  if (requiredPoints > state.totalPoints) {
    return { success: false, reason: '天赋点不足以加载此预设' }
  }

  // 重置当前天赋
  for (const talent of state.talents.values()) {
    talent.currentLevel = 0
  }

  // 应用预设
  state.usedPoints = 0
  for (const [talentId, level] of preset.allocations) {
    const talent = state.talents.get(talentId)
    if (talent) {
      talent.currentLevel = level
      state.usedPoints += talent.costPerLevel * level
    }
  }
  state.availablePoints = state.totalPoints - state.usedPoints

  return { success: true }
}

/**
 * 删除天赋预设
 */
export function deleteTalentPreset(state: TalentTreeState, presetId: string): boolean {
  const index = state.presets.findIndex(p => p.id === presetId)
  if (index === -1) return false
  state.presets.splice(index, 1)
  return true
}

/**
 * 获取天赋统计
 */
export function getTalentStats(state: TalentTreeState): {
  totalPoints: number
  usedPoints: number
  availablePoints: number
  branchPoints: Record<TalentBranch, number>
  maxedTalents: number
  totalTalents: number
} {
  return {
    totalPoints: state.totalPoints,
    usedPoints: state.usedPoints,
    availablePoints: state.availablePoints,
    branchPoints: {
      '战斗': getBranchPoints(state, '战斗'),
      '防御': getBranchPoints(state, '防御'),
      '辅助': getBranchPoints(state, '辅助'),
    },
    maxedTalents: Array.from(state.talents.values()).filter(t => t.currentLevel >= t.maxLevel).length,
    totalTalents: state.talents.size,
  }
}

/**
 * 导出天赋树状态
 */
export function exportTalentTreeState(state: TalentTreeState): any {
  return {
    talents: Array.from(state.talents.entries()).map(([id, t]) => [id, { ...t }]),
    totalPoints: state.totalPoints,
    usedPoints: state.usedPoints,
    availablePoints: state.availablePoints,
    presets: state.presets.map(p => ({
      ...p,
      allocations: Array.from(p.allocations.entries()),
    })),
    resetCount: state.resetCount,
    lastResetTime: state.lastResetTime,
  }
}

/**
 * 导入天赋树状态
 */
export function importTalentTreeState(data: any): TalentTreeState {
  return {
    talents: new Map(data.talents),
    totalPoints: data.totalPoints,
    usedPoints: data.usedPoints,
    availablePoints: data.availablePoints,
    presets: data.presets.map((p: any) => ({
      ...p,
      allocations: new Map(p.allocations),
    })),
    resetCount: data.resetCount,
    lastResetTime: data.lastResetTime,
  }
}
