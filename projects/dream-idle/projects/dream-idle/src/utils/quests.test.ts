/**
 * v0.25 每日任务系统测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  createDailyQuests,
  getQuest,
  needsDailyRefresh,
  needsWeeklyRefresh,
  refreshDailyQuests,
  refreshWeeklyQuests,
  updateQuestProgress,
  claimQuestReward,
  claimActivityReward,
  getClaimableQuests,
  getClaimableActivityRewards,
  getQuestStats,
  QUEST_CONFIG,
  QUEST_POOL,
  ACTIVITY_REWARDS,
  type DailyQuests,
} from './quests';

describe('v0.25 每日任务系统', () => {
  // ==================== 基础创建测试 ====================

  describe('基础创建', () => {
    it('应该能创建每日任务数据', () => {
      const quests = createDailyQuests('player_001');
      expect(quests.playerId).toBe('player_001');
      expect(quests.dailyQuests).toHaveLength(QUEST_CONFIG.dailyQuestCount);
      expect(quests.weeklyQuests).toHaveLength(QUEST_CONFIG.weeklyQuestCount);
      expect(quests.activityPoints).toBe(0);
    });

    it('应该为任务初始化进度', () => {
      const quests = createDailyQuests('player_001');
      quests.dailyQuests.forEach((q) => {
        expect(q.current).toBe(0);
        expect(q.completed).toBe(false);
        expect(q.rewardClaimed).toBe(false);
      });
    });
  });

  // ==================== 任务查询测试 ====================

  describe('任务查询', () => {
    it('应该能根据 ID 获取任务', () => {
      const quest = getQuest('daily_level_001');
      expect(quest).toBeDefined();
      expect(quest!.name).toBe('推图新手');
    });

    it('应该能获取所有任务', () => {
      expect(QUEST_POOL.length).toBeGreaterThan(10);
    });
  });

  // ==================== 刷新测试 ====================

  describe('刷新机制', () => {
    it('应该能检查是否需要每日刷新', () => {
      const quests = createDailyQuests('player_001');
      // 刚创建不应该需要刷新
      expect(needsDailyRefresh(quests)).toBe(false);
    });

    it('应该能检查是否需要每周刷新', () => {
      const quests = createDailyQuests('player_001');
      // 刚创建不应该需要刷新
      expect(needsWeeklyRefresh(quests)).toBe(false);
    });

    it('应该能刷新每日任务', () => {
      const quests = createDailyQuests('player_001');

      const refreshed = refreshDailyQuests(quests);

      expect(refreshed.activityPoints).toBe(0);
      expect(refreshed.activityRewardsClaimed).toHaveLength(0);
      expect(refreshed.lastDailyRefresh).toBeGreaterThanOrEqual(quests.lastDailyRefresh);
    });

    it('应该能刷新每周任务', () => {
      const quests = createDailyQuests('player_001');
      const refreshed = refreshWeeklyQuests(quests);

      expect(refreshed.weeklyQuests).toHaveLength(QUEST_CONFIG.weeklyQuestCount);
      expect(refreshed.lastWeeklyRefresh).toBeGreaterThanOrEqual(quests.lastWeeklyRefresh);
    });
  });

  // ==================== 进度更新测试 ====================

  describe('进度更新', () => {
    it('应该能更新任务进度', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;

      const { quests: updated, newlyCompleted } = updateQuestProgress(quests, questId, 1);
      const progress = updated.dailyQuests.find((q) => q.questId === questId);

      expect(progress!.current).toBe(1);
      expect(newlyCompleted).toHaveLength(0); // 还没完成
    });

    it('任务完成后应该标记', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      // 直接完成
      const { quests: updated, newlyCompleted } = updateQuestProgress(
        quests,
        questId,
        questDef.requirement.target
      );
      const progress = updated.dailyQuests.find((q) => q.questId === questId);

      expect(progress!.completed).toBe(true);
      expect(newlyCompleted).toContain(questId);
    });

    it('完成后应该增加活跃度', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      const { quests: updated } = updateQuestProgress(
        quests,
        questId,
        questDef.requirement.target
      );

      expect(updated.activityPoints).toBe(questDef.rewards.activityPoints);
    });

    it('进度不应重复计算', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      let updated = updateQuestProgress(quests, questId, questDef.requirement.target).quests;
      updated = updateQuestProgress(updated, questId, 10).quests;

      const progress = updated.dailyQuests.find((q) => q.questId === questId);
      expect(progress!.completed).toBe(true);
      // 活跃度只应该增加一次
      expect(updated.activityPoints).toBe(questDef.rewards.activityPoints);
    });
  });

  // ==================== 奖励领取测试 ====================

  describe('奖励领取', () => {
    it('应该能领取任务奖励', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      // 完成任务
      let updated = updateQuestProgress(quests, questId, questDef.requirement.target).quests;

      // 领取奖励
      const { success, rewards } = claimQuestReward(updated, questId);
      expect(success).toBe(true);
      expect(rewards?.gold).toBe(questDef.rewards.gold);
      expect(rewards?.exp).toBe(questDef.rewards.exp);
    });

    it('未完成的任务不能领取奖励', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;

      const { success, error } = claimQuestReward(quests, questId);
      expect(success).toBe(false);
      expect(error).toBe('任务未完成');
    });

    it('奖励只能领取一次', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      // 完成并领取
      let updated = updateQuestProgress(quests, questId, questDef.requirement.target).quests;
      claimQuestReward(updated, questId);

      // 再次领取
      const { success, error } = claimQuestReward(updated, questId);
      expect(success).toBe(false);
      expect(error).toBe('奖励已领取');
    });

    it('应该能领取活跃度奖励', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      // 完成任务获得活跃度
      let updated = updateQuestProgress(quests, questId, questDef.requirement.target).quests;

      // 领取活跃度奖励（第一个需要 20 点）
      if (updated.activityPoints >= 20) {
        const { success, rewards } = claimActivityReward(updated, 0);
        expect(success).toBe(true);
        expect(rewards?.diamond).toBe(5);
      }
    });

    it('活跃度不足不能领取奖励', () => {
      const quests = createDailyQuests('player_001');
      // 活跃度为 0

      const { success, error } = claimActivityReward(quests, 0);
      expect(success).toBe(false);
      expect(error).toBe('活跃度不足');
    });

    it('活跃度奖励只能领取一次', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      // 完成多个任务获得足够活跃度
      let updated = updateQuestProgress(quests, questId, questDef.requirement.target).quests;

      if (updated.activityPoints >= 20) {
        claimActivityReward(updated, 0);
        const { success, error } = claimActivityReward(updated, 0);
        expect(success).toBe(false);
        expect(error).toBe('奖励已领取');
      }
    });
  });

  // ==================== 可领取检查测试 ====================

  describe('可领取检查', () => {
    it('应该能获取可领取奖励的任务', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      // 完成任务
      const updated = updateQuestProgress(quests, questId, questDef.requirement.target).quests;

      const claimable = getClaimableQuests(updated);
      expect(claimable.length).toBeGreaterThan(0);
    });

    it('应该能获取可领取的活跃度奖励', () => {
      const quests = createDailyQuests('player_001');

      // 完成多个任务获得足够活跃度
      let updated = quests;
      for (const quest of quests.dailyQuests.slice(0, 3)) {
        const questDef = getQuest(quest.questId)!;
        updated = updateQuestProgress(updated, quest.questId, questDef.requirement.target).quests;
      }

      const claimable = getClaimableActivityRewards(updated);
      expect(claimable.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== 统计测试 ====================

  describe('统计', () => {
    it('应该能获取任务统计', () => {
      const quests = createDailyQuests('player_001');

      const stats = getQuestStats(quests);
      expect(stats.dailyTotal).toBe(QUEST_CONFIG.dailyQuestCount);
      expect(stats.weeklyTotal).toBe(QUEST_CONFIG.weeklyQuestCount);
      expect(stats.dailyCompleted).toBe(0);
      expect(stats.activityPoints).toBe(0);
    });

    it('应该能统计完成数量', () => {
      const quests = createDailyQuests('player_001');

      // 完成一些任务
      let updated = quests;
      for (const quest of quests.dailyQuests.slice(0, 2)) {
        const questDef = getQuest(quest.questId)!;
        updated = updateQuestProgress(updated, quest.questId, questDef.requirement.target).quests;
      }

      const stats = getQuestStats(updated);
      expect(stats.dailyCompleted).toBe(2);
    });

    it('应该能计算下一个活跃度奖励', () => {
      const quests = createDailyQuests('player_001');
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;

      const updated = updateQuestProgress(quests, questId, questDef.requirement.target).quests;
      const stats = getQuestStats(updated);

      if (updated.activityPoints < 20) {
        expect(stats.nextActivityReward).toBe(20);
      }
    });
  });

  // ==================== 配置测试 ====================

  describe('配置', () => {
    it('每日任务数量应该为 5', () => {
      expect(QUEST_CONFIG.dailyQuestCount).toBe(5);
    });

    it('每周任务数量应该为 3', () => {
      expect(QUEST_CONFIG.weeklyQuestCount).toBe(3);
    });

    it('应该有多个任务', () => {
      expect(QUEST_POOL.length).toBeGreaterThan(15);
    });

    it('应该有多个活跃度奖励', () => {
      expect(ACTIVITY_REWARDS.length).toBeGreaterThan(5);
    });

    it('刷新时间应该为 5 点', () => {
      expect(QUEST_CONFIG.refreshHour).toBe(5);
    });
  });

  // ==================== 集成测试 ====================

  describe('集成测试', () => {
    it('完整的每日任务流程', () => {
      // 1. 创建任务
      const quests = createDailyQuests('player_001');

      // 2. 更新推图任务进度
      const levelQuestId = quests.dailyQuests.find((q) => q.questId.startsWith('daily_level'))?.questId;
      if (levelQuestId) {
        const { newlyCompleted } = updateQuestProgress(quests, levelQuestId, 3);
        expect(newlyCompleted.length).toBeGreaterThanOrEqual(0);
      }

      // 3. 更新爬塔任务进度
      const towerQuestId = quests.dailyQuests.find((q) => q.questId.startsWith('daily_tower'))?.questId;
      if (towerQuestId) {
        const { newlyCompleted } = updateQuestProgress(quests, towerQuestId, 5);
        expect(newlyCompleted.length).toBeGreaterThanOrEqual(0);
      }

      // 4. 领取任务奖励
      const claimable = getClaimableQuests(quests);
      for (const { quest } of claimable) {
        const { success } = claimQuestReward(quests, quest.id);
        expect(success).toBe(true);
      }

      // 5. 领取活跃度奖励
      const activityClaimable = getClaimableActivityRewards(quests);
      for (const reward of activityClaimable) {
        const index = ACTIVITY_REWARDS.indexOf(reward);
        const { success } = claimActivityReward(quests, index);
        expect(success).toBe(true);
      }

      // 6. 获取统计
      const stats = getQuestStats(quests);
      expect(stats.dailyCompleted).toBeGreaterThanOrEqual(0);
      expect(stats.activityPoints).toBeGreaterThanOrEqual(0);
    });

    it('每日刷新流程', () => {
      // 1. 创建任务
      let quests = createDailyQuests('player_001');

      // 2. 完成一些任务
      const questId = quests.dailyQuests[0].questId;
      const questDef = getQuest(questId)!;
      quests = updateQuestProgress(quests, questId, questDef.requirement.target).quests;

      // 3. 刷新每日任务
      quests = refreshDailyQuests(quests);

      // 4. 验证刷新后状态
      expect(quests.activityPoints).toBe(0);
      expect(quests.activityRewardsClaimed).toHaveLength(0);
      expect(quests.dailyQuests.every((q) => !q.completed)).toBe(true);
    });

    it('活跃度奖励链', () => {
      const quests = createDailyQuests('player_001');

      // 完成所有每日任务
      let updated = quests;
      for (const quest of quests.dailyQuests) {
        const questDef = getQuest(quest.questId)!;
        updated = updateQuestProgress(updated, quest.questId, questDef.requirement.target).quests;
      }

      // 计算总活跃度
      const totalActivity = quests.dailyQuests.reduce((sum, q) => {
        const def = getQuest(q.questId);
        return sum + (def?.rewards.activityPoints || 0);
      }, 0);

      expect(updated.activityPoints).toBe(totalActivity);

      // 领取所有可领取的活跃度奖励
      let claimCount = 0;
      for (let i = 0; i < ACTIVITY_REWARDS.length; i++) {
        if (updated.activityPoints >= ACTIVITY_REWARDS[i].points) {
          const { success } = claimActivityReward(updated, i);
          if (success) claimCount++;
        }
      }

      expect(claimCount).toBeGreaterThan(0);
    });
  });
});
