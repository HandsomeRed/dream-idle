// 离线收益系统配置和计算

/**
 * 离线收益配置
 */
export interface OfflineRewardConfig {
  baseGoldPerHour: number;      // 基础金币/小时
  baseExpPerHour: number;       // 基础经验/小时
  maxOfflineHours: number;      // 最大离线时长 (小时)
  bonusRatePerLevel: number;    // 每级加成比例
  vipBonusRate: number;         // VIP 加成比例
}

/**
 * 离线收益结果
 */
export interface OfflineReward {
  gold: number;
  exp: number;
  items?: OfflineItem[];
  offlineHours: number;
  bonusMultiplier: number;
}

/**
 * 离线物品奖励
 */
export interface OfflineItem {
  itemId: string;
  itemName: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/**
 * 默认配置
 */
export const DEFAULT_OFFLINE_CONFIG: OfflineRewardConfig = {
  baseGoldPerHour: 100,
  baseExpPerHour: 50,
  maxOfflineHours: 12,
  bonusRatePerLevel: 0.05,  // 每级 +5%
  vipBonusRate: 0.2         // VIP +20%
}

/**
 * 物品掉落配置
 */
export const ITEM_DROP_RATES: Record<OfflineItem['rarity'], number> = {
  common: 0.5,      // 50% 掉落率
  uncommon: 0.3,    // 30%
  rare: 0.15,       // 15%
  epic: 0.04,       // 4%
  legendary: 0.01   // 1%
}

/**
 * 物品池配置
 */
export const ITEM_POOLS: Record<OfflineItem['rarity'], { itemId: string; itemName: string }[]> = {
  common: [
    { itemId: 'potion_small', itemName: '小还丹' },
    { itemId: 'mp_potion_small', itemName: '小蓝药' }
  ],
  uncommon: [
    { itemId: 'potion_medium', itemName: '中还丹' },
    { itemId: 'mp_potion_medium', itemName: '中蓝药' }
  ],
  rare: [
    { itemId: 'potion_large', itemName: '大还丹' },
    { itemId: 'strength_tome', itemName: '力量秘籍' }
  ],
  epic: [
    { itemId: 'wisdom_tome', itemName: '智慧秘籍' },
    { itemId: 'speed_tome', itemName: '敏捷秘籍' }
  ],
  legendary: [
    { itemId: 'god_tome', itemName: '神级秘籍' },
    { itemId: 'phoenix_feather', itemName: '凤凰羽毛' }
  ]
}

/**
 * 计算离线收益
 * @param playerLevel 玩家等级
 * @param offlineMinutes 离线分钟数
 * @param isVip 是否 VIP
 * @param config 配置参数
 */
export function calculateOfflineReward(
  playerLevel: number,
  offlineMinutes: number,
  isVip: boolean = false,
  config: OfflineRewardConfig = DEFAULT_OFFLINE_CONFIG
): OfflineReward {
  // 计算有效离线时长 (不超过最大值)
  const totalHours = offlineMinutes / 60
  const effectiveHours = Math.min(totalHours, config.maxOfflineHours)
  
  // 计算等级加成
  const levelBonus = 1 + (playerLevel - 1) * config.bonusRatePerLevel
  
  // 计算 VIP 加成
  const vipBonus = isVip ? (1 + config.vipBonusRate) : 1
  
  // 总加成倍率
  const totalMultiplier = levelBonus * vipBonus
  
  // 计算基础收益
  const baseGold = config.baseGoldPerHour * effectiveHours
  const baseExp = config.baseExpPerHour * effectiveHours
  
  // 应用加成
  const finalGold = Math.floor(baseGold * totalMultiplier)
  const finalExp = Math.floor(baseExp * totalMultiplier)
  
  // 计算物品掉落 (每 2 小时有几率获得物品)
  const items = calculateItemDrops(effectiveHours, playerLevel)
  
  return {
    gold: finalGold,
    exp: finalExp,
    items: items.length > 0 ? items : undefined,
    offlineHours: effectiveHours,
    bonusMultiplier: totalMultiplier
  }
}

/**
 * 计算物品掉落
 */
function calculateItemDrops(hours: number, playerLevel: number): OfflineItem[] {
  const items: OfflineItem[] = []
  
  // 每 2 小时有 1 次掉落机会
  const dropChances = Math.floor(hours / 2)
  
  for (let i = 0; i < dropChances; i++) {
    // 随机决定是否有掉落
    if (Math.random() > 0.7) continue // 30% 基础掉落率
    
    // 根据等级调整稀有度权重
    const rarity = rollRarity(playerLevel)
    
    // 从对应稀有度池中随机选择物品
    const pool = ITEM_POOLS[rarity]
    const itemTemplate = pool[Math.floor(Math.random() * pool.length)]
    
    // 随机数量 (1-3)
    const quantity = Math.floor(Math.random() * 3) + 1
    
    items.push({
      ...itemTemplate,
      quantity,
      rarity
    })
  }
  
  return items
}

/**
 * 随机稀有度 (根据等级调整权重)
 */
function rollRarity(playerLevel: number): OfflineItem['rarity'] {
  const roll = Math.random()
  
  // 高等级玩家有更高几率获得稀有物品
  const levelFactor = Math.min(playerLevel / 50, 0.5) // 最高 +50% 稀有度提升
  
  // 调整后的阈值
  const thresholds = {
    legendary: 0.01 + levelFactor * 0.01,
    epic: 0.05 + levelFactor * 0.03,
    rare: 0.20 + levelFactor * 0.10,
    uncommon: 0.50 + levelFactor * 0.10,
    common: 1.0
  }
  
  if (roll < thresholds.legendary) return 'legendary'
  if (roll < thresholds.epic) return 'epic'
  if (roll < thresholds.rare) return 'rare'
  if (roll < thresholds.uncommon) return 'uncommon'
  return 'common'
}

/**
 * 格式化离线收益显示
 */
export function formatOfflineReward(reward: OfflineReward): string {
  let text = `离线 ${reward.offlineHours.toFixed(1)} 小时\n`
  text += `💰 金币：${reward.gold.toLocaleString()}\n`
  text += `⭐ 经验：${reward.exp.toLocaleString()}\n`
  text += `✨ 加成：x${reward.bonusMultiplier.toFixed(2)}`
  
  if (reward.items && reward.items.length > 0) {
    text += `\n🎁 物品：${reward.items.map(i => `${i.itemName} x${i.quantity}`).join(', ')}`
  }
  
  return text
}

/**
 * 获取物品稀有度颜色
 */
export function getRarityColor(rarity: OfflineItem['rarity']): string {
  const colors: Record<OfflineItem['rarity'], string> = {
    common: '#9d9d9d',
    uncommon: '#5cdb5c',
    rare: '#5c9cdb',
    epic: '#db5cdb',
    legendary: '#db9c5c'
  }
  return colors[rarity]
}

/**
 * 获取物品稀有度图标
 */
export function getRarityIcon(rarity: OfflineItem['rarity']): string {
  const icons: Record<OfflineItem['rarity'], string> = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟠'
  }
  return icons[rarity]
}

/**
 * 计算领取离线收益的最大时间
 */
export function getMaxOfflineTime(lastLoginTime: number): number {
  const now = Date.now()
  const offlineMinutes = (now - lastLoginTime) / 1000 / 60
  return Math.floor(offlineMinutes)
}

/**
 * 检查是否可以领取离线收益
 */
export function canClaimOfflineReward(lastLoginTime: number, minOfflineMinutes: number = 5): boolean {
  const offlineMinutes = getMaxOfflineTime(lastLoginTime)
  return offlineMinutes >= minOfflineMinutes
}
