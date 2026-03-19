/**
 * v0.26 签到系统测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  createPlayerCheckin,
  canCheckin,
  doCheckin,
  makeUpCheckin,
  claimCumulativeReward,
  getClaimableCumulativeRewards,
  getCheckinStats,
  checkConsecutiveBreak,
  getMonthlyCalendar,
  setVipDouble,
  CHECKIN_CONFIG,
  MONTHLY_REWARDS,
  CUMULATIVE_REWARDS,
  type PlayerCheckin,
} from './checkin';

describe('v0.26 签到系统', () => {
  // ==================== 基础创建测试 ====================

  describe('基础创建', () => {
    it('应该能创建玩家签到数据', () => {
      const checkin = createPlayerCheckin('player_001');
      expect(checkin.playerId).toBe('player_001');
      expect(checkin.currentMonth.checkinDays.length).toBeGreaterThanOrEqual(28);
      expect(checkin.totalCheckins).toBe(0);
      expect(checkin.vipDouble).toBe(false);
    });

    it('应该初始化月度签到', () => {
      const checkin = createPlayerCheckin('player_001');
      expect(checkin.currentMonth.totalCheckins).toBe(0);
      expect(checkin.currentMonth.consecutiveCheckins).toBe(0);
      expect(checkin.currentMonth.missDays).toHaveLength(0);
    });
  });

  // ==================== 签到检查测试 ====================

  describe('签到检查', () => {
    it('应该能检查是否可以签到', () => {
      const checkin = createPlayerCheckin('player_001');
      const result = canCheckin(checkin);
      expect(result.can).toBe(true);
    });

    it('今天已签到后不能再次签到', () => {
      const checkin = createPlayerCheckin('player_001');
      doCheckin(checkin);
      
      const result = canCheckin(checkin);
      expect(result.can).toBe(false);
    });
  });

  // ==================== 签到执行测试 ====================

  describe('签到执行', () => {
    it('应该能执行签到', () => {
      const checkin = createPlayerCheckin('player_001');
      const { checkin: updated, rewards, consecutive } = doCheckin(checkin);

      expect(updated.currentMonth.totalCheckins).toBe(1);
      expect(updated.currentMonth.consecutiveCheckins).toBe(1);
      expect(rewards.gold).toBeGreaterThan(0);
      expect(consecutive).toBe(1);
    });

    it('签到后应该标记为已签到', () => {
      const checkin = createPlayerCheckin('player_001');
      const dateStr = new Date().toISOString().split('T')[0];
      const { checkin: updated, day } = doCheckin(checkin, dateStr);
      
      expect(updated.currentMonth.checkinDays[day - 1].isClaimed).toBe(true);
    });

    it('重复签到应该抛出错误', () => {
      const checkin = createPlayerCheckin('player_001');
      doCheckin(checkin);

      expect(() => doCheckin(checkin)).toThrow('今日已签到');
    });

    it('新月应该重置签到', () => {
      const checkin = createPlayerCheckin('player_001');
      checkin.currentMonth.month = '2026-02'; // 设置为上个月
      
      const { checkin: updated } = doCheckin(checkin);
      expect(updated.currentMonth.month).not.toBe('2026-02');
      expect(updated.currentMonth.totalCheckins).toBe(1);
    });
  });

  // ==================== VIP 双倍测试 ====================

  describe('VIP 双倍', () => {
    it('VIP 应该获得双倍奖励', () => {
      let checkin = createPlayerCheckin('player_001');
      checkin = setVipDouble(checkin, true);

      const { rewards: vipRewards } = doCheckin(checkin);

      let checkin2 = createPlayerCheckin('player_002');
      const { rewards: normalRewards } = doCheckin(checkin2);

      expect(vipRewards.gold).toBeGreaterThan(normalRewards.gold);
      expect(vipRewards.diamond).toBeGreaterThanOrEqual(normalRewards.diamond);
    });

    it('非 VIP 获得普通奖励', () => {
      const checkin = createPlayerCheckin('player_001');
      const { rewards } = doCheckin(checkin);

      expect(rewards.gold).toBeGreaterThan(0);
      expect(rewards.exp).toBeGreaterThan(0);
    });
  });

  // ==================== 补签测试 ====================

  describe('补签', () => {
    it('应该能补签', () => {
      const checkin = createPlayerCheckin('player_001');
      // 补签第 1 天
      const { success, rewards } = makeUpCheckin(checkin, 1, true);
      expect(success).toBe(true);
      expect(rewards?.gold).toBeGreaterThan(0);
      expect(checkin.currentMonth.checkinDays[0].isClaimed).toBe(true);
    });

    it('钻石不足不能补签', () => {
      const checkin = createPlayerCheckin('player_001');
      const { success, error } = makeUpCheckin(checkin, 1, false);

      expect(success).toBe(false);
      expect(error).toBe('钻石不足');
    });

    it('已签到的日期不能补签', () => {
      const checkin = createPlayerCheckin('player_001');
      // 先补签第 1 天
      makeUpCheckin(checkin, 1, true);

      // 尝试再次补签同一天
      const { success } = makeUpCheckin(checkin, 1, true);
      expect(success).toBe(false);
    });

    it('无效日期不能补签', () => {
      const checkin = createPlayerCheckin('player_001');
      const { success, error } = makeUpCheckin(checkin, 50, true);

      expect(success).toBe(false);
      expect(error).toBe('无效的日期');
    });
  });

  // ==================== 累计奖励测试 ====================

  describe('累计奖励', () => {
    it('应该能领取累计奖励', () => {
      const checkin = createPlayerCheckin('player_001');
      // 模拟签到 7 天
      checkin.totalCheckins = 7;

      const { success, rewards } = claimCumulativeReward(checkin, 0);
      expect(success).toBe(true);
      expect(rewards?.gold).toBe(500);
    });

    it('签到天数不足不能领取', () => {
      const checkin = createPlayerCheckin('player_001');
      checkin.totalCheckins = 3;

      const { success, error } = claimCumulativeReward(checkin, 0);
      expect(success).toBe(false);
      expect(error).toBe('签到天数不足');
    });

    it('奖励只能领取一次', () => {
      const checkin = createPlayerCheckin('player_001');
      checkin.totalCheckins = 7;

      claimCumulativeReward(checkin, 0);
      const { success, error } = claimCumulativeReward(checkin, 0);

      expect(success).toBe(false);
      expect(error).toBe('奖励已领取');
    });

    it('应该能获取可领取的累计奖励', () => {
      const checkin = createPlayerCheckin('player_001');
      checkin.totalCheckins = 14;

      const claimable = getClaimableCumulativeRewards(checkin);
      expect(claimable.length).toBe(2); // 7 天和 14 天
    });
  });

  // ==================== 统计测试 ====================

  describe('统计', () => {
    it('应该能获取签到统计', () => {
      const checkin = createPlayerCheckin('player_001');
      const stats = getCheckinStats(checkin);

      expect(stats.todayChecked).toBe(false);
      expect(stats.consecutiveDays).toBe(0);
      expect(stats.totalDays).toBe(0);
      expect(stats.monthlyTotal).toBeGreaterThanOrEqual(28);
    });

    it('签到后应该更新统计', () => {
      const checkin = createPlayerCheckin('player_001');
      doCheckin(checkin);

      const stats = getCheckinStats(checkin);
      expect(stats.todayChecked).toBe(true);
      expect(stats.consecutiveDays).toBe(1);
      expect(stats.totalDays).toBe(1);
    });

    it('应该能计算下一个累计奖励', () => {
      const checkin = createPlayerCheckin('player_001');
      const stats = getCheckinStats(checkin);

      expect(stats.nextCumulativeDays).toBe(7);
    });
  });

  // ==================== 连续签到测试 ====================

  describe('连续签到', () => {
    it('应该能检查连续签到中断', () => {
      const checkin = createPlayerCheckin('player_001');
      doCheckin(checkin);

      // 模拟 2 天后
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      checkin.currentMonth.lastCheckinDate = twoDaysAgo.toISOString().split('T')[0];
      checkin.currentMonth.consecutiveCheckins = 5;

      const updated = checkConsecutiveBreak(checkin);
      expect(updated.currentMonth.consecutiveCheckins).toBe(0);
    });

    it('连续签到不应中断', () => {
      const checkin = createPlayerCheckin('player_001');
      doCheckin(checkin);

      const updated = checkConsecutiveBreak(checkin);
      expect(updated.currentMonth.consecutiveCheckins).toBe(1);
    });
  });

  // ==================== 日历测试 ====================

  describe('日历', () => {
    it('应该能获取月度日历', () => {
      const checkin = createPlayerCheckin('player_001');
      const calendar = getMonthlyCalendar(checkin);

      expect(calendar.month).toBe(checkin.currentMonth.month);
      expect(calendar.days.length).toBe(checkin.currentMonth.checkinDays.length);
    });

    it('日历应该显示签到状态', () => {
      const checkin = createPlayerCheckin('player_001');
      const dateStr = new Date().toISOString().split('T')[0];
      const { day } = doCheckin(checkin, dateStr);

      const calendar = getMonthlyCalendar(checkin);
      
      expect(calendar.days[day - 1].checked).toBe(true);
    });
  });

  // ==================== 配置测试 ====================

  describe('配置', () => {
    it('月度签到应该有 30 天配置', () => {
      expect(MONTHLY_REWARDS.length).toBe(30);
    });

    it('累计奖励应该有 8 档', () => {
      expect(CUMULATIVE_REWARDS.length).toBe(8);
    });

    it('补签消耗应该为 10 钻石', () => {
      expect(CHECKIN_CONFIG.makeUpCost).toBe(10);
    });

    it('应该支持 VIP 双倍', () => {
      expect(CHECKIN_CONFIG.vipDoubleEnabled).toBe(true);
    });

    it('特殊日期应该有额外奖励', () => {
      // 第 7 天（周奖励）
      expect(MONTHLY_REWARDS[6].rewards.item).toBeDefined();
      // 第 30 天（满月奖励）
      expect(MONTHLY_REWARDS[29].rewards.item).toBeDefined();
    });
  });

  // ==================== 集成测试 ====================

  describe('集成测试', () => {
    it('完整的签到流程', () => {
      // 1. 创建签到
      const checkin = createPlayerCheckin('player_001');

      // 2. 检查是否可以签到
      expect(canCheckin(checkin).can).toBe(true);

      // 3. 执行签到
      const dateStr = new Date().toISOString().split('T')[0];
      const { rewards } = doCheckin(checkin, dateStr);
      expect(rewards.gold).toBeGreaterThan(0);

      // 4. 获取统计
      const stats = getCheckinStats(checkin);
      expect(stats.todayChecked).toBe(true);
      expect(stats.consecutiveDays).toBe(1);

      // 5. 获取日历
      const calendar = getMonthlyCalendar(checkin);
      expect(calendar.days.some((d) => d.checked)).toBe(true);
    });

    it('连续签到 7 天领取累计奖励', () => {
      const checkin = createPlayerCheckin('player_001');

      // 模拟签到 7 天
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        doCheckin(checkin, date.toISOString().split('T')[0]);
      }

      // 领取累计奖励
      const claimable = getClaimableCumulativeRewards(checkin);
      expect(claimable.length).toBe(1);

      const { success } = claimCumulativeReward(checkin, 0);
      expect(success).toBe(true);
    });

    it('VIP 用户签到收益', () => {
      let checkin = createPlayerCheckin('player_001');
      checkin = setVipDouble(checkin, true);

      const { rewards: vipRewards } = doCheckin(checkin);

      let checkin2 = createPlayerCheckin('player_002');
      const { rewards: normalRewards } = doCheckin(checkin2);

      expect(vipRewards.gold).toBeGreaterThan(normalRewards.gold);
    });

    it('补签恢复连续签到', () => {
      const checkin = createPlayerCheckin('player_001');
      
      // 补签第 1 天
      makeUpCheckin(checkin, 1, true);

      // 补签第 2 天
      makeUpCheckin(checkin, 2, true);

      // 签到第 3 天
      const dateStr = new Date().toISOString().split('T')[0];
      doCheckin(checkin, dateStr);

      expect(checkin.currentMonth.consecutiveCheckins).toBeGreaterThanOrEqual(1);
    });
  });
});
