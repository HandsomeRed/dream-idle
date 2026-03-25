// 神器系统测试 - v0.72

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ARTIFACT_CONFIGS,
  RESONANCE_BONUSES,
  RARITY_NAMES,
  TYPE_NAMES,
  MAX_EQUIP_SLOTS,
  DAILY_FREE_ENHANCE,
  createArtifactState,
  unlockArtifact,
  enhanceArtifact,
  equipArtifact,
  unequipArtifact,
  getArtifactEffects,
  getResonanceBonus,
  getTotalEffects,
  getArtifactStats,
  checkDailyReset,
  getExpForLevel,
  getEnhanceCost,
  getRarityName,
  getRarityColor,
  getTypeName,
  exportArtifactData,
  importArtifactData,
  type ArtifactState,
} from './artifact';

describe('神器系统 v0.72', () => {
  let state: ArtifactState;

  beforeEach(() => {
    state = createArtifactState('player_001');
  });

  // ==================== 配置测试 ====================
  describe('配置', () => {
    it('应有多个神器配置', () => {
      expect(Object.keys(ARTIFACT_CONFIGS).length).toBeGreaterThanOrEqual(5);
    });

    it('每个神器应有必要字段', () => {
      Object.values(ARTIFACT_CONFIGS).forEach(c => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.baseEffects.length).toBeGreaterThan(0);
        expect(c.maxLevel).toBeGreaterThan(0);
      });
    });

    it('神器ID应唯一', () => {
      const ids = Object.keys(ARTIFACT_CONFIGS);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('应有共鸣配置', () => {
      expect(RESONANCE_BONUSES.length).toBeGreaterThan(0);
    });

    it('共鸣数量应递增', () => {
      for (let i = 1; i < RESONANCE_BONUSES.length; i++) {
        expect(RESONANCE_BONUSES[i].count).toBeGreaterThan(RESONANCE_BONUSES[i - 1].count);
      }
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建空状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(Object.keys(state.owned)).toHaveLength(0);
      expect(state.equipped).toHaveLength(0);
      expect(state.maxEquipSlots).toBe(MAX_EQUIP_SLOTS);
    });

    it('每日免费强化应初始化', () => {
      expect(state.dailyFreeEnhance).toBe(DAILY_FREE_ENHANCE);
      expect(state.dailyFreeEnhanceUsed).toBe(0);
    });
  });

  // ==================== 解锁测试 ====================
  describe('解锁', () => {
    it('解锁神器应成功', () => {
      const result = unlockArtifact(state, 'art_sword_of_dawn');
      expect(result.success).toBe(true);
      expect(result.state.owned['art_sword_of_dawn']).toBeDefined();
      expect(result.state.owned['art_sword_of_dawn'].level).toBe(1);
    });

    it('重复解锁应失败', () => {
      const { state: s1 } = unlockArtifact(state, 'art_sword_of_dawn');
      const result = unlockArtifact(s1, 'art_sword_of_dawn');
      expect(result.success).toBe(false);
      expect(result.error).toContain('已拥有');
    });

    it('不存在的神器应失败', () => {
      const result = unlockArtifact(state, 'nonexistent');
      expect(result.success).toBe(false);
    });
  });

  // ==================== 强化测试 ====================
  describe('强化', () => {
    beforeEach(() => {
      const { state: s1 } = unlockArtifact(state, 'art_sword_of_dawn');
      state = s1;
    });

    it('添加经验应成功', () => {
      const result = enhanceArtifact(state, 'art_sword_of_dawn', 500);
      expect(result.success).toBe(true);
      expect(result.state.totalExp).toBe(500);
    });

    it('足够经验应升级', () => {
      const result = enhanceArtifact(state, 'art_sword_of_dawn', 10000);
      expect(result.success).toBe(true);
      expect(result.levelsGained).toBeGreaterThan(0);
      expect(result.state.owned['art_sword_of_dawn'].level).toBeGreaterThan(1);
    });

    it('满级不应继续升级', () => {
      const { state: s1 } = enhanceArtifact(state, 'art_sword_of_dawn', 999999999);
      const config = ARTIFACT_CONFIGS['art_sword_of_dawn'];
      expect(s1.owned['art_sword_of_dawn'].level).toBe(config.maxLevel);
      const result = enhanceArtifact(s1, 'art_sword_of_dawn', 1000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('最大等级');
    });

    it('未拥有的神器不能强化', () => {
      const result = enhanceArtifact(state, 'art_shield_of_earth', 1000);
      expect(result.success).toBe(false);
    });
  });

  // ==================== 装备测试 ====================
  describe('装备', () => {
    beforeEach(() => {
      let s = state;
      for (const id of ['art_sword_of_dawn', 'art_shield_of_earth', 'art_ring_of_fortune', 'art_crown_of_wisdom']) {
        const { state: ns } = unlockArtifact(s, id);
        s = ns;
      }
      state = s;
    });

    it('装备神器应成功', () => {
      const result = equipArtifact(state, 'art_sword_of_dawn');
      expect(result.success).toBe(true);
      expect(result.state.equipped).toContain('art_sword_of_dawn');
      expect(result.state.owned['art_sword_of_dawn'].isEquipped).toBe(true);
    });

    it('重复装备应失败', () => {
      const { state: s1 } = equipArtifact(state, 'art_sword_of_dawn');
      const result = equipArtifact(s1, 'art_sword_of_dawn');
      expect(result.success).toBe(false);
    });

    it('槽位已满应失败', () => {
      let s = state;
      s = equipArtifact(s, 'art_sword_of_dawn').state;
      s = equipArtifact(s, 'art_shield_of_earth').state;
      s = equipArtifact(s, 'art_ring_of_fortune').state;
      const result = equipArtifact(s, 'art_crown_of_wisdom');
      expect(result.success).toBe(false);
      expect(result.error).toContain('槽已满');
    });

    it('卸下神器应成功', () => {
      const { state: s1 } = equipArtifact(state, 'art_sword_of_dawn');
      const result = unequipArtifact(s1, 'art_sword_of_dawn');
      expect(result.success).toBe(true);
      expect(result.state.equipped).not.toContain('art_sword_of_dawn');
    });

    it('卸下未装备的应失败', () => {
      const result = unequipArtifact(state, 'art_sword_of_dawn');
      expect(result.success).toBe(false);
    });
  });

  // ==================== 效果计算测试 ====================
  describe('效果计算', () => {
    it('1级神器应返回基础效果', () => {
      const { state: s1 } = unlockArtifact(state, 'art_sword_of_dawn');
      const effects = getArtifactEffects(s1.owned['art_sword_of_dawn']);
      expect(effects.length).toBe(2);
      expect(effects[0].value).toBe(10); // 基础值
    });

    it('升级后效果应增强', () => {
      let s = unlockArtifact(state, 'art_sword_of_dawn').state;
      const effectsLv1 = getArtifactEffects(s.owned['art_sword_of_dawn']);
      s = enhanceArtifact(s, 'art_sword_of_dawn', 50000).state;
      const effectsHigher = getArtifactEffects(s.owned['art_sword_of_dawn']);
      expect(effectsHigher[0].value).toBeGreaterThan(effectsLv1[0].value);
    });

    it('2件共鸣应生效', () => {
      const resonance = getResonanceBonus(2);
      expect(resonance).toBeDefined();
      expect(resonance!.name).toBe('双重共鸣');
    });

    it('3件共鸣应覆盖2件', () => {
      const resonance = getResonanceBonus(3);
      expect(resonance).toBeDefined();
      expect(resonance!.name).toBe('三重共鸣');
    });

    it('1件无共鸣', () => {
      expect(getResonanceBonus(1)).toBeNull();
    });

    it('总效果应包含神器+共鸣', () => {
      let s = state;
      s = unlockArtifact(s, 'art_sword_of_dawn').state;
      s = unlockArtifact(s, 'art_shield_of_earth').state;
      s = equipArtifact(s, 'art_sword_of_dawn').state;
      s = equipArtifact(s, 'art_shield_of_earth').state;
      const effects = getTotalEffects(s);
      // 2神器效果 + 共鸣效果
      expect(effects.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('初始统计应全为0', () => {
      const stats = getArtifactStats(state);
      expect(stats.totalOwned).toBe(0);
      expect(stats.totalEquipped).toBe(0);
      expect(stats.resonance).toBeNull();
    });

    it('解锁后统计应更新', () => {
      let s = unlockArtifact(state, 'art_sword_of_dawn').state;
      s = unlockArtifact(s, 'art_shield_of_earth').state;
      s = equipArtifact(s, 'art_sword_of_dawn').state;
      const stats = getArtifactStats(s);
      expect(stats.totalOwned).toBe(2);
      expect(stats.totalEquipped).toBe(1);
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('同一天不重置', () => {
      state.dailyFreeEnhanceUsed = 3;
      const result = checkDailyReset(state);
      expect(result.dailyFreeEnhanceUsed).toBe(3);
    });

    it('跨天应重置', () => {
      state.dailyFreeEnhanceUsed = 5;
      state.lastResetDate = '2020-01-01';
      const result = checkDailyReset(state);
      expect(result.dailyFreeEnhanceUsed).toBe(0);
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('经验需求应递增', () => {
      expect(getExpForLevel(5)).toBeGreaterThan(getExpForLevel(1));
    });

    it('强化费用应递增', () => {
      expect(getEnhanceCost(10, 'rare')).toBeGreaterThan(getEnhanceCost(1, 'rare'));
    });

    it('高品质强化费用应更高', () => {
      expect(getEnhanceCost(5, 'mythic')).toBeGreaterThan(getEnhanceCost(5, 'rare'));
    });

    it('稀有度名称应返回中文', () => {
      expect(getRarityName('legendary')).toBe('传说');
      expect(getRarityName('mythic')).toBe('神话');
    });

    it('类型名称应返回中文', () => {
      expect(getTypeName('weapon')).toBe('武器');
      expect(getTypeName('relic')).toBe('圣物');
    });

    it('稀有度颜色应返回色值', () => {
      expect(getRarityColor('mythic')).toMatch(/^#/);
    });
  });

  // ==================== 数据导出导入 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportArtifactData(state);
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原', () => {
      let s = unlockArtifact(state, 'art_sword_of_dawn').state;
      const json = exportArtifactData(s);
      const imported = importArtifactData(json);
      expect(imported).toBeDefined();
      expect(imported!.owned['art_sword_of_dawn']).toBeDefined();
    });

    it('无效数据应返回null', () => {
      expect(importArtifactData('nope')).toBeNull();
      expect(importArtifactData('{}')).toBeNull();
    });
  });

  // ==================== 边界情况 ====================
  describe('边界情况', () => {
    it('未拥有的神器无法装备', () => {
      const result = equipArtifact(state, 'art_sword_of_dawn');
      expect(result.success).toBe(false);
    });

    it('不存在的神器效果应返回空', () => {
      const effects = getArtifactEffects({ artifactId: 'fake', level: 1, exp: 0, isEquipped: false, obtainedAt: 0, resonanceLevel: 0 });
      expect(effects).toHaveLength(0);
    });
  });
});
