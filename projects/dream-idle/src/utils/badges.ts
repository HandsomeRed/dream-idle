/**
 * v0.59 成就徽章系统
 * 
 * 功能特性：
 * - 徽章收集（稀有度/分类/展示）
 * - 徽章框展示（主页展示最多3个）
 * - 徽章解锁条件
 * - 徽章属性加成
 * - 徽章统计
 */

export type BadgeRarity = '铜' | '银' | '金' | '钻石' | '传说'
export type BadgeCategory = '成长' | '战斗' | '收集' | '探索' | '社交' | '特殊'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: BadgeRarity
  category: BadgeCategory
  unlockCondition: string
  bonus?: BadgeBonus
}

export interface BadgeBonus {
  type: 'attack' | 'defense' | 'hp' | 'exp' | 'gold' | 'crit' | 'speed'
  value: number
  isPercent: boolean
}

export interface BadgeState {
  unlockedBadges: Set<string>
  displayBadges: string[]         // 展示的徽章 ID（最多3个）
  favorited: Set<string>          // 收藏的徽章
  unlockTimestamps: Map<string, number>
}

// ========== 徽章配置 ==========

export const BADGES: Badge[] = [
  // 成长
  { id: 'b_lv10', name: '初出茅庐', description: '达到10级', icon: '🌱', rarity: '铜', category: '成长', unlockCondition: 'level>=10', bonus: { type: 'exp', value: 5, isPercent: true } },
  { id: 'b_lv30', name: '小有所成', description: '达到30级', icon: '🌿', rarity: '银', category: '成长', unlockCondition: 'level>=30', bonus: { type: 'exp', value: 10, isPercent: true } },
  { id: 'b_lv50', name: '登峰造极', description: '达到50级', icon: '🌳', rarity: '金', category: '成长', unlockCondition: 'level>=50', bonus: { type: 'exp', value: 15, isPercent: true } },
  { id: 'b_lv100', name: '满级大佬', description: '达到100级', icon: '🏔️', rarity: '钻石', category: '成长', unlockCondition: 'level>=100', bonus: { type: 'attack', value: 10, isPercent: true } },
  { id: 'b_rebirth1', name: '凤凰涅槃', description: '首次转生', icon: '🔥', rarity: '金', category: '成长', unlockCondition: 'rebirth>=1', bonus: { type: 'hp', value: 10, isPercent: true } },
  { id: 'b_rebirth10', name: '轮回之主', description: '转生10次', icon: '♾️', rarity: '传说', category: '成长', unlockCondition: 'rebirth>=10', bonus: { type: 'attack', value: 20, isPercent: true } },

  // 战斗
  { id: 'b_win100', name: '百战百胜', description: '战斗胜利100次', icon: '⚔️', rarity: '银', category: '战斗', unlockCondition: 'wins>=100', bonus: { type: 'attack', value: 5, isPercent: true } },
  { id: 'b_win1000', name: '战神降临', description: '战斗胜利1000次', icon: '🗡️', rarity: '金', category: '战斗', unlockCondition: 'wins>=1000', bonus: { type: 'crit', value: 5, isPercent: true } },
  { id: 'b_tower50', name: '登塔先锋', description: '爬塔达到50层', icon: '🗼', rarity: '银', category: '战斗', unlockCondition: 'tower>=50', bonus: { type: 'defense', value: 5, isPercent: true } },
  { id: 'b_tower200', name: '塔尖之人', description: '爬塔达到200层', icon: '🏰', rarity: '钻石', category: '战斗', unlockCondition: 'tower>=200', bonus: { type: 'defense', value: 15, isPercent: true } },
  { id: 'b_boss10', name: 'BOSS杀手', description: '击败10个BOSS', icon: '🐉', rarity: '金', category: '战斗', unlockCondition: 'boss_kills>=10', bonus: { type: 'attack', value: 10, isPercent: true } },

  // 收集
  { id: 'b_hero10', name: '英雄收藏家', description: '收集10个英雄', icon: '👥', rarity: '银', category: '收集', unlockCondition: 'heroes>=10', bonus: { type: 'hp', value: 5, isPercent: true } },
  { id: 'b_hero30', name: '英雄大师', description: '收集30个英雄', icon: '🦸', rarity: '钻石', category: '收集', unlockCondition: 'heroes>=30', bonus: { type: 'attack', value: 15, isPercent: true } },
  { id: 'b_pet10', name: '宠物达人', description: '收集10个宠物', icon: '🐾', rarity: '银', category: '收集', unlockCondition: 'pets>=10', bonus: { type: 'speed', value: 5, isPercent: true } },
  { id: 'b_equip_legend', name: '传说装备', description: '获得一件传说装备', icon: '🛡️', rarity: '金', category: '收集', unlockCondition: 'legend_equip>=1' },

  // 探索
  { id: 'b_map2', name: '探索者', description: '解锁2个区域', icon: '🗺️', rarity: '铜', category: '探索', unlockCondition: 'regions>=2', bonus: { type: 'gold', value: 5, isPercent: true } },
  { id: 'b_map4', name: '冒险家', description: '解锁4个区域', icon: '🧭', rarity: '银', category: '探索', unlockCondition: 'regions>=4', bonus: { type: 'gold', value: 10, isPercent: true } },
  { id: 'b_map6', name: '世界旅者', description: '解锁所有区域', icon: '🌍', rarity: '钻石', category: '探索', unlockCondition: 'regions>=6', bonus: { type: 'gold', value: 20, isPercent: true } },

  // 社交
  { id: 'b_arena_gold', name: '竞技黄金', description: '竞技场达到黄金段位', icon: '🥇', rarity: '银', category: '社交', unlockCondition: 'arena_tier>=gold' },
  { id: 'b_arena_legend', name: '竞技传说', description: '竞技场达到传说段位', icon: '👑', rarity: '传说', category: '社交', unlockCondition: 'arena_tier>=legend', bonus: { type: 'crit', value: 10, isPercent: true } },

  // 特殊
  { id: 'b_login7', name: '坚持就是胜利', description: '连续登录7天', icon: '📅', rarity: '铜', category: '特殊', unlockCondition: 'login_streak>=7' },
  { id: 'b_login30', name: '月度之星', description: '连续登录30天', icon: '🌟', rarity: '金', category: '特殊', unlockCondition: 'login_streak>=30', bonus: { type: 'exp', value: 20, isPercent: true } },
  { id: 'b_first_craft', name: '匠心独运', description: '首次合成物品', icon: '⚒️', rarity: '铜', category: '特殊', unlockCondition: 'crafts>=1' },
  { id: 'b_gold_million', name: '百万富翁', description: '累计获得100万金币', icon: '💰', rarity: '金', category: '特殊', unlockCondition: 'total_gold>=1000000', bonus: { type: 'gold', value: 15, isPercent: true } },
]

// ========== 核心函数 ==========

export function createBadgeState(): BadgeState {
  return {
    unlockedBadges: new Set(),
    displayBadges: [],
    favorited: new Set(),
    unlockTimestamps: new Map(),
  }
}

export function unlockBadge(state: BadgeState, badgeId: string): boolean {
  const badge = BADGES.find(b => b.id === badgeId)
  if (!badge) return false
  if (state.unlockedBadges.has(badgeId)) return false

  state.unlockedBadges.add(badgeId)
  state.unlockTimestamps.set(badgeId, Date.now())
  return true
}

export function setDisplayBadges(state: BadgeState, badgeIds: string[]): { success: boolean; reason?: string } {
  if (badgeIds.length > 3) return { success: false, reason: '最多展示3个徽章' }

  for (const id of badgeIds) {
    if (!state.unlockedBadges.has(id)) {
      return { success: false, reason: `徽章 ${id} 未解锁` }
    }
  }

  state.displayBadges = [...badgeIds]
  return { success: true }
}

export function toggleFavorite(state: BadgeState, badgeId: string): boolean {
  if (!state.unlockedBadges.has(badgeId)) return false

  if (state.favorited.has(badgeId)) {
    state.favorited.delete(badgeId)
  } else {
    state.favorited.add(badgeId)
  }
  return true
}

export function getUnlockedBadges(state: BadgeState): Badge[] {
  return BADGES.filter(b => state.unlockedBadges.has(b.id))
}

export function getBadgesByCategory(state: BadgeState, category: BadgeCategory): Badge[] {
  return BADGES.filter(b => b.category === category)
}

export function getBadgesByRarity(state: BadgeState, rarity: BadgeRarity): Badge[] {
  return BADGES.filter(b => b.rarity === rarity && state.unlockedBadges.has(b.id))
}

export function calculateBadgeBonuses(state: BadgeState): Map<string, { flat: number; percent: number }> {
  const bonuses = new Map<string, { flat: number; percent: number }>()

  for (const badgeId of state.unlockedBadges) {
    const badge = BADGES.find(b => b.id === badgeId)
    if (!badge?.bonus) continue

    const current = bonuses.get(badge.bonus.type) || { flat: 0, percent: 0 }
    if (badge.bonus.isPercent) {
      current.percent += badge.bonus.value
    } else {
      current.flat += badge.bonus.value
    }
    bonuses.set(badge.bonus.type, current)
  }

  return bonuses
}

export function getBadgeStats(state: BadgeState): {
  total: number; unlocked: number; completionRate: number;
  byRarity: Record<BadgeRarity, { total: number; unlocked: number }>;
  byCategory: Record<BadgeCategory, { total: number; unlocked: number }>;
} {
  const byRarity: Record<string, { total: number; unlocked: number }> = {}
  const byCategory: Record<string, { total: number; unlocked: number }> = {}

  for (const badge of BADGES) {
    if (!byRarity[badge.rarity]) byRarity[badge.rarity] = { total: 0, unlocked: 0 }
    byRarity[badge.rarity].total++
    if (state.unlockedBadges.has(badge.id)) byRarity[badge.rarity].unlocked++

    if (!byCategory[badge.category]) byCategory[badge.category] = { total: 0, unlocked: 0 }
    byCategory[badge.category].total++
    if (state.unlockedBadges.has(badge.id)) byCategory[badge.category].unlocked++
  }

  return {
    total: BADGES.length,
    unlocked: state.unlockedBadges.size,
    completionRate: BADGES.length > 0 ? Math.round((state.unlockedBadges.size / BADGES.length) * 100) : 0,
    byRarity: byRarity as any,
    byCategory: byCategory as any,
  }
}

export function exportBadgeState(state: BadgeState): any {
  return {
    unlockedBadges: Array.from(state.unlockedBadges),
    displayBadges: state.displayBadges,
    favorited: Array.from(state.favorited),
    unlockTimestamps: Array.from(state.unlockTimestamps.entries()),
  }
}

export function importBadgeState(data: any): BadgeState {
  return {
    unlockedBadges: new Set(data.unlockedBadges),
    displayBadges: data.displayBadges,
    favorited: new Set(data.favorited),
    unlockTimestamps: new Map(data.unlockTimestamps),
  }
}
