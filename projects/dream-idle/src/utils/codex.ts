/**
 * v0.62 图鉴收集系统 (Collection Codex)
 * 
 * 功能特性：
 * - 英雄图鉴（收集全部英雄解锁图鉴奖励）
 * - 宠物图鉴（收集全部宠物解锁图鉴奖励）
 * - 装备图鉴（收集各品质装备解锁图鉴奖励）
 * - 怪物图鉴（击败怪物解锁信息 + 掉落提示）
 * - 图鉴完成度全局属性加成
 * - 收集成就联动
 */

// ==================== 类型定义 ====================

export type CodexCategory = 'hero' | 'pet' | 'equipment' | 'monster'

export type CodexEntryRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface CodexEntry {
  id: string
  name: string
  category: CodexCategory
  rarity: CodexEntryRarity
  description: string
  unlocked: boolean
  unlockedAt: number | null       // timestamp
  viewCount: number               // 查看次数
  lore: string                    // 背景故事
  stats?: Record<string, number>  // 属性预览
  dropSource?: string             // 获取途径
}

export interface CodexCategoryData {
  category: CodexCategory
  label: string
  entries: Map<string, CodexEntry>
  totalCount: number
  unlockedCount: number
  completionBonus: CodexBonus       // 全收集奖励
  milestones: CodexMilestone[]      // 阶段奖励
}

export interface CodexBonus {
  description: string
  stats: Record<string, number>     // 属性加成
  claimed: boolean
}

export interface CodexMilestone {
  id: string
  requiredCount: number             // 需要解锁数量
  reward: CodexReward
  claimed: boolean
}

export interface CodexReward {
  type: 'gold' | 'diamond' | 'exp' | 'item' | 'title'
  amount: number
  itemId?: string
  itemName?: string
}

export interface CodexState {
  categories: Map<CodexCategory, CodexCategoryData>
  globalBonus: Record<string, number>  // 全局属性加成（来自完成度）
  totalUnlocked: number
  totalEntries: number
  lastUpdated: number
}

// ==================== 图鉴配置 ====================

interface HeroConfig {
  id: string; name: string; rarity: CodexEntryRarity
  description: string; lore: string
  stats: Record<string, number>; dropSource: string
}

interface PetConfig {
  id: string; name: string; rarity: CodexEntryRarity
  description: string; lore: string
  stats: Record<string, number>; dropSource: string
}

interface EquipConfig {
  id: string; name: string; rarity: CodexEntryRarity
  description: string; lore: string
  stats: Record<string, number>; dropSource: string
}

interface MonsterConfig {
  id: string; name: string; rarity: CodexEntryRarity
  description: string; lore: string
  stats: Record<string, number>; dropSource: string
}

const HERO_ENTRIES: HeroConfig[] = [
  { id: 'hero_warrior', name: '勇者战士', rarity: 'common', description: '手持铁剑的初心者', lore: '从小村庄出发的勇敢少年，立志成为最强战士。', stats: { attack: 120, hp: 800 }, dropSource: '英雄召唤' },
  { id: 'hero_mage', name: '元素法师', rarity: 'rare', description: '操控元素之力的法师', lore: '在魔法学院苦修十年，终于掌握了元素奥义。', stats: { magicAttack: 180, mp: 600 }, dropSource: '英雄召唤' },
  { id: 'hero_archer', name: '精灵射手', rarity: 'rare', description: '百步穿杨的精灵弓手', lore: '精灵族最优秀的射手，从未失手。', stats: { attack: 150, speed: 120 }, dropSource: '英雄召唤' },
  { id: 'hero_knight', name: '圣殿骑士', rarity: 'epic', description: '身披圣光的守护者', lore: '受到圣光庇护的骑士，誓言守护一切正义。', stats: { defense: 200, hp: 1200 }, dropSource: '英雄召唤' },
  { id: 'hero_assassin', name: '暗影刺客', rarity: 'epic', description: '来无影去无踪的杀手', lore: '暗影工会的顶级刺客，没有完不成的任务。', stats: { attack: 200, critRate: 35 }, dropSource: '英雄召唤' },
  { id: 'hero_healer', name: '圣光牧师', rarity: 'rare', description: '治愈之光的使者', lore: '虔诚的信徒，以治愈之光拯救苍生。', stats: { healing: 160, hp: 900 }, dropSource: '英雄召唤' },
  { id: 'hero_necro', name: '亡灵法师', rarity: 'epic', description: '操控亡灵之力', lore: '被禁忌之力诱惑的天才法师，徘徊于生死之间。', stats: { magicAttack: 220, hp: 700 }, dropSource: '英雄召唤' },
  { id: 'hero_dragon', name: '龙骑士', rarity: 'legendary', description: '驾驭巨龙的骑士', lore: '与龙缔结契约的传奇骑士，翱翔天际。', stats: { attack: 280, defense: 180, hp: 1500 }, dropSource: '传说召唤' },
  { id: 'hero_phoenix', name: '凤凰使者', rarity: 'legendary', description: '浴火重生的不死鸟使者', lore: '与凤凰融合的神秘使者，拥有不灭之力。', stats: { magicAttack: 300, hp: 1000 }, dropSource: '传说召唤' },
  { id: 'hero_titan', name: '泰坦战神', rarity: 'mythic', description: '远古泰坦的化身', lore: '沉睡万年的远古泰坦苏醒，力量撼动天地。', stats: { attack: 400, defense: 250, hp: 2000 }, dropSource: '神话召唤' },
]

const PET_ENTRIES: PetConfig[] = [
  { id: 'pet_slime', name: '果冻史莱姆', rarity: 'common', description: '软绵绵的小史莱姆', lore: '森林中最常见的小精灵，看起来很好吃的样子。', stats: { hp: 200 }, dropSource: '野外捕捉' },
  { id: 'pet_fox', name: '灵狐', rarity: 'rare', description: '机灵的小狐狸', lore: '传说中修炼百年的灵狐，拥有预知危险的能力。', stats: { speed: 100, critRate: 15 }, dropSource: '宠物召唤' },
  { id: 'pet_wolf', name: '银月狼', rarity: 'rare', description: '月光下的孤狼', lore: '在月圆之夜嚎叫的银狼，是忠诚的战斗伙伴。', stats: { attack: 120, speed: 80 }, dropSource: '宠物召唤' },
  { id: 'pet_griffin', name: '狮鹫', rarity: 'epic', description: '半狮半鹫的神兽', lore: '翱翔云端的高贵生物，只认可最强的主人。', stats: { attack: 180, defense: 100, speed: 90 }, dropSource: '宠物召唤' },
  { id: 'pet_unicorn', name: '独角兽', rarity: 'epic', description: '纯洁的神圣之兽', lore: '森林深处的守护者，角上蕴含治愈之力。', stats: { healing: 150, hp: 600 }, dropSource: '宠物召唤' },
  { id: 'pet_dragon_baby', name: '幼龙', rarity: 'legendary', description: '刚破壳的小龙', lore: '从远古龙蛋中孵化的幼龙，潜力无限。', stats: { attack: 200, magicAttack: 200, hp: 800 }, dropSource: '传说召唤' },
  { id: 'pet_phoenix_chick', name: '凤凰雏', rarity: 'legendary', description: '凤凰的幼雏', lore: '涅槃之火中诞生的雏鸟，继承了凤凰的意志。', stats: { magicAttack: 250, hp: 500 }, dropSource: '传说召唤' },
  { id: 'pet_qilin', name: '麒麟', rarity: 'mythic', description: '祥瑞之兽麒麟', lore: '太平盛世才会现身的神兽，见者皆获福报。', stats: { attack: 300, defense: 200, hp: 1200 }, dropSource: '神话召唤' },
]

const EQUIPMENT_ENTRIES: EquipConfig[] = [
  { id: 'equip_iron_sword', name: '铁剑', rarity: 'common', description: '普通的铁制长剑', lore: '铁匠铺里最便宜的武器，但也是冒险的起点。', stats: { attack: 30 }, dropSource: '商城购买' },
  { id: 'equip_leather_armor', name: '皮甲', rarity: 'common', description: '轻便的皮革护甲', lore: '猎人常用的护甲，灵活且提供基本防护。', stats: { defense: 25 }, dropSource: '商城购买' },
  { id: 'equip_flame_blade', name: '烈焰之刃', rarity: 'rare', description: '燃烧着火焰的魔剑', lore: '封印着火元素精灵的魔剑，斩击附带灼烧。', stats: { attack: 80, magicAttack: 40 }, dropSource: '副本掉落' },
  { id: 'equip_ice_shield', name: '寒冰之盾', rarity: 'rare', description: '永不融化的冰盾', lore: '用千年寒冰铸造的盾牌，触之即冻。', stats: { defense: 70, hp: 200 }, dropSource: '副本掉落' },
  { id: 'equip_shadow_cloak', name: '暗影斗篷', rarity: 'epic', description: '融入暗影的神秘斗篷', lore: '穿上它就能与影子融为一体，是刺客的至宝。', stats: { speed: 60, critRate: 20 }, dropSource: '副本掉落' },
  { id: 'equip_dragon_armor', name: '龙鳞战甲', rarity: 'epic', description: '用龙鳞锻造的重甲', lore: '取自远古巨龙的鳞片，坚不可摧。', stats: { defense: 150, hp: 500 }, dropSource: '世界BOSS' },
  { id: 'equip_excalibur', name: '圣剑·湖光', rarity: 'legendary', description: '传说中的圣剑', lore: '湖中仙女赐予的圣剑，只有被选中的人才能拔起。', stats: { attack: 300, critRate: 25, critDamage: 50 }, dropSource: '限时活动' },
  { id: 'equip_celestial_robe', name: '天衣·星辰', rarity: 'mythic', description: '由星辰之力织就的法袍', lore: '传说中天帝的衣裳，蕴含宇宙之力。', stats: { magicAttack: 400, defense: 200, hp: 1000 }, dropSource: '神话副本' },
]

const MONSTER_ENTRIES: MonsterConfig[] = [
  { id: 'mon_slime_green', name: '绿色史莱姆', rarity: 'common', description: '最弱的怪物', lore: '草原上随处可见的生物，是新手冒险者的第一个对手。', stats: { hp: 100, attack: 10 }, dropSource: '第1章' },
  { id: 'mon_goblin', name: '哥布林', rarity: 'common', description: '矮小的绿皮生物', lore: '喜欢聚集成群的小怪物，虽然单个很弱但数量多。', stats: { hp: 200, attack: 30 }, dropSource: '第2章' },
  { id: 'mon_skeleton', name: '骷髅兵', rarity: 'rare', description: '不死的骷髅战士', lore: '被黑暗魔法复活的古代士兵，不知疲倦地巡逻。', stats: { hp: 400, attack: 60 }, dropSource: '第3章' },
  { id: 'mon_werewolf', name: '狼人', rarity: 'rare', description: '月光下变身的战士', lore: '被诅咒的战士，满月时化为凶猛的狼人。', stats: { hp: 600, attack: 100, speed: 80 }, dropSource: '第5章' },
  { id: 'mon_lich', name: '巫妖', rarity: 'epic', description: '不死的大魔法师', lore: '为追求永生而将灵魂封入法器的疯狂法师。', stats: { hp: 1000, magicAttack: 200 }, dropSource: '第7章' },
  { id: 'mon_demon', name: '深渊恶魔', rarity: 'epic', description: '来自深渊的恶魔', lore: '从裂缝中爬出的深渊生物，充满毁灭之力。', stats: { hp: 1500, attack: 250, defense: 100 }, dropSource: '第8章' },
  { id: 'mon_ancient_dragon', name: '远古巨龙', rarity: 'legendary', description: '沉睡万年的巨龙', lore: '这个世界最古老的生物之一，一个喷嚏就能毁灭城镇。', stats: { hp: 5000, attack: 500, defense: 300 }, dropSource: '第10章' },
  { id: 'mon_void_lord', name: '虚空领主', rarity: 'mythic', description: '虚空的统治者', lore: '存在于维度裂缝中的终极存在，吞噬一切。', stats: { hp: 10000, attack: 800, defense: 500, speed: 200 }, dropSource: '隐藏章节' },
]

// 阶段奖励配置
interface MilestoneConfig {
  id: string; requiredCount: number; reward: CodexReward
}

const HERO_MILESTONES: MilestoneConfig[] = [
  { id: 'hero_m1', requiredCount: 3, reward: { type: 'diamond', amount: 50 } },
  { id: 'hero_m2', requiredCount: 5, reward: { type: 'diamond', amount: 100 } },
  { id: 'hero_m3', requiredCount: 8, reward: { type: 'diamond', amount: 200 } },
  { id: 'hero_m4', requiredCount: 10, reward: { type: 'title', amount: 1, itemId: 'title_hero_collector', itemName: '英雄收藏家' } },
]

const PET_MILESTONES: MilestoneConfig[] = [
  { id: 'pet_m1', requiredCount: 2, reward: { type: 'diamond', amount: 30 } },
  { id: 'pet_m2', requiredCount: 4, reward: { type: 'diamond', amount: 80 } },
  { id: 'pet_m3', requiredCount: 6, reward: { type: 'diamond', amount: 150 } },
  { id: 'pet_m4', requiredCount: 8, reward: { type: 'title', amount: 1, itemId: 'title_pet_master', itemName: '宠物大师' } },
]

const EQUIP_MILESTONES: MilestoneConfig[] = [
  { id: 'equip_m1', requiredCount: 2, reward: { type: 'gold', amount: 5000 } },
  { id: 'equip_m2', requiredCount: 4, reward: { type: 'diamond', amount: 60 } },
  { id: 'equip_m3', requiredCount: 6, reward: { type: 'diamond', amount: 120 } },
  { id: 'equip_m4', requiredCount: 8, reward: { type: 'title', amount: 1, itemId: 'title_equip_hoarder', itemName: '装备收藏家' } },
]

const MONSTER_MILESTONES: MilestoneConfig[] = [
  { id: 'mon_m1', requiredCount: 2, reward: { type: 'exp', amount: 1000 } },
  { id: 'mon_m2', requiredCount: 4, reward: { type: 'gold', amount: 3000 } },
  { id: 'mon_m3', requiredCount: 6, reward: { type: 'diamond', amount: 100 } },
  { id: 'mon_m4', requiredCount: 8, reward: { type: 'title', amount: 1, itemId: 'title_monster_hunter', itemName: '怪物猎人' } },
]

// 全收集奖励配置
const COMPLETION_BONUSES: Record<CodexCategory, { description: string; stats: Record<string, number> }> = {
  hero: { description: '全英雄收集：攻击+10%，生命+5%', stats: { attackPercent: 10, hpPercent: 5 } },
  pet: { description: '全宠物收集：速度+10%，暴击+5%', stats: { speedPercent: 10, critRateFlat: 5 } },
  equipment: { description: '全装备收集：防御+10%，金币+10%', stats: { defensePercent: 10, goldPercent: 10 } },
  monster: { description: '全怪物收集：经验+15%', stats: { expPercent: 15 } },
}

// 全局完成度加成（每10%完成度给予加成）
const GLOBAL_COMPLETION_BONUS_PER_10_PERCENT: Record<string, number> = {
  attackFlat: 5,
  defenseFlat: 3,
  hpFlat: 20,
  speedFlat: 2,
}

// ==================== 核心逻辑 ====================

function createEntry(config: { id: string; name: string; rarity: CodexEntryRarity; description: string; lore: string; stats?: Record<string, number>; dropSource?: string }, category: CodexCategory): CodexEntry {
  return {
    id: config.id,
    name: config.name,
    category,
    rarity: config.rarity,
    description: config.description,
    unlocked: false,
    unlockedAt: null,
    viewCount: 0,
    lore: config.lore,
    stats: config.stats,
    dropSource: config.dropSource,
  }
}

function createCategoryData(
  category: CodexCategory,
  label: string,
  configs: Array<{ id: string; name: string; rarity: CodexEntryRarity; description: string; lore: string; stats?: Record<string, number>; dropSource?: string }>,
  milestones: MilestoneConfig[],
  bonus: { description: string; stats: Record<string, number> }
): CodexCategoryData {
  const entries = new Map<string, CodexEntry>()
  for (const cfg of configs) {
    entries.set(cfg.id, createEntry(cfg, category))
  }
  return {
    category,
    label,
    entries,
    totalCount: configs.length,
    unlockedCount: 0,
    completionBonus: { description: bonus.description, stats: { ...bonus.stats }, claimed: false },
    milestones: milestones.map(m => ({ id: m.id, requiredCount: m.requiredCount, reward: { ...m.reward }, claimed: false })),
  }
}

/** 初始化图鉴系统 */
export function createCodexState(): CodexState {
  const categories = new Map<CodexCategory, CodexCategoryData>()
  categories.set('hero', createCategoryData('hero', '英雄图鉴', HERO_ENTRIES, HERO_MILESTONES, COMPLETION_BONUSES.hero))
  categories.set('pet', createCategoryData('pet', '宠物图鉴', PET_ENTRIES, PET_MILESTONES, COMPLETION_BONUSES.pet))
  categories.set('equipment', createCategoryData('equipment', '装备图鉴', EQUIPMENT_ENTRIES, EQUIP_MILESTONES, COMPLETION_BONUSES.equipment))
  categories.set('monster', createCategoryData('monster', '怪物图鉴', MONSTER_ENTRIES, MONSTER_MILESTONES, COMPLETION_BONUSES.monster))

  let totalEntries = 0
  for (const cat of categories.values()) {
    totalEntries += cat.totalCount
  }

  return {
    categories,
    globalBonus: {},
    totalUnlocked: 0,
    totalEntries,
    lastUpdated: Date.now(),
  }
}

/** 解锁图鉴条目 */
export function unlockEntry(state: CodexState, entryId: string): { success: boolean; entry?: CodexEntry; isNew: boolean; message: string } {
  for (const catData of state.categories.values()) {
    const entry = catData.entries.get(entryId)
    if (entry) {
      if (entry.unlocked) {
        return { success: true, entry, isNew: false, message: `${entry.name} 已解锁` }
      }
      entry.unlocked = true
      entry.unlockedAt = Date.now()
      catData.unlockedCount++
      state.totalUnlocked++
      state.lastUpdated = Date.now()
      recalcGlobalBonus(state)
      return { success: true, entry, isNew: true, message: `🆕 解锁图鉴：${entry.name}` }
    }
  }
  return { success: false, isNew: false, message: `条目 ${entryId} 不存在` }
}

/** 批量解锁 */
export function unlockEntries(state: CodexState, entryIds: string[]): { unlocked: string[]; alreadyUnlocked: string[]; notFound: string[] } {
  const result = { unlocked: [] as string[], alreadyUnlocked: [] as string[], notFound: [] as string[] }
  for (const id of entryIds) {
    const r = unlockEntry(state, id)
    if (!r.success) {
      result.notFound.push(id)
    } else if (!r.isNew) {
      result.alreadyUnlocked.push(id)
    } else {
      result.unlocked.push(id)
    }
  }
  return result
}

/** 查看图鉴条目（增加查看次数） */
export function viewEntry(state: CodexState, entryId: string): CodexEntry | null {
  for (const catData of state.categories.values()) {
    const entry = catData.entries.get(entryId)
    if (entry && entry.unlocked) {
      entry.viewCount++
      return entry
    }
    if (entry && !entry.unlocked) {
      // 未解锁的条目返回基本信息但隐藏详细内容
      return {
        ...entry,
        lore: '???',
        stats: undefined,
        dropSource: '???',
      }
    }
  }
  return null
}

/** 获取分类数据 */
export function getCategoryData(state: CodexState, category: CodexCategory): CodexCategoryData | null {
  return state.categories.get(category) ?? null
}

/** 获取分类完成度（百分比） */
export function getCategoryCompletion(state: CodexState, category: CodexCategory): number {
  const cat = state.categories.get(category)
  if (!cat || cat.totalCount === 0) return 0
  return Math.round((cat.unlockedCount / cat.totalCount) * 100)
}

/** 获取全局完成度（百分比） */
export function getGlobalCompletion(state: CodexState): number {
  if (state.totalEntries === 0) return 0
  return Math.round((state.totalUnlocked / state.totalEntries) * 100)
}

/** 领取阶段奖励 */
export function claimMilestone(state: CodexState, category: CodexCategory, milestoneId: string): { success: boolean; reward?: CodexReward; message: string } {
  const cat = state.categories.get(category)
  if (!cat) return { success: false, message: `分类 ${category} 不存在` }

  const milestone = cat.milestones.find(m => m.id === milestoneId)
  if (!milestone) return { success: false, message: `里程碑 ${milestoneId} 不存在` }
  if (milestone.claimed) return { success: false, message: '奖励已领取' }
  if (cat.unlockedCount < milestone.requiredCount) {
    return { success: false, message: `需要解锁 ${milestone.requiredCount} 个，当前 ${cat.unlockedCount} 个` }
  }

  milestone.claimed = true
  state.lastUpdated = Date.now()
  return { success: true, reward: milestone.reward, message: `领取成功：${milestone.reward.type} x${milestone.reward.amount}` }
}

/** 领取全收集奖励 */
export function claimCompletionBonus(state: CodexState, category: CodexCategory): { success: boolean; bonus?: CodexBonus; message: string } {
  const cat = state.categories.get(category)
  if (!cat) return { success: false, message: `分类 ${category} 不存在` }
  if (cat.completionBonus.claimed) return { success: false, message: '全收集奖励已领取' }
  if (cat.unlockedCount < cat.totalCount) {
    return { success: false, message: `需要全部解锁（${cat.unlockedCount}/${cat.totalCount}）` }
  }

  cat.completionBonus.claimed = true
  state.lastUpdated = Date.now()
  return { success: true, bonus: cat.completionBonus, message: `🎉 全收集完成！${cat.completionBonus.description}` }
}

/** 获取可领取的里程碑 */
export function getClaimableMilestones(state: CodexState, category: CodexCategory): CodexMilestone[] {
  const cat = state.categories.get(category)
  if (!cat) return []
  return cat.milestones.filter(m => !m.claimed && cat.unlockedCount >= m.requiredCount)
}

/** 获取所有可领取奖励（所有分类） */
export function getAllClaimableRewards(state: CodexState): Array<{ category: CodexCategory; type: 'milestone' | 'completion'; id: string }> {
  const results: Array<{ category: CodexCategory; type: 'milestone' | 'completion'; id: string }> = []
  for (const [catKey, catData] of state.categories) {
    for (const m of catData.milestones) {
      if (!m.claimed && catData.unlockedCount >= m.requiredCount) {
        results.push({ category: catKey, type: 'milestone', id: m.id })
      }
    }
    if (!catData.completionBonus.claimed && catData.unlockedCount >= catData.totalCount) {
      results.push({ category: catKey, type: 'completion', id: `${catKey}_completion` })
    }
  }
  return results
}

/** 按稀有度筛选条目 */
export function getEntriesByRarity(state: CodexState, rarity: CodexEntryRarity): CodexEntry[] {
  const results: CodexEntry[] = []
  for (const catData of state.categories.values()) {
    for (const entry of catData.entries.values()) {
      if (entry.rarity === rarity) {
        results.push(entry)
      }
    }
  }
  return results
}

/** 获取已解锁条目 */
export function getUnlockedEntries(state: CodexState, category?: CodexCategory): CodexEntry[] {
  const results: CodexEntry[] = []
  if (category) {
    const cat = state.categories.get(category)
    if (cat) {
      for (const entry of cat.entries.values()) {
        if (entry.unlocked) results.push(entry)
      }
    }
  } else {
    for (const catData of state.categories.values()) {
      for (const entry of catData.entries.values()) {
        if (entry.unlocked) results.push(entry)
      }
    }
  }
  return results
}

/** 获取未解锁条目 */
export function getLockedEntries(state: CodexState, category?: CodexCategory): CodexEntry[] {
  const results: CodexEntry[] = []
  if (category) {
    const cat = state.categories.get(category)
    if (cat) {
      for (const entry of cat.entries.values()) {
        if (!entry.unlocked) results.push(entry)
      }
    }
  } else {
    for (const catData of state.categories.values()) {
      for (const entry of catData.entries.values()) {
        if (!entry.unlocked) results.push(entry)
      }
    }
  }
  return results
}

/** 搜索图鉴 */
export function searchCodex(state: CodexState, keyword: string): CodexEntry[] {
  const lowerKey = keyword.toLowerCase()
  const results: CodexEntry[] = []
  for (const catData of state.categories.values()) {
    for (const entry of catData.entries.values()) {
      if (
        entry.name.toLowerCase().includes(lowerKey) ||
        entry.description.toLowerCase().includes(lowerKey) ||
        entry.id.toLowerCase().includes(lowerKey)
      ) {
        results.push(entry)
      }
    }
  }
  return results
}

/** 获取图鉴摘要 */
export function getCodexSummary(state: CodexState): {
  totalEntries: number
  totalUnlocked: number
  globalCompletion: number
  categories: Array<{ category: CodexCategory; label: string; unlocked: number; total: number; completion: number }>
  globalBonus: Record<string, number>
} {
  const categories: Array<{ category: CodexCategory; label: string; unlocked: number; total: number; completion: number }> = []
  for (const [catKey, catData] of state.categories) {
    categories.push({
      category: catKey,
      label: catData.label,
      unlocked: catData.unlockedCount,
      total: catData.totalCount,
      completion: getCategoryCompletion(state, catKey),
    })
  }
  return {
    totalEntries: state.totalEntries,
    totalUnlocked: state.totalUnlocked,
    globalCompletion: getGlobalCompletion(state),
    categories,
    globalBonus: { ...state.globalBonus },
  }
}

/** 重新计算全局加成 */
function recalcGlobalBonus(state: CodexState): void {
  const completion = getGlobalCompletion(state)
  const tiers = Math.floor(completion / 10)
  const bonus: Record<string, number> = {}
  for (const [stat, value] of Object.entries(GLOBAL_COMPLETION_BONUS_PER_10_PERCENT)) {
    bonus[stat] = value * tiers
  }
  state.globalBonus = bonus
}

/** 获取全局属性加成 */
export function getGlobalBonus(state: CodexState): Record<string, number> {
  return { ...state.globalBonus }
}

/** 获取指定分类的收集加成（仅在全收集且已领取时生效） */
export function getCategoryBonus(state: CodexState, category: CodexCategory): Record<string, number> | null {
  const cat = state.categories.get(category)
  if (!cat || !cat.completionBonus.claimed) return null
  return { ...cat.completionBonus.stats }
}

/** 获取全部生效中的属性加成（全局 + 分类） */
export function getAllActiveBonus(state: CodexState): Record<string, number> {
  const combined: Record<string, number> = { ...state.globalBonus }
  for (const catData of state.categories.values()) {
    if (catData.completionBonus.claimed) {
      for (const [stat, value] of Object.entries(catData.completionBonus.stats)) {
        combined[stat] = (combined[stat] || 0) + value
      }
    }
  }
  return combined
}

/** 导出存档 */
export function exportCodexState(state: CodexState): string {
  const data: Record<string, unknown> = {
    totalUnlocked: state.totalUnlocked,
    totalEntries: state.totalEntries,
    globalBonus: state.globalBonus,
    lastUpdated: state.lastUpdated,
    categories: {} as Record<string, unknown>,
  }
  const cats = data.categories as Record<string, unknown>
  for (const [catKey, catData] of state.categories) {
    const entries: Record<string, { unlocked: boolean; unlockedAt: number | null; viewCount: number }> = {}
    for (const [entryId, entry] of catData.entries) {
      entries[entryId] = { unlocked: entry.unlocked, unlockedAt: entry.unlockedAt, viewCount: entry.viewCount }
    }
    cats[catKey] = {
      unlockedCount: catData.unlockedCount,
      completionBonusClaimed: catData.completionBonus.claimed,
      milestones: catData.milestones.map(m => ({ id: m.id, claimed: m.claimed })),
      entries,
    }
  }
  return JSON.stringify(data)
}

/** 导入存档 */
export function importCodexState(state: CodexState, json: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(json) as Record<string, unknown>
    const cats = data.categories as Record<string, Record<string, unknown>>
    if (!cats) return { success: false, message: '无效存档：缺少 categories' }

    for (const [catKey, catSave] of Object.entries(cats)) {
      const catData = state.categories.get(catKey as CodexCategory)
      if (!catData) continue

      catData.completionBonus.claimed = (catSave.completionBonusClaimed as boolean) || false

      const milestones = catSave.milestones as Array<{ id: string; claimed: boolean }> | undefined
      if (milestones) {
        for (const ms of milestones) {
          const milestone = catData.milestones.find(m => m.id === ms.id)
          if (milestone) milestone.claimed = ms.claimed
        }
      }

      const entries = catSave.entries as Record<string, { unlocked: boolean; unlockedAt: number | null; viewCount: number }> | undefined
      if (entries) {
        let count = 0
        for (const [entryId, entrySave] of Object.entries(entries)) {
          const entry = catData.entries.get(entryId)
          if (entry) {
            entry.unlocked = entrySave.unlocked
            entry.unlockedAt = entrySave.unlockedAt
            entry.viewCount = entrySave.viewCount || 0
            if (entry.unlocked) count++
          }
        }
        catData.unlockedCount = count
      }
    }

    // Recalculate totals
    let totalUnlocked = 0
    for (const catData of state.categories.values()) {
      totalUnlocked += catData.unlockedCount
    }
    state.totalUnlocked = totalUnlocked
    state.lastUpdated = Date.now()
    recalcGlobalBonus(state)

    return { success: true, message: `导入成功：${totalUnlocked}/${state.totalEntries} 已解锁` }
  } catch {
    return { success: false, message: '导入失败：JSON 解析错误' }
  }
}

/** 稀有度显示颜色 */
export function getRarityColor(rarity: CodexEntryRarity): string {
  const colors: Record<CodexEntryRarity, string> = {
    common: '#9e9e9e',
    rare: '#2196f3',
    epic: '#9c27b0',
    legendary: '#ff9800',
    mythic: '#f44336',
  }
  return colors[rarity]
}

/** 稀有度中文名称 */
export function getRarityLabel(rarity: CodexEntryRarity): string {
  const labels: Record<CodexEntryRarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
    mythic: '神话',
  }
  return labels[rarity]
}
