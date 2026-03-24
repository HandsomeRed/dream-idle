/**
 * Shop System - v0.31
 * 商城系统：商品购买、货币管理、限购系统
 */

// ==================== 枚举和类型定义 ====================

/**
 * 货币类型
 */
export enum CurrencyType {
  Gold = 'gold',       // 金币
  Diamond = 'diamond', // 钻石
}

/**
 * 商品类型
 */
export enum ItemType {
  Consumable = 'consumable',   // 消耗品
  Material = 'material',       // 材料
  Equipment = 'equipment',     // 装备
  PetFragment = 'pet_fragment', // 宠物碎片
  Stamina = 'stamina',         // 体力
}

/**
 * 商品定义
 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  currency: CurrencyType;
  price: number;
  originalPrice?: number;  // 原价（用于折扣显示）
  limit?: number;          // 限购数量（-1 为无限）
  refreshType?: RefreshType; // 刷新类型
  itemId?: string;         // 物品 ID
  amount: number;          // 购买数量
  discount?: number;       // 折扣（0-100，50 表示 5 折）
  tags?: string[];         // 标签（推荐/热门/新品）
}

/**
 * 刷新类型
 */
export enum RefreshType {
  None = 'none',       // 不刷新
  Daily = 'daily',     // 每日刷新
  Weekly = 'weekly',   // 每周刷新
  Monthly = 'monthly', // 每月刷新
}

/**
 * 商城分类
 */
export enum ShopCategory {
  Recommended = 'recommended', // 推荐
  Consumable = 'consumable',   // 消耗品
  Material = 'material',       // 材料
  Pet = 'pet',                 // 宠物
  Limited = 'limited',         // 限购
}

/**
 * 玩家货币状态
 */
export interface CurrencyState {
  gold: number;
  diamond: number;
}

/**
 * 玩家购买记录
 */
export interface PurchaseRecord {
  itemId: string;
  count: number;
  lastPurchaseTime?: number;
  resetTime?: number;  // 限购重置时间
}

/**
 * 商城状态
 */
export interface ShopState {
  currencies: CurrencyState;
  purchases: Record<string, PurchaseRecord>;  // key: itemId
  lastRefresh?: number;
}

/**
 * 购买结果
 */
export interface PurchaseResult {
  success: boolean;
  item?: ShopItem;
  message: string;
  remaining?: number;  // 限购剩余
}

// ==================== 常量配置 ====================

/**
 * 商城商品列表
 */
export const SHOP_ITEMS: ShopItem[] = [
  // ==================== 推荐商品 ====================
  {
    id: 'rec_stamina_small',
    name: '体力药水（小）',
    description: '恢复 30 点体力',
    type: ItemType.Stamina,
    currency: CurrencyType.Gold,
    price: 500,
    amount: 30,
    tags: ['推荐', '热门'],
    limit: 10,
    refreshType: RefreshType.Daily,
  },
  {
    id: 'rec_stamina_large',
    name: '体力药水（大）',
    description: '恢复 100 点体力',
    type: ItemType.Stamina,
    currency: CurrencyType.Diamond,
    price: 50,
    amount: 100,
    tags: ['推荐'],
    limit: 5,
    refreshType: RefreshType.Daily,
  },
  
  // ==================== 消耗品 ====================
  {
    id: 'consumable_enhance_stone',
    name: '强化石',
    description: '装备强化材料',
    type: ItemType.Consumable,
    currency: CurrencyType.Gold,
    price: 1000,
    amount: 10,
    limit: 50,
    refreshType: RefreshType.Daily,
  },
  {
    id: 'consumable_refine_stone',
    name: '精炼石',
    description: '装备精炼材料',
    type: ItemType.Consumable,
    currency: CurrencyType.Gold,
    price: 500,
    amount: 5,
    limit: 100,
    refreshType: RefreshType.Daily,
  },
  {
    id: 'consumable_gem_common',
    name: '普通宝石箱',
    description: '随机获得一个普通品质宝石',
    type: ItemType.Consumable,
    currency: CurrencyType.Gold,
    price: 2000,
    amount: 1,
    limit: 20,
    refreshType: RefreshType.Daily,
  },
  {
    id: 'consumable_gem_rare',
    name: '稀有宝石箱',
    description: '随机获得一个稀有品质宝石',
    type: ItemType.Consumable,
    currency: CurrencyType.Diamond,
    price: 100,
    amount: 1,
    limit: 10,
    refreshType: RefreshType.Daily,
  },
  
  // ==================== 材料 ====================
  {
    id: 'material_exp_book_small',
    name: '经验书（小）',
    description: '获得 500 点角色经验',
    type: ItemType.Material,
    currency: CurrencyType.Gold,
    price: 1000,
    amount: 1,
    limit: 50,
    refreshType: RefreshType.Daily,
  },
  {
    id: 'material_exp_book_large',
    name: '经验书（大）',
    description: '获得 5000 点角色经验',
    type: ItemType.Material,
    currency: CurrencyType.Diamond,
    price: 100,
    amount: 1,
    limit: 20,
    refreshType: RefreshType.Daily,
  },
  {
    id: 'material_gold_bag',
    name: '金币袋',
    description: '获得 5000 金币',
    type: ItemType.Material,
    currency: CurrencyType.Diamond,
    price: 200,
    amount: 5000,
    limit: 30,
    refreshType: RefreshType.Daily,
  },
  
  // ==================== 宠物碎片 ====================
  {
    id: 'pet_fragment_common',
    name: '普通宠物碎片',
    description: '10 个碎片可合成一只随机普通宠物',
    type: ItemType.PetFragment,
    currency: CurrencyType.Gold,
    price: 5000,
    amount: 10,
    limit: 20,
    refreshType: RefreshType.Weekly,
  },
  {
    id: 'pet_fragment_rare',
    name: '稀有宠物碎片',
    description: '10 个碎片可合成一只随机稀有宠物',
    type: ItemType.PetFragment,
    currency: CurrencyType.Diamond,
    price: 300,
    amount: 10,
    limit: 10,
    refreshType: RefreshType.Weekly,
  },
  {
    id: 'pet_fragment_epic',
    name: '史诗宠物碎片',
    description: '10 个碎片可合成一只随机史诗宠物',
    type: ItemType.PetFragment,
    currency: CurrencyType.Diamond,
    price: 800,
    amount: 10,
    limit: 5,
    refreshType: RefreshType.Weekly,
  },
  {
    id: 'pet_fragment_legendary',
    name: '传说宠物碎片',
    description: '10 个碎片可合成一只随机传说宠物',
    type: ItemType.PetFragment,
    currency: CurrencyType.Diamond,
    price: 2000,
    amount: 10,
    limit: 2,
    refreshType: RefreshType.Monthly,
  },
  
  // ==================== 限时特惠 ====================
  {
    id: 'limited_starter_pack',
    name: '新手礼包',
    description: '包含：体力药水×5、强化石×20、金币×10000',
    type: ItemType.Material,
    currency: CurrencyType.Diamond,
    price: 500,
    originalPrice: 1000,
    discount: 50,
    amount: 1,
    limit: 1,
    refreshType: RefreshType.None,  // 永久限购 1 次
    tags: ['限时', '超值'],
  },
  {
    id: 'limited_weekly_pack',
    name: '每周特惠',
    description: '包含：体力药水×10、精炼石×50、钻石×100',
    type: ItemType.Material,
    currency: CurrencyType.Diamond,
    price: 300,
    originalPrice: 600,
    discount: 50,
    amount: 1,
    limit: 1,
    refreshType: RefreshType.Weekly,
    tags: ['限时'],
  },
];

/**
 * 初始货币
 */
export const INITIAL_CURRENCIES: CurrencyState = {
  gold: 10000,
  diamond: 1000,
};

// ==================== 商城状态管理 ====================

/**
 * 初始化商城状态
 */
export function initializeShopState(): ShopState {
  return {
    currencies: { ...INITIAL_CURRENCIES },
    purchases: {},
    lastRefresh: Date.now(),
  };
}

/**
 * 获取商品限购剩余
 */
export function getPurchaseLimitRemaining(
  state: ShopState,
  item: ShopItem
): number {
  if (!item.limit || item.limit === -1) {
    return -1;  // 无限购
  }
  
  const record = state.purchases[item.id];
  if (!record) {
    return item.limit;
  }
  
  // 检查是否需要重置
  if (record.resetTime && Date.now() >= record.resetTime) {
    return item.limit;
  }
  
  return item.limit - record.count;
}

/**
 * 检查是否可以购买
 */
export function canPurchase(
  state: ShopState,
  item: ShopItem,
  quantity: number = 1
): { can: boolean; reason?: string } {
  // 检查货币
  const currentCurrency = state.currencies[item.currency];
  const totalCost = item.price * quantity;
  
  if (currentCurrency < totalCost) {
    return {
      can: false,
      reason: `${item.currency === CurrencyType.Gold ? '金币' : '钻石'}不足`,
    };
  }
  
  // 检查限购
  const remaining = getPurchaseLimitRemaining(state, item);
  if (remaining !== -1 && remaining < quantity) {
    return {
      can: false,
      reason: `限购${item.limit}个，剩余${remaining}个`,
    };
  }
  
  return { can: true };
}

/**
 * 购买商品
 */
export function purchaseItem(
  state: ShopState,
  item: ShopItem,
  quantity: number = 1
): PurchaseResult {
  // 检查购买条件
  const { can, reason } = canPurchase(state, item, quantity);
  if (!can) {
    return {
      success: false,
      message: reason || '无法购买',
    };
  }
  
  // 扣除货币
  const totalCost = item.price * quantity;
  state.currencies[item.currency] -= totalCost;
  
  // 更新购买记录
  if (!state.purchases[item.id]) {
    state.purchases[item.id] = {
      itemId: item.id,
      count: 0,
    };
  }
  
  const record = state.purchases[item.id];
  record.count += quantity;
  
  // 计算重置时间
  if (item.refreshType && item.refreshType !== RefreshType.None) {
    const now = Date.now();
    let resetTime: number;
    
    switch (item.refreshType) {
      case RefreshType.Daily:
        // 次日凌晨 5 点
        resetTime = new Date(now + 86400000).setHours(5, 0, 0, 0);
        break;
      case RefreshType.Weekly:
        // 下周一凌晨 5 点
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (8 - nextWeek.getDay()) % 7);
        resetTime = nextWeek.setHours(5, 0, 0, 0);
        break;
      case RefreshType.Monthly:
        // 下月 1 号凌晨 5 点
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        resetTime = nextMonth.setHours(5, 0, 0, 0);
        break;
      default:
        resetTime = 0;
    }
    
    record.resetTime = resetTime;
  }
  
  // 计算剩余限购
  const remaining = getPurchaseLimitRemaining(state, item);
  
  return {
    success: true,
    item,
    message: `购买成功！获得 ${item.name} ×${quantity}`,
    remaining,
  };
}

/**
 * 批量购买
 */
export function purchaseMultiple(
  state: ShopState,
  itemId: string,
  quantity: number = 1
): PurchaseResult {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  
  if (!item) {
    return {
      success: false,
      message: '商品不存在',
    };
  }
  
  return purchaseItem(state, item, quantity);
}

/**
 * 刷新商城限购（每日凌晨 5 点）
 */
export function refreshDailyLimits(state: ShopState): void {
  const now = Date.now();
  
  Object.keys(state.purchases).forEach(itemId => {
    const record = state.purchases[itemId];
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    
    if (!item || item.refreshType !== RefreshType.Daily) {
      return;
    }
    
    if (record.resetTime && now >= record.resetTime) {
      record.count = 0;
      
      // 重新计算下次重置时间
      const nextReset = new Date(now + 86400000).setHours(5, 0, 0, 0);
      record.resetTime = nextReset;
    }
  });
  
  state.lastRefresh = now;
}

/**
 * 添加货币
 */
export function addCurrency(
  state: ShopState,
  type: CurrencyType,
  amount: number
): void {
  state.currencies[type] += amount;
}

/**
 * 扣除货币
 */
export function removeCurrency(
  state: ShopState,
  type: CurrencyType,
  amount: number
): boolean {
  if (state.currencies[type] < amount) {
    return false;
  }
  state.currencies[type] -= amount;
  return true;
}

// ==================== 商品查询 ====================

/**
 * 按分类获取商品
 */
export function getItemsByCategory(category: ShopCategory): ShopItem[] {
  switch (category) {
    case ShopCategory.Recommended:
      return SHOP_ITEMS.filter(item => item.tags?.includes('推荐'));
    case ShopCategory.Consumable:
      return SHOP_ITEMS.filter(item => item.type === ItemType.Consumable);
    case ShopCategory.Material:
      return SHOP_ITEMS.filter(item => item.type === ItemType.Material);
    case ShopCategory.Pet:
      return SHOP_ITEMS.filter(item => item.type === ItemType.PetFragment);
    case ShopCategory.Limited:
      return SHOP_ITEMS.filter(item => item.limit && item.limit > 0);
    default:
      return SHOP_ITEMS;
  }
}

/**
 * 获取所有限购商品
 */
export function getLimitedItems(): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.limit && item.limit > 0);
}

/**
 * 获取打折商品
 */
export function getDiscountedItems(): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.discount && item.discount > 0);
}

/**
 * 获取商品详情
 */
export function getItemById(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.id === itemId);
}

// ==================== 统计 ====================

/**
 * 计算总消费
 */
export function calculateTotalSpent(state: ShopState): { gold: number; diamond: number } {
  let goldSpent = 0;
  let diamondSpent = 0;
  
  Object.values(state.purchases).forEach(record => {
    const item = SHOP_ITEMS.find(i => i.id === record.itemId);
    if (!item) return;
    
    if (item.currency === CurrencyType.Gold) {
      goldSpent += item.price * record.count;
    } else {
      diamondSpent += item.price * record.count;
    }
  });
  
  return { gold: goldSpent, diamond: diamondSpent };
}

/**
 * 获取购买次数
 */
export function getPurchaseCount(state: ShopState, itemId: string): number {
  return state.purchases[itemId]?.count || 0;
}
