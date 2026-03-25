// 签到系统 v2 测试 - v0.78

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  MONTHLY_REWARDS,
  MAKEUP_COST,
  MAX_MAKEUP_DAYS,
  createCheckinState,
  canCheckin,
  performCheckin,
  getMakeupAvailableDays,
  performMakeup,
  getCheckinStats,
  monthlyReset,
  getRewardForDay,
  getMakeupCost,
  getTodayStr,
  getCurrentMonth,
  exportCheckinData,
  importCheckinData,
  type CheckinState,
} from './checkinV2';

describe('签到系统 v2 v0.78', () => {
  let state: CheckinState;
  let fixedNow: number;

  beforeEach(() => {
    fixedNow = new Date('2026-03-15T10:00:00+08:00').getTime();
    state = createCheckinState('player_001', fixedNow);
  });

  // ==================== 配置测试 ====================
  describe('配置', () => {
    it('应有 31 天奖励', () => {
      expect(MONTHLY_REWARDS).toHaveLength(31);
    });

    it('每个奖励应有必要字段', () => {
      MONTHLY_REWARDS.forEach(r => {
        expect(r).toHaveProperty('day');
        expect(r).toHaveProperty('rewards');
        expect(r).toHaveProperty('isSpecial');
      });
    });

    it('特殊奖励日应正确', () => {
      const specialDays = MONTHLY_REWARDS.filter(r => r.isSpecial).map(r => r.day);
      expect(specialDays).toContain(1);
      expect(specialDays).toContain(7);
      expect(specialDays).toContain(15);
      expect(specialDays).toContain(28);
    });

    it('补签花费应递增', () => {
      expect(getMakeupCost(1)).toBeLessThan(getMakeupCost(3));
      expect(getMakeupCost(3)).toBeLessThan(getMakeupCost(7));
    });
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.checkedInDays).toBe(0);
      expect(state.streak).toBe(0);
    });

    it('当前月份应正确', () => {
      expect(state.currentMonth).toBe('2026-03');
    });
  });

  // ==================== 签到资格测试 ====================
  describe('签到资格', () => {
    it('可以签到', () => {
      const result = canCheckin(state, fixedNow);
      expect(result.can).toBe(true);
    });

    it('已签到不能重复', () => {
      const { state: s1 } = performCheckin(state, fixedNow);
      const result = canCheckin(s1, fixedNow);
      expect(result.can).toBe(false);
      expect(result.reason).toContain('已签到');
    });
  });

  // ==================== 签到测试 ====================
  describe('签到', () => {
    it('应成功签到', () => {
      const result = performCheckin(state, fixedNow);
      expect(result.success).toBe(true);
      expect(result.day).toBe(15);
      expect(result.rewards.length).toBeGreaterThan(0);
    });

    it('签到应获得正确奖励', () => {
      const result = performCheckin(state, fixedNow);
      const expected = getRewardForDay(15);
      expect(result.rewards).toEqual(expected?.rewards);
    });

    it('特殊日应标记', () => {
      const result = performCheckin(state, fixedNow);
      expect(result.isSpecial).toBe(true);
      expect(result.specialName).toBe('月中大奖');
    });

    it('签到应增加连续', () => {
      const { state: s1 } = performCheckin(state, fixedNow);
      expect(s1.streak).toBe(1);
      expect(s1.maxStreak).toBe(1);
    });

    it('连续签到应累计', () => {
      let s = state;
      for (let i = 0; i < 5; i++) {
        const day = 10 + i;
        const time = new Date(`2026-03-${String(day).padStart(2, '0')}T10:00:00+08:00`).getTime();
        const result = performCheckin(s, time);
        s = result.state;
      }
      expect(s.streak).toBe(5);
      expect(s.maxStreak).toBe(5);
    });

    it('断签应重置连续', () => {
      let s = state;
      // 1 号签到
      s = performCheckin(s, new Date('2026-03-01T10:00:00+08:00').getTime()).state;
      // 3 号签到 (跳过 2 号)
      const result = performCheckin(s, new Date('2026-03-03T10:00:00+08:00').getTime());
      expect(result.streak).toBe(1); // 重置为 1
    });
  });

  // ==================== 补签测试 ====================
  describe('补签', () => {
    it('获取可补签日期', () => {
      // 先签到 1 号
      const s1 = performCheckin(state, new Date('2026-03-01T10:00:00+08:00').getTime()).state;
      // 现在是 15 号，2-14 号可补签
      const available = getMakeupAvailableDays(s1, fixedNow);
      expect(available.length).toBeGreaterThan(0);
      expect(available).toContain(2);
    });

    it('补签应成功', () => {
      let s = state;
      s = performCheckin(s, new Date('2026-03-01T10:00:00+08:00').getTime()).state;
      const result = performMakeup(s, [2, 3], 1000, fixedNow);
      expect(result.success).toBe(true);
      expect(result.totalRewards.length).toBeGreaterThan(0);
    });

    it('补签应花费钻石', () => {
      let s = state;
      s = performCheckin(s, new Date('2026-03-01T10:00:00+08:00').getTime()).state;
      const result = performMakeup(s, [2, 3], 1000, fixedNow);
      expect(result.diamondCost).toBe(100); // 2 天
    });

    it('钻石不足不能补签', () => {
      let s = state;
      s = performCheckin(s, new Date('2026-03-01T10:00:00+08:00').getTime()).state;
      const result = performMakeup(s, [2, 3, 4, 5, 6, 7, 8], 100, fixedNow);
      expect(result.success).toBe(false);
      expect(result.error).toContain('钻石不足');
    });

    it('不能超过最大补签天数', () => {
      let s = state;
      s = performCheckin(s, new Date('2026-03-01T10:00:00+08:00').getTime()).state;
      const days = Array.from({ length: 10 }, (_, i) => i + 2);
      const result = performMakeup(s, days, 10000, fixedNow);
      expect(result.success).toBe(false);
      expect(result.error).toContain('最多补签');
    });
  });

  // ==================== 统计测试 ====================
  describe('统计', () => {
    it('获取签到统计', () => {
      const stats = getCheckinStats(state);
      expect(stats.checkedInDays).toBe(0);
      expect(stats.streak).toBe(0);
    });

    it('签到后统计更新', () => {
      const { state: s1 } = performCheckin(state, fixedNow);
      const stats = getCheckinStats(s1);
      expect(stats.checkedInDays).toBe(1);
      expect(stats.streak).toBe(1);
      expect(stats.specialClaimed).toBe(1);
    });
  });

  // ==================== 月度重置测试 ====================
  describe('月度重置', () => {
    it('重置后月份更新', () => {
      const { state: s1 } = performCheckin(state, fixedNow);
      const nextMonth = new Date('2026-04-01T10:00:00+08:00').getTime();
      const reset = monthlyReset(s1, nextMonth);
      expect(reset.currentMonth).toBe('2026-04');
      expect(reset.checkedInDays).toBe(0);
    });

    it('重置后补签次数清零', () => {
      let s = state;
      s = performCheckin(s, new Date('2026-03-01T10:00:00+08:00').getTime()).state;
      performMakeup(s, [2], 1000, fixedNow);
      const nextMonth = new Date('2026-04-01T10:00:00+08:00').getTime();
      const reset = monthlyReset(s, nextMonth);
      expect(reset.makeupCount).toBe(0);
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数', () => {
    it('获取今日日期', () => {
      const today = getTodayStr(fixedNow);
      expect(today).toBe('2026-03-15');
    });

    it('获取当前月份', () => {
      const month = getCurrentMonth(fixedNow);
      expect(month).toBe('2026-03');
    });

    it('获取日期奖励', () => {
      const reward = getRewardForDay(1);
      expect(reward).toBeDefined();
      expect(reward!.isSpecial).toBe(true);
    });

    it('获取补签花费', () => {
      expect(getMakeupCost(1)).toBe(50);
      expect(getMakeupCost(7)).toBe(500);
    });
  });

  // ==================== 数据导出导入测试 ====================
  describe('数据导出导入', () => {
    it('导出应返回 JSON', () => {
      const json = exportCheckinData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      const { state: s1 } = performCheckin(state, fixedNow);
      const json = exportCheckinData(s1);
      const imported = importCheckinData(json);
      expect(imported).toBeDefined();
      expect(imported!.checkedInDays).toBe(1);
    });

    it('无效数据应返回 null', () => {
      expect(importCheckinData('nope')).toBeNull();
      expect(importCheckinData('{}')).toBeNull();
    });
  });
});
