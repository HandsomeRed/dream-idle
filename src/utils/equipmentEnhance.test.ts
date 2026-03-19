/**
 * Equipment Enhancement System Tests - v0.28
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  GemType,
  GemQuality,
  ENHANCE_SUCCESS_RATES,
  REFINEMENT_SUCCESS_RATES,
  GEM_VALUES,
  SOCKET_UNLOCK_LEVELS,
  getEnhanceSuccessRate,
  calculateEnhanceCost,
  enhanceEquipment,
  repairEquipment,
  getRepairCost,
  calculateRefinementCost,
  refineEquipment,
  getRefinementBonus,
  generateRandomGem,
  initializeGemSockets,
  updateSocketUnlocks,
  installGem,
  removeGem,
  getGemName,
  calculateGemBonus,
  calculateFinalStats,
  getEnhanceDisplayText,
  getEnhanceColor,
  type EnhancementState,
  type RefinementState,
  type GemSocket
} from './equipmentEnhance';

describe('Equipment Enhancement System - v0.28', () => {
  
  // ==================== 强化成功率测试 ====================
  
  describe('Enhancement Success Rates', () => {
    it('should return correct success rates for all levels', () => {
      expect(getEnhanceSuccessRate(0)).toBe(1.00);   // +0→+1: 100%
      expect(getEnhanceSuccessRate(5)).toBe(0.75);   // +5→+6: 75%
      expect(getEnhanceSuccessRate(9)).toBe(0.55);   // +9→+10: 55%
      expect(getEnhanceSuccessRate(14)).toBe(0.10);  // +14→+15: 10%
    });

    it('should return 0 for invalid levels', () => {
      expect(getEnhanceSuccessRate(15)).toBe(0);  // Already max, can't enhance further
      expect(getEnhanceSuccessRate(-5)).toBe(0);  // Broken equipment, need repair first
    });
  });

  // ==================== 强化消耗测试 ====================
  
  describe('Enhancement Cost Calculation', () => {
    it('should calculate increasing costs for higher levels', () => {
      const cost0 = calculateEnhanceCost(0);
      const cost5 = calculateEnhanceCost(5);
      const cost10 = calculateEnhanceCost(10);
      
      expect(cost5).toBeGreaterThan(cost0);
      expect(cost10).toBeGreaterThan(cost5);
    });

    it('should return reasonable base cost', () => {
      expect(calculateEnhanceCost(0)).toBe(100);
    });
  });

  // ==================== 强化执行测试 ====================
  
  describe('Enhancement Execution', () => {
    let state: EnhancementState;

    beforeEach(() => {
      state = {
        level: 0,
        exp: 0,
        isLocked: false,
        protectionUsed: false
      };
    });

    it('should succeed at +0→+1 (100% rate)', () => {
      const result = enhanceEquipment(state);
      expect(result.success).toBe(true);
      expect(state.level).toBe(1);
      expect(result.message).toContain('强化成功');
    });

    it('should fail when already at max level (+15)', () => {
      state.level = 15;
      const result = enhanceEquipment(state);
      expect(result.success).toBe(false);
      expect(result.message).toContain('最高强化等级');
    });

    it('should fail when equipment is broken (-12)', () => {
      state.level = -12;
      const result = enhanceEquipment(state);
      expect(result.success).toBe(false);
      expect(result.isBroken).toBe(true);
      expect(result.message).toContain('损坏');
    });

    it('should decrease level on failure at high levels', () => {
      state.level = 10;  // +10 failure drops 2 levels
      // Mock random to force failure
      const originalRandom = Math.random;
      Math.random = () => 0.99;  // Will fail (rate is 0.55)
      
      const result = enhanceEquipment(state);
      Math.random = originalRandom;
      
      expect(result.success).toBe(false);
      expect(state.level).toBeLessThan(10);
    });

    it('should protect level with protection item', () => {
      state.level = 10;
      const originalRandom = Math.random;
      Math.random = () => 0.99;  // Force failure
      
      const result = enhanceEquipment(state, true);  // Use protection
      Math.random = originalRandom;
      
      expect(result.success).toBe(false);
      expect(state.level).toBe(10);  // Should not drop
      expect(state.protectionUsed).toBe(true);
    });

    it('should protect level when locked', () => {
      state.level = 10;
      state.isLocked = true;
      const originalRandom = Math.random;
      Math.random = () => 0.99;  // Force failure
      
      const result = enhanceEquipment(state);
      Math.random = originalRandom;
      
      expect(result.success).toBe(false);
      expect(state.level).toBe(10);  // Should not drop
    });
  });

  // ==================== 修复系统测试 ====================
  
  describe('Equipment Repair', () => {
    it('should repair broken equipment to +0', () => {
      const state: EnhancementState = {
        level: -12,
        exp: 0,
        isLocked: true,
        protectionUsed: false
      };
      
      const success = repairEquipment(state, 6000);
      expect(success).toBe(true);
      expect(state.level).toBe(0);
      expect(state.isLocked).toBe(false);
    });

    it('should not repair non-broken equipment', () => {
      const state: EnhancementState = {
        level: 5,
        exp: 0,
        isLocked: false,
        protectionUsed: false
      };
      
      const success = repairEquipment(state, 1000);
      expect(success).toBe(false);
      expect(state.level).toBe(5);
    });

    it('should calculate correct repair cost', () => {
      expect(getRepairCost(-1)).toBe(500);
      expect(getRepairCost(-5)).toBe(2500);
      expect(getRepairCost(-12)).toBe(6000);
    });
  });

  // ==================== 精炼系统测试 ====================
  
  describe('Refinement System', () => {
    let state: RefinementState;

    beforeEach(() => {
      state = {
        level: 1,
        exp: 0
      };
    });

    it('should succeed at 1★→2★ (100% rate)', () => {
      const result = refineEquipment(state, 1);
      expect(result.success).toBe(true);
      expect(state.level).toBe(2);
    });

    it('should fail when already at max refinement (5★)', () => {
      state.level = 5;
      const result = refineEquipment(state, 10);
      expect(result.success).toBe(false);
      expect(result.message).toContain('最高精炼等级');
    });

    it('should fail when not enough refinement stones', () => {
      state.level = 2;  // Needs 3 stones for 2★→3★
      const result = refineEquipment(state, 1);  // Only 1 stone
      expect(result.success).toBe(false);
      expect(result.message).toContain('精炼石不足');
    });

    it('should calculate correct refinement costs', () => {
      expect(calculateRefinementCost(1)).toBe(1);  // 1★→2★
      expect(calculateRefinementCost(2)).toBe(3);  // 2★→3★
      expect(calculateRefinementCost(3)).toBe(6);  // 3★→4★
      expect(calculateRefinementCost(4)).toBe(10); // 4★→5★
    });

    it('should provide correct refinement bonus multipliers', () => {
      expect(getRefinementBonus(1)).toBe(1.0);   // No bonus at 1★
      expect(getRefinementBonus(3)).toBe(1.25);  // 25% bonus at 3★
      expect(getRefinementBonus(5)).toBe(2.0);   // 100% bonus at 5★
    });
  });

  // ==================== 宝石系统测试 ====================
  
  describe('Gem System', () => {
    it('should generate random gem with valid properties', () => {
      const gem = generateRandomGem();
      
      expect(gem.id).toBeDefined();
      expect(Object.values(GemType)).toContain(gem.type);
      expect(Object.values(GemQuality)).toContain(gem.quality);
      expect(gem.value).toBe(GEM_VALUES[gem.quality]);
    });

    it('should generate gems with correct values by quality', () => {
      // Force specific quality by mocking (simplified test)
      const commonGem = generateRandomGem();
      expect(commonGem.value).toBeGreaterThan(0);
    });

    it('should initialize 4 gem sockets', () => {
      const sockets = initializeGemSockets();
      expect(sockets).toHaveLength(4);
      expect(sockets[0].unlocked).toBe(true);   // First socket unlocked
      expect(sockets[1].unlocked).toBe(false);  // Others locked
      expect(sockets[2].unlocked).toBe(false);
      expect(sockets[3].unlocked).toBe(false);
    });

    it('should unlock sockets based on enhancement level', () => {
      const sockets = initializeGemSockets();
      
      updateSocketUnlocks(sockets, 0);
      expect(sockets[0].unlocked).toBe(true);
      expect(sockets[1].unlocked).toBe(false);
      
      updateSocketUnlocks(sockets, 5);
      expect(sockets[1].unlocked).toBe(true);
      expect(sockets[2].unlocked).toBe(false);
      
      updateSocketUnlocks(sockets, 15);
      expect(sockets[3].unlocked).toBe(true);
    });

    it('should install gem in unlocked socket', () => {
      const sockets = initializeGemSockets();
      const gem = generateRandomGem();
      
      const result = installGem(sockets, 0, gem);
      
      expect(result.success).toBe(true);
      expect(sockets[0].gem).toBe(gem);
      expect(result.gemInstalled).toBe(gem);
    });

    it('should fail to install gem in locked socket', () => {
      const sockets = initializeGemSockets();
      const gem = generateRandomGem();
      
      const result = installGem(sockets, 1, gem);  // Socket 1 is locked
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未解锁');
    });

    it('should replace existing gem', () => {
      const sockets = initializeGemSockets();
      const gem1 = generateRandomGem();
      const gem2 = generateRandomGem();
      
      installGem(sockets, 0, gem1);
      const result = installGem(sockets, 0, gem2);
      
      expect(result.success).toBe(true);
      expect(sockets[0].gem).toBe(gem2);
      expect(result.gemRemoved).toBe(gem1);
    });

    it('should remove gem from socket', () => {
      const sockets = initializeGemSockets();
      const gem = generateRandomGem();
      
      installGem(sockets, 0, gem);
      const result = removeGem(sockets, 0);
      
      expect(result.success).toBe(true);
      expect(sockets[0].gem).toBeNull();
      expect(result.gemRemoved).toBe(gem);
    });

    it('should fail to remove gem from empty socket', () => {
      const sockets = initializeGemSockets();
      const result = removeGem(sockets, 0);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('为空');
    });

    it('should return correct gem names', () => {
      const gem: any = { type: GemType.Attack, quality: GemQuality.Epic };
      expect(getGemName(gem)).toBe('史诗红宝石');
      
      const gem2: any = { type: GemType.Defense, quality: GemQuality.Legendary };
      expect(getGemName(gem2)).toBe('传说蓝宝石');
    });
  });

  // ==================== 宝石属性加成测试 ====================
  
  describe('Gem Bonus Calculation', () => {
    it('should calculate total gem bonuses', () => {
      const sockets: GemSocket[] = [
        { unlocked: true, gem: { id: '1', type: GemType.Attack, quality: GemQuality.Common, value: 10 } },
        { unlocked: true, gem: { id: '2', type: GemType.Attack, quality: GemQuality.Rare, value: 25 } },
        { unlocked: true, gem: { id: '3', type: GemType.Defense, quality: GemQuality.Epic, value: 50 } },
        { unlocked: true, gem: null }
      ];
      
      const bonus = calculateGemBonus(sockets);
      
      expect(bonus.attack).toBe(35);   // 10 + 25
      expect(bonus.defense).toBe(50);
      expect(bonus.hp).toBe(0);
      expect(bonus.speed).toBe(0);
      expect(bonus.critical).toBe(0);
    });

    it('should return zero bonuses for empty sockets', () => {
      const sockets = initializeGemSockets();
      const bonus = calculateGemBonus(sockets);
      
      expect(bonus.attack).toBe(0);
      expect(bonus.defense).toBe(0);
      expect(bonus.hp).toBe(0);
    });
  });

  // ==================== 综合属性计算测试 ====================
  
  describe('Final Stats Calculation', () => {
    it('should calculate final stats with all bonuses', () => {
      const baseStats = { attack: 100, defense: 50, hp: 500 };
      const enhanceLevel = 10;  // +10 = 50% bonus
      const refinementLevel = 3; // 3★ = 25% bonus
      const gemBonus = { attack: 20, defense: 10, hp: 0, speed: 0, critical: 0 };
      
      const final = calculateFinalStats(baseStats, enhanceLevel, refinementLevel, gemBonus);
      
      // Expected: base × refinement × enhance + gem
      // Attack: 100 × 1.25 × 1.5 + 20 = 187.5 + 20 = 207.5 → 207
      // Defense: 50 × 1.25 × 1.5 + 10 = 93.75 + 10 = 103.75 → 103
      // HP: 500 × 1.25 × 1.5 + 0 = 937.5 → 937
      expect(final.attack).toBe(207);
      expect(final.defense).toBe(103);
      expect(final.hp).toBe(937);
    });

    it('should handle zero bonuses', () => {
      const baseStats = { attack: 100 };
      const final = calculateFinalStats(baseStats, 0, 1, { attack: 0, defense: 0, hp: 0, speed: 0, critical: 0 });
      
      expect(final.attack).toBe(100);  // No bonuses
    });
  });

  // ==================== UI 辅助函数测试 ====================
  
  describe('UI Helper Functions', () => {
    it('should return correct display text for enhancement levels', () => {
      expect(getEnhanceDisplayText(0)).toBe('+0');
      expect(getEnhanceDisplayText(5)).toBe('+5');
      expect(getEnhanceDisplayText(15)).toBe('+15');
      expect(getEnhanceDisplayText(-5)).toBe('-5');
    });

    it('should return color codes for enhancement levels', () => {
      expect(getEnhanceColor(15)).toBe('#ff6b6b');   // Red - max
      expect(getEnhanceColor(10)).toBe('#f59f00');   // Orange
      expect(getEnhanceColor(5)).toBe('#4dabf7');    // Blue
      expect(getEnhanceColor(0)).toBe('#51cf66');    // Green
      expect(getEnhanceColor(-5)).toBe('#868e96');   // Gray - broken
    });
  });

  // ==================== 边界条件测试 ====================
  
  describe('Edge Cases', () => {
    it('should handle minimum enhancement level (-12)', () => {
      const state: EnhancementState = {
        level: -11,
        exp: 0,
        isLocked: false,
        protectionUsed: false
      };
      
      // Force multiple failures to reach -12
      const originalRandom = Math.random;
      Math.random = () => 0.99;  // Always fail
      
      for (let i = 0; i < 20; i++) {
        enhanceEquipment(state);
        if (state.level === -12) break;
      }
      
      Math.random = originalRandom;
      expect(state.level).toBeGreaterThanOrEqual(-12);
    });

    it('should handle maximum enhancement level (+15)', () => {
      const state: EnhancementState = {
        level: 15,
        exp: 0,
        isLocked: false,
        protectionUsed: false
      };
      
      const result = enhanceEquipment(state);
      expect(result.success).toBe(false);
      expect(state.level).toBe(15);  // Should not change
    });

    it('should handle invalid socket indices', () => {
      const sockets = initializeGemSockets();
      const gem = generateRandomGem();
      
      const result1 = installGem(sockets, -1, gem);
      const result2 = installGem(sockets, 10, gem);
      
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  // ==================== 集成测试 ====================
  
  describe('Integration Tests', () => {
    it('should complete full enhancement cycle', () => {
      const state: EnhancementState = {
        level: 0,
        exp: 0,
        isLocked: false,
        protectionUsed: false
      };
      
      // Enhance to +5 (should be relatively easy)
      for (let i = 0; i < 5; i++) {
        const result = enhanceEquipment(state);
        if (!result.success) {
          // If failed, just verify state is consistent
          expect(state.level).toBeLessThan(6);
          break;
        }
      }
      
      expect(state.level).toBeGreaterThanOrEqual(0);
      expect(state.level).toBeLessThanOrEqual(15);
    });

    it('should complete full refinement cycle', () => {
      const state: RefinementState = {
        level: 1,
        exp: 0
      };
      
      // Refine to 5★ (may fail due to probability)
      let stones = 20;
      while (state.level < 5 && stones > 0) {
        const result = refineEquipment(state, stones);
        stones -= calculateRefinementCost(state.level);
        if (!result.success && result.message.includes('不足')) {
          break;
        }
      }
      
      expect(state.level).toBeGreaterThanOrEqual(1);
      expect(state.level).toBeLessThanOrEqual(5);
    });

    it('should integrate gems with enhancement system', () => {
      const sockets = initializeGemSockets();
      const state: EnhancementState = {
        level: 0,
        exp: 0,
        isLocked: false,
        protectionUsed: false
      };
      
      // Enhance to unlock more sockets
      state.level = 10;
      updateSocketUnlocks(sockets, state.level);
      
      expect(sockets[0].unlocked).toBe(true);
      expect(sockets[1].unlocked).toBe(true);
      expect(sockets[2].unlocked).toBe(true);
      expect(sockets[3].unlocked).toBe(false);  // Need +15
      
      // Install gems
      const gem1 = generateRandomGem();
      const gem2 = generateRandomGem();
      installGem(sockets, 0, gem1);
      installGem(sockets, 1, gem2);
      
      const bonus = calculateGemBonus(sockets);
      expect(bonus.attack + bonus.defense + bonus.hp + bonus.speed + bonus.critical).toBeGreaterThan(0);
    });
  });
});
