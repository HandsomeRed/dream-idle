/**
 * Shop System Tests - v0.31
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  CurrencyType,
  ItemType,
  RefreshType,
  ShopCategory,
  ShopState,
  SHOP_ITEMS,
  INITIAL_CURRENCIES,
  initializeShopState,
  getPurchaseLimitRemaining,
  canPurchase,
  purchaseItem,
  purchaseMultiple,
  refreshDailyLimits,
  addCurrency,
  removeCurrency,
  getItemsByCategory,
  getLimitedItems,
  getDiscountedItems,
  getItemById,
  calculateTotalSpent,
  getPurchaseCount,
} from './shop';

describe('Shop System - v0.31', () => {
  
  // ==================== 商城数据测试 ====================
  
  describe('Shop Data', () => {
    it('should have all shop items defined', () => {
      expect(SHOP_ITEMS.length).toBeGreaterThan(0);
    });

    it('should have unique item IDs', () => {
      const ids = SHOP_ITEMS.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have initial currencies', () => {
      expect(INITIAL_CURRENCIES.gold).toBeGreaterThan(0);
      expect(INITIAL_CURRENCIES.diamond).toBeGreaterThan(0);
    });
  });

  // ==================== 初始化测试 ====================
  
  describe('Initialization', () => {
    it('should initialize shop state correctly', () => {
      const state = initializeShopState();
      
      expect(state.currencies.gold).toBe(INITIAL_CURRENCIES.gold);
      expect(state.currencies.diamond).toBe(INITIAL_CURRENCIES.diamond);
      expect(state.purchases).toEqual({});
      expect(state.lastRefresh).toBeDefined();
    });
  });

  // ==================== 限购查询测试 ====================
  
  describe('Purchase Limit Query', () => {
    let state: ShopState;

    beforeEach(() => {
      state = initializeShopState();
    });

    it('should return -1 for unlimited items', () => {
      const unlimitedItem = SHOP_ITEMS.find(item => !item.limit || item.limit === -1);
      
      if (unlimitedItem) {
        expect(getPurchaseLimitRemaining(state, unlimitedItem)).toBe(-1);
      }
    });

    it('should return full limit for new purchases', () => {
      const limitedItem = SHOP_ITEMS.find(item => item.limit && item.limit > 0)!;
      expect(getPurchaseLimitRemaining(state, limitedItem)).toBe(limitedItem.limit);
    });

    it('should return remaining after purchase', () => {
      const item = SHOP_ITEMS.find(i => i.limit && i.limit > 10)!;
      purchaseItem(state, item, 5);
      
      const remaining = getPurchaseLimitRemaining(state, item);
      expect(remaining).toBe(item.limit! - 5);
    });
  });

  // ==================== 购买条件检查测试 ====================
  
  describe('Purchase Condition Check', () => {
    let state: ShopState;

    beforeEach(() => {
      state = initializeShopState();
    });

    it('should allow purchase with sufficient currency', () => {
      const item = SHOP_ITEMS.find(i => i.currency === CurrencyType.Gold && i.price < 1000)!;
      const result = canPurchase(state, item);
      
      expect(result.can).toBe(true);
    });

    it('should deny purchase with insufficient currency', () => {
      state.currencies.gold = 0;
      state.currencies.diamond = 0;
      
      const item = SHOP_ITEMS.find(i => i.currency === CurrencyType.Gold)!;
      const result = canPurchase(state, item);
      
      expect(result.can).toBe(false);
      expect(result.reason).toContain('金币不足');
    });

    it('should deny purchase when limit reached', () => {
      const item = SHOP_ITEMS.find(i => i.limit && i.limit === 1)!;
      
      // 购买到限购
      purchaseItem(state, item, 1);
      
      const result = canPurchase(state, item);
      expect(result.can).toBe(false);
      expect(result.reason).toContain('限购');
    });
  });

  // ==================== 购买流程测试 ====================
  
  describe('Purchase Flow', () => {
    let state: ShopState;

    beforeEach(() => {
      state = initializeShopState();
    });

    it('should purchase successfully', () => {
      const item = SHOP_ITEMS.find(i => i.currency === CurrencyType.Gold && i.price < 1000)!;
      const initialGold = state.currencies.gold;
      
      const result = purchaseItem(state, item);
      
      expect(result.success).toBe(true);
      expect(state.currencies.gold).toBe(initialGold - item.price);
      expect(result.item).toBe(item);
    });

    it('should deduct correct currency', () => {
      const goldItem = SHOP_ITEMS.find(i => i.currency === CurrencyType.Gold)!;
      const diamondItem = SHOP_ITEMS.find(i => i.currency === CurrencyType.Diamond)!;
      
      const initialGold = state.currencies.gold;
      const initialDiamond = state.currencies.diamond;
      
      purchaseItem(state, goldItem);
      purchaseItem(state, diamondItem);
      
      expect(state.currencies.gold).toBe(initialGold - goldItem.price);
      expect(state.currencies.diamond).toBe(initialDiamond - diamondItem.price);
    });

    it('should update purchase record', () => {
      const item = SHOP_ITEMS.find(i => i.limit && i.limit > 5)!;
      
      purchaseItem(state, item, 2);
      purchaseItem(state, item, 3);
      
      const count = getPurchaseCount(state, item.id);
      expect(count).toBe(5);
    });

    it('should fail purchase with insufficient currency', () => {
      state.currencies.gold = 0;
      
      const item = SHOP_ITEMS.find(i => i.currency === CurrencyType.Gold)!;
      const result = purchaseItem(state, item);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('不足');
    });

    it('should fail purchase when limit reached', () => {
      const item = SHOP_ITEMS.find(i => i.limit && i.limit === 1)!;
      
      purchaseItem(state, item, 1);
      const result = purchaseItem(state, item, 1);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('限购');
    });
  });

  // ==================== 批量购买测试 ====================
  
  describe('Multiple Purchase', () => {
    let state: ShopState;

    beforeEach(() => {
      state = initializeShopState();
    });

    it('should purchase multiple items', () => {
      const item = SHOP_ITEMS.find(i => i.limit && i.limit >= 10 && i.currency === CurrencyType.Gold)!;
      const initialGold = state.currencies.gold;
      
      const result = purchaseMultiple(state, item.id, 5);
      
      expect(result.success).toBe(true);
      expect(state.currencies.gold).toBe(initialGold - item.price * 5);
      expect(getPurchaseCount(state, item.id)).toBe(5);
    });

    it('should fail for non-existent item', () => {
      const result = purchaseMultiple(state, 'non_existent_item', 1);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });
  });

  // ==================== 货币管理测试 ====================
  
  describe('Currency Management', () => {
    let state: ShopState;

    beforeEach(() => {
      state = initializeShopState();
    });

    it('should add currency', () => {
      const initialGold = state.currencies.gold;
      addCurrency(state, CurrencyType.Gold, 1000);
      
      expect(state.currencies.gold).toBe(initialGold + 1000);
    });

    it('should remove currency', () => {
      const initialGold = state.currencies.gold;
      const success = removeCurrency(state, CurrencyType.Gold, 500);
      
      expect(success).toBe(true);
      expect(state.currencies.gold).toBe(initialGold - 500);
    });

    it('should fail to remove insufficient currency', () => {
      state.currencies.gold = 100;
      const success = removeCurrency(state, CurrencyType.Gold, 500);
      
      expect(success).toBe(false);
      expect(state.currencies.gold).toBe(100);  // Unchanged
    });
  });

  // ==================== 商品查询测试 ====================
  
  describe('Item Query', () => {
    it('should get items by category', () => {
      const recommended = getItemsByCategory(ShopCategory.Recommended);
      expect(recommended.length).toBeGreaterThan(0);
      
      const consumable = getItemsByCategory(ShopCategory.Consumable);
      expect(consumable.length).toBeGreaterThan(0);
      
      const pet = getItemsByCategory(ShopCategory.Pet);
      expect(pet.length).toBeGreaterThan(0);
    });

    it('should get limited items', () => {
      const limited = getLimitedItems();
      expect(limited.length).toBeGreaterThan(0);
      
      limited.forEach(item => {
        expect(item.limit).toBeDefined();
        expect(item.limit!).toBeGreaterThan(0);
      });
    });

    it('should get discounted items', () => {
      const discounted = getDiscountedItems();
      
      discounted.forEach(item => {
        expect(item.discount).toBeDefined();
        expect(item.discount!).toBeGreaterThan(0);
      });
    });

    it('should get item by ID', () => {
      const item = getItemById(SHOP_ITEMS[0].id);
      
      expect(item).toBeDefined();
      expect(item?.id).toBe(SHOP_ITEMS[0].id);
    });

    it('should return undefined for non-existent item', () => {
      const item = getItemById('non_existent');
      expect(item).toBeUndefined();
    });
  });

  // ==================== 统计测试 ====================
  
  describe('Statistics', () => {
    let state: ShopState;

    beforeEach(() => {
      state = initializeShopState();
    });

    it('should calculate total spent', () => {
      const item = SHOP_ITEMS.find(i => i.currency === CurrencyType.Gold)!;
      purchaseItem(state, item, 2);
      
      const total = calculateTotalSpent(state);
      expect(total.gold).toBe(item.price * 2);
    });

    it('should get purchase count', () => {
      const item = SHOP_ITEMS.find(i => i.limit && i.limit >= 5)!;
      
      expect(getPurchaseCount(state, item.id)).toBe(0);
      
      purchaseItem(state, item, 3);
      expect(getPurchaseCount(state, item.id)).toBe(3);
    });
  });

  // ==================== 集成测试 ====================
  
  describe('Integration Tests', () => {
    it('should complete full purchase cycle', () => {
      const state = initializeShopState();
      
      // 购买多个商品
      const goldItem = SHOP_ITEMS.find(i => i.currency === CurrencyType.Gold && i.limit && i.limit >= 5)!;
      const diamondItem = SHOP_ITEMS.find(i => i.currency === CurrencyType.Diamond && i.limit && i.limit >= 3)!;
      
      purchaseItem(state, goldItem, 2);
      purchaseItem(state, diamondItem, 1);
      
      // 检查货币
      expect(state.currencies.gold).toBe(INITIAL_CURRENCIES.gold - goldItem.price * 2);
      expect(state.currencies.diamond).toBe(INITIAL_CURRENCIES.diamond - diamondItem.price);
      
      // 检查购买记录
      expect(getPurchaseCount(state, goldItem.id)).toBe(2);
      expect(getPurchaseCount(state, diamondItem.id)).toBe(1);
      
      // 检查限购剩余
      const goldRemaining = getPurchaseLimitRemaining(state, goldItem);
      expect(goldRemaining).toBe(goldItem.limit! - 2);
      
      // 统计
      const total = calculateTotalSpent(state);
      expect(total.gold).toBe(goldItem.price * 2);
      expect(total.diamond).toBe(diamondItem.price);
    });

    it('should handle multiple purchases until limit', () => {
      const state = initializeShopState();
      // 找一个限购数量小的商品
      const item = SHOP_ITEMS.find(i => i.limit && i.limit > 0 && i.limit <= 5 && i.currency === CurrencyType.Gold)!;
      
      if (!item) {
        // 如果没有找到，跳过这个测试
        return;
      }
      
      const limit = item.limit!;
      
      // 购买到限购
      let successCount = 0;
      for (let i = 0; i < limit + 2; i++) {
        const result = purchaseItem(state, item);
        if (result.success) successCount++;
      }
      
      expect(successCount).toBe(limit);  // 只能成功 limit 次
      
      // 额外购买应该失败
      const result = purchaseItem(state, item);
      expect(result.success).toBe(false);
    });
  });
});
