/**
 * Achievement System Tests - v0.30
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  AchievementCategory,
  AchievementType,
  RewardType,
  AchievementState,
  ACHIEVEMENTS,
  TITLES,
  initializeAchievementState,
  getAchievementProgress,
  updateAchievementProgress,
  incrementAchievementProgress,
  claimAchievementReward,
  equipTitle,
  unequipTitle,
  countCompletedAchievements,
  countClaimedAchievements,
  getAchievementsByCategory,
  getIncompleteAchievements,
  getClaimableAchievements,
  getAchievementCompletionRate,
  getProgressByType,
  getTitleInfo,
  getEquippedTitleEffect,
} from './achievementsV2';

describe('Achievement System - v0.30', () => {
  
  // ==================== 成就数据测试 ====================
  
  describe('Achievement Data', () => {
    it('should have all achievements defined', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
      
      // 检查所有分类都有成就
      const categories = new Set(ACHIEVEMENTS.map(a => a.category));
      expect(categories.size).toBe(4);  // Beginner, Advanced, Master, Legend
    });

    it('should have unique achievement IDs', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have titles defined', () => {
      expect(TITLES.length).toBeGreaterThan(0);
    });
  });

  // ==================== 初始化测试 ====================
  
  describe('Initialization', () => {
    it('should initialize achievement state correctly', () => {
      const state = initializeAchievementState();
      
      expect(state.progresses).toHaveLength(ACHIEVEMENTS.length);
      expect(state.titles).toEqual([]);
      expect(state.equippedTitle).toBeUndefined();
      
      // 检查所有成就进度初始状态
      state.progresses.forEach(progress => {
        expect(progress.current).toBe(0);
        expect(progress.completed).toBe(false);
        expect(progress.rewardClaimed).toBe(false);
      });
    });
  });

  // ==================== 进度更新测试 ====================
  
  describe('Progress Update', () => {
    let state: AchievementState;

    beforeEach(() => {
      state = initializeAchievementState();
    });

    it('should update progress for matching type', () => {
      const result = updateAchievementProgress(state, 'level', 10);
      
      const level10Achievement = ACHIEVEMENTS.find(a => a.id === 'beginner_level_10');
      expect(level10Achievement).toBeDefined();
      
      const progress = getAchievementProgress(state, 'beginner_level_10');
      expect(progress?.current).toBe(10);
      expect(progress?.completed).toBe(true);
      
      expect(result.completed).toBe(true);
      expect(result.newlyCompleted.length).toBeGreaterThan(0);
    });

    it('should not update progress for non-matching type', () => {
      updateAchievementProgress(state, 'dungeon_clear', 5);
      
      const levelProgress = getAchievementProgress(state, 'beginner_level_10');
      expect(levelProgress?.current).toBe(0);
    });

    it('should handle multiple achievements completion', () => {
      const result = updateAchievementProgress(state, 'level', 100);
      
      // 应该完成所有等级成就（10, 20, 50, 80, 100）
      const completedLevelAchievements = state.progresses.filter(p => {
        const achievement = ACHIEVEMENTS.find(a => a.id === p.achievementId);
        return achievement?.type === AchievementType.Level && p.completed;
      });
      
      expect(completedLevelAchievements.length).toBeGreaterThan(0);
      expect(result.newlyCompleted.length).toBeGreaterThan(0);
    });

    it('should increment progress correctly', () => {
      // 第一次递增
      incrementAchievementProgress(state, 'dungeon_clear', 1);
      let progress = getAchievementProgress(state, 'beginner_dungeon_1');
      expect(progress?.current).toBe(1);
      expect(progress?.completed).toBe(true);  // 目标是 1，所以已完成
      
      // 再次递增（已完成不应该再变化）
      incrementAchievementProgress(state, 'dungeon_clear', 1);
      progress = getAchievementProgress(state, 'beginner_dungeon_1');
      expect(progress?.current).toBe(1);  // 保持原值
    });
  });

  // ==================== 奖励领取测试 ====================
  
  describe('Reward Claim', () => {
    let state: AchievementState;

    beforeEach(() => {
      state = initializeAchievementState();
      // 完成一个成就
      updateAchievementProgress(state, 'level', 10);
    });

    it('should claim reward successfully', () => {
      const result = claimAchievementReward(state, 'beginner_level_10');
      
      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
      expect(result.rewards!.length).toBeGreaterThan(0);
      
      const progress = getAchievementProgress(state, 'beginner_level_10');
      expect(progress?.rewardClaimed).toBe(true);
    });

    it('should fail to claim uncompleted achievement', () => {
      const result = claimAchievementReward(state, 'beginner_level_20');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未完成');
    });

    it('should fail to claim twice', () => {
      claimAchievementReward(state, 'beginner_level_10');
      const result = claimAchievementReward(state, 'beginner_level_10');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已领取');
    });

    it('should add title to titles list', () => {
      // 完成 100 级成就（有称号奖励）
      updateAchievementProgress(state, 'level', 100);
      
      const result = claimAchievementReward(state, 'advanced_level_100');
      expect(result.success).toBe(true);
      
      expect(state.titles).toContain('level_100');
    });
  });

  // ==================== 称号系统测试 ====================
  
  describe('Title System', () => {
    let state: AchievementState;

    beforeEach(() => {
      state = initializeAchievementState();
      // 完成 100 级成就获得称号
      updateAchievementProgress(state, 'level', 100);
      claimAchievementReward(state, 'advanced_level_100');
    });

    it('should equip title successfully', () => {
      const result = equipTitle(state, 'level_100');
      
      expect(result.success).toBe(true);
      expect(state.equippedTitle).toBe('level_100');
    });

    it('should fail to equip unowned title', () => {
      const result = equipTitle(state, 'dungeon_king');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('未获得');
    });

    it('should unequip title', () => {
      equipTitle(state, 'level_100');
      unequipTitle(state);
      
      expect(state.equippedTitle).toBeUndefined();
    });

    it('should get title info', () => {
      const title = getTitleInfo('level_100');
      
      expect(title).toBeDefined();
      expect(title?.name).toBe('百年好合');
      expect(title?.effect).toBe('经验 +10%');
    });

    it('should get equipped title effect', () => {
      equipTitle(state, 'level_100');
      const effect = getEquippedTitleEffect(state);
      
      expect(effect).toBe('经验 +10%');
    });
  });

  // ==================== 统计查询测试 ====================
  
  describe('Statistics Query', () => {
    let state: AchievementState;

    beforeEach(() => {
      state = initializeAchievementState();
    });

    it('should count completed achievements', () => {
      expect(countCompletedAchievements(state)).toBe(0);
      
      updateAchievementProgress(state, 'level', 10);
      expect(countCompletedAchievements(state)).toBe(1);
      
      updateAchievementProgress(state, 'level', 100);
      expect(countCompletedAchievements(state)).toBeGreaterThan(1);
    });

    it('should count claimed achievements', () => {
      updateAchievementProgress(state, 'level', 10);
      expect(countClaimedAchievements(state)).toBe(0);
      
      claimAchievementReward(state, 'beginner_level_10');
      expect(countClaimedAchievements(state)).toBe(1);
    });

    it('should get achievements by category', () => {
      const beginnerAchievements = getAchievementsByCategory(AchievementCategory.Beginner);
      expect(beginnerAchievements.length).toBeGreaterThan(0);
      
      const legendAchievements = getAchievementsByCategory(AchievementCategory.Legend);
      expect(legendAchievements.length).toBeGreaterThan(0);
    });

    it('should get incomplete achievements', () => {
      const incomplete = getIncompleteAchievements(state);
      expect(incomplete.length).toBe(ACHIEVEMENTS.length);
      
      updateAchievementProgress(state, 'level', 10);
      const incompleteAfter = getIncompleteAchievements(state);
      expect(incompleteAfter.length).toBe(ACHIEVEMENTS.length - 1);
    });

    it('should get claimable achievements', () => {
      updateAchievementProgress(state, 'level', 10);
      let claimable = getClaimableAchievements(state);
      expect(claimable.length).toBe(1);
      
      claimAchievementReward(state, 'beginner_level_10');
      claimable = getClaimableAchievements(state);
      expect(claimable.length).toBe(0);
    });

    it('should calculate completion rate', () => {
      expect(getAchievementCompletionRate(state)).toBe(0);
      
      updateAchievementProgress(state, 'level', 10);
      const rate = getAchievementCompletionRate(state);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThanOrEqual(100);
    });

    it('should get progress by type', () => {
      updateAchievementProgress(state, 'level', 50);
      
      const progresses = getProgressByType(state, 'level');
      expect(progresses.length).toBeGreaterThan(0);
      
      const level10Progress = progresses.find(p => p.achievementId === 'beginner_level_10');
      expect(level10Progress).toBeDefined();
      expect(level10Progress?.current).toBe(50);
      expect(level10Progress?.target).toBe(10);
      expect(level10Progress?.completed).toBe(true);
    });
  });

  // ==================== 集成测试 ====================
  
  describe('Integration Tests', () => {
    it('should complete full achievement cycle', () => {
      const state = initializeAchievementState();
      
      // 提升等级到 100
      updateAchievementProgress(state, 'level', 100);
      
      // 检查成就是否完成
      const level100Progress = getAchievementProgress(state, 'advanced_level_100');
      expect(level100Progress?.completed).toBe(true);
      
      // 领取奖励
      const claimResult = claimAchievementReward(state, 'advanced_level_100');
      expect(claimResult.success).toBe(true);
      
      // 检查称号是否获得
      expect(state.titles).toContain('level_100');
      
      // 装备称号
      const equipResult = equipTitle(state, 'level_100');
      expect(equipResult.success).toBe(true);
      
      // 检查称号效果
      const effect = getEquippedTitleEffect(state);
      expect(effect).toBe('经验 +10%');
      
      // 检查统计
      expect(countCompletedAchievements(state)).toBeGreaterThan(0);
      expect(countClaimedAchievements(state)).toBeGreaterThan(0);
    });

    it('should handle multiple achievement types', () => {
      const state = initializeAchievementState();
      
      // 完成不同类型的成就
      updateAchievementProgress(state, 'level', 10);
      updateAchievementProgress(state, 'dungeon_clear', 1);
      updateAchievementProgress(state, 'pet_obtain', 1);
      
      // 检查所有类型都有进展
      const levelProgress = getProgressByType(state, 'level');
      const dungeonProgress = getProgressByType(state, 'dungeon_clear');
      const petProgress = getProgressByType(state, 'pet_obtain');
      
      expect(levelProgress.some(p => p.completed)).toBe(true);
      expect(dungeonProgress.some(p => p.completed)).toBe(true);
      expect(petProgress.some(p => p.completed)).toBe(true);
    });
  });
});
