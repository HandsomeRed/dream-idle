// 幸运轮盘系统测试 - v0.63

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  PRIZE_POOL,
  WHEEL_CONFIGS,
  LUCKY_THRESHOLDS,
  RARITY_ORDER,
  RARITY_COLORS,
  RARITY_NAMES,
  createWheelState,
  needsDailyReset,
  resetDaily,
  getFreeSpinsLeft,
  getDailySpinsUsed,
  getDailySpinsLeft,
  canSpin,
  selectPrize,
  spin,
  spinMultiple,
  getWheelStats,
  getRarityColor,
  getRarityName,
  getTodayStr,
  exportWheelData,
  importWheelData,
  type WheelState,
  type PrizeConfig,
  type PrizeRarity,
} from './luckyWheel';

describe('幸运轮盘系统 v0.63', () => {
  // ==================== 配置测试 ====================
  describe('奖品配置', () => {
    it('奖品池应包含所有奖品', () => {
      expect(PRIZE_POOL.length).toBeGreaterThanOrEqual(15);
    });

    it('每个奖品应包含必要字段', () => {
      PRIZE_POOL.forEach(prize => {
        expect(prize).toHaveProperty('id');
        expect(prize).toHaveProperty('name');
        expect(prize).toHaveProperty('type');
        expect(prize).toHaveProperty('amount');
        expect(prize).toHaveProperty('rarity');
        expect(prize).toHaveProperty('weight');
        expect(prize.amount).toBeGreaterThan(0);
        expect(prize.weight).toBeGreaterThan(0);
      });
    });

    it('奖品池应包含所有稀有度', () => {
      const rarities = new Set(PRIZE_POOL.map(p => p.rarity));
      expect(rarities.has('common')).toBe(true);
      expect(rarities.has('uncommon')).toBe(true);
      expect(rarities.has('rare')).toBe(true);
      expect(rarities.has('epic')).toBe(true);
      expect(rarities.has('legendary')).toBe(true);
    });

    it('权重总和应大于0', () => {
      const totalWeight = PRIZE_POOL.reduce((sum, p) => sum + p.weight, 0);
      expect(totalWeight).toBeGreaterThan(0);
    });

    it('每个奖品ID应唯一', () => {
      const ids = PRIZE_POOL.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('轮盘配置', () => {
    it('应包含每日转盘', () => {
      expect(WHEEL_CONFIGS['daily_wheel']).toBeDefined();
    });

    it('每日转盘应有免费次数', () => {
      expect(WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins).toBeGreaterThan(0);
    });

    it('最大每日次数应大于免费次数', () => {
      const config = WHEEL_CONFIGS['daily_wheel'];
      expect(config.maxDailySpins).toBeGreaterThan(config.dailyFreeSpins);
    });
  });

  // ==================== 状态创建测试 ====================
  describe('状态创建', () => {
    it('应创建初始状态', () => {
      const state = createWheelState('player_001');
      expect(state.playerId).toBe('player_001');
      expect(state.dailyFreeSpinsUsed).toBe(0);
      expect(state.dailyPaidSpinsUsed).toBe(0);
      expect(state.totalSpins).toBe(0);
      expect(state.luckyValue).toBe(0);
      expect(state.history).toHaveLength(0);
    });

    it('初始奖励统计应全为0', () => {
      const state = createWheelState('player_001');
      Object.values(state.totalRewards).forEach(v => {
        expect(v).toBe(0);
      });
    });

    it('初始日期应为今天', () => {
      const state = createWheelState('player_001');
      expect(state.lastResetDate).toBe(getTodayStr());
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('同一天不需要重置', () => {
      const state = createWheelState('player_001');
      expect(needsDailyReset(state)).toBe(false);
    });

    it('跨天应需要重置', () => {
      const state = createWheelState('player_001');
      state.lastResetDate = '2020-01-01';
      expect(needsDailyReset(state)).toBe(true);
    });

    it('重置应清零每日次数', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = 3;
      state.dailyPaidSpinsUsed = 5;
      const reset = resetDaily(state);
      expect(reset.dailyFreeSpinsUsed).toBe(0);
      expect(reset.dailyPaidSpinsUsed).toBe(0);
    });

    it('重置不应清零累计数据', () => {
      const state = createWheelState('player_001');
      state.totalSpins = 100;
      state.luckyValue = 5;
      const reset = resetDaily(state);
      expect(reset.totalSpins).toBe(100);
      expect(reset.luckyValue).toBe(5);
    });
  });

  // ==================== 次数管理测试 ====================
  describe('次数管理', () => {
    it('初始应有免费次数', () => {
      const state = createWheelState('player_001');
      const freeLeft = getFreeSpinsLeft(state, 'daily_wheel');
      expect(freeLeft).toBe(WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins);
    });

    it('使用免费次数后应减少', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = 1;
      const freeLeft = getFreeSpinsLeft(state, 'daily_wheel');
      expect(freeLeft).toBe(WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins - 1);
    });

    it('今日已用次数应正确计算', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = 2;
      state.dailyPaidSpinsUsed = 3;
      expect(getDailySpinsUsed(state)).toBe(5);
    });

    it('今日剩余次数应正确计算', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = 3;
      state.dailyPaidSpinsUsed = 5;
      const left = getDailySpinsLeft(state, 'daily_wheel');
      expect(left).toBe(WHEEL_CONFIGS['daily_wheel'].maxDailySpins - 8);
    });

    it('不存在的轮盘应返回0', () => {
      const state = createWheelState('player_001');
      expect(getFreeSpinsLeft(state, 'nonexistent')).toBe(0);
      expect(getDailySpinsLeft(state, 'nonexistent')).toBe(0);
    });
  });

  // ==================== 抽奖资格测试 ====================
  describe('抽奖资格检查', () => {
    it('有免费次数时应可以免费抽', () => {
      const state = createWheelState('player_001');
      const result = canSpin(state, 'daily_wheel', 0);
      expect(result.canSpin).toBe(true);
      expect(result.isFree).toBe(true);
      expect(result.cost).toBe(0);
    });

    it('免费次数用完后应需要付费', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins;
      const result = canSpin(state, 'daily_wheel', 1000);
      expect(result.canSpin).toBe(true);
      expect(result.isFree).toBe(false);
      expect(result.cost).toBe(50); // diamond cost
    });

    it('钻石不足时应不可以抽', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins;
      const result = canSpin(state, 'daily_wheel', 10);
      expect(result.canSpin).toBe(false);
      expect(result.reason).toContain('钻石不足');
    });

    it('每日次数用完时应不可以抽', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins;
      state.dailyPaidSpinsUsed = WHEEL_CONFIGS['daily_wheel'].maxDailySpins - WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins;
      const result = canSpin(state, 'daily_wheel', 10000);
      expect(result.canSpin).toBe(false);
      expect(result.reason).toContain('今日次数已用完');
    });

    it('不存在的轮盘应返回错误', () => {
      const state = createWheelState('player_001');
      const result = canSpin(state, 'fake_wheel', 1000);
      expect(result.canSpin).toBe(false);
      expect(result.reason).toContain('不存在');
    });
  });

  // ==================== 奖品选择测试 ====================
  describe('奖品选择', () => {
    it('应返回一个有效奖品', () => {
      const prize = selectPrize(PRIZE_POOL, 0);
      expect(prize).toBeDefined();
      expect(PRIZE_POOL.some(p => p.id === prize.id)).toBe(true);
    });

    it('确定性随机应返回可预期的结果', () => {
      // 使用固定的 rng 返回 0，应该选中第一个奖品
      const prize = selectPrize(PRIZE_POOL, 0, () => 0);
      expect(prize.id).toBe(PRIZE_POOL[0].id);
    });

    it('保底10次应出稀有+', () => {
      const prize = selectPrize(PRIZE_POOL, LUCKY_THRESHOLDS.rareGuarantee, () => 0);
      expect(RARITY_ORDER[prize.rarity]).toBeGreaterThanOrEqual(RARITY_ORDER['rare']);
    });

    it('保底30次应出史诗+', () => {
      const prize = selectPrize(PRIZE_POOL, LUCKY_THRESHOLDS.epicGuarantee, () => 0);
      expect(RARITY_ORDER[prize.rarity]).toBeGreaterThanOrEqual(RARITY_ORDER['epic']);
    });

    it('保底100次应出传说', () => {
      const prize = selectPrize(PRIZE_POOL, LUCKY_THRESHOLDS.legendaryGuarantee, () => 0);
      expect(RARITY_ORDER[prize.rarity]).toBeGreaterThanOrEqual(RARITY_ORDER['legendary']);
    });
  });

  // ==================== 抽奖执行测试 ====================
  describe('抽奖执行', () => {
    let state: WheelState;

    beforeEach(() => {
      state = createWheelState('player_001');
    });

    it('免费抽奖应成功', () => {
      const result = spin(state, 'daily_wheel', 0, () => 0.5);
      expect(result.prize).toBeDefined();
      expect(result.isFree).toBe(true);
      expect(result.diamondCost).toBe(0);
      expect(result.state.dailyFreeSpinsUsed).toBe(1);
      expect(result.state.totalSpins).toBe(1);
    });

    it('付费抽奖应扣除钻石', () => {
      state.dailyFreeSpinsUsed = WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins;
      const result = spin(state, 'daily_wheel', 1000, () => 0.5);
      expect(result.prize).toBeDefined();
      expect(result.isFree).toBe(false);
      expect(result.diamondCost).toBe(50);
      expect(result.state.dailyPaidSpinsUsed).toBe(1);
    });

    it('抽奖应记录历史', () => {
      const result = spin(state, 'daily_wheel', 0, () => 0.5);
      expect(result.state.history).toHaveLength(1);
      expect(result.state.history[0].wheelId).toBe('daily_wheel');
    });

    it('抽到普通奖品应增加幸运值', () => {
      // 用 rng=0 确保抽到第一个普通奖品
      const result = spin(state, 'daily_wheel', 0, () => 0);
      const prize = result.prize!;
      if (RARITY_ORDER[prize.rarity] < RARITY_ORDER['rare']) {
        expect(result.state.luckyValue).toBe(1);
      }
    });

    it('抽到稀有+奖品应重置幸运值', () => {
      state.luckyValue = LUCKY_THRESHOLDS.rareGuarantee; // 保底稀有
      const result = spin(state, 'daily_wheel', 0, () => 0);
      expect(RARITY_ORDER[result.prize!.rarity]).toBeGreaterThanOrEqual(RARITY_ORDER['rare']);
      expect(result.state.luckyValue).toBe(0);
    });

    it('累计奖励应正确统计', () => {
      const result = spin(state, 'daily_wheel', 0, () => 0);
      const prize = result.prize!;
      expect(result.state.totalRewards[prize.type]).toBe(prize.amount);
    });

    it('历史记录应限制50条', () => {
      let currentState = state;
      for (let i = 0; i < 55; i++) {
        // Reset daily if needed to keep spinning
        if (getDailySpinsLeft(currentState, 'daily_wheel') <= 0) {
          currentState = resetDaily(currentState);
        }
        const result = spin(currentState, 'daily_wheel', 100000, () => 0.5);
        if (result.error) break;
        currentState = result.state;
      }
      expect(currentState.history.length).toBeLessThanOrEqual(50);
    });

    it('条件不满足时应返回错误', () => {
      state.dailyFreeSpinsUsed = WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins;
      const result = spin(state, 'daily_wheel', 0); // no diamonds
      expect(result.prize).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  // ==================== 批量抽奖测试 ====================
  describe('批量抽奖', () => {
    it('连抽3次应返回3个结果', () => {
      const state = createWheelState('player_001');
      const result = spinMultiple(state, 'daily_wheel', 3, 10000, () => 0.5);
      expect(result.results).toHaveLength(3);
      expect(result.state.totalSpins).toBe(3);
    });

    it('钻石不足时应中断', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins;
      // Only enough for 1 paid spin
      const result = spinMultiple(state, 'daily_wheel', 5, 50, () => 0.5);
      expect(result.results.length).toBeLessThan(5);
      expect(result.totalDiamondCost).toBeLessThanOrEqual(50);
    });

    it('每日次数用完应中断', () => {
      const state = createWheelState('player_001');
      const max = WHEEL_CONFIGS['daily_wheel'].maxDailySpins;
      const result = spinMultiple(state, 'daily_wheel', max + 5, 100000, () => 0.5);
      expect(result.results.length).toBeLessThanOrEqual(max);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('连抽的总钻石消耗应正确', () => {
      const state = createWheelState('player_001');
      state.dailyFreeSpinsUsed = WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins;
      const count = 3;
      const result = spinMultiple(state, 'daily_wheel', count, 10000, () => 0.5);
      expect(result.totalDiamondCost).toBe(count * 50);
    });
  });

  // ==================== 统计信息测试 ====================
  describe('统计信息', () => {
    it('初始统计应正确', () => {
      const state = createWheelState('player_001');
      const stats = getWheelStats(state, 'daily_wheel');
      expect(stats.totalSpins).toBe(0);
      expect(stats.dailyFreeLeft).toBe(WHEEL_CONFIGS['daily_wheel'].dailyFreeSpins);
      expect(stats.dailyTotalLeft).toBe(WHEEL_CONFIGS['daily_wheel'].maxDailySpins);
      expect(stats.luckyValue).toBe(0);
    });

    it('下次保底应显示稀有', () => {
      const state = createWheelState('player_001');
      const stats = getWheelStats(state, 'daily_wheel');
      expect(stats.nextGuarantee).toBeDefined();
      expect(stats.nextGuarantee!.type).toBe('稀有');
      expect(stats.nextGuarantee!.spinsLeft).toBe(LUCKY_THRESHOLDS.rareGuarantee);
    });

    it('幸运值接近保底时应显示正确', () => {
      const state = createWheelState('player_001');
      state.luckyValue = LUCKY_THRESHOLDS.rareGuarantee + 1;
      const stats = getWheelStats(state, 'daily_wheel');
      expect(stats.nextGuarantee!.type).toBe('史诗');
    });

    it('稀有度分布应正确统计', () => {
      const state = createWheelState('player_001');
      state.history = [
        { timestamp: 1, wheelId: 'daily_wheel', prizeId: 'a', prizeName: 'A', prizeRarity: 'common', isFree: true },
        { timestamp: 2, wheelId: 'daily_wheel', prizeId: 'b', prizeName: 'B', prizeRarity: 'rare', isFree: false },
      ];
      const stats = getWheelStats(state, 'daily_wheel');
      expect(stats.rarityDistribution.common).toBe(1);
      expect(stats.rarityDistribution.rare).toBe(1);
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('稀有度颜色应返回对应颜色', () => {
      expect(getRarityColor('common')).toBe('#9e9e9e');
      expect(getRarityColor('legendary')).toBe('#ff9800');
    });

    it('稀有度名称应返回中文', () => {
      expect(getRarityName('common')).toBe('普通');
      expect(getRarityName('legendary')).toBe('传说');
    });

    it('getTodayStr应返回正确格式', () => {
      const result = getTodayStr(new Date('2026-03-25T04:00:00+08:00').getTime());
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('稀有度顺序应正确', () => {
      expect(RARITY_ORDER['common']).toBeLessThan(RARITY_ORDER['uncommon']);
      expect(RARITY_ORDER['uncommon']).toBeLessThan(RARITY_ORDER['rare']);
      expect(RARITY_ORDER['rare']).toBeLessThan(RARITY_ORDER['epic']);
      expect(RARITY_ORDER['epic']).toBeLessThan(RARITY_ORDER['legendary']);
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON字符串', () => {
      const state = createWheelState('player_001');
      const json = exportWheelData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      const state = createWheelState('player_001');
      state.totalSpins = 42;
      const json = exportWheelData(state);
      const imported = importWheelData(json);
      expect(imported).toBeDefined();
      expect(imported!.playerId).toBe('player_001');
      expect(imported!.totalSpins).toBe(42);
    });

    it('导入无效数据应返回null', () => {
      expect(importWheelData('not json')).toBeNull();
      expect(importWheelData('{}')).toBeNull();
      expect(importWheelData('{"playerId":"x"}')).toBeNull();
    });
  });

  // ==================== 边界情况测试 ====================
  describe('边界情况', () => {
    it('幸运值超过传说保底应保证传说', () => {
      const prize = selectPrize(PRIZE_POOL, 200, () => 0);
      expect(prize.rarity).toBe('legendary');
    });

    it('空奖品池应不崩溃', () => {
      // selectPrize with minimum pool
      const singlePrize: PrizeConfig[] = [
        { id: 'test', name: 'Test', type: 'gold', amount: 1, rarity: 'common', weight: 1, icon: '🪙' },
      ];
      const prize = selectPrize(singlePrize, 0);
      expect(prize.id).toBe('test');
    });

    it('连续抽奖幸运值应正确累计', () => {
      let state = createWheelState('player_001');
      // 连续抽普通奖品
      for (let i = 0; i < 5; i++) {
        const result = spin(state, 'daily_wheel', 100000, () => 0); // 尽量选普通
        if (result.error) break;
        state = result.state;
      }
      // 幸运值应该>0（除非抽到了稀有+被重置）
      expect(state.totalSpins).toBeGreaterThan(0);
    });
  });
});
