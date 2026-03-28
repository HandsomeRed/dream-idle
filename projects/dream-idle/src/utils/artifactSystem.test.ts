/**
 * v0.92 法宝系统测试
 */

import {
  createMagicArtifact,
  levelUpArtifact,
  starUpArtifact,
  refineArtifact,
  learnArtifactSkill,
  upgradeArtifactSkill,
  fuseArtifacts,
  getArtifactScore,
  getArtifactStats,
  getQualityName,
  getArtifactTypeName,
  toggleArtifactLock,
  ARTIFACT_CONFIG,
  MagicArtifact,
} from './artifactSystem';

describe('v0.92 法宝系统', () => {
  describe('法宝创建', () => {
    it('应该创建法宝', () => {
      const artifact = createMagicArtifact('ma_1');
      
      expect(artifact.id).toBeDefined();
      expect(artifact.name).toBe('诛仙剑');
      expect(artifact.level).toBe(1);
      expect(artifact.star).toBe(1);
      expect(artifact.refinement).toBe(0);
    });

    it('应该初始化属性', () => {
      const artifact = createMagicArtifact('ma_1');
      
      expect(artifact.attributes.attack).toBe(100);
      expect(artifact.attributes.defense).toBe(20);
      expect(artifact.attributes.health).toBe(50);
    });

    it('应该初始化品质', () => {
      const artifact = createMagicArtifact('ma_1');
      
      expect(artifact.quality).toBe('mortal');
    });
  });

  describe('法宝升级', () => {
    it('应该升级法宝', () => {
      const artifact = createMagicArtifact('ma_1');
      const initialLevel = artifact.level;
      
      const result = levelUpArtifact(artifact, 100);
      
      expect(result.success).toBe(true);
      expect(artifact.level).toBeGreaterThan(initialLevel);
    });

    it('应该增加属性', () => {
      const artifact = createMagicArtifact('ma_1');
      const initialAttack = artifact.attributes.attack;
      
      levelUpArtifact(artifact, 100);
      levelUpArtifact(artifact, 100);
      
      expect(artifact.attributes.attack).toBeGreaterThan(initialAttack);
    });

    it('应该拒绝超过最大等级', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.level = ARTIFACT_CONFIG.maxArtifactLevel;
      
      const result = levelUpArtifact(artifact, 1000);
      
      expect(result.success).toBe(true);
      expect(result.leveledUp).toBeFalsy();
    });
  });

  describe('法宝升星', () => {
    it('应该升星', () => {
      const artifact = createMagicArtifact('ma_1');
      
      const result = starUpArtifact(artifact, 'mat_1');
      
      expect(result.success).toBe(true);
      expect(artifact.star).toBe(2);
    });

    it('应该大幅提升属性', () => {
      const artifact = createMagicArtifact('ma_1');
      const initialAttack = artifact.attributes.attack;
      
      starUpArtifact(artifact, 'mat_1');
      
      expect(artifact.attributes.attack).toBeGreaterThan(initialAttack);
    });

    it('应该拒绝超过最高品阶', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.star = ARTIFACT_CONFIG.maxStar;
      
      const result = starUpArtifact(artifact, 'mat_5');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('最高品阶');
    });

    it('应该拒绝材料品阶不足', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.star = 4;
      
      const result = starUpArtifact(artifact, 'mat_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('品阶不足');
    });
  });

  describe('法宝炼化', () => {
    it('应该炼化法宝', () => {
      const artifact = createMagicArtifact('ma_1');
      const cost = ARTIFACT_CONFIG.refineCost;
      
      const result = refineArtifact(artifact, cost);
      
      expect(result.success).toBe(true);
      expect(artifact.refinement).toBeGreaterThan(0);
      expect(result.refinementGain).toBeGreaterThan(0);
    });

    it('应该提升属性', () => {
      const artifact = createMagicArtifact('ma_1');
      const initialAttack = artifact.attributes.attack;
      
      for (let i = 0; i < 10; i++) {
        refineArtifact(artifact, ARTIFACT_CONFIG.refineCost);
      }
      
      expect(artifact.attributes.attack).toBeGreaterThan(initialAttack);
    });

    it('应该拒绝超过最大炼化度', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.refinement = ARTIFACT_CONFIG.maxRefinement;
      
      const result = refineArtifact(artifact, ARTIFACT_CONFIG.refineCost);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('最大炼化度');
    });

    it('应该拒绝金币不足', () => {
      const artifact = createMagicArtifact('ma_1');
      
      const result = refineArtifact(artifact, 100);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('需要');
    });
  });

  describe('技能学习', () => {
    it('应该学习技能', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.level = 50;
      
      const result = learnArtifactSkill(artifact, 'as_1');
      
      expect(result.success).toBe(true);
      expect(artifact.skills.length).toBe(1);
    });

    it('应该拒绝重复学习', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.level = 50;
      learnArtifactSkill(artifact, 'as_1');
      
      const result = learnArtifactSkill(artifact, 'as_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已学会');
    });

    it('应该拒绝超过技能数量上限', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.level = 100;
      
      learnArtifactSkill(artifact, 'as_1');
      learnArtifactSkill(artifact, 'as_2');
      learnArtifactSkill(artifact, 'as_3');
      learnArtifactSkill(artifact, 'as_4');
      
      const result = learnArtifactSkill(artifact, 'as_5');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('最多学习 4 个');
    });

    it('应该拒绝等级不足', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.level = 10;
      
      const result = learnArtifactSkill(artifact, 'as_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('等级不足');
    });
  });

  describe('技能升级', () => {
    it('应该升级技能', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.level = 50;
      learnArtifactSkill(artifact, 'as_1');
      
      const result = upgradeArtifactSkill(artifact, 'as_1');
      
      expect(result.success).toBe(true);
      expect(artifact.skills[0].level).toBe(2);
    });

    it('应该增强技能效果', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.level = 50;
      learnArtifactSkill(artifact, 'as_1');
      const initialDamage = artifact.skills[0].damage;
      
      upgradeArtifactSkill(artifact, 'as_1');
      
      expect(artifact.skills[0].damage).toBeGreaterThan(initialDamage!);
    });

    it('应该拒绝超过满级', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.level = 50;
      learnArtifactSkill(artifact, 'as_1');
      artifact.skills[0].level = 10;
      
      const result = upgradeArtifactSkill(artifact, 'as_1');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('满级');
    });
  });

  describe('法宝融合', () => {
    it('应该融合成功', () => {
      const sourceArtifact = createMagicArtifact('ma_1');
      const targetArtifact = createMagicArtifact('ma_1');
      
      const result = fuseArtifacts(sourceArtifact, targetArtifact);
      
      expect(result.success).toBe(true);
      expect(targetArtifact.star).toBeGreaterThan(1);
    });

    it('应该拒绝不同类型融合', () => {
      const sourceArtifact = createMagicArtifact('ma_1'); // attack
      const targetArtifact = createMagicArtifact('ma_2'); // defense
      
      const result = fuseArtifacts(sourceArtifact, targetArtifact);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('同类型');
    });

    it('可能继承技能', () => {
      const sourceArtifact = createMagicArtifact('ma_1');
      const targetArtifact = createMagicArtifact('ma_1');
      sourceArtifact.level = 50;
      learnArtifactSkill(sourceArtifact, 'as_1');
      
      // 多次尝试确保至少一次成功融合
      let inherited = false;
      for (let i = 0; i < 10; i++) {
        const testSource = createMagicArtifact('ma_1');
        const testTarget = createMagicArtifact('ma_1');
        testSource.level = 50;
        learnArtifactSkill(testSource, 'as_1');
        
        const result = fuseArtifacts(testSource, testTarget);
        if (result.fused && testTarget.skills.length > 0) {
          inherited = true;
          break;
        }
      }
      
      expect(inherited).toBe(true);
    });
  });

  describe('法宝评分', () => {
    it('应该计算评分', () => {
      const artifact = createMagicArtifact('ma_1');
      
      const score = getArtifactScore(artifact);
      
      expect(score).toBeGreaterThan(0);
    });

    it('应该随等级提高', () => {
      const artifact1 = createMagicArtifact('ma_1');
      const artifact2 = createMagicArtifact('ma_1');
      
      levelUpArtifact(artifact2, 1000);
      
      expect(getArtifactScore(artifact2)).toBeGreaterThan(getArtifactScore(artifact1));
    });

    it('应该随品阶提高', () => {
      const artifact1 = createMagicArtifact('ma_1');
      const artifact2 = createMagicArtifact('ma_1');
      
      starUpArtifact(artifact2, 'mat_1');
      
      expect(getArtifactScore(artifact2)).toBeGreaterThan(getArtifactScore(artifact1));
    });
  });

  describe('法宝统计', () => {
    it('应该获取统计信息', () => {
      const artifact = createMagicArtifact('ma_1');
      
      const stats = getArtifactStats(artifact);
      
      expect(stats.level).toBe(1);
      expect(stats.star).toBe(1);
      expect(stats.quality).toBe('凡品');
      expect(stats.refinement).toBe(0);
      expect(stats.score).toBeGreaterThan(0);
    });

    it('应该包含总属性', () => {
      const artifact = createMagicArtifact('ma_1');
      
      const stats = getArtifactStats(artifact);
      
      expect(stats.totalAttributes).toBe(
        artifact.attributes.attack + artifact.attributes.defense + artifact.attributes.health + artifact.attributes.speed + artifact.attributes.mana
      );
    });
  });

  describe('名称查询', () => {
    it('应该返回品质名称', () => {
      expect(getQualityName('mortal')).toBe('凡品');
      expect(getQualityName('earth')).toBe('地品');
      expect(getQualityName('heaven')).toBe('天品');
      expect(getQualityName('immortal')).toBe('仙品');
      expect(getQualityName('divine')).toBe('神器');
    });

    it('应该返回类型名称', () => {
      expect(getArtifactTypeName('attack')).toBe('攻击型');
      expect(getArtifactTypeName('defense')).toBe('防御型');
      expect(getArtifactTypeName('support')).toBe('辅助型');
      expect(getArtifactTypeName('special')).toBe('特殊型');
    });
  });

  describe('锁定系统', () => {
    it('应该锁定法宝', () => {
      const artifact = createMagicArtifact('ma_1');
      
      const result = toggleArtifactLock(artifact);
      
      expect(result.success).toBe(true);
      expect(artifact.lockStatus).toBe(true);
    });

    it('应该解锁法宝', () => {
      const artifact = createMagicArtifact('ma_1');
      artifact.lockStatus = true;
      
      const result = toggleArtifactLock(artifact);
      
      expect(result.success).toBe(true);
      expect(artifact.lockStatus).toBe(false);
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的最大等级', () => {
      expect(ARTIFACT_CONFIG.maxArtifactLevel).toBe(100);
    });

    it('应该配置正确的最高品阶', () => {
      expect(ARTIFACT_CONFIG.maxStar).toBe(5);
    });

    it('应该配置正确的最大炼化度', () => {
      expect(ARTIFACT_CONFIG.maxRefinement).toBe(100);
    });

    it('应该配置正确的炼化消耗', () => {
      expect(ARTIFACT_CONFIG.refineCost).toBe(1000);
    });

    it('应该配置正确的融合成功率', () => {
      expect(ARTIFACT_CONFIG.fuseSuccessRate).toBe(0.6);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的法宝培养流程', () => {
      const artifact = createMagicArtifact('ma_1');
      
      // 1. 升级
      levelUpArtifact(artifact, 100);
      expect(artifact.level).toBeGreaterThan(1);
      
      // 2. 升星
      starUpArtifact(artifact, 'mat_1');
      expect(artifact.star).toBe(2);
      
      // 3. 炼化
      refineArtifact(artifact, ARTIFACT_CONFIG.refineCost);
      expect(artifact.refinement).toBeGreaterThan(0);
      
      // 4. 学习技能
      artifact.level = 50;
      learnArtifactSkill(artifact, 'as_1');
      expect(artifact.skills.length).toBe(1);
      
      // 5. 升级技能
      upgradeArtifactSkill(artifact, 'as_1');
      expect(artifact.skills[0].level).toBe(2);
      
      // 6. 获取统计
      const stats = getArtifactStats(artifact);
      expect(stats.level).toBeGreaterThan(1);
      expect(stats.star).toBe(2);
      expect(stats.skillCount).toBe(1);
      
      // 7. 锁定
      toggleArtifactLock(artifact);
      expect(artifact.lockStatus).toBe(true);
    });

    it('应该处理法宝融合', () => {
      const sourceArtifact = createMagicArtifact('ma_1');
      const targetArtifact = createMagicArtifact('ma_1');
      
      // 源法宝培养
      sourceArtifact.level = 50;
      sourceArtifact.star = 2;
      learnArtifactSkill(sourceArtifact, 'as_1');
      
      // 融合
      const result = fuseArtifacts(sourceArtifact, targetArtifact);
      
      expect(result.success).toBe(true);
      expect(targetArtifact.star).toBeGreaterThanOrEqual(2);
    });
  });
});
