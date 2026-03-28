/**
 * v0.91 宠物进化系统测试
 */

import {
  createPet,
  levelUpPet,
  starUpPet,
  evolvePet,
  learnPetSkill,
  upgradePetSkill,
  inheritSkills,
  improveAptitude,
  getPetScore,
  getPetStats,
  togglePetLock,
  getEvolutionTypeName,
  getQualityName,
  PET_CONFIG,
  Pet,
} from './petEvolutionSystem';

describe('v0.91 宠物进化系统', () => {
  describe('宠物创建', () => {
    it('应该创建宠物', () => {
      const pet = createPet('pet_1');
      
      expect(pet.id).toBeDefined();
      expect(pet.name).toBe('泡泡');
      expect(pet.level).toBe(1);
      expect(pet.star).toBe(1);
      expect(pet.evolutionStage).toBe(0);
    });

    it('应该初始化属性', () => {
      const pet = createPet('pet_1');
      
      expect(pet.attributes.attack).toBeGreaterThan(0);
      expect(pet.attributes.defense).toBeGreaterThan(0);
      expect(pet.attributes.health).toBeGreaterThan(0);
      expect(pet.attributes.speed).toBeGreaterThan(0);
      expect(pet.attributes.growth).toBeGreaterThan(1);
    });

    it('应该初始化资质', () => {
      const pet = createPet('pet_1');
      
      expect(pet.attributes.aptitude.attack).toBeGreaterThan(0);
      expect(pet.attributes.aptitude.defense).toBeGreaterThan(0);
      expect(pet.attributes.aptitude.health).toBeGreaterThan(0);
      expect(pet.attributes.aptitude.speed).toBeGreaterThan(0);
    });
  });

  describe('宠物升级', () => {
    it('应该升级宠物', () => {
      const pet = createPet('pet_1');
      const initialLevel = pet.level;
      
      const result = levelUpPet(pet, 100);
      
      expect(result.success).toBe(true);
      expect(pet.level).toBeGreaterThan(initialLevel);
    });

    it('应该增加属性', () => {
      const pet = createPet('pet_1');
      const initialAttack = pet.attributes.attack;
      
      levelUpPet(pet, 100);
      levelUpPet(pet, 100);
      
      expect(pet.attributes.attack).toBeGreaterThan(initialAttack);
    });

    it('应该拒绝超过最大等级', () => {
      const pet = createPet('pet_1');
      pet.level = PET_CONFIG.maxPetLevel;
      
      const result = levelUpPet(pet, 1000);
      
      expect(result.success).toBe(true);
      expect(result.leveledUp).toBeFalsy();
    });
  });

  describe('宠物升星', () => {
    it('应该升星', () => {
      const pet = createPet('pet_1');
      const initialStar = pet.star;
      
      const result = starUpPet(pet);
      
      expect(result.success).toBe(true);
      expect(pet.star).toBe(initialStar + 1);
    });

    it('应该提升成长率', () => {
      const pet = createPet('pet_1');
      const initialGrowth = pet.attributes.growth;
      
      starUpPet(pet);
      
      expect(pet.attributes.growth).toBeGreaterThan(initialGrowth);
    });

    it('应该拒绝超过最高星级', () => {
      const pet = createPet('pet_1');
      pet.star = PET_CONFIG.maxStar;
      
      const result = starUpPet(pet);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('最高星级');
    });
  });

  describe('宠物进化', () => {
    it('应该进化宠物', () => {
      const pet = createPet('pet_1');
      const cost = PET_CONFIG.evolutionCost.normal;
      
      const result = evolvePet(pet, 'normal', cost);
      
      expect(result.success).toBe(true);
      expect(pet.evolutionStage).toBe(1);
      expect(result.newForm).toBeDefined();
    });

    it('应该改变宠物名称', () => {
      const pet = createPet('pet_1');
      const initialName = pet.name;
      
      evolvePet(pet, 'normal', PET_CONFIG.evolutionCost.normal);
      
      expect(pet.name).not.toBe(initialName);
    });

    it('应该提升成长率', () => {
      const pet = createPet('pet_1');
      const initialGrowth = pet.attributes.growth;
      
      evolvePet(pet, 'normal', PET_CONFIG.evolutionCost.normal);
      
      expect(pet.attributes.growth).toBeGreaterThan(initialGrowth);
    });

    it('应该提升品质', () => {
      const pet = createPet('pet_1');
      const initialQuality = pet.quality;
      
      evolvePet(pet, 'normal', PET_CONFIG.evolutionCost.normal);
      evolvePet(pet, 'advance', PET_CONFIG.evolutionCost.advance);
      
      expect(pet.quality).not.toBe(initialQuality);
    });

    it('应该拒绝超过最高进化阶段', () => {
      const pet = createPet('pet_1');
      pet.evolutionStage = PET_CONFIG.maxEvolutionStage;
      
      const result = evolvePet(pet, 'normal', PET_CONFIG.evolutionCost.normal);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('最高进化阶段');
    });

    it('应该拒绝金币不足', () => {
      const pet = createPet('pet_1');
      
      const result = evolvePet(pet, 'normal', 100);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('需要');
    });
  });

  describe('技能学习', () => {
    it('应该学习技能', () => {
      const pet = createPet('pet_1');
      
      const result = learnPetSkill(pet, 'ps_1');
      
      expect(result.success).toBe(true);
      expect(pet.skills.length).toBe(1);
    });

    it('应该拒绝重复学习', () => {
      const pet = createPet('pet_1');
      learnPetSkill(pet, 'ps_1');
      
      const result = learnPetSkill(pet, 'ps_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已学会');
    });

    it('应该拒绝超过技能数量上限', () => {
      const pet = createPet('pet_1');
      
      learnPetSkill(pet, 'ps_1');
      learnPetSkill(pet, 'ps_2');
      learnPetSkill(pet, 'ps_3');
      learnPetSkill(pet, 'ps_4');
      
      const result = learnPetSkill(pet, 'ps_5');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('最多学习 4 个');
    });
  });

  describe('技能升级', () => {
    it('应该升级技能', () => {
      const pet = createPet('pet_1');
      learnPetSkill(pet, 'ps_1');
      
      const result = upgradePetSkill(pet, 'ps_1');
      
      expect(result.success).toBe(true);
      expect(pet.skills[0].level).toBe(2);
    });

    it('应该增强技能效果', () => {
      const pet = createPet('pet_1');
      learnPetSkill(pet, 'ps_1');
      const initialDamage = pet.skills[0].damage;
      
      upgradePetSkill(pet, 'ps_1');
      
      expect(pet.skills[0].damage).toBeGreaterThan(initialDamage!);
    });

    it('应该拒绝超过满级', () => {
      const pet = createPet('pet_1');
      learnPetSkill(pet, 'ps_1');
      pet.skills[0].level = 10;
      
      const result = upgradePetSkill(pet, 'ps_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('满级');
    });
  });

  describe('技能继承', () => {
    it('应该继承技能', () => {
      const sourcePet = createPet('pet_1');
      const targetPet = createPet('pet_2');
      
      learnPetSkill(sourcePet, 'ps_1');
      learnPetSkill(sourcePet, 'ps_2');
      
      const result = inheritSkills(sourcePet, targetPet);
      
      expect(result.success).toBe(true);
      expect(result.inheritedSkills.length).toBeGreaterThan(0);
    });

    it('应该保持继承标记', () => {
      const sourcePet = createPet('pet_1');
      const targetPet = createPet('pet_2');
      
      learnPetSkill(sourcePet, 'ps_1');
      inheritSkills(sourcePet, targetPet);
      
      const inheritedSkill = targetPet.skills.find(s => s.inherited);
      expect(inheritedSkill).toBeDefined();
    });

    it('应该拒绝超过技能上限', () => {
      const sourcePet = createPet('pet_1');
      const targetPet = createPet('pet_2');
      
      learnPetSkill(sourcePet, 'ps_1');
      learnPetSkill(sourcePet, 'ps_2');
      learnPetSkill(sourcePet, 'ps_3');
      learnPetSkill(sourcePet, 'ps_4');
      learnPetSkill(sourcePet, 'ps_5');
      
      learnPetSkill(targetPet, 'ps_6');
      learnPetSkill(targetPet, 'ps_7');
      learnPetSkill(targetPet, 'ps_8');
      learnPetSkill(targetPet, 'ps_1');
      
      const result = inheritSkills(sourcePet, targetPet);
      
      expect(result.inheritedSkills.length).toBe(0);
    });
  });

  describe('资质提升', () => {
    it('应该提升资质', () => {
      const pet = createPet('pet_1');
      const initialAptitude = pet.attributes.aptitude.attack;
      
      const result = improveAptitude(pet, 'attack', 10);
      
      expect(result.success).toBe(true);
      expect(pet.attributes.aptitude.attack).toBeGreaterThan(initialAptitude);
    });

    it('应该拒绝超过上限', () => {
      const pet = createPet('pet_1');
      pet.attributes.aptitude.attack = 100;
      
      const result = improveAptitude(pet, 'attack', 10);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('上限');
    });

    it('应该影响属性', () => {
      const pet = createPet('pet_1');
      const initialAptitude = pet.attributes.aptitude.attack;
      
      improveAptitude(pet, 'attack', 20);
      
      // 验证资质值增加
      expect(pet.attributes.aptitude.attack).toBeGreaterThan(initialAptitude);
    });
  });

  describe('宠物评分', () => {
    it('应该计算评分', () => {
      const pet = createPet('pet_1');
      
      const score = getPetScore(pet);
      
      expect(score).toBeGreaterThan(0);
    });

    it('应该随等级提高', () => {
      const pet1 = createPet('pet_1');
      const pet2 = createPet('pet_1');
      
      levelUpPet(pet2, 1000);
      
      expect(getPetScore(pet2)).toBeGreaterThan(getPetScore(pet1));
    });

    it('应该随星级提高', () => {
      const pet1 = createPet('pet_1');
      const pet2 = createPet('pet_1');
      
      starUpPet(pet2);
      
      expect(getPetScore(pet2)).toBeGreaterThan(getPetScore(pet1));
    });
  });

  describe('宠物统计', () => {
    it('应该获取统计信息', () => {
      const pet = createPet('pet_1');
      
      const stats = getPetStats(pet);
      
      expect(stats.level).toBe(1);
      expect(stats.star).toBe(1);
      expect(stats.evolutionStage).toBe(0);
      expect(stats.evolutionName).toBe('初始');
      expect(stats.quality).toBe('普通');
      expect(stats.score).toBeGreaterThan(0);
    });

    it('应该包含总属性', () => {
      const pet = createPet('pet_1');
      
      const stats = getPetStats(pet);
      
      expect(stats.totalAttributes).toBe(
        pet.attributes.attack + pet.attributes.defense + pet.attributes.health + pet.attributes.speed
      );
    });
  });

  describe('锁定系统', () => {
    it('应该锁定宠物', () => {
      const pet = createPet('pet_1');
      
      const result = togglePetLock(pet);
      
      expect(result.success).toBe(true);
      expect(pet.lockStatus).toBe(true);
    });

    it('应该解锁宠物', () => {
      const pet = createPet('pet_1');
      pet.lockStatus = true;
      
      const result = togglePetLock(pet);
      
      expect(result.success).toBe(true);
      expect(pet.lockStatus).toBe(false);
    });
  });

  describe('名称查询', () => {
    it('应该返回进化类型名称', () => {
      expect(getEvolutionTypeName('normal')).toBe('普通进化');
      expect(getEvolutionTypeName('advance')).toBe('高级进化');
      expect(getEvolutionTypeName('super')).toBe('超级进化');
      expect(getEvolutionTypeName('ultimate')).toBe('终极进化');
    });

    it('应该返回品质名称', () => {
      expect(getQualityName('common')).toBe('普通');
      expect(getQualityName('uncommon')).toBe('优秀');
      expect(getQualityName('rare')).toBe('稀有');
      expect(getQualityName('epic')).toBe('史诗');
      expect(getQualityName('legendary')).toBe('传说');
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的最大等级', () => {
      expect(PET_CONFIG.maxPetLevel).toBe(100);
    });

    it('应该配置正确的最高星级', () => {
      expect(PET_CONFIG.maxStar).toBe(5);
    });

    it('应该配置正确的进化消耗', () => {
      expect(PET_CONFIG.evolutionCost.normal).toBe(10000);
      expect(PET_CONFIG.evolutionCost.advance).toBe(50000);
      expect(PET_CONFIG.evolutionCost.super).toBe(200000);
      expect(PET_CONFIG.evolutionCost.ultimate).toBe(1000000);
    });

    it('应该配置正确的继承概率', () => {
      expect(PET_CONFIG.skillInheritChance).toBe(0.7);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的宠物培养流程', () => {
      const pet = createPet('pet_1');
      
      // 1. 升级
      levelUpPet(pet, 100);
      expect(pet.level).toBeGreaterThan(1);
      
      // 2. 升星
      starUpPet(pet);
      expect(pet.star).toBe(2);
      
      // 3. 学习技能
      learnPetSkill(pet, 'ps_1');
      learnPetSkill(pet, 'ps_2');
      expect(pet.skills.length).toBe(2);
      
      // 4. 升级技能
      upgradePetSkill(pet, 'ps_1');
      expect(pet.skills[0].level).toBe(2);
      
      // 5. 进化
      evolvePet(pet, 'normal', PET_CONFIG.evolutionCost.normal);
      expect(pet.evolutionStage).toBe(1);
      
      // 6. 提升资质
      improveAptitude(pet, 'attack', 10);
      expect(pet.attributes.aptitude.attack).toBeGreaterThan(80);
      
      // 7. 获取统计
      const stats = getPetStats(pet);
      expect(stats.level).toBeGreaterThan(1);
      expect(stats.star).toBe(2);
      expect(stats.evolutionStage).toBe(1);
      expect(stats.skillCount).toBe(2);
      
      // 8. 锁定
      togglePetLock(pet);
      expect(pet.lockStatus).toBe(true);
    });

    it('应该处理技能继承', () => {
      const sourcePet = createPet('pet_1');
      const targetPet = createPet('pet_2');
      
      // 源宠物学习多个技能
      learnPetSkill(sourcePet, 'ps_1');
      learnPetSkill(sourcePet, 'ps_3');
      learnPetSkill(sourcePet, 'ps_5');
      
      // 继承
      const result = inheritSkills(sourcePet, targetPet);
      
      expect(result.success).toBe(true);
      expect(targetPet.skills.length).toBeGreaterThan(0);
      
      // 验证继承标记
      const inheritedSkills = targetPet.skills.filter(s => s.inherited);
      expect(inheritedSkills.length).toBeGreaterThan(0);
    });
  });
});
