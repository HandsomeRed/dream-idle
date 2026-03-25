// 排行榜赛季系统测试 - v0.69

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  TIER_ORDER, TIER_NAMES, TIER_COLORS, DEFAULT_SEASON, SEASON_REWARDS,
  createRankedPlayer,
  calculateTier,
  calculateEloChange,
  recordMatch,
  findMatch,
  getWinRate,
  isInPlacements,
  getPlacementProgress,
  getSeasonReward,
  claimSeasonReward,
  resetSeason,
  sortLeaderboard,
  getPlayerRank,
  getRankedStats,
  getTierDisplayName,
  exportRankedData,
  importRankedData,
  type RankedPlayer,
} from './rankedSeason';

describe('排行榜赛季系统 v0.69', () => {
  let player: RankedPlayer;

  beforeEach(() => {
    player = createRankedPlayer('p1', '测试玩家');
  });

  // ==================== 初始化 ====================
  describe('初始化', () => {
    it('创建初始玩家', () => {
      expect(player.playerId).toBe('p1');
      expect(player.rating).toBe(1000);
      expect(player.tier).toBe('bronze');
      expect(player.wins).toBe(0);
      expect(player.losses).toBe(0);
    });

    it('初始应在定位赛中', () => {
      expect(isInPlacements(player)).toBe(true);
    });

    it('定位赛进度', () => {
      const prog = getPlacementProgress(player);
      expect(prog.completed).toBe(0);
      expect(prog.total).toBe(10);
      expect(prog.remaining).toBe(10);
    });
  });

  // ==================== 段位计算 ====================
  describe('段位计算', () => {
    it('1000分应为青铜', () => {
      const { tier } = calculateTier(1000);
      expect(tier).toBe('bronze');
    });

    it('1100分应为白银', () => {
      const { tier } = calculateTier(1100);
      expect(tier).toBe('silver');
    });

    it('1500分应为铂金', () => {
      const { tier } = calculateTier(1500);
      expect(tier).toBe('platinum');
    });

    it('2100分应为传说', () => {
      const { tier } = calculateTier(2100);
      expect(tier).toBe('legend');
    });

    it('0分应为青铜', () => {
      const { tier } = calculateTier(0);
      expect(tier).toBe('bronze');
    });

    it('子级应在1-3之间', () => {
      for (let r = 0; r <= 2500; r += 100) {
        const { division } = calculateTier(r);
        expect(division).toBeGreaterThanOrEqual(1);
        expect(division).toBeLessThanOrEqual(3);
      }
    });
  });

  // ==================== ELO计算 ====================
  describe('ELO计算', () => {
    it('赢高分对手应获得更多分', () => {
      const changeHigh = calculateEloChange(1000, 1200, true, 0);
      const changeLow = calculateEloChange(1000, 800, true, 0);
      expect(changeHigh).toBeGreaterThan(changeLow);
    });

    it('输给低分对手应扣更多分', () => {
      const changeLow = calculateEloChange(1000, 800, false, 0);
      const changeHigh = calculateEloChange(1000, 1200, false, 0);
      expect(changeLow).toBeLessThan(changeHigh); // both negative, low is more negative
    });

    it('赢应得正分', () => {
      const change = calculateEloChange(1000, 1000, true, 0);
      expect(change).toBeGreaterThan(0);
    });

    it('输应得负分', () => {
      const change = calculateEloChange(1000, 1000, false, 0);
      expect(change).toBeLessThan(0);
    });

    it('连胜3+应有额外加分', () => {
      const normal = calculateEloChange(1000, 1000, true, 0);
      const streak = calculateEloChange(1000, 1000, true, 3);
      expect(streak).toBeGreaterThan(normal);
    });

    it('最低变化应为±5', () => {
      const win = calculateEloChange(2000, 500, true, 0);
      const loss = calculateEloChange(500, 2000, false, 0);
      expect(win).toBeGreaterThanOrEqual(5);
      expect(loss).toBeLessThanOrEqual(-5);
    });
  });

  // ==================== 对局记录 ====================
  describe('对局记录', () => {
    it('胜利应增加分数和胜场', () => {
      const after = recordMatch(player, 'op1', 'Opponent', 1000, true);
      expect(after.rating).toBeGreaterThan(player.rating);
      expect(after.wins).toBe(1);
      expect(after.streak).toBe(1);
    });

    it('失败应减少分数和增加败场', () => {
      const after = recordMatch(player, 'op1', 'Opponent', 1000, false);
      expect(after.rating).toBeLessThan(player.rating);
      expect(after.losses).toBe(1);
      expect(after.streak).toBe(-1);
    });

    it('连胜应累计', () => {
      let p = player;
      p = recordMatch(p, 'op1', 'A', 1000, true);
      p = recordMatch(p, 'op2', 'B', 1000, true);
      p = recordMatch(p, 'op3', 'C', 1000, true);
      expect(p.streak).toBe(3);
    });

    it('连败应累计', () => {
      let p = player;
      p = recordMatch(p, 'op1', 'A', 1000, false);
      p = recordMatch(p, 'op2', 'B', 1000, false);
      expect(p.streak).toBe(-2);
    });

    it('连胜被打断', () => {
      let p = player;
      p = recordMatch(p, 'op1', 'A', 1000, true);
      p = recordMatch(p, 'op2', 'B', 1000, true);
      p = recordMatch(p, 'op3', 'C', 1000, false);
      expect(p.streak).toBe(-1);
    });

    it('最佳分数应更新', () => {
      let p = player;
      p = recordMatch(p, 'op1', 'A', 1000, true);
      expect(p.bestRating).toBeGreaterThanOrEqual(p.rating);
    });

    it('历史记录应限制50条', () => {
      let p = player;
      for (let i = 0; i < 55; i++) {
        p = recordMatch(p, `op${i}`, `P${i}`, 1000, true);
      }
      expect(p.matchHistory.length).toBeLessThanOrEqual(50);
    });

    it('分数不应低于0', () => {
      let p = createRankedPlayer('low', 'LowPlayer');
      p.rating = 10;
      p = recordMatch(p, 'op1', 'Strong', 2000, false);
      expect(p.rating).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== 匹配系统 ====================
  describe('匹配系统', () => {
    it('应匹配分数相近的对手', () => {
      const pool = [
        createRankedPlayer('p2', 'Near'),
        createRankedPlayer('p3', 'Far'),
      ];
      pool[0].rating = 1050;
      pool[1].rating = 1500;
      const match = findMatch(player, pool);
      expect(match!.playerId).toBe('p2');
    });

    it('超出范围应返回null', () => {
      const pool = [createRankedPlayer('p2', 'Far')];
      pool[0].rating = 2000;
      const match = findMatch(player, pool, 200);
      expect(match).toBeNull();
    });

    it('不应匹配自己', () => {
      const pool = [player, createRankedPlayer('p2', 'Other')];
      pool[1].rating = 1000;
      const match = findMatch(player, pool);
      expect(match!.playerId).toBe('p2');
    });

    it('空池应返回null', () => {
      expect(findMatch(player, [])).toBeNull();
    });
  });

  // ==================== 统计 ====================
  describe('统计', () => {
    it('胜率计算', () => {
      player.wins = 7;
      player.losses = 3;
      expect(getWinRate(player)).toBe(70);
    });

    it('无对局胜率为0', () => {
      expect(getWinRate(player)).toBe(0);
    });

    it('排位统计', () => {
      player.wins = 5;
      player.losses = 5;
      const stats = getRankedStats(player);
      expect(stats.winRate).toBe(50);
      expect(stats.totalMatches).toBe(10);
      expect(stats.isPlacement).toBe(false);
    });
  });

  // ==================== 赛季奖励 ====================
  describe('赛季奖励', () => {
    it('青铜应有基础奖励', () => {
      const reward = getSeasonReward(player);
      expect(reward).toBeDefined();
      expect(reward!.tier).toBe('bronze');
    });

    it('高段位应有更好奖励', () => {
      player.bestTier = 'diamond';
      const reward = getSeasonReward(player);
      expect(reward!.tier).toBe('diamond');
      expect(reward!.diamond).toBeGreaterThan(50);
    });

    it('领取奖励', () => {
      const { player: p, reward } = claimSeasonReward(player);
      expect(reward).toBeDefined();
      expect(p.seasonRewardClaimed).toBe(true);
    });

    it('重复领取应失败', () => {
      const { player: p1 } = claimSeasonReward(player);
      const { reward, error } = claimSeasonReward(p1);
      expect(reward).toBeNull();
      expect(error).toContain('已领取');
    });
  });

  // ==================== 赛季重置 ====================
  describe('赛季重置', () => {
    it('软重置分数', () => {
      player.rating = 1600;
      const reset = resetSeason(player);
      expect(reset.rating).toBe(1300); // (1600+1000)/2
    });

    it('重置应清零胜败', () => {
      player.wins = 50;
      player.losses = 30;
      const reset = resetSeason(player);
      expect(reset.wins).toBe(0);
      expect(reset.losses).toBe(0);
    });

    it('重置应清空历史', () => {
      player.matchHistory = [{ opponentId: 'x', opponentName: 'X', opponentRating: 1000, won: true, ratingChange: 10, timestamp: 0 }];
      const reset = resetSeason(player);
      expect(reset.matchHistory).toHaveLength(0);
    });

    it('重置应清除奖励领取', () => {
      player.seasonRewardClaimed = true;
      const reset = resetSeason(player);
      expect(reset.seasonRewardClaimed).toBe(false);
    });
  });

  // ==================== 排行榜 ====================
  describe('排行榜', () => {
    it('按分数降序排列', () => {
      const players = [
        { ...player, playerId: 'a', rating: 1200 },
        { ...player, playerId: 'b', rating: 1500 },
        { ...player, playerId: 'c', rating: 1000 },
      ];
      const sorted = sortLeaderboard(players as RankedPlayer[]);
      expect(sorted[0].playerId).toBe('b');
      expect(sorted[2].playerId).toBe('c');
    });

    it('获取玩家排名', () => {
      const players = [
        { ...player, playerId: 'a', rating: 1500 },
        { ...player, playerId: 'p1', rating: 1200 },
        { ...player, playerId: 'c', rating: 1000 },
      ];
      const rank = getPlayerRank(player, players as RankedPlayer[]);
      expect(rank).toBe(2);
    });
  });

  // ==================== 工具函数 ====================
  describe('工具函数', () => {
    it('段位显示名称（含子级）', () => {
      expect(getTierDisplayName('gold', 1)).toBe('黄金 I');
      expect(getTierDisplayName('silver', 3)).toBe('白银 III');
    });

    it('大师/传说不显示子级', () => {
      expect(getTierDisplayName('master', 1)).toBe('大师');
      expect(getTierDisplayName('legend', 1)).toBe('传说');
    });

    it('段位颜色应存在', () => {
      Object.keys(TIER_ORDER).forEach(tier => {
        expect(TIER_COLORS[tier as keyof typeof TIER_COLORS]).toBeDefined();
      });
    });
  });

  // ==================== 数据导出导入 ====================
  describe('数据导出导入', () => {
    it('导出还原', () => {
      player.rating = 1500;
      player.wins = 10;
      const json = exportRankedData(player);
      const imported = importRankedData(json);
      expect(imported!.rating).toBe(1500);
      expect(imported!.wins).toBe(10);
    });

    it('无效数据返回null', () => {
      expect(importRankedData('bad')).toBeNull();
      expect(importRankedData('{}')).toBeNull();
    });
  });
});
