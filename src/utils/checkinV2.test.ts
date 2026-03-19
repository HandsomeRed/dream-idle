/**
 * Check-in System Tests - v0.32
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  CheckInRewardType,
  CheckInState,
  MONTHLY_REWARDS,
  CUMULATIVE_REWARDS,
  CHECKIN_CONFIG,
  initializeCheckInState,
  getTodayCheckInDay,
  canCheckIn,
  checkIn,
  makeUpCheckIn,
  claimCumulativeReward,
  updateMissedDays,
  getClaimableCumulativeRewards,
  getTodayReward,
  getStreakProgress,
  formatReward,
  getCheckInCalendarData,
  getCheckInCompletionRate,
} from './checkinV2';

describe('Check-in System - v0.32', () => {
  
  // ==================== 签到数据测试 ====================
  
  describe('Check-in Data', () => {
    it('should have 30 days of monthly rewards', () => {
      expect(MONTHLY_REWARDS).toHaveLength(30);
    });

    it('should have unique day numbers', () => {
      const days = MONTHLY_REWARDS.map(d => d.day);
      const uniqueDays = new Set(days);
      expect(days.length).toBe(uniqueDays.size);
    });

    it('should have cumulative rewards defined', () => {
      expect(CUMULATIVE_REWARDS.length).toBeGreaterThan(0);
    });

    it('should have valid config', () => {
      expect(CHECKIN_CONFIG.makeUpCost).toBeGreaterThan(0);
      expect(CHECKIN_CONFIG.maxMakeUpDays).toBeGreaterThan(0);
    });
  });

  // ==================== 初始化测试 ====================
  
  describe('Initialization', () => {
    it('should initialize check-in state correctly', () => {
      const state = initializeCheckInState();
      
      expect(state.totalCheckInDays).toBe(0);
      expect(state.currentStreak).toBe(0);
      expect(state.maxStreak).toBe(0);
      expect(state.missedDays).toEqual([]);
      expect(state.claimedCumulativeRewards).toEqual([]);
      expect(state.lastCheckInDate).toBeUndefined();
    });
  });

  // ==================== 签到条件检查测试 ====================
  
  describe('Check-in Condition Check', () => {
    let state: CheckInState;

    beforeEach(() => {
      state = initializeCheckInState();
    });

    it('should allow check-in for new user', () => {
      const result = canCheckIn(state);
      expect(result.can).toBe(true);
    });

    it('should deny check-in if already checked in today', () => {
      // 模拟今天已签到
      const today = new Date();
      state.lastCheckInDate = today.getTime();
      
      const result = canCheckIn(state);
      expect(result.can).toBe(false);
      expect(result.reason).toContain('已签到');
    });

    it('should allow check-in on next day', () => {
      // 模拟昨天签到
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      state.lastCheckInDate = yesterday.getTime();
      
      const result = canCheckIn(state);
      expect(result.can).toBe(true);
    });
  });

  // ==================== 签到流程测试 ====================
  
  describe('Check-in Flow', () => {
    let state: CheckInState;

    beforeEach(() => {
      state = initializeCheckInState();
    });

    it('should check-in successfully', () => {
      const result = checkIn(state, 1000);
      
      expect(result.success).toBe(true);
      expect(state.totalCheckInDays).toBe(1);
      expect(state.currentStreak).toBe(1);
      expect(state.maxStreak).toBe(1);
      expect(result.streak).toBe(1);
    });

    it('should update streak correctly', () => {
      // 第 1 天签到
      checkIn(state, 1000);
      expect(state.currentStreak).toBe(1);
      
      // 模拟第二天签到
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      state.lastCheckInDate = yesterday.getTime();
      
      checkIn(state, 1000);
      expect(state.currentStreak).toBe(2);
      expect(state.maxStreak).toBe(2);
    });

    it('should reset streak on missed day', () => {
      // 第 1 天签到
      checkIn(state, 1000);
      
      // 模拟多天后签到（中断）
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 5);
      state.lastCheckInDate = daysAgo.getTime();
      
      checkIn(state, 1000);
      expect(state.currentStreak).toBe(1);  // 重置为 1
      expect(state.maxStreak).toBe(1);  // 保持最大值
    });

    it('should return correct reward', () => {
      const result = checkIn(state, 1000);
      
      expect(result.reward).toBeDefined();
      expect(result.day).toBe(1);  // 第 1 天
    });

    it('should fail check-in if already checked in', () => {
      checkIn(state, 1000);
      const result = checkIn(state, 1000);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已签到');
    });
  });

  // ==================== 累计奖励测试 ====================
  
  describe('Cumulative Rewards', () => {
    let state: CheckInState;

    beforeEach(() => {
      state = initializeCheckInState();
    });

    it('should have claimable rewards after enough check-ins', () => {
      // 模拟签到 7 次
      for (let i = 0; i < 7; i++) {
        if (i > 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - (7 - i));
          state.lastCheckInDate = yesterday.getTime();
        }
        checkIn(state, 1000);
      }
      
      const claimable = getClaimableCumulativeRewards(state);
      expect(claimable.length).toBeGreaterThan(0);
    });

    it('should claim cumulative reward successfully', () => {
      // 模拟签到 7 次
      for (let i = 0; i < 7; i++) {
        if (i > 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - (7 - i));
          state.lastCheckInDate = yesterday.getTime();
        }
        checkIn(state, 1000);
      }
      
      const results = claimCumulativeReward(state);
      const reward7Days = results.find(r => r.success);
      
      expect(reward7Days).toBeDefined();
      expect(reward7Days?.success).toBe(true);
      expect(state.claimedCumulativeRewards).toContain(7);
    });

    it('should not claim same reward twice', () => {
      // 签到并领取 7 天奖励
      for (let i = 0; i < 7; i++) {
        if (i > 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - (7 - i));
          state.lastCheckInDate = yesterday.getTime();
        }
        checkIn(state, 1000);
      }
      
      claimCumulativeReward(state);
      
      // 再次领取
      const results = claimCumulativeReward(state);
      const reward7Days = results.find(r => r.reward?.amount === 100);
      
      expect(reward7Days).toBeUndefined();  // 不会再有 7 天奖励
    });
  });

  // ==================== 辅助函数测试 ====================
  
  describe('Helper Functions', () => {
    let state: CheckInState;

    beforeEach(() => {
      state = initializeCheckInState();
    });

    it('should get today check-in day', () => {
      const day = getTodayCheckInDay(state);
      expect(day).toBe(1);
    });

    it('should get today reward', () => {
      const reward = getTodayReward(state);
      expect(reward.day).toBe(1);
      expect(reward.reward).toBeDefined();
    });

    it('should get streak progress', () => {
      const progress = getStreakProgress(state);
      expect(progress.current).toBe(0);
      expect(progress.next).toBeGreaterThan(0);
    });

    it('should format reward correctly', () => {
      const goldReward = formatReward({ type: CheckInRewardType.Gold, amount: 1000 });
      expect(goldReward).toBe('金币 ×1000');
      
      const diamondReward = formatReward({ type: CheckInRewardType.Diamond, amount: 50 });
      expect(diamondReward).toBe('钻石 ×50');
    });

    it('should get check-in calendar data', () => {
      const calendar = getCheckInCalendarData(state);
      expect(calendar).toHaveLength(30);
      
      calendar.forEach(day => {
        expect(day.day).toBeGreaterThan(0);
        expect(day.day).toBeLessThanOrEqual(30);
        expect(day.reward).toBeDefined();
      });
    });

    it('should calculate completion rate', () => {
      const rate = getCheckInCompletionRate(state);
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });

  // ==================== 特殊奖励测试 ====================
  
  describe('Special Rewards', () => {
    it('should have special reward days', () => {
      const specialDays = MONTHLY_REWARDS.filter(d => d.isSpecial);
      expect(specialDays.length).toBeGreaterThan(0);
    });

    it('should mark day 7 as special', () => {
      const day7 = MONTHLY_REWARDS.find(d => d.day === 7);
      expect(day7?.isSpecial).toBe(true);
    });

    it('should mark day 30 as special', () => {
      const day30 = MONTHLY_REWARDS.find(d => d.day === 30);
      expect(day30?.isSpecial).toBe(true);
    });
  });

  // ==================== 集成测试 ====================
  
  describe('Integration Tests', () => {
    it('should complete full monthly cycle', () => {
      const state = initializeCheckInState();
      
      // 第 1 天签到
      checkIn(state, 1000);
      
      // 模拟 30 天连续签到
      for (let i = 1; i < 30; i++) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        state.lastCheckInDate = yesterday.getTime();
        checkIn(state, 1000);
      }
      
      expect(state.totalCheckInDays).toBe(30);
      expect(state.maxStreak).toBe(30);
      
      // 检查累计奖励
      const claimable = getClaimableCumulativeRewards(state);
      expect(claimable.length).toBeGreaterThan(0);
    });

    it('should handle monthly reset', () => {
      const state = initializeCheckInState();
      
      // 签到几次
      checkIn(state, 1000);
      checkIn(state, 1000);
      
      // 模拟下个月
      state.currentMonth = 12;
      state.currentYear = 2025;
      
      // 获取今日签到天数应该重置
      const day = getTodayCheckInDay(state);
      expect(day).toBe(1);  // 新月从第 1 天开始
    });

    it('should track max streak correctly', () => {
      const state = initializeCheckInState();
      
      // 第 1 天签到
      checkIn(state, 1000);
      expect(state.currentStreak).toBe(1);
      expect(state.maxStreak).toBe(1);
      
      // 模拟连续几天签到（每次把最后签到时间设为昨天）
      for (let i = 1; i < 5; i++) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        state.lastCheckInDate = yesterday.getTime();
        checkIn(state, 1000);
      }
      
      expect(state.currentStreak).toBe(5);
      expect(state.maxStreak).toBe(5);
      
      // 中断后重新签到（设为 10 天前）
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 10);
      state.lastCheckInDate = daysAgo.getTime();
      
      checkIn(state, 1000);
      expect(state.currentStreak).toBe(1);  // 重置为 1
      expect(state.maxStreak).toBe(5);  // 保持最大值
    });
  });
});
