// 自动战斗AI系统测试 - v0.67

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  PRESET_STRATEGIES,
  STRATEGY_NAMES,
  createAIConfig,
  createAutoBattleState,
  getHpRatio,
  selectTarget,
  selectSkill,
  makeDecision,
  calculateDamage,
  simulateTurn,
  simulateBattle,
  recordBattle,
  shouldContinue,
  startAutoBattle,
  stopAutoBattle,
  getAutoBattleStats,
  updateAIConfig,
  switchStrategy,
  getStrategyName,
  createTestUnit,
  exportAutoBattleData,
  importAutoBattleData,
  type AIConfig,
  type AutoBattleState,
  type BattleUnit,
  type BattleSkill,
} from './autoBattle';

// 辅助函数：创建测试技能
function createSkill(overrides: Partial<BattleSkill> & { id: string; name: string }): BattleSkill {
  return {
    type: 'attack',
    power: 1.5,
    cooldown: 2,
    currentCooldown: 0,
    targetType: 'enemy',
    ...overrides,
  };
}

describe('自动战斗AI系统 v0.67', () => {
  // ==================== 配置测试 ====================
  describe('配置', () => {
    it('应有6种预设策略', () => {
      expect(Object.keys(PRESET_STRATEGIES)).toHaveLength(6);
    });

    it('每种策略应有中文名', () => {
      Object.keys(PRESET_STRATEGIES).forEach(key => {
        expect(STRATEGY_NAMES[key as keyof typeof STRATEGY_NAMES]).toBeDefined();
      });
    });

    it('创建默认配置应为balanced', () => {
      const config = createAIConfig();
      expect(config.strategy).toBe('balanced');
      expect(config.autoRepeat).toBe(true);
    });

    it('创建指定策略配置', () => {
      const config = createAIConfig('aggressive');
      expect(config.strategy).toBe('aggressive');
      expect(config.useHealing).toBe(false);
    });

    it('boss策略应更保守', () => {
      const config = createAIConfig('boss');
      expect(config.useHealing).toBe(true);
      expect(config.stopOnDefeat).toBe(true);
      expect(config.skillPolicy).toBe('save_ultimate');
    });
  });

  // ==================== 状态测试 ====================
  describe('状态管理', () => {
    it('创建初始状态', () => {
      const state = createAutoBattleState();
      expect(state.battleCount).toBe(0);
      expect(state.winCount).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.logs).toHaveLength(0);
    });

    it('开始自动战斗', () => {
      let state = createAutoBattleState();
      state = startAutoBattle(state);
      expect(state.isRunning).toBe(true);
    });

    it('停止自动战斗', () => {
      let state = createAutoBattleState();
      state = startAutoBattle(state);
      state = stopAutoBattle(state);
      expect(state.isRunning).toBe(false);
    });
  });

  // ==================== 单位工具测试 ====================
  describe('单位工具', () => {
    it('HP比例计算', () => {
      const unit = createTestUnit({ id: 'u1', name: 'Test', isAlly: true, hp: 500, maxHp: 1000 });
      expect(getHpRatio(unit)).toBe(0.5);
    });

    it('HP为0时比例为0', () => {
      const unit = createTestUnit({ id: 'u1', name: 'Test', isAlly: true, hp: 0, maxHp: 1000 });
      expect(getHpRatio(unit)).toBe(0);
    });

    it('maxHp为0时比例为0', () => {
      const unit = createTestUnit({ id: 'u1', name: 'Test', isAlly: true, hp: 0, maxHp: 0 });
      expect(getHpRatio(unit)).toBe(0);
    });
  });

  // ==================== 目标选择测试 ====================
  describe('目标选择', () => {
    const enemies = [
      createTestUnit({ id: 'e1', name: 'A', isAlly: false, hp: 100, atk: 50, def: 10 }),
      createTestUnit({ id: 'e2', name: 'B', isAlly: false, hp: 500, atk: 200, def: 80 }),
      createTestUnit({ id: 'e3', name: 'C', isAlly: false, hp: 300, atk: 100, def: 30, position: 'back' }),
    ];

    it('lowest_hp应选血量最低的', () => {
      const target = selectTarget(enemies, 'lowest_hp');
      expect(target!.id).toBe('e1');
    });

    it('highest_hp应选血量最高的', () => {
      const target = selectTarget(enemies, 'highest_hp');
      expect(target!.id).toBe('e2');
    });

    it('lowest_def应选防御最低的', () => {
      const target = selectTarget(enemies, 'lowest_def');
      expect(target!.id).toBe('e1');
    });

    it('highest_atk应选攻击最高的', () => {
      const target = selectTarget(enemies, 'highest_atk');
      expect(target!.id).toBe('e2');
    });

    it('back_row应优先后排', () => {
      const target = selectTarget(enemies, 'back_row');
      expect(target!.id).toBe('e3');
    });

    it('空敌人列表应返回null', () => {
      const target = selectTarget([], 'lowest_hp');
      expect(target).toBeNull();
    });

    it('全部死亡应返回null', () => {
      const dead = enemies.map(e => ({ ...e, hp: 0 }));
      const target = selectTarget(dead, 'lowest_hp');
      expect(target).toBeNull();
    });
  });

  // ==================== 技能选择测试 ====================
  describe('技能选择', () => {
    const unit = createTestUnit({
      id: 'u1', name: 'Hero', isAlly: true,
      skills: [
        createSkill({ id: 's1', name: '普攻', type: 'attack', power: 1 }),
        createSkill({ id: 's2', name: 'AOE', type: 'aoe', power: 0.8 }),
        createSkill({ id: 's3', name: '治疗', type: 'heal', power: 1.2, targetType: 'ally' }),
        createSkill({ id: 's4', name: '大招', type: 'ultimate', power: 3 }),
      ],
    });
    const allies = [unit];
    const enemies = [
      createTestUnit({ id: 'e1', name: 'E1', isAlly: false }),
      createTestUnit({ id: 'e2', name: 'E2', isAlly: false }),
    ];

    it('strongest_first应选最强技能', () => {
      const config = createAIConfig('aggressive');
      const skill = selectSkill(unit, allies, enemies, config);
      expect(skill!.id).toBe('s4'); // 大招 power=3
    });

    it('aoe_priority多敌人应选AOE', () => {
      const config = createAIConfig('balanced');
      const skill = selectSkill(unit, allies, enemies, config);
      expect(skill!.id).toBe('s2');
    });

    it('heal_priority有低血队友应选治疗', () => {
      const config = createAIConfig('defensive');
      const lowHpAlly = createTestUnit({ id: 'u2', name: 'LowHP', isAlly: true, hp: 100, maxHp: 1000 });
      const skill = selectSkill(unit, [unit, lowHpAlly], enemies, config);
      expect(skill!.id).toBe('s3');
    });

    it('save_ultimate敌人血多时不用大招', () => {
      const config = createAIConfig('boss');
      const skill = selectSkill(unit, allies, enemies, config);
      expect(skill!.id).not.toBe('s4');
    });

    it('CD中的技能不应被选择', () => {
      const cdUnit = {
        ...unit,
        skills: unit.skills.map(s => ({ ...s, currentCooldown: s.id === 's4' ? 3 : 0 })),
      };
      const config = createAIConfig('aggressive');
      const skill = selectSkill(cdUnit, allies, enemies, config);
      expect(skill!.id).not.toBe('s4');
    });
  });

  // ==================== AI决策测试 ====================
  describe('AI决策', () => {
    it('低血量应使用药水', () => {
      const unit = createTestUnit({ id: 'u1', name: 'Hero', isAlly: true, hp: 100, maxHp: 1000 });
      const enemies = [createTestUnit({ id: 'e1', name: 'E', isAlly: false })];
      const config = createAIConfig('balanced');
      const decision = makeDecision(unit, [unit], enemies, config);
      expect(decision.action).toBe('potion');
    });

    it('防御策略低血量应防御', () => {
      const unit = createTestUnit({ id: 'u1', name: 'Hero', isAlly: true, hp: 400, maxHp: 1000 });
      const enemies = [createTestUnit({ id: 'e1', name: 'E', isAlly: false })];
      const config = createAIConfig('defensive');
      config.autoPotion = false;
      const decision = makeDecision(unit, [unit], enemies, config);
      expect(decision.action).toBe('defend');
    });

    it('正常血量应攻击或使用技能', () => {
      const unit = createTestUnit({ id: 'u1', name: 'Hero', isAlly: true, hp: 900, maxHp: 1000 });
      const enemies = [createTestUnit({ id: 'e1', name: 'E', isAlly: false })];
      const config = createAIConfig('balanced');
      const decision = makeDecision(unit, [unit], enemies, config);
      expect(['attack', 'skill']).toContain(decision.action);
    });
  });

  // ==================== 伤害计算测试 ====================
  describe('伤害计算', () => {
    it('基础伤害计算', () => {
      const attacker = createTestUnit({ id: 'a', name: 'A', isAlly: true, atk: 100 });
      const defender = createTestUnit({ id: 'd', name: 'D', isAlly: false, def: 50 });
      const damage = calculateDamage(attacker, defender);
      expect(damage).toBeGreaterThan(0);
    });

    it('暴击应造成更多伤害', () => {
      const attacker = createTestUnit({ id: 'a', name: 'A', isAlly: true, atk: 100 });
      const defender = createTestUnit({ id: 'd', name: 'D', isAlly: false, def: 50 });
      const normal = calculateDamage(attacker, defender, 1, false);
      const crit = calculateDamage(attacker, defender, 1, true);
      expect(crit).toBeGreaterThan(normal);
    });

    it('高技能倍率应造成更多伤害', () => {
      const attacker = createTestUnit({ id: 'a', name: 'A', isAlly: true, atk: 100 });
      const defender = createTestUnit({ id: 'd', name: 'D', isAlly: false, def: 50 });
      const low = calculateDamage(attacker, defender, 1);
      const high = calculateDamage(attacker, defender, 2);
      expect(high).toBeGreaterThan(low);
    });

    it('最低伤害应为1', () => {
      const attacker = createTestUnit({ id: 'a', name: 'A', isAlly: true, atk: 1 });
      const defender = createTestUnit({ id: 'd', name: 'D', isAlly: false, def: 999 });
      const damage = calculateDamage(attacker, defender);
      expect(damage).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== 战斗模拟测试 ====================
  describe('战斗模拟', () => {
    it('应能完成一场战斗', () => {
      const allies = [createTestUnit({ id: 'a1', name: 'Hero', isAlly: true, atk: 150 })];
      const enemies = [createTestUnit({ id: 'e1', name: 'Slime', isAlly: false, hp: 200, atk: 30 })];
      const config = createAIConfig('aggressive');
      const result = simulateBattle(allies, enemies, config, 30, () => 0.5);
      expect(result.turns).toBeGreaterThan(0);
      expect(result.logs.length).toBeGreaterThan(0);
    });

    it('强力队伍应获胜', () => {
      const allies = [createTestUnit({ id: 'a1', name: 'Hero', isAlly: true, atk: 500, def: 200, hp: 5000, maxHp: 5000 })];
      const enemies = [createTestUnit({ id: 'e1', name: 'Slime', isAlly: false, hp: 100, atk: 10 })];
      const config = createAIConfig('aggressive');
      const result = simulateBattle(allies, enemies, config, 30, () => 0.5);
      expect(result.won).toBe(true);
    });

    it('战斗应在maxTurns内结束', () => {
      const allies = [createTestUnit({ id: 'a1', name: 'A', isAlly: true })];
      const enemies = [createTestUnit({ id: 'e1', name: 'E', isAlly: false })];
      const config = createAIConfig();
      const result = simulateBattle(allies, enemies, config, 10, () => 0.5);
      expect(result.turns).toBeLessThanOrEqual(10);
    });

    it('记录战斗结果应更新状态', () => {
      let state = createAutoBattleState();
      state = recordBattle(state, true, 5, 1000, 300, 200, []);
      expect(state.battleCount).toBe(1);
      expect(state.winCount).toBe(1);
      expect(state.totalDamageDealt).toBe(1000);
    });

    it('多场战斗应累计', () => {
      let state = createAutoBattleState();
      state = recordBattle(state, true, 5, 1000, 300, 200, []);
      state = recordBattle(state, false, 8, 500, 800, 100, []);
      expect(state.battleCount).toBe(2);
      expect(state.winCount).toBe(1);
      expect(state.loseCount).toBe(1);
    });
  });

  // ==================== 自动战斗控制测试 ====================
  describe('自动战斗控制', () => {
    it('运行中应继续', () => {
      let state = createAutoBattleState();
      state = startAutoBattle(state);
      expect(shouldContinue(state, true)).toBe(true);
    });

    it('停止后不应继续', () => {
      let state = createAutoBattleState();
      state = stopAutoBattle(state);
      expect(shouldContinue(state, true)).toBe(false);
    });

    it('stopOnDefeat失败后应停止', () => {
      let state = createAutoBattleState(createAIConfig('boss'));
      state = startAutoBattle(state);
      expect(shouldContinue(state, false)).toBe(false);
    });

    it('达到最大次数应停止', () => {
      let state = createAutoBattleState();
      state.config.maxRepeatCount = 5;
      state.battleCount = 5;
      state = startAutoBattle(state);
      expect(shouldContinue(state, true)).toBe(false);
    });

    it('未达最大次数应继续', () => {
      let state = createAutoBattleState();
      state.config.maxRepeatCount = 5;
      state.battleCount = 3;
      state = startAutoBattle(state);
      expect(shouldContinue(state, true)).toBe(true);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('初始统计', () => {
      const state = createAutoBattleState();
      const stats = getAutoBattleStats(state);
      expect(stats.battleCount).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.isRunning).toBe(false);
    });

    it('战斗后统计应正确', () => {
      let state = createAutoBattleState();
      state = recordBattle(state, true, 5, 1000, 300, 200, []);
      state = recordBattle(state, true, 3, 800, 200, 100, []);
      state = recordBattle(state, false, 10, 500, 1000, 50, []);
      const stats = getAutoBattleStats(state);
      expect(stats.battleCount).toBe(3);
      expect(stats.winRate).toBe(67); // 2/3
      expect(stats.avgTurns).toBe(6); // (5+3+10)/3
    });
  });

  // ==================== 配置修改测试 ====================
  describe('配置修改', () => {
    it('更新部分配置', () => {
      let state = createAutoBattleState();
      state = updateAIConfig(state, { speedMultiplier: 4 });
      expect(state.config.speedMultiplier).toBe(4);
    });

    it('切换策略', () => {
      let state = createAutoBattleState();
      state = switchStrategy(state, 'aggressive');
      expect(state.config.strategy).toBe('aggressive');
    });

    it('切换策略应保留autoRepeat设置', () => {
      let state = createAutoBattleState();
      state.config.autoRepeat = false;
      state = switchStrategy(state, 'boss');
      expect(state.config.autoRepeat).toBe(false);
    });

    it('获取策略名称', () => {
      expect(getStrategyName('aggressive')).toBe('猛攻');
      expect(getStrategyName('boss')).toBe('Boss战');
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const state = createAutoBattleState();
      const json = exportAutoBattleData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).battleCount).toBe(0);
    });

    it('导入应还原数据', () => {
      let state = createAutoBattleState();
      state = recordBattle(state, true, 5, 1000, 300, 0, []);
      const json = exportAutoBattleData(state);
      const imported = importAutoBattleData(json);
      expect(imported).toBeDefined();
      expect(imported!.battleCount).toBe(1);
    });

    it('无效数据应返回null', () => {
      expect(importAutoBattleData('nope')).toBeNull();
      expect(importAutoBattleData('{}')).toBeNull();
    });
  });

  // ==================== 边界情况 ====================
  describe('边界情况', () => {
    it('日志应限制200条', () => {
      let state = createAutoBattleState();
      const logs = Array.from({ length: 210 }, (_, i) => ({
        turn: i, unitId: 'u1', unitName: 'Test', action: 'attack',
      }));
      state = recordBattle(state, true, 1, 0, 0, 0, logs);
      expect(state.logs.length).toBeLessThanOrEqual(200);
    });

    it('无技能单位应普通攻击', () => {
      const unit = createTestUnit({ id: 'u1', name: 'Basic', isAlly: true, skills: [] });
      const enemies = [createTestUnit({ id: 'e1', name: 'E', isAlly: false })];
      const config = createAIConfig();
      const decision = makeDecision(unit, [unit], enemies, config);
      expect(decision.action).toBe('attack');
    });
  });
});
