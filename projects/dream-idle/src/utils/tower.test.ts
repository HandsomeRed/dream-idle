/**
 * v0.21 爬塔系统测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateTowerFloor,
  createTowerProgress,
  startTowerChallenge,
  calculateTowerChallenge,
  completeTowerChallenge,
  resetTower,
  canClaimFirstClear,
  canClaimStarReward,
  getTowerStats,
  getRecommendedFloor,
  calculateTotalRewards,
  getFloorDifficulty,
  skipClearedFloors,
  TOWER_CONFIG,
  type TowerProgress,
} from './tower';

describe('v0.21 爬塔系统', () => {
  // ==================== 关卡生成测试 ====================

  describe('关卡生成', () => {
    it('应该能生成第 1 层数据', () => {
      const floor = generateTowerFloor(1);
      expect(floor.floor).toBe(1);
      expect(floor.enemyPower).toBe(100); // baseEnemyPower
      expect(floor.enemyName).toContain('一阶');
    });

    it('敌人战力应该随层数增长', () => {
      const floor1 = generateTowerFloor(1);
      const floor10 = generateTowerFloor(10);
      const floor100 = generateTowerFloor(100);

      expect(floor10.enemyPower).toBeGreaterThan(floor1.enemyPower);
      expect(floor100.enemyPower).toBeGreaterThan(floor10.enemyPower);
    });

    it('应该能生成 1000 层', () => {
      const floor1000 = generateTowerFloor(1000);
      expect(floor1000.floor).toBe(1000);
      expect(floor1000.enemyName).toContain('六阶');
    });

    it('星级要求应该随层数变化', () => {
      const floor1 = generateTowerFloor(1);
      const floor500 = generateTowerFloor(500);

      expect(floor1.starRequirements.stars2).toBeGreaterThanOrEqual(floor500.starRequirements.stars2);
    });

    it('每 10 层应该有钻石奖励', () => {
      const floor10 = generateTowerFloor(10);
      const floor20 = generateTowerFloor(20);
      const floor15 = generateTowerFloor(15);

      expect(floor10.rewards.diamond).toBe(1);
      expect(floor20.rewards.diamond).toBe(2);
      expect(floor15.rewards.diamond).toBeUndefined();
    });
  });

  // ==================== 进度管理测试 ====================

  describe('进度管理', () => {
    it('应该能创建新进度', () => {
      const progress = createTowerProgress();
      expect(progress.maxFloor).toBe(1);
      expect(progress.currentFloor).toBe(1);
      expect(progress.floorStars).toEqual({});
      expect(progress.firstClearRewards).toEqual([]);
    });

    it('应该能开始挑战', () => {
      const progress = createTowerProgress();
      const updated = startTowerChallenge(progress);
      expect(updated.currentFloor).toBe(1);
      expect(updated.totalChallenges).toBe(1);
    });

    it('应该能指定挑战层数', () => {
      const progress = createTowerProgress();
      const updated = startTowerChallenge(progress, 5);
      expect(updated.currentFloor).toBe(5);
    });

    it('不能超过最高层数', () => {
      const progress = createTowerProgress();
      expect(() => startTowerChallenge(progress, 1001)).toThrow('已达到最高层数');
    });
  });

  // ==================== 挑战计算测试 ====================

  describe('挑战计算', () => {
    it('应该能计算胜利', () => {
      const challenge = calculateTowerChallenge(150, 1, 5, 80, 100);
      expect(challenge.isVictory).toBe(true);
      expect(challenge.floor).toBe(1);
    });

    it('应该能计算失败', () => {
      const challenge = calculateTowerChallenge(50, 1, 10, 0, 100);
      expect(challenge.isVictory).toBe(false);
    });

    it('应该能计算 1 星', () => {
      const challenge = calculateTowerChallenge(150, 1, 15, 50, 100); // 超过 10 回合，只有 1 星
      expect(challenge.stars).toBe(1);
    });

    it('应该能计算 2 星（回合数达标）', () => {
      const challenge = calculateTowerChallenge(150, 1, 3, 50, 100);
      expect(challenge.stars).toBeGreaterThanOrEqual(2);
    });

    it('应该能计算 3 星（回合数 + 高血量）', () => {
      const challenge = calculateTowerChallenge(150, 1, 2, 95, 100);
      expect(challenge.stars).toBe(3);
    });
  });

  // ==================== 完成挑战测试 ====================

  describe('完成挑战', () => {
    it('胜利应该更新进度', () => {
      const progress = createTowerProgress();
      const challenge = calculateTowerChallenge(150, 1, 5, 80, 100);
      const { progress: newProgress } = completeTowerChallenge(progress, challenge);

      expect(newProgress.maxFloor).toBe(2);
      expect(newProgress.totalWins).toBe(1);
    });

    it('失败不应该更新最高层数', () => {
      const progress = createTowerProgress();
      const challenge = calculateTowerChallenge(50, 1, 10, 0, 100);
      const { progress: newProgress } = completeTowerChallenge(progress, challenge);

      expect(newProgress.maxFloor).toBe(1);
      expect(newProgress.totalWins).toBe(0);
    });

    it('应该能获取首通奖励', () => {
      const progress = createTowerProgress();
      const challenge = calculateTowerChallenge(150, 1, 5, 80, 100);
      const { rewards } = completeTowerChallenge(progress, challenge);

      expect(rewards.firstClear).toBeDefined();
      expect(rewards.firstClear.gold).toBeGreaterThan(0);
    });

    it('首通奖励只能领取一次', () => {
      let progress = createTowerProgress();
      const challenge1 = calculateTowerChallenge(150, 1, 5, 80, 100);
      const { progress: p1 } = completeTowerChallenge(progress, challenge1);

      const challenge2 = calculateTowerChallenge(150, 1, 5, 80, 100);
      const { rewards } = completeTowerChallenge(p1, challenge2);

      expect(rewards.firstClear).toBeUndefined(); // 已经领取过
    });

    it('应该能更新星级', () => {
      let progress = createTowerProgress();
      
      // 第一次 1 星通关（15 回合，超过 10 回合要求）
      const c1 = calculateTowerChallenge(150, 1, 15, 50, 100);
      const { progress: p1 } = completeTowerChallenge(progress, c1);
      expect(p1.floorStars[1]).toBe(1);

      // 第二次 3 星通关
      const c2 = calculateTowerChallenge(150, 1, 2, 95, 100);
      const { progress: p2 } = completeTowerChallenge(p1, c2);
      expect(p2.floorStars[1]).toBe(3);
    });
  });

  // ==================== 重置测试 ====================

  describe('重置', () => {
    it('有钻石时应该能重置', () => {
      const progress = createTowerProgress();
      progress.maxFloor = 50;
      progress.firstClearRewards = [1, 2, 3];

      const { progress: newProgress, success } = resetTower(progress, true);
      expect(success).toBe(true);
      expect(newProgress.maxFloor).toBe(1);
      expect(newProgress.firstClearRewards).toEqual([]);
    });

    it('钻石不足时不能重置', () => {
      const progress = createTowerProgress();
      const { success, error } = resetTower(progress, false);

      expect(success).toBe(false);
      expect(error).toBe('钻石不足');
    });
  });

  // ==================== 奖励检查测试 ====================

  describe('奖励检查', () => {
    it('应该能检查首通奖励', () => {
      const progress = createTowerProgress();
      progress.maxFloor = 5;

      expect(canClaimFirstClear(progress, 1)).toBe(true);
      expect(canClaimFirstClear(progress, 5)).toBe(true);
      expect(canClaimFirstClear(progress, 6)).toBe(false);
    });

    it('应该能检查星级奖励', () => {
      const progress = createTowerProgress();
      progress.floorStars[1] = 2;

      expect(canClaimStarReward(progress, 1, 1)).toBe(true);
      expect(canClaimStarReward(progress, 1, 2)).toBe(true);
      expect(canClaimStarReward(progress, 1, 3)).toBe(false);
    });
  });

  // ==================== 统计测试 ====================

  describe('统计', () => {
    it('应该能获取爬塔统计', () => {
      const progress = createTowerProgress();
      progress.maxFloor = 10;
      progress.floorStars = { 1: 3, 2: 3, 3: 2, 4: 1 };
      progress.totalChallenges = 10;
      progress.totalWins = 8;

      const stats = getTowerStats(progress);
      expect(stats.totalFloors).toBe(9);
      expect(stats.totalStars).toBe(9);
      expect(stats.threeStarFloors).toBe(2);
      expect(stats.winRate).toBe(80);
    });
  });

  // ==================== 推荐层数测试 ====================

  describe('推荐层数', () => {
    it('应该能根据战力推荐层数', () => {
      const floor1 = getRecommendedFloor(100);
      const floor2 = getRecommendedFloor(500);
      const floor3 = getRecommendedFloor(10000);

      expect(floor1).toBeGreaterThanOrEqual(1);
      expect(floor2).toBeGreaterThan(floor1);
      expect(floor3).toBeGreaterThan(floor2);
    });
  });

  // ==================== 总奖励计算测试 ====================

  describe('总奖励计算', () => {
    it('应该能计算总奖励', () => {
      const progress = createTowerProgress();
      progress.firstClearRewards = [1, 2, 3];
      progress.floorStars = { 1: 3, 2: 2, 3: 1 };

      const rewards = calculateTotalRewards(progress);
      expect(rewards.totalGold).toBeGreaterThan(0);
      expect(rewards.totalExp).toBeGreaterThan(0);
    });
  });

  // ==================== 难度等级测试 ====================

  describe('难度等级', () => {
    it('应该能获取层数难度', () => {
      expect(getFloorDifficulty(1)).toBe('easy');
      expect(getFloorDifficulty(50)).toBe('easy');
      expect(getFloorDifficulty(100)).toBe('normal');
      expect(getFloorDifficulty(200)).toBe('hard');
      expect(getFloorDifficulty(400)).toBe('expert');
      expect(getFloorDifficulty(700)).toBe('master');
      expect(getFloorDifficulty(1000)).toBe('legend');
    });
  });

  // ==================== 跳过层数测试 ====================

  describe('跳过层数', () => {
    it('应该能计算可跳过层数', () => {
      const progress = createTowerProgress();
      progress.maxFloor = 20;
      progress.currentFloor = 1;

      // 高战力应该能跳过更多层
      const skipCount = skipClearedFloors(progress, 10000);
      expect(skipCount).toBeGreaterThanOrEqual(0);
      expect(skipCount).toBeLessThanOrEqual(10); // 最多 10 层
    });

    it('低战力不能跳过', () => {
      const progress = createTowerProgress();
      progress.maxFloor = 20;
      progress.currentFloor = 1;

      const skipCount = skipClearedFloors(progress, 50);
      expect(skipCount).toBe(0);
    });
  });

  // ==================== 配置测试 ====================

  describe('配置', () => {
    it('总层数应该为 1000', () => {
      expect(TOWER_CONFIG.totalFloors).toBe(1000);
    });

    it('基础敌人战力应该为 100', () => {
      expect(TOWER_CONFIG.baseEnemyPower).toBe(100);
    });

    it('应该有战力增长率', () => {
      expect(TOWER_CONFIG.powerGrowthRate).toBe(1.05);
    });

    it('重置消耗应该为 50 钻石', () => {
      expect(TOWER_CONFIG.resetCost).toBe(50);
    });

    it('应该有星级奖励配置', () => {
      expect(TOWER_CONFIG.starRewards[1]).toBeDefined();
      expect(TOWER_CONFIG.starRewards[2]).toBeDefined();
      expect(TOWER_CONFIG.starRewards[3]).toBeDefined();
    });
  });

  // ==================== 集成测试 ====================

  describe('集成测试', () => {
    it('完整的爬塔流程', () => {
      // 1. 创建进度
      let progress = createTowerProgress();

      // 2. 开始挑战第 1 层
      progress = startTowerChallenge(progress);

      // 3. 计算挑战结果（胜利）
      const challenge = calculateTowerChallenge(150, 1, 5, 80, 100);
      expect(challenge.isVictory).toBe(true);

      // 4. 完成挑战
      const { progress: newProgress, rewards } = completeTowerChallenge(progress, challenge);
      expect(newProgress.maxFloor).toBe(2);
      expect(rewards.firstClear).toBeDefined();

      // 5. 继续挑战第 2 层
      const progress2 = startTowerChallenge(newProgress, 2);
      const challenge2 = calculateTowerChallenge(200, 2, 6, 70, 100);
      const { progress: finalProgress } = completeTowerChallenge(progress2, challenge2);

      expect(finalProgress.maxFloor).toBe(3);
      expect(finalProgress.totalWins).toBe(2);
    });

    it('爬塔 - 重置 - 再爬塔', () => {
      // 爬到第 10 层
      let progress = createTowerProgress();
      progress.maxFloor = 10;
      progress.firstClearRewards = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      // 重置
      const { progress: resetProgress } = resetTower(progress, true);
      expect(resetProgress.maxFloor).toBe(1);

      // 重新爬塔
      const newProgress = startTowerChallenge(resetProgress);
      expect(newProgress.currentFloor).toBe(1);
    });
  });
});
