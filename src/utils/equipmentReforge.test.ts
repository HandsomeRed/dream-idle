// v0.47 装备重铸系统测试

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  REFORGE_CONFIG,
  STAT_CONFIGS,
  calculateReforgeCost,
  rollStatValue,
  generateRandomStats,
  EquipmentReforgeSystem,
  createEquipmentReforgeSystem,
  type EquipmentQuality,
  type EquipmentSlot,
  type ReforgeResult,
} from './equipmentReforge';

describe('v0.47 装备重铸系统', () => {
  describe('重铸配置', () => {
    it('应该包含所有部位配置', () => {
      const slots = Object.keys(REFORGE_CONFIG.slotStats);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots).toContain('weapon');
      expect(slots).toContain('armor');
    });

    it('应该包含所有品质系数', () => {
      const qualities = Object.keys(REFORGE_CONFIG.qualityMultipliers);
      expect(qualities).toContain('common');
      expect(qualities).toContain('legendary');
      expect(qualities).toContain('mythic');
    });

    it('高品质应该有更高系数', () => {
      const mults = REFORGE_CONFIG.qualityMultipliers;
      expect(mults.mythic).toBeGreaterThan(mults.legendary);
      expect(mults.legendary).toBeGreaterThan(mults.epic);
      expect(mults.epic).toBeGreaterThan(mults.rare);
    });

    it('每个部位应该有可用属性', () => {
      for (const [slot, stats] of Object.entries(REFORGE_CONFIG.slotStats)) {
        expect(stats.length).toBeGreaterThan(0);
        expect(stats.length).toBeLessThanOrEqual(REFORGE_CONFIG.maxStats);
      }
    });
  });

  describe('属性配置', () => {
    it('应该包含所有属性类型', () => {
      const statTypes = Object.keys(STAT_CONFIGS);
      expect(statTypes.length).toBeGreaterThan(0);
      expect(statTypes).toContain('attack');
      expect(statTypes).toContain('defense');
      expect(statTypes).toContain('crit');
    });

    it('每个属性应该有正确配置', () => {
      for (const config of Object.values(STAT_CONFIGS)) {
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('baseValue');
        expect(config).toHaveProperty('growthMultiplier');
        expect(config).toHaveProperty('maxRoll');
      }
    });
  });

  describe('重铸消耗计算', () => {
    it('应该根据品质计算消耗', () => {
      const costCommon = calculateReforgeCost('common', 1, 3);
      const costLegendary = calculateReforgeCost('legendary', 1, 3);
      
      expect(costLegendary.gold).toBeGreaterThan(costCommon.gold);
      expect(costLegendary.reforgeStones).toBeGreaterThan(costCommon.reforgeStones);
    });

    it('应该根据等级计算消耗', () => {
      const cost1 = calculateReforgeCost('rare', 1, 3);
      const cost50 = calculateReforgeCost('rare', 50, 3);
      
      expect(cost50.gold).toBeGreaterThan(cost1.gold);
    });

    it('应该根据属性数量计算消耗', () => {
      const cost2 = calculateReforgeCost('rare', 10, 2);
      const cost5 = calculateReforgeCost('rare', 10, 5);
      
      expect(cost5.gold).toBeGreaterThan(cost2.gold);
    });

    it('神话装备应该消耗最多', () => {
      const costs: Record<EquipmentQuality, number> = {
        common: calculateReforgeCost('common', 50, 5).gold,
        uncommon: calculateReforgeCost('uncommon', 50, 5).gold,
        rare: calculateReforgeCost('rare', 50, 5).gold,
        epic: calculateReforgeCost('epic', 50, 5).gold,
        legendary: calculateReforgeCost('legendary', 50, 5).gold,
        mythic: calculateReforgeCost('mythic', 50, 5).gold,
      };
      
      expect(costs.mythic).toBeGreaterThan(costs.legendary);
      expect(costs.legendary).toBeGreaterThan(costs.epic);
    });
  });

  describe('属性随机生成', () => {
    it('应该生成随机属性值', () => {
      const config = STAT_CONFIGS.attack;
      const value = rollStatValue(config, 'rare');
      
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(config.maxRoll * REFORGE_CONFIG.qualityMultipliers.rare * config.growthMultiplier + config.baseValue);
    });

    it('高品质应该生成更高属性', () => {
      const config = STAT_CONFIGS.attack;
      const commonValue = rollStatValue(config, 'common');
      const legendaryValue = rollStatValue(config, 'legendary');
      
      // 多次尝试取平均，避免随机性影响
      let commonTotal = 0;
      let legendaryTotal = 0;
      for (let i = 0; i < 10; i++) {
        commonTotal += rollStatValue(config, 'common');
        legendaryTotal += rollStatValue(config, 'legendary');
      }
      
      expect(legendaryTotal).toBeGreaterThan(commonTotal);
    });

    it('应该生成正确数量的属性', () => {
      const stats = generateRandomStats('weapon', 'epic');
      const statCount = Object.keys(stats).length;
      
      expect(statCount).toBeGreaterThanOrEqual(REFORGE_CONFIG.minStats);
      expect(statCount).toBeLessThanOrEqual(REFORGE_CONFIG.maxStats);
    });

    it('应该生成适合部位的属性', () => {
      const weaponStats = generateRandomStats('weapon', 'rare');
      const availableWeaponStats = REFORGE_CONFIG.slotStats.weapon;
      
      for (const stat of Object.keys(weaponStats)) {
        expect(availableWeaponStats).toContain(stat);
      }
    });
  });

  describe('重铸系统 - 基础功能', () => {
    let system: EquipmentReforgeSystem;

    beforeEach(() => {
      system = createEquipmentReforgeSystem(100000, 100);
    });

    it('应该能够重铸装备', () => {
      const currentStats = { attack: 50, crit: 2 };
      const result = system.reforgeEquipment('item_001', 'weapon', 'rare', 10, currentStats);
      
      expect(result.success).toBe(true);
      expect(result.newStats).toBeDefined();
    });

    it('金币不足应该重铸失败', () => {
      const poorSystem = createEquipmentReforgeSystem(10, 100);
      const result = poorSystem.reforgeEquipment('item_001', 'weapon', 'rare', 10, { attack: 50 });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('金币不足');
    });

    it('重铸石不足应该重铸失败', () => {
      const poorSystem = createEquipmentReforgeSystem(100000, 1);
      const result = poorSystem.reforgeEquipment('item_001', 'weapon', 'rare', 10, { attack: 50 });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('重铸石不足');
    });

    it('重铸后应该扣除资源', () => {
      const before = system.getPlayerResources();
      system.reforgeEquipment('item_001', 'weapon', 'rare', 10, { attack: 50 });
      const after = system.getPlayerResources();
      
      expect(after.gold).toBeLessThan(before.gold);
      expect(after.reforgeStones).toBeLessThan(before.reforgeStones);
    });
  });

  describe('重铸系统 - 属性锁定', () => {
    let system: EquipmentReforgeSystem;

    beforeEach(() => {
      system = createEquipmentReforgeSystem(1000000, 1000);
    });

    it('应该能够锁定属性', () => {
      const currentStats = { attack: 50, crit: 2, speed: 10 };
      const lockedStats = { attack: true };
      
      const result = system.reforgeEquipment('item_001', 'weapon', 'rare', 10, currentStats, lockedStats);
      
      expect(result.success).toBe(true);
      expect(result.newStats.attack).toBe(50); // 锁定的属性应该保持不变
    });

    it('未锁定的属性应该改变', () => {
      const currentStats = { attack: 50, crit: 2 };
      const lockedStats = { attack: true };
      
      // 多次重铸，crit 应该会变化
      let critChanged = false;
      for (let i = 0; i < 10; i++) {
        const result = system.reforgeEquipment(`item_${i}`, 'weapon', 'rare', 10, currentStats, lockedStats);
        if (result.newStats.crit !== currentStats.crit) {
          critChanged = true;
          break;
        }
      }
      
      expect(critChanged).toBe(true);
    });
  });

  describe('重铸系统 - 批量重铸', () => {
    let system: EquipmentReforgeSystem;

    beforeEach(() => {
      system = createEquipmentReforgeSystem(10000000, 10000);
    });

    it('应该能够批量重铸', () => {
      const currentStats = { attack: 50, crit: 2 };
      const targetStats = { attack: 100, crit: 5 };
      
      const result = system.batchReforge('item_001', 'weapon', 'rare', 10, currentStats, targetStats, 5);
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.length).toBeLessThanOrEqual(5);
      expect(result.totalCost.gold).toBeGreaterThan(0);
    });

    it('批量重铸应该返回最佳结果', () => {
      const currentStats = { attack: 50, crit: 2 };
      const targetStats = { attack: 100, crit: 5 };
      
      const result = system.batchReforge('item_001', 'weapon', 'rare', 10, currentStats, targetStats, 10);
      
      if (result.bestResult) {
        expect(result.bestResult.newStats).toBeDefined();
      }
    });

    it('达到目标评分应该提前停止', () => {
      const currentStats = { attack: 50, crit: 2 };
      const targetStats = { attack: 10, crit: 1 }; // 低目标，容易达到
      
      const result = system.batchReforge('item_001', 'weapon', 'rare', 10, currentStats, targetStats, 100);
      
      // 应该在达到 90% 评分后停止，不会用满 100 次
      expect(result.results.length).toBeLessThan(100);
    });
  });

  describe('重铸系统 - 历史记录', () => {
    let system: EquipmentReforgeSystem;

    beforeEach(() => {
      system = createEquipmentReforgeSystem(10000000, 10000);
    });

    it('应该保存重铸历史', () => {
      system.reforgeEquipment('item_001', 'weapon', 'rare', 10, { attack: 50 });
      system.reforgeEquipment('item_001', 'weapon', 'rare', 10, { attack: 50 });
      
      const history = system.getReforgeHistory('item_001');
      expect(history.length).toBe(2);
    });

    it('应该只保留最近 50 次历史', () => {
      for (let i = 0; i < 60; i++) {
        system.reforgeEquipment('item_001', 'weapon', 'rare', 10, { attack: 50 });
      }
      
      const history = system.getReforgeHistory('item_001');
      expect(history.length).toBe(50);
    });

    it('不同装备应该有独立历史', () => {
      system.reforgeEquipment('item_001', 'weapon', 'rare', 10, { attack: 50 });
      system.reforgeEquipment('item_002', 'armor', 'rare', 10, { defense: 50 });
      
      const history1 = system.getReforgeHistory('item_001');
      const history2 = system.getReforgeHistory('item_002');
      
      expect(history1.length).toBe(1);
      expect(history2.length).toBe(1);
    });
  });

  describe('重铸系统 - 资源管理', () => {
    let system: EquipmentReforgeSystem;

    beforeEach(() => {
      system = createEquipmentReforgeSystem(100000, 100);
    });

    it('应该能够获取玩家资源', () => {
      const resources = system.getPlayerResources();
      
      expect(resources.gold).toBe(100000);
      expect(resources.reforgeStones).toBe(100);
    });

    it('应该能够添加资源', () => {
      system.addResources(50000, 50);
      const resources = system.getPlayerResources();
      
      expect(resources.gold).toBe(150000);
      expect(resources.reforgeStones).toBe(150);
    });

    it('应该能够只添加金币', () => {
      system.addResources(50000, 0);
      const resources = system.getPlayerResources();
      
      expect(resources.gold).toBe(150000);
      expect(resources.reforgeStones).toBe(100);
    });
  });

  describe('重铸系统 - 数据导出导入', () => {
    let system: EquipmentReforgeSystem;

    beforeEach(() => {
      system = createEquipmentReforgeSystem(100000, 100);
      system.reforgeEquipment('item_001', 'weapon', 'rare', 10, { attack: 50 });
    });

    it('应该能够导出数据', () => {
      const data = system.exportData();
      
      expect(data).toHaveProperty('reforgeHistory');
      expect(data).toHaveProperty('playerGold');
      expect(data).toHaveProperty('playerReforgeStones');
    });

    it('应该能够导入数据', () => {
      const data = system.exportData();
      
      const newSystem = createEquipmentReforgeSystem(0, 0);
      newSystem.importData(data);
      
      expect(newSystem.getPlayerResources().gold).toBe(system.getPlayerResources().gold);
      expect(newSystem.getPlayerResources().reforgeStones).toBe(system.getPlayerResources().reforgeStones);
    });

    it('导入后历史应该一致', () => {
      const data = system.exportData();
      
      const newSystem = createEquipmentReforgeSystem(0, 0);
      newSystem.importData(data);
      
      const history1 = system.getReforgeHistory('item_001');
      const history2 = newSystem.getReforgeHistory('item_001');
      
      expect(history2.length).toBe(history1.length);
    });
  });

  describe('边界情况', () => {
    let system: EquipmentReforgeSystem;

    beforeEach(() => {
      system = createEquipmentReforgeSystem(100000, 100);
    });

    it('空历史应该返回空数组', () => {
      expect(system.getReforgeHistory('nonexistent')).toHaveLength(0);
    });

    it('资源刚好够应该能够重铸', () => {
      const cost = calculateReforgeCost('common', 1, 2);
      const exactSystem = createEquipmentReforgeSystem(cost.gold, cost.reforgeStones);
      
      const result = exactSystem.reforgeEquipment('item_001', 'weapon', 'common', 1, { attack: 10 });
      expect(result.success).toBe(true);
    });

    it('资源差 1 点应该无法重铸', () => {
      const cost = calculateReforgeCost('common', 1, 2);
      const poorSystem = createEquipmentReforgeSystem(cost.gold - 1, cost.reforgeStones);
      
      const result = poorSystem.reforgeEquipment('item_001', 'weapon', 'common', 1, { attack: 10 });
      expect(result.success).toBe(false);
    });
  });
});
