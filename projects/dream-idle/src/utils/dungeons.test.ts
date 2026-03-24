/**
 * Dungeon System Tests - v0.29
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  DungeonDifficulty,
  DungeonType,
  RewardType,
  Dungeon,
  DungeonState,
  DungeonProgress,
  STAMINA_COSTS,
  RECOMMENDED_POWER,
  MAX_DAILY_ATTEMPTS,
  MAX_STAMINA,
  STAMINA_RECOVER_RATE,
  generateDungeons,
  recoverStamina,
  checkStamina,
  consumeStamina,
  checkDailyAttempts,
  consumeDailyAttempt,
  resetDailyAttempts,
  calculateWinRate,
  calculateStars,
  generateRewards,
  challengeDungeon,
  canSweep,
  sweepDungeon,
  claimFirstClearReward,
  getDungeonProgress,
  countClearedDungeons,
  countThreeStarDungeons,
} from './dungeons';

describe('Dungeon System - v0.29', () => {
  
  // ==================== 副本生成测试 ====================
  
  describe('Dungeon Generation', () => {
    it('should generate all dungeon combinations', () => {
      const dungeons = generateDungeons();
      
      // 5 类型 × 3 难度 = 15 个副本
      expect(dungeons).toHaveLength(15);
      
      // 检查所有类型都存在
      const types = new Set(dungeons.map(d => d.type));
      expect(types.size).toBe(5);
      
      // 检查所有难度都存在
      const difficulties = new Set(dungeons.map(d => d.difficulty));
      expect(difficulties.size).toBe(3);
    });

    it('should have correct difficulty scaling', () => {
      const dungeons = generateDungeons();
      
      const easyDungeon = dungeons.find(d => d.difficulty === DungeonDifficulty.Easy)!;
      const hardDungeon = dungeons.find(d => d.difficulty === DungeonDifficulty.Hard)!;
      
      expect(hardDungeon.requiredLevel).toBeGreaterThan(easyDungeon.requiredLevel);
      expect(hardDungeon.staminaCost).toBeGreaterThan(easyDungeon.staminaCost);
      expect(hardDungeon.recommendedPower).toBeGreaterThan(easyDungeon.recommendedPower);
    });

    it('should have correct stamina costs', () => {
      expect(STAMINA_COSTS[DungeonDifficulty.Easy]).toBe(5);
      expect(STAMINA_COSTS[DungeonDifficulty.Normal]).toBe(10);
      expect(STAMINA_COSTS[DungeonDifficulty.Hard]).toBe(15);
    });

    it('should have correct recommended power', () => {
      expect(RECOMMENDED_POWER[DungeonDifficulty.Easy]).toBe(500);
      expect(RECOMMENDED_POWER[DungeonDifficulty.Normal]).toBe(2000);
      expect(RECOMMENDED_POWER[DungeonDifficulty.Hard]).toBe(5000);
    });
  });

  // ==================== 体力系统测试 ====================
  
  describe('Stamina System', () => {
    let state: DungeonState;

    beforeEach(() => {
      state = {
        stamina: 50,
        maxStamina: MAX_STAMINA,
        staminaRecoverRate: STAMINA_RECOVER_RATE,
        dailyAttempts: MAX_DAILY_ATTEMPTS,
        maxDailyAttempts: MAX_DAILY_ATTEMPTS,
        progresses: [],
        sweepTickets: 5,
      };
    });

    it('should recover stamina over time', () => {
      recoverStamina(state, 30);  // 30 分钟
      expect(state.stamina).toBe(80);  // 50 + 30
    });

    it('should not exceed max stamina', () => {
      state.stamina = 95;
      recoverStamina(state, 30);  // Would be 125, but capped at 100
      expect(state.stamina).toBe(100);
    });

    it('should check stamina correctly', () => {
      expect(checkStamina(state, 50)).toBe(true);
      expect(checkStamina(state, 60)).toBe(false);
    });

    it('should consume stamina', () => {
      const success = consumeStamina(state, 30);
      expect(success).toBe(true);
      expect(state.stamina).toBe(20);
    });

    it('should fail to consume insufficient stamina', () => {
      const success = consumeStamina(state, 60);
      expect(success).toBe(false);
      expect(state.stamina).toBe(50);  // Unchanged
    });
  });

  // ==================== 每日挑战次数测试 ====================
  
  describe('Daily Attempts System', () => {
    let state: DungeonState;

    beforeEach(() => {
      state = {
        stamina: 100,
        maxStamina: MAX_STAMINA,
        staminaRecoverRate: STAMINA_RECOVER_RATE,
        dailyAttempts: 5,
        maxDailyAttempts: MAX_DAILY_ATTEMPTS,
        progresses: [],
        sweepTickets: 5,
      };
    });

    it('should check daily attempts correctly', () => {
      expect(checkDailyAttempts(state)).toBe(true);
      
      state.dailyAttempts = 0;
      expect(checkDailyAttempts(state)).toBe(false);
    });

    it('should consume daily attempt', () => {
      const success = consumeDailyAttempt(state);
      expect(success).toBe(true);
      expect(state.dailyAttempts).toBe(4);
    });

    it('should fail to consume when no attempts left', () => {
      state.dailyAttempts = 0;
      const success = consumeDailyAttempt(state);
      expect(success).toBe(false);
      expect(state.dailyAttempts).toBe(0);
    });

    it('should reset daily attempts', () => {
      state.dailyAttempts = 3;
      resetDailyAttempts(state);
      expect(state.dailyAttempts).toBe(MAX_DAILY_ATTEMPTS);
    });
  });

  // ==================== 胜率计算测试 ====================
  
  describe('Win Rate Calculation', () => {
    it('should calculate win rate based on power ratio', () => {
      // 战力达到推荐值，必胜
      expect(calculateWinRate(5000, 5000)).toBe(1.0);
      
      // 战力低于推荐值 30%，几乎不可能赢
      expect(calculateWinRate(150, 500)).toBeCloseTo(0.05, 2);
      
      // 战力为推荐值 50%，约 45% 胜率
      const rate = calculateWinRate(1000, 2000);
      expect(rate).toBeGreaterThan(0.3);
      expect(rate).toBeLessThan(0.6);
    });

    it('should return low win rate for very low power', () => {
      expect(calculateWinRate(100, 5000)).toBe(0.05);
    });

    it('should return 100% win rate for high power', () => {
      expect(calculateWinRate(10000, 5000)).toBe(1.0);
    });
  });

  // ==================== 星级评价测试 ====================
  
  describe('Star Rating', () => {
    it('should calculate stars based on power ratio', () => {
      // 战力达到推荐值 100% → 3 星
      expect(calculateStars(5000, 5000)).toBe(3);
      
      // 战力达到推荐值 80% → 2 星
      expect(calculateStars(4000, 5000)).toBe(2);
      
      // 战力达到推荐值 50% → 1 星
      expect(calculateStars(2500, 5000)).toBe(1);
      
      // 战力低于 50% → 0 星
      expect(calculateStars(2000, 5000)).toBe(0);
    });
  });

  // ==================== 奖励生成测试 ====================
  
  describe('Reward Generation', () => {
    it('should generate base rewards', () => {
      const baseRewards = [{ type: RewardType.Gold, amount: 1000 }];
      const dropRates = [];
      
      const rewards = generateRewards(baseRewards, dropRates, 1);
      
      expect(rewards).toHaveLength(1);
      expect(rewards[0].type).toBe(RewardType.Gold);
      expect(rewards[0].amount).toBe(1000);
    });

    it('should apply star bonus to rewards', () => {
      const baseRewards = [{ type: RewardType.Gold, amount: 1000 }];
      const dropRates = [];
      
      // 3 星应该有 +50% 加成
      const rewards3Star = generateRewards(baseRewards, dropRates, 3);
      expect(rewards3Star[0].amount).toBe(1500);
      
      // 1 星没有加成
      const rewards1Star = generateRewards(baseRewards, dropRates, 1);
      expect(rewards1Star[0].amount).toBe(1000);
    });

    it('should generate random drops', () => {
      const baseRewards = [{ type: RewardType.Gold, amount: 1000 }];
      const dropRates = [
        { item: 'rare_item', type: RewardType.Material, chance: 1.0, minAmount: 5, maxAmount: 10 }
      ];
      
      const rewards = generateRewards(baseRewards, dropRates, 1);
      
      expect(rewards.length).toBeGreaterThan(1);
      const drop = rewards.find(r => r.item === 'rare_item');
      expect(drop).toBeDefined();
      expect(drop!.amount).toBeGreaterThanOrEqual(5);
      expect(drop!.amount).toBeLessThanOrEqual(10);
    });
  });

  // ==================== 副本挑战测试 ====================
  
  describe('Dungeon Challenge', () => {
    let state: DungeonState;
    let dungeon: Dungeon;

    beforeEach(() => {
      state = {
        stamina: 100,
        maxStamina: MAX_STAMINA,
        staminaRecoverRate: STAMINA_RECOVER_RATE,
        dailyAttempts: MAX_DAILY_ATTEMPTS,
        maxDailyAttempts: MAX_DAILY_ATTEMPTS,
        progresses: [],
        sweepTickets: 5,
      };
      
      dungeon = {
        id: 'test_dungeon',
        name: '测试副本',
        type: DungeonType.Gold,
        difficulty: DungeonDifficulty.Easy,
        requiredLevel: 10,
        staminaCost: 5,
        recommendedPower: 500,
        baseRewards: [{ type: RewardType.Gold, amount: 1000 }],
        firstClearReward: { type: RewardType.Diamond, amount: 50 },
        dropRates: [],
      };
    });

    it('should fail challenge if level too low', () => {
      const result = challengeDungeon(state, dungeon, 500, 5);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('等级不足');
    });

    it('should fail challenge if insufficient stamina', () => {
      state.stamina = 3;
      const result = challengeDungeon(state, dungeon, 500, 15);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('体力不足');
    });

    it('should fail challenge if no daily attempts left', () => {
      state.dailyAttempts = 0;
      const result = challengeDungeon(state, dungeon, 500, 15);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('每日挑战次数');
    });

    it('should succeed challenge with high power', () => {
      const result = challengeDungeon(state, dungeon, 1000, 15);
      
      expect(result.success).toBe(true);
      expect(result.stars).toBeGreaterThan(0);
      expect(state.stamina).toBe(95);  // 100 - 5
      expect(state.dailyAttempts).toBe(9);  // 10 - 1
    });

    it('should grant first clear reward', () => {
      const result = challengeDungeon(state, dungeon, 1000, 15);
      
      expect(result.firstClearBonus).toBeDefined();
      expect(result.firstClearBonus!.type).toBe(RewardType.Diamond);
    });

    it('should not grant first clear reward twice', () => {
      // First challenge
      challengeDungeon(state, dungeon, 1000, 15);
      
      // Reset stamina and attempts for second challenge
      state.stamina = 100;
      state.dailyAttempts = 10;
      
      // Second challenge
      const result = challengeDungeon(state, dungeon, 1000, 15);
      
      expect(result.firstClearBonus).toBeUndefined();
    });

    it('should update dungeon progress', () => {
      challengeDungeon(state, dungeon, 1000, 15);
      
      const progress = getDungeonProgress(state, dungeon.id);
      expect(progress).toBeDefined();
      expect(progress!.stars).toBeGreaterThan(0);
      expect(progress!.firstClearRewardClaimed).toBe(true);
    });
  });

  // ==================== 扫荡系统测试 ====================
  
  describe('Sweep System', () => {
    let state: DungeonState;
    let dungeon: Dungeon;

    beforeEach(() => {
      state = {
        stamina: 100,
        maxStamina: MAX_STAMINA,
        staminaRecoverRate: STAMINA_RECOVER_RATE,
        dailyAttempts: MAX_DAILY_ATTEMPTS,
        maxDailyAttempts: MAX_DAILY_ATTEMPTS,
        progresses: [],
        sweepTickets: 5,
      };
      
      dungeon = {
        id: 'test_dungeon',
        name: '测试副本',
        type: DungeonType.Gold,
        difficulty: DungeonDifficulty.Easy,
        requiredLevel: 10,
        staminaCost: 5,
        recommendedPower: 500,
        baseRewards: [{ type: RewardType.Gold, amount: 1000 }],
        firstClearReward: { type: RewardType.Diamond, amount: 50 },
        dropRates: [],
      };
    });

    it('should not allow sweep without 3-star clear', () => {
      state.progresses = [{
        dungeonId: dungeon.id,
        stars: 2,
        firstClearRewardClaimed: true,
      }];
      
      const result = canSweep(state, dungeon, 15);
      
      expect(result.can).toBe(false);
      expect(result.reason).toContain('3 星');
    });

    it('should not allow sweep without sweep tickets', () => {
      state.progresses = [{
        dungeonId: dungeon.id,
        stars: 3,
        firstClearRewardClaimed: true,
      }];
      state.sweepTickets = 0;
      
      const result = canSweep(state, dungeon, 15);
      
      expect(result.can).toBe(false);
      expect(result.reason).toContain('扫荡券');
    });

    it('should allow sweep with 3-star clear and tickets', () => {
      state.progresses = [{
        dungeonId: dungeon.id,
        stars: 3,
        firstClearRewardClaimed: true,
      }];
      
      const result = canSweep(state, dungeon, 15);
      
      expect(result.can).toBe(true);
    });

    it('should sweep successfully', () => {
      state.progresses = [{
        dungeonId: dungeon.id,
        stars: 3,
        firstClearRewardClaimed: true,
      }];
      
      const result = sweepDungeon(state, dungeon, 3);
      
      expect(result.success).toBe(true);
      expect(result.times).toBe(3);
      expect(state.sweepTickets).toBe(2);  // 5 - 3
      expect(state.dailyAttempts).toBe(7);  // 10 - 3
      expect(result.totalRewards.length).toBeGreaterThan(0);
    });

    it('should limit sweep by tickets and attempts', () => {
      state.progresses = [{
        dungeonId: dungeon.id,
        stars: 3,
        firstClearRewardClaimed: true,
      }];
      state.sweepTickets = 2;
      state.dailyAttempts = 1;
      
      const result = sweepDungeon(state, dungeon, 10);
      
      expect(result.times).toBe(1);  // Limited by daily attempts
    });
  });

  // ==================== 首通奖励领取测试 ====================
  
  describe('First Clear Reward Claim', () => {
    let state: DungeonState;
    let dungeon: Dungeon;

    beforeEach(() => {
      state = {
        stamina: 100,
        maxStamina: MAX_STAMINA,
        staminaRecoverRate: STAMINA_RECOVER_RATE,
        dailyAttempts: MAX_DAILY_ATTEMPTS,
        maxDailyAttempts: MAX_DAILY_ATTEMPTS,
        progresses: [],
        sweepTickets: 5,
      };
      
      dungeon = {
        id: 'test_dungeon',
        name: '测试副本',
        type: DungeonType.Gold,
        difficulty: DungeonDifficulty.Easy,
        requiredLevel: 10,
        staminaCost: 5,
        recommendedPower: 500,
        baseRewards: [{ type: RewardType.Gold, amount: 1000 }],
        firstClearReward: { type: RewardType.Diamond, amount: 50 },
        dropRates: [],
      };
    });

    it('should fail to claim if not cleared', () => {
      const result = claimFirstClearReward(state, dungeon);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('尚未通关');
    });

    it('should fail to claim if already claimed', () => {
      state.progresses = [{
        dungeonId: dungeon.id,
        stars: 3,
        firstClearRewardClaimed: true,
      }];
      
      const result = claimFirstClearReward(state, dungeon);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已领取');
    });

    it('should successfully claim first clear reward', () => {
      state.progresses = [{
        dungeonId: dungeon.id,
        stars: 3,
        firstClearRewardClaimed: false,
      }];
      
      const result = claimFirstClearReward(state, dungeon);
      
      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
      expect(result.reward!.type).toBe(RewardType.Diamond);
    });
  });

  // ==================== 进度统计测试 ====================
  
  describe('Progress Statistics', () => {
    let state: DungeonState;

    beforeEach(() => {
      state = {
        stamina: 100,
        maxStamina: MAX_STAMINA,
        staminaRecoverRate: STAMINA_RECOVER_RATE,
        dailyAttempts: MAX_DAILY_ATTEMPTS,
        maxDailyAttempts: MAX_DAILY_ATTEMPTS,
        progresses: [
          { dungeonId: '1', stars: 3, firstClearRewardClaimed: true },
          { dungeonId: '2', stars: 2, firstClearRewardClaimed: true },
          { dungeonId: '3', stars: 3, firstClearRewardClaimed: true },
          { dungeonId: '4', stars: 0, firstClearRewardClaimed: false },
        ],
        sweepTickets: 5,
      };
    });

    it('should count cleared dungeons', () => {
      const count = countClearedDungeons(state);
      expect(count).toBe(3);  // Dungeons 1, 2, 3 have stars > 0
    });

    it('should count 3-star dungeons', () => {
      const count = countThreeStarDungeons(state);
      expect(count).toBe(2);  // Dungeons 1 and 3 have 3 stars
    });
  });

  // ==================== 集成测试 ====================
  
  describe('Integration Tests', () => {
    it('should complete full dungeon challenge cycle', () => {
      const state: DungeonState = {
        stamina: 100,
        maxStamina: MAX_STAMINA,
        staminaRecoverRate: STAMINA_RECOVER_RATE,
        dailyAttempts: MAX_DAILY_ATTEMPTS,
        maxDailyAttempts: MAX_DAILY_ATTEMPTS,
        progresses: [],
        sweepTickets: 5,
      };
      
      const dungeons = generateDungeons();
      const easyDungeon = dungeons.find(d => d.difficulty === DungeonDifficulty.Easy)!;
      
      // Challenge multiple times
      let successes = 0;
      for (let i = 0; i < 5; i++) {
        const result = challengeDungeon(state, easyDungeon, 1000, 15);
        if (result.success) successes++;
      }
      
      expect(successes).toBeGreaterThan(0);
      expect(state.stamina).toBeLessThan(100);
      expect(state.dailyAttempts).toBeLessThan(10);
    });

    it('should integrate sweep after challenge', () => {
      const state: DungeonState = {
        stamina: 100,
        maxStamina: MAX_STAMINA,
        staminaRecoverRate: STAMINA_RECOVER_RATE,
        dailyAttempts: MAX_DAILY_ATTEMPTS,
        maxDailyAttempts: MAX_DAILY_ATTEMPTS,
        progresses: [],
        sweepTickets: 5,
      };
      
      const dungeon: Dungeon = {
        id: 'test_dungeon',
        name: '测试副本',
        type: DungeonType.Gold,
        difficulty: DungeonDifficulty.Easy,
        requiredLevel: 10,
        staminaCost: 5,
        recommendedPower: 500,
        baseRewards: [{ type: RewardType.Gold, amount: 1000 }],
        firstClearReward: { type: RewardType.Diamond, amount: 50 },
        dropRates: [],
      };
      
      // Challenge with high power to get 3 stars
      challengeDungeon(state, dungeon, 5000, 15);
      
      // Now should be able to sweep
      const sweepResult = sweepDungeon(state, dungeon, 2);
      
      expect(sweepResult.success).toBe(true);
      expect(sweepResult.times).toBe(2);
    });
  });
});
