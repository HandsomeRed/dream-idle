/**
 * v0.24 成就系统扩展测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  createPlayerAchievements,
  getAchievement,
  getAchievementsByCategory,
  getAchievementsByType,
  updateAchievementProgress,
  batchUpdateAchievements,
  claimAchievementReward,
  checkAchievementCompletion,
  getClaimableAchievements,
  getCompletedAchievements,
  getIncompleteAchievements,
  getHiddenAchievements,
  calculateAchievementScore,
  getAchievementStats,
  ACHIEVEMENT_CONFIG,
  ACHIEVEMENTS,
  type AchievementCategory,
  type AchievementType,
} from './achievementsExtended';

describe('v0.24 成就系统扩展', () => {
  // ==================== 基础创建测试 ====================

  describe('基础创建', () => {
    it('应该能创建玩家成就数据', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      expect(playerAchievements.playerId).toBe('player_001');
      expect(playerAchievements.totalCompleted).toBe(0);
      expect(playerAchievements.completionRate).toBe(0);
      expect(playerAchievements.titles).toHaveLength(0);
    });

    it('应该为所有成就初始化进度', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      expect(Object.keys(playerAchievements.progress)).toHaveLength(ACHIEVEMENTS.length);
    });
  });

  // ==================== 成就查询测试 ====================

  describe('成就查询', () => {
    it('应该能根据 ID 获取成就', () => {
      const achievement = getAchievement('beginner_001');
      expect(achievement).toBeDefined();
      expect(achievement!.name).toBe('初入江湖');
    });

    it('应该能按分类获取成就', () => {
      const beginner = getAchievementsByCategory('beginner');
      const legend = getAchievementsByCategory('legend');

      expect(beginner.length).toBeGreaterThan(0);
      expect(legend.length).toBeGreaterThan(0);
      expect(beginner.every((a) => a.category === 'beginner')).toBe(true);
      expect(legend.every((a) => a.category === 'legend')).toBe(true);
    });

    it('应该能按类型获取成就', () => {
      const tower = getAchievementsByType('tower');
      const pet = getAchievementsByType('pet');

      expect(tower.length).toBeGreaterThan(0);
      expect(pet.length).toBeGreaterThan(0);
      expect(tower.every((a) => a.type === 'tower')).toBe(true);
      expect(pet.every((a) => a.type === 'pet')).toBe(true);
    });
  });

  // ==================== 进度更新测试 ====================

  describe('进度更新', () => {
    it('应该能更新成就进度', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      const { playerAchievements: updated, newlyCompleted } = updateAchievementProgress(
        playerAchievements,
        'beginner_001',
        1
      );

      expect(updated.progress['beginner_001'].current).toBe(1);
      expect(updated.progress['beginner_001'].completed).toBe(true);
      expect(newlyCompleted).toContain('beginner_001');
    });

    it('进度不应减少', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      let updated = updateAchievementProgress(playerAchievements, 'beginner_001', 1).playerAchievements;
      updated = updateAchievementProgress(updated, 'beginner_001', 0).playerAchievements;

      expect(updated.progress['beginner_001'].current).toBe(1);
    });

    it('已完成的成就不应重复完成', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      let result = updateAchievementProgress(playerAchievements, 'beginner_001', 1);
      result = updateAchievementProgress(result.playerAchievements, 'beginner_001', 2);

      expect(result.newlyCompleted).toHaveLength(0);
      expect(result.playerAchievements.totalCompleted).toBe(1);
    });

    it('应该能批量更新成就', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      const { newlyCompleted } = batchUpdateAchievements(playerAchievements, [
        { achievementId: 'beginner_001', value: 1 },
        { achievementId: 'beginner_002', value: 1 },
        { achievementId: 'beginner_003', value: 1 },
      ]);

      expect(newlyCompleted).toHaveLength(3);
      expect(playerAchievements.totalCompleted).toBe(3);
    });
  });

  // ==================== 奖励领取测试 ====================

  describe('奖励领取', () => {
    it('应该能领取成就奖励', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);

      const { success, rewards, error } = claimAchievementReward(
        playerAchievements,
        'beginner_001'
      );

      expect(success).toBe(true);
      expect(rewards?.gold).toBe(100);
      expect(playerAchievements.totalRewards.gold).toBe(100);
    });

    it('未完成的成就不能领取奖励', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      const { success, error } = claimAchievementReward(playerAchievements, 'beginner_001');

      expect(success).toBe(false);
      expect(error).toBe('成就未完成');
    });

    it('奖励只能领取一次', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);

      claimAchievementReward(playerAchievements, 'beginner_001');
      const { success, error } = claimAchievementReward(playerAchievements, 'beginner_001');

      expect(success).toBe(false);
      expect(error).toBe('奖励已领取');
    });

    it('领取奖励应该获得称号', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'master_001', 20);

      const { success, rewards } = claimAchievementReward(playerAchievements, 'master_001');

      expect(success).toBe(true);
      expect(rewards?.title).toBe('宠物大师');
      expect(playerAchievements.titles).toContain('宠物大师');
    });
  });

  // ==================== 完成状态检查测试 ====================

  describe('完成状态检查', () => {
    it('应该能检查成就完成状态', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);

      const status = checkAchievementCompletion(playerAchievements, 'beginner_001');
      expect(status.completed).toBe(true);
      expect(status.current).toBe(1);
      expect(status.target).toBe(1);
      expect(status.percent).toBe(100);
    });

    it('应该能计算完成百分比', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'advanced_001', 5);

      const status = checkAchievementCompletion(playerAchievements, 'advanced_001');
      expect(status.current).toBe(5);
      expect(status.target).toBe(10);
      expect(status.percent).toBe(50);
    });
  });

  // ==================== 成就筛选测试 ====================

  describe('成就筛选', () => {
    it('应该能获取可领取奖励的成就', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);
      updateAchievementProgress(playerAchievements, 'beginner_002', 1);

      const claimable = getClaimableAchievements(playerAchievements);
      expect(claimable).toHaveLength(2);
    });

    it('应该能获取已完成的成就', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);
      updateAchievementProgress(playerAchievements, 'advanced_001', 10);

      const completed = getCompletedAchievements(playerAchievements);
      expect(completed).toHaveLength(2);
    });

    it('应该能获取未完成的成就', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);

      const incomplete = getIncompleteAchievements(playerAchievements);
      expect(incomplete.length).toBe(ACHIEVEMENTS.length - 1);
    });

    it('隐藏成就只应在完成时显示', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      
      // 未完成时不显示
      const hidden1 = getHiddenAchievements(playerAchievements, false);
      expect(hidden1).toHaveLength(0);

      // 完成后显示
      updateAchievementProgress(playerAchievements, 'legend_001', 12);
      const hidden2 = getHiddenAchievements(playerAchievements, true);
      expect(hidden2.length).toBeGreaterThan(0);
    });
  });

  // ==================== 分数计算测试 ====================

  describe('分数计算', () => {
    it('应该能计算成就总分', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1); // 1 分
      updateAchievementProgress(playerAchievements, 'advanced_001', 10); // 3 分
      updateAchievementProgress(playerAchievements, 'master_001', 20); // 5 分

      const score = calculateAchievementScore(playerAchievements);
      expect(score).toBe(9); // 1 + 3 + 5
    });

    it('传奇成就应该有最高分', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'legend_001', 12);

      const score = calculateAchievementScore(playerAchievements);
      expect(score).toBe(10);
    });
  });

  // ==================== 统计测试 ====================

  describe('统计', () => {
    it('应该能获取成就统计', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);
      updateAchievementProgress(playerAchievements, 'beginner_002', 1);
      updateAchievementProgress(playerAchievements, 'advanced_001', 5); // 进行中

      const stats = getAchievementStats(playerAchievements);

      expect(stats.total).toBe(ACHIEVEMENTS.length);
      expect(stats.completed).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.completionRate).toBeGreaterThan(0);
    });

    it('应该能按分类统计', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);
      updateAchievementProgress(playerAchievements, 'beginner_002', 1);

      const stats = getAchievementStats(playerAchievements);
      expect(stats.byCategory.beginner.completed).toBeGreaterThanOrEqual(2);
    });

    it('应该能按类型统计', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_003', 1); // pet

      const stats = getAchievementStats(playerAchievements);
      expect(stats.byType.pet.completed).toBeGreaterThanOrEqual(1);
    });

    it('应该能统计总奖励', () => {
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'beginner_001', 1);
      claimAchievementReward(playerAchievements, 'beginner_001');

      const stats = getAchievementStats(playerAchievements);
      expect(stats.totalGoldEarned).toBe(100);
      expect(stats.totalDiamondEarned).toBe(0);
    });
  });

  // ==================== 配置测试 ====================

  describe('配置', () => {
    it('应该有所有成就', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThan(15);
    });

    it('应该有 4 个分类', () => {
      const categories = new Set(ACHIEVEMENTS.map((a) => a.category));
      expect(categories.size).toBe(4);
    });

    it('应该有 6 种类型', () => {
      const types = new Set(ACHIEVEMENTS.map((a) => a.type));
      expect(types.size).toBe(6);
    });

    it('隐藏成就应该是传奇成就', () => {
      const hidden = ACHIEVEMENTS.filter((a) => a.hidden);
      expect(hidden.every((a) => a.category === 'legend')).toBe(true);
    });
  });

  // ==================== 集成测试 ====================

  describe('集成测试', () => {
    it('完整的成就系统流程', () => {
      // 1. 创建玩家成就
      const playerAchievements = createPlayerAchievements('player_001');

      // 2. 更新爬塔进度
      const { newlyCompleted: towerCompleted } = updateAchievementProgress(
        playerAchievements,
        'beginner_004',
        10
      );
      expect(towerCompleted).toContain('beginner_004');

      // 3. 更新宠物收集进度
      const { newlyCompleted: petCompleted } = updateAchievementProgress(
        playerAchievements,
        'beginner_003',
        1
      );
      expect(petCompleted).toContain('beginner_003');

      // 4. 领取奖励
      const { success, rewards } = claimAchievementReward(
        playerAchievements,
        'beginner_004'
      );
      expect(success).toBe(true);
      expect(rewards?.gold).toBe(500);
      expect(rewards?.diamond).toBe(20);

      // 5. 获取统计
      const stats = getAchievementStats(playerAchievements);
      expect(stats.completed).toBeGreaterThanOrEqual(2);
      expect(stats.totalGoldEarned).toBe(500);
      expect(stats.totalDiamondEarned).toBe(20);
    });

    it('多类型成就追踪', () => {
      const playerAchievements = createPlayerAchievements('player_001');

      // 同时更新多种类型的成就
      batchUpdateAchievements(playerAchievements, [
        { achievementId: 'beginner_001', value: 1 }, // general
        { achievementId: 'beginner_002', value: 1 }, // level/win
        { achievementId: 'beginner_003', value: 1 }, // pet
        { achievementId: 'beginner_004', value: 10 }, // tower
        { achievementId: 'beginner_005', value: 1200 }, // arena
      ]);

      expect(playerAchievements.totalCompleted).toBe(5);
      expect(playerAchievements.completionRate).toBeGreaterThan(0);

      // 领取所有奖励
      const claimable = getClaimableAchievements(playerAchievements);
      expect(claimable).toHaveLength(5);

      let totalGold = 0;
      for (const achievement of claimable) {
        const result = claimAchievementReward(playerAchievements, achievement.id);
        if (result.success && result.rewards) {
          totalGold += result.rewards.gold;
        }
      }

      expect(totalGold).toBeGreaterThan(0);
    });

    it('成就进度保存和恢复', () => {
      // 创建并更新成就
      const playerAchievements = createPlayerAchievements('player_001');
      updateAchievementProgress(playerAchievements, 'master_002', 100);

      // 模拟保存（实际会存到数据库）
      const saved = JSON.stringify(playerAchievements);

      // 模拟恢复
      const restored: typeof playerAchievements = JSON.parse(saved);

      // 验证恢复后的数据
      const status = checkAchievementCompletion(restored, 'master_002');
      expect(status.current).toBe(100);
      expect(status.target).toBe(100);
      expect(status.completed).toBe(true);
    });
  });
});
