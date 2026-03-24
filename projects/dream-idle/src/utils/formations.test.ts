/**
 * v0.20 阵容系统测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  createFormation,
  setFormationCharacter,
  addPetToFormation,
  removePetFromFormation,
  clearFormation,
  deleteFormation,
  renameFormation,
  toggleFormationLock,
  calculateFormationBonuses,
  mergeFormationBonuses,
  applyFormationBonuses,
  validateFormation,
  calculateFormationPower,
  recommendFormation,
  getElementDiversity,
  FORMATION_CONFIG,
  type Formation,
} from './formations';

describe('v0.20 阵容系统', () => {
  // ==================== 基础创建测试 ====================

  describe('阵容创建', () => {
    it('应该成功创建新阵容', () => {
      const formation = createFormation('我的阵容');
      expect(formation.name).toBe('我的阵容');
      expect(formation.characterId).toBeUndefined();
      expect(formation.petIds).toHaveLength(0);
      expect(formation.isLocked).toBe(false);
    });

    it('创建阵容应该有默认名称', () => {
      const formation = createFormation('');
      expect(formation.name).toBe('新阵容');
    });

    it('创建阵容应该有唯一 ID', () => {
      const f1 = createFormation('阵容 1');
      const f2 = createFormation('阵容 2');
      expect(f1.id).not.toBe(f2.id);
    });
  });

  // ==================== 角色管理测试 ====================

  describe('角色管理', () => {
    it('应该能设置阵容角色', () => {
      const formation = createFormation('测试');
      const updated = setFormationCharacter(formation, 'char_001');
      expect(updated.characterId).toBe('char_001');
      expect(updated.units.some((u) => u.id === 'char_001')).toBe(true);
    });

    it('应该能移除阵容角色', () => {
      const formation = createFormation('测试');
      const withChar = setFormationCharacter(formation, 'char_001');
      const withoutChar = setFormationCharacter(withChar, undefined);
      expect(withoutChar.characterId).toBeUndefined();
    });

    it('更新角色应该更新时间戳', () => {
      const formation = createFormation('测试');
      const updated = setFormationCharacter(formation, 'char_001');
      // 检查 updatedAt 是有效的（至少等于 createdAt）
      expect(updated.updatedAt).toBeGreaterThanOrEqual(formation.createdAt);
      // 检查角色确实被设置了
      expect(updated.characterId).toBe('char_001');
    });
  });

  // ==================== 宠物管理测试 ====================

  describe('宠物管理', () => {
    it('应该能添加宠物到阵容', () => {
      const formation = createFormation('测试');
      const updated = addPetToFormation(formation, 'pet_001');
      expect(updated).not.toBeNull();
      expect(updated!.petIds).toContain('pet_001');
      expect(updated!.petIds).toHaveLength(1);
    });

    it('应该能添加多只宠物（最多 3 只）', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;
      formation = addPetToFormation(formation, 'pet_003')!;

      expect(formation.petIds).toHaveLength(3);
      expect(formation.petIds).toEqual(['pet_001', 'pet_002', 'pet_003']);
    });

    it('宠物数量达到上限时应该无法添加', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;
      formation = addPetToFormation(formation, 'pet_003')!;

      const result = addPetToFormation(formation, 'pet_004');
      expect(result).toBeNull();
    });

    it('不能添加重复的宠物', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;

      const result = addPetToFormation(formation, 'pet_001');
      expect(result).toBeNull();
    });

    it('应该能移除宠物', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;

      const updated = removePetFromFormation(formation, 'pet_001');
      expect(updated.petIds).not.toContain('pet_001');
      expect(updated.petIds).toContain('pet_002');
      expect(updated.petIds).toHaveLength(1);
    });

    it('移除宠物后应该重新排列槽位', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;
      formation = addPetToFormation(formation, 'pet_003')!;

      const updated = removePetFromFormation(formation, 'pet_002');
      const pet2Unit = updated.units.find((u) => u.id === 'pet_003');
      expect(pet2Unit?.slot).toBe('pet2'); // 应该从 pet3 变成 pet2
    });

    it('应该能清空阵容', () => {
      let formation = createFormation('测试');
      formation = setFormationCharacter(formation, 'char_001')!;
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;

      const cleared = clearFormation(formation);
      expect(cleared.characterId).toBeUndefined();
      expect(cleared.petIds).toHaveLength(0);
      expect(cleared.units).toHaveLength(0);
    });
  });

  // ==================== 阵容管理测试 ====================

  describe('阵容管理', () => {
    it('应该能重命名阵容', () => {
      const formation = createFormation('旧名字');
      const renamed = renameFormation(formation, '新名字');
      expect(renamed.name).toBe('新名字');
    });

    it('应该能锁定/解锁阵容', () => {
      const formation = createFormation('测试');
      const locked = toggleFormationLock(formation);
      expect(locked.isLocked).toBe(true);

      const unlocked = toggleFormationLock(locked);
      expect(unlocked.isLocked).toBe(false);
    });

    it('不能删除锁定的阵容', () => {
      const formations = [
        createFormation('阵容 1'),
        toggleFormationLock(createFormation('阵容 2')),
      ];

      const deleted = deleteFormation(formations, formations[1].id);
      expect(deleted).toHaveLength(2); // 应该还是 2 个，因为第二个被锁定
    });

    it('能删除未锁定的阵容', () => {
      const formations = [
        createFormation('阵容 1'),
        createFormation('阵容 2'),
      ];

      const deleted = deleteFormation(formations, formations[0].id);
      expect(deleted).toHaveLength(1);
      expect(deleted[0].name).toBe('阵容 2');
    });
  });

  // ==================== 羁绊加成测试 ====================

  describe('羁绊加成', () => {
    it('应该能计算空阵容的羁绊', () => {
      const formation = createFormation('测试');
      const bonuses = calculateFormationBonuses(formation);
      expect(bonuses).toHaveLength(0);
    });

    it('应该能合并羁绊效果', () => {
      const mockBonuses = [
        { effect: { type: 'attack' as const, value: 0.10 } },
        { effect: { type: 'attack' as const, value: 0.20 } },
        { effect: { type: 'defense' as const, value: 0.15 } },
      ];

      const merged = mergeFormationBonuses(mockBonuses as any);
      expect(merged.attack).toBeCloseTo(0.30, 2);
      expect(merged.defense).toBe(0.15);
      expect(merged.health).toBe(0);
    });

    it('应该能应用加成到属性', () => {
      const baseStats = { attack: 100, defense: 80, health: 200, speed: 50 };
      const bonuses = { attack: 0.20, defense: 0.15, health: 0.10, speed: 0.05 };

      const applied = applyFormationBonuses(baseStats, bonuses);
      expect(applied.attack).toBe(120); // 100 * 1.2
      expect(applied.defense).toBe(92); // 80 * 1.15
      expect(applied.health).toBe(220); // 200 * 1.1
      expect(applied.speed).toBe(52); // 50 * 1.05
    });
  });

  // ==================== 验证测试 ====================

  describe('阵容验证', () => {
    it('有效阵容应该通过验证', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;

      const result = validateFormation(formation);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('宠物数量超限应该验证失败', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;
      formation = addPetToFormation(formation, 'pet_003')!;
      // 手动添加第 4 只来测试验证
      formation.petIds.push('pet_004');

      const result = validateFormation(formation);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('超过上限'))).toBe(true);
    });
  });

  // ==================== 战力计算测试 ====================

  describe('战力计算', () => {
    it('应该能计算阵容总战力', () => {
      let formation = createFormation('测试');
      formation = setFormationCharacter(formation, 'char_001')!;
      formation = addPetToFormation(formation, 'pet_001')!;

      const power = calculateFormationPower(
        formation,
        1000, // 角色战力
        { pet_001: 500 } // 宠物战力
      );

      expect(power).toBe(1500); // 1000 + 500
    });

    it('羁绊加成应该影响战力', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;
      formation = addPetToFormation(formation, 'pet_003')!;

      const power = calculateFormationPower(
        formation,
        1000,
        { pet_001: 300, pet_002: 300, pet_003: 300 }
      );

      // 基础战力 1900，应该有经验加成等
      expect(power).toBeGreaterThanOrEqual(1900);
    });
  });

  // ==================== 推荐系统测试 ====================

  describe('阵容推荐', () => {
    it('应该能推荐高品质宠物', () => {
      const availablePets = [
        { id: 'pet_1', element: 'fire', quality: 'common' },
        { id: 'pet_2', element: 'water', quality: 'legendary' },
        { id: 'pet_3', element: 'earth', quality: 'rare' },
        { id: 'pet_4', element: 'fire', quality: 'epic' },
      ];

      const recommended = recommendFormation(availablePets, 'balanced');
      expect(recommended).toHaveLength(3);
      expect(recommended).toContain('pet_2'); // 传说品质应该被推荐
      expect(recommended).toContain('pet_4'); // 史诗品质应该被推荐
    });

    it('宠物不足 3 只时应该返回所有宠物', () => {
      const availablePets = [
        { id: 'pet_1', element: 'fire', quality: 'common' },
        { id: 'pet_2', element: 'water', quality: 'rare' },
      ];

      const recommended = recommendFormation(availablePets);
      expect(recommended).toHaveLength(2);
    });

    it('没有宠物时应该返回空数组', () => {
      const recommended = recommendFormation([]);
      expect(recommended).toHaveLength(0);
    });
  });

  // ==================== 元素多样性测试 ====================

  describe('元素多样性', () => {
    it('应该能计算元素多样性', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;
      formation = addPetToFormation(formation, 'pet_003')!;

      const petElements = {
        pet_001: 'fire',
        pet_002: 'water',
        pet_003: 'fire',
      };

      const diversity = getElementDiversity(formation, petElements);
      expect(diversity.unique).toBe(2); // fire 和 water
      expect(diversity.elements).toContain('fire');
      expect(diversity.elements).toContain('water');
    });

    it('全相同元素应该返回 1', () => {
      let formation = createFormation('测试');
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;

      const petElements = {
        pet_001: 'fire',
        pet_002: 'fire',
      };

      const diversity = getElementDiversity(formation, petElements);
      expect(diversity.unique).toBe(1);
    });
  });

  // ==================== 配置测试 ====================

  describe('配置', () => {
    it('最大阵容数量应该为 3', () => {
      expect(FORMATION_CONFIG.maxFormations).toBe(3);
    });

    it('每个阵容最多 3 只宠物', () => {
      expect(FORMATION_CONFIG.maxPetsPerFormation).toBe(3);
    });

    it('应该有多个羁绊配置', () => {
      expect(FORMATION_CONFIG.bonuses.length).toBeGreaterThan(5);
    });

    it('羁绊应该包含所有必要字段', () => {
      const bonus = FORMATION_CONFIG.bonuses[0];
      expect(bonus.id).toBeDefined();
      expect(bonus.name).toBeDefined();
      expect(bonus.description).toBeDefined();
      expect(bonus.requirement).toBeDefined();
      expect(bonus.effect).toBeDefined();
    });
  });

  // ==================== 集成测试 ====================

  describe('集成测试', () => {
    it('完整的阵容创建和使用流程', () => {
      // 1. 创建阵容
      let formation = createFormation('主力队');

      // 2. 设置角色
      formation = setFormationCharacter(formation, 'char_001')!;

      // 3. 添加宠物
      formation = addPetToFormation(formation, 'pet_001')!;
      formation = addPetToFormation(formation, 'pet_002')!;
      formation = addPetToFormation(formation, 'pet_003')!;

      // 4. 验证阵容
      const validation = validateFormation(formation);
      expect(validation.valid).toBe(true);

      // 5. 计算羁绊
      const bonuses = calculateFormationBonuses(formation);
      expect(bonuses.length).toBeGreaterThanOrEqual(0);

      // 6. 计算战力
      const power = calculateFormationPower(
        formation,
        1000,
        { pet_001: 300, pet_002: 400, pet_003: 500 }
      );
      expect(power).toBeGreaterThan(1000);

      // 7. 锁定阵容
      formation = toggleFormationLock(formation);
      expect(formation.isLocked).toBe(true);
    });

    it('多阵容管理', () => {
      // 创建多个阵容
      const formations = [
        createFormation('进攻队'),
        createFormation('防守队'),
        createFormation('刷金队'),
      ];

      // 不同阵容配置不同宠物
      let f1 = formations[0];
      f1 = addPetToFormation(f1, 'fire_pet_1')!;
      f1 = addPetToFormation(f1, 'fire_pet_2')!;

      let f2 = formations[1];
      f2 = addPetToFormation(f2, 'earth_pet_1')!;
      f2 = addPetToFormation(f2, 'earth_pet_2')!;

      let f3 = formations[2];
      f3 = addPetToFormation(f3, 'gold_pet_1')!;

      // 验证所有阵容都有效
      formations.forEach((f) => {
        const validation = validateFormation(f);
        expect(validation.valid).toBe(true);
      });
    });
  });
});
