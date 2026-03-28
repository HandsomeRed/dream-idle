// v0.94 阵法系统单元测试
import {
  getFormation,
  getAllFormations,
  getPositionMultiplier,
  calculateFormationBonus,
  getFormationBonusesAtPosition,
  checkFormationMatchup,
  getFormationDamageMultiplier,
  getExpForLevel,
  getTotalExpForLevel,
  addFormationExp,
  unlockFormation,
  getPlayerFormation,
  activateFormation,
  getFormationStats,
  validateFormationPositions,
} from '../systems/formationSystem';
import { FORMATIONS, FORMATION_CONFIG } from '../data/formations';
import { PlayerFormation } from '../types/formation';

describe('v0.94 阵法系统', () => {
  describe('基础数据查询', () => {
    test('应该能获取所有 9 个阵法', () => {
      const formations = getAllFormations();
      expect(formations).toHaveLength(9);
    });

    test('应该能通过 ID 获取天覆阵', () => {
      const formation = getFormation('tian_fu');
      expect(formation).toBeDefined();
      expect(formation?.name).toBe('天覆阵');
      expect(formation?.bonuses).toHaveLength(10); // 5 速 +5 伤
    });

    test('应该能通过 ID 获取地载阵', () => {
      const formation = getFormation('di_zai');
      expect(formation).toBeDefined();
      expect(formation?.name).toBe('地载阵');
    });

    test('不存在的阵法应该返回 undefined', () => {
      const formation = getFormation('non_existent');
      expect(formation).toBeUndefined();
    });

    test('所有阵法都应该有完整的属性', () => {
      const formations = getAllFormations();
      formations.forEach(f => {
        expect(f.id).toBeDefined();
        expect(f.name).toBeDefined();
        expect(f.description).toBeDefined();
        expect(f.level).toBe(1);
        expect(f.maxLevel).toBe(20);
        expect(f.bonuses).toBeDefined();
        expect(f.bonuses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('位置系数', () => {
    test('队长位 (1 号位) 系数应该是 100%', () => {
      expect(getPositionMultiplier(1)).toBe(1.0);
    });

    test('2 号位系数应该是 80%', () => {
      expect(getPositionMultiplier(2)).toBe(0.8);
    });

    test('3-5 号位系数应该是 60%', () => {
      expect(getPositionMultiplier(3)).toBe(0.6);
      expect(getPositionMultiplier(4)).toBe(0.6);
      expect(getPositionMultiplier(5)).toBe(0.6);
    });

    test('无效位置应该返回 0.6', () => {
      expect(getPositionMultiplier(0)).toBe(0.6);
      expect(getPositionMultiplier(6)).toBe(0.6);
    });
  });

  describe('阵法加成计算', () => {
    test('天覆阵 1 级队长位速度加成应该是 15%', () => {
      const formation = getFormation('tian_fu')!;
      const bonus = calculateFormationBonus(formation, 1, 'speed');
      expect(bonus).toBe(15);
    });

    test('天覆阵 1 级 2 号位速度加成应该是 12% (15*0.8)', () => {
      const formation = getFormation('tian_fu')!;
      const bonus = calculateFormationBonus(formation, 2, 'speed');
      expect(bonus).toBeCloseTo(12, 1);
    });

    test('天覆阵 1 级 3 号位速度加成应该是 9% (15*0.6)', () => {
      const formation = getFormation('tian_fu')!;
      const bonus = calculateFormationBonus(formation, 3, 'speed');
      expect(bonus).toBeCloseTo(9, 1);
    });

    test('天覆阵 1 级队长位伤害减成应该是 -5%', () => {
      const formation = getFormation('tian_fu')!;
      const bonus = calculateFormationBonus(formation, 1, 'damage');
      expect(bonus).toBe(-5);
    });

    test('阵法等级提升应该增加加成效果', () => {
      const formation = getFormation('tian_fu')!;
      formation.level = 11; // +20% 效果
      
      const bonus = calculateFormationBonus(formation, 1, 'speed');
      expect(bonus).toBeCloseTo(18, 1); // 15 * 1.2
    });

    test('没有加成的属性应该返回 0', () => {
      const formation = getFormation('tian_fu')!;
      const bonus = calculateFormationBonus(formation, 1, 'defense');
      expect(bonus).toBe(0);
    });

    test('应该能获取位置的所有加成', () => {
      const formation = getFormation('di_zai')!;
      const bonuses = getFormationBonusesAtPosition(formation, 1);
      
      expect(bonuses.length).toBe(2); // 防御 +20, 速度 -10
      const defenseBonus = bonuses.find(b => b.stat === 'defense');
      const speedBonus = bonuses.find(b => b.stat === 'speed');
      
      expect(defenseBonus?.value).toBe(20);
      expect(speedBonus?.value).toBe(-10);
    });
  });

  describe('阵法克制关系', () => {
    test('天覆阵应该克制地载阵', () => {
      expect(checkFormationMatchup('tian_fu', 'di_zai')).toBe('strong');
    });

    test('地载阵应该被天覆阵克制', () => {
      expect(checkFormationMatchup('di_zai', 'tian_fu')).toBe('weak');
    });

    test('相同阵法应该是平局', () => {
      expect(checkFormationMatchup('tian_fu', 'tian_fu')).toBe('neutral');
    });

    test('无克制关系的阵法应该是平局', () => {
      // 天覆阵和龙飞阵没有直接克制关系
      expect(checkFormationMatchup('tian_fu', 'long_fei')).toBe('neutral');
    });

    test('克制关系应该是循环的', () => {
      // 天>地>风>云>鸟>蛇>虎>龙>雷>天
      expect(checkFormationMatchup('di_zai', 'feng_yang')).toBe('strong');
      expect(checkFormationMatchup('feng_yang', 'yun_chui')).toBe('strong');
      expect(checkFormationMatchup('yun_chui', 'niao_xiang')).toBe('strong');
      expect(checkFormationMatchup('niao_xiang', 'she_pan')).toBe('strong');
      expect(checkFormationMatchup('she_pan', 'hu_yi')).toBe('strong');
      expect(checkFormationMatchup('hu_yi', 'long_fei')).toBe('strong');
      expect(checkFormationMatchup('long_fei', 'lei_jue')).toBe('strong');
      expect(checkFormationMatchup('lei_jue', 'tian_fu')).toBe('strong');
    });

    test('克制方伤害加成应该是 25%', () => {
      const multiplier = getFormationDamageMultiplier('tian_fu', 'di_zai');
      expect(multiplier).toBe(1.25);
    });

    test('被克制方伤害减成应该是 25%', () => {
      const multiplier = getFormationDamageMultiplier('di_zai', 'tian_fu');
      expect(multiplier).toBe(0.75);
    });

    test('平局伤害系数应该是 100%', () => {
      const multiplier = getFormationDamageMultiplier('tian_fu', 'tian_fu');
      expect(multiplier).toBe(1.0);
    });
  });

  describe('阵法经验系统', () => {
    test('1 级所需经验应该是 0', () => {
      expect(getExpForLevel(1)).toBe(0);
    });

    test('2 级所需经验应该是 100 * 1.2^1 = 120', () => {
      expect(getExpForLevel(2)).toBe(120); // baseExpPerLevel * growthRate^(level-1)
    });

    test('升级所需经验应该递增', () => {
      const exp2 = getExpForLevel(2);
      const exp3 = getExpForLevel(3);
      const exp4 = getExpForLevel(4);
      
      expect(exp3).toBeGreaterThan(exp2);
      expect(exp4).toBeGreaterThan(exp3);
    });

    test('累计经验计算应该正确', () => {
      const totalExp3 = getTotalExpForLevel(3);
      const exp2 = getExpForLevel(2);
      const exp3 = getExpForLevel(3);
      
      expect(totalExp3).toBe(exp2 + exp3);
    });

    test('超过最大等级应该返回 Infinity', () => {
      expect(getExpForLevel(21)).toBe(Infinity);
    });

    test('添加经验应该能升级', () => {
      const formation: PlayerFormation = {
        formationId: 'tian_fu',
        level: 1,
        exp: 0,
        unlocked: true,
      };
      
      const result = addFormationExp(formation, 120); // 2 级需要 120 exp
      
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(formation.level).toBe(2);
      expect(formation.exp).toBe(0); // 多余经验应该扣除
    });

    test('添加不足经验不应该升级', () => {
      const formation: PlayerFormation = {
        formationId: 'tian_fu',
        level: 1,
        exp: 0,
        unlocked: true,
      };
      
      const result = addFormationExp(formation, 50);
      
      expect(result.leveledUp).toBe(false);
      expect(result.newLevel).toBe(1);
      expect(formation.exp).toBe(50);
    });

    test('添加大量经验应该连续升级', () => {
      const formation: PlayerFormation = {
        formationId: 'tian_fu',
        level: 1,
        exp: 0,
        unlocked: true,
      };
      
      const result = addFormationExp(formation, 500);
      
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBeGreaterThan(2);
    });

    test('未解锁阵法添加经验不应该升级', () => {
      const formation: PlayerFormation = {
        formationId: 'tian_fu',
        level: 1,
        exp: 0,
        unlocked: false,
      };
      
      const result = addFormationExp(formation, 1000);
      
      expect(result.leveledUp).toBe(false);
      expect(formation.level).toBe(1);
    });

    test('达到最大等级后不应该再升级', () => {
      const formation: PlayerFormation = {
        formationId: 'tian_fu',
        level: 20,
        exp: 0,
        unlocked: true,
      };
      
      const result = addFormationExp(formation, 10000);
      
      expect(result.leveledUp).toBe(false);
      expect(formation.level).toBe(20);
    });
  });

  describe('阵法解锁', () => {
    test('应该能解锁新阵法', () => {
      const formations: PlayerFormation[] = [];
      
      const result = unlockFormation(formations, 'tian_fu');
      
      expect(result).toBe(true);
      expect(formations).toHaveLength(1);
      expect(formations[0].formationId).toBe('tian_fu');
      expect(formations[0].unlocked).toBe(true);
      expect(formations[0].level).toBe(1);
    });

    test('解锁已存在的阵法应该标记为已解锁', () => {
      const formations: PlayerFormation[] = [
        { formationId: 'tian_fu', level: 1, exp: 0, unlocked: false },
      ];
      
      const result = unlockFormation(formations, 'tian_fu');
      
      expect(result).toBe(true);
      expect(formations[0].unlocked).toBe(true);
    });

    test('应该能获取玩家的阵法', () => {
      const formations: PlayerFormation[] = [
        { formationId: 'tian_fu', level: 5, exp: 100, unlocked: true },
      ];
      
      const formation = getPlayerFormation(formations, 'tian_fu');
      
      expect(formation).toBeDefined();
      expect(formation?.level).toBe(5);
    });

    test('获取不存在的玩家阵法应该返回 undefined', () => {
      const formations: PlayerFormation[] = [];
      
      const formation = getPlayerFormation(formations, 'tian_fu');
      
      expect(formation).toBeUndefined();
    });
  });

  describe('阵法激活', () => {
    test('应该能激活阵法', () => {
      const positions = {
        1: 'player1',
        2: 'player2',
        3: 'player3',
        4: 'player4',
        5: 'player5',
      };
      
      // 先解锁阵法
      const playerFormations: PlayerFormation[] = [];
      unlockFormation(playerFormations, 'tian_fu');
      
      const active = activateFormation('tian_fu', positions);
      
      expect(active).not.toBeNull();
      expect(active?.formationId).toBe('tian_fu');
      expect(active?.effects.length).toBeGreaterThan(0);
    });

    test('未解锁阵法不能激活', () => {
      const positions = { 1: 'player1' };
      const playerFormations: PlayerFormation[] = []; // 未解锁任何阵法
      
      const active = activateFormation('tian_fu', positions, playerFormations);
      
      expect(active).toBeNull();
    });

    test('不存在的阵法不能激活', () => {
      const positions = { 1: 'player1' };
      
      const active = activateFormation('non_existent', positions);
      
      expect(active).toBeNull();
    });
  });

  describe('阵法统计', () => {
    test('应该能获取阵法总加成统计', () => {
      const formation = getFormation('tian_fu')!;
      const stats = getFormationStats(formation);
      
      expect(stats.speed).toBe(75); // 5 个位置 * 15
      expect(stats.damage).toBe(-25); // 5 个位置 * -5
    });

    test('地载阵统计应该正确', () => {
      const formation = getFormation('di_zai')!;
      const stats = getFormationStats(formation);
      
      expect(stats.defense).toBe(100); // 5 * 20
      expect(stats.speed).toBe(-50); // 5 * -10
    });
  });

  describe('位置验证', () => {
    test('完整有效的位置应该通过验证', () => {
      const positions = {
        1: 'player1',
        2: 'player2',
        3: 'player3',
        4: 'player4',
        5: 'player5',
      };
      
      const result = validateFormationPositions(positions);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('缺少队长位应该验证失败', () => {
      const positions = {
        2: 'player2',
        3: 'player3',
      };
      
      const result = validateFormationPositions(positions);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('队长位 (1 号位) 必须有玩家');
    });

    test('玩家重复应该验证失败', () => {
      const positions = {
        1: 'player1',
        2: 'player1', // 重复
        3: 'player3',
      };
      
      const result = validateFormationPositions(positions);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('部分位置为空应该允许', () => {
      const positions = {
        1: 'player1',
        2: 'player2',
      };
      
      const result = validateFormationPositions(positions);
      
      expect(result.valid).toBe(true);
    });
  });
});
