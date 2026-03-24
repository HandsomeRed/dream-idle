// 附魔系统测试 - v0.70

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ENCHANT_CONFIGS,
  ENCHANT_TYPES,
  createEnchantState,
  addMaterial,
  getEnchantEffect,
  canEnchant,
  enchant,
  setProtection,
  removeEnchant,
  getEquipEnchantInfo,
  getEnchantStats,
  getEnchantName,
  getEnchantIcon,
  exportEnchantData,
  importEnchantData,
  type EnchantState,
  type EnchantType,
  type EnchantTier,
} from './enchantSystem';

describe('附魔系统 v0.70', () => {
  let state: EnchantState;

  beforeEach(() => {
    state = createEnchantState('player_001');
  });

  // ==================== 配置测试 ====================
  describe('附魔配置', () => {
    it('应包含6种附魔类型', () => {
      expect(ENCHANT_TYPES).toHaveLength(6);
    });

    it('每种附魔应有5个等级', () => {
      ENCHANT_TYPES.forEach(type => {
        expect(Object.keys(ENCHANT_CONFIGS[type].tiers)).toHaveLength(5);
      });
    });

    it('附魔等级越高加成越大', () => {
      ENCHANT_TYPES.forEach(type => {
        const config = ENCHANT_CONFIGS[type];
        for (let t = 2; t <= 5; t++) {
          expect(config.tiers[t as EnchantTier].mainBonus)
            .toBeGreaterThan(config.tiers[(t - 1) as EnchantTier].mainBonus);
        }
      });
    });

    it('附魔等级越高成功率越低', () => {
      ENCHANT_TYPES.forEach(type => {
        const config = ENCHANT_CONFIGS[type];
        for (let t = 2; t <= 5; t++) {
          expect(config.tiers[t as EnchantTier].successRate)
            .toBeLessThanOrEqual(config.tiers[(t - 1) as EnchantTier].successRate);
        }
      });
    });

    it('1级附魔成功率应为100%', () => {
      ENCHANT_TYPES.forEach(type => {
        expect(ENCHANT_CONFIGS[type].tiers[1].successRate).toBe(100);
      });
    });

    it('每种附魔应有名称和图标', () => {
      ENCHANT_TYPES.forEach(type => {
        expect(ENCHANT_CONFIGS[type].name).toBeTruthy();
        expect(ENCHANT_CONFIGS[type].icon).toBeTruthy();
      });
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.totalEnchants).toBe(0);
      expect(state.totalSuccesses).toBe(0);
      expect(Object.keys(state.equips)).toHaveLength(0);
    });

    it('初始材料应全为0', () => {
      ENCHANT_TYPES.forEach(type => {
        expect(state.materials[type]).toBe(0);
      });
    });
  });

  // ==================== 材料管理测试 ====================
  describe('材料管理', () => {
    it('添加材料应增加数量', () => {
      const s = addMaterial(state, 'fire', 10);
      expect(s.materials.fire).toBe(10);
    });

    it('多次添加应累加', () => {
      let s = addMaterial(state, 'fire', 10);
      s = addMaterial(s, 'fire', 5);
      expect(s.materials.fire).toBe(15);
    });

    it('不同类型应独立', () => {
      let s = addMaterial(state, 'fire', 10);
      s = addMaterial(s, 'ice', 20);
      expect(s.materials.fire).toBe(10);
      expect(s.materials.ice).toBe(20);
    });
  });

  // ==================== 附魔效果测试 ====================
  describe('附魔效果', () => {
    it('应返回正确的效果数据', () => {
      const effect = getEnchantEffect('fire', 1);
      expect(effect.type).toBe('fire');
      expect(effect.tier).toBe(1);
      expect(effect.mainBonus).toBe(5);
      expect(effect.procChance).toBeGreaterThan(0);
    });

    it('高级附魔应有更强效果', () => {
      const t1 = getEnchantEffect('fire', 1);
      const t3 = getEnchantEffect('fire', 3);
      expect(t3.mainBonus).toBeGreaterThan(t1.mainBonus);
      expect(t3.procDamage).toBeGreaterThan(t1.procDamage);
    });
  });

  // ==================== 附魔资格测试 ====================
  describe('附魔资格', () => {
    it('材料和金币充足应可以附魔', () => {
      const s = addMaterial(state, 'fire', 10);
      const result = canEnchant(s, 'equip_001', 'fire', 1, 10000);
      expect(result.canEnchant).toBe(true);
    });

    it('金币不足应不能附魔', () => {
      const s = addMaterial(state, 'fire', 10);
      const result = canEnchant(s, 'equip_001', 'fire', 1, 100);
      expect(result.canEnchant).toBe(false);
      expect(result.reason).toContain('金币不足');
    });

    it('材料不足应不能附魔', () => {
      const result = canEnchant(state, 'equip_001', 'fire', 1, 10000);
      expect(result.canEnchant).toBe(false);
      expect(result.reason).toContain('附魔石不足');
    });

    it('升级需要前一级附魔', () => {
      const s = addMaterial(state, 'fire', 100);
      const result = canEnchant(s, 'equip_001', 'fire', 2, 100000);
      expect(result.canEnchant).toBe(false);
      expect(result.reason).toContain('1级附魔');
    });
  });

  // ==================== 附魔执行测试 ====================
  describe('附魔执行', () => {
    it('1级附魔应100%成功', () => {
      let s = addMaterial(state, 'fire', 10);
      const result = enchant(s, 'equip_001', 'fire', 1, 10000);
      expect(result.success).toBe(true);
      expect(result.effect).toBeDefined();
      expect(result.effect!.type).toBe('fire');
      expect(result.effect!.tier).toBe(1);
    });

    it('附魔应消耗材料', () => {
      let s = addMaterial(state, 'fire', 10);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 10000);
      expect(s1.materials.fire).toBe(5); // 10 - 5
    });

    it('附魔应记录历史', () => {
      let s = addMaterial(state, 'fire', 10);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 10000);
      const info = getEquipEnchantInfo(s1, 'equip_001');
      expect(info.enchantHistory).toHaveLength(1);
    });

    it('成功附魔应更新统计', () => {
      let s = addMaterial(state, 'fire', 10);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 10000);
      expect(s1.totalEnchants).toBe(1);
      expect(s1.totalSuccesses).toBe(1);
    });

    it('失败附魔应更新统计', () => {
      let s = addMaterial(state, 'fire', 100);
      // 先成功附魔1级
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 100000);
      // 用 rng 强制2级失败
      const { state: s2, success } = enchant(s1, 'equip_001', 'fire', 2, 100000, () => 0.99);
      expect(success).toBe(false);
      expect(s2.totalFailures).toBe(1);
    });

    it('失败应降级（无保护）', () => {
      let s = addMaterial(state, 'fire', 200);
      // 附魔到1级
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 100000, () => 0);
      // 附魔到2级（成功 rng=0）
      const { state: s2 } = enchant(s1, 'equip_001', 'fire', 2, 100000, () => 0);
      expect(getEquipEnchantInfo(s2, 'equip_001').enchant!.tier).toBe(2);
      // 尝试3级（失败 rng=0.99）
      const { state: s3 } = enchant(s2, 'equip_001', 'fire', 3, 100000, () => 0.99);
      expect(getEquipEnchantInfo(s3, 'equip_001').enchant!.tier).toBe(1); // 降回1级
    });

    it('保护应防止降级', () => {
      let s = addMaterial(state, 'fire', 200);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 100000, () => 0);
      const { state: s2 } = enchant(s1, 'equip_001', 'fire', 2, 100000, () => 0);
      // 开启保护
      const s3 = setProtection(s2, 'equip_001', true);
      // 失败不降级
      const { state: s4 } = enchant(s3, 'equip_001', 'fire', 3, 100000, () => 0.99);
      expect(getEquipEnchantInfo(s4, 'equip_001').enchant!.tier).toBe(2); // 保持2级
    });

    it('材料不足应返回错误', () => {
      const result = enchant(state, 'equip_001', 'fire', 1, 100000);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('highestTier 应更新', () => {
      let s = addMaterial(state, 'fire', 200);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 100000);
      const { state: s2 } = enchant(s1, 'equip_001', 'fire', 2, 100000, () => 0);
      expect(s2.highestTier).toBe(2);
    });
  });

  // ==================== 附魔管理测试 ====================
  describe('附魔管理', () => {
    it('移除附魔应清空', () => {
      let s = addMaterial(state, 'fire', 10);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 10000);
      const s2 = removeEnchant(s1, 'equip_001');
      expect(getEquipEnchantInfo(s2, 'equip_001').enchant).toBeNull();
    });

    it('获取未附魔装备应返回空状态', () => {
      const info = getEquipEnchantInfo(state, 'equip_999');
      expect(info.enchant).toBeNull();
      expect(info.enchantHistory).toHaveLength(0);
    });

    it('设置保护应生效', () => {
      const s = setProtection(state, 'equip_001', true);
      expect(getEquipEnchantInfo(s, 'equip_001').protectionActive).toBe(true);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('初始统计应正确', () => {
      const stats = getEnchantStats(state);
      expect(stats.totalEnchants).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.enchantedEquips).toBe(0);
    });

    it('附魔后统计应更新', () => {
      let s = addMaterial(state, 'fire', 20);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 100000);
      const stats = getEnchantStats(s1);
      expect(stats.totalEnchants).toBe(1);
      expect(stats.totalSuccesses).toBe(1);
      expect(stats.successRate).toBe(100);
      expect(stats.enchantedEquips).toBe(1);
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('获取附魔名称', () => {
      expect(getEnchantName('fire')).toBe('烈焰');
      expect(getEnchantName('ice')).toBe('寒冰');
    });

    it('获取附魔图标', () => {
      expect(getEnchantIcon('fire')).toBe('🔥');
      expect(getEnchantIcon('ice')).toBe('❄️');
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportEnchantData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      let s = addMaterial(state, 'fire', 50);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 100000);
      const json = exportEnchantData(s1);
      const imported = importEnchantData(json);
      expect(imported).toBeDefined();
      expect(imported!.totalSuccesses).toBe(1);
    });

    it('无效数据应返回null', () => {
      expect(importEnchantData('not json')).toBeNull();
      expect(importEnchantData('{}')).toBeNull();
    });
  });

  // ==================== 边界情况测试 ====================
  describe('边界情况', () => {
    it('历史记录应限制30条', () => {
      let s = addMaterial(state, 'fire', 500);
      for (let i = 0; i < 35; i++) {
        // 不断附魔1级（100%成功）然后移除，再附魔
        const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 1000000);
        s = removeEnchant(s1, 'equip_001');
        s = addMaterial(s, 'fire', 10); // 补充材料
      }
      const info = getEquipEnchantInfo(s, 'equip_001');
      expect(info.enchantHistory.length).toBeLessThanOrEqual(30);
    });

    it('多个装备应独立管理', () => {
      let s = addMaterial(state, 'fire', 20);
      s = addMaterial(s, 'ice', 20);
      const { state: s1 } = enchant(s, 'equip_001', 'fire', 1, 100000);
      const { state: s2 } = enchant(s1, 'equip_002', 'ice', 1, 100000);
      expect(getEquipEnchantInfo(s2, 'equip_001').enchant!.type).toBe('fire');
      expect(getEquipEnchantInfo(s2, 'equip_002').enchant!.type).toBe('ice');
    });
  });
});
