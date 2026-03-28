// v0.95 宠物内丹系统单元测试
import {
  getLowInnerDan,
  getHighInnerDan,
  getInnerDan,
  getAllLowInnerDans,
  getAllHighInnerDans,
  createEmptySlot,
  createPetInnerDanConfig,
  equipLowInnerDan,
  equipHighInnerDan,
  unequipInnerDan,
  addInnerDanExp,
  calculatePetBonuses,
  checkInnerDanCombinations,
  getTotalBonuses,
  checkHighDanTrigger,
  validatePetInnerDans,
  getExpToNextLevel,
  canLevelUp,
} from '../systems/innerDanSystem';
import { INNER_DAN_CONFIG } from '../data/innerDans';

describe('v0.95 宠物内丹系统', () => {
  describe('基础数据查询', () => {
    test('应该能获取所有 8 个低级内丹', () => {
      const dans = getAllLowInnerDans();
      expect(dans).toHaveLength(8);
    });

    test('应该能获取所有 8 个高级内丹', () => {
      const dans = getAllHighInnerDans();
      expect(dans).toHaveLength(8);
    });

    test('应该能通过 ID 获取低级内丹', () => {
      const dan = getLowInnerDan('jiao_jian');
      expect(dan).toBeDefined();
      expect(dan?.name).toBe('矫健');
      expect(dan?.type).toBe('low');
      expect(dan?.effect.stat).toBe('hp');
    });

    test('应该能通过 ID 获取高级内丹', () => {
      const dan = getHighInnerDan('shen_you');
      expect(dan).toBeDefined();
      expect(dan?.name).toBe('神佑复生');
      expect(dan?.type).toBe('high');
      expect(dan?.effect.trigger).toBe('death');
    });

    test('不存在的内丹应该返回 undefined', () => {
      const dan = getInnerDan('non_existent');
      expect(dan).toBeUndefined();
    });

    test('所有低级内丹都应该有完整的属性', () => {
      const dans = getAllLowInnerDans();
      dans.forEach(d => {
        expect(d.id).toBeDefined();
        expect(d.name).toBeDefined();
        expect(d.type).toBe('low');
        expect(d.maxLevel).toBe(4);
        expect(d.effect).toBeDefined();
      });
    });

    test('所有高级内丹都应该有触发效果', () => {
      const dans = getAllHighInnerDans();
      dans.forEach(d => {
        expect(d.id).toBeDefined();
        expect(d.name).toBeDefined();
        expect(d.type).toBe('high');
        expect(d.maxLevel).toBe(5);
        expect(d.effect.trigger || d.effect.special).toBeDefined();
      });
    });
  });

  describe('槽位管理', () => {
    test('创建的空槽位应该是空的', () => {
      const slot = createEmptySlot();
      expect(slot.danId).toBeNull();
      expect(slot.level).toBe(0);
      expect(slot.exp).toBe(0);
    });

    test('创建的宠物内丹配置应该有 3 个低级槽位', () => {
      const pet = createPetInnerDanConfig();
      expect(pet.lowSlots).toHaveLength(3);
      expect(pet.highSlot).toBeNull();
    });

    test('所有槽位初始都应该是空的', () => {
      const pet = createPetInnerDanConfig();
      pet.lowSlots.forEach(slot => {
        expect(slot.danId).toBeNull();
      });
    });
  });

  describe('内丹装备', () => {
    test('应该能装备低级内丹', () => {
      const pet = createPetInnerDanConfig();
      const result = equipLowInnerDan(pet, 0, 'jiao_jian');
      
      expect(result.success).toBe(true);
      expect(pet.lowSlots[0].danId).toBe('jiao_jian');
      expect(pet.lowSlots[0].level).toBe(1);
    });

    test('应该能装备高级内丹', () => {
      const pet = createPetInnerDanConfig();
      const result = equipHighInnerDan(pet, 'shen_you');
      
      expect(result.success).toBe(true);
      expect(pet.highSlot?.danId).toBe('shen_you');
      expect(pet.highSlot?.level).toBe(1);
    });

    test('无效的槽位索引应该失败', () => {
      const pet = createPetInnerDanConfig();
      const result = equipLowInnerDan(pet, 5, 'jiao_jian');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('无效');
    });

    test('不存在的内丹应该失败', () => {
      const pet = createPetInnerDanConfig();
      const result = equipLowInnerDan(pet, 0, 'non_existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });

    test('应该能卸下低级内丹', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian');
      
      const result = unequipInnerDan(pet, 0);
      
      expect(result.success).toBe(true);
      expect(result.danId).toBe('jiao_jian');
      expect(pet.lowSlots[0].danId).toBeNull();
    });

    test('应该能卸下高级内丹', () => {
      const pet = createPetInnerDanConfig();
      equipHighInnerDan(pet, 'shen_you');
      
      const result = unequipInnerDan(pet, 0, true);
      
      expect(result.success).toBe(true);
      expect(result.danId).toBe('shen_you');
      expect(pet.highSlot).toBeNull();
    });
  });

  describe('内丹经验系统', () => {
    test('添加经验应该能升级', () => {
      const slot = { danId: 'jiao_jian', level: 1, exp: 0 };
      
      // 2 级需要 baseExpPerLevel * growthRate^(2-1) = 50 * 1.5^1 = 75
      const result = addInnerDanExp(slot, 75);
      
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(slot.level).toBe(2);
    });

    test('添加不足经验不应该升级', () => {
      const slot = { danId: 'jiao_jian', level: 1, exp: 0 };
      
      const result = addInnerDanExp(slot, 25);
      
      expect(result.leveledUp).toBe(false);
      expect(slot.exp).toBe(25);
    });

    test('添加大量经验应该连续升级', () => {
      const slot = { danId: 'jiao_jian', level: 1, exp: 0 };
      
      const result = addInnerDanExp(slot, 500);
      
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBeGreaterThan(2);
    });

    test('空槽位添加经验不应该升级', () => {
      const slot = { danId: null, level: 0, exp: 0 };
      
      const result = addInnerDanExp(slot, 1000);
      
      expect(result.leveledUp).toBe(false);
      expect(result.newLevel).toBe(0);
    });

    test('达到最大等级后不应该再升级 (低级)', () => {
      const slot = { danId: 'jiao_jian', level: 4, exp: 0 };
      
      const result = addInnerDanExp(slot, 10000);
      
      expect(result.leveledUp).toBe(false);
      expect(slot.level).toBe(4);
    });

    test('达到最大等级后不应该再升级 (高级)', () => {
      const slot = { danId: 'shen_you', level: 5, exp: 0 };
      
      const result = addInnerDanExp(slot, 10000);
      
      expect(result.leveledUp).toBe(false);
      expect(slot.level).toBe(5);
    });

    test('高级内丹升级经验应该更高', () => {
      const lowSlot = { danId: 'jiao_jian', level: 1, exp: 0 };
      const highSlot = { danId: 'shen_you', level: 1, exp: 0 };
      
      addInnerDanExp(lowSlot, 100);
      addInnerDanExp(highSlot, 100);
      
      // 高级内丹升级更慢
      expect(lowSlot.level).toBeGreaterThanOrEqual(highSlot.level);
    });
  });

  describe('属性加成计算', () => {
    test('应该能计算单个内丹的加成', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian');
      
      const bonuses = calculatePetBonuses(pet);
      
      expect(bonuses.hp).toBe(10); // 矫健 1 级 +10%
    });

    test('应该能计算多个内丹的加成', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian'); // +10% hp
      equipLowInnerDan(pet, 1, 'bao_li'); // +10% damage
      equipLowInnerDan(pet, 2, 'xun_min'); // +10% speed
      
      const bonuses = calculatePetBonuses(pet);
      
      expect(bonuses.hp).toBe(10);
      expect(bonuses.damage).toBe(10);
      expect(bonuses.speed).toBe(10);
    });

    test('内丹升级应该增加加成', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian');
      pet.lowSlots[0].level = 4; // 4 级
      
      const bonuses = calculatePetBonuses(pet);
      
      expect(bonuses.hp).toBe(40); // 10 * 4
    });

    test('空槽位不应该影响加成', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian');
      // 槽位 1 和 2 为空
      
      const bonuses = calculatePetBonuses(pet);
      
      expect(bonuses.hp).toBe(10);
      expect(bonuses.damage).toBe(0);
    });

    test('高级内丹也应该计算加成', () => {
      const pet = createPetInnerDanConfig();
      equipHighInnerDan(pet, 'nu_ji'); // 怒击有伤害加成
      
      const bonuses = calculatePetBonuses(pet);
      
      // 怒击主要是触发效果，属性加成可能为 0
      expect(bonuses).toBeDefined();
    });
  });

  describe('内丹组合效果', () => {
    test('应该能检测内丹组合', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian');
      equipLowInnerDan(pet, 1, 'jian_jia');
      equipLowInnerDan(pet, 2, 'xun_min');
      
      const combos = checkInnerDanCombinations(pet);
      
      expect(combos.length).toBeGreaterThan(0);
      expect(combos[0].bonus.stat).toBe('hp');
      expect(combos[0].bonus.value).toBe(5);
    });

    test('不满足组合条件不应该触发', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian');
      equipLowInnerDan(pet, 1, 'jian_jia');
      // 缺少 xun_min
      
      const combos = checkInnerDanCombinations(pet);
      
      expect(combos.length).toBe(0);
    });

    test('总加成应该包括组合效果', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian'); // +10% hp
      equipLowInnerDan(pet, 1, 'jian_jia');
      equipLowInnerDan(pet, 2, 'xun_min');
      
      const totalBonuses = getTotalBonuses(pet);
      
      expect(totalBonuses.hp).toBe(15); // 10 + 5 (组合)
    });
  });

  describe('高级内丹触发', () => {
    test('没有高级内丹不应该触发', () => {
      const pet = createPetInnerDanConfig();
      
      const result = checkHighDanTrigger(pet, 'death');
      
      expect(result.triggered).toBe(false);
    });

    test('触发条件不匹配不应该触发', () => {
      const pet = createPetInnerDanConfig();
      equipHighInnerDan(pet, 'shen_you'); // 死亡触发
      
      const result = checkHighDanTrigger(pet, 'physicalHit');
      
      expect(result.triggered).toBe(false);
    });

    test('概率触发应该有机会成功', () => {
      const pet = createPetInnerDanConfig();
      equipHighInnerDan(pet, 'fa_shu_lian_ji'); // 30% 概率
      
      // 多次测试，应该至少成功一次
      let triggered = false;
      for (let i = 0; i < 20; i++) {
        const result = checkHighDanTrigger(pet, 'magicHit');
        if (result.triggered) {
          triggered = true;
          break;
        }
      }
      
      // 30% 概率，20 次至少成功一次的概率 > 99.9%
      expect(triggered).toBe(true);
    });

    test('100% 概率应该总是触发', () => {
      const pet = createPetInnerDanConfig();
      equipHighInnerDan(pet, 'she_shen_ji'); // 100% 概率
      
      for (let i = 0; i < 10; i++) {
        const result = checkHighDanTrigger(pet, 'physicalHit');
        expect(result.triggered).toBe(true);
      }
    });

    test('触发应该返回效果信息', () => {
      const pet = createPetInnerDanConfig();
      equipHighInnerDan(pet, 'xi_xue'); // 吸血
      
      const result = checkHighDanTrigger(pet, 'physicalHit');
      
      if (result.triggered) {
        expect(result.effect).toBeDefined();
        expect(result.effect?.type).toBe('heal');
      }
    });
  });

  describe('验证', () => {
    test('有效的内丹配置应该通过验证', () => {
      const pet = createPetInnerDanConfig();
      equipLowInnerDan(pet, 0, 'jiao_jian');
      equipLowInnerDan(pet, 1, 'bao_li');
      equipHighInnerDan(pet, 'shen_you');
      
      const result = validatePetInnerDans(pet);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('无效的内丹 ID 应该验证失败', () => {
      const pet = createPetInnerDanConfig();
      pet.lowSlots[0] = { danId: 'non_existent', level: 1, exp: 0 };
      
      const result = validatePetInnerDans(pet);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('升级检查', () => {
    test('应该能获取升级所需经验', () => {
      const exp = getExpToNextLevel('jiao_jian', 1);
      expect(exp).toBeGreaterThan(0);
    });

    test('应该能检查是否可以升级', () => {
      expect(canLevelUp('jiao_jian', 1)).toBe(true);
      expect(canLevelUp('jiao_jian', 4)).toBe(false);
      expect(canLevelUp('shen_you', 4)).toBe(true);
      expect(canLevelUp('shen_you', 5)).toBe(false);
    });

    test('不存在的内丹不能升级', () => {
      expect(canLevelUp('non_existent', 1)).toBe(false);
    });
  });
});
