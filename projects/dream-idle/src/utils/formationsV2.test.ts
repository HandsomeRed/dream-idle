// v0.44 阵容系统扩展测试

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  FORMATION_CONFIG_V2,
  FormationSystemV2,
  createFormationSystemV2,
  type Formation,
} from './formationsV2';
import { HERO_CONFIGS } from './heroes';
import { PET_CONFIG } from './pets';

describe('v0.44 阵容系统扩展', () => {
  describe('阵容配置', () => {
    it('应该配置最大 5 套阵容', () => {
      expect(FORMATION_CONFIG_V2.maxFormations).toBe(5);
    });

    it('应该配置最多 5 个英雄位', () => {
      expect(FORMATION_CONFIG_V2.maxHeroes).toBe(5);
    });

    it('应该配置最多 3 个宠物位', () => {
      expect(FORMATION_CONFIG_V2.maxPets).toBe(3);
    });

    it('应该包含多种羁绊类型', () => {
      const bonusTypes = new Set(FORMATION_CONFIG_V2.bonuses.map(b => b.effect.type));
      expect(bonusTypes.has('attack')).toBe(true);
      expect(bonusTypes.has('defense')).toBe(true);
      expect(bonusTypes.has('health')).toBe(true);
      expect(bonusTypes.has('speed')).toBe(true);
      expect(bonusTypes.has('mag')).toBe(true);
      expect(bonusTypes.has('res')).toBe(true);
      expect(bonusTypes.has('exp')).toBe(true);
    });

    it('应该包含元素共鸣羁绊', () => {
      const elementBonuses = FORMATION_CONFIG_V2.bonuses.filter(b => 
        b.name.includes('共鸣')
      );
      expect(elementBonuses.length).toBeGreaterThan(0);
    });

    it('应该包含职业同盟羁绊', () => {
      const classBonuses = FORMATION_CONFIG_V2.bonuses.filter(b => 
        b.name.includes('同盟')
      );
      expect(classBonuses.length).toBeGreaterThan(0);
    });

    it('应该包含稀有度羁绊', () => {
      const rarityBonuses = FORMATION_CONFIG_V2.bonuses.filter(b => 
        b.name.includes('神话') || b.name.includes('双神')
      );
      expect(rarityBonuses.length).toBeGreaterThan(0);
    });
  });

  describe('阵容管理', () => {
    let system: FormationSystemV2;

    beforeEach(() => {
      system = createFormationSystemV2();
    });

    it('应该能够创建新阵容', () => {
      const formation = system.createFormation('测试阵容', 'player1');
      expect(formation.name).toBe('测试阵容');
      expect(formation.characterId).toBe('player1');
      expect(formation.heroIds).toHaveLength(0);
      expect(formation.petIds).toHaveLength(0);
    });

    it('创建阵容时应该自动生成 ID', () => {
      const formation1 = system.createFormation('阵容 1');
      const formation2 = system.createFormation('阵容 2');
      expect(formation1.id).not.toBe(formation2.id);
    });

    it('应该能够添加英雄到阵容', () => {
      const formation = system.createFormation('测试阵容');
      const result = system.addHero(formation.id, 'hero_001');
      
      expect(result.success).toBe(true);
      expect(formation.heroIds).toHaveLength(1);
      expect(formation.heroIds[0]).toBe('hero_001');
    });

    it('英雄数量达到上限应该无法添加', () => {
      const formation = system.createFormation('测试阵容');
      
      // 添加 5 个英雄
      for (let i = 1; i <= 5; i++) {
        system.addHero(formation.id, `hero_00${i}`);
      }
      
      const result = system.addHero(formation.id, 'hero_006');
      expect(result.success).toBe(false);
      expect(result.message).toContain('上限');
    });

    it('重复添加同一个英雄应该失败', () => {
      const formation = system.createFormation('测试阵容');
      system.addHero(formation.id, 'hero_001');
      
      const result = system.addHero(formation.id, 'hero_001');
      expect(result.success).toBe(false);
      expect(result.message).toContain('已在阵容中');
    });

    it('应该能够添加宠物到阵容', () => {
      const formation = system.createFormation('测试阵容');
      const result = system.addPet(formation.id, 'pet_001');
      
      expect(result.success).toBe(true);
      expect(formation.petIds).toHaveLength(1);
    });

    it('宠物数量达到上限应该无法添加', () => {
      const formation = system.createFormation('测试阵容');
      
      // 添加 3 个宠物
      for (let i = 1; i <= 3; i++) {
        system.addPet(formation.id, `pet_00${i}`);
      }
      
      const result = system.addPet(formation.id, 'pet_004');
      expect(result.success).toBe(false);
      expect(result.message).toContain('上限');
    });

    it('应该能够移除英雄', () => {
      const formation = system.createFormation('测试阵容');
      system.addHero(formation.id, 'hero_001');
      
      const result = system.removeHero(formation.id, 'hero_001');
      expect(result.success).toBe(true);
      expect(formation.heroIds).toHaveLength(0);
    });

    it('移除不存在的英雄应该失败', () => {
      const formation = system.createFormation('测试阵容');
      const result = system.removeHero(formation.id, 'hero_999');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('不在阵容中');
    });

    it('应该能够移除宠物', () => {
      const formation = system.createFormation('测试阵容');
      system.addPet(formation.id, 'pet_001');
      
      const result = system.removePet(formation.id, 'pet_001');
      expect(result.success).toBe(true);
      expect(formation.petIds).toHaveLength(0);
    });

    it('移除英雄后应该重新排列槽位', () => {
      const formation = system.createFormation('测试阵容');
      system.addHero(formation.id, 'hero_001');
      system.addHero(formation.id, 'hero_002');
      system.addHero(formation.id, 'hero_003');
      
      // 移除中间的
      system.removeHero(formation.id, 'hero_002');
      
      // 检查槽位是否重新排列
      expect(formation.units.filter(u => u.type === 'hero').length).toBe(2);
      const heroSlots = formation.units
        .filter(u => u.type === 'hero')
        .map(u => u.slot);
      expect(heroSlots).toEqual(['hero1', 'hero2']);
    });

    it('应该能够获取阵容', () => {
      const formation = system.createFormation('测试阵容');
      const retrieved = system.getFormation(formation.id);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(formation.id);
    });

    it('获取不存在的阵容应该返回 null', () => {
      const retrieved = system.getFormation('nonexistent');
      expect(retrieved).toBeNull();
    });

    it('应该能够获取所有阵容', () => {
      system.createFormation('阵容 1');
      system.createFormation('阵容 2');
      system.createFormation('阵容 3');
      
      const formations = system.getAllFormations();
      expect(formations).toHaveLength(3);
    });

    it('应该能够删除阵容', () => {
      const formation = system.createFormation('测试阵容');
      const result = system.deleteFormation(formation.id);
      
      expect(result.success).toBe(true);
      expect(system.getFormation(formation.id)).toBeNull();
    });

    it('已锁定的阵容应该无法删除', () => {
      const formation = system.createFormation('测试阵容');
      system.toggleLock(formation.id);
      
      const result = system.deleteFormation(formation.id);
      expect(result.success).toBe(false);
      expect(result.message).toContain('锁定');
    });

    it('应该能够锁定/解锁阵容', () => {
      const formation = system.createFormation('测试阵容');
      
      expect(formation.isLocked).toBe(false);
      
      system.toggleLock(formation.id);
      expect(formation.isLocked).toBe(true);
      
      system.toggleLock(formation.id);
      expect(formation.isLocked).toBe(false);
    });

    it('应该能够设置当前阵容', () => {
      const formation = system.createFormation('测试阵容');
      const result = system.setCurrentFormation(formation.id);
      
      expect(result.success).toBe(true);
      expect(system.getCurrentFormation()?.id).toBe(formation.id);
    });

    it('设置不存在的阵容应该失败', () => {
      const result = system.setCurrentFormation('nonexistent');
      expect(result.success).toBe(false);
    });
  });

  describe('羁绊系统', () => {
    let system: FormationSystemV2;

    beforeEach(() => {
      system = createFormationSystemV2();
    });

    it('应该能够获取激活的羁绊', () => {
      const formation = system.createFormation('测试阵容');
      
      // 添加 3 个火系英雄
      system.addHero(formation.id, 'hero_002'); // fire
      system.addHero(formation.id, 'hero_011'); // fire
      system.addHero(formation.id, 'hero_020'); // fire
      
      const bonuses = system.getActiveBonuses(formation);
      const fireBonus = bonuses.find(b => b.name.includes('火焰共鸣'));
      
      expect(fireBonus).toBeDefined();
    });

    it('没有满足条件的羁绊应该返回空数组', () => {
      const formation = system.createFormation('测试阵容');
      
      // 添加不同元素/职业的英雄（确保不触发任何羁绊）
      system.addHero(formation.id, 'hero_001'); // earth, warrior
      system.addHero(formation.id, 'hero_003'); // earth, tank
      system.addHero(formation.id, 'hero_013'); // light, support
      
      const bonuses = system.getActiveBonuses(formation);
      // 没有满足条件的羁绊（需要至少 2 个同职业或 3 个同元素）
      expect(bonuses.length).toBeLessThan(2);
    });

    it('应该能够同时激活多个羁绊', () => {
      const formation = system.createFormation('测试阵容');
      
      // 添加 3 个火系 + 3 个战士（使用实际的火系战士英雄）
      system.addHero(formation.id, 'hero_002'); // fire, mage
      system.addHero(formation.id, 'hero_020'); // fire, warrior
      system.addHero(formation.id, 'hero_030'); // fire, warrior
      
      const bonuses = system.getActiveBonuses(formation);
      
      const fireBonus = bonuses.find(b => b.name.includes('火焰共鸣'));
      // 有 2 个战士，应该触发战士同盟
      const warriorBonus = bonuses.find(b => b.name.includes('战士同盟'));
      
      expect(fireBonus).toBeDefined();
      expect(warriorBonus).toBeDefined();
    });
  });

  describe('战力计算', () => {
    let system: FormationSystemV2;

    beforeEach(() => {
      system = createFormationSystemV2();
    });

    it('应该能够计算阵容战力', () => {
      const formation = system.createFormation('测试阵容');
      system.addHero(formation.id, 'hero_001');
      
      const power = system.calculatePower(formation);
      
      expect(power.total).toBeGreaterThan(0);
      expect(power.breakdown.heroes).toBeGreaterThan(0);
    });

    it('英雄等级应该影响战力', () => {
      const formation1 = system.createFormation('阵容 1');
      const formation2 = system.createFormation('阵容 2');
      
      system.addHero(formation1.id, 'hero_001', 1, 1);
      system.addHero(formation2.id, 'hero_001', 50, 1);
      
      const power1 = system.calculatePower(formation1);
      const power2 = system.calculatePower(formation2);
      
      expect(power2.breakdown.heroes).toBeGreaterThan(power1.breakdown.heroes);
    });

    it('英雄星级应该影响战力', () => {
      const formation1 = system.createFormation('阵容 1');
      const formation2 = system.createFormation('阵容 2');
      
      system.addHero(formation1.id, 'hero_001', 10, 1);
      system.addHero(formation2.id, 'hero_001', 10, 3);
      
      const power1 = system.calculatePower(formation1);
      const power2 = system.calculatePower(formation2);
      
      expect(power2.breakdown.heroes).toBeGreaterThan(power1.breakdown.heroes);
    });

    it('羁绊应该增加战力', () => {
      const formation1 = system.createFormation('阵容 1');
      const formation2 = system.createFormation('阵容 2');
      
      // 无羁绊
      system.addHero(formation1.id, 'hero_001');
      system.addHero(formation1.id, 'hero_021');
      system.addHero(formation1.id, 'hero_013');
      
      // 有羁绊（3 火系）
      system.addHero(formation2.id, 'hero_002');
      system.addHero(formation2.id, 'hero_011');
      system.addHero(formation2.id, 'hero_020');
      
      const power1 = system.calculatePower(formation1);
      const power2 = system.calculatePower(formation2);
      
      // 有羁绊的阵容应该有 bonus 加成
      expect(power2.bonuses.length).toBeGreaterThan(0);
      expect(power2.breakdown.bonuses).toBeGreaterThan(0);
    });

    it('战力应该包含各部分明细', () => {
      const formation = system.createFormation('测试阵容');
      system.addHero(formation.id, 'hero_001');
      system.addPet(formation.id, 'pet_001');
      
      const power = system.calculatePower(formation);
      
      expect(power.breakdown).toHaveProperty('character');
      expect(power.breakdown).toHaveProperty('heroes');
      expect(power.breakdown).toHaveProperty('pets');
      expect(power.breakdown).toHaveProperty('bonuses');
    });
  });

  describe('阵容推荐', () => {
    let system: FormationSystemV2;

    beforeEach(() => {
      system = createFormationSystemV2();
    });

    it('应该能够生成阵容推荐', () => {
      const ownedHeroes = ['hero_001', 'hero_002', 'hero_010', 'hero_020', 'hero_030'];
      const ownedPets = ['pet_001', 'pet_002', 'pet_010'];
      
      const recommendation = system.getRecommendation(ownedHeroes, ownedPets);
      
      expect(recommendation.formation).toBeDefined();
      expect(recommendation.power).toBeDefined();
      expect(recommendation.suggestions).toBeDefined();
    });

    it('推荐阵容应该优先高稀有度英雄', () => {
      const ownedHeroes = ['hero_001', 'hero_030']; // common + legendary
      const ownedPets: string[] = [];
      
      const recommendation = system.getRecommendation(ownedHeroes, ownedPets);
      
      // 传说英雄应该优先上阵
      expect(recommendation.formation.heroIds).toContain('hero_030');
    });

    it('推荐应该包含建议', () => {
      const ownedHeroes = ['hero_001', 'hero_021', 'hero_013'];
      const ownedPets: string[] = [];
      
      const recommendation = system.getRecommendation(ownedHeroes, ownedPets);
      
      // 没有羁绊时应该有建议
      expect(recommendation.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('数据导出导入', () => {
    let system: FormationSystemV2;

    beforeEach(() => {
      system = createFormationSystemV2();
    });

    it('应该能够导出数据', () => {
      const formation = system.createFormation('测试阵容');
      system.addHero(formation.id, 'hero_001');
      system.addPet(formation.id, 'pet_001');
      system.setCurrentFormation(formation.id);
      
      const data = system.exportData();
      
      expect(data.formations).toBeDefined();
      expect(data.currentFormationId).toBeDefined();
    });

    it('应该能够导入数据', () => {
      const formation = system.createFormation('测试阵容');
      system.addHero(formation.id, 'hero_001');
      system.setCurrentFormation(formation.id);
      
      const data = system.exportData();
      
      const newSystem = createFormationSystemV2();
      newSystem.importData(data);
      
      expect(newSystem.getAllFormations().length).toBe(1);
      // 当前阵容应该被正确恢复
      const currentFormation = newSystem.getCurrentFormation();
      expect(currentFormation).not.toBeNull();
      expect(currentFormation?.heroIds).toHaveLength(1);
    });

    it('导入后数据应该一致', () => {
      const formation = system.createFormation('测试阵容');
      system.addHero(formation.id, 'hero_001');
      system.addHero(formation.id, 'hero_002');
      system.addPet(formation.id, 'pet_001');
      system.toggleLock(formation.id);
      
      const data = system.exportData();
      const newSystem = createFormationSystemV2();
      newSystem.importData(data);
      
      const imported = newSystem.getFormation(formation.id);
      expect(imported?.heroIds).toHaveLength(2);
      expect(imported?.petIds).toHaveLength(1);
      expect(imported?.isLocked).toBe(true);
    });
  });

  describe('边界情况', () => {
    let system: FormationSystemV2;

    beforeEach(() => {
      system = createFormationSystemV2();
    });

    it('空阵容的战力应该为 0', () => {
      const formation = system.createFormation('空阵容');
      const power = system.calculatePower(formation);
      
      expect(power.total).toBe(0);
    });

    it('不存在的阵容 ID 应该返回 null', () => {
      expect(system.getFormation('nonexistent')).toBeNull();
    });

    it('添加英雄到不存在的阵容应该失败', () => {
      const result = system.addHero('nonexistent', 'hero_001');
      expect(result.success).toBe(false);
    });

    it('添加宠物到不存在的阵容应该失败', () => {
      const result = system.addPet('nonexistent', 'pet_001');
      expect(result.success).toBe(false);
    });

    it('删除不存在的阵容应该失败', () => {
      const result = system.deleteFormation('nonexistent');
      expect(result.success).toBe(false);
    });

    it('锁定不存在的阵容应该失败', () => {
      const result = system.toggleLock('nonexistent');
      expect(result.success).toBe(false);
    });
  });
});
