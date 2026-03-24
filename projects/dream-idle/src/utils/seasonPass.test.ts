// 赛季通行证系统测试 - v0.66

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  CURRENT_SEASON,
  createSeasonPassState,
  purchasePremium,
  addExp,
  updateMissionProgress,
  claimMissionReward,
  claimFreeReward,
  claimPremiumReward,
  checkMissionReset,
  getClaimableFreeRewards,
  getClaimablePremiumRewards,
  getSeasonTimeLeft,
  getSeasonPassStats,
  exportSeasonPassData,
  importSeasonPassData,
  getTodayStr,
  getWeekStr,
  type SeasonPassState,
} from './seasonPass';

describe('赛季通行证系统 v0.66', () => {
  let state: SeasonPassState;
  const now = new Date('2026-03-15T12:00:00+08:00').getTime();

  beforeEach(() => {
    state = createSeasonPassState('player_001', CURRENT_SEASON, now);
  });

  // ==================== 初始化测试 ====================
  describe('初始化', () => {
    it('应创建初始状态', () => {
      expect(state.playerId).toBe('player_001');
      expect(state.seasonId).toBe(CURRENT_SEASON.id);
      expect(state.level).toBe(0);
      expect(state.exp).toBe(0);
      expect(state.isPremium).toBe(false);
    });

    it('初始无已领取奖励', () => {
      expect(state.claimedFree).toHaveLength(0);
      expect(state.claimedPremium).toHaveLength(0);
    });

    it('赛季应有足够的奖励', () => {
      expect(CURRENT_SEASON.rewards.length).toBe(CURRENT_SEASON.maxLevel);
    });

    it('赛季应有任务', () => {
      expect(CURRENT_SEASON.missions.length).toBeGreaterThan(0);
    });
  });

  // ==================== 高级通行证购买 ====================
  describe('高级通行证', () => {
    it('钻石足够应购买成功', () => {
      const result = purchasePremium(state, 1000, CURRENT_SEASON, now);
      expect(result.success).toBe(true);
      expect(result.state.isPremium).toBe(true);
      expect(result.cost).toBe(CURRENT_SEASON.premiumPrice);
    });

    it('钻石不足应购买失败', () => {
      const result = purchasePremium(state, 100, CURRENT_SEASON, now);
      expect(result.success).toBe(false);
      expect(result.error).toContain('钻石不足');
    });

    it('重复购买应失败', () => {
      const { state: s1 } = purchasePremium(state, 1000, CURRENT_SEASON, now);
      const result = purchasePremium(s1, 1000, CURRENT_SEASON, now);
      expect(result.success).toBe(false);
      expect(result.error).toContain('已购买');
    });
  });

  // ==================== 经验与升级 ====================
  describe('经验与升级', () => {
    it('添加经验应正确', () => {
      const { state: s1 } = addExp(state, 500, CURRENT_SEASON);
      expect(s1.exp).toBe(500);
      expect(s1.totalExpEarned).toBe(500);
    });

    it('经验足够应自动升级', () => {
      const { state: s1, levelsGained } = addExp(state, CURRENT_SEASON.expPerLevel, CURRENT_SEASON);
      expect(s1.level).toBe(1);
      expect(levelsGained).toBe(1);
    });

    it('大量经验应连升多级', () => {
      const { state: s1, levelsGained } = addExp(state, CURRENT_SEASON.expPerLevel * 5 + 200, CURRENT_SEASON);
      expect(s1.level).toBe(5);
      expect(levelsGained).toBe(5);
      expect(s1.exp).toBe(200);
    });

    it('不应超过最大等级', () => {
      const hugeExp = CURRENT_SEASON.expPerLevel * (CURRENT_SEASON.maxLevel + 10);
      const { state: s1 } = addExp(state, hugeExp, CURRENT_SEASON);
      expect(s1.level).toBe(CURRENT_SEASON.maxLevel);
    });

    it('满级后经验应归零', () => {
      const hugeExp = CURRENT_SEASON.expPerLevel * (CURRENT_SEASON.maxLevel + 10);
      const { state: s1 } = addExp(state, hugeExp, CURRENT_SEASON);
      expect(s1.exp).toBe(0);
    });
  });

  // ==================== 任务系统 ====================
  describe('任务系统', () => {
    it('更新任务进度', () => {
      const { state: s1, completed } = updateMissionProgress(state, 'daily_login', 1, CURRENT_SEASON);
      expect(s1.missionProgress['daily_login']).toBe(1);
      expect(completed).toBe(true); // requirement=1
    });

    it('任务未完成时completed应为false', () => {
      const { completed } = updateMissionProgress(state, 'daily_battle_5', 1, CURRENT_SEASON);
      expect(completed).toBe(false); // requirement=5
    });

    it('累计进度直到完成', () => {
      let s = state;
      for (let i = 0; i < 5; i++) {
        const result = updateMissionProgress(s, 'daily_battle_5', 1, CURRENT_SEASON);
        s = result.state;
        if (i < 4) expect(result.completed).toBe(false);
        else expect(result.completed).toBe(true);
      }
    });

    it('已完成任务不应重复完成', () => {
      const { state: s1 } = updateMissionProgress(state, 'daily_login', 1, CURRENT_SEASON);
      const { state: s2, completed } = updateMissionProgress(s1, 'daily_login', 1, CURRENT_SEASON);
      expect(completed).toBe(false);
    });

    it('不存在的任务应返回原状态', () => {
      const { state: s1 } = updateMissionProgress(state, 'nonexistent', 1, CURRENT_SEASON);
      expect(s1.missionProgress['nonexistent']).toBeUndefined();
    });
  });

  // ==================== 任务奖励领取 ====================
  describe('任务奖励领取', () => {
    it('完成任务后可以领取经验', () => {
      const { state: s1 } = updateMissionProgress(state, 'daily_login', 1, CURRENT_SEASON);
      const result = claimMissionReward(s1, 'daily_login', CURRENT_SEASON);
      expect(result.success).toBe(true);
      expect(result.expGained).toBe(100);
      expect(result.state.totalExpEarned).toBe(100);
    });

    it('未完成任务不可领取', () => {
      const result = claimMissionReward(state, 'daily_login', CURRENT_SEASON);
      expect(result.success).toBe(false);
      expect(result.error).toContain('未完成');
    });

    it('不可重复领取', () => {
      const { state: s1 } = updateMissionProgress(state, 'daily_login', 1, CURRENT_SEASON);
      const { state: s2 } = claimMissionReward(s1, 'daily_login', CURRENT_SEASON);
      const result = claimMissionReward(s2, 'daily_login', CURRENT_SEASON);
      expect(result.success).toBe(false);
      expect(result.error).toContain('已领取');
    });

    it('领取奖励应增加经验并可能升级', () => {
      // 先升到接近升级
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel - 50, CURRENT_SEASON);
      const { state: s2 } = updateMissionProgress(s1, 'daily_login', 1, CURRENT_SEASON);
      const result = claimMissionReward(s2, 'daily_login', CURRENT_SEASON);
      expect(result.levelsGained).toBe(1); // 100 exp should push over
    });
  });

  // ==================== 等级奖励领取 ====================
  describe('等级奖励', () => {
    it('达到等级后可领取免费奖励', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel, CURRENT_SEASON);
      const result = claimFreeReward(s1, 1, CURRENT_SEASON);
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
    });

    it('等级不足不可领取', () => {
      const result = claimFreeReward(state, 1, CURRENT_SEASON);
      expect(result.success).toBe(false);
      expect(result.error).toContain('等级不足');
    });

    it('不可重复领取免费奖励', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel, CURRENT_SEASON);
      const { state: s2 } = claimFreeReward(s1, 1, CURRENT_SEASON);
      const result = claimFreeReward(s2, 1, CURRENT_SEASON);
      expect(result.success).toBe(false);
    });

    it('非高级用户不可领取高级奖励', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel, CURRENT_SEASON);
      const result = claimPremiumReward(s1, 1, CURRENT_SEASON);
      expect(result.success).toBe(false);
      expect(result.error).toContain('高级通行证');
    });

    it('高级用户可领取高级奖励', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel, CURRENT_SEASON);
      const { state: s2 } = purchasePremium(s1, 1000, CURRENT_SEASON, now);
      const result = claimPremiumReward(s2, 1, CURRENT_SEASON);
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
    });

    it('购买高级后可补领之前的高级奖励', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel * 5, CURRENT_SEASON);
      // 先领免费
      let s = s1;
      for (let i = 1; i <= 5; i++) {
        const { state: ns } = claimFreeReward(s, i, CURRENT_SEASON);
        s = ns;
      }
      // 再买高级
      const { state: s2 } = purchasePremium(s, 1000, CURRENT_SEASON, now);
      // 应该可以领5级的高级奖励
      const claimable = getClaimablePremiumRewards(s2, CURRENT_SEASON);
      expect(claimable.length).toBe(5);
    });
  });

  // ==================== 每日/每周重置 ====================
  describe('任务重置', () => {
    it('跨天应重置每日任务', () => {
      const { state: s1 } = updateMissionProgress(state, 'daily_login', 1, CURRENT_SEASON);
      expect(s1.completedMissions).toContain('daily_login');

      const nextDay = now + 86400000;
      const s2 = checkMissionReset(s1, CURRENT_SEASON, nextDay);
      expect(s2.completedMissions).not.toContain('daily_login');
      expect(s2.missionProgress['daily_login']).toBeUndefined();
    });

    it('同一天不应重置', () => {
      const { state: s1 } = updateMissionProgress(state, 'daily_login', 1, CURRENT_SEASON);
      const s2 = checkMissionReset(s1, CURRENT_SEASON, now);
      expect(s2.completedMissions).toContain('daily_login');
    });

    it('每日重置不应影响赛季任务', () => {
      const { state: s1 } = updateMissionProgress(state, 'season_level_30', 10, CURRENT_SEASON);
      const nextDay = now + 86400000;
      const s2 = checkMissionReset(s1, CURRENT_SEASON, nextDay);
      expect(s2.missionProgress['season_level_30']).toBe(10);
    });

    it('跨周应重置每周任务', () => {
      const { state: s1 } = updateMissionProgress(state, 'weekly_battle_30', 20, CURRENT_SEASON);
      const nextWeek = now + 7 * 86400000;
      const s2 = checkMissionReset(s1, CURRENT_SEASON, nextWeek);
      expect(s2.missionProgress['weekly_battle_30']).toBeUndefined();
    });
  });

  // ==================== 可领取奖励查询 ====================
  describe('可领取奖励查询', () => {
    it('初始无可领取免费奖励', () => {
      expect(getClaimableFreeRewards(state, CURRENT_SEASON)).toHaveLength(0);
    });

    it('升级后应有可领取免费奖励', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel * 3, CURRENT_SEASON);
      const claimable = getClaimableFreeRewards(s1, CURRENT_SEASON);
      expect(claimable.length).toBe(3);
    });

    it('非高级用户无可领取高级奖励', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel * 3, CURRENT_SEASON);
      expect(getClaimablePremiumRewards(s1, CURRENT_SEASON)).toHaveLength(0);
    });
  });

  // ==================== 赛季时间 ====================
  describe('赛季时间', () => {
    it('赛季进行中应返回剩余时间', () => {
      const result = getSeasonTimeLeft(CURRENT_SEASON, now);
      expect(result.expired).toBe(false);
      expect(result.days).toBeGreaterThan(0);
    });

    it('赛季结束后应标记过期', () => {
      const afterEnd = CURRENT_SEASON.endTime + 1000;
      const result = getSeasonTimeLeft(CURRENT_SEASON, afterEnd);
      expect(result.expired).toBe(true);
    });
  });

  // ==================== 统计 ====================
  describe('统计', () => {
    it('初始统计应正确', () => {
      const stats = getSeasonPassStats(state, CURRENT_SEASON);
      expect(stats.level).toBe(0);
      expect(stats.maxLevel).toBe(CURRENT_SEASON.maxLevel);
      expect(stats.isPremium).toBe(false);
      expect(stats.freeRewardsClaimed).toBe(0);
      expect(stats.missionsCompleted).toBe(0);
    });

    it('进度应正确计算', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel / 2, CURRENT_SEASON);
      const stats = getSeasonPassStats(s1, CURRENT_SEASON);
      expect(stats.progress).toBe(50);
    });

    it('满级进度应为100%', () => {
      const { state: s1 } = addExp(state, CURRENT_SEASON.expPerLevel * CURRENT_SEASON.maxLevel, CURRENT_SEASON);
      const stats = getSeasonPassStats(s1, CURRENT_SEASON);
      expect(stats.progress).toBe(100);
    });
  });

  // ==================== 工具函数 ====================
  describe('工具函数', () => {
    it('getTodayStr应返回正确格式', () => {
      const result = getTodayStr(now);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('getWeekStr应返回周一日期', () => {
      const result = getWeekStr(now);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ==================== 数据导出导入 ====================
  describe('数据导出导入', () => {
    it('导出应返回JSON', () => {
      const json = exportSeasonPassData(state);
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).playerId).toBe('player_001');
    });

    it('导入应还原数据', () => {
      state.level = 10;
      const json = exportSeasonPassData(state);
      const imported = importSeasonPassData(json);
      expect(imported).toBeDefined();
      expect(imported!.level).toBe(10);
    });

    it('无效数据应返回null', () => {
      expect(importSeasonPassData('not json')).toBeNull();
      expect(importSeasonPassData('{}')).toBeNull();
    });
  });
});
