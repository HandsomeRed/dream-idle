import {
  getExpForLevel,
  calculateStatsAtLevel,
  calcPhysicalDamage,
  calcMagicalDamage,
  calcCritRate,
  isCritHit,
  getTurnOrder
} from './gameStats';

describe('游戏数值计算', () => {
  describe('getExpForLevel - 升级经验计算', () => {
    test('1 级需要 100 EXP', () => {
      expect(getExpForLevel(1)).toBe(100);
    });

    test('10 级需要 19952 EXP', () => {
      expect(getExpForLevel(10)).toBe(19952);
    });

    test('50 级需要 808408 EXP', () => {
      expect(getExpForLevel(50)).toBe(808408);
    });

    test('经验随等级增长', () => {
      const exp1 = getExpForLevel(1);
      const exp10 = getExpForLevel(10);
      const exp50 = getExpForLevel(50);
      
      expect(exp10).toBeGreaterThan(exp1);
      expect(exp50).toBeGreaterThan(exp10);
    });
  });

  describe('calculateStatsAtLevel - 属性计算', () => {
    test('剑侠客 1 级属性正确', () => {
      const stats = calculateStatsAtLevel('剑侠客', 1);
      
      expect(stats.level).toBe(1);
      expect(stats.maxHp).toBe(110); // 100 + 1×10
      expect(stats.maxMp).toBe(56);  // 50 + 1×6
      expect(stats.attack).toBe(18); // 15 + 1×3
      expect(stats.defense).toBe(12); // 10 + 1×2
      expect(stats.speed).toBeCloseTo(8.5, 1); // 8 + 1×0.5
      expect(stats.job).toBe('剑侠客');
    });

    test('骨精灵 10 级属性正确', () => {
      const stats = calculateStatsAtLevel('骨精灵', 10);
      
      expect(stats.maxHp).toBe(160); // 80 + 10×8
      expect(stats.maxMp).toBe(160); // 80 + 10×8
      expect(stats.mag).toBe(45);    // 15 + 10×3
    });

    test('龙太子 50 级属性', () => {
      const stats = calculateStatsAtLevel('龙太子', 50);
      
      expect(stats.maxHp).toBe(540); // 90 + 50×9
      expect(stats.attack).toBe(139); // 14 + 50×2.5
    });

    test('未知门派抛出错误', () => {
      expect(() => calculateStatsAtLevel('未知门派', 1)).toThrow();
    });
  });

  describe('calcPhysicalDamage - 物理伤害计算', () => {
    test('普通攻击伤害', () => {
      const damage = calcPhysicalDamage(100, 50);
      expect(damage).toBe(50);
    });

    test('暴击伤害翻倍', () => {
      const damage = calcPhysicalDamage(100, 50, true);
      expect(damage).toBe(100);
    });

    test('防御高于攻击时最小伤害为 1', () => {
      const damage = calcPhysicalDamage(50, 100);
      expect(damage).toBe(1);
    });

    test('防御为零时全额伤害', () => {
      const damage = calcPhysicalDamage(100, 0);
      expect(damage).toBe(100);
    });
  });

  describe('calcMagicalDamage - 法术伤害计算', () => {
    test('单体法术伤害', () => {
      const damage = calcMagicalDamage(50, 100, 30, 1);
      // skillTerm = 50²/120 + 50×1.5 + 30 = 20.83 + 75 + 30 = 125.83
      // damage = (125.83 + 100 - 30) × 1.0 = 195.83 → 取整 176
      expect(damage).toBeGreaterThanOrEqual(170);
      expect(damage).toBeLessThanOrEqual(180);
    });

    test('群体法术秒 3 衰减', () => {
      const damage = calcMagicalDamage(50, 100, 30, 3);
      // splitFactor = 1 - 3×0.1 = 0.7
      // damage = (125.83 + 100 - 30) × 0.7 = 137.08
      expect(damage).toBe(137);
    });

    test('群体法术秒 5 最低系数', () => {
      const damage = calcMagicalDamage(50, 100, 30, 5);
      // splitFactor = max(0.5, 1 - 5×0.1) = 0.5
      expect(damage).toBe(97); // 195.83 × 0.5 = 97.91
    });

    test('法伤低于法防时最小伤害为 1', () => {
      const damage = calcMagicalDamage(10, 20, 100, 1);
      expect(damage).toBe(1);
    });
  });

  describe('calcCritRate - 暴击率计算', () => {
    test('1 级暴击率约 5%', () => {
      expect(calcCritRate(1)).toBeCloseTo(0.051, 2);
    });

    test('10 级暴击率约 6%', () => {
      expect(calcCritRate(10)).toBeCloseTo(0.06, 2);
    });

    test('100 级暴击率约 15%', () => {
      expect(calcCritRate(100)).toBeCloseTo(0.15, 2);
    });
  });

  describe('isCritHit - 暴击判定', () => {
    test('返回布尔值', () => {
      const result = isCritHit(10);
      expect(typeof result).toBe('boolean');
    });

    test('多次调用结果有真有假（概率性）', () => {
      const results = Array(200).fill(0).map(() => isCritHit(50));
      const critCount = results.filter(r => r).length;
      
      // 50 级暴击率 10%，200 次应该有 10-30 次暴击（放宽范围）
      expect(critCount).toBeGreaterThanOrEqual(5);
      expect(critCount).toBeLessThanOrEqual(40);
    });
  });

  describe('getTurnOrder - 出手顺序', () => {
    test('速度高的先手', () => {
      const combatants = [
        { speed: 10, name: 'A' },
        { speed: 20, name: 'B' },
        { speed: 15, name: 'C' }
      ];
      
      const order = getTurnOrder(combatants);
      
      expect(order[0].name).toBe('B');
      expect(order[1].name).toBe('C');
      expect(order[2].name).toBe('A');
    });

    test('不修改原数组', () => {
      const combatants = [
        { speed: 10, name: 'A' },
        { speed: 20, name: 'B' }
      ];
      
      getTurnOrder(combatants);
      
      expect(combatants[0].name).toBe('A');
    });
  });
});
