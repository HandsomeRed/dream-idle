/**
 * v0.22 竞技场系统测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  createArenaProgress,
  getTier,
  calculatePointsChange,
  challengeArena,
  setDefenseFormation,
  refreshDailyChallenges,
  getRankReward,
  getTierReward,
  getSeasonEndTime,
  createNewSeason,
  resetSeasonProgress,
  matchOpponents,
  getArenaStats,
  canChallenge,
  getRemainingChallenges,
  ARENA_CONFIG,
  type ArenaPlayer,
  type ArenaProgress,
} from './arena';

describe('v0.22 竞技场系统', () => {
  // ==================== 基础创建测试 ====================

  describe('基础创建', () => {
    it('应该能创建竞技场进度', () => {
      const progress = createArenaProgress('player_001', '测试玩家');
      expect(progress.playerId).toBe('player_001');
      expect(progress.points).toBe(1000);
      expect(progress.tier).toBe('bronze');
      expect(progress.dailyChallenges).toBe(0);
    });

    it('初始段位应该是青铜', () => {
      const progress = createArenaProgress('player_001', '测试玩家');
      expect(progress.tier).toBe('bronze');
    });
  });

  // ==================== 段位测试 ====================

  describe('段位系统', () => {
    it('应该能根据积分获取段位', () => {
      expect(getTier(0)).toBe('bronze');
      expect(getTier(1000)).toBe('bronze');
      expect(getTier(1200)).toBe('silver');
      expect(getTier(1500)).toBe('gold');
      expect(getTier(1800)).toBe('platinum');
      expect(getTier(2100)).toBe('diamond');
      expect(getTier(2400)).toBe('master');
      expect(getTier(2700)).toBe('legend');
      expect(getTier(3000)).toBe('legend');
    });
  });

  // ==================== 积分计算测试 ====================

  describe('积分计算', () => {
    it('胜利应该获得积分', () => {
      const change = calculatePointsChange(1000, 1000, true);
      expect(change.challengerChange).toBeGreaterThan(0);
      expect(change.defenderChange).toBeLessThan(0);
    });

    it('失败应该扣除积分', () => {
      const change = calculatePointsChange(1000, 1000, false);
      expect(change.challengerChange).toBeLessThan(0);
      expect(change.defenderChange).toBeGreaterThan(0);
    });

    it('打赢高分对手应该获得更多积分', () => {
      const change1 = calculatePointsChange(1000, 1000, true);
      const change2 = calculatePointsChange(1000, 1500, true);
      
      expect(change2.challengerChange).toBeGreaterThan(change1.challengerChange);
    });

    it('积分变化应该有上下限', () => {
      const winChange = calculatePointsChange(1000, 1000, true);
      expect(winChange.challengerChange).toBeGreaterThanOrEqual(5);
      expect(winChange.defenderChange).toBeGreaterThanOrEqual(-20);
    });
  });

  // ==================== 挑战测试 ====================

  describe('挑战系统', () => {
    it('应该能发起挑战并胜利', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      const defender: ArenaPlayer = {
        playerId: 'player_002',
        playerName: '玩家 2',
        level: 10,
        power: 1000,
        tier: 'bronze',
        points: 1000,
        rank: 50,
        defenseFormation: ['pet_1', 'pet_2', 'pet_3'],
        wins: 5,
        losses: 3,
        seasonWins: 5,
        seasonLosses: 3,
      };

      const { progress: newProgress, challenge } = challengeArena(
        progress,
        defender,
        1200,
        true,
        5
      );

      expect(newProgress.points).toBeGreaterThan(progress.points);
      expect(newProgress.wins).toBe(1);
      expect(newProgress.dailyChallenges).toBe(1);
      expect(challenge.isVictory).toBe(true);
    });

    it('应该能发起挑战并失败', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      const defender: ArenaPlayer = {
        playerId: 'player_002',
        playerName: '玩家 2',
        level: 10,
        power: 1000,
        tier: 'bronze',
        points: 1000,
        rank: 50,
        defenseFormation: [],
        wins: 5,
        losses: 3,
        seasonWins: 5,
        seasonLosses: 3,
      };

      const { progress: newProgress } = challengeArena(
        progress,
        defender,
        800,
        false,
        3
      );

      expect(newProgress.points).toBeLessThan(progress.points);
      expect(newProgress.losses).toBe(1);
    });

    it('挑战次数用尽后不能继续挑战', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.dailyChallenges = 10;

      const defender: ArenaPlayer = {
        playerId: 'player_002',
        playerName: '玩家 2',
        level: 10,
        power: 1000,
        tier: 'bronze',
        points: 1000,
        rank: 50,
        defenseFormation: [],
        wins: 0,
        losses: 0,
        seasonWins: 0,
        seasonLosses: 0,
      };

      expect(() => challengeArena(progress, defender, 1000, true, 5)).toThrow('今日挑战次数已用尽');
    });

    it('胜利后应该更新段位', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.points = 1190; // 接近白银

      const defender: ArenaPlayer = {
        playerId: 'player_002',
        playerName: '玩家 2',
        level: 10,
        power: 1000,
        tier: 'bronze',
        points: 1000,
        rank: 50,
        defenseFormation: [],
        wins: 0,
        losses: 0,
        seasonWins: 0,
        seasonLosses: 0,
      };

      // 多次胜利直到段位提升
      let currentProgress = progress;
      for (let i = 0; i < 3; i++) {
        const result = challengeArena(currentProgress, defender, 1200, true, 5);
        currentProgress = result.progress;
      }

      expect(currentProgress.tier).toBe('silver');
    });
  });

  // ==================== 防守阵容测试 ====================

  describe('防守阵容', () => {
    it('应该能设置防守阵容', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      const updated = setDefenseFormation(progress, ['pet_1', 'pet_2', 'pet_3']);
      
      expect(updated.defenseFormation).toHaveLength(3);
      expect(updated.defenseFormation).toEqual(['pet_1', 'pet_2', 'pet_3']);
    });

    it('防守阵容最多 3 只宠物', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      
      expect(() => setDefenseFormation(progress, ['pet_1', 'pet_2', 'pet_3', 'pet_4'])).toThrow('最多 3 只');
    });
  });

  // ==================== 每日刷新测试 ====================

  describe('每日刷新', () => {
    it('应该能刷新每日挑战次数', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.dailyChallenges = 5;
      progress.lastChallengeTime = Date.now() - 24 * 60 * 60 * 1000; // 24 小时前

      const refreshed = refreshDailyChallenges(progress);
      expect(refreshed.dailyChallenges).toBe(0);
    });

    it('同一天内不应该刷新', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.dailyChallenges = 5;
      progress.lastChallengeTime = Date.now();

      const refreshed = refreshDailyChallenges(progress);
      expect(refreshed.dailyChallenges).toBe(5);
    });
  });

  // ==================== 奖励测试 ====================

  describe('奖励系统', () => {
    it('应该能获取排名奖励', () => {
      const reward1 = getRankReward(1);
      const reward10 = getRankReward(10);
      const reward100 = getRankReward(100);

      expect(reward1.diamond).toBeGreaterThan(reward10.diamond);
      expect(reward10.diamond).toBeGreaterThan(reward100.diamond);
    });

    it('应该能获取段位奖励', () => {
      const bronzeReward = getTierReward('bronze');
      const goldReward = getTierReward('gold');
      const legendReward = getTierReward('legend');

      expect(legendReward?.rewards.diamond).toBeGreaterThan(goldReward?.rewards.diamond);
      expect(goldReward?.rewards.diamond).toBeGreaterThan(bronzeReward?.rewards.diamond);
    });
  });

  // ==================== 赛季测试 ====================

  describe('赛季系统', () => {
    it('应该能计算赛季结束时间', () => {
      const startTime = Date.now();
      const endTime = getSeasonEndTime(startTime);
      const expectedEnd = startTime + 30 * 24 * 60 * 60 * 1000;

      expect(endTime).toBeCloseTo(expectedEnd, 0);
    });

    it('应该能创建新赛季', () => {
      const previousPlayers: ArenaPlayer[] = [
        {
          playerId: 'player_001',
          playerName: '玩家 1',
          level: 10,
          power: 1000,
          tier: 'gold',
          points: 1500,
          rank: 1,
          defenseFormation: [],
          wins: 10,
          losses: 5,
          seasonWins: 10,
          seasonLosses: 5,
        },
      ];

      const season = createNewSeason(previousPlayers, 2);
      expect(season.seasonId).toBe(2);
      expect(season.isActive).toBe(true);
      expect(season.topPlayers).toHaveLength(1);
    });

    it('应该能重置赛季进度', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.points = 2000;
      progress.rank = 10;
      progress.wins = 50;
      progress.losses = 30;

      const resetProgress = resetSeasonProgress(progress, 2);
      expect(resetProgress.seasonId).toBe(2);
      expect(resetProgress.wins).toBe(0);
      expect(resetProgress.losses).toBe(0);
      expect(resetProgress.points).toBeGreaterThan(1000); // 继承部分积分
    });
  });

  // ==================== 匹配测试 ====================

  describe('匹配系统', () => {
    it('应该能匹配相近积分的对手', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.points = 1000;

      const allPlayers: ArenaPlayer[] = [
        { playerId: 'player_002', playerName: '玩家 2', level: 10, power: 1000, tier: 'bronze', points: 950, rank: 50, defenseFormation: [], wins: 0, losses: 0, seasonWins: 0, seasonLosses: 0 },
        { playerId: 'player_003', playerName: '玩家 3', level: 10, power: 1000, tier: 'bronze', points: 1050, rank: 51, defenseFormation: [], wins: 0, losses: 0, seasonWins: 0, seasonLosses: 0 },
        { playerId: 'player_004', playerName: '玩家 4', level: 10, power: 1000, tier: 'silver', points: 1300, rank: 30, defenseFormation: [], wins: 0, losses: 0, seasonWins: 0, seasonLosses: 0 },
      ];

      const opponents = matchOpponents(progress, allPlayers, 2);
      expect(opponents.length).toBeLessThanOrEqual(2);
      // 应该匹配到分数相近的玩家（950 或 1050，而不是 1300）
      opponents.forEach((opp) => {
        expect(opp.points).toBeLessThanOrEqual(1200);
      });
    });
  });

  // ==================== 统计测试 ====================

  describe('统计系统', () => {
    it('应该能获取竞技场统计', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.wins = 30;
      progress.losses = 20;
      progress.seasonWins = 30;
      progress.seasonLosses = 20;
      progress.battleHistory = [
        { challengerId: 'player_001', defenderId: 'player_002', challengerPower: 1000, defenderPower: 1000, isVictory: true, rounds: 5, timestamp: Date.now(), pointsGained: 20, pointsLost: 0 },
        { challengerId: 'player_001', defenderId: 'player_003', challengerPower: 1000, defenderPower: 1000, isVictory: false, rounds: 3, timestamp: Date.now(), pointsGained: 0, pointsLost: 10 },
      ];

      const stats = getArenaStats(progress);
      expect(stats.winRate).toBe(60);
      expect(stats.totalBattles).toBe(50);
      expect(stats.seasonWinRate).toBe(60);
      expect(stats.averageRounds).toBe(4);
    });
  });

  // ==================== 挑战检查测试 ====================

  describe('挑战检查', () => {
    it('应该能检查是否可以挑战', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      expect(canChallenge(progress)).toBe(true);
    });

    it('挑战次数用尽后不能挑战', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.dailyChallenges = 10;
      expect(canChallenge(progress)).toBe(false);
    });

    it('应该能获取剩余挑战次数', () => {
      const progress = createArenaProgress('player_001', '玩家 1');
      progress.dailyChallenges = 3;
      
      expect(getRemainingChallenges(progress)).toBe(7);
    });
  });

  // ==================== 配置测试 ====================

  describe('配置', () => {
    it('赛季持续时间应该为 30 天', () => {
      expect(ARENA_CONFIG.seasonDurationDays).toBe(30);
    });

    it('每日挑战次数应该为 10 次', () => {
      expect(ARENA_CONFIG.maxDailyChallenges).toBe(10);
    });

    it('基础积分应该为 1000', () => {
      expect(ARENA_CONFIG.basePoints).toBe(1000);
    });

    it('应该有 7 个段位', () => {
      expect(Object.keys(ARENA_CONFIG.tierThresholds)).toHaveLength(7);
    });

    it('应该有段位奖励配置', () => {
      expect(ARENA_CONFIG.rewards.length).toBe(7);
    });
  });

  // ==================== 集成测试 ====================

  describe('集成测试', () => {
    it('完整的竞技场流程', () => {
      // 1. 创建进度
      let progress = createArenaProgress('player_001', '玩家 1');

      // 2. 设置防守阵容
      progress = setDefenseFormation(progress, ['pet_1', 'pet_2']);

      // 3. 发起挑战
      const defender: ArenaPlayer = {
        playerId: 'player_002',
        playerName: '玩家 2',
        level: 10,
        power: 1000,
        tier: 'bronze',
        points: 1000,
        rank: 50,
        defenseFormation: ['pet_3', 'pet_4'],
        wins: 0,
        losses: 0,
        seasonWins: 0,
        seasonLosses: 0,
      };

      const { progress: newProgress, challenge } = challengeArena(
        progress,
        defender,
        1200,
        true,
        5
      );

      // 4. 验证结果
      expect(newProgress.points).toBeGreaterThan(progress.points);
      expect(newProgress.wins).toBe(1);
      expect(newProgress.dailyChallenges).toBe(1);
      expect(challenge.isVictory).toBe(true);

      // 5. 检查剩余挑战次数
      expect(getRemainingChallenges(newProgress)).toBe(9);

      // 6. 获取统计
      const stats = getArenaStats(newProgress);
      expect(stats.winRate).toBe(100);
    });

    it('多次挑战提升段位', () => {
      let progress = createArenaProgress('player_001', '玩家 1');
      progress.points = 1150; // 接近白银

      const defender: ArenaPlayer = {
        playerId: 'player_002',
        playerName: '玩家 2',
        level: 10,
        power: 1000,
        tier: 'bronze',
        points: 1000,
        rank: 50,
        defenseFormation: [],
        wins: 0,
        losses: 0,
        seasonWins: 0,
        seasonLosses: 0,
      };

      // 连续胜利直到达到白银
      let wins = 0;
      while (progress.tier !== 'silver' && wins < 10) {
        const result = challengeArena(progress, defender, 1200, true, 5);
        progress = result.progress;
        wins++;
      }

      expect(progress.tier).toBe('silver');
      expect(progress.points).toBeGreaterThanOrEqual(1200);
    });
  });
});
