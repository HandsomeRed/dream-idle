/**
 * v0.88 经脉系统测试
 */

import {
  createMeridianSystem,
  createCultivationMethods,
  unlockMeridian,
  activatePoint,
  cultivateMethod,
  getMeridianBonuses,
  getCultivationBonuses,
  getTotalBonuses,
  attemptBreakthrough,
  getMeridianProgress,
  getCultivationProgress,
  getMeridianTypeName,
  getCultivationTypeName,
  CULTIVATION_CONFIG,
  Meridian,
  CultivationMethod,
} from './meridianSystem';

describe('v0.88 经脉系统', () => {
  describe('经脉系统创建', () => {
    it('应该创建经脉系统', () => {
      const meridians = createMeridianSystem();
      
      expect(meridians.length).toBeGreaterThan(0);
      meridians.forEach(m => {
        expect(m.id).toBeDefined();
        expect(m.name).toBeDefined();
        expect(m.unlocked).toBe(false);
        expect(m.activated).toBe(false);
        expect(m.level).toBe(0);
      });
    });

    it('应该包含多条经脉', () => {
      const meridians = createMeridianSystem();
      
      const types = new Set(meridians.map(m => m.type));
      expect(types.has('ren')).toBe(true);
      expect(types.has('du')).toBe(true);
    });

    it('应该包含穴位', () => {
      const meridians = createMeridianSystem();
      
      meridians.forEach(m => {
        expect(m.points.length).toBeGreaterThan(0);
        m.points.forEach(p => {
          expect(p.id).toBeDefined();
          expect(p.name).toBeDefined();
          expect(p.cost).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('心法创建', () => {
    it('应该创建心法列表', () => {
      const methods = createCultivationMethods();
      
      expect(methods.length).toBeGreaterThan(0);
      methods.forEach(m => {
        expect(m.id).toBeDefined();
        expect(m.name).toBeDefined();
        expect(m.level).toBe(0);
      });
    });

    it('应该包含多种心法类型', () => {
      const methods = createCultivationMethods();
      
      const types = new Set(methods.map(m => m.type));
      expect(types.has('internal')).toBe(true);
      expect(types.has('external')).toBe(true);
    });
  });

  describe('经脉解锁', () => {
    it('应该解锁经脉', () => {
      const meridians = createMeridianSystem();
      
      const result = unlockMeridian(meridians, 'ren_1', 100);
      
      expect(result.success).toBe(true);
      expect(meridians[0].unlocked).toBe(true);
    });

    it('应该拒绝已解锁的经脉', () => {
      const meridians = createMeridianSystem();
      unlockMeridian(meridians, 'ren_1', 100);
      
      const result = unlockMeridian(meridians, 'ren_1', 100);
      
      expect(result.success).toBe(false);
    });

    it('应该拒绝不存在的经脉', () => {
      const meridians = createMeridianSystem();
      
      const result = unlockMeridian(meridians, 'invalid', 100);
      
      expect(result.success).toBe(false);
    });
  });

  describe('穴位打通', () => {
    it('应该打通穴位', () => {
      const meridians = createMeridianSystem();
      unlockMeridian(meridians, 'ren_1', 100);
      
      const result = activatePoint(meridians, 'ren_1', 'ren_p1');
      
      expect(result.success).toBe(true);
      expect(meridians[0].points[0].activated).toBe(true);
      expect(result.bonus).toBeDefined();
    });

    it('应该拒绝未解锁经脉的穴位', () => {
      const meridians = createMeridianSystem();
      
      const result = activatePoint(meridians, 'ren_1', 'ren_p1');
      
      expect(result.success).toBe(false);
    });

    it('应该拒绝已打通的穴位', () => {
      const meridians = createMeridianSystem();
      unlockMeridian(meridians, 'ren_1', 100);
      activatePoint(meridians, 'ren_1', 'ren_p1');
      
      const result = activatePoint(meridians, 'ren_1', 'ren_p1');
      
      expect(result.success).toBe(false);
    });

    it('应该增加经脉经验', () => {
      const meridians = createMeridianSystem();
      unlockMeridian(meridians, 'ren_1', 100);
      
      const initialExp = meridians[0].exp;
      activatePoint(meridians, 'ren_1', 'ren_p1');
      
      expect(meridians[0].exp).toBeGreaterThan(initialExp);
    });

    it('应该升级经脉', () => {
      const meridians = createMeridianSystem();
      unlockMeridian(meridians, 'ren_1', 100);
      
      // 打通所有穴位
      meridians[0].points.forEach(p => {
        activatePoint(meridians, 'ren_1', p.id);
      });
      
      expect(meridians[0].level).toBeGreaterThan(0);
    });
  });

  describe('心法修炼', () => {
    it('应该修炼心法', () => {
      const methods = createCultivationMethods();
      
      const result = cultivateMethod(methods, 'cm_1', 100);
      
      expect(result.success).toBe(true);
      expect(methods[0].exp).toBe(100);
    });

    it('应该升级心法', () => {
      const methods = createCultivationMethods();
      
      // 修炼到满级
      cultivateMethod(methods, 'cm_1', 5000);
      
      expect(methods[0].level).toBe(1);
      expect(methods[0].exp).toBe(0);
    });

    it('应该增强属性', () => {
      const methods = createCultivationMethods();
      const initialBonus = { ...methods[0].bonus };
      
      cultivateMethod(methods, 'cm_1', 5000);
      
      expect(methods[0].bonus.health).toBeGreaterThan(initialBonus.health!);
    });

    it('应该拒绝不存在的心法', () => {
      const methods = createCultivationMethods();
      
      const result = cultivateMethod(methods, 'invalid', 100);
      
      expect(result.success).toBe(false);
    });
  });

  describe('属性加成', () => {
    it('应该获取经脉总加成', () => {
      const meridians = createMeridianSystem();
      unlockMeridian(meridians, 'ren_1', 100);
      activatePoint(meridians, 'ren_1', 'ren_p1');
      
      const bonus = getMeridianBonuses(meridians);
      
      expect(bonus.health).toBeGreaterThan(0);
    });

    it('应该获取心法总加成', () => {
      const methods = createCultivationMethods();
      cultivateMethod(methods, 'cm_1', 5000);
      
      const bonus = getCultivationBonuses(methods);
      
      expect(bonus.health).toBeGreaterThan(0);
    });

    it('应该获取总加成', () => {
      const meridians = createMeridianSystem();
      const methods = createCultivationMethods();
      
      unlockMeridian(meridians, 'ren_1', 100);
      activatePoint(meridians, 'ren_1', 'ren_p1');
      cultivateMethod(methods, 'cm_1', 5000);
      
      const total = getTotalBonuses(meridians, methods);
      
      expect(total.total.health).toBeGreaterThan(0);
      expect(total.meridian.health).toBeGreaterThan(0);
      expect(total.cultivation.health).toBeGreaterThan(0);
    });
  });

  describe('突破系统', () => {
    it('应该尝试突破', () => {
      const methods = createCultivationMethods();
      cultivateMethod(methods, 'cm_1', 4500); // 90% 经验
      
      const result = attemptBreakthrough(methods[0]);
      
      expect(result.success).toBe(true);
    });

    it('应该拒绝经验不足的突破', () => {
      const methods = createCultivationMethods();
      cultivateMethod(methods, 'cm_1', 100);
      
      const result = attemptBreakthrough(methods[0]);
      
      expect(result.success).toBe(false);
    });

    it('应该可能突破成功', () => {
      const methods = createCultivationMethods();
      let breakthroughSuccess = false;
      
      for (let i = 0; i < 20; i++) {
        const testMethods = createCultivationMethods();
        cultivateMethod(testMethods, 'cm_1', 4500);
        const result = attemptBreakthrough(testMethods[0]);
        if (result.breakthrough) {
          breakthroughSuccess = true;
          break;
        }
      }
      
      // 30% 概率，20 次尝试应该至少成功一次
      expect(breakthroughSuccess).toBe(true);
    });
  });

  describe('进度统计', () => {
    it('应该获取经脉进度', () => {
      const meridians = createMeridianSystem();
      
      const progress = getMeridianProgress(meridians);
      
      expect(progress.total).toBeGreaterThan(0);
      expect(progress.unlocked).toBe(0);
      expect(progress.activated).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('应该计算正确的进度百分比', () => {
      const meridians = createMeridianSystem();
      unlockMeridian(meridians, 'ren_1', 100);
      activatePoint(meridians, 'ren_1', 'ren_p1');
      
      const progress = getMeridianProgress(meridians);
      
      expect(progress.activated).toBe(1);
      expect(progress.percentage).toBeGreaterThan(0);
    });

    it('应该获取心法进度', () => {
      const methods = createCultivationMethods();
      
      const progress = getCultivationProgress(methods);
      
      expect(progress.total).toBeGreaterThan(0);
      expect(progress.learned).toBe(0);
      expect(progress.maxLevel).toBe(0);
    });

    it('应该计算平均等级', () => {
      const methods = createCultivationMethods();
      cultivateMethod(methods, 'cm_1', 5000);
      cultivateMethod(methods, 'cm_2', 5000);
      
      const progress = getCultivationProgress(methods);
      
      expect(progress.learned).toBe(2);
      expect(progress.averageLevel).toBe(1);
    });
  });

  describe('名称查询', () => {
    it('应该返回经脉类型名称', () => {
      expect(getMeridianTypeName('ren')).toBe('任脉');
      expect(getMeridianTypeName('du')).toBe('督脉');
      expect(getMeridianTypeName('hand')).toBe('手三阴');
      expect(getMeridianTypeName('foot')).toBe('足三阳');
      expect(getMeridianTypeName('body')).toBe('带脉');
    });

    it('应该返回心法类型名称', () => {
      expect(getCultivationTypeName('internal')).toBe('内功');
      expect(getCultivationTypeName('external')).toBe('外功');
      expect(getCultivationTypeName('lightness')).toBe('轻功');
      expect(getCultivationTypeName('sword')).toBe('剑法');
    });
  });

  describe('配置验证', () => {
    it('应该配置正确的基础消耗', () => {
      expect(CULTIVATION_CONFIG.baseCost).toBe(50);
    });

    it('应该配置正确的每日限制', () => {
      expect(CULTIVATION_CONFIG.dailyLimit).toBe(10);
    });

    it('应该配置正确的突破概率', () => {
      expect(CULTIVATION_CONFIG.breakthroughChance).toBe(0.3);
    });
  });

  describe('完整流程测试', () => {
    it('应该完成完整的经脉修炼流程', () => {
      const meridians = createMeridianSystem();
      const methods = createCultivationMethods();
      
      // 1. 解锁经脉
      expect(unlockMeridian(meridians, 'ren_1', 100).success).toBe(true);
      
      // 2. 打通穴位
      meridians[0].points.forEach(p => {
        activatePoint(meridians, 'ren_1', p.id);
      });
      
      // 3. 修炼心法
      cultivateMethod(methods, 'cm_1', 5000);
      
      // 4. 获取加成
      const total = getTotalBonuses(meridians, methods);
      
      expect(total.total.health).toBeGreaterThan(0);
      expect(total.total.attack).toBeGreaterThan(0);
      
      // 5. 获取进度
      const meridianProgress = getMeridianProgress(meridians);
      const methodProgress = getCultivationProgress(methods);
      
      expect(meridianProgress.activated).toBeGreaterThan(0);
      expect(methodProgress.learned).toBe(1);
    });

    it('应该处理多条经脉', () => {
      const meridians = createMeridianSystem();
      
      // 解锁多条经脉
      unlockMeridian(meridians, 'ren_1', 100);
      unlockMeridian(meridians, 'du_1', 100);
      
      // 打通穴位
      activatePoint(meridians, 'ren_1', 'ren_p1');
      activatePoint(meridians, 'du_1', 'du_p1');
      
      const bonus = getMeridianBonuses(meridians);
      
      expect(bonus.health).toBeGreaterThan(0);
      expect(bonus.attack).toBeGreaterThan(0);
    });
  });
});
