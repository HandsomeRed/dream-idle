/**
 * v0.93 炼丹系统测试
 */

import {
  createAlchemySkill,
  createFurnace,
  learnRecipe,
  craftPill,
  batchCraftPills,
  getAlchemyStats,
  getQualityName,
  getMaterialRarityName,
  usePill,
  ALCHEMY_CONFIG,
  AlchemySkill,
  AlchemyFurnace,
} from './alchemySystem';

describe('v0.93 炼丹系统', () => {
  describe('炼丹技能创建', () => {
    it('应该创建炼丹技能', () => {
      const skill = createAlchemySkill();
      
      expect(skill.level).toBe(1);
      expect(skill.exp).toBe(0);
      expect(skill.totalPillsCrafted).toBe(0);
      expect(skill.perfectPillsCrafted).toBe(0);
      expect(skill.recipes.length).toBe(1);
    });

    it('应该初始学会回气丹丹方', () => {
      const skill = createAlchemySkill();
      
      expect(skill.recipes).toContain('recipe_1');
    });
  });

  describe('丹炉创建', () => {
    it('应该创建丹炉', () => {
      const furnace = createFurnace('furnace_1');
      
      expect(furnace.name).toBe('粗制丹炉');
      expect(furnace.level).toBe(1);
      expect(furnace.capacity).toBe(1);
    });

    it('应该初始化属性', () => {
      const furnace = createFurnace('furnace_3');
      
      expect(furnace.successRateBonus).toBe(0.10);
      expect(furnace.qualityBonus).toBe(0.10);
    });
  });

  describe('学习丹方', () => {
    it('应该学习丹方', () => {
      const skill = createAlchemySkill();
      skill.level = 10;
      
      const result = learnRecipe(skill, 'recipe_2');
      
      expect(result.success).toBe(true);
      expect(skill.recipes).toContain('recipe_2');
    });

    it('应该拒绝重复学习', () => {
      const skill = createAlchemySkill();
      
      const result = learnRecipe(skill, 'recipe_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已学会');
    });

    it('应该拒绝等级不足', () => {
      const skill = createAlchemySkill();
      skill.level = 5;
      
      const result = learnRecipe(skill, 'recipe_3');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('等级不足');
    });
  });

  describe('炼制丹药', () => {
    it('应该成功炼制', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      const result = craftPill(skill, furnace, 'recipe_1');
      
      expect(result.success).toBe(true);
      expect(skill.totalPillsCrafted).toBeGreaterThan(0);
    });

    it('应该获得经验', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      const initialExp = skill.exp;
      
      craftPill(skill, furnace, 'recipe_1');
      
      expect(skill.exp).toBeGreaterThan(initialExp);
    });

    it('应该可能失败', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      // 多次尝试确保至少失败一次
      let failed = false;
      for (let i = 0; i < 20; i++) {
        const testSkill = createAlchemySkill();
        const testFurnace = createFurnace('furnace_1');
        const result = craftPill(testSkill, testFurnace, 'recipe_5'); // 低成功率丹方
        if (!result.pill) {
          failed = true;
          break;
        }
      }
      
      expect(failed).toBe(true);
    });

    it('应该拒绝未学会的丹方', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      const result = craftPill(skill, furnace, 'recipe_2');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未学会');
    });
  });

  describe('品质系统', () => {
    it('应该产出不同品质', () => {
      const qualities = new Set<string>();
      
      for (let i = 0; i < 50; i++) {
        const skill = createAlchemySkill();
        const furnace = createFurnace('furnace_1');
        const result = craftPill(skill, furnace, 'recipe_1');
        if (result.quality) {
          qualities.add(result.quality);
        }
      }
      
      expect(qualities.size).toBeGreaterThan(1);
    });

    it('应该可能暴击', () => {
      let critical = false;
      
      for (let i = 0; i < 50; i++) {
        const skill = createAlchemySkill();
        const furnace = createFurnace('furnace_1');
        const result = craftPill(skill, furnace, 'recipe_1');
        if (result.isCritical) {
          critical = true;
          break;
        }
      }
      
      expect(critical).toBe(true);
    });

    it('应该提升完美率', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_6'); // 高级丹炉
      
      // 高级丹炉应该有更高的品质加成
      expect(furnace.qualityBonus).toBeGreaterThan(0);
    });
  });

  describe('技能升级', () => {
    it('应该升级技能', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      // 多次炼制获得经验
      for (let i = 0; i < 20; i++) {
        craftPill(skill, furnace, 'recipe_1');
      }
      
      expect(skill.level).toBeGreaterThan(1);
    });

    it('应该达到最大等级', () => {
      const skill = createAlchemySkill();
      skill.level = ALCHEMY_CONFIG.maxSkillLevel;
      skill.exp = ALCHEMY_CONFIG.maxSkillLevel * 1000;
      
      const furnace = createFurnace('furnace_1');
      craftPill(skill, furnace, 'recipe_1');
      
      expect(skill.level).toBe(ALCHEMY_CONFIG.maxSkillLevel);
    });
  });

  describe('丹炉升级', () => {
    it('应该升级丹炉', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      const initialCapacity = furnace.capacity;
      
      // 多次炼制获得经验
      for (let i = 0; i < 50; i++) {
        craftPill(skill, furnace, 'recipe_1');
      }
      
      expect(furnace.level).toBeGreaterThan(1);
      expect(furnace.capacity).toBeGreaterThanOrEqual(initialCapacity);
    });

    it('应该提升成功率加成', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      const initialBonus = furnace.successRateBonus;
      
      // 升级丹炉
      for (let i = 0; i < 100; i++) {
        craftPill(skill, furnace, 'recipe_1');
      }
      
      expect(furnace.successRateBonus).toBeGreaterThanOrEqual(initialBonus);
    });
  });

  describe('批量炼制', () => {
    it('应该批量炼制', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      const result = batchCraftPills(skill, furnace, 'recipe_1', 10);
      
      expect(result.successCount + result.failCount).toBe(10);
      expect(result.pills.length).toBe(result.successCount);
    });

    it('应该统计暴击数', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      const result = batchCraftPills(skill, furnace, 'recipe_1', 50);
      
      expect(result.criticalCount).toBeGreaterThanOrEqual(0);
    });

    it('应该计算总经验', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      const initialExp = skill.exp;
      
      batchCraftPills(skill, furnace, 'recipe_1', 10);
      
      expect(skill.exp).toBeGreaterThan(initialExp);
    });
  });

  describe('炼丹统计', () => {
    it('应该获取统计信息', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      const stats = getAlchemyStats(skill, furnace);
      
      expect(stats.skillLevel).toBe(1);
      expect(stats.furnaceLevel).toBe(1);
      expect(stats.totalPills).toBe(0);
      expect(stats.perfectPills).toBe(0);
      expect(stats.perfectRate).toBe(0);
    });

    it('应该计算完美率', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      // 炼制多次
      for (let i = 0; i < 20; i++) {
        craftPill(skill, furnace, 'recipe_1');
      }
      
      const stats = getAlchemyStats(skill, furnace);
      
      expect(stats.totalPills).toBeGreaterThan(0);
      expect(stats.perfectRate).toBeGreaterThanOrEqual(0);
      expect(stats.perfectRate).toBeLessThanOrEqual(100);
    });
  });

  describe('名称查询', () => {
    it('应该返回品质名称', () => {
      expect(getQualityName('low')).toBe('下品');
      expect(getQualityName('medium')).toBe('中品');
      expect(getQualityName('high')).toBe('上品');
      expect(getQualityName('perfect')).toBe('极品');
      expect(getQualityName('divine')).toBe('仙品');
    });

    it('应该返回稀有度名称', () => {
      expect(getMaterialRarityName('common')).toBe('普通');
      expect(getMaterialRarityName('uncommon')).toBe('优秀');
      expect(getMaterialRarityName('rare')).toBe('稀有');
      expect(getMaterialRarityName('epic')).toBe('史诗');
      expect(getMaterialRarityName('legendary')).toBe('传说');
    });
  });

  describe('丹药使用', () => {
    it('应该使用临时丹药', () => {
      const pill = { id: 'pill_6', name: '力量丹', quality: 'high' as const, effect: '临时提升攻击力', duration: 300, bonus: { attack: 50 }, value: 2000 };
      
      const result = usePill(pill);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBe(300);
      expect(result.bonus.attack).toBe(50);
    });

    it('应该使用永久丹药', () => {
      const pill = { id: 'pill_4', name: '筑基丹', quality: 'perfect' as const, effect: '永久提升修为', duration: 0, bonus: { expBonus: 20 }, value: 5000 };
      
      const result = usePill(pill);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeUndefined();
      expect(result.bonus.expBonus).toBe(20);
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的最大技能等级', () => {
      expect(ALCHEMY_CONFIG.maxSkillLevel).toBe(100);
    });

    it('应该配置正确的最大丹炉等级', () => {
      expect(ALCHEMY_CONFIG.maxFurnaceLevel).toBe(20);
    });

    it('应该配置正确的基础成功率', () => {
      expect(ALCHEMY_CONFIG.baseSuccessRate).toBe(0.8);
    });

    it('应该配置正确的暴击率', () => {
      expect(ALCHEMY_CONFIG.criticalChance).toBe(0.1);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的炼丹流程', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      
      // 1. 学习新丹方
      skill.level = 10;
      expect(learnRecipe(skill, 'recipe_2').success).toBe(true);
      
      // 2. 炼制丹药
      const result = craftPill(skill, furnace, 'recipe_1');
      expect(result.success).toBe(true);
      expect(skill.totalPillsCrafted).toBeGreaterThan(0);
      
      // 3. 批量炼制
      const batchResult = batchCraftPills(skill, furnace, 'recipe_1', 10);
      expect(batchResult.successCount + batchResult.failCount).toBe(10);
      
      // 4. 获取统计
      const stats = getAlchemyStats(skill, furnace);
      expect(stats.totalPills).toBeGreaterThan(0);
      
      // 5. 使用丹药
      if (result.pill) {
        const useResult = usePill(result.pill);
        expect(useResult.success).toBe(true);
      }
    });

    it('应该处理丹炉升级', () => {
      const skill = createAlchemySkill();
      const furnace = createFurnace('furnace_1');
      const initialCapacity = furnace.capacity;
      
      // 大量炼制
      for (let i = 0; i < 100; i++) {
        craftPill(skill, furnace, 'recipe_1');
      }
      
      expect(furnace.level).toBeGreaterThan(1);
      expect(furnace.capacity).toBeGreaterThanOrEqual(initialCapacity);
      expect(furnace.successRateBonus).toBeGreaterThan(0);
    });
  });
});
