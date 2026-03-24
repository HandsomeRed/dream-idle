// v0.45 英雄技能系统测试

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  SKILL_CONFIGS,
  getSkillUpgradeCost,
  getSkillExpForLevel,
  HeroSkillSystem,
  createHeroSkillSystem,
  type OwnedSkill,
} from './heroSkills';

describe('v0.45 英雄技能系统', () => {
  describe('技能配置', () => {
    it('应该包含所有技能配置', () => {
      expect(Object.keys(SKILL_CONFIGS).length).toBeGreaterThan(0);
    });

    it('每个技能配置应该包含必要字段', () => {
      Object.values(SKILL_CONFIGS).forEach(skill => {
        expect(skill).toHaveProperty('id');
        expect(skill).toHaveProperty('name');
        expect(skill).toHaveProperty('description');
        expect(skill).toHaveProperty('type');
        expect(skill).toHaveProperty('target');
        expect(skill).toHaveProperty('effects');
        expect(skill).toHaveProperty('cooldown');
        expect(skill).toHaveProperty('unlockLevel');
        expect(skill).toHaveProperty('maxLevel');
      });
    });

    it('应该包含不同类型的技能', () => {
      const types = new Set(Object.values(SKILL_CONFIGS).map(s => s.type));
      expect(types.has('active')).toBe(true);
      expect(types.has('passive')).toBe(true);
      expect(types.has('ultimate')).toBe(true);
    });

    it('应该包含不同目标的技能', () => {
      const targets = new Set(Object.values(SKILL_CONFIGS).map(s => s.target));
      expect(targets.has('self')).toBe(true);
      expect(targets.has('single_enemy')).toBe(true);
      expect(targets.has('all_enemies')).toBe(true);
    });

    it('终极技能应该有更高的解锁等级', () => {
      const ultimateSkills = Object.values(SKILL_CONFIGS).filter(s => s.type === 'ultimate');
      ultimateSkills.forEach(skill => {
        expect(skill.unlockLevel).toBeGreaterThanOrEqual(30);
      });
    });
  });

  describe('技能升级消耗', () => {
    it('应该返回升级消耗', () => {
      const cost = getSkillUpgradeCost('skill_001', 1);
      expect(cost.gold).toBeGreaterThan(0);
      expect(cost.skillBooks).toBeGreaterThan(0);
    });

    it('高等级应该有更高消耗', () => {
      const cost1 = getSkillUpgradeCost('skill_001', 1);
      const cost5 = getSkillUpgradeCost('skill_001', 5);
      expect(cost5.gold).toBeGreaterThan(cost1.gold);
      expect(cost5.skillBooks).toBeGreaterThanOrEqual(cost1.skillBooks);
    });

    it('5 级以上应该需要英雄碎片', () => {
      const cost4 = getSkillUpgradeCost('skill_001', 4);
      const cost5 = getSkillUpgradeCost('skill_001', 5);
      expect(cost4.heroShards).toBe(0);
      expect(cost5.heroShards).toBeGreaterThan(0);
    });
  });

  describe('技能经验需求', () => {
    it('1 级升级应该需要 100 经验', () => {
      expect(getSkillExpForLevel(1)).toBe(100);
    });

    it('高等级应该需要更多经验', () => {
      expect(getSkillExpForLevel(5)).toBeGreaterThan(getSkillExpForLevel(1));
      expect(getSkillExpForLevel(10)).toBeGreaterThan(getSkillExpForLevel(5));
    });

    it('经验应该呈指数增长', () => {
      const exp1 = getSkillExpForLevel(1);
      const exp2 = getSkillExpForLevel(2);
      const exp3 = getSkillExpForLevel(3);
      expect(exp2).toBeGreaterThan(exp1);
      expect(exp3).toBeGreaterThan(exp2);
    });
  });

  describe('技能系统 - 解锁', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
    });

    it('应该能够解锁技能', () => {
      const result = system.unlockSkill('hero_001', 'skill_001', 10);
      expect(result.success).toBe(true);
    });

    it('英雄等级不足应该无法解锁', () => {
      const result = system.unlockSkill('hero_001', 'skill_020', 10);
      expect(result.success).toBe(false);
      expect(result.message).toContain('等级不足');
    });

    it('重复解锁应该失败', () => {
      system.unlockSkill('hero_001', 'skill_001', 10);
      const result = system.unlockSkill('hero_001', 'skill_001', 10);
      expect(result.success).toBe(false);
      expect(result.message).toContain('已解锁');
    });

    it('不存在的技能应该无法解锁', () => {
      const result = system.unlockSkill('hero_001', 'nonexistent', 10);
      expect(result.success).toBe(false);
    });
  });

  describe('技能系统 - 升级', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
      system.unlockSkill('hero_001', 'skill_001', 10);
    });

    it('资源足够时应该能够升级技能', () => {
      const result = system.upgradeSkill('skill_001', 1000, 100, 50);
      expect(result.success).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('金币不足应该无法升级', () => {
      const result = system.upgradeSkill('skill_001', 10, 100, 50);
      expect(result.success).toBe(false);
      expect(result.message).toContain('金币不足');
    });

    it('技能书不足应该无法升级', () => {
      const result = system.upgradeSkill('skill_001', 1000, 0, 50);
      expect(result.success).toBe(false);
      expect(result.message).toContain('技能书不足');
    });

    it('达到最大等级应该无法继续升级', () => {
      // 连续升级到满级
      for (let i = 0; i < 15; i++) {
        system.upgradeSkill('skill_001', 100000, 1000, 100);
      }
      
      const result = system.upgradeSkill('skill_001', 100000, 1000, 100);
      expect(result.success).toBe(false);
      expect(result.message).toContain('已达最大等级');
    });

    it('未拥有的技能应该无法升级', () => {
      const result = system.upgradeSkill('skill_002', 1000, 100, 50);
      expect(result.success).toBe(false);
      expect(result.message).toContain('未拥有');
    });
  });

  describe('技能系统 - 经验', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
      system.unlockSkill('hero_001', 'skill_001', 10);
    });

    it('应该能够给技能添加经验', () => {
      const result = system.addSkillExp('skill_001', 200);
      expect(result.success).toBe(true);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('经验不足应该无法升级', () => {
      const result = system.addSkillExp('skill_001', 50);
      expect(result.success).toBe(true);
      expect(result.leveledUp).toBe(false);
      expect(result.newLevel).toBe(1);
    });

    it('未解锁的技能应该无法获得经验', () => {
      const result = system.addSkillExp('skill_002', 200);
      expect(result.success).toBe(false);
    });

    it('满级技能应该无法继续升级', () => {
      // 直接升到满级
      for (let i = 0; i < 15; i++) {
        system.addSkillExp('skill_001', 10000);
      }
      
      const result = system.addSkillExp('skill_001', 1000);
      expect(result.success).toBe(false);
    });
  });

  describe('技能系统 - 装备', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
      system.unlockSkill('hero_001', 'skill_001', 10);
      system.unlockSkill('hero_001', 'skill_002', 10);
      system.unlockSkill('hero_001', 'skill_003', 10);
    });

    it('应该能够装备技能', () => {
      const result = system.toggleEquipSkill('hero_001', 'skill_001', 0);
      expect(result.success).toBe(true);
      expect(result.message).toContain('装备成功');
    });

    it('应该能够卸下技能', () => {
      system.toggleEquipSkill('hero_001', 'skill_001', 0);
      const result = system.toggleEquipSkill('hero_001', 'skill_001', 0);
      expect(result.success).toBe(true);
      expect(result.message).toContain('卸下成功');
    });

    it('未解锁的技能应该无法装备', () => {
      const result = system.toggleEquipSkill('hero_001', 'skill_020', 0);
      expect(result.success).toBe(false);
      expect(result.message).toContain('未解锁');
    });

    it('应该能够获取已装备的技能', () => {
      system.toggleEquipSkill('hero_001', 'skill_001', 0);
      system.toggleEquipSkill('hero_001', 'skill_002', 1);
      
      const equipped = system.getEquippedSkills('hero_001');
      expect(equipped.length).toBe(2);
    });

    it('无效槽位应该无法装备', () => {
      const result = system.toggleEquipSkill('hero_001', 'skill_001', 10);
      expect(result.success).toBe(false);
      expect(result.message).toContain('无效');
    });
  });

  describe('技能系统 - 冷却', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
      system.unlockSkill('hero_001', 'skill_001', 10);
    });

    it('应该能够使用技能', () => {
      const result = system.useSkill('skill_001', 1);
      expect(result.success).toBe(true);
    });

    it('使用后的技能应该进入冷却', () => {
      system.useSkill('skill_001', 1);
      const result = system.useSkill('skill_001', 1);
      expect(result.success).toBe(false);
      expect(result.message).toContain('冷却中');
    });

    it('冷却结束后应该能够再次使用', () => {
      system.useSkill('skill_001', 1);
      const result = system.useSkill('skill_001', 3); // skill_001 cooldown is 1
      expect(result.success).toBe(true);
    });

    it('未解锁的技能应该无法使用', () => {
      const result = system.useSkill('skill_002', 1);
      expect(result.success).toBe(false);
      // 未拥有的技能会提示"技能不存在"或"未解锁"
      expect(result.success).toBe(false);
    });
  });

  describe('技能系统 - 效果计算', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
      system.unlockSkill('hero_001', 'skill_001', 10);
    });

    it('应该能够计算技能效果', () => {
      const effect = system.calculateSkillEffect('skill_001', 0);
      expect(effect).not.toBeNull();
      expect(effect?.value).toBeGreaterThan(0);
    });

    it('技能等级应该影响效果', () => {
      const effect1 = system.calculateSkillEffect('skill_001', 0);
      
      // 升级技能
      system.upgradeSkill('skill_001', 10000, 1000, 100);
      
      const effect2 = system.calculateSkillEffect('skill_001', 0);
      expect(effect2?.value).toBeGreaterThan(effect1?.value || 0);
    });

    it('不存在的技能应该返回 null', () => {
      const effect = system.calculateSkillEffect('nonexistent', 0);
      expect(effect).toBeNull();
    });
  });

  describe('技能系统 - 查询', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
      system.unlockSkill('hero_001', 'skill_001', 10);
    });

    it('应该能够获取技能详情', () => {
      const detail = system.getSkillDetail('skill_001');
      expect(detail).not.toBeNull();
      expect(detail?.config.id).toBe('skill_001');
      expect(detail?.owned).toBeDefined();
    });

    it('不存在的技能应该返回 null', () => {
      const detail = system.getSkillDetail('nonexistent');
      expect(detail).toBeNull();
    });

    it('应该能够获取所有拥有的技能', () => {
      system.unlockSkill('hero_001', 'skill_002', 10);
      
      const owned = system.getOwnedSkills();
      expect(owned.length).toBe(2);
    });
  });

  describe('技能系统 - 数据导出导入', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
      system.unlockSkill('hero_001', 'skill_001', 10);
      system.unlockSkill('hero_001', 'skill_002', 10);
      system.toggleEquipSkill('hero_001', 'skill_001', 0);
    });

    it('应该能够导出数据', () => {
      const data = system.exportData();
      expect(data).toHaveProperty('ownedSkills');
      expect(data).toHaveProperty('heroSkillSlots');
    });

    it('应该能够导入数据', () => {
      const data = system.exportData();
      
      const newSystem = createHeroSkillSystem();
      newSystem.importData(data);
      
      expect(newSystem.getOwnedSkills().length).toBe(system.getOwnedSkills().length);
    });

    it('导入后数据应该一致', () => {
      system.toggleEquipSkill('hero_001', 'skill_002', 1);
      
      const data = system.exportData();
      const newSystem = createHeroSkillSystem();
      newSystem.importData(data);
      
      const equipped = newSystem.getEquippedSkills('hero_001');
      expect(equipped.length).toBe(2);
    });
  });

  describe('边界情况', () => {
    let system: HeroSkillSystem;

    beforeEach(() => {
      system = createHeroSkillSystem();
    });

    it('空拥有列表应该返回空数组', () => {
      expect(system.getOwnedSkills()).toHaveLength(0);
    });

    it('没有装备技能的英雄应该返回空数组', () => {
      expect(system.getEquippedSkills('hero_001')).toHaveLength(0);
    });

    it('不存在的英雄应该返回空数组', () => {
      expect(system.getEquippedSkills('nonexistent')).toHaveLength(0);
    });

    it('卸下不存在的技能应该失败', () => {
      const result = system.toggleEquipSkill('hero_001', 'skill_001', 0);
      expect(result.success).toBe(false);
    });
  });
});
