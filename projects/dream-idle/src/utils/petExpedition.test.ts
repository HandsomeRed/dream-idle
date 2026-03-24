// 宠物探险系统测试 - v0.66

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ZONE_CONFIGS,
  MAX_PETS_PER_SLOT,
  BASE_SLOTS,
  MAX_SLOTS,
  BASE_DAILY_LIMIT,
  createExpeditionState,
  needsDailyReset,
  resetDaily,
  getAvailableSlots,
  getActiveExpeditions,
  getCompletedExpeditions,
  unlockSlot,
  canDispatch,
  dispatch,
  calculateResult,
  collectExpedition,
  rushExpedition,
  getExpeditionStats,
  getZoneInfo,
  getAllZones,
  getAvailableZones,
  getRemainingTime,
  formatDuration,
  exportExpeditionData,
  importExpeditionData,
  type ExpeditionState,
} from './petExpedition';

describe('宠物探险系统 v0.66', () => {
  let state: ExpeditionState;
  const NOW = new Date('2026-03-25T06:00:00+08:00').getTime();

  beforeEach(() => {
    state = createExpeditionState('player_001', NOW);
  });

  // ==================== 区域配置测试 ====================
  describe('区域配置', () => {
    it('应包含5个区域', () => {
      expect(Object.keys(ZONE_CONFIGS)).toHaveLength(5);
    });

    it('每个区域应包含必要字段', () => {
      Object.values(ZONE_CONFIGS).forEach(zone => {
        expect(zone).toHaveProperty('id');
        expect(zone).toHaveProperty('name');
        expect(zone).toHaveProperty('minLevel');
        expect(zone).toHaveProperty('recommendedPower');
        expect(zone).toHaveProperty('durationMs');
        expect(zone).toHaveProperty('baseRewards');
        expect(zone.durationMs).toBeGreaterThan(0);
      });
    });

    it('区域难度应递增', () => {
      const zones = Object.values(ZONE_CONFIGS);
      for (let i = 1; i < zones.length; i++) {
        expect(zones[i].minLevel).toBeGreaterThanOrEqual(zones[i - 1].minLevel);
        expect(zones[i].recommendedPower).toBeGreaterThanOrEqual(zones[i - 1].recommendedPower);
      }
    });

    it('每个区域应有优势元素', () => {
      Object.values(ZONE_CONFIGS).forEach(zone => {
        expect(zone.bonusElement).toBeTruthy();
      });
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.unlockedSlots).toBe(BASE_SLOTS);
      expect(state.dailyCompleted).toBe(0);
      expect(state.totalCompleted).toBe(0);
      expect(state.slots).toHaveLength(MAX_SLOTS);
    });

    it('所有槽位初始应为空闲', () => {
      state.slots.forEach(slot => {
        expect(slot.status).toBe('idle');
        expect(slot.petIds).toHaveLength(0);
      });
    });

    it('累计奖励初始应为0', () => {
      expect(state.totalRewards.gold).toBe(0);
      expect(state.totalRewards.exp).toBe(0);
    });
  });

  // ==================== 每日重置测试 ====================
  describe('每日重置', () => {
    it('同一天不需要重置', () => {
      expect(needsDailyReset(state, NOW)).toBe(false);
    });

    it('跨天应需要重置', () => {
      state.lastResetDate = '2020-01-01';
      expect(needsDailyReset(state, NOW)).toBe(true);
    });

    it('重置应清零每日次数', () => {
      state.dailyCompleted = 5;
      const reset = resetDaily(state, NOW);
      expect(reset.dailyCompleted).toBe(0);
    });

    it('重置不应影响累计数据', () => {
      state.totalCompleted = 100;
      const reset = resetDaily(state, NOW);
      expect(reset.totalCompleted).toBe(100);
    });
  });

  // ==================== 槽位管理测试 ====================
  describe('槽位管理', () => {
    it('初始应有2个可用槽位', () => {
      expect(getAvailableSlots(state)).toHaveLength(BASE_SLOTS);
    });

    it('解锁槽位应成功', () => {
      const result = unlockSlot(state);
      expect(result.success).toBe(true);
      expect(result.state.unlockedSlots).toBe(BASE_SLOTS + 1);
    });

    it('达到上限应无法解锁', () => {
      let s = state;
      for (let i = 0; i < MAX_SLOTS; i++) {
        const r = unlockSlot(s);
        if (r.success) s = r.state;
      }
      const result = unlockSlot(s);
      expect(result.success).toBe(false);
    });
  });

  // ==================== 派遣检查测试 ====================
  describe('派遣检查', () => {
    it('有效派遣应通过', () => {
      const result = canDispatch(state, 0, 'forest', ['pet_1'], 10);
      expect(result.canDispatch).toBe(true);
    });

    it('未解锁槽位应失败', () => {
      const result = canDispatch(state, 4, 'forest', ['pet_1'], 10);
      expect(result.canDispatch).toBe(false);
      expect(result.reason).toContain('未解锁');
    });

    it('等级不足应失败', () => {
      const result = canDispatch(state, 0, 'abyss', ['pet_1'], 1);
      expect(result.canDispatch).toBe(false);
      expect(result.reason).toContain('50级');
    });

    it('无宠物应失败', () => {
      const result = canDispatch(state, 0, 'forest', [], 10);
      expect(result.canDispatch).toBe(false);
      expect(result.reason).toContain('至少');
    });

    it('超过宠物上限应失败', () => {
      const pets = Array.from({ length: MAX_PETS_PER_SLOT + 1 }, (_, i) => `pet_${i}`);
      const result = canDispatch(state, 0, 'forest', pets, 10);
      expect(result.canDispatch).toBe(false);
    });

    it('宠物已在其他探险中应失败', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const result = canDispatch(s1, 1, 'forest', ['pet_1'], 10);
      expect(result.canDispatch).toBe(false);
      expect(result.reason).toContain('其他探险');
    });

    it('每日次数用完应失败', () => {
      state.dailyCompleted = BASE_DAILY_LIMIT;
      const result = canDispatch(state, 0, 'forest', ['pet_1'], 10);
      expect(result.canDispatch).toBe(false);
      expect(result.reason).toContain('用完');
    });

    it('不存在的区域应失败', () => {
      const result = canDispatch(state, 0, 'nonexistent' as any, ['pet_1'], 10);
      expect(result.canDispatch).toBe(false);
    });
  });

  // ==================== 派遣执行测试 ====================
  describe('派遣执行', () => {
    it('派遣应成功', () => {
      const result = dispatch(state, 0, 'forest', ['pet_1', 'pet_2'], 500, 10, NOW);
      expect(result.success).toBe(true);
      expect(result.state.slots[0].status).toBe('exploring');
      expect(result.state.slots[0].petIds).toEqual(['pet_1', 'pet_2']);
      expect(result.state.slots[0].zoneId).toBe('forest');
    });

    it('派遣应设置正确的结束时间', () => {
      const result = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const slot = result.state.slots[0];
      expect(slot.endTime).toBe(NOW + ZONE_CONFIGS['forest'].durationMs);
    });

    it('同时派遣多个槽位', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const { state: s2 } = dispatch(s1, 1, 'cave', ['pet_2'], 1000, 20, NOW);
      expect(getActiveExpeditions(s2)).toHaveLength(2);
    });

    it('使用中的槽位不可再派遣', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const result = dispatch(s1, 0, 'cave', ['pet_2'], 500, 20, NOW);
      expect(result.success).toBe(false);
    });
  });

  // ==================== 结果计算测试 ====================
  describe('结果计算', () => {
    it('高战力应有高成功率', () => {
      let successCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = calculateResult(ZONE_CONFIGS['forest'], 10000);
        if (result.success) successCount++;
      }
      expect(successCount).toBeGreaterThan(80);
    });

    it('低战力应有低成功率', () => {
      let successCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = calculateResult(ZONE_CONFIGS['abyss'], 100);
        if (result.success) successCount++;
      }
      expect(successCount).toBeLessThan(30);
    });

    it('成功应给完整奖励', () => {
      const result = calculateResult(ZONE_CONFIGS['forest'], 500, () => 0.1); // 低随机=成功
      expect(result.success).toBe(true);
      expect(result.rewards.gold).toBeGreaterThan(0);
    });

    it('失败应给部分奖励', () => {
      const result = calculateResult(ZONE_CONFIGS['forest'], 500, () => 0.99); // 高随机=失败
      expect(result.success).toBe(false);
      if (result.rewards.gold) {
        expect(result.rewards.gold).toBeLessThan(ZONE_CONFIGS['forest'].baseRewards.gold!);
      }
    });

    it('确定性rng应产生稀有掉落', () => {
      // rng returns 0.1 first (success), then 0.01 (< rareDropRate 0.1 for forest)
      let call = 0;
      const rng = () => {
        call++;
        return call === 1 ? 0.1 : 0.01;
      };
      const result = calculateResult(ZONE_CONFIGS['forest'], 500, rng);
      if (result.success) {
        expect(result.gotRareDrop).toBe(true);
      }
    });
  });

  // ==================== 收取结果测试 ====================
  describe('收取结果', () => {
    it('完成的探险应可收取', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const endTime = NOW + ZONE_CONFIGS['forest'].durationMs + 1000;
      const result = collectExpedition(s1, 0, () => 0.1, endTime);
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
    });

    it('收取后槽位应恢复空闲', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const endTime = NOW + ZONE_CONFIGS['forest'].durationMs + 1000;
      const result = collectExpedition(s1, 0, () => 0.1, endTime);
      expect(result.state.slots[0].status).toBe('idle');
      expect(result.state.slots[0].petIds).toHaveLength(0);
    });

    it('收取应更新统计', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const endTime = NOW + ZONE_CONFIGS['forest'].durationMs + 1000;
      const result = collectExpedition(s1, 0, () => 0.1, endTime);
      expect(result.state.dailyCompleted).toBe(1);
      expect(result.state.totalCompleted).toBe(1);
    });

    it('收取应添加日志', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const endTime = NOW + ZONE_CONFIGS['forest'].durationMs + 1000;
      const result = collectExpedition(s1, 0, () => 0.1, endTime);
      expect(result.state.log).toHaveLength(1);
      expect(result.state.log[0].zoneId).toBe('forest');
    });

    it('未完成的探险不可收取', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const result = collectExpedition(s1, 0, undefined, NOW + 1000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('尚未完成');
    });

    it('空闲槽位不可收取', () => {
      const result = collectExpedition(state, 0);
      expect(result.success).toBe(false);
    });

    it('日志应限制20条', () => {
      let s = state;
      for (let i = 0; i < 25; i++) {
        s = resetDaily(s, NOW);
        const { state: s1 } = dispatch(s, 0, 'forest', [`pet_${i}`], 500, 10, NOW);
        const endTime = NOW + ZONE_CONFIGS['forest'].durationMs + 1000;
        const { state: s2 } = collectExpedition(s1, 0, () => 0.1, endTime);
        s = s2;
      }
      expect(s.log.length).toBeLessThanOrEqual(20);
    });
  });

  // ==================== 加速完成测试 ====================
  describe('加速完成', () => {
    it('应可以加速探险', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const result = rushExpedition(s1, 0, NOW + 1000);
      expect(result.success).toBe(true);
      expect(result.diamondCost).toBeGreaterThan(0);
    });

    it('加速后应可以立即收取', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const rushTime = NOW + 1000;
      const { state: s2 } = rushExpedition(s1, 0, rushTime);
      const result = collectExpedition(s2, 0, () => 0.1, rushTime);
      expect(result.success).toBe(true);
    });

    it('空闲槽位不可加速', () => {
      const result = rushExpedition(state, 0, NOW);
      expect(result.success).toBe(false);
    });
  });

  // ==================== 查询功能测试 ====================
  describe('查询功能', () => {
    it('获取区域信息', () => {
      const zone = getZoneInfo('forest');
      expect(zone).toBeDefined();
      expect(zone!.name).toBe('迷雾森林');
    });

    it('获取所有区域', () => {
      expect(getAllZones()).toHaveLength(5);
    });

    it('按等级获取可用区域', () => {
      expect(getAvailableZones(1).length).toBeGreaterThanOrEqual(1);
      expect(getAvailableZones(100).length).toBe(5);
    });

    it('获取剩余时间', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const remaining = getRemainingTime(s1.slots[0], NOW + 60000);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThan(ZONE_CONFIGS['forest'].durationMs);
    });

    it('空闲槽位剩余时间为0', () => {
      expect(getRemainingTime(state.slots[0])).toBe(0);
    });

    it('获取已完成的探险', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const endTime = NOW + ZONE_CONFIGS['forest'].durationMs + 1000;
      expect(getCompletedExpeditions(s1, endTime)).toHaveLength(1);
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('初始统计应正确', () => {
      const stats = getExpeditionStats(state);
      expect(stats.totalCompleted).toBe(0);
      expect(stats.dailyCompleted).toBe(0);
      expect(stats.dailyRemaining).toBe(BASE_DAILY_LIMIT);
      expect(stats.unlockedSlots).toBe(BASE_SLOTS);
      expect(stats.activeCount).toBe(0);
    });

    it('派遣后统计应更新', () => {
      const { state: s1 } = dispatch(state, 0, 'forest', ['pet_1'], 500, 10, NOW);
      const stats = getExpeditionStats(s1);
      expect(stats.activeCount).toBe(1);
      expect(stats.idleCount).toBe(BASE_SLOTS - 1);
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('格式化时间 - 小时', () => {
      expect(formatDuration(2 * 60 * 60 * 1000)).toBe('2小时0分钟');
    });

    it('格式化时间 - 分钟', () => {
      expect(formatDuration(30 * 60 * 1000)).toBe('30分钟');
    });

    it('格式化时间 - 已完成', () => {
      expect(formatDuration(0)).toBe('已完成');
    });

    it('不存在的区域应返回null', () => {
      expect(getZoneInfo('nonexistent' as any)).toBeNull();
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportExpeditionData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      state.totalCompleted = 42;
      const json = exportExpeditionData(state);
      const imported = importExpeditionData(json);
      expect(imported!.totalCompleted).toBe(42);
    });

    it('无效数据应返回null', () => {
      expect(importExpeditionData('bad')).toBeNull();
      expect(importExpeditionData('{}')).toBeNull();
    });
  });
});
