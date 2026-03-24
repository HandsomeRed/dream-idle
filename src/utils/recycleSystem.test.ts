// 资源回收系统测试 - v0.68

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  MATERIALS,
  RECIPES,
  RARITY_ORDER,
  RARITY_GOLD,
  RECYCLE_SHOP,
  createRecycleState,
  calculateRecycleResult,
  recycleItem,
  recycleBatch,
  getAutoRecyclable,
  updateAutoRecycleRule,
  canCraft,
  craftItem,
  getMaterialCount,
  getOwnedMaterials,
  getCraftableRecipes,
  getRecycleStats,
  buyWithRecycleCurrency,
  exportRecycleData,
  importRecycleData,
  type RecycleState,
  type RecyclableItem,
} from './recycleSystem';

function createItem(overrides: Partial<RecyclableItem> & { id: string }): RecyclableItem {
  return {
    name: 'Test Item',
    type: 'equipment',
    rarity: 'common',
    level: 1,
    locked: false,
    ...overrides,
  };
}

describe('资源回收系统 v0.68', () => {
  let state: RecycleState;

  beforeEach(() => {
    state = createRecycleState('player_001');
  });

  // ==================== 初始化 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.totalRecycled).toBe(0);
      expect(state.recycleCurrency).toBe(0);
      expect(Object.keys(state.materials)).toHaveLength(0);
    });

    it('应有默认自动回收规则', () => {
      expect(state.autoRecycleRules.length).toBeGreaterThan(0);
      state.autoRecycleRules.forEach(r => expect(r.enabled).toBe(false));
    });
  });

  // ==================== 材料配置 ====================
  describe('材料配置', () => {
    it('应包含所有材料', () => {
      expect(Object.keys(MATERIALS).length).toBeGreaterThanOrEqual(6);
    });

    it('每个材料应有完整属性', () => {
      Object.values(MATERIALS).forEach(m => {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('rarity');
        expect(m).toHaveProperty('icon');
      });
    });
  });

  // ==================== 回收计算 ====================
  describe('回收计算', () => {
    it('普通物品应返回基础材料', () => {
      const item = createItem({ id: 'i1', rarity: 'common' });
      const result = calculateRecycleResult(item);
      expect(result.gold).toBeGreaterThan(0);
      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.specialCurrency).toBe(1);
    });

    it('高品质物品应返回更多', () => {
      const common = calculateRecycleResult(createItem({ id: 'i1', rarity: 'common' }));
      const epic = calculateRecycleResult(createItem({ id: 'i2', rarity: 'epic' }));
      expect(epic.gold).toBeGreaterThan(common.gold);
      expect(epic.specialCurrency).toBeGreaterThan(common.specialCurrency);
    });

    it('高等级物品应返回更多金币', () => {
      const low = calculateRecycleResult(createItem({ id: 'i1', level: 1 }));
      const high = calculateRecycleResult(createItem({ id: 'i2', level: 50 }));
      expect(high.gold).toBeGreaterThan(low.gold);
    });

    it('宠物应额外返还宠物碎片', () => {
      const item = createItem({ id: 'p1', type: 'pet', level: 20 });
      const result = calculateRecycleResult(item);
      expect(result.materials.some(m => m.materialId === 'pet_fragment')).toBe(true);
    });

    it('英雄应额外返还英雄精华', () => {
      const item = createItem({ id: 'h1', type: 'hero', level: 30 });
      const result = calculateRecycleResult(item);
      expect(result.materials.some(m => m.materialId === 'hero_essence')).toBe(true);
    });
  });

  // ==================== 回收执行 ====================
  describe('回收执行', () => {
    it('应成功回收未锁定物品', () => {
      const item = createItem({ id: 'i1' });
      const result = recycleItem(state, item);
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.state.totalRecycled).toBe(1);
    });

    it('锁定物品应无法回收', () => {
      const item = createItem({ id: 'i1', locked: true });
      const result = recycleItem(state, item);
      expect(result.success).toBe(false);
      expect(result.error).toContain('锁定');
    });

    it('回收应增加材料', () => {
      const item = createItem({ id: 'i1', rarity: 'common' });
      const result = recycleItem(state, item);
      expect(Object.keys(result.state.materials).length).toBeGreaterThan(0);
    });

    it('回收应增加回收币', () => {
      const item = createItem({ id: 'i1' });
      const result = recycleItem(state, item);
      expect(result.state.recycleCurrency).toBeGreaterThan(0);
    });

    it('回收应累计金币统计', () => {
      const item = createItem({ id: 'i1' });
      const result = recycleItem(state, item);
      expect(result.state.totalGoldEarned).toBeGreaterThan(0);
    });
  });

  // ==================== 批量回收 ====================
  describe('批量回收', () => {
    it('应回收所有未锁定物品', () => {
      const items = [
        createItem({ id: 'i1' }),
        createItem({ id: 'i2' }),
        createItem({ id: 'i3', locked: true }),
      ];
      const result = recycleBatch(state, items);
      expect(result.recycled).toBe(2);
      expect(result.skipped).toBe(1);
    });

    it('批量回收应累计金币', () => {
      const items = [
        createItem({ id: 'i1', rarity: 'rare' }),
        createItem({ id: 'i2', rarity: 'epic' }),
      ];
      const result = recycleBatch(state, items);
      expect(result.totalGold).toBeGreaterThan(0);
      expect(result.totalCurrency).toBeGreaterThan(0);
    });
  });

  // ==================== 自动回收 ====================
  describe('自动回收', () => {
    it('未启用规则不应筛选', () => {
      const items = [createItem({ id: 'i1', rarity: 'common' })];
      const result = getAutoRecyclable(items, state.autoRecycleRules);
      expect(result).toHaveLength(0);
    });

    it('启用规则应筛选匹配物品', () => {
      const rules = [{ type: 'equipment' as const, maxRarity: 'common' as const, enabled: true }];
      const items = [
        createItem({ id: 'i1', rarity: 'common' }),
        createItem({ id: 'i2', rarity: 'rare' }),
      ];
      const result = getAutoRecyclable(items, rules);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('i1');
    });

    it('锁定物品不应被自动回收', () => {
      const rules = [{ type: 'equipment' as const, maxRarity: 'common' as const, enabled: true }];
      const items = [createItem({ id: 'i1', rarity: 'common', locked: true })];
      const result = getAutoRecyclable(items, rules);
      expect(result).toHaveLength(0);
    });

    it('更新自动回收规则', () => {
      const newState = updateAutoRecycleRule(state, 'equipment', { enabled: true, maxRarity: 'uncommon' });
      const rule = newState.autoRecycleRules.find(r => r.type === 'equipment');
      expect(rule!.enabled).toBe(true);
      expect(rule!.maxRarity).toBe('uncommon');
    });
  });

  // ==================== 合成 ====================
  describe('合成', () => {
    it('材料不足应无法合成', () => {
      const result = canCraft(state, 'craft_rare_equip', 10000);
      expect(result.canCraft).toBe(false);
    });

    it('金币不足应无法合成', () => {
      const s = { ...state, materials: { crystal_shard: 10, iron_scrap: 20 } };
      const result = canCraft(s, 'craft_rare_equip', 0);
      expect(result.canCraft).toBe(false);
      expect(result.reason).toContain('金币');
    });

    it('材料足够应可以合成', () => {
      const s = { ...state, materials: { crystal_shard: 10, iron_scrap: 20 } };
      const result = canCraft(s, 'craft_rare_equip', 10000);
      expect(result.canCraft).toBe(true);
    });

    it('合成成功应扣除材料', () => {
      const s = { ...state, materials: { crystal_shard: 10, iron_scrap: 20 } };
      const result = craftItem(s, 'craft_rare_equip', 10000, () => 0.1); // 保证成功
      expect(result.success).toBe(true);
      expect(result.crafted).toBe(true);
      expect(result.state.materials['crystal_shard']).toBe(5);
      expect(result.state.materials['iron_scrap']).toBe(10);
    });

    it('合成失败应仍扣除材料', () => {
      const s = { ...state, materials: { crystal_shard: 10, iron_scrap: 20 } };
      const result = craftItem(s, 'craft_rare_equip', 10000, () => 0.99); // 保证失败
      expect(result.success).toBe(true);
      expect(result.crafted).toBe(false);
      expect(result.state.craftFail).toBe(1);
    });

    it('100%成功率配方应总是成功', () => {
      const s = { ...state, materials: { pet_fragment: 20, magic_dust: 10 } };
      const result = craftItem(s, 'craft_pet_shard', 10000, () => 0.99);
      expect(result.crafted).toBe(true);
    });

    it('不存在的配方应失败', () => {
      const result = craftItem(state, 'nonexistent', 10000);
      expect(result.success).toBe(false);
    });
  });

  // ==================== 查询 ====================
  describe('查询功能', () => {
    it('获取材料数量', () => {
      const s = { ...state, materials: { iron_scrap: 15 } };
      expect(getMaterialCount(s, 'iron_scrap')).toBe(15);
      expect(getMaterialCount(s, 'nonexistent')).toBe(0);
    });

    it('获取拥有的材料列表', () => {
      const s = { ...state, materials: { iron_scrap: 10, magic_dust: 5, nonexistent_mat: 3 } };
      const owned = getOwnedMaterials(s);
      expect(owned.length).toBe(2); // nonexistent_mat 没有配置所以被过滤
    });

    it('获取可合成配方', () => {
      const s = { ...state, materials: { crystal_shard: 10, iron_scrap: 20 } };
      const craftable = getCraftableRecipes(s, 10000);
      expect(craftable.length).toBeGreaterThan(0);
    });
  });

  // ==================== 统计 ====================
  describe('统计', () => {
    it('初始统计', () => {
      const stats = getRecycleStats(state);
      expect(stats.totalRecycled).toBe(0);
      expect(stats.craftSuccessRate).toBe(0);
    });

    it('回收后统计更新', () => {
      const { state: s1 } = recycleItem(state, createItem({ id: 'i1' }));
      const stats = getRecycleStats(s1);
      expect(stats.totalRecycled).toBe(1);
      expect(stats.totalGoldEarned).toBeGreaterThan(0);
    });
  });

  // ==================== 回收币商店 ====================
  describe('回收币商店', () => {
    it('应有商品列表', () => {
      expect(RECYCLE_SHOP.length).toBeGreaterThan(0);
    });

    it('回收币足够应可以购买', () => {
      const s = { ...state, recycleCurrency: 100 };
      const result = buyWithRecycleCurrency(s, 'shop_summon_ticket');
      expect(result.success).toBe(true);
      expect(result.state.recycleCurrency).toBe(50);
    });

    it('回收币不足应失败', () => {
      const result = buyWithRecycleCurrency(state, 'shop_summon_ticket');
      expect(result.success).toBe(false);
      expect(result.error).toContain('不足');
    });

    it('不存在的商品应失败', () => {
      const result = buyWithRecycleCurrency(state, 'fake');
      expect(result.success).toBe(false);
    });
  });

  // ==================== 导出导入 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportRecycleData(state);
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原', () => {
      state.totalRecycled = 42;
      const imported = importRecycleData(exportRecycleData(state));
      expect(imported!.totalRecycled).toBe(42);
    });

    it('无效数据返回null', () => {
      expect(importRecycleData('bad')).toBeNull();
      expect(importRecycleData('{}')).toBeNull();
    });
  });

  // ==================== 边界情况 ====================
  describe('边界情况', () => {
    it('品质排序应正确', () => {
      expect(RARITY_ORDER['common']).toBeLessThan(RARITY_ORDER['legendary']);
    });

    it('配方列表应有效', () => {
      RECIPES.forEach(r => {
        expect(r.successRate).toBeGreaterThan(0);
        expect(r.successRate).toBeLessThanOrEqual(1);
        expect(r.materials.length).toBeGreaterThan(0);
      });
    });
  });
});
