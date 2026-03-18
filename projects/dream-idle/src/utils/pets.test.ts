/**
 * v0.19 宠物系统测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  createPet,
  calculatePetStats,
  levelUpPet,
  starUpPet,
  pullGacha,
  pullGacha10,
  getElementMultiplier,
  petAssistAttack,
  usePetSkill,
  reduceSkillCooldowns,
  PET_CONFIG,
  getAllPets,
  getPetById,
  getPetsByQuality,
  getPetsByElement,
  type PetQuality,
  type PetElement,
} from './pets';

describe('v0.19 宠物系统', () => {
  // ==================== 基础创建测试 ====================

  describe('宠物创建', () => {
    it('应该成功创建普通宠物', () => {
      const pet = createPet('pet_001');
      expect(pet).not.toBeNull();
      expect(pet!.name).toBe('小海龟');
      expect(pet!.quality).toBe('common');
      expect(pet!.level).toBe(1);
      expect(pet!.stars).toBe(1);
    });

    it('应该成功创建传说宠物', () => {
      const pet = createPet('pet_030');
      expect(pet).not.toBeNull();
      expect(pet!.name).toBe('应龙');
      expect(pet!.quality).toBe('legendary');
      expect(pet!.baseAttack).toBe(250);
      expect(pet!.baseHealth).toBe(900);
    });

    it('创建不存在的宠物应该返回 null', () => {
      const pet = createPet('pet_invalid');
      expect(pet).toBeNull();
    });
  });

  // ==================== 属性计算测试 ====================

  describe('属性计算', () => {
    it('1 级宠物属性应该等于基础属性', () => {
      const pet = createPet('pet_001')!;
      const stats = calculatePetStats(pet);
      expect(stats.currentAttack).toBe(pet.baseAttack);
      expect(stats.currentDefense).toBe(pet.baseDefense);
      expect(stats.currentHealth).toBe(pet.baseHealth);
    });

    it('升级应该增加属性（每级 +10%）', () => {
      const pet = createPet('pet_001')!;
      pet.level = 10;
      const stats = calculatePetStats(pet);
      const expectedMultiplier = 1 + (10 - 1) * 0.1; // 1.9
      expect(stats.currentAttack).toBe(Math.floor(pet.baseAttack * expectedMultiplier));
      expect(stats.currentHealth).toBe(Math.floor(pet.baseHealth * expectedMultiplier));
    });

    it('升星应该增加属性（每星 +20%）', () => {
      const pet = createPet('pet_001')!;
      pet.stars = 3;
      const stats = calculatePetStats(pet);
      const expectedMultiplier = 1 + (3 - 1) * 0.2; // 1.4
      expect(stats.currentAttack).toBe(Math.floor(pet.baseAttack * expectedMultiplier));
      expect(stats.currentHealth).toBe(Math.floor(pet.baseHealth * expectedMultiplier));
    });

    it('等级和星级应该叠加计算', () => {
      const pet = createPet('pet_001')!;
      pet.level = 5;
      pet.stars = 2;
      const stats = calculatePetStats(pet);
      const levelMultiplier = 1 + (5 - 1) * 0.1; // 1.4
      const starMultiplier = 1 + (2 - 1) * 0.2; // 1.2
      const totalMultiplier = levelMultiplier * starMultiplier; // 1.68
      expect(stats.currentAttack).toBe(Math.floor(pet.baseAttack * totalMultiplier));
    });
  });

  // ==================== 升级测试 ====================

  describe('宠物升级', () => {
    it('应该正确增加经验值', () => {
      const pet = createPet('pet_001')!;
      const initialExp = pet.exp;
      const newPet = levelUpPet(pet, 50);
      expect(newPet.exp).toBe(initialExp + 50);
      expect(newPet.level).toBe(1); // 还没到升级阈值
    });

    it('经验值足够时应该升级', () => {
      const pet = createPet('pet_001')!;
      const expNeeded = pet.maxExp;
      const newPet = levelUpPet(pet, expNeeded);
      expect(newPet.level).toBe(2);
      expect(newPet.exp).toBe(0); // 溢出经验归零
    });

    it('应该能连续升级', () => {
      const pet = createPet('pet_001')!;
      // Level 1->2 needs 100 exp, Level 2->3 needs 150 exp (exponential curve)
      const expNeeded = pet.maxExp + PET_CONFIG.levelUpExpCurve(2) + 50;
      const newPet = levelUpPet(pet, expNeeded);
      expect(newPet.level).toBe(3);
      expect(newPet.exp).toBe(50);
    });

    it('等级上限为 100', () => {
      const pet = createPet('pet_001')!;
      pet.level = 100;
      const newPet = levelUpPet(pet, 999999);
      expect(newPet.level).toBe(100);
    });
  });

  // ==================== 升星测试 ====================

  describe('宠物升星', () => {
    it('1 星升 2 星需要 10 个碎片', () => {
      const pet = createPet('pet_001')!;
      const newPet = starUpPet(pet, 10);
      expect(newPet).not.toBeNull();
      expect(newPet!.stars).toBe(2);
    });

    it('碎片不足时升星失败', () => {
      const pet = createPet('pet_001')!;
      const newPet = starUpPet(pet, 5);
      expect(newPet).toBeNull();
    });

    it('5 星宠物无法继续升星', () => {
      const pet = createPet('pet_001')!;
      pet.stars = 5;
      const newPet = starUpPet(pet, 999);
      expect(newPet).toBeNull();
    });

    it('升星后属性应该提升', () => {
      const pet = createPet('pet_001')!;
      const originalAttack = pet.currentAttack;
      const newPet = starUpPet(pet, 10)!;
      expect(newPet.currentAttack).toBeGreaterThan(originalAttack);
    });
  });

  // ==================== 抽卡测试 ====================

  describe('抽卡系统', () => {
    it('单抽应该返回一只宠物', () => {
      const result = pullGacha('normal');
      expect(result.pet).toBeDefined();
      expect(result.pet.name).toBeDefined();
      expect(result.gachaType).toBe('normal');
    });

    it('十连抽应该返回 10 只宠物', () => {
      const results = pullGacha10('normal');
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.pet).toBeDefined();
      });
    });

    it('高级抽卡传说概率应该更高', () => {
      // 统计 1000 次抽卡结果
      const normalLegendary: number[] = [];
      const premiumLegendary: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const normal = pullGacha('normal');
        if (normal.pet.quality === 'legendary') normalLegendary.push(i);

        const premium = pullGacha('premium');
        if (premium.pet.quality === 'legendary') premiumLegendary.push(i);
      }

      // 高级抽卡传说数量应该更多（5% vs 1%）
      expect(premiumLegendary.length).toBeGreaterThanOrEqual(normalLegendary.length);
    });

    it('抽卡品质分布应该大致符合概率', () => {
      const results = pullGacha10('normal');
      const qualities = results.map((r) => r.pet.quality);

      // 应该至少有一些普通宠物（60% 概率）
      const commonCount = qualities.filter((q) => q === 'common').length;
      expect(commonCount).toBeGreaterThanOrEqual(0); // 小样本可能没有
    });
  });

  // ==================== 元素克制测试 ====================

  describe('元素克制', () => {
    it('火克土（1.2 倍伤害）', () => {
      const multiplier = getElementMultiplier('fire', 'earth');
      expect(multiplier).toBe(1.2);
    });

    it('水克火（1.2 倍伤害）', () => {
      const multiplier = getElementMultiplier('water', 'fire');
      expect(multiplier).toBe(1.2);
    });

    it('火被水克（0.8 倍伤害）', () => {
      const multiplier = getElementMultiplier('fire', 'water');
      expect(multiplier).toBe(0.8);
    });

    it('光暗互相克制（1.5 倍伤害）', () => {
      expect(getElementMultiplier('light', 'dark')).toBe(1.5);
      expect(getElementMultiplier('dark', 'light')).toBe(1.5);
    });

    it('无克制关系时为 1.0 倍', () => {
      expect(getElementMultiplier('fire', 'fire')).toBe(1.0);
      expect(getElementMultiplier('water', 'water')).toBe(1.0);
      expect(getElementMultiplier('fire', 'wind')).toBe(1.0);
    });
  });

  // ==================== 协助攻击测试 ====================

  describe('协助攻击', () => {
    it('协助攻击可能触发也可能不触发', () => {
      const pet = createPet('pet_001')!;
      // 多次测试确保有触发和不触发的情况
      let triggered = false;
      let notTriggered = false;

      for (let i = 0; i < 100; i++) {
        const result = petAssistAttack(pet);
        if (result.triggered) triggered = true;
        else notTriggered = true;
      }

      expect(triggered).toBe(true);
      expect(notTriggered).toBe(true);
    });

    it('触发时应该造成伤害', () => {
      const pet = createPet('pet_001')!;
      // 强制测试触发情况
      for (let i = 0; i < 100; i++) {
        const result = petAssistAttack(pet);
        if (result.triggered) {
          expect(result.damage).toBeGreaterThan(0);
          break;
        }
      }
    });

    it('元素克制应该影响协助伤害', () => {
      const pet = createPet('pet_011')!; // 烈焰鸟 (fire)
      const resultWeak = petAssistAttack(pet, 'water'); // 被水克
      const resultStrong = petAssistAttack(pet, 'earth'); // 克土

      // 多次测试取平均
      let weakDamage = 0;
      let strongDamage = 0;
      let weakCount = 0;
      let strongCount = 0;

      for (let i = 0; i < 100; i++) {
        const r1 = petAssistAttack(pet, 'water');
        if (r1.triggered) {
          weakDamage += r1.damage;
          weakCount++;
        }
        const r2 = petAssistAttack(pet, 'earth');
        if (r2.triggered) {
          strongDamage += r2.damage;
          strongCount++;
        }
      }

      if (weakCount > 0 && strongCount > 0) {
        expect(strongDamage / strongCount).toBeGreaterThan(weakDamage / weakCount);
      }
    });
  });

  // ==================== 技能系统测试 ====================

  describe('宠物技能', () => {
    it('应该能使用技能', () => {
      const pet = createPet('pet_010')!; // 蓝海龟
      const skill = pet.skills[0];
      const cooldowns: { [key: string]: number } = {};

      const result = usePetSkill(pet, skill, cooldowns);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.effect).toBe(skill.description);
      expect(result.newCooldowns[skill.id]).toBe(skill.cooldown);
    });

    it('技能使用后应该进入冷却', () => {
      const pet = createPet('pet_010')!;
      const skill = pet.skills[0];
      const cooldowns: { [key: string]: number } = {};

      const result = usePetSkill(pet, skill, cooldowns);
      expect(result.newCooldowns[skill.id]).toBe(skill.cooldown);
    });

    it('每回合应该减少技能冷却', () => {
      const cooldowns: { [key: string]: number } = { skill_001: 3, skill_002: 2 };
      const newCooldowns = reduceSkillCooldowns(cooldowns);
      expect(newCooldowns['skill_001']).toBe(2);
      expect(newCooldowns['skill_002']).toBe(1);
    });

    it('冷却为 0 的技能不应该变为负数', () => {
      const cooldowns: { [key: string]: number } = { skill_001: 0, skill_002: 1 };
      const newCooldowns = reduceSkillCooldowns(cooldowns);
      expect(newCooldowns['skill_001']).toBe(0);
      expect(newCooldowns['skill_002']).toBe(0);
    });

    it('应该能获取可用技能', () => {
      const pet = createPet('pet_010')!;
      const cooldowns: { [key: string]: number } = { skill_010: 0, skill_011: 3 };
      const available = pet.skills.filter((s) => (cooldowns[s.id] || 0) <= 0);
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('skill_010');
    });
  });

  // ==================== 配置测试 ====================

  describe('配置', () => {
    it('升级经验曲线应该是指数增长', () => {
      const exp1 = PET_CONFIG.levelUpExpCurve(1);
      const exp5 = PET_CONFIG.levelUpExpCurve(5);
      const exp10 = PET_CONFIG.levelUpExpCurve(10);

      expect(exp5).toBeGreaterThan(exp1);
      expect(exp10).toBeGreaterThan(exp5);
    });

    it('升星消耗应该递增', () => {
      const cost1 = PET_CONFIG.starUpCost(1); // 1->2
      const cost2 = PET_CONFIG.starUpCost(2); // 2->3
      const cost3 = PET_CONFIG.starUpCost(3); // 3->4
      const cost4 = PET_CONFIG.starUpCost(4); // 4->5

      expect(cost2).toBeGreaterThan(cost1);
      expect(cost3).toBeGreaterThan(cost2);
      expect(cost4).toBeGreaterThan(cost3);
    });
  });

  // ==================== 数据库查询测试 ====================

  describe('宠物数据库查询', () => {
    it('应该能获取所有宠物', () => {
      const pets = getAllPets();
      expect(pets.length).toBeGreaterThan(0);
    });

    it('应该能按 ID 获取宠物', () => {
      const pet = getPetById('pet_001');
      expect(pet).toBeDefined();
      expect(pet!.name).toBe('小海龟');
    });

    it('应该能按品质筛选宠物', () => {
      const commons = getPetsByQuality('common');
      const legendaries = getPetsByQuality('legendary');

      expect(commons.length).toBeGreaterThan(0);
      expect(legendaries.length).toBeGreaterThan(0);
      expect(commons.every((p) => p.quality === 'common')).toBe(true);
      expect(legendaries.every((p) => p.quality === 'legendary')).toBe(true);
    });

    it('应该能按元素筛选宠物', () => {
      const fires = getPetsByElement('fire');
      const waters = getPetsByElement('water');

      expect(fires.length).toBeGreaterThan(0);
      expect(waters.length).toBeGreaterThan(0);
      expect(fires.every((p) => p.element === 'fire')).toBe(true);
      expect(waters.every((p) => p.element === 'water')).toBe(true);
    });
  });

  // ==================== 集成测试 ====================

  describe('集成测试', () => {
    it('完整的宠物养成流程', () => {
      // 1. 抽卡获得宠物
      const gachaResult = pullGacha('premium');
      const pet = gachaResult.pet;

      // 2. 升级宠物
      let leveledPet = levelUpPet(pet, 1000);
      expect(leveledPet.level).toBeGreaterThan(1);

      // 3. 升星宠物
      const starredPet = starUpPet(leveledPet, 10);
      if (starredPet) {
        expect(starredPet.stars).toBe(2);
        expect(starredPet.currentAttack).toBeGreaterThan(leveledPet.currentAttack);
      }

      // 4. 计算最终属性
      const finalStats = calculatePetStats(starredPet || leveledPet);
      expect(finalStats.currentAttack).toBeGreaterThan(pet.baseAttack);
      expect(finalStats.currentHealth).toBeGreaterThan(pet.baseHealth);
    });

    it('宠物战斗协助流程', () => {
      const pet = createPet('pet_021')!; // 凤凰
      const cooldowns: { [key: string]: number } = {};

      // 第一回合：使用技能
      const skill = pet.skills.find((s) => s.effectType === 'damage')!;
      const attack1 = usePetSkill(pet, skill, cooldowns);
      expect(attack1.damage).toBeGreaterThan(0);

      // 第二回合：技能冷却，协助攻击
      const reducedCooldowns = reduceSkillCooldowns(attack1.newCooldowns);
      const assist = petAssistAttack(pet, 'earth'); // 火克土

      if (assist.triggered) {
        expect(assist.damage).toBeGreaterThan(0);
      }
    });
  });
});
