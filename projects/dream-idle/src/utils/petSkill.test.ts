/**
 * v0.41 宠物技能系统单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  PET_SKILLS,
  SKILL_BOOKS,
  initializePetSkillState,
  learnSkill,
  upgradeSkill,
  replaceSkill,
  toggleSkillLock,
  getSkillInfo,
  getSkillLevelBonus,
  calculateSkillDamage,
  savePetSkillState,
  loadPetSkillState,
  getSkillTypeName,
  getSkillTypeColor,
  type PetSkillState
} from './petSkill';

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const mockLocalStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('v0.41 宠物技能系统', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('技能配置', () => {
    it('应该有至少 10 个技能', () => {
      expect(PET_SKILLS.length).toBeGreaterThanOrEqual(10);
    });

    it('每个技能都应该有必要的字段', () => {
      PET_SKILLS.forEach(skill => {
        expect(skill.id).toBeDefined();
        expect(skill.name).toBeDefined();
        expect(skill.description).toBeDefined();
        expect(skill.type).toBeDefined();
        expect(skill.element).toBeDefined();
        expect(skill.basePower).toBeGreaterThanOrEqual(0);
        expect(skill.maxLevel).toBeGreaterThan(0);
      });
    });

    it('技能类型应该正确', () => {
      const types = PET_SKILLS.map(s => s.type);
      expect(types).toContain('physical');
      expect(types).toContain('magical');
      expect(types).toContain('buff');
    });

    it('技能书数量应该与技能数量一致', () => {
      expect(SKILL_BOOKS.length).toBe(PET_SKILLS.length);
    });
  });

  describe('状态初始化', () => {
    it('应该返回初始状态', () => {
      const state = initializePetSkillState();

      expect(state.learnedSkills).toEqual([]);
      expect(state.skillPoints).toBe(0);
      expect(state.maxSkillSlots).toBe(4);
    });
  });

  describe('学习技能', () => {
    it('应该成功学习技能', () => {
      const state = initializePetSkillState();
      const result = learnSkill(state, 'scratch');

      expect(result.success).toBe(true);
      expect(result.newState.learnedSkills.length).toBe(1);
      expect(result.newState.learnedSkills[0].skillId).toBe('scratch');
      expect(result.newState.learnedSkills[0].level).toBe(1);
    });

    it('不能学习不存在的技能', () => {
      const state = initializePetSkillState();
      const result = learnSkill(state, 'invalid');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('不存在');
    });

    it('不能重复学习已学技能', () => {
      const state = initializePetSkillState();
      const result1 = learnSkill(state, 'scratch');
      const result2 = learnSkill(result1.newState, 'scratch');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.reason).toContain('已学习');
    });

    it('技能槽位有限制', () => {
      let state = initializePetSkillState();
      
      // 学习 4 个技能（满槽位）
      state = learnSkill(state, 'scratch').newState;
      state = learnSkill(state, 'bite').newState;
      state = learnSkill(state, 'fireball').newState;
      state = learnSkill(state, 'heal').newState;

      expect(state.learnedSkills.length).toBe(4);

      // 尝试学习第 5 个
      const result = learnSkill(state, 'water-bubble');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('满');
    });
  });

  describe('升级技能', () => {
    it('应该成功升级技能', () => {
      const state = initializePetSkillState();
      const state1 = learnSkill(state, 'scratch');
      const result = upgradeSkill(state1.newState, 'scratch', 100);

      expect(result.success).toBe(true);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('未学习技能不能升级', () => {
      const state = initializePetSkillState();
      const result = upgradeSkill(state, 'scratch', 100);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('未学习');
    });

    it('技能有等级上限', () => {
      const state = initializePetSkillState();
      let currentState = learnSkill(state, 'scratch').newState;

      // 升到满级（10 级）
      for (let i = 0; i < 20; i++) {
        const result = upgradeSkill(currentState, 'scratch', 1000);
        if (result.success) {
          currentState = result.newState;
        }
      }

      const skill = currentState.learnedSkills[0];
      expect(skill.level).toBe(10);

      // 尝试继续升级
      const result = upgradeSkill(currentState, 'scratch', 100);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('满级');
    });

    it('经验不足不应该升级', () => {
      const state = initializePetSkillState();
      const state1 = learnSkill(state, 'scratch');
      const result = upgradeSkill(state1.newState, 'scratch', 50);

      expect(result.success).toBe(true);
      expect(result.leveledUp).toBe(false);
      expect(result.newState.learnedSkills[0].exp).toBe(50);
    });
  });

  describe('替换技能', () => {
    it('应该成功替换技能', () => {
      const state = initializePetSkillState();
      const state1 = learnSkill(state, 'scratch');
      const result = replaceSkill(state1.newState, 'scratch', 'bite');

      expect(result.success).toBe(true);
      expect(result.newState.learnedSkills[0].skillId).toBe('bite');
      expect(result.newState.learnedSkills[0].level).toBe(1);
    });

    it('不能替换未学习的技能', () => {
      const state = initializePetSkillState();
      const result = replaceSkill(state, 'scratch', 'bite');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('未学习');
    });

    it('不能替换已锁定的技能', () => {
      const state = initializePetSkillState();
      const state1 = learnSkill(state, 'scratch');
      const lockResult = toggleSkillLock(state1.newState, 'scratch');
      const lockedState = lockResult.newState;

      const result = replaceSkill(lockedState, 'scratch', 'bite');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('锁定');
    });
  });

  describe('锁定/解锁技能', () => {
    it('应该成功锁定技能', () => {
      const state = initializePetSkillState();
      const state1 = learnSkill(state, 'scratch');
      const result = toggleSkillLock(state1.newState, 'scratch');

      expect(result.success).toBe(true);
      expect(result.locked).toBe(true);
    });

    it('应该成功解锁技能', () => {
      const state = initializePetSkillState();
      const state1 = learnSkill(state, 'scratch');
      const lockResult = toggleSkillLock(state1.newState, 'scratch');
      const lockedState = lockResult.newState;

      const result = toggleSkillLock(lockedState, 'scratch');
      expect(result.success).toBe(true);
      expect(result.locked).toBe(false);
    });
  });

  describe('技能信息查询', () => {
    it('应该正确获取技能信息', () => {
      const skill = getSkillInfo('scratch');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('抓击');
      expect(skill?.basePower).toBe(40);
    });

    it('无效技能 ID 应该返回 undefined', () => {
      const skill = getSkillInfo('invalid');
      expect(skill).toBeUndefined();
    });
  });

  describe('技能等级加成', () => {
    it('应该正确计算等级加成', () => {
      const bonus1 = getSkillLevelBonus('scratch', 1);
      const bonus10 = getSkillLevelBonus('scratch', 10);

      expect(bonus10.power).toBeGreaterThan(bonus1.power);
      expect(bonus10.accuracy).toBeGreaterThanOrEqual(bonus1.accuracy);
    });
  });

  describe('技能伤害计算', () => {
    it('应该正确计算伤害', () => {
      const damage = calculateSkillDamage('scratch', 1, 100, 50, 1.0);
      expect(damage).toBeGreaterThan(0);
    });

    it('元素克制应该影响伤害', () => {
      const damageNormal = calculateSkillDamage('scratch', 1, 100, 50, 1.0);
      const damageAdvantage = calculateSkillDamage('scratch', 1, 100, 50, 1.5);
      const damageDisadvantage = calculateSkillDamage('scratch', 1, 100, 50, 0.5);

      expect(damageAdvantage).toBeGreaterThan(damageNormal);
      expect(damageDisadvantage).toBeLessThan(damageNormal);
    });

    it('非伤害技能应该返回 0', () => {
      const damage = calculateSkillDamage('heal', 1, 100, 50, 1.0);
      expect(damage).toBe(0);
    });
  });

  describe('技能类型名称和颜色', () => {
    it('应该正确获取技能类型名称', () => {
      expect(getSkillTypeName('physical')).toBe('物理');
      expect(getSkillTypeName('magical')).toBe('魔法');
      expect(getSkillTypeName('buff')).toBe('增益');
      expect(getSkillTypeName('debuff')).toBe('减益');
      expect(getSkillTypeName('passive')).toBe('被动');
    });

    it('应该正确获取技能类型颜色', () => {
      expect(getSkillTypeColor('physical')).toBe('text-red-500');
      expect(getSkillTypeColor('magical')).toBe('text-blue-500');
      expect(getSkillTypeColor('buff')).toBe('text-green-500');
      expect(getSkillTypeColor('debuff')).toBe('text-purple-500');
      expect(getSkillTypeColor('passive')).toBe('text-yellow-500');
    });
  });

  describe('状态保存和加载', () => {
    it('应该正确保存和加载状态', () => {
      const originalState: PetSkillState = {
        learnedSkills: [
          { skillId: 'scratch', level: 5, exp: 50, maxExp: 200, locked: false },
          { skillId: 'fireball', level: 3, exp: 30, maxExp: 150, locked: true }
        ],
        skillPoints: 10,
        maxSkillSlots: 4
      };

      savePetSkillState(originalState);
      const loadedState = loadPetSkillState();

      expect(loadedState.learnedSkills.length).toBe(2);
      expect(loadedState.learnedSkills[0].skillId).toBe('scratch');
      expect(loadedState.learnedSkills[0].level).toBe(5);
      expect(loadedState.learnedSkills[1].locked).toBe(true);
    });

    it('没有保存时应该返回初始状态', () => {
      mockLocalStorage.clear();
      const state = loadPetSkillState();

      expect(state.learnedSkills).toEqual([]);
      expect(state.skillPoints).toBe(0);
    });
  });
});
